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
    maqidun: { name: '马其顿方阵', tier: 2 },          // 萨洛尼卡·亚历山大：征服波斯

    // ── T2 特色之兵 ──
    // 汉尼拔主力骑臂=努米底亚骑（坎尼等）；圣团属布匿早期，勿绑汉尼拔 → T2
    buni: { name: '努米底亚骑', tier: 2 },
    xila: { name: '雅典海军', tier: 2 },          // 雅典·地米斯托克利：萨拉米斯
    lagoniya: { name: '斯巴达重装', tier: 2 },          // 斯巴达·列奥尼达：普拉提亚
    boootiya: { name: '底比斯圣队', tier: 2 },          // 底比斯·伊巴密浓达：留克特拉
    yadelaiya: { name: '威尼斯舰队', tier: 2 },          // 威尼斯·丹多洛
    aquidan: { name: '普瓦捷军团', tier: 2 },          // 波尔多·黑太子：1356普瓦捷——长弓+下马甲士为主（非骑兵专名；勿与732图尔/查理马特混淆）
    mulabite: { name: '穆拉比特军', tier: 2 },          // 马拉喀什·塔什芬
    aguelabu: { name: '易弗里军团', tier: 2 },          // 凯鲁万·奥克巴：征服易弗里基叶（Ifriqiya）；政权远征军，非骑士团/骑兵专名
    luodesi: { name: '医院骑士', tier: 2 },          // 罗得城·德米特里：1522守岛
    maerta_qishi: { name: '马耳他骑士', tier: 2 },          // 马耳他·拉·瓦莱特：1565大围攻以少胜多

    // ── T3 风土之兵 ──
    liguliya: { name: '热那亚海军', tier: 3 },          // 热那亚·安德烈亚
    lunbadi: { name: '米兰弩手', tier: 3 },          // 米兰·斯福尔扎
    gaolu: { name: '法兰西骑士', tier: 3 },          // 巴黎·查理七世
    // 图卢兹·雷蒙五世：古名 Tolosa →「托洛萨骑」美化；无战役专名高光，档仍 T4（不抬）
    langgeduoke: { name: '托洛萨军团', tier: 4 },
    jiatailuoniya: { name: '阿拉贡军', tier: 3 },          // 巴塞罗那·海梅
    guadaer: { name: '圣地亚哥团', tier: 2 },
    andaluoxiya: { name: '安达卢军', tier: 3 },          // 科尔多瓦·阿卜杜拉
    putaoya: { name: '葡萄牙军', tier: 3 },          // 里斯本·阿方索·恩里克
    babali: { name: '阿尔及军', tier: 3 },          // 阿尔及尔·巴巴罗萨
    telibolisi: { name: '巴巴里海盗', tier: 3 },          // 的黎波里·德拉古特：北非海盗身份可考 → T3
    // 维罗纳·坎格兰德：斯卡拉家族治军，非「铁骑」专名 → T3
    bohepingyuan: { name: '斯卡拉军', tier: 3 },
    kejila: { name: '科基拉水军', tier: 3 },          // 科孚·舒伦堡：希腊仅次于雅典的第二海军强国（修昔底德），前433西波塔海战
    // 拉文纳·狄奥多里克：493 年攻陷拉文纳、杀奥多亚塞，建东哥特王国，亲卫为其征服主力；
    // 狄奥多里克为日耳曼英雄文学符号（《尼伯龙根之歌》迪特里希），文化知名 → T3（2026-08-03 名将互配升）
    donggete: { name: '狄奥多卫', tier: 3 },
    anuo: { name: '比萨海军', tier: 3 },          // 比萨·乌戈里诺
    balunxiya: { name: '图里亚军', tier: 3 },          // 巴伦西亚·熙德：图里亚河畔都城骑兵（避将名熙德）

    // ── T4 存在之兵 ──
    // 那不勒斯·卡洛（安茹）：安茹骑士可考，无「重骑」专名高光 → T3
    kanpaniya: { name: '安茹骑士', tier: 3 },
    // 佛罗伦萨·洛伦佐：美第奇治下卫军/佣兵 → T4
    tuosikana: { name: '美第奇卫', tier: 4 },
    xixiliwangguo: { name: '西西里军', tier: 3 },          // 巴勒莫·腓特烈二世
    gaolu_luoma: { name: '墨洛军', tier: 3 },          // 里昂·克洛维：墨洛温王朝骑兵（避将名）
    // 托莱多·阿方索六世：1085 收复托莱多，卡斯蒂利亚骑士/骑从为收复失地核心；
    // 文化知名；卡拉特拉瓦团 1158 建晚于其卒年，不挂 → T3（2026-08-03 名将互配升）
    xigete: { name: '卡斯蒂骑士', tier: 3 },
    // 格拉纳达·穆罕默德：纳斯里摩尔骑兵风土 → T3（禁造「阿兰布拉卫」）
    nasier: { name: '摩尔骑', tier: 3 },
    feiniqi: { name: '腓尼基军', tier: 3 },          // 加的斯·哈米尔卡
    yidelisi: { name: '非斯卫', tier: 4 },          // 非斯·伊德里斯：都城卫军（避将名/王朝名叠字）
    xilagu: { name: '叙拉古军', tier: 4 },          // 锡拉库萨·阿加索克利
    leangongguo: { name: '莱昂军', tier: 4 },          // 萨拉曼卡·阿方索九世
    // 梅西纳·罗杰一世：诺曼骑士征服西西里海峡 → T2
    moxina: { name: '诺曼骑士', tier: 2 },
    // 萨拉戈萨·海梅一世：阿尔莫加瓦（Almogávares）突袭轻装 → T2
    alagong: { name: '阿尔莫加瓦', tier: 2 },
    // 休达·恩里克：基督骑士团大团长（非阿维斯）→ T2
    zhibuluotuo: { name: '基督骑士', tier: 2 },
    zhayan: { name: '扎扬军', tier: 4 },          // 特莱姆森·亚格姆拉森
    hamade: { name: '卡拉阿军', tier: 4 },          // 布佳亚·哈马德：卡拉阿·贝尼·哈马德（避将名）
    sading: { name: '撒丁军', tier: 4 },          // 卡利亚里·埃莱奥诺拉
    jileinaijia: { name: '昔兰尼军', tier: 4 },          // 班加西·马加斯
    kelite: { name: '克里特弓手', tier: 3 },          // 诺索斯·福卡斯：961收复克里特；克里特弓箭手为希腊世界最著名雇佣兵（色诺芬长征记），文化知名T3
    // 南特·吉尔德雷斯：无专名精锐 → T4
    aermolika: { name: '卢瓦尔军', tier: 4 },
    // 雷恩·阿兰一世：布列塔尼地方军抗维京 → T4
    bulietani: { name: '阿莫里军', tier: 4 },
    // 阿维尼翁·雷蒙四世（圣吉尔）：第一次十字军主力 → T2（勿挂「教皇军」，阿维尼翁教廷在14世纪）
    puluowangsi: { name: '圣吉尔军', tier: 2 },
    // 加莱·罗贝尔二世（佛兰德）：第一次十字军；金马刺步兵已挂 didi「佛兰德军」，此处不夺步兵符号
    fulandesi: { name: '加莱军', tier: 2 },
    mengtainiya: { name: '蒙泰军', tier: 2 },          // 布加勒斯特·巴萨拉布
};
