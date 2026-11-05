/**
 * 玩家「环球 / 航行」模式的知名商路链（2026-11-05 主人令）。
 *
 *  · 环球（globe）：绝对优先陆路，按江户 → 塞维利亚/加的斯的古代陆上商路走（东海道—山阳道—对马海峡—燕行路—辽西走廊—
 *    华北—河西走廊—塔里木—帕米尔—河中—呼罗珊—安纳托利亚—巴尔干—阿尔卑斯—比利牛斯—伊比利亚），
 *    陆路走不通的海峡、大洋（对马海峡、博斯普鲁斯、大西洋、太平洋）才换海路：
 *    大西洋走西班牙宝船队航线到韦拉克鲁斯，陆路穿墨西哥到阿卡普尔科，再沿大帆船航线回江户成环。
 *  · 航行（sail）：只走海路，按江户 → 东海 → 南海 → 印度洋 → 好望角 → 圣赫勒拿 → 巴西萨尔瓦多 → 麦哲伦海峡 → 太平洋东岸 →
 *    阿卡普尔科 → 马尼拉 → 江户（不绕欧洲） 的大航海港口链成环。
 *
 * 链是环：走到末尾回到第 0 站。链上某站暂时到不了（例如新据点还没画路），玩家会自动跳到下一站，不会卡住。
 * `by` = 从上一站到本站走什么路：land 只走陆路，sea 只走海路；陆路不通时由调用方再退到「任意路」兜底。
 */
export interface TourStop {
    id: string;
    by: 'land' | 'sea';
}

const L = (id: string): TourStop => ({ id, by: 'land' });
const S = (id: string): TourStop => ({ id, by: 'sea' });

/** 大帆船航线（1565 起）：阿卡普尔科 → 关岛 → 萨马岛帕拉帕格（圣贝纳迪诺海峡口）→ 马尼拉 → 台湾 → 琉球 → 九州（均走海路） */
const GALLEON_SEA_TAIL: TourStop[] = [
    S('city_hagatna'),      // 阿加尼亚（乌马塔克）
    S('city_palapag'),
    S('city_manila'),
    S('city_tainan'),       // 大员
    S('city_mengjia'),      // 鸡笼一带
    S('city_shuri'),        // 那霸
    S('city_satsuma'),      // 坊津一带
    S('city_akaogicheng'),  // 种子岛
];

/** 航行用：巴西以南 → 麦哲伦海峡 → 南美西岸 → 中美 → 太平洋（大帆船航线）→ 菲律宾 → 台湾 → 琉球 → 九州（均走海路） */
const SOUTH_AMERICA_PACIFIC_SEA_TAIL: TourStop[] = [
    S('city_guanabara'),    // 里约
    S('city_buenosaires'),
    S('city_sanjulian'),
    S('city_felipe'),       // 菲利普王城（饥饿港）
    S('city_valdivia'),
    S('city_concepcion'),
    S('city_valparaiso'),
    S('city_arica'),
    S('city_lima'),
    S('city_guayaquil'),
    S('city_banama'),
    S('city_realejo'),
    S('city_acapulco'),
    ...GALLEON_SEA_TAIL,
];

/** 环球：陆路优先的江户 → 加的斯商路，大西洋走海路，陆路穿墨西哥，太平洋海路回江户 */
export const GLOBE_CHAIN: TourStop[] = [
    // 日本：东海道—山阳道
    S('city_edo'), L('city_hakone'), L('city_junfucheng'), L('city_hamamatsu'), L('city_atsuta'),
    L('city_fuwa'), L('city_kyoto'), L('city_osaka'), L('city_himeji'), L('city_guizhicheng'),
    L('city_yoshida'), L('city_yamaguchi'), L('city_chijianguan'), L('city_taizaifu'),
    // 对马海峡（唯一不能绕开的海）
    S('city_yuanzhishi'), S('city_tsushima'), S('city_gimhae'),
    // 朝鲜：岭南大路—义州大路
    L('city_shangzhou'), L('city_guoyuancheng'), L('city_hanseong'), L('city_kaesong'), L('city_pyongyang'),
    L('city_xicheng'), L('city_longwan'),
    // 辽东、辽西走廊、华北
    L('city_wugucheng'), L('city_liaoyang'), L('city_guangning'), L('city_tuhe'),   // 安市城是高句丽山城、不在明代辽西驿道上，且与广宁之间尚无直连路，不入链
    L('city_ningyuan'), L('city_shanhaiguan'), L('city_feiru'), L('city_wuzhong'), L('city_beijing'),
    L('city_baoding'), L('city_zhending'), L('city_xingtai'), L('city_anyang'), L('city_luoyang'),
    L('city_hanguguan'), L('city_tongguan'), L('city_changan'),
    // 河西走廊—天山南麓
    L('city_binzhou2'), L('city_xiaoguan'), L('city_lanzhou'), L('city_wuwei'), L('city_shandan'),
    L('city_zhangye'), L('city_jiuquan'), L('city_jinchangcheng'), L('city_hamiwei'), L('city_gaochangcheng'),
    L('city_tuokexun'), L('city_yanqi'), L('city_weili'), L('city_yiluolucheng'), L('city_bohuancheng'),
    L('city_wosedecheng'), L('city_shule'),
    // 帕米尔—费尔干纳—河中
    L('city_yierkeshentan'), L('city_xiuxun'), L('city_aoshen'), L('city_kokand'), L('city_huzhan'),
    L('city_jizhake'), L('city_samaerhan'), L('city_bukhara'), L('city_amucheng'),
    // 呼罗珊大道
    L('city_merv'), L('city_salahesi'), L('city_tusi'), L('city_nishabuer'), L('city_baihage'),
    L('city_bistam'), L('city_damugan'), L('city_leiyi'), L('city_jiaziwen'), L('city_zanzhan'),
    L('city_dabulishi'),
    // 安纳托利亚东道
    L('city_erzurum'), L('city_erzincan'), L('city_sivas'), L('city_amaxiya'), L('city_nixiya'),
    // 博斯普鲁斯海峡 → 君士坦丁堡（路网里 尼凯亚—君士坦丁堡 已含渡口）
    L('city_junshitandingbao'),
    // 巴尔干军事大道—萨瓦河谷—北意大利
    L('city_aidiernei'), L('city_plovdiv'), L('city_sofia'), L('city_nis'), L('city_belgrade'),
    L('city_venice'), L('city_verona'), L('city_milan'), L('city_turin'), L('city_shangbeili'),
    // 法国南部—比利牛斯—伊比利亚
    L('city_lyon'), L('city_avignon'), L('city_toulouse'), L('city_bayonne'), L('city_pamplona'),
    L('city_burgos'), L('city_madeli'), L('city_toledo'), L('city_merida'), L('city_badajoz'),
    L('city_seville'), L('city_jiadisi'),   // 塞维利亚—加的斯：西班牙「印度事务」出海港（里斯本不入环球链，免得折返）
    // 大西洋（西班牙宝船队航线 Carrera de Indias：加的斯 → 加那利 → 加勒比哈瓦那 → 韦拉克鲁斯，哥伦布 1492 起）
    S('city_telde'), S('city_havana'), S('city_veracruz'),
    // 陆路穿墨西哥（中国之路 Camino de China）：韦拉克鲁斯 → 墨西哥城 → 阿卡普尔科
    L('city_tenochtitlan'), L('city_acapulco'),
    // 太平洋（马尼拉大帆船，1565 乌尔达内塔）→ 菲律宾 → 台湾 → 琉球 → 九州 → 江户
    ...GALLEON_SEA_TAIL,
];

/** 航行：纯海路港口环线（江户 → 好望角 → 圣赫勒拿 → 巴西 → 麦哲伦 → 阿卡普尔科 → 马尼拉 → 江户） */
export const SAIL_CHAIN: TourStop[] = [
    // 日本沿海与濑户内海
    S('city_edo'), S('city_kamakura'), S('city_shimoda'), S('city_toba'), S('city_kushimoto'), S('city_osaka'),
    S('city_himeji'), S('city_noshima'), S('city_chijianguan'), S('city_taizaifu'), S('city_yuanzhishi'),
    S('city_nagasaki'),
    // 东海与中国东南沿海
    S('city_goto'), S('city_qingyuan_zj'), S('city_qingjingsi'), S('city_zhangzhou'), S('city_haiyang'),
    S('city_aomen'),
    // 南海
    S('city_yazhou'), S('city_dupan'), S('city_kunlundao'), S('city_danmaxi'), S('city_malacca'),
    // 孟加拉湾—印度西岸
    S('city_yaqi'), S('city_nikoba'), S('city_jiale'), S('city_kelunpo'), S('city_cochin'),
    S('city_guli'), S('city_guoa'),
    // 东非—好望角
    S('city_malindi'), S('city_mombasa'), S('city_kilwa'), S('city_mozambique'), S('city_sofala'),
    S('city_cape_town'),
    // 横渡南大西洋：开普敦 → 圣赫勒拿 → 萨尔瓦多（葡萄牙印度船队回程，17 世纪下半叶起固定停靠巴伊亚）
    S('city_sainthelena'), S('city_salvador'),
    // 萨尔瓦多以南接麦哲伦航线 → 南美西岸 → 中美 → 太平洋大帆船航线 → 菲律宾 → 台湾 → 琉球 → 九州
    ...SOUTH_AMERICA_PACIFIC_SEA_TAIL,
];

export function getTourChain(mode: 'globe' | 'sail'): readonly TourStop[] {
    return mode === 'globe' ? GLOBE_CHAIN : SAIL_CHAIN;
}
