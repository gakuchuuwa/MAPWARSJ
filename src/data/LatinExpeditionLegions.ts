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
    maqidun: { name: '伙伴骑兵', tier: 2 },          // 萨洛尼卡·亚历山大：Hetairoi 伙伴骑兵；避势力「马其顿」叠字

    // ── T2 特色之兵 ──
    // 汉尼拔主力骑臂=努米底亚骑（坎尼等）；圣团属布匿早期，勿绑汉尼拔 → T2
    buni: { name: '努米底亚骑', tier: 2 },
    xila: { name: '萨拉米斯舰', tier: 2 },          // 雅典·地米斯托克利：萨拉米斯海战；避据点「雅典」叠字
    lagoniya: { name: '斯巴达重装', tier: 2 },          // 斯巴达·列奥尼达：普拉提亚
    boootiya: { name: '底比斯圣队', tier: 2 },          // 底比斯·伊巴密浓达：留克特拉
    yadelaiya: { name: '圣马可舰', tier: 2 },          // 威尼斯·丹多洛：圣马可旗/兵工厂；避据点「威尼斯」叠字
    aquidan: { name: '法兰克甲士', tier: 2 },          // 波尔多·黑太子：1356普瓦捷——长弓+下马甲士为主（非骑兵专名；勿与732图尔/查理马特混淆）
    mulabite: { name: '穆拉比特军', tier: 2 },          // 马拉喀什·塔什芬
    aguelabu: { name: '易弗里军团', tier: 2 },          // 凯鲁万·奥克巴：征服易弗里基叶（Ifriqiya）；避势力「阿格拉布」叠字
    luodesi: { name: '医院骑士', tier: 2 },          // 罗得城·德米特里：1522守岛
    maerta_qishi: { name: '马耳他骑士', tier: 2 },          // 马耳他·拉·瓦莱特：1565大围攻以少胜多
    kasidiliya: { name: '卡斯蒂骑', tier: 3 },
    duluo: { name: '葡萄牙骑士', tier: 3 },          // 波尔图·桑乔一世：收复失地十字军骑士

    // ── T3 风土之兵 ──
    liguliya: { name: '利古里亚弩', tier: 3 },          // 热那亚弩手专名；避据点「热那亚」叠字
    lunbadi: { name: '米兰弩手', tier: 3 },          // 米兰·斯福尔扎
    gaolu: { name: '敕令骑兵', tier: 3 },          // 巴黎·查理七世：compagnies d'ordonnance；避势力「法兰西」叠字
    // 图卢兹·雷蒙五世：古名 Tolosa →「托洛萨骑」美化；无战役专名高光，档仍 T4（不抬）
    langgeduoke: { name: '图卢兹骑士', tier: 4 },
    jiatailuoniya: { name: '加泰轻步', tier: 3 },          // 巴塞罗那·海梅：加泰轻装（佣兵团偏罗杰弗洛尔，不同代；阿尔莫加瓦已挂萨拉戈萨）
    guadaer: { name: '圣地亚哥团', tier: 2 },
    andaluoxiya: { name: '安达卢斯骑', tier: 3 },          // 科尔多瓦·阿卜杜拉
    putaoya: { name: '阿维斯骑士', tier: 3 },          // 里斯本·阿方索·恩里克侧阿维斯团（基督骑士已挂休达）
    babali: { name: '巴巴里舰队', tier: 3 },          // 阿尔及尔·巴巴罗萨
    telibolisi: { name: '巴巴里海盗', tier: 3 },          // 的黎波里·德拉古特：北非海盗身份可考 → T3
    // 维罗纳·坎格兰德：斯卡拉家族治军，非「铁骑」专名 → T3
    bohepingyuan: { name: '斯卡拉骑士', tier: 3 },
    kejila: { name: '西波塔舰', tier: 3 },          // 科孚·舒伦堡：前433西波塔海战；避势力「科基拉」叠字
    // 拉文纳·狄奥多里克：493 年攻陷拉文纳、杀奥多亚塞，建东哥特王国，亲卫为其征服主力；
    // 狄奥多里克为日耳曼英雄文学符号（《尼伯龙根之歌》迪特里希），文化知名 → T3（2026-08-03 名将互配升）
    donggete: { name: '狄奥多军团', tier: 3 },
    anuo: { name: '比萨海军', tier: 3 },          // 比萨·乌戈里诺
    balunxiya: { name: '图里亚勇士', tier: 3 },          // 巴伦西亚·熙德：图里亚河畔都城骑兵（避将名熙德）

    // ── T4 存在之兵 ──
    // 那不勒斯·卡洛（安茹）：安茹骑士可考，无「重骑」专名高光 → T3
    kanpaniya: { name: '安茹骑士', tier: 3 },
    // 佛罗伦萨：Bande Nere 黑带军团（乔凡尼·德·美第奇）→ T4
    tuosikana: { name: '黑带军团', tier: 4 },          // 佛罗伦萨·洛伦佐侧：乔凡尼·德·美第奇 Bande Nere
    xixiliwangguo: { name: '西西里重骑', tier: 3 },          // 巴勒莫·腓特烈二世
    gaolu_luoma: { name: '克洛维军团', tier: 3 },          // 里昂·克洛维：墨洛温王庭军；避空泛「墨洛温卫」
    // 托莱多·阿方索六世：1085 收复托莱多，卡斯蒂利亚骑士/骑从为收复失地核心；
    // 文化知名；卡拉特拉瓦团 1158 建晚于其卒年，不挂 → T3（2026-08-03 名将互配升）
    xigete: { name: '卡斯蒂骑士', tier: 3 },
    // 格拉纳达·穆罕默德：纳斯里摩尔骑兵风土 → T3（禁造「阿兰布拉卫」）
    nasier: { name: '摩尔骑', tier: 3 },
    feiniqi: { name: '迦太基圣队', tier: 3 },          // 加的斯·哈米尔卡
    yidelisi: { name: '伊德里斯团', tier: 4 },          // 非斯·伊德里斯：都城军；避据点「非斯」叠字
    xilagu: { name: '希腊重步兵', tier: 4 },          // 锡拉库萨·阿加索克利
    leangongguo: { name: '莱昂骑士', tier: 4 },          // 萨拉曼卡·阿方索九世
    // 梅西纳·罗杰一世：诺曼骑士征服西西里海峡 → T2
    moxina: { name: '诺曼骑士', tier: 2 },
    // 萨拉戈萨·海梅一世：阿尔莫加瓦（Almogávares）突袭轻装 → T2
    alagong: { name: '阿尔莫加瓦', tier: 2 },
    // 休达·恩里克：基督骑士团大团长（非阿维斯）→ T2
    zhibuluotuo: { name: '基督骑士', tier: 2 },
    zhayan: { name: '特莱姆森骑', tier: 4 },          // 特莱姆森·亚格姆拉森；避势力「扎扬」叠字
    hamade: { name: '贝尼哈马团', tier: 4 },          // 布佳亚·哈马德：卡拉阿·贝尼·哈马德；避势力「哈马德」叠字
    sading: { name: '岛屿佣兵', tier: 4 },          // 卡利亚里·埃莱奥诺拉
    jileinaijia: { name: '昔兰尼轻骑', tier: 4 },          // 班加西·马加斯
    kelite: { name: '克里特弓手', tier: 3 },          // 诺索斯·福卡斯：961收复克里特；克里特弓箭手为希腊世界最著名雇佣兵（色诺芬长征记），文化知名T3
    // 南特·吉尔德雷斯：无专名精锐 → T4
    aermolika: { name: '阿尔摩里骑', tier: 4 },
    // 雷恩·阿兰一世：布列塔尼地方军抗维京 → T4
    bulietani: { name: '阿莫里卡团', tier: 4 },          // 雷恩·阿兰一世：Armorica 抗维京；避势力「布列塔尼」叠字
    // 阿维尼翁·雷蒙四世（圣吉尔）：第一次十字军主力；专名偏弱 → T3（勿挂「教皇军」）
    puluowangsi: { name: '圣吉尔骑', tier: 3 },
    // 加莱·罗贝尔二世（佛兰德）：第一次十字军；金马刺步兵已挂 didi「佛兰德军」，此处不夺步兵符号
    fulandesi: { name: '阿图瓦枪兵', tier: 2 },
    mengtainiya: { name: '巴萨拉布团', tier: 2 },          // 布加勒斯特·巴萨拉布；避势力「蒙泰尼亚」叠字,
    baizanting: { name: '铁甲圣骑', tier: 1 },
    mozeer: { name: '特里尔步兵', tier: 3 },
    seleisi: { name: '西美昂军团', tier: 3 },
};
