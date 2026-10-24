/**
 * 旗号图案（纹章/徽记）试水表 —— 2026-10-24 主人「要不改一下试试，不行再次换回来」
 *
 * 只给**非东亚汉字圈**势力登记图案：旗面不再画「托勒」「塞琉」这种两字截断音译。
 * 日本另走家纹（kamon）旗：战国武士本就用家纹指物旗（2026-10-24 主人「日本的呢」）。
 * 图案来源，统一烘成 `public/emblem-flags/{KEY}_{w|b}.png`（4帧×6朝向雪碧图）：
 *   · ICON：game-icons.net 现成单色图标（CC BY 3.0，署名见 docs/02-design/旗号图案-图标素材来源.md）
 *   · HAND：手绘粗线条符号（`scratch/_emblem_symbols.py`，自绘无版权问题）
 *   · KAMON：日本家纹手绘（`scratch/_kamon_symbols.py`，按各家史实家纹，自绘无版权问题）
 * 烘焙：`scratch/_bake_emblem_sprites.py`。
 *
 * 回退：删掉本表条目 = 该势力立刻回汉字旗号；整表清空 = 全部回汉字。
 * 汉字文化圈（中国各朝/朝鲜/越南/吐蕃/契丹/女真…）**不登记**，照旧用旗号汉字；
 * 日本各家登记家纹（上杉/大友/宇都宫/龙造寺/南部/少弐/松前/对马/伊贺/一向宗/琉球 家纹难画或史实吃不准，仍用汉字）。
 * ⚠ [2026-10-25 主人令] 试水版「按文化圈分派、同圈共用」已废：现在一种纹章只给一个势力，
 *   没有史有明证的专属纹章就恢复字旗（旗号＝1–2 字势力简称），不许两家共用一个纹章。
 */
export const FACTION_EMBLEM: Readonly<Record<string, string>> = {
    // 🔴 [2026-10-25 主人令「要符合历史…一种纹章只能一个势力；没有新的纹章就先恢复字」]
    //    只保留**史有明证的专属纹章**，一个 KEY 只登记一家；其余势力不登记 → 走旗号汉字（1–2 字势力简称）。
    //    新增纹章一律先有素材（{KEY}_{w|b}.png）与史实依据，再在这里加一行；不许两家共用一个 KEY。
    luoma_diguo: 'EAGLE',   // 罗马帝国·军团鹰
    baizanting: 'BYZ_CROSS',   // 拜占庭·十字
    lagoniya: 'SPARTAN_HELM',   // 斯巴达·头盔
    xila: 'OWL',   // 雅典·猫头鹰
    maqidun: 'SUN',   // 马其顿·维吉纳太阳
    gaolu: 'FLEUR',   // 法兰西·鸢尾
    yinggelan: 'LATIN_CROSS',   // 英格兰·圣乔治十字
    tiaodun_qishi: 'IRON_CROSS',   // 条顿骑士团·铁十字
    yelusalengwg: 'JERUSALEM_CROSS',   // 耶路撒冷王国·耶路撒冷十字
    shengdian_qishi: 'TEMPLAR_SHIELD',   // 圣殿骑士团·盾
    osman: 'CRESCENT',   // 奥斯曼·新月
    kongque: 'CARTWHEEL',   // 孔雀帝国·法轮
    zhuluo: 'TIGER',   // 朱罗·虎
    pagan: 'PAGODA',   // 蒲甘·佛塔
    buni: 'SAILBOAT',   // 迦太基·帆船
    danmai: 'DRAKKAR',   // 丹麦·龙船
    menggu_d: 'TAMGA',   // 蒙古·塔木加
    wuer: 'ZIGGURAT',   // 乌尔第三王朝·塔庙
    aiji: 'ANKH',   // 古埃及·安卡
    kushi: 'PYRAMID',   // 库施·金字塔
    aqimeinide: 'WINGED_SUN',   // 阿契美尼德·翼日盘
    sashan: 'HERALDIC_SUN',   // 萨珊·日盘
    mapuche: 'STAR7',   // 马普切·七角星
    aztec: 'SERPENT',   // 阿兹特克·羽蛇
    tupi: 'FEATHER',   // 图皮·羽饰
    heishi: 'AGEHACHO',   // 平氏·扬羽蝶
    tokugawa: 'AOI',   // 德川·葵
    nanbu_shi: 'CRANE',   // 南部·鹤
    fujiwara: 'FUJI',   // 奥州藤原·藤
    ashikaga: 'HIKIRYO',   // 室町足利·引两
    mori: 'ICHIMONJI',   // 毛利·一文字
    suwa_d: 'KAJI',   // 诹访·梶
    chosokabe: 'KATABAMI',   // 土佐长宗我部·片喰
    nanchou: 'KIKU',   // 南朝·菊
    toyotomi: 'KIRI',   // 丰臣·桐
    otomo_d: 'KYOYO',   // 大友·杏叶
    hojo: 'MITSUUROKO',   // 北条·三鳞
    oda: 'MOKKO',   // 织田·木瓜
    ouchi: 'OOUCHI_BISHI',   // 大内·菱
    sanada: 'ROKUMONSEN',   // 真田·六文钱
    date_d: 'SASA',   // 仙台伊达·竹雀
    genji: 'SASARINDO',   // 源氏·笹龙胆
    shimazu: 'SHIMAZU_CROSS',   // 岛津·十字
    takeda: 'TAKEDA_BISHI',   // 武田·武田菱
    ryukyu: 'TOMOE',   // 琉球·巴
    amago: 'YOTSUME',   // 尼子·四目
};

/** 该势力是否走图案旗号；返回 null = 照旧画汉字。 */
export function getFactionEmblemKey(factionId: string): string | null {
    if (!factionId) return null;
    return FACTION_EMBLEM[factionId] ?? null;
}

