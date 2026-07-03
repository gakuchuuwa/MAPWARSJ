/**
 * 武将技标签化 — AI / 脚本分配 GENERAL_PROFILES 时的唯一参考
 *
 * 用法（配额优先，禁止「先配再均化」）：
 *   1. 统计池子 → computeDistributionTargets
 *   2. 硬约束将 → HARD_LOCKED_TACTICAL_ASSIGNMENTS 先锁定
 *   3. 柔性将 → 史料允许的 archetype 中 pickFlexibleArchetype（低位优先）
 *   4. 批量写入前 → auditTacticalDistribution
 *
 * 批量 Prompt：见 SKILL_ASSIGNMENT_PROMPT
 */

import { GENERAL_PROFILES, type GeneralTier } from './GeneralSkills';

/** 五种战术风格（名将①–⑤ 与 普将⑥–⑩ 一一对应） */
export type SkillArchetype =
    | 'steadfast_counter'   // 胜战计：稳健/防反
    | 'mobile_raid'         // 敌战计：机动/奇袭
    | 'assault_break'       // 攻战计：猛将/突击
    | 'stratagem_weaken'    // 混战计：智将/谋略
    | 'siege_hold';         // 败战计：死守/殿后

export interface TacticalSkillTagEntry {
    tacticalId: string;
    grid: string;
    displayName: string;
    tier: GeneralTier;
    archetype: SkillArchetype;
    /** 计略类型（策划用） */
    categoryLabel: string;
    /** AI 匹配用行为标签 */
    tags: readonly string[];
    /** 百科/传记常见关键词 */
    aiKeywords: readonly string[];
    /** 人设一句话 */
    portrait: string;
    /** 史料举例（非穷举） */
    examples: readonly string[];
    /** 分配红线 / 易误判备注（④⑨ 等必填） */
    assignmentNote?: string;
}

/** 名将品阶判定关键词 */
export const FAMOUS_TIER_KEYWORDS = [
    '主帅',
    '统帅',
    '开国',
    '武庙',
    '改变历史进程',
    '关键性战役',
    '开创性战术',
    '历史评价极高',
] as const;

/** 普将品阶判定关键词 */
export const ORDINARY_TIER_KEYWORDS = [
    '偏将',
    '先锋',
    '太守',
    '麾下干将',
    '局部战役',
    '历史着墨较少',
    '缺乏全局统帅',
] as const;

/**
 * 分配工作流（配额优先 — 解决「先配的占优、后配的硬塞」）
 *
 * 错误：逐个写入 GENERAL_PROFILES → 事后 grep 均化
 * 正确：先定目标分布 → 硬锁定 → 柔性填位 → 提交前审计
 */
export const ASSIGNMENT_WORKFLOW = [
    '第一步：统计池子 — 名将数 N、普将数 M；computeDistributionTargets(N,M)',
    '第二步：硬约束将 — HARD_LOCKED_TACTICAL_ASSIGNMENTS 先写入，不参与柔性填位',
    '第三步：柔性将 — 列出史料允许的 2–3 个 archetype，pickFlexibleArchetype 取当前计数最低者',
    '第四步：战略格（仅名将）— 对 S①–S⑥ 单独跑一遍低位优先（与战术格独立配额）',
    '第五步：批量提交前 — auditTacticalDistribution；超 DISTRIBUTION_MAX_SHARE 则三步回溯 BACKTRACK_WORKFLOW',
] as const;

/** 单技能占同池比例上限（批量提交门禁；④ 见 TAC04_QUOTA_EXEMPT） */
export const DISTRIBUTION_MAX_SHARE = 0.25;

/** 各技能目标人数允许偏差（相对均分） */
export const DISTRIBUTION_TOLERANCE = 3;

/** ④ 不服从「凑满均分」— 无合格史料则全图可仅 0–2 人，禁止为配额硬塞 */
export const TAC04_QUOTA_EXEMPT = true;

/**
 * 硬约束战术（证据只能指向唯一 archetype / 战术格，不参与柔性填位）
 * 收录将领须在 GENERAL_PROFILES；未收录者入池前按同规则锁定。
 */
export const HARD_LOCKED_TACTICAL_ASSIGNMENTS: Readonly<
    Record<string, { archetype: SkillArchetype; evidence: string }>
> = {
    aisin_d_huangtaiji: { archetype: 'stratagem_weaken', evidence: '松锦战后洪承畴部归降' },
    qin_baiqi: { archetype: 'assault_break', evidence: '鄢郢水攻、长平正面歼灭' },
    han_d_hanxin: { archetype: 'mobile_raid', evidence: '暗度陈仓定三秦（主格②，非③）' },
    // 张巡等未入池；入池时：zhangxun → siege_hold / 睢阳死守
};

/**
 * 单一标签将 — 史料仅支持一个 archetype，回溯时不可改配（与 HARD_LOCKED 同级保护）
 * generalId → 锁定 archetype
 */
export const SINGLE_TAG_IMMUTABLE_ASSIGNMENTS: Readonly<
    Record<string, { archetype: SkillArchetype; evidence: string }>
> = {
    // 仅③合理
    menggu_d_chengjisihan: { archetype: 'assault_break', evidence: '蒙古西征铁骑奔袭' },
    sanada_d_zhentianxingcun: { archetype: 'assault_break', evidence: '大阪夏之阵赤备突击' },
    satsuma_daojinjiajiu: { archetype: 'assault_break', evidence: '冲冠编队儿岛突击' },
    baiji_jiebai: { archetype: 'assault_break', evidence: '车昌野隘突击' },
    dajin_wanyanaguda: { archetype: 'assault_break', evidence: '阿骨打破辽神速突击' },
    // 仅②合理
    owari_zhitianxinchang: { archetype: 'mobile_raid', evidence: '桶狭间奇袭破今川' },
    aki_maoliyuanjiu: { archetype: 'mobile_raid', evidence: '严岛夜袭少胜多' },
    fujiwara_yuanyijing: { archetype: 'mobile_raid', evidence: '屋岛冲夜袭' },
};

/** 不可回溯改配：硬锁 ∪ 单一标签 */
export function isTacticalAssignmentImmutable(generalId: string): boolean {
    return generalId in HARD_LOCKED_TACTICAL_ASSIGNMENTS || generalId in SINGLE_TAG_IMMUTABLE_ASSIGNMENTS;
}

/**
 * 三步回溯法（配额超标时消化存量，禁止动不可动将）
 *
 * 1. 标不可动 — HARD_LOCKED + SINGLE_TAG_IMMUTABLE
 * 2. 找双标签柔性将 — 从 audit 超标 tacticalId 出发，须有第二 archetype 战役证据
 *    ⚠️ 迁出目标须选「当前计数偏低」的 archetype，禁止无脑 ③→②（会加剧②超标）
 * 3. auditTacticalDistribution 验证 — 名将池每格 ≤ DISTRIBUTION_MAX_SHARE（④ 除外）
 */
export const BACKTRACK_WORKFLOW = [
    '第一步：合并 HARD_LOCKED + SINGLE_TAG_IMMUTABLE，标记不可动',
    '第二步：对 violations 中超标技能，在可动将里找双标签候选；迁往计数最低的合格 archetype',
    '第三步：auditTacticalDistribution()；仍超标则换下一批柔性将，禁止动不可动将',
] as const;

/** 双标签柔性将范例（回溯时参考；写入 GENERAL_PROFILES 注释） */
export const BACKTRACK_FLEXIBLE_EXAMPLES = [
    {
        generalId: 'zhelemei',
        from: 'assault_break',
        to: 'mobile_raid',
        evidence: '四獒轻骑侦察/奇袭救主，非正面冲锋',
    },
    {
        generalId: 'chuormahan',
        from: 'assault_break',
        to: 'mobile_raid',
        evidence: '西征波斯快速穿插，非决战突击',
    },
    {
        generalId: 'afuzhiluo',
        from: 'mobile_raid',
        to: 'steadfast_counter',
        evidence: '率部西迁建国，先稳后打',
    },
] as const;

/**
 * 柔性填位 tie-break（仅当 PRIMARY_ARCHETYPE_PRIORITY 无法唯一决断时启用）
 *
 * 优先级：
 *   1. 史料 — 某 archetype 无合格战役证据 → 不得入选
 *   2. PRIMARY_ARCHETYPE_PRIORITY — 能唯一决出主风格 → 用主风格
 *   3. 本规则 — 剩余 2+ 个仍皆合格 → 选 GENERAL_PROFILES 当前同品阶池计数最低者
 *   4. 仍并列 → 按 archetype 固定序 steadfast < mobile < assault < stratagem < siege
 *
 * 禁止：为拉低计数把唯一证据指向③的将改配①。
 */
export const FLEXIBLE_ARCHETYPE_TIEBREAKER = {
    rule: '史料合格的多 archetype 候选中，选当前 GENERAL_PROFILES 同 tier 计数最低者',
    orderWhenStillTied: [
        'steadfast_counter',
        'mobile_raid',
        'assault_break',
        'stratagem_weaken',
        'siege_hold',
    ] as const satisfies readonly SkillArchetype[],
} as const;

/** 按名将/普将人数计算战术五格目标人数（各 ± DISTRIBUTION_TOLERANCE） */
export function computeDistributionTargets(famousCount: number, ordinaryCount: number): {
    famous: Record<SkillArchetype, { target: number; min: number; max: number }>;
    ordinary: Record<SkillArchetype, { target: number; min: number; max: number }>;
} {
    const build = (total: number) => {
        const base = Math.floor(total / 5);
        const rem = total % 5;
        const targets = FLEXIBLE_ARCHETYPE_TIEBREAKER.orderWhenStillTied.map((_, i) =>
            base + (i < rem ? 1 : 0),
        );
        return Object.fromEntries(
            FLEXIBLE_ARCHETYPE_TIEBREAKER.orderWhenStillTied.map((arch, i) => [
                arch,
                {
                    target: targets[i],
                    min: Math.max(0, targets[i] - DISTRIBUTION_TOLERANCE),
                    max: targets[i] + DISTRIBUTION_TOLERANCE,
                },
            ]),
        ) as Record<SkillArchetype, { target: number; min: number; max: number }>;
    };
    return { famous: build(famousCount), ordinary: build(ordinaryCount) };
}

/** 统计 GENERAL_PROFILES 战术格分布（可按 tier 过滤） */
export function countTacticalByArchetype(
    tier?: GeneralTier,
    profiles: Record<string, { tier: GeneralTier; tacticalSkillId: string }> = GENERAL_PROFILES,
): Record<SkillArchetype, number> {
    const counts: Record<SkillArchetype, number> = {
        steadfast_counter: 0,
        mobile_raid: 0,
        assault_break: 0,
        stratagem_weaken: 0,
        siege_hold: 0,
    };
    const tacticalToArchetype = Object.fromEntries(
        TACTICAL_SKILL_TAGS.map((e) => [e.tacticalId, e.archetype]),
    ) as Record<string, SkillArchetype>;
    for (const p of Object.values(profiles)) {
        if (tier && p.tier !== tier) continue;
        const arch = tacticalToArchetype[p.tacticalSkillId];
        if (arch) counts[arch]++;
    }
    return counts;
}

/** 柔性将：在合格 archetype 中选当前计数最低者（见 FLEXIBLE_ARCHETYPE_TIEBREAKER） */
export function pickFlexibleArchetype(
    tier: GeneralTier,
    candidates: readonly SkillArchetype[],
    profiles: Record<string, { tier: GeneralTier; tacticalSkillId: string }> = GENERAL_PROFILES,
): SkillArchetype {
    if (candidates.length === 0) {
        throw new Error('pickFlexibleArchetype: 无合格 archetype 候选');
    }
    if (candidates.length === 1) return candidates[0];
    const counts = countTacticalByArchetype(tier, profiles);
    const sorted = [...candidates].sort((a, b) => {
        const diff = counts[a] - counts[b];
        if (diff !== 0) return diff;
        return (
            FLEXIBLE_ARCHETYPE_TIEBREAKER.orderWhenStillTied.indexOf(a) -
            FLEXIBLE_ARCHETYPE_TIEBREAKER.orderWhenStillTied.indexOf(b)
        );
    });
    return sorted[0];
}

export interface DistributionAuditViolation {
    tier: GeneralTier;
    tacticalId: string;
    count: number;
    share: number;
    maxShare: number;
}

/** 批量提交前审计：任一技能占比 > DISTRIBUTION_MAX_SHARE 则违规（④ 除外） */
export function auditTacticalDistribution(
    profiles: Record<string, { tier: GeneralTier; tacticalSkillId: string }> = GENERAL_PROFILES,
): { ok: boolean; violations: DistributionAuditViolation[] } {
    const violations: DistributionAuditViolation[] = [];
    for (const tier of ['famous', 'ordinary'] as const) {
        const pool = Object.values(profiles).filter((p) => p.tier === tier);
        const total = pool.length;
        if (total === 0) continue;
        const byTac: Record<string, number> = {};
        for (const p of pool) {
            byTac[p.tacticalSkillId] = (byTac[p.tacticalSkillId] ?? 0) + 1;
        }
        for (const [tacticalId, count] of Object.entries(byTac)) {
            if (TAC04_QUOTA_EXEMPT && tacticalId === 'tac_04') continue;
            const share = count / total;
            if (share > DISTRIBUTION_MAX_SHARE) {
                violations.push({ tier, tacticalId, count, share, maxShare: DISTRIBUTION_MAX_SHARE });
            }
        }
    }
    return { ok: violations.length === 0, violations };
}

/** 首选证据：理由必须引用正史具体战役，禁止空泛套话 */
export const ASSIGNMENT_EVIDENCE_RULE = {
    required: '至少一场正史可考的具体战役（战役名 + 关键行动）',
    bannedPhrases: [
        '以XX著称',
        '擅长XX',
        '善于XX',
        '著名将领',
        '一代名将',
        '用兵如神',
    ],
    goodExample: '暗度陈仓：明修栈道，暗出陈仓道奇袭三秦',
    badExample: '韩信擅长奇袭',
} as const;

/**
 * 跨界将领主风格：多 archetype 皆沾边时，按战役级别取主风格
 * 以传记/正史篇幅最大、最具代表性的那一役为准
 */
export const PRIMARY_ARCHETYPE_PRIORITY = [
    {
        rank: 1,
        label: '改变历史进程',
        hint: '灭国、开国、扭转天下格局',
    },
    {
        rank: 2,
        label: '战术精湛且史著详载',
        hint: '奇袭/会战名役，篇幅次于开国级但仍为一世标签',
    },
    {
        rank: 3,
        label: '局部胜利',
        hint: '偏师、一役之功；不足则降品阶或普将池',
    },
] as const;

/** ④ 不战而屈 — 史实门槛（最易误判） */
export const STRATAGEM_TAC04_GATE = {
    requirement: '正史须有「未战而降 / 不攻自破 / 遣使说退敌军」类记载，敌未经过该将主力决战即瓦解',
    positiveExamples: [
        '韩信遣使说燕，燕从风而靡',
        '郭子仪单骑入回纥营，联军自退',
    ],
    negativeExamples: [
        '周瑜火烧赤壁——有大战，非不战而降 → ②避实击虚 或 ③（视主攻方式）',
        '诸葛亮七擒孟获——攻心但七次交战 → ②或①，非④',
        '贾诩火烧赤壁级谋攻——凡「用火/断粮后仍决战」→ ②③⑨，非④',
    ],
    fallback: '打了仗才赢 → ②（奇袭机动）或 ③（正面猛攻）；普将断粮离间 → ⑨',
} as const;

/** ⑨ 釜底抽薪 — 普将谋略（打了仗但削弱根本） */
export const STRATAGEM_TAC09_NOTE = {
    scope: '战中或战前断粮、离间、烧根，仍可能有交战；与④「不战而降」严格区分',
    positiveExamples: ['断敌粮道后会战', '间谍离间致军心溃后再击'],
    notTac04: '若敌未战即降，名将应考④；若敌已接战，用⑨（普将）或②③（名将）',
} as const;

/** 战术十格标签表（①–⑩） */
export const TACTICAL_SKILL_TAGS: readonly TacticalSkillTagEntry[] = [
    {
        tacticalId: 'tac_01',
        grid: '①',
        displayName: '以逸待劳',
        tier: 'famous',
        archetype: 'steadfast_counter',
        categoryLabel: '胜战计',
        tags: ['后发制人', '防守反击', '治军严明', '消耗敌军锐气', '以静制动'],
        aiKeywords: ['以逸待劳', '坚壁', '拖垮敌军', '固守待变', '养精蓄锐'],
        portrait: '稳健型/防反型',
        examples: ['司马懿', '廉颇', '王翦'],
    },
    {
        tacticalId: 'tac_02',
        grid: '②',
        displayName: '避实击虚',
        tier: 'famous',
        archetype: 'mobile_raid',
        categoryLabel: '敌战计',
        tags: ['善用奇兵', '长途奔袭', '游击机动', '声东击西', '寻找破绽'],
        aiKeywords: ['奇袭', '迂回', '暗度陈仓', '声东击西', '避实击虚'],
        portrait: '机动型/奇袭型',
        examples: ['韩信', '邓艾', '吕蒙'],
    },
    {
        tacticalId: 'tac_03',
        grid: '③',
        displayName: '侵掠如火',
        tier: 'famous',
        archetype: 'assault_break',
        categoryLabel: '攻战计',
        tags: ['身先士卒', '破釜沉舟', '闪电战', '骁勇善战', '骑兵统帅', '高爆发'],
        aiKeywords: ['猛攻', '突击', '铁骑', '摧枯拉朽', '侵掠如火'],
        portrait: '猛将型/破阵型',
        examples: ['项羽', '霍去病', '张辽', '常遇春'],
    },
    {
        tacticalId: 'tac_04',
        grid: '④',
        displayName: '不战而屈',
        tier: 'famous',
        archetype: 'stratagem_weaken',
        categoryLabel: '混战计',
        tags: ['不战而降', '遣使说降', '攻心瓦解', '敌未战先溃'],
        aiKeywords: ['说降', '不战而屈人之兵', '未战先降', '单骑说退'],
        portrait: '智将型/不战屈敌（门槛极高）',
        examples: ['韩信说降燕', '郭子仪单骑说退回纥'],
        assignmentNote:
            '须有降敌不战记载；火烧赤壁、七擒孟获等「打了再赢」→②③⑨，禁配④。见 STRATAGEM_TAC04_GATE',
    },
    {
        tacticalId: 'tac_05',
        grid: '⑤',
        displayName: '不动如山',
        tier: 'famous',
        archetype: 'siege_hold',
        categoryLabel: '败战计',
        tags: ['擅长守城', '坚壁清野', '绝境固守', '殿后掩护', '重装步兵'],
        aiKeywords: ['守城', '坚壁', '死守', '据险', '不动如山'],
        portrait: '坚守型/肉盾型',
        examples: ['曹仁', '张巡', '郝昭'],
    },
    {
        tacticalId: 'tac_06',
        grid: '⑥',
        displayName: '哀兵必胜',
        tier: 'ordinary',
        archetype: 'steadfast_counter',
        categoryLabel: '胜战计',
        tags: ['后发制人', '防守反击', '哀兵', '以弱搏强', '绝境奋起'],
        aiKeywords: ['哀兵', '反击', '死守后反攻', '以少胜多'],
        portrait: '稳健型/防反型（普将）',
        examples: ['杨再兴', '局部守将逆袭'],
    },
    {
        tacticalId: 'tac_07',
        grid: '⑦',
        displayName: '攻其不备',
        tier: 'ordinary',
        archetype: 'mobile_raid',
        categoryLabel: '敌战计',
        tags: ['奇袭', '攻其不备', '游击', '夜袭', '水军奇袭'],
        aiKeywords: ['偷袭', '不备', '奇兵', '伏击'],
        portrait: '机动型/奇袭型（普将）',
        examples: ['潘璋', '乐进', '水军偏将'],
    },
    {
        tacticalId: 'tac_08',
        grid: '⑧',
        displayName: '置之死地',
        tier: 'ordinary',
        archetype: 'assault_break',
        categoryLabel: '攻战计',
        tags: ['置之死地', '陷阵', '决死突击', '先锋破阵'],
        aiKeywords: ['锐卒', '陷阵营', '突击', '破阵'],
        portrait: '猛将型/破阵型（普将）',
        examples: ['高顺', '先登营'],
    },
    {
        tacticalId: 'tac_09',
        grid: '⑨',
        displayName: '釜底抽薪',
        tier: 'ordinary',
        archetype: 'stratagem_weaken',
        categoryLabel: '混战计',
        tags: ['断粮', '离间', '烧根', '削弱根本', '战中谋攻'],
        aiKeywords: ['釜底抽薪', '断粮', '奇谋', '间谍', '烧粮'],
        portrait: '智将型/削弱型（普将，可有交战）',
        examples: ['断粮后会战偏将', '离间致溃再击'],
        assignmentNote:
            '打了仗但断根削弱 →⑨；敌未战即降名将才考④。见 STRATAGEM_TAC09_NOTE',
    },
    {
        tacticalId: 'tac_10',
        grid: '⑩',
        displayName: '深沟高垒',
        tier: 'ordinary',
        archetype: 'siege_hold',
        categoryLabel: '败战计',
        tags: ['深沟高垒', '筑寨', '守城', '偏师固守'],
        aiKeywords: ['深沟高垒', '筑垒', '守寨', '据守'],
        portrait: '坚守型/肉盾型（普将）',
        examples: ['城守太守', '关隘偏将'],
    },
] as const;

/** archetype → 名将战术 id / 普将战术 id */
export const ARCHETYPE_TO_TACTICAL: Record<
    SkillArchetype,
    { famous: string; ordinary: string }
> = {
    steadfast_counter: { famous: 'tac_01', ordinary: 'tac_06' },
    mobile_raid: { famous: 'tac_02', ordinary: 'tac_07' },
    assault_break: { famous: 'tac_03', ordinary: 'tac_08' },
    stratagem_weaken: { famous: 'tac_04', ordinary: 'tac_09' },
    siege_hold: { famous: 'tac_05', ordinary: 'tac_10' },
};

/**
 * 【v1 迁移蓝图 · 2026-07-03】5 风格 × 2 品阶 → 目标 v1 战术技（ts_xxx）
 *
 * 旧 10 格（tac_xx）→ 新 49 技（ts_xxx）的分配总图。武将风格已由现挂的 tac 编号
 * 决定（见 ARCHETYPE_TO_TACTICAL），迁移时按本表把每个风格槽整体换成对应 v1 技。
 *
 * engineReady = 该 v1 技当前是否已在 BattleField 引擎生效：
 *   · true  → 命运系(ts_012~020)/战损系(ts_031~041)/逆局重算：施加点已接，可直接迁移
 *   · false → 强化系(ts_001~011)/兵力系(ts_021~030)/对抗系(ts_042~048)/士气系(ts_049)：
 *             引擎尚无 v1 施加点，须先接引擎再迁，否则效果凭空消失（削弱）
 *
 * 迁移顺序：先迁 engineReady=true 的 7 槽（稳健/突击/死守 + 谋略普将），
 *          再接强化/兵力/对抗引擎，解锁机动系与谋略名将。
 * 选型依据：风格语义 + 引擎就绪优先；名将槽取更主动/上限更高的技，普将槽取保底/情境技。
 */
export const ARCHETYPE_TO_V1_TACTICAL: Record<
    SkillArchetype,
    {
        famous: { id: string; displayName: string; engineReady: boolean; reason: string };
        ordinary: { id: string; displayName: string; engineReady: boolean; reason: string };
    }
> = {
    // 稳健防反：稳字当头，消方差 / 战后恢复
    steadfast_counter: {
        famous: { id: 'ts_014', displayName: '步步为营', engineReady: true, reason: 'luck 锁 1.0，稳扎稳打不浪' },
        ordinary: { id: 'ts_035', displayName: '休养生息', engineReady: true, reason: '战后恢复 50%，防反续航' },
    },
    // 机动奇袭：先手削敌真实兵（兵力系，待接引擎）
    mobile_raid: {
        famous: { id: 'ts_022', displayName: '攻其不备', engineReady: false, reason: '开局削敌 20%（兵力系待接引擎）' },
        ordinary: { id: 'ts_021', displayName: '先声夺人', engineReady: false, reason: '开局削敌 10%（兵力系待接引擎）' },
    },
    // 突击破阵：决死博命方差（命运系）
    assault_break: {
        famous: { id: 'ts_013', displayName: '背水一战', engineReady: true, reason: '无条件 luck[0.65,1.35]，主动博命' },
        ordinary: { id: 'ts_018', displayName: '死地后生', engineReady: true, reason: '劣势时 luck[0.5,1.5]，绝境搏杀' },
    },
    // 智将谋略：否决敌技（对抗系待接）/ 断敌恢复（战损系已接）
    stratagem_weaken: {
        famous: { id: 'ts_042', displayName: '料敌机先', engineReady: false, reason: '完全否决敌战术技（对抗系待接引擎）' },
        ordinary: { id: 'ts_039', displayName: '斩草除根', engineReady: true, reason: '我败令胜方战后不恢复，削敌根本' },
    },
    // 死守殿后：胜则省兵 / 败则咬人（战损系）
    siege_hold: {
        famous: { id: 'ts_031', displayName: '游刃有余', engineReady: true, reason: '胜方战损 -30%，守城名将省兵存活' },
        ordinary: { id: 'ts_033', displayName: '困兽犹斗', engineReady: true, reason: '败时胜方战损 ×1.5，边陲死守让敌肉疼' },
    },
};

/**
 * 【v1 战术技 → 风格映射 · 2026-07-03】49 技各归 5 风格（唯一主 archetype）
 *
 * 用途：武将已从 tac_01~10 迁移到 ts_xxx，旧 TACTICAL_SKILL_TAGS 只认 tac，
 * 导致 countTacticalByArchetype / auditTacticalDistribution 对 ts 全部失效。
 * 本表补全断层，供审计与分配脚本反推每将风格。
 *
 * 归类依据 = 技能语义（非机械按 series）：
 *   稳健防反：无条件强化/luck 锁/恢复/逆局续航
 *   机动奇袭：开局削敌真实兵 / 平原长驱
 *   突击破阵：正面强攻/博命方差/自损突击/首战爆发
 *   智将谋略：否决夺技/断敌恢复/以寡智取/扰敌
 *   死守殿后：战损减免/守城/败时咬人/逆局重算
 * hook 技（ts_009 扫穴犁庭 / ts_046 暗度陈仓 / ts_047 声东击西）引擎未接，不参与武将分配。
 */
export const TS_V1_ARCHETYPE: Readonly<Record<string, SkillArchetype>> = {
    // 稳健防反
    ts_001: 'steadfast_counter', ts_011: 'steadfast_counter',
    ts_014: 'steadfast_counter', ts_015: 'steadfast_counter',
    ts_025: 'steadfast_counter', ts_026: 'steadfast_counter',
    ts_035: 'steadfast_counter', ts_036: 'steadfast_counter',
    // 机动奇袭
    ts_003: 'mobile_raid', ts_021: 'mobile_raid', ts_022: 'mobile_raid',
    ts_023: 'mobile_raid', ts_024: 'mobile_raid', ts_028: 'mobile_raid',
    ts_030: 'mobile_raid',
    // 突击破阵
    ts_005: 'assault_break', ts_007: 'assault_break', ts_010: 'assault_break',
    ts_012: 'assault_break', ts_013: 'assault_break', ts_018: 'assault_break',
    ts_027: 'assault_break', ts_029: 'assault_break', ts_049: 'assault_break',
    // 智将谋略
    ts_002: 'stratagem_weaken', ts_004: 'stratagem_weaken', ts_008: 'stratagem_weaken',
    ts_019: 'stratagem_weaken', ts_039: 'stratagem_weaken',
    ts_042: 'stratagem_weaken', ts_043: 'stratagem_weaken', ts_044: 'stratagem_weaken',
    // 死守殿后
    ts_006: 'siege_hold', ts_016: 'siege_hold', ts_017: 'siege_hold',
    ts_020: 'siege_hold', ts_031: 'siege_hold', ts_032: 'siege_hold',
    ts_033: 'siege_hold', ts_034: 'siege_hold', ts_037: 'siege_hold',
    ts_038: 'siege_hold', ts_040: 'siege_hold', ts_041: 'siege_hold',
    ts_045: 'siege_hold', ts_048: 'siege_hold',
};

/**
 * 普将分散池（每风格 3–5 个「无条件/宽条件」ready 技，温和档）
 *
 * 用于把 506 普将在【保持现有风格】前提下分散到同风格多技，破除「10 种技占 70%」单调。
 * 选池原则：① 仅 ready（不挂 hook/new）② 避开纯地形/攻守限定（防普将「从不放技」）
 *          ③ 强档（兵不血刃-60%/宁为玉碎咬×2/破釜沉舟）留名将，普将用温和档。
 * 名将不走本池（保留已精调的 21 种技分配）。
 */
export const ORDINARY_ARCHETYPE_POOL: Readonly<Record<SkillArchetype, readonly string[]>> = {
    // 稳健：luck 锁 / 微方差 / 逆局续航 / 战后恢复
    steadfast_counter: ['ts_014', 'ts_015', 'ts_011', 'ts_026', 'ts_035'],
    // 机动：开局削敌真实兵（10~20%）
    mobile_raid: ['ts_021', 'ts_022', 'ts_024'],
    // 突击：野战强化 / 劣势博命 / 自损突击
    assault_break: ['ts_007', 'ts_018', 'ts_029'],
    // 死守：战损减免 / 败时咬人（温和档）
    siege_hold: ['ts_031', 'ts_033', 'ts_041'],
    // 谋略：断敌恢复 / 劣势智取（普将现无此风格，备用）
    stratagem_weaken: ['ts_039', 'ts_008'],
};

/** 战略六格简要标签（名将专用；与地形/行军匹配） */
export const STRATEGIC_SKILL_TAGS = [
    { id: 'str_01', grid: 'S①', name: '兵贵神速', tags: ['急行军', '闪击', '远征机动'], terrain: '行军' },
    // S②攻城拔寨已并入 S③所向披靡（2026-06-27）：进攻方专精，攻城/野战通吃
    { id: 'str_03', grid: 'S③', name: '所向披靡', tags: ['攻城', '破城', '野战', '会战', '正面决战'], terrain: '进攻方' },
    { id: 'str_04', grid: 'S④', name: '长驱直入', tags: ['平原', '骑兵', '长驱'], terrain: '平原' },
    { id: 'str_05', grid: 'S⑤', name: '居高临下', tags: ['山地', '山城', '据险'], terrain: '山地' },
    { id: 'str_06', grid: 'S⑥', name: '乘风破浪', tags: ['水战', '渡海', '江面'], terrain: '水域' },
] as const;

/** 按 tacticalId 查标签 */
export function getTacticalSkillTags(tacticalId: string): TacticalSkillTagEntry | null {
    return TACTICAL_SKILL_TAGS.find((e) => e.tacticalId === tacticalId) ?? null;
}

/** 品阶 + 风格 → 战术 id */
export function resolveTacticalId(tier: GeneralTier, archetype: SkillArchetype): string {
    return ARCHETYPE_TO_TACTICAL[archetype][tier === 'famous' ? 'famous' : 'ordinary'];
}

/**
 * 批量分配用 Prompt（复制给 AI）
 * 待评估名单替换末尾列表即可。
 */
export const SKILL_ASSIGNMENT_PROMPT = `【角色设定】
你是资深历史游戏策划，为本项目将领分配武将技（见 GeneralSkillTags.ts）。

【分配顺序 — 配额优先，禁止先配再均化】
1. 统计池子：名将 N、普将 M → computeDistributionTargets(N,M)，各 archetype 目标 ±3
2. 硬锁定：HARD_LOCKED_TACTICAL_ASSIGNMENTS 先写入（如皇太极④、白起③、韩信②）
3. 柔性将：史料允许 2–3 个 archetype 时 → pickFlexibleArchetype（同池计数最低）
4. 战略格：名将另对 S①–S⑥ 独立跑低位优先
5. 提交前：auditTacticalDistribution，任一技能占比 >25% 则回溯（④除外）

【史料 > 配额】
PRIMARY_ARCHETYPE_PRIORITY 能唯一决断 → 不得为凑配额改配。
低位优先仅当多 archetype 皆有合格战役证据时启用。

【技能库】
名将战术 ①–⑤ / 普将战术 ⑥–⑩（镜像）；名将另选战略 S①–S⑥。
③侵掠如火：仅正面强攻一生标签；④全图极少（无史料不凑数）。

【品阶】
名将：主帅/开国/武庙/改变战局。普将：偏将、太守、局部亮点。

【④⑨ 谋略 — 最易误判】
④不战而屈：正史须有「未战而降/不攻自破/说退未战」；火烧赤壁、七擒孟获 → ②③⑨，禁④
⑨釜底抽薪（普将）：断粮离间后仍可交战；与④严格区分

【首选证据 — 强制】
理由须引用≥1场正史具体战役（战役名+关键行动）。
禁：「擅长奇袭」「以XX著称」等空泛句。

【输出格式】
将领名 | tier | tacticalId | strategicId | 理由（战役证据一句）

【待评估名单】
（在此列出将领）`;
