/**
 * 13 的素材比例与加载阻塞验收。
 *
 * 🔴 [2026-08-26 主人重申标准：「游戏合理，符合历史。一切按标准执行」]
 *
 * ① 比例：单位缩放 = `UNIT_PX / 64`，而建筑是 **1:1 原尺寸**绘制。
 *    UNIT_PX=50 时单位只画 78%，城堡/民兵高度比 DE 8.3:1 → 我们 10.7:1，人凭空小 22%。
 *    定为 **64**（缩放 1.00，与建筑同为原生尺寸，零重采样）。
 *    另一条路「建筑乘 0.78」被否：456px 城堡重采样成 356px 会糊，而奇观/城堡是地标。
 *
 * ② 进场卡顿：`pending > 0` 时 tick() 整个 return（不推进不渲染）。
 *    探针实测 assetsReady 中位 7.3s / p90 20s / 34 次 30s 超时 —— 那就是「进战斗卡一下」。
 *    只让**开场立刻要用**的 move/atk 计入 pending；die/melee/charge/idle 照常异步加载但不冻画面。
 *    外加 CLEAN_CACHE 存**已解码的 Image**，第二次同图跳过 HTTP+抠绿+两次解码。
 *
 * 跑法：npx tsx tools/audit-scene13-assets.mts
 */
import { readFileSync, existsSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');

console.log('比例（与 DE 一致）：');
const px = Number(/const UNIT_PX = (\d+)/.exec(SRC)?.[1] ?? 0);
if (px !== 64) {
    bad(`UNIT_PX=${px} → 单位只画 ${(px / 64 * 100).toFixed(0)}%，而建筑是 1:1，人相对建筑偏${px < 64 ? '小' : '大'}`);
} else ok('UNIT_PX=64 → 单位缩放 1.00，与建筑同为 DE 原生尺寸');

// 建筑必须保持 1:1（源宽高 = 目标宽高），否则比例又错开
if (!/drawImage\(na\.img, sx, 0, sw, sh, s\.x - m\.anchor_x, drawY - m\.anchor_y, sw, sh\)/.test(SRC)) {
    bad('建筑不再是 1:1 原尺寸绘制 —— 与 UNIT_PX 的比例基准对不上了');
} else ok('建筑仍为 1:1 原尺寸绘制');

// 实测比例
const milMeta = 'public/SUCAI/MILITIA/_meta.json';
const casMeta = 'public/SUCAI_BUILDING/WEST_CASTLE_AGE3/_meta.json';
if (existsSync(milMeta) && existsSync(casMeta)) {
    const mil = JSON.parse(readFileSync(milMeta, 'utf8'));
    const cas = JSON.parse(readFileSync(casMeta, 'utf8'));
    const h = Math.max(...Object.values(mil.idle.dirs).map((d: any) => d.fh as number));
    const deRatio = cas.box_h / h;
    const ourRatio = cas.box_h / (h * px / 64);
    const drift = Math.abs(ourRatio - deRatio) / deRatio;
    if (drift > 0.02) bad(`城堡/民兵高度比 我们 ${ourRatio.toFixed(1)}:1 vs DE ${deRatio.toFixed(1)}:1（偏差 ${(drift * 100).toFixed(0)}%）`);
    else ok(`城堡/民兵高度比 ${ourRatio.toFixed(1)}:1 = DE ${deRatio.toFixed(1)}:1`);
}

console.log('\n进场加载阻塞：');
if (!/const blocking = slot === 'move' \|\| slot === 'atk';/.test(SRC)) {
    bad("没有按动作组分批 —— 六组全阻塞会让进场冻住（实测中位 7.3s）");
} else ok('只有 move/atk 计入 pending（其余异步不冻画面）');

// pending 增减必须配对走 inc，漏一处会永久卡死（pending 归不了零 → tick 永远 return）
const incs = (SRC.match(/this\.pending \+= inc/g) ?? []).length;
const decs = (SRC.match(/this\.pending -= inc/g) ?? []).length;
if (incs === 0 || decs < 3) bad(`pending 增减没走 inc（+${incs} / -${decs}）—— 漏一处就永久卡死`);
else ok(`pending 增减配对（+${incs} 处 / -${decs} 处，含 onload/onerror/catch）`);
// ⚠️ 判据只针对**单位精灵那段**（用 inc 的那个循环）。别处的裸 pending++/-- 是各自配对的：
//    loadDynMeta（每兵种 1 次 DE meta）、抛射物预载、特效加载 —— 那三组量小且必须阻塞，不是 bug。
//    第一版判据写成「全文件不得有裸 pending--」，把它们全误报了。
const spriteBlock = (() => {
    const i = SRC.indexOf("const blocking = slot === 'move'");
    return i < 0 ? '' : SRC.slice(i, i + 4000);
})();
if (!spriteBlock) bad('找不到单位精灵加载段');
else if (/this\.pending--/.test(spriteBlock)) {
    bad('单位精灵段里还有裸 `this.pending--` —— 非阻塞组会把 pending 减成负数');
} else ok('单位精灵段内没有裸 pending--（全走 inc）');

console.log('\n跨战斗缓存：');
if (!/const CLEAN_CACHE = new Map<string, HTMLImageElement>/.test(SRC)) {
    bad('缺 CLEAN_CACHE —— 每场都要重新 HTTP + 抠绿 + 两次解码');
} else ok('CLEAN_CACHE 存已解码 Image（模块级，bank 清空不影响）');
const cap = Number(/const CLEAN_CACHE_MAX = (\d+)/.exec(SRC)?.[1] ?? 0);
if (!cap) bad('CLEAN_CACHE 没有上限 —— 会无限吃内存');
else ok(`CLEAN_CACHE 上限 ${cap} 张（超了按插入序淘汰）`);

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
