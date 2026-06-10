/**
 * 势力显示分级（用户标准）：
 *   1 — 大民族、大政权
 *   2 — 小民族、小政权、家族、州郡
 *   3 — 农民起义
 * 输出 scratch/faction_tier_grading.json
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

function loadFactions() {
    const src = fs.readFileSync(path.join(root, 'src/data/factions.ts'), 'utf8');
    return [...src.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map((m) => ({
        id: m[1],
        name: m[2],
    }));
}

function loadDisplayNames() {
    const src = fs.readFileSync(path.join(root, 'src/data/SandboxDisplayNames.ts'), 'utf8');
    const map = {};
    for (const m of src.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)) map[m[1]] = m[2];
    return map;
}

function loadAudit(file, idKey = 'id') {
    const j = JSON.parse(fs.readFileSync(path.join(root, 'scratch', file), 'utf8'));
    const entries = j.entries || j;
    const byId = new Map();
    for (const e of entries) {
        const id = e[idKey] || e.factionId || e.id;
        if (id) byId.set(id, e);
    }
    return byId;
}

/** 三级：农民起义、名带色起义武装 */
const TIER3_UPRISING = new Set([
    'wazhai', 'red_turban', 'xushouhui', 'haoding', 'yang_aner', 'chimei',
    'dashun', 'daxi_ming', 'hongguang', 'longwu', 'yongli', 'lulin', 'baibo',
    'bailian', 'liwang', 'taiping',
]);

/** 一级：大民族（有渊源地、史上主要部族/民族，非小部族） */
const TIER1_MAJOR_ETHNIC = new Set([
    'xiongnu', 'xianbei', 'tuoba', 'qidan', 'jurchen', 'menggu_d', 'manzhou',
    'tujue', 'tiele', 'huige', 'rouran', 'chile', 'qiang', 'di', 'jie', 'yuezhi',
    'sogdian', 'donghu', 'sushen', 'wuzhumuqin', 'mohe', 'dangxiang', 'tubo',
    'quanrong', 'xianbei', 'huimo', 'jurchen', 'dangxiang', 'huaxia', 'huihui',
    'zhonghua', 'tianchao',     'riben', 'yamato',
]);

/** 一级：大政权（大一统/长期大国/区域核心王国） */
const TIER1_MAJOR_REGIME = new Set([
    'han_d', 'shu', 'wu', 'wei', 'qin', 'chu', 'yan', 'qi', 'han', 'zhao',
    'tang', 'song', 'ming_d', 'yuan_d', 'da_yuan', 'manzhou_d', 'dajin', 'jin',
    'shang', 'xia', 'liao_d', 'sui', 'chen', 'liang', 'liang_d', 'xin', 'zhou',
    'dian', 'nanzhao', 'dali', 'goryeo', 'joseon', 'bohai', 'baiji', 'xinluo',
    'gaogouli', 'yamato', 'edo', 'kyoto', 'min', 'wu_yue', 'yue', 'dayue',
    'dangxiang', 'tubo', 'siam', 'chenla',
]);

const factions = loadFactions();
const display = loadDisplayNames();
const ethnicAudit = loadAudit('ethnic_homeland_audit.json', 'factionId');
const regimeAudit = loadAudit('regime_capital_audit.json');
const familyAudit = loadAudit('family_state_audit.json');
const countyAudit = loadAudit('county_seat_audit.json');

const entries = [];
const stats = { 1: 0, 2: 0, 3: 0, panjun: 0 };

for (const f of factions) {
    const flag = display[f.id] || f.name;
    let tier = 2;
    let category = '待定(默认二级)';
    const reasons = [];

    if (f.id === 'panjun') {
        entries.push({
            id: f.id,
            flag,
            tier: null,
            category: '叛军',
            reason: '叛军旗，不参与势力分级',
        });
        stats.panjun++;
        continue;
    }

    if (TIER3_UPRISING.has(f.id)) {
        tier = 3;
        category = '农民起义';
        reasons.push('起义/教门武装');
    } else if (TIER1_MAJOR_REGIME.has(f.id)) {
        tier = 1;
        category = '大政权';
        reasons.push('大一统或区域核心王国');
    } else if (TIER1_MAJOR_ETHNIC.has(f.id)) {
        tier = 1;
        category = '大民族';
        reasons.push('主要部族/民族');
    } else if (regimeAudit.has(f.id)) {
        const e = regimeAudit.get(f.id);
        if (e.auditStatus === 'ok' && e.priority === 2) {
            tier = 2;
            category = '小政权';
            reasons.push(`政权首都审计·${e.cityName || e.cityId}`);
        }
    } else if (ethnicAudit.has(f.id)) {
        const e = ethnicAudit.get(f.id);
        if (e.priority === 1) {
            tier = 2;
            category = '小民族';
            reasons.push(`民族渊源地·${e.cityName || e.cityId}`);
        }
    }

    if (tier === 2 && familyAudit.has(f.id)) {
        const e = familyAudit.get(f.id);
        if (e.priority === 4) {
            category = '家族';
            reasons.push(`家族大本营·${e.cityName || ''}`);
        } else if (e.priority === 5) {
            category = '州郡';
            reasons.push(`州名旗号·${e.cityName || ''}`);
        }
    }
    if (tier === 2 && countyAudit.has(f.id)) {
        const e = countyAudit.get(f.id);
        category = '州郡';
        reasons.push(`郡治·${e.jun || e.type || ''}`);
    }

    // 政权审计 ok 但未命中大政权表 → 小政权
    if (tier === 2 && category === '待定(默认二级)' && regimeAudit.has(f.id)) {
        const e = regimeAudit.get(f.id);
        if (e.auditStatus === 'ok') {
            category = '小政权';
            reasons.push('政权首都审计通过');
        }
    }

    // 二级红/黄等固定色但非大一统 → 降为二级（西楚、尔朱、北元等）
    const tier2RegimeOverride = new Set([
        'xichu', 'erzhu', 'jiujiang', 'yue_d', 'da_yuan', 'zhangshicheng', 'xiqin',
        'xin', 'chen', 'fu', 'yuwen', 'xiao_d', 'chunshen', 'xu',
    ]);
    if (tier2RegimeOverride.has(f.id) && tier === 1) {
        tier = 2;
        category = '小政权';
        reasons.push('短命/偏安/争霸政权或二级尚色');
    }
    if (tier2RegimeOverride.has(f.id) && tier === 2 && category === '待定(默认二级)') {
        category = '小政权';
        reasons.push('短命/偏安/争霸政权或二级尚色');
    }

    entries.push({
        id: f.id,
        flag,
        tier,
        category,
        reason: reasons.join('；') || '未入审计清单，暂列二级',
    });
    stats[tier]++;
}

// 显式修正：用户已认定的大民族/政权
/** 人工裁定（覆盖自动规则） */
const manual = {
    menggu_d: [1, '大民族', '蒙古帝国民族'],
    joseon: [1, '大政权', '朝鲜王朝'],
    dangxiang: [1, '大政权', '党项大夏'],
    zhangshicheng: [2, '小政权', '张士诚大周'],
    dashun: [3, '农民起义', '李自成大顺'],
    xichu: [2, '小政权', '西楚霸王'],
    yue_d: [2, '小政权', '岳家军'],
    da_yuan: [2, '小政权', '北元残朝'],
    edo: [2, '小政权', '德川幕府'],
    min: [2, '小政权', '闽国'],
    liang: [2, '小政权', '地方/五代梁'],
    liang_d: [2, '小政权', '偏安梁'],
    wu_yue: [2, '小政权', '吴越'],
    tonghai: [2, '小政权', '通海'],
    mian: [2, '小政权', '缅甸地方势力'],
    seljuq: [2, '小政权', '塞尔柱'],
    saman: [2, '小政权', '萨曼'],
    liguo: [2, '小政权', '春秋黎国'],
    xiqin: [2, '小政权', '薛举西秦'],
    chunshen: [2, '家族', '春申君黄氏'],
    xiao_d: [2, '家族', '兰陵萧氏'],
    jiujiang: [2, '州郡', '九江郡'],
    fu: [2, '小政权', '前秦苻氏'],
    yuwen: [2, '小政权', '北周宇文氏'],
    chijin: [2, '小民族', '赤斤部'],
    hezhe: [2, '小民族', '赫哲'],
    nifuhe: [2, '小民族', '尼夫赫'],
};
for (const e of entries) {
    if (manual[e.id]) {
        const [t, c, r] = manual[e.id];
        e.tier = t;
        e.category = c;
        e.reason = r;
    }
}

entries.sort((a, b) => (a.tier ?? 9) - (b.tier ?? 9) || a.category.localeCompare(b.category) || a.flag.localeCompare(b.flag));

const statsFinal = { tier1: 0, tier2: 0, tier3: 0, panjun: 0 };
for (const e of entries) {
    if (e.tier === 1) statsFinal.tier1++;
    else if (e.tier === 2) statsFinal.tier2++;
    else if (e.tier === 3) statsFinal.tier3++;
    else statsFinal.panjun++;
}

const out = {
    updated: '2026-06-09',
    rule: '一级=大民族/大政权；二级=小民族/小政权/家族/州郡；三级=农民起义；panjun=叛军除外',
    total: factions.length,
    stats: statsFinal,
    entries,
};

fs.writeFileSync(path.join(root, 'scratch/faction_tier_grading.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out.stats, null, 2));
console.log('tier1 sample:', entries.filter((e) => e.tier === 1).slice(0, 15).map((e) => e.flag).join(', '));
console.log('tier3:', entries.filter((e) => e.tier === 3).map((e) => e.flag).join(', '));
console.log('written scratch/faction_tier_grading.json');
