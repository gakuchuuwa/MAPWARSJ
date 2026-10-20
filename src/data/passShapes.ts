/**
 * 险要（pass）形制按据点表 —— **一处定义**，战术攻城图 / 高台 / 以后的战略地图共用。
 *
 * 🔴 [2026-10-20 主人令「按每个据点分」] 形制是**据点属性**，不是文明属性：
 *   · 本表 = 逐城显式值（138 座：矩形 56 / 方形 82）；
 *   · 未列入的 11 座（查无平面资料）→ 按 `PASS_SHAPE_RECT_STYLES` 文化默认兜底（auto）。
 * 判据：关城型＝矩形（沿路/谷/河拉长，人货穿城）；城堡/卫城/山城/宗堡型＝方形。
 * 清单与依据：scratch/_pass_shape_149.md（A/B/C 档、代表尺寸、来源）。
 */

export type PassShape = 'square' | 'rect';

/** 文化默认矩形：中国式关城五个文化（中原/河朔/江南/巴蜀/河西）；其余文化默认方形。 */
export const PASS_SHAPE_RECT_STYLES: ReadonlySet<string> = new Set([
    'CENTRAL',   // 中原：函谷关、潼关、虎牢关、武关…
    'WEI',       // 河朔：居庸关、紫荆关、倒马关、雁门关…
    'JIANGNAN',  // 江南：仙霞关、古严关、清流关…
    'BASHU',     // 巴蜀：剑门关、白水关、鹿头关…
    'KHITAN',    // 河西：嘉峪关、阳关、静塞…
]);

/** 据点显式形制（138 座；未列出的 11 座走文化默认）。 */
export const PASS_SHAPES: Readonly<Record<string, PassShape>> = {
    city_agesi: 'square', // 库尔泰亚（方形）
    city_akhaltsikhe: 'square', // 阿哈尔齐赫（方形）
    city_anate: 'square', // 阿纳特（方形）
    city_atuoke: 'rect', // 阿托克（矩形）
    city_baba_vida: 'square', // 巴巴维达（方形）
    city_baidicheng2: 'square', // 白帝城（方形）
    city_baishuiguan: 'rect', // 白水关（矩形）
    city_baku: 'square', // 巴库（方形）
    city_bam_citadel: 'square', // 巴姆（方形）
    city_bamiancheng: 'square', // 八面关（方形）
    city_bedzin: 'square', // 本津堡（方形）
    city_beishacheng: 'square', // 卑沙城（方形）
    city_bieshibali: 'square', // 务涂城（方形）
    city_bohuancheng: 'square', // 拨换城（方形）
    city_braganca: 'square', // 布拉干萨（方形）
    city_buyiersi: 'square', // 布伊尔斯（方形）
    city_chambord: 'square', // 香波堡（方形）
    city_cheollyeong: 'rect', // 铁岭关（矩形）
    city_chijianguan: 'rect', // 赤间关（矩形）
    city_chimarros: 'square', // 希马鲁塔（方形）
    city_chiting: 'square', // 赤亭关（方形）
    city_daerban: 'square', // 打耳班（方形）
    city_daomaguan: 'rect', // 倒马关（矩形）
    city_dasanguan: 'rect', // 大散关（矩形）
    city_dashicheng: 'square', // 大石堡（方形）
    city_dasijiliweng: 'square', // 达斯基利翁（方形）
    city_delusitaer: 'rect', // 德鲁斯塔尔（矩形）
    city_deokwon: 'rect', // 德源（矩形）
    city_diaoyucheng: 'square', // 钓鱼城（方形）
    city_dusong: 'square', // 独松关（方形）
    city_fala: 'square', // 法拉（方形）
    city_fasil_fort: 'square', // 法西尔堡（方形）
    city_feiluzhabade: 'square', // 菲鲁扎巴德（方形）
    city_fuwa: 'rect', // 不破关（矩形）
    city_gaoque: 'square', // 高阙塞（方形）
    city_golconda: 'square', // 戈尔康达（方形）
    city_gongzhubao: 'square', // 公主堡（方形）
    city_guangchengguan: 'rect', // 广成关（矩形）
    city_gubeikou: 'rect', // 古北口（矩形）
    city_guizhicheng: 'square', // 备中高松城（方形）
    city_guyangsai: 'square', // 固阳塞（方形）
    city_guyanguan: 'rect', // 古严关（矩形）
    city_gwalior_fort: 'rect', // 瓜廖尔堡（矩形）
    city_hailongtun: 'square', // 海龙屯（方形）
    city_hakone: 'rect', // 箱根关（矩形）
    city_hamiwei: 'square', // 哈密卫（方形）
    city_hanguguan: 'rect', // 函谷关（矩形）
    city_hawadeng: 'square', // 哈瓦登（方形）
    city_heidelberg: 'square', // 海德堡（方形）
    city_hengpuguan: 'rect', // 横浦关（矩形）
    city_hengyu: 'square', // 横屿（方形）
    city_hepancheng: 'square', // 石头城（方形）
    city_himeji: 'square', // 姬路城（方形）
    city_huangxiguan: 'rect', // 湟溪关（矩形）
    city_huifa: 'square', // 辉发（方形）
    city_hulaoguan: 'rect', // 虎牢关（矩形）
    city_huma: 'square', // 呼玛（方形）
    city_izumo: 'square', // 月山富田（方形）
    city_jianmenguan: 'rect', // 剑门关（矩形）
    city_jiemu: 'square', // 杰姆（方形）
    city_jilusai: 'square', // 鸡鹿塞（方形）
    city_jingkou: 'square', // 濡须口（方形）
    city_jingsai: 'rect', // 静塞（矩形）
    city_jingxingguan: 'rect', // 井陉关（矩形）
    city_jingzhou: 'square', // 净州塞（方形）
    city_jinqi: 'square', // 金奇（方形）
    city_jinsuoguan: 'rect', // 金锁关（矩形）
    city_jiuquan: 'rect', // 嘉峪关（矩形）
    city_juyongguan: 'rect', // 居庸关（矩形）
    city_kanafeng: 'rect', // 卡那封（矩形）
    city_kasugayama: 'square', // 春日山（方形）
    city_kawunas: 'square', // 卡乌纳斯（方形）
    city_kenisibao: 'square', // 柯尼斯堡（方形）
    city_keyimen: 'square', // 克夷门（方形）
    city_knossos: 'square', // 干地亚要塞（方形）
    city_kolossi: 'square', // 科洛西（方形）
    city_la_mota: 'square', // 拉莫塔堡（方形）
    city_labate: 'square', // 拉巴特（方形）
    city_laifeng: 'rect', // 散毛关（矩形）
    city_lingshiguan: 'rect', // 灵石关（矩形）
    city_longtanshancheng: 'square', // 龙潭山（方形）
    city_lushi: 'rect', // 陆浑关（矩形）
    city_machu_picchu: 'square', // 马丘比丘（方形）
    city_mailingguan: 'rect', // 麦岭关（矩形）
    city_malta: 'square', // 马耳他（方形）
    city_mangkangzong: 'square', // 芒康宗（方形）
    city_meierfei: 'square', // 梅尔菲（方形）
    city_mianzhuguan: 'rect', // 鹿头关（矩形）
    city_mierkefu: 'square', // 密尔科夫（方形）
    city_mulingguan: 'rect', // 大岘关（矩形）
    city_ningwuguan: 'rect', // 宁武关（矩形）
    city_ningyuan: 'square', // 宁远城（方形）
    city_nuergan: 'square', // 特林（方形）
    city_peiluximu: 'rect', // 佩鲁西姆（矩形）
    city_pengdi: 'square', // 彭迪（方形）
    city_piantouguan: 'rect', // 偏头关（矩形）
    city_pingxingguan: 'rect', // 平型关（矩形）
    city_porbazhyn: 'square', // 博尔巴任（方形）
    city_qingliuguan: 'rect', // 清流关（矩形）
    city_qingshiguan: 'rect', // 青石关（矩形）
    city_qingxiguan: 'rect', // 清溪关（矩形）
    city_qujiang: 'rect', // 韶关（矩形）
    city_salhu: 'square', // 萨尔浒（方形）
    city_sangguer: 'square', // 温都尔汗（方形）
    city_santaguan: 'square', // 三塔关（方形）
    city_seuthopolis: 'square', // 塞乌托波利（方形）
    city_shanhaiguan: 'square', // 山海关（方形）
    city_shengjingguan: 'rect', // 胜境关（矩形）
    city_shilekahe: 'square', // 石勒喀堡（方形）
    city_shimenguan: 'rect', // 石门关（矩形）
    city_suomapuli: 'square', // 索玛普利（方形）
    city_taqian: 'rect', // 它乾城（矩形）
    city_tengyuecheng: 'square', // 腾越城（方形）
    city_tianjinguan: 'rect', // 天井关（矩形）
    city_tongguan: 'rect', // 潼关（矩形）
    city_tsuruga: 'square', // 鹤之城（方形）
    city_tushpa: 'square', // 图什帕（方形）
    city_ueda: 'square', // 上田城（方形）
    city_uxmal: 'square', // 乌斯马尔（方形）
    city_waka: 'square', // 瓦卡（方形）
    city_wancheng: 'rect', // 皖口（矩形）
    city_wuguan: 'rect', // 武关（矩形）
    city_wugucheng: 'square', // 乌骨城（方形）
    city_wushengguan: 'rect', // 武胜关（矩形）
    city_wuyun: 'square', // 乌云（方形）
    city_xianxia: 'rect', // 仙霞关（矩形）
    city_xiaoguan: 'rect', // 萧关（矩形）
    city_xupin: 'square', // 恤品（方形）
    city_yangguan: 'rect', // 阳关（矩形）
    city_yangjigan: 'rect', // 养吉干（矩形）
    city_yangshanguan: 'rect', // 阳山关（矩形）
    city_yanmenguan: 'rect', // 雁门关（矩形）
    city_yoshida: 'square', // 吉田郡山（方形）
    city_yuezhi: 'rect', // 大木岳（矩形）
    city_yumenguan: 'square', // 玉门关（方形）
    city_zhangguojuncheng: 'square', // 彰国军城（方形）
    city_zhiguan: 'rect', // 轵关（矩形）
    city_zijingguan: 'rect', // 紫荆关（矩形）
};

/** 某座险要的形制：先取据点显式值，没有就按建筑文化默认兜底。 */
export function passShapeForCity(cityId: string, buildingStyle?: string | null): PassShape {
    const explicit = PASS_SHAPES[cityId];
    if (explicit) return explicit;
    return buildingStyle && PASS_SHAPE_RECT_STYLES.has(buildingStyle) ? 'rect' : 'square';
}
