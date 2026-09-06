/**
 * 兵种综合战力（单一数字，只给「兵种鉴赏」横向粗排序用）。
 *
 * 🔴 这不是八环有效战力，不参与任何战斗结算，改这里不影响平衡。
 *
 * 算法 = 兰彻斯特式 √(有效输出 × 有效血)：
 *   有效输出 = 攻 / 装填 × 射程系数
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

/** 射程系数：每格射程给的加成。远程能白打几轮，但收益递减，取一个温和的线性值。
 *  这是本文件唯一的经验参数，想让远程更值钱就调大它。 */
const RANGE_K = 0.05;

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

    const dps = (u.atk / (u.reload > 0 ? Math.max(u.reload, MIN_RELOAD) : ONESHOT_WINDOW)) * (1 + RANGE_K * (u.rng / 40));

    // AoE2 护甲是减法且最低吃 1 点伤，所以折算 = 参考攻击 / max(参考攻击 - 护甲, 1)
    const soak = (ref: number, armor: number) => ref / Math.max(ref - armor, 1);
    const ehp = u.hp * 0.5 * (soak(refs.melee, u.meleeArmor) + soak(refs.pierce, u.pierceArmor));

    return Math.sqrt(dps * ehp);
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
    const dps = (u.atk / (u.reload > 0 ? Math.max(u.reload, MIN_RELOAD) : ONESHOT_WINDOW)) * (1 + RANGE_K * (u.rng / 40));
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
        if (p) weighted += p.index * count;
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
