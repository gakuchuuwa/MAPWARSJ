/**
 * 叛军旗号静态审计（AGENTS.md §10.3）
 * 运行: npx tsx scratch/audit_rebel_flags.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const camPath = path.join(root, 'src/assets/CityAssetManager.ts');
const injPath = path.join(root, 'src/assets/FlagStyleInjector.ts');
const rebelConstPath = path.join(root, 'src/assets/RebelFlagConstants.ts');
const gameAppPath = path.join(root, 'src/app/GameApp.ts');
const flagClassPath = path.join(root, 'src/systems/territory/TerritoryFlagClass.ts');

const cam = fs.readFileSync(camPath, 'utf8');
const inj = fs.readFileSync(injPath, 'utf8');
const rebelConst = fs.readFileSync(rebelConstPath, 'utf8');
const gameApp = fs.readFileSync(gameAppPath, 'utf8');
const flagClass = fs.readFileSync(flagClassPath, 'utf8');

const errors = [];
const warnings = [];

function req(cond, msg) {
    if (!cond) errors.push(msg);
}

function warn(cond, msg) {
    if (!cond) warnings.push(msg);
}

// ── 常量 7–58 共 52 面 ──
const minM = rebelConst.match(/PANJUN_REBEL_FLAG_ID_MIN\s*=\s*(\d+)/);
const maxM = rebelConst.match(/PANJUN_REBEL_FLAG_ID_MAX\s*=\s*(\d+)/);
const minId = Number(minM?.[1]);
const maxId = Number(maxM?.[1]);
const count = maxId - minId + 1;
req(minId === 7 && maxId === 58 && count === 52, `素材编号应为 7–58 共 52 面，实际 ${minId}–${maxId} = ${count}`);

req(!cam.match(/panjunRebelMax\s*[:=]/), 'CityAssetManager 不得出现 panjunRebelMax 参数');
req(!cam.match(/Promise\.all\s*\([^)]*chromaKey/), '禁止 Promise.all 并行 chromaKey');

// ── 启动顺序：await preloadRebelFlagsForBoot 在 renderCities 前 ──
const bootIdx = gameApp.indexOf('preloadRebelFlagsForBoot');
const renderIdx = gameApp.indexOf('renderCitiesOnly');
req(bootIdx >= 0 && renderIdx > bootIdx, 'GameApp: preloadRebelFlagsForBoot 须在 renderCitiesOnly 之前');

// ── 随机逻辑 ──
req(cam.includes('Math.floor(Math.random() * len)'), 'getProcessedRebelFlagIndex 须用 Math.random');
req(!cam.match(/hash\s*\(\s*cityId\s*\)/), '不得用 hash(cityId) 固定叛军下标');
req(cam.includes('resetRebelFlagAssignments()'), '须有 resetRebelFlagAssignments');
req(
    /preloadRebelFlagsForBoot[\s\S]{0,120}resetRebelFlagAssignments\(\)/.test(cam),
    'preloadRebelFlagsForBoot 须先 resetRebelFlagAssignments',
);

// reset 须在 early return 之前
const preloadBlock = cam.match(
    /public static async preloadRebelFlagsForBoot\(\)[^{]+\{([\s\S]*?)\n    \}/,
)?.[1];
if (preloadBlock) {
    const resetPos = preloadBlock.indexOf('resetRebelFlagAssignments');
    const earlyPos = preloadBlock.indexOf('panjunRebelsFullyLoaded) return');
    req(resetPos >= 0 && (earlyPos < 0 || resetPos < earlyPos), 'reset 须在 panjunRebelsFullyLoaded early return 之前');
} else {
    errors.push('无法解析 preloadRebelFlagsForBoot');
}

// ── CSS 注入：精确规则，禁止 includes(selector) ──
req(inj.includes('setRebelFlagStyleRule'), 'FlagStyleInjector 须有 setRebelFlagStyleRule');
req(cam.includes('setRebelFlagStyleRule'), 'CityAssetManager 须调用 setRebelFlagStyleRule');
req(!cam.includes('textContent?.includes(selector)'), 'appendRebelFlagStyleRules 不得用 includes(selector) 误判');

// ── panjun 不走正规势力模板 ──
req(cam.includes("if (factionId === _PANJUN) continue") || cam.includes("factionId === _PANJUN) continue"), 'seedBootPlaceholderFlags 须跳过 panjun');
req(flagClass.includes('flag-rebel-'), 'TerritoryFlagClass 须用 flag-rebel-*');
req(!flagClass.includes('flag-faction-panjun'), '不得使用 flag-faction-panjun');

// ── 素材文件存在性 ──
const sucaiDirs = [
    path.join(root, 'public/SUCAI/S10QZ'),
    path.join(root, 'SUCAI/S10QZ'),
];
const sucaiDir = sucaiDirs.find((d) => fs.existsSync(d));
if (!sucaiDir) {
    warnings.push('未找到 SUCAI/S10QZ 目录，跳过素材文件检查');
} else {
    let missing = 0;
    for (let i = minId; i <= maxId; i++) {
        const p = path.join(sucaiDir, `${i}-1.png`);
        if (!fs.existsSync(p)) missing++;
    }
    req(missing === 0, `S10QZ 7–58 缺 ${missing} 张 PNG`);
}

// ── setRebelFlagStyleRule 子串误判回归测试 ──
function simulateCssRules() {
    let styleText = '';
    const setRule = (index, url) => {
        const selector = `.flag-rebel-${index}`;
        const rule = `${selector} { background-image: url('${url}'); }\n`;
        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`${escaped}\\s*\\{[^}]*\\}\\s*`, 'g');
        if (re.test(styleText)) {
            styleText = styleText.replace(re, rule);
        } else {
            styleText += rule;
        }
    };
    for (let i = 0; i < 52; i++) setRule(i, `url${i}`);
    for (let i = 0; i < 52; i++) {
        if (!styleText.includes(`.flag-rebel-${i} {`)) {
            errors.push(`CSS 规则缺失 flag-rebel-${i}`);
        }
    }
    // 旧 includes 误判：添加 10 后 includes('.flag-rebel-1') 为 true
    if ('.flag-rebel-10 { x }'.includes('.flag-rebel-1')) {
        warnings.push('确认：旧 includes 方案会误判 flag-rebel-1 vs flag-rebel-10（已改用 regex）');
    }
}
simulateCssRules();

// ── panjun 据点数 ──
const citiesV2 = fs.readFileSync(path.join(root, 'src/data/cities_v2.ts'), 'utf8');
const panjunCount = (citiesV2.match(/factionId:\s*'panjun'/g) || []).length;
console.log(JSON.stringify({
    panjunCities: panjunCount,
    rebelAssetRange: `${minId}-${maxId}`,
    rebelAssetCount: count,
    errors: errors.length,
    warnings: warnings.length,
}, null, 2));

if (warnings.length) {
    console.log('\n--- WARNINGS ---');
    warnings.forEach((w) => console.log('⚠', w));
}
if (errors.length) {
    console.log('\n--- ERRORS ---');
    errors.forEach((e) => console.log('✗', e));
    process.exit(1);
}
console.log('\n✓ 叛军旗号静态审计通过');
