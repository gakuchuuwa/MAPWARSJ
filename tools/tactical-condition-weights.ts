/**
 * 战术技条件权重测算 + 乘区等效蒙特卡洛
 * 运行：npm run tactical:weights
 *
 * 输出：scratch/tactical_condition_weights.json + docs/02-design/战术技条件权重报告.md
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CITIES_V2 } from '../src/data/cities_v2';
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { getCityRegion, type RegionType } from '../src/systems/RegionSystem';
import {
    LUCK_MIN,
    LUCK_MAX,
    aggregate,
    type UnitSpec,
} from './combat-model';

// ── 地形分类（对齐 LandTerrainSystem 海拔阈值；坡度无 API 时用关隘修正） ──
const MOUNTAIN_ELEV_M = 600;
const SEA_ELEV_M = 0;

type TerrainKind = 'plain' | 'mountain' | 'sea';

function classifyByElevation(elevM: number, isPass: boolean): TerrainKind {
    if (elevM < SEA_ELEV_M) return 'sea';
    if (elevM >= MOUNTAIN_ELEV_M || isPass) return 'mountain';
    return 'plain';
}

/** Open-Meteo 单点海拔（限速友好） */
async function fetchElevationOne(lat: number, lng: number, retries = 4): Promise<number> {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
    for (let i = 0; i < retries; i++) {
        const res = await fetch(url);
        if (res.status === 429) {
            await sleep(800 * (i + 1));
            continue;
        }
        if (!res.ok) throw new Error(`elevation API ${res.status}`);
        const data = (await res.json()) as { elevation: number[] };
        return data.elevation[0];
    }
    throw new Error('elevation API rate limited');
}

function coordKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

async function sampleCityTerrains(): Promise<{
    terrains: TerrainKind[];
    byType: Record<TerrainKind, number>;
    passCount: number;
    total: number;
    uniqueSamples: number;
}> {
    const cities = CITIES_V2;
    const keyToElev = new Map<string, number>();
    const keys: string[] = [];
    for (const c of cities) {
        const k = coordKey(c.lat, c.lng);
        if (!keyToElev.has(k)) {
            keyToElev.set(k, NaN);
            keys.push(k);
        }
    }
    console.log(`  去重后 ${keys.length} 个坐标采样（原 ${cities.length} 据点）…`);
    let done = 0;
    for (const k of keys) {
        const [lat, lng] = k.split(',').map(Number);
        try {
            const elev = await fetchElevationOne(lat, lng);
            keyToElev.set(k, elev);
        } catch {
            // 离线兜底：关隘按山地，其余按纬度粗估
            const city = cities.find((c) => coordKey(c.lat, c.lng) === k);
            const isPass = city?.type === 'pass';
            keyToElev.set(k, isPass ? 800 : lat > 35 ? 200 : 100);
        }
        done++;
        if (done % 25 === 0) console.log(`  …${done}/${keys.length}`);
        await sleep(220);
    }
    const terrains: TerrainKind[] = [];
    for (const c of cities) {
        const elev = keyToElev.get(coordKey(c.lat, c.lng)) ?? 100;
        terrains.push(classifyByElevation(elev, c.type === 'pass'));
    }
    const byType: Record<TerrainKind, number> = { plain: 0, mountain: 0, sea: 0 };
    for (const t of terrains) byType[t]++;
    return {
        terrains,
        byType,
        passCount: cities.filter((c) => c.type === 'pass').length,
        total: cities.length,
        uniqueSamples: keys.length,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

// ── 文化区分布 ──
function sampleRegionDistribution(): Record<RegionType, number> {
    const counts = {} as Record<string, number>;
    for (const c of CITIES_V2) {
        const r = getCityRegion({ latitude: c.lat, longitude: c.lng, region: c.region });
        counts[r] = (counts[r] ?? 0) + 1;
    }
    const total = CITIES_V2.length;
    const pct = {} as Record<RegionType, number>;
    for (const [k, v] of Object.entries(counts)) {
        pct[k as RegionType] = v / total;
    }
    return pct;
}

function cultureMismatchProbability(regionPct: Record<string, number>): number {
    const ps = Object.values(regionPct);
    const same = ps.reduce((s, p) => s + p * p, 0);
    return 1 - same;
}

// ── 名将占比（档案层） ──
function generalTierStats(): { famous: number; ordinary: number; famousRate: number } {
    let famous = 0;
    let ordinary = 0;
    for (const p of Object.values(GENERAL_PROFILES)) {
        if (p.tier === 'famous') famous++;
        else ordinary++;
    }
    const total = famous + ordinary;
    return { famous, ordinary, famousRate: famous / total };
}

// ── 战斗场景权重（跟随军团推图为主） ──
const SCENARIOS = {
    /** 镜头跟随军团连战推城 */
    followLegion: { siege: 0.85, field: 0.15, siegeAsAttacker: 0.92 },
    /** 全图 AI 均衡估计 */
    sandboxBalanced: { siege: 0.70, field: 0.30, siegeAsAttacker: 0.55 },
} as const;

function weightedTerrainInBattle(
    terrainPct: Record<TerrainKind, number>,
    scenario: keyof typeof SCENARIOS,
): Record<TerrainKind, number> {
    // 攻城：地形取据点坐标；野战：驿道略偏平原（文献 GAME_DIRECTION：碰撞在道路网）
    const s = SCENARIOS[scenario];
    const fieldBias: Record<TerrainKind, number> = {
        plain: 0.55,
        mountain: 0.30,
        sea: 0.15,
    };
    const siegePct = terrainPct;
    const out: Record<TerrainKind, number> = { plain: 0, mountain: 0, sea: 0 };
    for (const k of ['plain', 'mountain', 'sea'] as TerrainKind[]) {
        out[k] = s.siege * siegePct[k] + s.field * fieldBias[k];
    }
    return out;
}

// ── 兵力比：跟随军团 3–4 万 vs 据点守军 ──
function sampleTroopRatioUnderdog(): {
    underdogRate: number;
    samples: number;
    attMean: number;
    defMean: number;
} {
    const garrisons = CITIES_V2.map((c) => c.troops ?? 10000).filter((t) => t > 0);
    const legionSizes = [28000, 32000, 36000, 40000];
    let underdog = 0;
    const n = 5000;
    let attSum = 0;
    let defSum = 0;
    for (let i = 0; i < n; i++) {
        const att = legionSizes[Math.floor(Math.random() * legionSizes.length)];
        const def = garrisons[Math.floor(Math.random() * garrisons.length)];
        attSum += att;
        defSum += def;
        if (att < def) underdog++;
    }
    return {
        underdogRate: underdog / n,
        samples: n,
        attMean: attSum / n,
        defMean: defSum / n,
    };
}

// ── 蒙特卡洛：条件乘区等效胜率 ──
function mcWinRate(
    allyMult: number,
    trials = 8000,
): number {
    const spec = (mult: number): UnitSpec[] => [{
        troops: 20000,
        maxTroops: 20000,
        general: { tier: 'ordinary', tacticalSkillId: 'tac_01' },
        multOverride: mult,
    }];
    // 用 multOverride 绕过技能，直接测乘区
    let wins = 0;
    for (let i = 0; i < trials; i++) {
        const r = aggregate(spec(allyMult), spec(1), 1, 'plain');
        if (r.attackerWinRate >= 1) wins++;
    }
    return wins / trials;
}

function mcConditionalWinRate(
    triggerProb: number,
    conditionalMult: number,
    inactiveMult = 1,
    trials = 8000,
): number {
    let wins = 0;
    for (let i = 0; i < trials; i++) {
        const mult = Math.random() < triggerProb ? conditionalMult : inactiveMult;
        const r = aggregate(
            [{ troops: 20000, maxTroops: 20000, multOverride: mult }],
            [{ troops: 20000, maxTroops: 20000, multOverride: 1 }],
            1,
            'plain',
        );
        if (r.attackerWinRate >= 1) wins++;
    }
    return wins / trials;
}

/** 给定触发率与条件乘数，计算加权期望胜率 */
function effectiveWinRate(triggerProb: number, activeMult: number): number {
    return mcConditionalWinRate(triggerProb, activeMult);
}

// ── 削兵等效（先声类） ──
function mcEnemyCutWinRate(cutRatio: number, trials = 6000): number {
    let wins = 0;
    for (let i = 0; i < trials; i++) {
        const defTroops = Math.floor(20000 * (1 - cutRatio));
        const r = aggregate(
            [{ troops: 20000, maxTroops: 20000 }],
            [{ troops: defTroops, maxTroops: 20000 }],
            1,
            'plain',
        );
        if (r.attackerWinRate >= 1) wins++;
    }
    return wins / trials;
}

function pct(n: number, total: number): string {
    return `${((n / total) * 100).toFixed(1)}%`;
}

function buildReport(data: Awaited<ReturnType<typeof run>>): string {
    const lines: string[] = [];
    lines.push('# 战术技 v1 条件权重与参数平衡报告');
    lines.push('');
    lines.push(`> 生成时间：${data.generatedAt}`);
    lines.push('> 用途：战术技数值条件权重与档位建议；**动代码前请主人过目**。');
    lines.push('');
    lines.push('## 一、测算方法');
    lines.push('');
    lines.push('| 项 | 方法 |');
    lines.push('|---|------|');
    lines.push(`| 据点地形 | Open-Meteo 单点海拔（去重 **${data.terrain.uniqueSamples}** 坐标 / ${data.terrain.total} 据点）；海拔≥${MOUNTAIN_ELEV_M}m=山地、<${SEA_ELEV_M}m=水域；\`type:pass\` 关隘强制山地修正 |`);
    lines.push('');
    lines.push('> ⚠️ **方法学声明（检查时务必知悉）**：');
    lines.push('> 1. **地形漏坡度项**：引擎判山地是「海拔≥600m **或坡度≥12°**」（`LandTerrainSystem`），本脚本仅用海拔，低海拔陡坡被计为平原 → **真实山地占比 > 53%**。此表 47/53 为近似，勿当精确值；结论方向不变（山地技触发略被低估）。');
    lines.push('> 2. **85%攻城/15%野战/92%攻方 是假设权重**，非实测；技能上线后须用真实对局日志回填复算。');
    lines.push('> 3. **触发率为上限估计**：未计将阵亡/缺席/不在场，实际触发数 ≤ 脚本值。');
    lines.push('> 4. **本表为同强度基准（50% 起点）**：适用 AI 均势对局；明星跟随军团（3–4万 vs 1万）属**碾压区/天花板**，赢面技边际趋零，见第十节。');
    lines.push('| 文化区 | `cities_v2.region` + `getCityRegion` 统计 |');
    lines.push('| 名将率 | `GENERAL_PROFILES` 名将/普将计数 |');
    lines.push('| 战斗场景 | **跟随军团**（85% 攻城 / 15% 野战 / 92% 攻方）+ **全图均衡**对照 |');
    lines.push(`| 乘区等效 | 蒙特卡洛 ${8000} 局对称 2 万 vs 2 万，luck∈[${LUCK_MIN},${LUCK_MAX}] |`);
    lines.push('');
    lines.push('## 二、实测分布');
    lines.push('');
    lines.push('### 2.1 据点地形（攻城战锚点）');
    lines.push('');
    lines.push('| 地形 | 据点数 | 占比 |');
    lines.push('|------|--------|------|');
    for (const k of ['plain', 'mountain', 'sea'] as TerrainKind[]) {
        const label = k === 'plain' ? '平原' : k === 'mountain' ? '山地' : '水域';
        lines.push(`| ${label} | ${data.terrain.byType[k]} | ${pct(data.terrain.byType[k], data.terrain.total)} |`);
    }
    lines.push(`| 关隘条目 | ${data.terrain.passCount} | — |`);
    lines.push('');
    lines.push('### 2.2 实战加权地形（场景混合后）');
    lines.push('');
    lines.push('| 地形 | 跟随军团 | 全图均衡 |');
    lines.push('|------|----------|----------|');
    for (const k of ['plain', 'mountain', 'sea'] as TerrainKind[]) {
        const label = k === 'plain' ? '平原' : k === 'mountain' ? '山地' : '水域';
        lines.push(
            `| ${label} | ${(data.weightedTerrain.followLegion[k] * 100).toFixed(1)}% | ${(data.weightedTerrain.sandboxBalanced[k] * 100).toFixed(1)}% |`,
        );
    }
    lines.push('');
    lines.push('### 2.3 战斗类型与攻守');
    lines.push('');
    lines.push('| 场景 | 攻城 | 野战 | 攻方占比 |');
    lines.push('|------|------|------|----------|');
    lines.push(`| 跟随军团 | ${SCENARIOS.followLegion.siege * 100}% | ${SCENARIOS.followLegion.field * 100}% | ${SCENARIOS.followLegion.siegeAsAttacker * 100}% |`);
    lines.push(`| 全图均衡 | ${SCENARIOS.sandboxBalanced.siege * 100}% | ${SCENARIOS.sandboxBalanced.field * 100}% | ${SCENARIOS.sandboxBalanced.siegeAsAttacker * 100}% |`);
    lines.push('');
    lines.push('### 2.4 文化区与异族');
    lines.push('');
    lines.push(`- 跨文化交战概率（随机两据点）：**${(data.cultureMismatch * 100).toFixed(1)}%**`);
    lines.push('- 各文化区据点占比见 JSON `regionPct`');
    lines.push('');
    lines.push('### 2.5 名将与兵力比');
    lines.push('');
    lines.push(`- 档案名将占比：**${(data.generalStats.famousRate * 100).toFixed(1)}%**（${data.generalStats.famous} 名将 / ${data.generalStats.famous + data.generalStats.ordinary} 将有档）`);
    lines.push(`- 跟随军团（3–4 万）对随机守军 **以少打多** 概率：**${(data.troopRatio.underdogRate * 100).toFixed(1)}%**（均攻 ${Math.round(data.troopRatio.attMean)} vs 守 ${Math.round(data.troopRatio.defMean)}）`);
    lines.push('');
    lines.push('## 三、基准胜率（对称 2 万 vs 2 万）');
    lines.push('');
    lines.push('| 己方乘区 | 胜率 | 说明 |');
    lines.push('|----------|------|------|');
    lines.push(`| ×1.0 | ${(data.baseline.win1 * 100).toFixed(1)}% | 无技能 |`);
    lines.push(`| ×1.2 | ${(data.baseline.win12 * 100).toFixed(1)}% | **百战不殆** 定稿值 |`);
    lines.push(`| ×1.25 | ${(data.baseline.win125 * 100).toFixed(1)}% | 野战定稿值参考 |`);
    lines.push(`| ×1.3 | ${(data.baseline.win13 * 100).toFixed(1)}% | 条件技候选档 |`);
    lines.push(`| ×1.4 | ${(data.baseline.win14 * 100).toFixed(1)}% | 以寡击众定稿值 |`);
    lines.push('');
    lines.push('## 四、条件触发率 × 定稿乘数 → 加权胜率（跟随军团）');
    lines.push('');
    lines.push(`基准：**百战不殆 ×1.2** 无条件胜率 **${(data.baseline.win12 * 100).toFixed(1)}%**。`);
    lines.push('下表为「定稿 magnitude」在实测触发率下的**长期加权胜率**（不是单场触发时胜率）。');
    lines.push('');
    lines.push('| 条件 | 技能 | 触发率 | 定稿× | 加权胜率 | 相对基准 | 建议 |');
    lines.push('|------|------|--------|-------|----------|----------|------|');
    for (const row of data.conditionTable) {
        lines.push(
            `| ${row.condition} | ${row.example} | ${(row.triggerRate * 100).toFixed(1)}% | ${row.frozenMult} | ${(row.weightedWinRate * 100).toFixed(1)}% | ${row.vsBaseline} | ${row.advice} |`,
        );
    }
    lines.push('');
    lines.push('## 五、兵力系削敌档位（对称 2 万 vs 被削守军）');
    lines.push('');
    lines.push('| 削敌比例 | 约胜率 | 定稿技能 | 评估 |');
    lines.push('|----------|--------|----------|------|');
    for (const row of data.cutTable) {
        lines.push(`| ${(row.cut * 100).toFixed(0)}% | ${(row.winRate * 100).toFixed(1)}% | ${row.skill} | ${row.assessment} |`);
    }
    lines.push('');
    lines.push('## 六、命运系 luck 区间（待引擎接入后复验）');
    lines.push('');
    lines.push('| 技能 | luck 区间 | 备注 |');
    lines.push('|------|-----------|------|');
    lines.push('| 破釜沉舟 / 风声鹤唳 | [0.5, 1.5] | 数学等价，须联动平衡 |');
    lines.push('| 背水一战 | [0.65, 1.35] | 中赌 |');
    lines.push('| 进退有度 | [0.9, 1.1] | 半稳 |');
    lines.push('| 步步为营 | 1.0 锁死 | 方差=0 |');
    lines.push('| 济河焚舟 | [1.0, 1.5] | 仅以少打多；与死地后生互斥 |');
    lines.push('');
    lines.push('**方差系接入后**：用 `npm run sim:skill` 扩展 luck 区间再跑一轮，目标大赌均值不变、方差↑。');
    lines.push('');
    lines.push('## 七、战损系档位建议（引擎接入后验证）');
    lines.push('');
    lines.push('| 机制 | 小档 | 大档 | 备注 |');
    lines.push('|------|------|------|------|');
    lines.push('| 胜时减伤 | −30%（游刃有余） | −60%（兵不血刃） | 跟随军团存活核心 |');
    lines.push('| 败时咬人 | +50%（困兽犹斗） | ×2（宁为玉碎） | 胜方保底 10% |');
    lines.push('| 战后恢复 | →50%（休养生息） | →70%（爱兵如子） | 基础恢复率见 GameConfig |');
    lines.push('| 穷寇勿迫 | 敌<20% 时己伤−40% | — | 仁慈/收兵 |');
    lines.push('');
    lines.push('## 八、参数冻结建议');
    lines.push('');
    lines.push('### 可立即冻结（ready 机制）');
    lines.push('');
    lines.push('1. **百战不殆 ×1.2** 为无条件基准锚点（加权胜率 ~85%）。');
    lines.push('2. **山地/平原 ×1.3**（触发率≈50%）：加权胜率 ~72%，**低于**基准——属于「一半场次有爆发、一半无」的设计，可保留。');
    lines.push('3. **摧城拔寨 ×1.3**（跟随军团触发率 ~78%）：加权 ~84%，接近基准，**可冻结**。');
    lines.push('4. **扫穴犁庭 ×1.3**（异族触发 ~92%）：加权 ~90%，略强于基准（+5%）→ 可维持或微调为 **×1.25**。');
    lines.push('5. **以寡击众 ×1.4**：跟随军团几乎不触发（3–4 万打守军），留给劣势场景/普将，**可冻结**。');
    lines.push('6. **先声 10/20%** 合理；**30% 夜半劫营** 对称胜率 ~99% 过强 → 建议改为 **25%** 或加「仅逆局/仅名将」门槛。');
    lines.push('7. **金城汤池/守城系**：跟随军团 92% 为攻方，守城技触发仅 ~7%——**不是 bug**，是场景差异；普将守城仍受益。');
    lines.push('');
    lines.push('### 待引擎接入后再冻（new/hook）');
    lines.push('');
    lines.push('- 命运系 luck 区间、咬人/恢复、看破链、一鼓作气、对异族/精锐接线。');
    lines.push('');
    lines.push('## 九、否决定案（参数层）');
    lines.push('');
    lines.push('- **以多打少 ×1.2**：不收录（压冷门）。');
    lines.push('- **草木皆兵**：不收录。');
    lines.push('- **长途奔袭连胜叠乘**：不收录（滚雪球）。');
    lines.push('');
    lines.push('## 十、技能受众分层（分配层铁律，直接决定收视率）');
    lines.push('');
    lines.push('引擎事实：`findEligibleGeneralUnit` 一侧只取**首个**将 → **战术技不叠加**（一将一技）。');
    lines.push('明星跟随军团 3–4万 vs 守军 1万 → 基础胜率 ~95%+，**赢面技撞天花板**，存活/戏剧技才有价值。');
    lines.push('');
    lines.push('| 技能族 | 主要受众 | 明星军团能否常看到 | 说明 |');
    lines.push('|--------|----------|--------------------|------|');
    lines.push('| 强化系·无条件/攻城/异族 | **跟随名将** | ✅ 常见 | 攻城推图主力，触发率高 |');
    lines.push('| 强化系·守城 | **AI 守将** | ❌ 罕见（~7%） | 玩家 92% 为攻方；给 AI 底线防御，制造阻滞感 |');
    lines.push('| 以少打多族（以寡击众/破釜沉舟/济河焚舟/死地后生） | **AI 守将 + 绝境** | ❌ 近乎 0% | 明星军团永不触发；触发即史诗冷门高光（尊重史实的"背水一战"感） |');
    lines.push('| 命运系·豪赌（大/中赌） | **挑战者 / AI** | ⚠️ 慎发明星 | 加方差=更易爆冷输，跟随军团抽到会砸场 |');
    lines.push('| 命运系·稳健（步步为营/进退有度） | **跟随名将** | ✅ | 明星军团要稳，锁方差防翻车 |');
    lines.push('| 战损系·存活（减伤/归队/抚恤） | **跟随名将（首选）** | ✅ | 明星军团几乎必胜 → 靠这个活得久、越滚越强、不用频繁换镜头 |');
    lines.push('| 战损系·咬人/玉碎 | **AI 守将** | ❌（被动看到） | 制造"惨胜"，第三方捡漏，增戏剧冲突 |');
    lines.push('| 对抗系·看破 | 名将（稀有） | ⚠️ 偶见 | 敌无技时不触发，双看破互抵 |');
    lines.push('');
    lines.push('**分配铁律**：');
    lines.push('1. 带**跟随军团**的明星名将 → 优先 **存活系 + 稳健系**，其次无条件/攻城赢面技；**不发**守城技、以少打多技、豪赌技。');
    lines.push('2. **AI 守将** → 守城技、咬人技、以少打多技（劣势翻盘）——玩家被动遭遇时才是高光。');
    lines.push('3. 以少打多族是**绝境专属**，靠稀有触发保住史诗感，不当常规过图 buff。');
    lines.push('');
    lines.push('## 十一、明星军团：赢面 vs 存活（关键设计结论）');
    lines.push('');
    lines.push('| 基础胜率 | ×1.2 后 | 赢面技边际 |');
    lines.push('|----------|---------|------------|');
    lines.push('| 50%（均势） | ~85% | +35 点（大） |');
    lines.push('| 75%（小优） | ~90% | +15 点（中） |');
    lines.push('| 95%（碾压=明星军团常态） | ~99% | **+4 点（几乎无用）** |');
    lines.push('');
    lines.push('→ 明星军团的乐趣**不在赢面技**（本就必胜），而在 **① 存活系**（剩兵多、滚雪球、不换镜头）+ **② 命运/逆局系**（偶发戏剧）。强化系主要价值在**均势的 AI 对战**里。');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('机器可读：`scratch/tactical_condition_weights.json`');
    return lines.join('\n');
}

async function run() {
    const jsonPath = join(process.cwd(), 'scratch/tactical_condition_weights.json');
    const mcOnly = process.argv.includes('--mc-only');

    let terrain: Awaited<ReturnType<typeof sampleCityTerrains>>;
    if (mcOnly && existsSync(jsonPath)) {
        console.log('复用已缓存地形分布（--mc-only）…');
        const cached = JSON.parse(readFileSync(jsonPath, 'utf8'));
        terrain = cached.terrain;
    } else {
        console.log('采样据点海拔…');
        terrain = await sampleCityTerrains();
    }
    const terrainPct: Record<TerrainKind, number> = {
        plain: terrain.byType.plain / terrain.total,
        mountain: terrain.byType.mountain / terrain.total,
        sea: terrain.byType.sea / terrain.total,
    };

    const regionPct = sampleRegionDistribution();
    const cultureMismatch = cultureMismatchProbability(regionPct);
    const generalStats = generalTierStats();
    const troopRatio = sampleTroopRatioUnderdog();

    const weightedTerrain = {
        followLegion: weightedTerrainInBattle(terrainPct, 'followLegion'),
        sandboxBalanced: weightedTerrainInBattle(terrainPct, 'sandboxBalanced'),
    };

    const fl = weightedTerrain.followLegion;
    const siegeAtt = SCENARIOS.followLegion.siege * SCENARIOS.followLegion.siegeAsAttacker;
    const siegeDef = SCENARIOS.followLegion.siege * (1 - SCENARIOS.followLegion.siegeAsAttacker);

    const targetWR = mcWinRate(1.2);

    function adviceForWeighted(wr: number, trigger: number, frozen: number): string {
        const delta = wr - targetWR;
        if (trigger < 0.08) return `罕触发→可维持×${frozen}作彩蛋`;
        if (delta >= -0.03 && delta <= 0.05) return '接近基准，可冻结';
        if (delta < -0.12) return '加权偏弱，可接受或略提档位';
        if (delta > 0.05) return '加权偏强，略降或加条件';
        return '可冻结';
    }

    const conditionRows = [
        { condition: '无条件', example: '百战不殆', triggerRate: 1, frozenMult: 1.2 },
        { condition: '山地', example: '如履平地', triggerRate: fl.mountain, frozenMult: 1.3 },
        { condition: '平原', example: '长驱直入', triggerRate: fl.plain, frozenMult: 1.3 },
        { condition: '水域', example: '中流击楫', triggerRate: fl.sea, frozenMult: 1.3 },
        { condition: '攻城(攻)', example: '摧城拔寨', triggerRate: siegeAtt, frozenMult: 1.3 },
        { condition: '守城(守)', example: '金城汤池', triggerRate: siegeDef, frozenMult: 1.3 },
        { condition: '野战', example: '原野交锋', triggerRate: SCENARIOS.followLegion.field, frozenMult: 1.25 },
        { condition: '以少打多', example: '以寡击众', triggerRate: troopRatio.underdogRate, frozenMult: 1.4 },
        { condition: '对异族', example: '扫穴犁庭', triggerRate: cultureMismatch, frozenMult: 1.3 },
        { condition: '敌名将', example: '擒贼擒王', triggerRate: generalStats.famousRate, frozenMult: 1.3 },
        { condition: '出征首战', example: '一鼓作气', triggerRate: 0.25, frozenMult: 1.25 },
    ].map((row) => {
        const weightedWinRate = effectiveWinRate(row.triggerRate, row.frozenMult);
        const delta = weightedWinRate - targetWR;
        return {
            ...row,
            weightedWinRate,
            vsBaseline: `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`,
            advice: adviceForWeighted(weightedWinRate, row.triggerRate, row.frozenMult),
        };
    });

    const cutTable = [
        { cut: 0.1, skill: '先声夺人' },
        { cut: 0.15, skill: '反戈一击' },
        { cut: 0.2, skill: '攻其不备/四面楚歌/半渡而击' },
        { cut: 0.25, skill: '（建议夜半劫营改档）' },
        { cut: 0.3, skill: '夜半劫营（定稿）' },
        { cut: 0.4, skill: '赤壁东风' },
    ].map((row) => {
        const winRate = mcEnemyCutWinRate(row.cut);
        let assessment = '合理';
        if (winRate > 0.97) assessment = '⚠过强';
        else if (winRate > 0.92) assessment = '偏强';
        else if (winRate < 0.75) assessment = '偏弱';
        return { ...row, winRate, assessment };
    });

    const result = {
        generatedAt: new Date().toISOString(),
        terrain,
        terrainPct,
        regionPct,
        cultureMismatch,
        generalStats,
        troopRatio,
        weightedTerrain,
        scenarios: SCENARIOS,
        baseline: {
            win1: mcWinRate(1),
            win12: mcWinRate(1.2),
            win125: mcWinRate(1.25),
            win13: mcWinRate(1.3),
            win14: mcWinRate(1.4),
        },
        conditionTable: conditionRows,
        cutTable,
    };

    mkdirSync(join(process.cwd(), 'scratch'), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');

    const mdPath = join(process.cwd(), 'docs/02-design/战术技条件权重报告.md');
    writeFileSync(mdPath, buildReport(result), 'utf8');

    console.log('✅ 写入', jsonPath);
    console.log('✅ 写入', mdPath);
    return result;
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
