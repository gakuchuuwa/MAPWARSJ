/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 🔴 [2026-09-14 主人定「谁让你各存了，给我删了」]
 *   本表**只存指针，不存编制**：一条记录只回答「这个势力挂哪支军团」。
 *   编制在三层军团表里，一支军团一份：
 *     一级 16 母体 → `CultureFormations.ts` 的 `BASE_16_TIERS_MAP`
 *     二级 62 文明 → `level2Civ62Legions.ts`
 *     三级 145 自建 → `level3CustomLegions.ts`
 *   原先每家势力还各存一份 `formationMode` + `slots` 的**副本**（460 份，其中 419 份
 *   与军团记录一模一样纯属冗余、19 份已漂移成另一套）——「同一个军团名两种编制」
 *   全是它造成的（隋唐军团 92 家 ↔ 6 家就是实例）。副本已整体删除。
 *   ⚠️ 不许再往这里写 slots/formationMode：要给某个势力特殊编制，
 *      就在三级表里给它建一支有番号名的军团，然后这里挂名字。
 */

import type { NavalFormationMode } from '../types/CultureFormations';

export interface CustomFactionLegion {
    /** 军团名称（前中后三排组成的这支部队的名字，如「瓦兰吉卫队军团」）。
     *  🔴 与「精锐番号」（ExpeditionLegions 的福建水师/北府兵等）不是一回事，别混。 */
    legionName?: string;
    /** 军团种类（编辑器判型）：region 文化军团 / sub 制定军团。
     *  🔴 [2026-09-06 主人铁律] 只有这两种，era「时代军团」已废除，不许再写。 */
    legionType?: 'region' | 'sub';
    /** 水战/航行时的舰队队形；缺省 = 'auto'（按船数自动，旧行为） */
    navalFormation?: NavalFormationMode;
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    // 🔴 [2026-10-20 主人令「起义军，一律算到三级起义军团」] 起义（panjun）占位势力统一挂三级起义军团
    "panjun": {
        legionName: "起义军",
        legionType: "sub",
    },
    "dashun": {
        legionName: "起义军",
        legionType: "sub",
    },
    "taiping": {
        legionName: "起义军",
        legionType: "sub",
    },
    // 🔴 [2026-10-18 主人令「先两个」] 三级军团首次套用（口径：军团建筑文化 = 武将据点的建筑风格，且武将为帝国时代）：
    //   亚速尔·西普里亚诺（帝国时代，据点安格拉 city_angra｜PORTUGUESE）→ 帝国时代葡萄牙风琴军团
    //   纳韦尔布塔·加尔瓦里诺（帝国时代，据点科利普利 city_kelipuli｜MAPUCHE）→ 帝国时代安第斯游击军团
    "yasuer": {
        legionName: "帝国时代葡萄牙风琴军团",
        legionType: "sub",
    },
    "naweierbuta": {
        legionName: "帝国时代安第斯游击军团",
        legionType: "sub",
    },
    "genji_iyo": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "hepan": {
        legionName: "封建时代安西军团",
        legionType: "sub",
    },
    "teluoyi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "yun": {
        legionName: "先秦军团",
        legionType: "sub",
    },
    "qiliqiya": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "xingwei": {
        legionName: "城堡时代阿瓦军团",
        legionType: "sub",
    },
    "kelite": {
        legionName: "帝国时代意大利雇佣军团",
        legionType: "sub",
    },
    "sailiugu": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "iga_d": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "sanfoqi": {
        legionName: "封建时代三佛齐军团",
        legionType: "sub",
    },
    "lunbadi": {
        legionName: "封建时代伦巴第军团",
        legionType: "sub",
    },
    "suosuo": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
    },
    "yipilusi": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "kushi": {
        legionName: "古典时代杰内军团",
        legionType: "sub",
    },
    "didi": {
        legionName: "城堡时代勃艮第公国军团",
        legionType: "sub",
    },
    "shuizhen": {
        legionName: "帝国时代洛韦克军团",
        legionType: "region",
    },
    "wu": {
        legionName: "先秦军团",
        legionType: "sub",
    },
    "qin": {
        legionName: "古典时代华夏军团",
        legionType: "region",
    },
    "nanyue": {
        legionName: "古典时代吴越军团",
        legionType: "region",
    },
    "han_d": {
        legionName: "古典时代华夏军团",
        legionType: "region",
    },
    "you": {
        legionName: "古典时代太行军团",
        legionType: "region",
    },
    "shu": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "ranwei_d": {
        legionName: "古典时代太行军团",
        legionType: "region",
    },
    "maqidun": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
    },
    "dianguo": {
        legionName: "古典时代巴蜀军团",
    },
    "ming_d": {
        legionName: "城堡时代燕云军团",
        legionType: "region",
    },
    "mazhaer": {
        legionName: "城堡时代匈牙利王国军团",
        legionType: "sub",
    },
    "keluodiya": {
        legionName: "帝国时代俄罗斯军团",
        legionType: "sub",
    },
    "bolan": {
        legionName: "帝国时代波兰立陶宛军团",
        legionType: "sub",
    },
    "baojialiya": {
        legionName: "城堡时代查雷威茨禁卫军团",
        legionType: "sub",
    },
    "moerdaweiya": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "walajiyia": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "vidin_tsardom": {
        legionName: "城堡时代查雷威茨禁卫军团",
        legionType: "sub",
    },
    "damolaweiya": {
        legionName: "封建时代波希米亚军团",
        legionType: "sub",
    },
    "luosi": {
        legionName: "封建时代基辅罗斯军团",
        legionType: "sub",
    },
    "qiernigeweifu_gongguo": {
        legionName: "封建时代基辅罗斯军团",
        legionType: "sub",
    },
    "xideweina": {
        legionName: "封建时代基辅罗斯军团",
        legionType: "sub",
    },
    "fangla": {
        legionName: "起义军",
        legionType: "sub",
    },
    "batawei": {
        legionName: "起义军",
        legionType: "sub",
    },
    "xianlingqiang": {
        legionName: "古典时代凉州军团",
        legionType: "sub",
    },
    "shaodang": {
        legionName: "古典时代发羌军团",
        legionType: "sub",
    },
    "xibo_d": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "oirat_ming": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "dzungar": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "kazakh": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "tuoming": {
        legionName: "起义军",
        legionType: "sub",
    },
    "tuerhute": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "tumed": {
        legionName: "帝国时代察哈尔军团",
        legionType: "sub",
    },
    "kaerka": {
        legionName: "帝国时代喀尔喀军团",
        legionType: "sub",
    },
    "wuzhumuqin": {
        legionName: "帝国时代察哈尔军团",
        legionType: "sub",
    },
    "sunite": {
        legionName: "帝国时代察哈尔军团",
        legionType: "sub",
    },
    "buriat": {
        legionName: "帝国时代喀尔喀军团",
        legionType: "sub",
    },
    "huite": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "xiajiasi": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "juqu_d": {
        legionName: "古典时代凉州军团",
        legionType: "sub",
    },
    "helian": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
    },
    "xueyantuo": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "shiwei": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "gaoche": {
        legionName: "古典时代匈奴军团",
        legionType: "sub",
    },
    "bayegu": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "xierhe": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "yuezhi": {
        legionName: "封建时代河西军团",
        legionType: "sub",
    },
    "mangshi": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "xiongnu": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
    },
    "cheshihou": {
        legionName: "古典时代西域军团",
        legionType: "sub",
    },
    "xijue": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "huyan": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "baidi": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
    },
    "yada": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "jie": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "saman": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "mamon": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "keerkezi": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "qiepantuo": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "maer_d": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "jiatailuoniya": {
        legionName: "封建时代伦巴第军团",
        legionType: "sub",
    },
    "fuguo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "tufa_d": {
        legionName: "古典时代凉州军团",
        legionType: "region",
    },
    "dangxiang": {
        legionName: "封建时代河西军团",
        legionType: "region",
    },
    "tubo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "qifu_d": {
        legionName: "古典时代凉州军团",
        legionType: "sub",
    },
    "xiaobolu": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xihai_d": {
        legionName: "封建时代河西军团",
        legionType: "region",
    },
    "guge": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "supi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "khyungpo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "bailang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xiangxiong": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "khoshut": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "jinchuan_g": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "gurkha": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "xiadun": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "ladakh": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "tsangpa": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "karmapa": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "golog": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "gar_kham": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "kongsa": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "daca": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "hor": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "galangdiba": {
        legionName: "帝国时代卫藏军团",
        legionType: "region",
    },
    "longwu": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "lujian": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "ming_zheng": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "bailian": {
        legionName: "起义军",
        legionType: "sub",
    },
    "manzhou_d": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "haixi_nvzhen": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "yeren_nvzhen": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "feiyaka": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "suolun": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "keerqin": {
        legionName: "帝国时代察哈尔军团",
        legionType: "region",
    },
    "eluoke": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "kuye": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "ewenki": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "yehe": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "wula": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "elunchunzu": {
        legionName: "帝国时代八旗军团",
        legionType: "region",
    },
    "minyue": {
        legionName: "古典时代吴越军团",
    },
    "ouyue": {
        legionName: "古典时代吴越军团",
    },
    "juandu": {
        legionName: "封建时代安西军团",
    },
    "shang": {
        legionName: "先秦军团",
    },
    "qi": {
        legionName: "先秦军团",
    },
    "kong_d": {
        legionName: "先秦军团",
    },
    "zhou": {
        legionName: "先秦军团",
    },
    "shen": {
        legionName: "先秦军团",
        legionType: "sub",
    },
    "jin": {
        legionName: "先秦军团",
    },
    "yue": {
        legionName: "先秦军团",
    },
    "zhao": {
        legionName: "古典时代华夏军团",
    },
    "wei": {
        legionName: "先秦军团",
        legionType: "sub",
    },
    "yan": {
        legionName: "古典时代太行军团",
    },
    "han": {
        legionName: "古典时代华夏军团",
    },
    "nanzhao": {
        legionName: "封建时代剑南军团",
        legionType: "sub",
    },
    "dali": {
        legionName: "封建时代剑南军团",
        legionType: "sub",
    },
    "yelusalengwg": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "shengdian_qishi": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "saipulusi": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "aosiruowen": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "antiaokegongguo": {
        legionName: "城堡时代撒拉森军团",
        legionType: "sub",
    },
    "baojian_qishi": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "tiaodun_qishi": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "litaowan": {
        legionName: "城堡时代立陶宛大公国军团",
        legionType: "sub",
    },
    "yashu": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "guyashu": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "adiyabeina": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "tuoba": {
        legionName: "古典时代太行军团",
        legionType: "sub",
    },
    "xila": {
        legionName: "古典时代雅典军团",
        legionType: "sub",
    },
    "lagoniya": {
        legionName: "古典时代斯巴达军团",
        legionType: "sub",
    },
    "boootiya": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "yamaxun": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "talanduo": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "baizanting": {
        legionName: "封建时代拜占庭军区军团",
        legionType: "sub",
    },
    "ayoubu": {
        legionName: "城堡时代撒拉森军团",
        legionType: "sub",
    },
    "mamuluke": {
        legionName: "城堡时代撒拉森军团",
        legionType: "region",
    },
    "guanche": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
    },
    "tigelei": {
        legionName: "城堡时代埃塞俄比亚军团",
        legionType: "sub",
    },
    "zhagewei": {
        legionName: "城堡时代埃塞俄比亚军团",
        legionType: "sub",
    },
    "inca": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
    },
    "tang": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "jinzhang": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "baojiaer": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "kelimiya": {
        legionName: "城堡时代意大利城邦军团",
        legionType: "sub",
    },
    "menggu_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "ogodei": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "kereyid": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "naiman": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "tatar": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "ongut": {
        legionName: "城堡时代漠南蒙古军团",
        legionType: "sub",
    },
    "dada_ming": {
        legionName: "城堡时代漠南蒙古军团",
        legionType: "sub",
    },
    "yuan_d": {
        legionName: "城堡时代漠南蒙古军团",
        legionType: "sub",
    },
    "hongirad": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "choros": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "zhadalan": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "zhuerqi": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "houliao": {
        legionName: "城堡时代大金军团",
        legionType: "sub",
    },
    "xianhai": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "zubu": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "wugu_d": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "salai": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "kuman_oleshky": {
        legionName: "城堡时代库曼军团",
        legionType: "sub",
    },
    "aertai": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "tuolemi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "siam": {
        legionName: "帝国时代洛韦克军团",
        legionType: "sub",
    },
    "xushouhui": {
        legionName: "起义军",
        legionType: "sub",
    },
    "sunwu_d": {
        legionName: "古典时代吴越军团",
        legionType: "sub",
    },
    "kongque": {
        legionName: "古典时代贵霜军团",
        legionType: "sub",
    },
    "tiemuer": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "varendra": {
        legionName: "封建时代波罗军团",
        legionType: "sub",
    },
    "mojietuo": {
        legionName: "古典时代贵霜军团",
        legionType: "sub",
    },
    "jialatai": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-18 主人令「放宽」] 换挂帝国时代苏丹亲兵军团（穆罕默德二世·布尔萨 TURKS；武将为城堡时代，已放宽）
    "osman": {
        legionName: "帝国时代苏丹亲兵军团",
        legionType: "sub",
    },
    "aosimanbeiyiguo": {
        legionName: "城堡时代撒拉森军团",
        legionType: "sub",
    },
    "lumiliya": {
        legionName: "城堡时代加齐突骑军团",
        legionType: "sub",
    },
    "kesa": {
        legionName: "封建时代德莱木军团",
        legionType: "region",
    },
    "xiemian": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "yidier": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "aqimeinide": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "xiaofulijiya": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "kanan": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "tawantinsuyu": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
    },
    "feilisidin": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "xianbei": {
        legionName: "古典时代肃慎军团",
        legionType: "region",
    },
    "wuhuan": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "fuyu": {
        legionName: "古典时代肃慎军团",
        legionType: "region",
    },
    "murong": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "yilou": {
        legionName: "古典时代肃慎军团",
        legionType: "region",
    },
    "liao_d": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "kumoxi": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "sumo": {
        legionName: "古典时代高陀军团",
        legionType: "sub",
    },
    "jiashi_d": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "funan": {
        legionName: "古典时代扶南军团",
        legionType: "sub",
    },
    "xichu": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "aztec": {
        legionName: "帝国时代特诺奇军团",
        legionType: "sub",
    },
    "bogendigongguo": {
        legionName: "城堡时代勃艮第公国军团",
        legionType: "sub",
    },
    "aquidan": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "yinggelan": {
        legionName: "城堡时代萨克森选侯国军团",
        legionType: "sub",
    },
    "tuomengde": {
        legionName: "城堡时代盖尔军团",
        legionType: "sub",
    },
    "gewennesi": {
        legionName: "城堡时代盖尔军团",
        legionType: "sub",
    },
    "weiershigongguo": {
        legionName: "城堡时代盖尔军团",
        legionType: "sub",
    },
    "wuzhou_d": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "kaernute": {
        legionName: "古典时代高卢军团",
        legionType: "sub",
    },
    "boluo": {
        legionName: "封建时代波罗军团",
        legionType: "sub",
    },
    "luoma_diguo": {
        legionName: "古典时代罗马军团",
        legionType: "sub",
    },
    "seleisi": {
        legionName: "封建时代阿德里安堡军团",
        legionType: "sub",
    },
    "pangzha": {
        legionName: "帝国时代旁遮普军团",
        legionType: "sub",
    },
    "gaolu": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "falanji": {
        legionName: "封建时代法兰克军团",
        legionType: "sub",
    },
    "xigete": {
        legionName: "城堡时代崖城卫队军团",
        legionType: "sub",
    },
    "donggete": {
        legionName: "古典时代西哥特军团",
        legionType: "sub",
    },
    "sashan": {
        legionName: "古典时代萨珊军团",
        legionType: "sub",
    },
    "danmai": {
        legionName: "城堡时代丹麦骑士军团",
        legionType: "sub",
    },
    "nuowei": {
        legionName: "封建时代维京军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-05 主人令「去找合适的套用上」] 三支新二级军团的势力：
    //    撒克逊 → 麦西亚（奥法）、盎格鲁（阿尔弗雷德，见上）；丹麦 → 丹麦（见上）；瓦良格 → 瑞典（瓦良格卫队主要出自瑞典人）
    "maixiya": {
        legionName: "封建时代奥托铁卫军团",
        legionType: "sub",
    },
    "ruidian_si": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "xiongren": {
        legionName: "古典时代匈人军团",
        legionType: "sub",
    },
    "ethiopia": {
        legionName: "古典时代阿克苏姆军团",
        legionType: "sub",
    },
    "yidelisi": {
        legionName: "封建时代柏柏尔军团",
        legionType: "sub",
    },
    "mulabite": {
        legionName: "城堡时代摩尔军团",
        legionType: "sub",
    },
    "chenla": {
        legionName: "城堡时代吴哥军团",
        legionType: "sub",
    },
    "gurjara": {
        legionName: "封建时代古贾拉铁骑军团",
        legionType: "sub",
    },
    "wulaertu": {
        legionName: "古典时代大亚美尼亚军团",
        legionType: "sub",
    },
    "ashikaga": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "womaya": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "alabo": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "maya": {
        legionName: "封建时代尤卡坦军团",
        legionType: "sub",
    },
    "goryeo": {
        legionName: "封建时代新罗军团",
        legionType: "sub",
    },
    "joseon": {
        legionName: "城堡时代高丽军团",
        legionType: "sub",
    },
    "tuosikana": {
        legionName: "城堡时代意大利城邦军团",
        legionType: "sub",
    },
    "deli": {
        legionName: "城堡时代德里苏丹国军团",
        legionType: "sub",
    },
    "mowoer": {
        legionName: "帝国时代莫卧儿军团",
        legionType: "sub",
    },
    "manding": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
    },
    "jienei": {
        legionName: "封建时代加纳军团",
        legionType: "sub",
    },
    "malacca": {
        legionName: "城堡时代爪哇军团",
        legionType: "sub",
    },
    "malai": {
        legionName: "城堡时代爪哇军团",
        legionType: "sub",
    },
    "pagan": {
        legionName: "城堡时代阿瓦军团",
        legionType: "sub",
    },
    "miandian": {
        legionName: "帝国时代缅甸军团",
        legionType: "sub",
    },
    "dayue": {
        legionName: "城堡时代大越军团",
        legionType: "sub",
    },
    "xixiliwangguo": {
        legionName: "城堡时代诺曼军团",
        legionType: "sub",
    },
    "boximiya": {
        legionName: "城堡时代胡斯军团",
        legionType: "sub",
    },
    "zhuluo": {
        legionName: "封建时代朱罗军团",
        legionType: "sub",
    },
    "pandiya": {
        legionName: "城堡时代维查耶那加尔军团",
        legionType: "sub",
    },
    "gelujiya": {
        legionName: "城堡时代格鲁吉亚军团",
        legionType: "sub",
    },
    "dajin": {
        legionName: "城堡时代大金军团",
        legionType: "sub",
    },
    "muisca": {
        legionName: "城堡时代穆伊斯卡军团",
        legionType: "sub",
    },
    "tupi": {
        legionName: "帝国时代塔莫约军团",
        legionType: "sub",
    },
    "kasidiliya": {
        legionName: "城堡时代卡斯蒂利亚军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-18 主人令「放宽」] 换挂帝国时代西班牙征服军团（皮萨罗·利马 INCA；军团建筑文化仍 SPANISH，已放宽）
    "xibanya": {
        legionName: "帝国时代西班牙征服军团",
        legionType: "sub",
    },
    "alagong": {
        legionName: "城堡时代卡斯蒂利亚军团",
        legionType: "sub",
    },
    "putaoya": {
        legionName: "城堡时代葡萄牙王国军团",
        legionType: "sub",
    },
    "mapuche": {
        legionName: "帝国时代阿劳卡尼亚军团",
        legionType: "sub",
    },
    "song": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "wusun": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "xiliao": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "kanata": {
        legionName: "帝国时代科罗曼德尔军团",
        legionType: "sub",
    },
    "bulu": {
        legionName: "古典时代贵霜军团",
        legionType: "sub",
    },
    "abasi": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "buni": {
        legionName: "古典时代迦太基军团",
        legionType: "sub",
    },
    "bendou": {
        legionName: "城堡时代拜占庭军团",
        legionType: "sub",
    },
    "ansxi": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "champa": {
        legionName: "城堡时代吴哥军团",
        legionType: "sub",
    },
    "odrysian_late": {
        legionName: "古典时代色雷斯军团",
        legionType: "sub",
    },
    "qimu": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
    },
    "talasike": {
        legionName: "城堡时代阿兹特克军团",
        legionType: "sub",
    },
    "adal": {
        legionName: "帝国时代桑海军团",
        legionType: "sub",
    },
    "tianxiong": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "qiuchi": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "daxi_ming": {
        legionName: "起义军",
        legionType: "sub",
    },
    "basha_d": {
        legionName: "帝国时代洛韦克军团",
        legionType: "sub",
    },
    "luohu": {
        legionName: "城堡时代吴哥军团",
        legionType: "sub",
    },
    "zhangshicheng": {
        legionName: "起义军",
        legionType: "sub",
    },
    "dengmaoqi": {
        legionName: "起义军",
        legionType: "sub",
    },
    "shuntian": {
        legionName: "起义军",
        legionType: "sub",
    },
    "dacheng": {
        legionName: "帝国时代两江军团",
        legionType: "sub",
    },
    "ketagalan": {
        legionName: "帝国时代两江军团",
        legionType: "sub",
    },
    "erzhu": {
        legionName: "封建时代河朔军团",
        legionType: "sub",
    },
    "gaoqi_d": {
        legionName: "封建时代河朔军团",
        legionType: "sub",
    },
    "guiyi": {
        legionName: "封建时代河西军团",
        legionType: "sub",
    },
    "yangguan": {
        legionName: "古典时代凉州军团",
        legionType: "sub",
    },
    "xinluo": {
        legionName: "封建时代新罗军团",
        legionType: "sub",
    },
    // ── 21 位边疆/非宋城堡时代势力军团精准安置（2026-09-18 主人定）──
    "suke": {
        legionName: "城堡时代吴哥军团",
        legionType: "sub",
    },
    "lancang": {
        legionName: "城堡时代吴哥军团",
        legionType: "sub",
    },
    "taiyuan": {
        legionName: "城堡时代爪哇军团",
        legionType: "sub",
    },
    "ryukyu": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "nongzhigao": {
        legionName: "城堡时代江南军团",
        legionType: "sub",
    },
    "meitai": {
        legionName: "帝国时代恒河军团",
        legionType: "sub",
    },
    "luchuan": {
        legionName: "城堡时代阿瓦军团",
        legionType: "sub",
    },
    "dai": {
        legionName: "城堡时代阿瓦军团",
        legionType: "sub",
    },
    "luodian": {
        legionName: "城堡时代川峡军团",
        legionType: "sub",
    },
    "panyao": {
        legionName: "城堡时代江南军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-05 主人令「该是什么就是什么」] 这 4 家原先没登记军团、走文化区保底挂错了，按时代＋族归位：
    "shatuo": {            // 光禄城·李克用（沙陀，唐末，封建）
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "yuwen": {             // 武川镇·宇文泰（鲜卑，封建）
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-07 主人令「符合历史就行」] 原未登记回落一级母体的 10 家势力改套二级/三级军团
    "muer": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "xisi": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "baha": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "huluo": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "saerbadaer": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "kumisi": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "bendou_d": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "fulijiya": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "ldiya": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "kapaduoxiya": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "tailuona": {
        legionName: "帝国时代塔万廷军团",
        legionType: "sub",
    },
    "teweierqie": {
        legionName: "帝国时代阿劳卡尼亚军团",
        legionType: "sub",
    },
    // 🔴 [2026-10-18 按史] 美洲欧洲殖民城按其建城者/驻将挂欧洲军团，不再挂特诺奇/塔莫约等土著军团。
    //    新阿姆斯特丹（荷兰）无 DUTCH 三级军团，按建城者低地日耳曼落 SAXONS 帝国时代萨克森军团。
    "xinnidelan": {
        legionName: "帝国时代萨克森军团",
        legionType: "sub",
    },
    //    魁北克（新法兰西）无帝国时代法国殖民军团，按 FRANKS 帝国时代落重装骑兵军团。
    "xinfalanxi": {
        legionName: "帝国时代法兰西军团",
        legionType: "sub",
    },
    "xinxibanya": {
        legionName: "帝国时代西班牙征服军团",
        legionType: "sub",
    },
    //    圣多明各 1496 属城堡时代；西班牙城堡时代落圣地亚哥骑士团。
    "manzheboyi": {
        legionName: "城堡时代爪哇军团",
        legionType: "sub",
    },
    "zhelouqi": {
        legionName: "城堡时代维查耶那加尔军团",
        legionType: "sub",
    },
    "aoerlianggongguo": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "xiaaiji": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "kaliya": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "qibucha": {
        legionName: "帝国时代格查武士军团",
        legionType: "sub",
    },
    "tamoyue": {
        legionName: "帝国时代塔莫约军团",
        legionType: "sub",
    },
    "amaniyake": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "luben": {
        legionName: "城堡时代撒拉森军团",
        legionType: "sub",
    },
    "taimier": {
        legionName: "帝国时代科罗曼德尔军团",
        legionType: "sub",
    },
    "leangongguo": {
        legionName: "城堡时代卡斯蒂利亚军团",
        legionType: "sub",
    },
    "lagusa": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "meikelunbao": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "bosiniya": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "zhayan": {
        legionName: "城堡时代摩尔军团",
        legionType: "sub",
    },
    "babali": {
        legionName: "帝国时代巴巴里军团",
        legionType: "sub",
    },
    "telibolisi": {
        legionName: "帝国时代巴巴里军团",
        legionType: "sub",
    },
    "jileinaijia": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "nidelan": {
        legionName: "帝国时代德意志佣兵军团",
        legionType: "sub",
    },
    "pomeilaniya": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "nasier": {
        legionName: "城堡时代卡斯蒂利亚军团",
        legionType: "sub",
    },
    "pufaerci": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "hansa": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "weijing_york": {
        legionName: "封建时代丹麦王国军团",
        legionType: "sub",
    },
    "puluowangsi": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "feiniqi": {
        legionName: "古典时代迦太基军团",
        legionType: "sub",
    },
    "fulandesi": {
        legionName: "城堡时代法兰西骑士军团",
        legionType: "sub",
    },
    "bulabante": {
        legionName: "城堡时代勃艮第公国军团",
        legionType: "sub",
    },
    "piketai": {
        legionName: "封建时代高王近卫军团",
        legionType: "sub",
    },
    "mangsite": {
        legionName: "封建时代高王近卫军团",
        legionType: "sub",
    },
    "bulietani": {
        legionName: "封建时代盎格鲁撒克逊军团",
        legionType: "sub",
    },
    "saierweiya": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "habusibao": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "shiwaben": {
        legionName: "封建时代东法兰克军团",
        legionType: "sub",
    },
    "asikanani": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "wende": {
        legionName: "封建时代东法兰克军团",
        legionType: "sub",
    },
    "bafaliya": {
        legionName: "封建时代东法兰克军团",
        legionType: "sub",
    },
    "huohengsuolun": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "ruishi": {
        legionName: "城堡时代德意志骑士军团",
        legionType: "sub",
    },
    "mosike_gongguo": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "eluosi_diguo": {
        legionName: "帝国时代俄罗斯军团",
        legionType: "sub",
    },
    "daniebo": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "jialixiya": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "pusikefu_gongheguo": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "ouka": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "bosi_puluosi": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "teweier_gongguo": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "suzidaer": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "gesake": {
        legionName: "帝国时代俄罗斯军团",
        legionType: "sub",
    },
    "peilieya_gongguo": {
        legionName: "城堡时代博亚尔重骑军团",
        legionType: "sub",
    },
    "min": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "seljuq": {
        legionName: "城堡时代伊儿军团",
        legionType: "sub",
    },
    "date_d": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "chosokabe": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "otomo_d": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "kaga_d": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "suwa_d": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "kakizaki": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "so": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "gaya": {
        legionName: "古典时代高句丽军团",
        legionType: "sub",
    },
    "guishuang": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "hui": {
        legionName: "古典时代高句丽军团",
        legionType: "sub",
    },
    "wuji": {
        legionName: "古典时代肃慎军团",
        legionType: "sub",
    },
    "ashina": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "geluolu": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "tujue": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "ashide": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "duolu": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "rouran": {
        legionName: "古典时代匈奴军团",
        legionType: "sub",
    },
    "huihu": {
        legionName: "封建时代突厥军团",
        legionType: "sub",
    },
    "pulei": {
        legionName: "古典时代西域军团",
        legionType: "sub",
    },
    "chuyue": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "anxi": {
        legionName: "封建时代安西军团",
        legionType: "sub",
    },
    "an": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "jiazini": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "huarazim": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "suogediyana": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "sogdian": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "yanda": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "anushidgin": {
        legionName: "城堡时代察合台军团",
        legionType: "sub",
    },
    "fanyanna": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "ailao": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "dongxu": {
        legionName: "帝国时代缅甸军团",
        legionType: "sub",
    },
    "konbaung": {
        legionName: "帝国时代缅甸军团",
        legionType: "sub",
    },
    "hantawadi": {
        legionName: "帝国时代缅甸军团",
        legionType: "sub",
    },
    "cuanshi": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "paiwan": {
        legionName: "帝国时代马六甲军团",
        legionType: "sub",
    },
    "yelang": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "chenghan": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "fushi": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "ba": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "bandun": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "dixiang": {
        legionName: "古典时代华夏军团",
        legionType: "region",
    },
    "gongsun_d": {
        legionName: "古典时代太行军团",
        legionType: "sub",
    },
    "yang_aner": {
        legionName: "起义军",
        legionType: "sub",
    },
    "wuling": {
        legionName: "古典时代吴越军团",
        legionType: "sub",
    },
    "sui": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "huangwang": {
        legionName: "起义军",
        legionType: "sub",
    },
    "linshihong": {
        legionName: "起义军",
        legionType: "sub",
    },
    "she_ethnic": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "yizhi": {
        legionName: "古典时代大和军团",
        legionType: "sub",
    },
    "pyu": {
        legionName: "封建时代蒲甘军团",
        legionType: "sub",
    },
    "guzgan": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "kawusi": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "wuhu": {
        legionName: "封建时代河中军团",
        legionType: "sub",
    },
    "badakhshan": {
        legionName: "帝国时代乌兹别克军团",
        legionType: "sub",
    },
    "dulan_d": {
        legionName: "帝国时代赞德军团",
        legionType: "sub",
    },
    "kalan": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "wuyue": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "ahaomu": {
        legionName: "帝国时代恒河军团",
        legionType: "sub",
    },
    "shahelude": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "ribale": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "safawei": {
        legionName: "帝国时代赞德军团",
        legionType: "sub",
    },
    "yilihanguo": {
        legionName: "城堡时代伊儿军团",
        legionType: "sub",
    },
    "yilihanguo_d": {
        legionName: "城堡时代伊儿军团",
        legionType: "sub",
    },
    "asaibaijiang": {
        legionName: "城堡时代伊儿军团",
        legionType: "sub",
    },
    "wulaertu_guo": {
        legionName: "古典时代大亚美尼亚军团",
        legionType: "sub",
    },
    "keerjisi": {
        legionName: "封建时代巴格拉特铁骑军团",
        legionType: "sub",
    },
    "heti": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "pajiama": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "luomu": {
        legionName: "城堡时代加齐突骑军团",
        legionType: "sub",
    },
    "xibolai": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "maerta_qishi": {
        legionName: "帝国时代意大利雇佣军团",
        legionType: "sub",
    },
    "dibisi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "aiji": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "jialedi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "paermila": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "samaila": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "xikesuosi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "youfaladi": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "safawei_d": {
        legionName: "帝国时代赞德军团",
        legionType: "sub",
    },
    "sumeier": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "ailan": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "aiaoniya": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "nabatai": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "xike": {
        legionName: "帝国时代科罗曼德尔军团",
        legionType: "sub",
    },
    "jieri": {
        legionName: "封建时代朱罗军团",
        legionType: "sub",
    },
    "beileinisi": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "dedan": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "maidina": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "gulaishi": {
        legionName: "封建时代哈里发军团",
        legionType: "sub",
    },
    "xierwan": {
        legionName: "帝国时代阿拉伯军团",
        legionType: "sub",
    },
    "medang": {
        legionName: "封建时代三佛齐军团",
        legionType: "sub",
    },
    "ternate": {
        legionName: "帝国时代马六甲军团",
        legionType: "sub",
    },
    "suomunate": {
        legionName: "城堡时代古吉拉特军团",
        legionType: "sub",
    },
    "puxiangyindu": {
        legionName: "帝国时代葡萄牙军团",
        legionType: "sub",
    },
    "tupinijin": {
        legionName: "帝国时代葡萄牙军团",
        legionType: "sub",
    },
    "taino_d": {
        legionName: "帝国时代塔莫约军团",
        legionType: "sub",
    },
    "taino": {
        legionName: "帝国时代西班牙征服军团",
        legionType: "sub",
    },
    "chamorro": {
        legionName: "帝国时代马六甲军团",
        legionType: "sub",
    },
    "fodejiao": {
        legionName: "城堡时代葡萄牙王国军团",
        legionType: "sub",
    },
    "liaozu": {
        legionName: "帝国时代洛韦克军团",
        legionType: "sub",
    },
    "aimala": {
        legionName: "帝国时代塔万廷军团",
        legionType: "sub",
    },
    "aolisha": {
        legionName: "城堡时代维查耶那加尔军团",
        legionType: "sub",
    },
    "adile": {
        legionName: "帝国时代科罗曼德尔军团",
        legionType: "sub",
    },
    "foluolida": {
        legionName: "帝国时代西班牙征服军团",
        legionType: "sub",
    },
    "yilisi": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "sub",
    },
    "yisatisi": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "wuer": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "jiaye": {
        legionName: "封建时代沙希军团",
        legionType: "sub",
    },
    "muwaxide": {
        legionName: "城堡时代摩尔军团",
        legionType: "sub",
    },
    "chatigangren": {
        legionName: "帝国时代恒河军团",
        legionType: "sub",
    },
    "yilaka": {
        legionName: "帝国时代格查武士军团",
        legionType: "sub",
    },
    "xingelana": {
        legionName: "帝国时代西班牙征服军团",
        legionType: "sub",
    },
    //    卡塔赫纳 1741 是西班牙近代方阵守城，不取征服者军团。
    "gualani": {
        legionName: "帝国时代塔莫约军团",
        legionType: "sub",
    },
    "mallabhum": {
        legionName: "帝国时代恒河军团",
        legionType: "sub",
    },
    "gondarine": {
        legionName: "帝国时代阿姆哈拉军团",
        legionType: "sub",
    },
    "samtskhe": {
        legionName: "城堡时代格鲁吉亚军团",
        legionType: "sub",
    },
    "qutb_shahi": {
        legionName: "帝国时代科罗曼德尔军团",
        legionType: "sub",
    },
    "tutul_xiu": {
        legionName: "封建时代尤卡坦军团",
        legionType: "sub",
    },
    "kerman_bam": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "julushi": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "maermajika": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "ameng": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "eerbulushi": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "aliya": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "xuliya": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "emesene": {
        legionName: "城堡时代撒拉森军团",
        legionType: "sub",
    },
    "sute": {
        legionName: "古典时代粟特军团",
        legionType: "sub",
    },
    "zhageluosi": {
        legionName: "古典时代萨珊军团",
        legionType: "sub",
    },
    "lulisitan": {
        legionName: "古典时代萨珊军团",
        legionType: "sub",
    },
    "golpayegan_diqu": {
        legionName: "古典时代萨珊军团",
        legionType: "sub",
    },
    "meisuobudamiya": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "baihaliye": {
        legionName: "古典时代近东军团",
        legionType: "sub",
    },
    "kuida": {
        legionName: "城堡时代法尔斯军团",
        legionType: "sub",
    },
    "maikelan": {
        legionName: "封建时代德莱木军团",
        legionType: "sub",
    },
    "muertan": {
        legionName: "城堡时代五河军团",
        legionType: "sub",
    },
    "xindu": {
        legionName: "帝国时代旁遮普军团",
        legionType: "sub",
    },
    "ayinu_ezo": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "keernuwaye": {
        legionName: "古典时代布立吞军团",
        legionType: "sub",
    },
    "xinde": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "aolitai": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "shiyuzu": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },

    "chen": {
        legionName: "封建时代江淮军团",
        legionType: "region",
    },




    "xiou": {
        legionName: "古典时代吴越军团",
        legionType: "region",
    },
    "gouding": {
        legionName: "古典时代巴蜀军团",
        legionType: "region",
    },
    "luoyue": {
        legionName: "古典时代吴越军团",
        legionType: "region",
    },
    "cen_d": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "liren": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "zhuang_d": {
        legionName: "帝国时代两江军团",
        legionType: "region",
    },
    "jingpozu": {
        legionName: "帝国时代缅甸军团",
        legionType: "region",
    },
    "yiluokui": {
        legionName: "城堡时代阿兹特克军团",
        legionType: "region",
    },
    "saimien": {
        legionName: "封建时代拉利贝拉军团",
        legionType: "region",
    },
    "feierganna": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "alaokaniya": {
        legionName: "帝国时代阿劳卡尼亚军团",
        legionType: "region",
    },
    "xiaoa": {
        legionName: "封建时代拉利贝拉军团",
        legionType: "region",
    },
    "hamade": {
        legionName: "封建时代柏柏尔军团",
        legionType: "region",
    },
    "aguelabu": {
        legionName: "封建时代柏柏尔军团",
        legionType: "region",
    },
    "talike": {
        legionName: "封建时代柏柏尔军团",
        legionType: "region",
    },
    "safuyi": {
        legionName: "城堡时代意大利城邦军团",
        legionType: "region",
    },
    "qiuci": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "bohai": {
        legionName: "封建时代渤海军团",
        legionType: "region",
    },
    "genji": {
        legionName: "城堡时代幕府军团",
        legionType: "region",
    },
    "fujiwara": {
        legionName: "城堡时代幕府军团",
        legionType: "region",
    },
    "gaogouli": {
        legionName: "封建时代新罗军团",
        legionType: "region",
    },
    "baiji": {
        legionName: "封建时代新罗军团",
        legionType: "region",
    },
    "danluo": {
        legionName: "城堡时代高丽军团",
        legionType: "region",
    },
    "dongxia": {
        legionName: "城堡时代大金军团",
        legionType: "region",
    },
    "wure": {
        legionName: "封建时代渤海军团",
        legionType: "region",
    },
    "heishui": {
        legionName: "封建时代渤海军团",
        legionType: "region",
    },
    "sushen": {
        legionName: "封建时代渤海军团",
        legionType: "region",
    },
    "jilimi": {
        legionName: "城堡时代大金军团",
        legionType: "region",
    },
    "chagatai": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "yiwu": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "kepantuo": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "pisha": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "shache": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "shule": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "yanqi": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "gaochang": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "yarkand": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "yiduhu": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "yuchi": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "zhuxie": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "kala": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "tujishi": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "jibin": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "babuer": {
        legionName: "帝国时代莫卧儿军团",
        legionType: "region",
    },
    "dayuan": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "kokand": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "dayuzi": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "adao_d": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "shi_clan": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "khoja": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "kangju": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "zhaowu": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "loulan": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "khon": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "lang_clan": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "gling": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "chimei": {
        legionName: "起义军",
        legionType: "sub",
    },
    "baibo": {
        legionName: "起义军",
        legionType: "sub",
    },
    "shanshan": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "ava": {
        legionName: "城堡时代阿瓦军团",
        legionType: "region",
    },
    "mon": {
        legionName: "城堡时代阿瓦军团",
        legionType: "region",
    },
    "ganden": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "dalung": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "dong": {
        legionName: "城堡时代萨迦军团",
        legionType: "region",
    },
    "weitou": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "yumi": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "qiemo": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "pishan": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "ruoqiang": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "weili": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "wensu": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "duerbote": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "xiye": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "xingliao": {
        legionName: "封建时代新罗军团",
        legionType: "region",
    },
    "bailong": {
        legionName: "古典时代西域军团",
        legionType: "region",
    },
    "sai": {
        legionName: "封建时代安西军团",
        legionType: "region",
    },
    "weiwuer": {
        legionName: "城堡时代蒙兀儿军团",
        legionType: "region",
    },
    "najie": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "hali": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "delan": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "aba": {
        legionName: "古典时代萨珊军团",
        legionType: "sub",
    },
    "tajikezu": {
        legionName: "帝国时代叶尔羌军团",
        legionType: "region",
    },
    "midi": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "sulu": {
        legionName: "城堡时代爪哇军团",
        legionType: "region",
    },
    "sengjialuo": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "aodesuosi": {
        legionName: "古典时代色雷斯军团",
        legionType: "region",
    },
    "pidisha": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "tomara_gwalior": {
        legionName: "帝国时代莫卧儿军团",
        legionType: "region",
    },
    "minangkabau": {
        legionName: "城堡时代爪哇军团",
        legionType: "region",
    },
    "sijitai": {
        legionName: "古典时代爱奥尼亚军团",
        legionType: "region",
    },
    "aswaka": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "aornos": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "malli": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "dasaleiti": {
        legionName: "古典时代色雷斯军团",
        legionType: "region",
    },
    "hekaniya": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "jiduoluoxiya": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "kamanniyaxingsheng": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "keerman": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "zhalange": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "region",
    },
    "muxikani": {
        legionName: "古典时代贵霜军团",
        legionType: "region",
    },
    "dalriada": {
        legionName: "封建时代高王近卫军团",
        legionType: "sub",
    },
    "scotland": {
        legionName: "城堡时代盖尔军团",
        legionType: "sub",
    },
    "chanka": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
    },
    "ouchi": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "cueva": {
        legionName: "帝国时代格查武士军团",
        legionType: "sub",
    },
    "maynila": {
        legionName: "帝国时代马六甲军团",
        legionType: "sub",
    },
    "gujarat": {
        legionName: "帝国时代古吉拉特军团",
        legionType: "sub",
    },
    "arakan": {
        legionName: "帝国时代缅甸军团",
        legionType: "sub",
    },
    "voc": {
        legionName: "帝国时代马六甲军团",
        legionType: "sub",
    },
    "kosala": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "kalinga": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "anga": {
        legionName: "古典时代贵霜军团",
        legionType: "sub",
    },
    "shunga": {
        legionName: "古典时代泰米尔军团",
        legionType: "sub",
    },
    "antigonid": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
    },
    "hou_han": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "yuan_shao": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "hou_jin": {
        legionName: "封建时代河朔军团",
        legionType: "sub",
    },
    "hou_zhao": {
        legionName: "古典时代太行军团",
        legionType: "sub",
    },
    "da_yan": {
        legionName: "封建时代河朔军团",
        legionType: "sub",
    },
    "hou_liang": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "han_zhao": {
        legionName: "古典时代太行军团",
        legionType: "sub",
    },
    "dongjin": {
        legionName: "古典时代吴越军团",
        legionType: "sub",
    },
    "nan_liang": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "hou_qin": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "yiqu": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "hou_zhou": {
        legionName: "封建时代中原军团",
        legionType: "sub",
    },
    "lvbu": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "chengjia": {
        legionName: "古典时代巴蜀军团",
        legionType: "sub",
    },
    "qianshu": {
        legionName: "封建时代剑南军团",
        legionType: "sub",
    },
    "chuguo": {
        legionName: "先秦军团",
        legionType: "sub",
    },
    "liusong": {
        legionName: "古典时代吴越军团",
        legionType: "sub",
    },
    "nanqi": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "yangwu": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "nantang": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "machu": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "nanhan": {
        legionName: "封建时代江淮军团",
        legionType: "sub",
    },
    "fangguozhen": {
        legionName: "城堡时代江南军团",
        legionType: "sub",
    },
    "liang_shuofang": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "qianliang": {
        legionName: "古典时代凉州军团",
        legionType: "sub",
    },
    "dangchang_guo": {
        legionName: "封建时代吐蕃军团",
        legionType: "sub",
    },
    "sanada": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "tokugawa": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "amago": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "shimazu": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "mori": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "uesugi": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "takeda": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "toyotomi": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "utsunomiya": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "ryuzoji": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "nanchou": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "nanbu_shi": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "shoni": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "heishi": {
        legionName: "城堡时代幕府军团",
        legionType: "sub",
    },
    "imagawa": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "oda": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "hojo": {
        legionName: "帝国时代武家军团",
        legionType: "sub",
    },
    "mahan": {
        legionName: "古典时代高句丽军团",
        legionType: "sub",
    },
    "daquyue": {
        legionName: "封建时代瞿越军团",
        legionType: "sub",
    },
    "yuenan": {
        legionName: "帝国时代安南军团",
        legionType: "sub",
    },
};

