/**
 * 兵种综合战力（单一数字，只给「兵种鉴赏」横向粗排序用）。
 *
 * 🔴 [2026-09-07 订正] 原文写的是「不参与任何战斗结算，改这里不影响平衡」——**那句是错的，别再引用**。
 *    去看函数体，实情分两条路：
 *      · 八环（战略层）：`sideBasePower(units) = sumCultureAdjustedTroops(units)`，
 *        只有兵力 × 文化系数，**确实不读兵种属性**。
 *      · 13（战术层，双将战）：`dmgVs = max(1, atk + bonus - armor)`、`m.hp = statsFor(key).hp`，
 *        每一次挥砍、每一支箭、每个人的血条**全部直读 WAR_TYPES**，还带相克 bonus；
 *        而 13 是**裁决层**（演出判负 → presetResult + forceResolve，写死胜负跳过八环）。
 *        所以双将战里，兵种属性就是胜负本身。
 *    本文件算的是**鉴赏/排序分**，只影响面板与配军团用的尺子，不改 WAR_TYPES 数值，
 *    因此不改变 13 的实战结果；但「兵种属性不影响战斗」是错的说法，别再照抄。
 *
 * 算法 = 兰彻斯特式 √(有效输出 × 有效血)：
 *   有效输出 = 攻 / 装填 × 射程系数（1 + 0.22×√(射程/40)，见 RANGE_K）
 *   有效血   = 血 × 护甲折算（AoE2 护甲是**减法**，所以必须假定一个参考敌方攻击）
 *   战力指数 = √(有效输出 × 有效血) 归一化到全表中位数 = 100
 *
 * 为什么不用各项加权求和：加权和会把「高血低攻」和「低血高攻」算成同分，
 * 实战里这两者差很远；乘积开方才反映「打得动 × 扛得住」的相乘关系。
 *
 * ⚠️ 这个数字必然抹掉相克。长枪对骑兵、鹰勇士对射手那类 bonus 加成正是很多兵种存在的理由，
 *    但它只在特定对手身上兑现，没法压进一个通用数。所以战力只能当粗排序，不能当平衡依据；
 *    要看相克请看鉴赏面板里的「加成伤害」。
 */
import { WAR_TYPES, type WarType } from './WarTypes';

/** 装填下限，免得除零。 */
const MIN_RELOAD = 1.0;

/** 自爆船（爆破舰/燃烧船/爆破筏）DE 装填写 0 —— 它们是一次性撞上去炸，不是持续输出。
 *  按下限 1 秒算会把「100 点自爆伤害」当成 100 DPS，直接虚高到全表前列。
 *  这里把一次性伤害摊到一段名义交战时间上，量级才对得上持续输出的兵种。 */
const ONESHOT_WINDOW = 10;

/** 射程系数：`1 + RANGE_K × √(射程/40)`。
 *
 *  🔴 [2026-09-07 主人提「射程是不是该算进去，不然近战普遍高于远程」——实测坐实了]
 *     改前是**线性** `1 + 0.05×(射程/40)`，160 射程只给 ×1.20。实测全表中位：
 *     近战步兵 80 / 射手 **73** —— 典型远程系统性偏低一档。
 *     （均值看不出来：远程均值被少数投石车 500+ 拉高，中位数才是典型值。）
 *     根因：射程只乘在**输出**上，可远程真正的价值是**挨打少**（能白打两三轮、能放风筝），
 *     这部分模型没有。把系数抬到位就是在补这块。
 *  改后 `1 + 0.22×√(射程/40)`：射手中位 73 → 80，与近战步兵持平；骑兵 99→100 基本不动；
 *     最高攻城 443→478，没有炸。
 *  ⚠️ 用**开方**不用线性：原注释本来就写着「收益递减」，但代码是线性的，射程越长加成越猛，
 *     跟注释说反了。开方才递减，也免得 480 射程的攻城器械被系数顶穿。
 *  这是本文件唯一的经验参数，想让远程更值钱就调大它。 */
const RANGE_K = 0.22;
/** 射程系数：射程 0 = 1.0，之后按平方根递增。 */
function rangeFactor(rng: number): number {
    return rng > 0 ? 1 + RANGE_K * Math.sqrt(rng / 40) : 1;
}

/** 移速系数：**只罚慢，不奖快**，按「比同类中位还慢多少」打折。
 *
 *  🔴 [2026-09-07 主人提「你考虑移动速度和射程了吗，大象移速慢，应该降低战力」]
 *     改前公式里**移速一个字都没算**。实测全表：大象一律 spd=40（最慢档），
 *     骑兵中位 130 / 步兵 55 / 远程 50。波斯战象精锐 hp600 atk20 又慢，
 *     却拿到 414 分（全表中位 100 的四倍），因为「跑不动、被放风筝、追不上人」这块没进模型。
 *
 *  为什么按**同类中位**而不是全表中位：全表中位≈60，那样骑兵(130)会普遍 +16%、
 *  所有步兵普遍挨罚，等于凭空给骑兵全体加一档，把本来就偏高的骑兵推得更高。
 *  按同类比，问的才是「这个兵放在它自己那一类里算不算笨重」——
 *  大象(melee, 40 vs 55) 挨罚、象弓骑(ranged, 40 vs 50) 挨罚、
 *  普通步弓手正好在中位不动、骑兵不动。这才是想表达的东西。
 *
 *  只罚不奖：快本身已经通过「能选择接战、能脱离」间接体现在胜负里，
 *  再在静态分上奖一遍就是重复计价；而慢是实打实的短板。
 *
 *  k=0.5（开方）：大象 (40/55)^0.5 = 0.85，波斯战象精锐 414→353。想罚得更狠就调大它。 */
const SPEED_K = 0.5;

/** 各 cls 的中位移速（自洽算出来，不写死魔法数）。 */
let medSpd: Record<string, number> | null = null;
function computeMedianSpeeds(): Record<string, number> {
    const med = (a: number[]) => {
        if (a.length === 0) return 55;
        const s = a.slice().sort((x, y) => x - y);
        return s[Math.floor(s.length / 2)];
    };
    const all = Object.values(WAR_TYPES);
    const out: Record<string, number> = {};
    for (const c of ['melee', 'ranged', 'cav', 'siege']) out[c] = med(all.filter(u => u.cls === c).map(u => u.spd));
    return out;
}
function speedFactor(u: WarType): number {
    if (!medSpd) medSpd = computeMedianSpeeds();
    const ref = medSpd[u.cls] ?? 55;
    return u.spd > 0 && u.spd < ref ? Math.pow(u.spd / ref, SPEED_K) : 1;
}

export interface PowerBreakdown {
    /** 有效输出（攻/装填 × 射程系数） */
    dps: number;
    /** 有效血（血 × 护甲折算） */
    ehp: number;
    /** 归一化前的原始值 */
    raw: number;
    /** 战力指数：全表中位数 = 100 */
    index: number;
}

/** 参考敌方攻击 = 全表中位数，自洽，不写死魔法数。近战/穿刺分开取。 */
function computeRefAttacks(): { melee: number; pierce: number } {
    const med = (a: number[]) => {
        if (a.length === 0) return 10;
        const s = a.slice().sort((x, y) => x - y);
        return s[Math.floor(s.length / 2)];
    };
    const all = Object.values(WAR_TYPES);
    return {
        melee: med(all.filter(u => u.dmgType === 'melee' && u.atk > 0).map(u => u.atk)),
        pierce: med(all.filter(u => u.dmgType === 'pierce' && u.atk > 0).map(u => u.atk)),
    };
}

let refs: { melee: number; pierce: number } | null = null;
let medianRaw = 0;

function rawPower(u: WarType): number {
    if (!refs) refs = computeRefAttacks();
    if (u.atk <= 0) return 0;                       // 非战斗单位（使者等）

    const dps = (u.atk / (u.reload > 0 ? Math.max(u.reload, MIN_RELOAD) : ONESHOT_WINDOW)) * rangeFactor(u.rng);

    // AoE2 护甲是减法且最低吃 1 点伤，所以折算 = 参考攻击 / max(参考攻击 - 护甲, 1)
    const soak = (ref: number, armor: number) => ref / Math.max(ref - armor, 1);
    const ehp = u.hp * 0.5 * (soak(refs.melee, u.meleeArmor) + soak(refs.pierce, u.pierceArmor));

    return Math.sqrt(dps * ehp) * speedFactor(u);
}

function ensureMedian(): void {
    if (medianRaw > 0) return;
    const vals = Object.values(WAR_TYPES).map(rawPower).filter(v => v > 0).sort((a, b) => a - b);
    medianRaw = vals.length ? vals[Math.floor(vals.length / 2)] : 1;
}

/** 取某兵种的战力明细；没有属性或非战斗单位返回 undefined。 */
export function getCombatPower(unitId: string): PowerBreakdown | undefined {
    const u = WAR_TYPES[unitId];
    if (!u) return undefined;
    const raw = rawPower(u);
    if (raw <= 0) return undefined;
    ensureMedian();
    if (!refs) refs = computeRefAttacks();
    const dps = (u.atk / (u.reload > 0 ? Math.max(u.reload, MIN_RELOAD) : ONESHOT_WINDOW)) * rangeFactor(u.rng);
    const soak = (ref: number, armor: number) => ref / Math.max(ref - armor, 1);
    const ehp = u.hp * 0.5 * (soak(refs.melee, u.meleeArmor) + soak(refs.pierce, u.pierceArmor));
    return { dps, ehp, raw, index: Math.round((raw / medianRaw) * 100) };
}

/** 军团（三排编成）战力。 */
export interface LegionPower {
    /** 军团战力指数：按格位人数加权平均，口径与单兵一致（全表中位兵 = 100）。 */
    index: number;
    /** 逐排明细，顺序就是编成里的格位顺序（前排 / 中坚 / 后排）。 */
    rows: Array<{ type: string; name: string; count: number; index: number | null }>;
    /** 编成里有几个人查不到战力（旧 ID / 非战斗单位），用来在界面上提示口径不全。 */
    unknownCount: number;
}

/** 远程集火系数：一格里远程兵越多，收益越超线性。
 *
 *  🔴 [2026-09-07 主人提「远程是不是应该提高点战力，很多弓手在一起很可怕的」]
 *     这是**兰彻斯特平方律 vs 线性律**的差别，压不进单兵战力，只能放在军团层：
 *     - 远程：9 个人能同时对同一个目标射击 → 火力叠加，收益随人数超线性（平方律）
 *     - 近战：只有接触面那一排能打到人，后面的人在排队 → 收益随人数线性
 *     所以「4 个弓手」远不止「1 个弓手 × 4」，而「4 个剑士」基本就是 4 倍。
 *
 *  ⚠️ 单兵层的射程系数（RANGE_K）解决的是另一件事——远程挨打少、能白打几轮。
 *     那个已经把远程类中位从 73 抬到 102（现已高于步兵 92），不是这里要补的窟窿。
 *     这里补的是**扎堆**：同样是远程，占 4 格和占 2 格不是一回事。
 *
 *  MASS_K = 0.08：4 人格 ×1.24、3 人格 ×1.16、2 人格 ×1.08。
 *  实测全表带内数不变（118/131），弓手多的军团涨 16~23（高丽/缅族/京族/奥斯曼）。
 *  想让扎堆弓手更可怕就调大它。 */
const MASS_K = 0.08;
function massFactor(u: WarType | undefined, count: number): number {
    return u && u.rng > 0 && count > 1 ? 1 + MASS_K * (count - 1) : 1;
}

/**
 * 算一支军团的综合战力。
 *
 * 口径 = Σ(每格兵种战力 × 该格人数) ÷ 总人数（编成恒为 9 人，见「编成九格位总和必须=9」）。
 * 用加权**平均**而不是加总：人数恒定 9 的前提下两者只差一个常数，但平均值和单兵战力同一把尺子，
 * 「军团 165」可以直接跟「游侠 165」比，加总就没这个直觉了。
 *
 * ⚠️ 同样不含相克，也不含阵型/站位的战术收益 —— 前排扛伤、后排输出这些由 13 的实际交战决定，
 *    压不进一个静态数。这个分数回答的是「这支编成的兵，单位质量有多高」。
 */
export function getLegionPower(slots: Array<{ type: string; count: number }>): LegionPower | undefined {
    if (!slots || slots.length === 0) return undefined;
    let weighted = 0, people = 0, unknownCount = 0;
    const rows: LegionPower['rows'] = [];
    for (const s of slots) {
        const count = s.count ?? 0;
        const p = getCombatPower(s.type);
        rows.push({ type: s.type, name: WAR_TYPES[s.type]?.name ?? s.type, count, index: p?.index ?? null });
        people += count;
        if (p) weighted += p.index * count * massFactor(WAR_TYPES[s.type], count);
        else unknownCount += count;
    }
    if (people <= 0) return undefined;
    // 分母只算查得到战力的人，免得一个查不到的格位把整支军团的分数拖低
    const known = people - unknownCount;
    return { index: known > 0 ? Math.round(weighted / known) : 0, rows, unknownCount };
}

/** 当前使用的参考攻击值，界面上要标出来（换了参考值排名会变，得让人看得见）。 */
export function getPowerRefs(): { melee: number; pierce: number } {
    if (!refs) refs = computeRefAttacks();
    return refs;
}
