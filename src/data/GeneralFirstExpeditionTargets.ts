/**
 * GeneralFirstExpeditionTargets.ts — 名将「历史首征目标」（generalId → 目标 cityId）
 *
 * 设计（2026-07；GAME_DIRECTION 远征细则扩充）：
 *   为增强慢直播叙事，给史料铁案的名将设一个「历史宿命」首征目标——
 *   要么是青史封禅之战（封狼居胥/直捣黄龙），要么是反攻宿敌老巢（李舜臣→秀吉、
 *   吴起→秦锐士天水、陈国峻→忽必烈上都）。
 *
 * 运行时规则（见 ExpeditionUI）：
 *   名将军团每次够兵力远征时先看其历史目标 H：
 *     · H 不在己方手里（没打下 / 打下后又被夺回）→ 默认锁定 H（面板高亮「⭐历史使命」，仍可改选文化中心）
 *     · H 已在己方手里（攥稳了）              → 转为选文化中心（现有逻辑）
 *     · 该名将没配历史目标                     → 直接走文化中心
 *   即历史目标 = 该名将的执念，反复拉锯直至稳定占领。
 *
 * 锚定：绑 generalId（执念跟名将本人走，不随占城易主）。军团 Army.generalId 存在且
 *   命中本表 → 触发历史目标逻辑。仅对跟拍军团生效（玩家干预通道）。
 *
 * 收录门槛：优先 T0/T1 且史料铁案。目标据点须 cities_v2 已存在（不为此新建据点）。
 * 本批 = 14 个 T0（传奇名将）。T1 后续照同一标准分批补入。
 */

export interface GeneralFirstTarget {
    /** 历史首征目标据点（cities_v2 的 cityId） */
    cityId: string;
    /** 直播看点 / 史料一句话（面板与横幅展示用） */
    label: string;
}

/** generalId → 历史首征目标。仅收史料铁案；找不到合格目标的名将不入表（走文化中心）。 */
export const GENERAL_FIRST_EXPEDITION_TARGETS: Readonly<Record<string, GeneralFirstTarget>> = {
    // ── T0 传奇名将（14）──────────────────────────────
    suzhou_huoqubing: { cityId: 'city_langjuxu', label: '封狼居胥' },        // 霍去病·肃州
    yue_d_yuefei: { cityId: 'city_fuyu', label: '直捣黄龙' },                // 岳飞·岳家
    xichu_xiangyu: { cityId: 'city_changan', label: '入关灭秦' },            // 项羽·西楚
    tang_lishimin: { cityId: 'city_hulaoguan', label: '虎牢擒两王' },        // 李世民·唐
    sambyeol_lishunchen: { cityId: 'city_himeji', label: '跨海讨秀吉' },     // 李舜臣·沃州
    yuwen_yuwentai: { cityId: 'city_changan', label: '入主关中' },           // 宇文泰·宇文
    dingxiang_d_lijing: { cityId: 'city_shengle', label: '夜袭定襄' },       // 李靖·定襄
    dajin_wanyanaguda: { cityId: 'city_linhuang', label: '灭辽取都' },       // 完颜阿骨打·大金
    manzhou_d_duoergun: { cityId: 'city_beijing', label: '入关定鼎' },       // 多尔衮·大清
    menggu_d_chengjisihan: { cityId: 'city_samaerhan', label: '西征花剌子模' }, // 成吉思汗·蒙古
    lulin_liuxiu: { cityId: 'city_luoyang', label: '光武中兴' },             // 刘秀·绿林
    zhong_xiexuan: { cityId: 'city_luoyang', label: '北府北伐' },            // 谢玄·寿州
    wei_wuqi: { cityId: 'city_tianshui', label: '魏武卒破秦' },              // 吴起·魏
    dayue_chenguojun: { cityId: 'city_shangdu', label: '反攻忽必烈' },       // 陈国峻·大越
};

/** 查名将的历史首征目标；无则返回 null。 */
export function getGeneralFirstTarget(generalId?: string | null): GeneralFirstTarget | null {
    if (!generalId) return null;
    return GENERAL_FIRST_EXPEDITION_TARGETS[generalId] ?? null;
}
