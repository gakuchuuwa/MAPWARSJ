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

    // ── T1 功勋名将（60；防御型/败者/地图无据点者不入表，走文化中心）──────
    // 川蜀
    daxi_ming: { cityId: 'city_chengdu', label: '破成都建大西' },            // 张献忠·大西
    weizhou_wei: { cityId: 'city_luoxie', label: '镇蜀破吐蕃' },             // 韦皋·维州（占位，见下 weizhou）
    // 中原
    qin: { cityId: 'city_chengdu', label: '伐灭古蜀' },                      // 司马错·秦
    cao_d: { cityId: 'city_bailangshan', label: '白狼山斩蹋顿' },            // 曹操·曹家（征乌桓）
    zhou: { cityId: 'city_anyang', label: '牧野克商' },                      // 姬发·周
    chanzhou: { cityId: 'city_fanyang', label: '北伐燕云' },                 // 柴荣·澶州（直指幽州）
    jin: { cityId: 'city_shicheng', label: '城濮破楚入郢' },                 // 先轸·晋
    dashun: { cityId: 'city_beijing', label: '进京灭明' },                   // 李自成·大顺
    ruo: { cityId: 'city_handan', label: '破邯郸灭赵' },                     // 王翦·武关
    qianzhou: { cityId: 'city_changan', label: '收复长安' },                 // 李晟·乾州
    song: { cityId: 'city_taiyuan', label: '亲征北汉' },                     // 赵匡胤·宋
    // 中亚
    xiliao: { cityId: 'city_merv', label: '卡特万破塞尔柱' },                // 耶律大石·西辽（打桑贾尔老巢木鹿）
    // 滇缅
    hantawadi: { cityId: 'city_ayutthaya', label: '攻陷暹罗' },              // 莽应龙·汉达瓦底
    konbaung: { cityId: 'city_ayutthaya', label: '灭阿瑜陀耶' },             // 雍笈牙·贡榜
    siam: { cityId: 'city_bago', label: '反攻缅甸勃固' },                    // 纳黎萱·暹罗
    // 河西
    zhai_han: { cityId: 'city_yongzhou', label: '昆仑关破侬智高' },          // 狄青·翟国（远征邕州）
    didao: { cityId: 'city_qingtang', label: '熙河开边逼青唐' },             // 王韶·熙州
    shazhou: { cityId: 'city_wuwei', label: '收复河西凉州' },                // 张议潮·沙州
    shanzhou: { cityId: 'city_luoxie', label: '破吐蕃' },                    // 王忠嗣·鄯州
    // 日本
    edo: { cityId: 'city_himeji', label: '大坂之阵灭丰臣' },                 // 德川家康·德川
    owari: { cityId: 'city_kyoto', label: '上洛天下布武' },                  // 织田信长·尾张
    aki: { cityId: 'city_izumo', label: '灭尼子·月山富田' },                 // 毛利元就·安艺
    // 江南
    zaoyang_d: { cityId: 'city_xuanhu', label: '蔡州灭金' },                 // 孟珙·唐州（汝南=蔡州）
    wu: { cityId: 'city_shicheng', label: '柏举破楚入郢' },                  // 孙武·吴
    // 朝鲜
    joseon: { cityId: 'city_shenyang', label: '威化岛·图辽东' },             // 李成桂·朝鲜
    // 岭南
    leloi: { cityId: 'city_shenglong', label: '逐明复国' },                  // 黎利·后黎（围东关昇龙）
    taiping: { cityId: 'city_nanjing', label: '定都天京' },                  // 石达开·太平天国（金陵）
    // 北方
    heng1: { cityId: 'city_datong', label: '北伐云州' },                     // 杨业·元岳
    yan: { cityId: 'city_linzi', label: '伐齐入临淄' },                      // 乐毅·燕
    erzhu: { cityId: 'city_luoyang', label: '河阴之变入洛' },                // 尔朱荣·尔朱
    yingzhou_ying_d: { cityId: 'city_guoneicheng', label: '破高句丽陷丸都' }, // 慕容皝·营州
    ming_d: { cityId: 'city_nanjing', label: '靖难入京' },                   // 朱棣·大明（金陵）
    shatuo: { cityId: 'city_bianliang', label: '争霸破朱温' },               // 李克用·沙陀（汴）
    lingzhou: { cityId: 'city_fanyang', label: '平安史追范阳' },             // 仆固怀恩·灵州
    you: { cityId: 'city_linzi', label: '平齐张步' },                        // 耿弇·幽州
    lingqiu: { cityId: 'city_zhongshan', label: '灭中山' },                  // 赵武灵王·灵丘
    xuan: { cityId: 'city_beijing', label: '克大都灭元' },                   // 徐达·宣府
    jinzhou: { cityId: 'city_hetuala', label: '捣建州' },                    // 李成梁·锦州
    zu_d: { cityId: 'city_shenyang', label: '复辽取沈阳' },                  // 袁崇焕·严州
    weihaiwei: { cityId: 'city_sabi', label: '渡海灭百济' },                 // 苏定方·威海
    // 东北
    yizhou: { cityId: 'city_taiyuan', label: '破太原' },                     // 完颜娄室·懿州
    manzhou: { cityId: 'city_shenyang', label: '萨尔浒取沈阳' },             // 努尔哈赤·满洲
    jurchen: { cityId: 'city_hangzhou', label: '搜山检海追高宗' },           // 完颜宗弼·女真（临安）
    aisin_d: { cityId: 'city_hanseong', label: '丙子征朝鲜' },               // 皇太极·爱新觉罗
    wuliangha: { cityId: 'city_bianliang', label: '围汴灭金' },              // 速不台·兀良哈
    // 草原
    liao_d: { cityId: 'city_ningan', label: '灭渤海' },                      // 耶律阿保机·辽（龙泉府）
    yel: { cityId: 'city_bianliang', label: '高粱河破宋南侵' },              // 耶律休哥·耶律
    borjigin: { cityId: 'city_bianliang', label: '三峰山灭金' },             // 拖雷·孛儿只斤
    xiongnu: { cityId: 'city_datong', label: '白登围汉高祖' },               // 冒顿·匈奴（平城）
    tujue: { cityId: 'city_saierwusu', label: '破柔然建突厥' },              // 阿史那土门·突厥
    huige: { cityId: 'city_otuken', label: '灭后突厥' },                     // 骨力裴罗·回纥
    wala: { cityId: 'city_beijing', label: '土木堡围京' },                   // 也先·瓦剌
    xiajiasi: { cityId: 'city_woluduobali', label: '破回鹘牙帐' },           // 阿热·坚昆
    tumed: { cityId: 'city_beijing', label: '庚戌之变围京' },                // 俺答汗·土默特
    jiluo_d: { cityId: 'city_yanran', label: '燕然勒石破北匈奴' },           // 窦宪·涿涂
    // 青藏
    tubo: { cityId: 'city_fusicheng', label: '破吐谷浑' },                   // 松赞干布·吐蕃
    gar: { cityId: 'city_dafeichuan', label: '大非川破唐' },                 // 论钦陵·噶尔
    khoshut: { cityId: 'city_luoxie', label: '入藏灭藏巴汗' },               // 固始汗·和硕特
    // 西域
    dzungar: { cityId: 'city_turkestan', label: '征哈萨克' },                // 噶勒丹策凌·绰罗斯（打哈萨克圣城亚西）
    xiyuduhu: { cityId: 'city_yutian2', label: '定西域' },                   // 班超·西域都护（于阗）
};

/** 查名将的历史首征目标；无则返回 null。 */
export function getGeneralFirstTarget(generalId?: string | null): GeneralFirstTarget | null {
    if (!generalId) return null;
    return GENERAL_FIRST_EXPEDITION_TARGETS[generalId] ?? null;
}
