/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 🔴 [2026-09-14 主人定「谁让你各存了，给我删了」]
 *   本表**只存指针，不存编制**：一条记录只回答「这个势力挂哪支军团」。
 *   编制在三层军团表里，一支军团一份：
 *     一级 16 母体 → `CultureFormations.ts` 的 `BASE_16_TIERS_MAP`
 *     二级 59 文明 → `level2Civ59Legions.ts`
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
    "dian": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
    },
    "shuizhen": {
        legionName: "帝国时代华夏军团",
        legionType: "region",
    },
    "wu": {
        legionName: "古典时代华夏江南军团",
        legionType: "sub",
    },
    "shanzhou": {
        legionName: "封建时代隋唐军团",
    },
    "qin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "xin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "ruo": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "baiyang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "wazhai": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "shangzhou": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "nanyue": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "han_d": {
        legionName: "古典时代华夏中原军团",
        legionType: "sub",
    },
    "xianyu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "shuofang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "li_lx_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "huaiyang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "yangshao": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "xiyuduhu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "jiluo_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "lulin": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "you": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "jingzhou_gs": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "quli": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "dongsheng": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "liu": {
        legionName: "古典时代秦汉军团",
    },
    "huizhou_d": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "shu": {
        legionName: "古典时代华夏巴蜀军团",
        legionType: "sub",
    },
    "chu": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "langzhou": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "jingmen": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "cangsong": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "qingqiang": {
        legionName: "古典时代秦汉军团",
        legionType: "region",
    },
    "cao_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "sima_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "lu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "wudu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "guzhu": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "huang_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "bozhou_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "danyang": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "yuzhou": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "zhong": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "tingzhou_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "liangzhou": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "ranwei_d": {
        legionName: "古典时代魏晋军团",
        legionType: "region",
    },
    "maqidun": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
    },
    "xiqin": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
    },
    "li_s": {
        legionName: "古典时代秦汉军团",
    },
    "dianguo": {
        legionName: "古典时代先秦军团",
    },
    "ming_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "mazhaer": {
        legionName: "城堡时代马扎尔军团",
        legionType: "sub",
    },
    "xiongyati": {
        legionName: "城堡时代马扎尔军团",
        legionType: "sub",
    },
    "qiekase": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
    },
    "keluodiya": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
    },
    "bolan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "deniesite": {
        legionName: "帝国时代斯拉夫军团",
        legionType: "region",
    },
    "baojialiya": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
    },
    "mengtainiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "moerdaweiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "walajiyia": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "duobuluojia": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "kuertaiya": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "vidin_tsardom": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "shaiyue": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
    },
    "molaweiya": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
    },
    "damolaweiya": {
        legionName: "封建时代斯拉夫军团",
        legionType: "region",
    },
    "piyasite": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "zhituo": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "luosi": {
        legionName: "城堡时代斯拉夫军团",
        legionType: "sub",
    },
    "qiernigeweifu_gongguo": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
    },
    "xideweina": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
    },
    "fangla": {
        legionName: "帝国时代华夏军团",
    },
    "xiadunhe": {
        legionName: "封建时代罗斯军团",
        legionType: "region",
    },
    "batawei": {
        legionName: "古典时代日耳曼军团",
        legionType: "region",
    },
    "aersasi": {
        legionName: "古典时代日耳曼军团",
        legionType: "region",
    },
    "xianlingqiang": {
        legionName: "古典时代羌族军团",
        legionType: "region",
    },
    "shaodang": {
        legionName: "古典时代羌族军团",
        legionType: "region",
    },
    "guangwu": {
        legionName: "古典时代羌族军团",
        legionType: "region",
    },
    "xiutu": {
        legionName: "古典时代羌族军团",
        legionType: "region",
    },
    "nuogai": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "bashekeer": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "xibo_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "oirat_ming": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "dzungar": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "kazakh": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tuoming": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tuerhute": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tushetu": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tumed": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tumengken": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "tuva": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "zhasaketu": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "kaerka": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "wuzhumuqin": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "xingan": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "chechen": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "sunite": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "buriat": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "huite": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "nuoyan_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "wuli_d": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "wulianghai": {
        legionName: "帝国时代草原军团",
        legionType: "region",
    },
    "xiajiasi": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "juqu_d": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "helian": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "tiele": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "xueyantuo": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "shiwei": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "gaoche": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "bulat": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "bayegu": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "xierhe": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "yuezhi": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "mangshi": {
        legionName: "封建时代草原军团",
        legionType: "region",
    },
    "dingling": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "xiongnu": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "cheshihou": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "xijue": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "huyan": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "baidi": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "heisha_d": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "yada": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "jie": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "saman": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "mamon": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "keerkezi": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "qiepantuo": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "maer_d": {
        legionName: "封建时代河中军团",
        legionType: "region",
    },
    "jiatailuoniya": {
        legionName: "封建时代拉丁军团",
        legionType: "region",
    },
    "fuguo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "yangtong": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "tufa_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "dangxiang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "song2": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "tubo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "qifu_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "tuyu_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xiaobolu": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xihai_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "heyuan_d": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "dafeichuan": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "yeli": {
        legionName: "封建时代吐蕃军团",
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
    "spurgyal": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "humi": {
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
    "keliya": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "gongbu": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xiangxiong": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "gaoliang": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "nandou": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "gar": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "duomi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "nvguo": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "jiashi": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "xiazhou": {
        legionName: "封建时代吐蕃军团",
        legionType: "region",
    },
    "gongtang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "khoshut": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "gaxa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "jinchuan_g": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "gurkha": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "xiadun": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "ladakh": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "tsangpa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "monpa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "lopi": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "karmapa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "golog": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "nanjie": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "gandenpozhang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "gar_kham": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "kongsa": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "daca": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "hor": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "jiantang": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "galangdiba": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "ali": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "dulan": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "kangba": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "xining": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "kalun": {
        legionName: "帝国时代青藏军团",
        legionType: "region",
    },
    "qian_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "suzhou_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "tujia_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "zu_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "fang_guozhen": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "longwu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "lujian": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "mao_wenlong": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "ming_zheng": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "jingjiang": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "linhu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "linyu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "heng": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "jinzhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "qi_d": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "sunqin": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "guizhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "dayu": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "liuzhou": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "luming": {
        legionName: "帝国时代大明军团",
        legionType: "region",
    },
    "weiming": {
        legionName: "城堡时代党项军团",
        legionType: "region",
    },
    "nifuhe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "bailian": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "manzhou": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "manzhou_d": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "aisin_d": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "haixi_nvzhen": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "yeren_nvzhen": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "hezhe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "agui": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "gumie": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "nanai": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "feiyaka": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "dawoer": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "suolun": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "jilin": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "keerqin": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "eluoke": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "kuye": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "ewenki": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "dongping": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "maomingan": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "aola": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "yehe": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "wula": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "qinghai": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "wenling": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "elunchunzu": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "weiyuan": {
        legionName: "帝国时代满洲军团",
        legionType: "region",
    },
    "jiujiang": {
        legionName: "古典时代华夏军团",
    },
    "wuwu_d": {
        legionName: "古典时代华夏军团",
    },
    "shanyue": {
        legionName: "古典时代秦汉军团",
    },
    "chu_d": {
        legionName: "古典时代华夏军团",
    },
    "minyue": {
        legionName: "古典时代先秦军团",
    },
    "ouyue": {
        legionName: "古典时代先秦军团",
    },
    "yue_d": {
        legionName: "古典时代华夏军团",
    },
    "juandu": {
        legionName: "封建时代隋唐军团",
    },
    "shang": {
        legionName: "古典时代先秦军团",
    },
    "quanrong": {
        legionName: "古典时代草原军团",
        legionType: "region",
    },
    "yanchuan_d": {
        legionName: "城堡时代岳家军团",
        legionType: "sub",
    },
    "qi": {
        legionName: "古典时代先秦军团",
    },
    "kong_d": {
        legionName: "古典时代先秦军团",
    },
    "yin": {
        legionName: "古典时代先秦军团",
    },
    "zhou": {
        legionName: "古典时代先秦军团",
    },
    "shen": {
        legionName: "古典时代先秦军团",
    },
    "zi": {
        legionName: "古典时代先秦军团",
    },
    "jin": {
        legionName: "古典时代先秦军团",
    },
    "yangshe": {
        legionName: "古典时代先秦军团",
    },
    "yue": {
        legionName: "古典时代先秦军团",
    },
    "mi_chu": {
        legionName: "古典时代先秦军团",
    },
    "ruochu": {
        legionName: "古典时代先秦军团",
    },
    "yong": {
        legionName: "古典时代先秦军团",
    },
    "zhao": {
        legionName: "古典时代先秦军团",
    },
    "wuzhou": {
        legionName: "古典时代先秦军团",
    },
    "lingqiu": {
        legionName: "古典时代先秦军团",
    },
    "liguo": {
        legionName: "古典时代先秦军团",
    },
    "wei": {
        legionName: "古典时代华夏北方军团",
        legionType: "sub",
    },
    "liangshidu": {
        legionName: "古典时代先秦军团",
    },
    "yan": {
        legionName: "古典时代先秦军团",
    },
    "han": {
        legionName: "古典时代先秦军团",
    },
    "jiaodong": {
        legionName: "古典时代先秦军团",
    },
    "dongxian": {
        legionName: "古典时代先秦军团",
    },
    "chunshen": {
        legionName: "古典时代先秦军团",
    },
    "muong": {
        legionName: "城堡时代京族军团",
        legionType: "sub",
    },
    "xian_d": {
        legionName: "封建时代白蛮军团",
        legionType: "sub",
    },
    "nanzhao": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
    },
    "dali": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
    },
    "zangke": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
    },
    "wuman": {
        legionName: "封建时代白蛮军团",
        legionType: "region",
    },
    "luodesi": {
        legionName: "城堡时代十字军团",
        legionType: "region",
    },
    "yelusalengwg": {
        legionName: "城堡时代十字军团",
        legionType: "region",
    },
    "shengdian_qishi": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
    },
    "saipulusi": {
        legionName: "城堡时代十字军团",
        legionType: "region",
    },
    "aosiruowen": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
    },
    "antiaokegongguo": {
        legionName: "城堡时代十字军团",
        legionType: "sub",
    },
    "baojian_qishi": {
        legionName: "城堡时代条顿军团",
        legionType: "sub",
    },
    "tiaodun_qishi": {
        legionName: "城堡时代条顿军团",
        legionType: "sub",
    },
    "boumeilaniyan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "dabolan": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "hongluseniya": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "lesser_poland": {
        legionName: "城堡时代波兰军团",
        legionType: "sub",
    },
    "bolisiya": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
    },
    "litaowan": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
    },
    "nieman": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
    },
    "weijiebusike_gongguo": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
    },
    "telakaigongguo": {
        legionName: "城堡时代立陶宛军团",
        legionType: "sub",
    },
    "yashu": {
        legionName: "古典时代亚述军团",
        legionType: "region",
    },
    "guyashu": {
        legionName: "古典时代亚述军团",
        legionType: "region",
    },
    "adiyabeina": {
        legionName: "古典时代亚述军团",
        legionType: "region",
    },
    "tuoba": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
    },
    "bing": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
    },
    "zhongshan": {
        legionName: "封建时代隋唐军团",
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
        legionName: "古典时代希伦军团",
        legionType: "sub",
    },
    "yamaxun": {
        legionName: "古典时代亚马逊军团",
        legionType: "sub",
    },
    "talanduo": {
        legionName: "古典时代大希腊军团",
        legionType: "sub",
    },
    "baizanting": {
        legionName: "封建时代拜占庭军团",
        legionType: "sub",
    },
    "ayoubu": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
    },
    "mamuluke": {
        legionName: "城堡时代马穆鲁克军团",
        legionType: "region",
    },
    "guanche": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
    },
    "tigelei": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
    },
    "zhagewei": {
        legionName: "城堡时代非洲军团",
        legionType: "region",
    },
    "inca": {
        legionName: "城堡时代印加军团",
        legionType: "sub",
    },
    "tang": {
        legionName: "封建时代隋唐军团",
        legionType: "sub",
    },
    "jinzhang": {
        legionName: "城堡时代库曼军团",
        legionType: "sub",
    },
    "baojiaer": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "kelimiya": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "fuerjia": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "kelie": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "wala": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "wuliangha": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "dongshengwei": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "menggu_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "kumo": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "ogodei": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "kereyid": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "naiman": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "tatar": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "merkit": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "ongut": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "dada_ming": {
        legionName: "城堡时代鞑靼军团",
        legionType: "sub",
    },
    "chahar": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "yuan_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "da_yuan": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "kiyad": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "borjigin": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "jalair": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "hongirad": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "choros": {
        legionName: "城堡时代蒙古军团",
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
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "xianhai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "mengwu": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "zubu": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "wugu_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "chenli_d": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "manghuti": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "salai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "aertai": {
        legionName: "城堡时代蒙古军团",
        legionType: "sub",
    },
    "xuan": {
        legionName: "帝国时代大明军团",
        legionType: "sub",
    },
    "tuolemi": {
        legionName: "古典时代马其顿军团",
        legionType: "sub",
    },
    "siam": {
        legionName: "帝国时代东南亚军团",
        legionType: "sub",
    },
    "xushouhui": {
        legionName: "帝国时代大明军团",
        legionType: "sub",
    },
    "sunwu_d": {
        legionName: "古典时代华夏军团",
        legionType: "sub",
    },
    "kongque": {
        legionName: "古典时代印度军团",
        legionType: "sub",
    },
    "tiemuer": {
        legionName: "城堡时代鞑靼军团",
        legionType: "sub",
    },
    "varendra": {
        legionName: "城堡时代孟加拉军团",
        legionType: "sub",
    },
    "mojietuo": {
        legionName: "古典时代摩揭陀军团",
        legionType: "sub",
    },
    "jialatai": {
        legionName: "古典时代加拉太军团",
        legionType: "sub",
    },
    "osman": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
    },
    "aosimanbeiyiguo": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
    },
    "lumiliya": {
        legionName: "帝国时代奥斯曼军团",
        legionType: "sub",
    },
    "saierdika": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
    },
    "duonaobaojia": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
    },
    "jialiboli": {
        legionName: "封建时代保加利亚军团",
        legionType: "sub",
    },
    "kesa": {
        legionName: "封建时代可萨军团",
        legionType: "region",
    },
    "xiemian": {
        legionName: "封建时代可萨军团",
        legionType: "region",
    },
    "yidier": {
        legionName: "封建时代可萨军团",
        legionType: "region",
    },
    "aqimeinide": {
        legionName: "古典时代阿契美尼德军团",
        legionType: "sub",
    },
    "xiaofulijiya": {
        legionName: "古典时代波斯联合军团",
        legionType: "sub",
    },
    "kanan": {
        legionName: "古典时代迦南军团",
        legionType: "sub",
    },
    "tawantinsuyu": {
        legionName: "城堡时代克丘亚军团",
        legionType: "region",
    },
    "feilisidin": {
        legionName: "古典时代腓利斯丁军团",
        legionType: "region",
    },
    "xianbei": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "wuhuan": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "fuyu": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "donghu": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "murong": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "yingzhou_ying_d": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "yilou": {
        legionName: "古典时代鲜卑军团",
        legionType: "region",
    },
    "xiongding": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
    },
    "dingzhou": {
        legionName: "古典时代鲜卑军团",
        legionType: "sub",
    },
    "qidan": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "liao_d": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "dongdan": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "yel": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "kumoxi": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "sumo": {
        legionName: "古典时代印度军团",
        legionType: "region",
    },
    "jiashi_d": {
        legionName: "古典时代印度军团",
        legionType: "region",
    },
    "funan": {
        legionName: "古典时代东南亚军团",
        legionType: "region",
    },
    "xichu": {
        legionName: "古典时代秦汉军团",
        legionType: "sub",
    },
    "shazhou": {
        legionName: "封建时代契丹军团",
        legionType: "sub",
    },
    "aztec": {
        legionName: "城堡时代阿兹特克军团",
        legionType: "sub",
    },
    "bogendi": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
    },
    "bogendigongguo": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
    },
    "bogengnidielan": {
        legionName: "城堡时代勃艮第军团",
        legionType: "sub",
    },
    "aquidan": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "yinggelan": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "tuomengde": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "jinquehua": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "geluositeboguo": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "gewennesi": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "weiershigongguo": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "wuzhou_d": {
        legionName: "古典时代华夏中原军团",
        legionType: "sub",
    },
    "gaer": {
        legionName: "古典时代凯尔特军团",
        legionType: "sub",
    },
    "kaernute": {
        legionName: "古典时代凯尔特军团",
        legionType: "sub",
    },
    "boluo": {
        legionName: "古典时代孟加拉军团",
        legionType: "sub",
    },
    "luoma_diguo": {
        legionName: "古典时代罗马军团",
        legionType: "sub",
    },
    "seleisi": {
        legionName: "古典时代色雷斯军团",
        legionType: "sub",
    },
    "pangzha": {
        legionName: "古典时代普鲁军团",
        legionType: "sub",
    },
    "gaolu": {
        legionName: "封建时代法兰克军团",
        legionType: "sub",
    },
    "falanji": {
        legionName: "封建时代法兰克军团",
        legionType: "sub",
    },
    "xigete": {
        legionName: "封建时代哥特军团",
        legionType: "sub",
    },
    "donggete": {
        legionName: "封建时代哥特军团",
        legionType: "sub",
    },
    "sashan": {
        legionName: "封建时代波斯军团",
        legionType: "sub",
    },
    "nuosi": {
        legionName: "封建时代维京军团",
        legionType: "sub",
    },
    "danmai": {
        legionName: "封建时代维京军团",
        legionType: "sub",
    },
    "nuowei": {
        legionName: "封建时代维京军团",
        legionType: "sub",
    },
    "xiongren": {
        legionName: "封建时代匈人军团",
        legionType: "sub",
    },
    "ethiopia": {
        legionName: "封建时代埃塞俄比亚军团",
        legionType: "sub",
    },
    "yidelisi": {
        legionName: "封建时代柏柏尔军团",
        legionType: "sub",
    },
    "mulabite": {
        legionName: "封建时代柏柏尔军团",
        legionType: "sub",
    },
    "chenla": {
        legionName: "封建时代高棉军团",
        legionType: "sub",
    },
    "gurjara": {
        legionName: "封建时代瞿折罗军团",
        legionType: "sub",
    },
    "wulaertu": {
        legionName: "封建时代亚美尼亚军团",
        legionType: "sub",
    },
    "anggelu": {
        legionName: "城堡时代不列颠军团",
        legionType: "sub",
    },
    "ashikaga": {
        legionName: "城堡时代日本军团",
        legionType: "sub",
    },
    "yamato": {
        legionName: "城堡时代日本军团",
        legionType: "sub",
    },
    "womaya": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
    },
    "alabo": {
        legionName: "城堡时代萨拉森军团",
        legionType: "sub",
    },
    "maya": {
        legionName: "城堡时代玛雅军团",
        legionType: "sub",
    },
    "goryeo": {
        legionName: "城堡时代高丽军团",
        legionType: "sub",
    },
    "joseon": {
        legionName: "城堡时代高丽军团",
        legionType: "sub",
    },
    "yadelaiya": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
    },
    "lunbadi": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
    },
    "tuosikana": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
    },
    "bohepingyuan": {
        legionName: "城堡时代意大利军团",
        legionType: "sub",
    },
    "deli": {
        legionName: "城堡时代印度斯坦军团",
        legionType: "sub",
    },
    "mowoer": {
        legionName: "城堡时代印度斯坦军团",
        legionType: "sub",
    },
    "manding": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
    },
    "jienei": {
        legionName: "城堡时代马里军团",
        legionType: "sub",
    },
    "malacca": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
    },
    "malai": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
    },
    "sanfoqi": {
        legionName: "城堡时代马来军团",
        legionType: "sub",
    },
    "pagan": {
        legionName: "城堡时代缅甸军团",
        legionType: "sub",
    },
    "miandian": {
        legionName: "城堡时代缅甸军团",
        legionType: "sub",
    },
    "dayue": {
        legionName: "城堡时代越南军团",
        legionType: "sub",
    },
    "nguyen_guangnan": {
        legionName: "城堡时代越南军团",
        legionType: "sub",
    },
    "qincha": {
        legionName: "城堡时代库曼军团",
        legionType: "sub",
    },
    "xixiliwangguo": {
        legionName: "城堡时代西西里军团",
        legionType: "sub",
    },
    "boximiya": {
        legionName: "城堡时代波希米亚军团",
        legionType: "sub",
    },
    "zhuluo": {
        legionName: "城堡时代达罗毗荼军团",
        legionType: "sub",
    },
    "pandiya": {
        legionName: "城堡时代达罗毗荼军团",
        legionType: "sub",
    },
    "gelujiya": {
        legionName: "城堡时代格鲁吉亚军团",
        legionType: "sub",
    },
    "dajin": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
    },
    "jurchen": {
        legionName: "城堡时代女真军团",
        legionType: "sub",
    },
    "muisca": {
        legionName: "城堡时代穆伊斯卡军团",
        legionType: "sub",
    },
    "tupi": {
        legionName: "城堡时代图皮军团",
        legionType: "sub",
    },
    "kasidiliya": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
    },
    "xibanya": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
    },
    "alagong": {
        legionName: "帝国时代西班牙军团",
        legionType: "sub",
    },
    "putaoya": {
        legionName: "帝国时代葡萄牙军团",
        legionType: "sub",
    },
    "mapuche": {
        legionName: "帝国时代马普切军团",
        legionType: "sub",
    },
};
