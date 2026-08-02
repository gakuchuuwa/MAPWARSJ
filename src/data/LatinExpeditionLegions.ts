/**
 * 拉丁文化区远征精锐军团名（LATIN / RegionSystem，2026-08-01 新增）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const LATIN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T1 功勋之兵 ──
    luoma_diguo: { name: '罗马军团', tier: 1 },          // 罗马城·大西庇阿：征服地中海，建制千年
    maqidun: { name: '马其顿方阵', tier: 1 },          // 萨洛尼卡·亚历山大：征服波斯

    // ── T2 特色之兵 ──
    buni: { name: '迦太基军', tier: 2 },          // 迦太基·汉尼拔：坎尼经典
    xila: { name: '雅典海军', tier: 2 },          // 雅典·地米斯托克利：萨拉米斯
    lagoniya: { name: '斯巴达重装', tier: 2 },          // 斯巴达·列奥尼达：普拉提亚
    boootiya: { name: '底比斯圣队', tier: 2 },          // 底比斯·伊巴密浓达：留克特拉
    yadelaiya: { name: '威尼斯舰队', tier: 2 },          // 威尼斯·丹多洛
    aquidan: { name: '黑太子军', tier: 2 },          // 波尔多·黑太子：普瓦捷
    mulabite: { name: '穆拉比特军', tier: 2 },          // 马拉喀什·塔什芬
    aguelabu: { name: '阿拉伯军', tier: 2 },          // 凯鲁万·奥克巴：北非征服
    luodesi: { name: '医院骑士', tier: 2 },          // 罗得城·德米特里：1522守岛
    maerta_qishi: { name: '马耳他骑士', tier: 2 },          // 马耳他·拉·瓦莱特：1565大围攻以少胜多

    // ── T3 风土之兵 ──
    liguliya: { name: '热那亚海军', tier: 3 },          // 热那亚·安德烈亚
    lunbadi: { name: '米兰弩手', tier: 3 },          // 米兰·斯福尔扎
    gaolu: { name: '法兰西骑士', tier: 3 },          // 巴黎·查理七世
    langgeduoke: { name: '图卢兹军', tier: 3 },          // 图卢兹·雷蒙四世
    jiatailuoniya: { name: '阿拉贡军', tier: 3 },          // 巴塞罗那·海梅
    guadaer: { name: '圣地亚哥', tier: 2 },          // 塞维利亚·费尔南多：1170卡斯蒂利亚军事修会，格拉纳达战争主力（2026-08-02 原卡斯蒂军T3升）
    andaluoxiya: { name: '安达卢军', tier: 3 },          // 科尔多瓦·阿卜杜拉
    putaoya: { name: '葡萄牙军', tier: 3 },          // 里斯本·阿方索·恩里克
    babali: { name: '巴巴里军', tier: 3 },          // 阿尔及尔·巴巴罗萨
    telibolisi: { name: '的黎波里军', tier: 3 },          // 的黎波里·德拉古特
    bohepingyuan: { name: '东哥特军', tier: 3 },          // 维罗纳·狄奥多里克
    kejila: { name: '科基拉水军', tier: 3 },          // 科孚·舒伦堡：希腊仅次于雅典的第二海军强国（修昔底德），前433西波塔海战
    donggete: { name: '拉文纳军', tier: 3 },          // 拉文纳·狄奥多里克
    anuo: { name: '比萨海军', tier: 3 },          // 比萨·乌戈里诺
    balunxiya: { name: '瓦伦西亚军', tier: 3 },          // 巴伦西亚·熙德

    // ── T4 存在之兵 ──
    kanpaniya: { name: '那不勒斯军', tier: 4 },          // 那不勒斯·卡洛
    tuosikana: { name: '佛罗伦萨军', tier: 4 },          // 佛罗伦萨·洛伦佐
    xixiliwangguo: { name: '西西里军', tier: 4 },          // 巴勒莫·腓特烈二世
    gaolu_luoma: { name: '法兰西军', tier: 4 },          // 里昂·克洛维
    xigete: { name: '托莱多军', tier: 4 },          // 托莱多·阿方索六世
    nasier: { name: '格拉纳达军', tier: 4 },          // 格拉纳达·穆罕默德
    feiniqi: { name: '腓尼基军', tier: 3 },          // 加的斯·哈米尔卡
    yidelisi: { name: '伊德里斯军', tier: 4 },          // 非斯·伊德里斯
    xilagu: { name: '叙拉古军', tier: 4 },          // 锡拉库萨·阿加索克利
    leangongguo: { name: '莱昂军', tier: 4 },          // 萨拉曼卡·阿方索九世
    moxina: { name: '梅西纳军', tier: 4 },          // 梅西纳·罗杰
    alagong: { name: '萨拉戈萨军', tier: 4 },          // 萨拉戈萨·海梅
    zhibuluotuo: { name: '休达军', tier: 4 },          // 休达·恩里克
    zhayan: { name: '扎扬军', tier: 4 },          // 特莱姆森·亚里摩罗
    hamade: { name: '哈马德军', tier: 4 },          // 布佳亚·哈马德
    sading: { name: '撒丁军', tier: 4 },          // 卡利亚里·埃莱奥诺拉
    jileinaijia: { name: '昔兰尼加军', tier: 4 },          // 班加西·马加斯
    kelite: { name: '克里特军', tier: 4 },          // 诺索斯·米诺斯
    aermolika: { name: '南特军', tier: 4 },          // 南特·吉尔德雷斯
    bulietani: { name: '雷恩军', tier: 4 },          // 雷恩·阿兰
    puluowangsi: { name: '教皇军', tier: 4 },          // 阿维尼翁·雷蒙
    fulandesi: { name: '加莱军', tier: 4 },          // 加莱
    mengtainiya: { name: '蒙泰尼亚军', tier: 2 },          // 布加勒斯特·巴萨拉布
};
