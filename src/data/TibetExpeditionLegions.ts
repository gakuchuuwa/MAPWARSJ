/**
 * 青藏文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与其它文化区一致：
 * - 番号 3–5 个汉字（界面最多 5 字，禁止 6 字），全局不重复
 * - 同势力只挂一个番号（吐蕃合挂「却杰」赞普亲卫）
 * - 番号去「重装」泛称；依据 史料/古代精锐部队.md §12 共 11 支
 */
export const TIBET_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  keliya: { name: '疏勒边戍', tier: 2 },   // 阿什库尔·尉迟曜于阗王助唐
  qinghai: { name: '青海汛兵', tier: 2 }, // 噶斯口·岳钟琪出噶斯口平罗卜藏丹津
  xining: { name: '西宁边军', tier: 2 }, // 马海台·杨应琚整顿边军
  dulan: { name: '和硕特精骑', tier: 2 }, // 台吉乃尔·达什巴图尔
  kalun: { name: '尕斯戍卒', tier: 3 },  // 尕斯淖尔
  shaodang: { name: '湟中义从羌', tier: 3 },  // 玛曲·河湟烧当羌义从骑（§12 #1）
  tubo: { name: '吐蕃大纛军', tier: 2 },       // 逻些·松赞干布吐蕃大纛军
  gar: { name: '却杰军', tier: 1 },           // 萨毗城·论钦陵却杰军（以众击寡，降T1）
  tuyu_d: { name: '青海骢精骑', tier: 2 },    // 伏俟城·吐谷浑青海骢（§12 #4）
  xiangxiong: { name: '象雄武士', tier: 2 },  // 穹窿银·象雄铜铁甲武士（§12 #5）
  gar_kham: { name: '德格骁骑', tier: 2 },    // 德格·康巴朵康先锋骑（§12 #7）
  guge: { name: '古格甲兵', tier: 2 },        // 札布让·阿里古格王国
  khoshut: { name: '和硕特铁骑', tier: 2 },   // 当雄·固始汗卫拉特铁骑（武力统战雪域，升T1）
  pazhu: { name: '江孜宗武士', tier: 3 },       // 江孜·江孜法王热丹衮桑帕（原帕竹甲兵，与lang_clan重复且与江孜据点及武将错位）
  gurkha: { name: '廓尔喀弯刀', tier: 1 },    // 加德满都·廓尔喀库克里勇士（§12 #11）
  tsangpa: { name: '藏巴汗卫队', tier: 3 },   // 桑珠孜·藏巴汗亲卫
  // ── 2026-06-16 新增：青藏大区平衡补全（23支） ──
  yangtong: { name: '羊同勇士', tier: 2 },  // 龙木错·赤松德赞征羊同
  supi: { name: '苏毗女卫', tier: 3 },
  xiaobolu: { name: '勃律轻骑', tier: 3 },
  gandenpozhang: { name: '甘丹颇章军', tier: 3 },
  gaxa: { name: '噶厦代本', tier: 3 },
  ladakh: { name: '拉达克卫队', tier: 3 },
  spurgyal: { name: '悉补野王军', tier: 3 },
  khon: { name: '萨迦法王军', tier: 2 },
  lang_clan: { name: '帕木竹巴军', tier: 3 },
  karmapa: { name: '噶玛巴护教', tier: 3 },
  jinchuan_g: { name: '金川土司兵', tier: 2 }, // 金川·大小金川之役（威名赫赫，升T2）
  golog: { name: '果洛游骑', tier: 3 },
  xihai_d: { name: '威定戍卒', tier: 3 },     // 伏俟城·隋西海郡属县戍兵（郡治无专将）
  heyuan_d: { name: '河源军', tier: 0 },        // 花石峡·黑齿常之夜袭破数万吐蕃（升T0）
  monpa: { name: '门巴勇士', tier: 2 },  // 错那·梅惹·洛珠嘉措归附达赖
  lopi: { name: '珞巴武士', tier: 3 },
  humi: { name: '瓦罕弓骑', tier: 3 },
  nvguo: { name: '女国禁卫', tier: 3 },
  // 康区长刀卒除名（无此兵种）
  bailang: { name: '白狼锐卒', tier: 3 },
  faqiang: { name: '发羌劲卒', tier: 2 },  // 萨噶·论钦陵征服发羌
  duomi: { name: '多弥山兵', tier: 3 },
  xiutu: { name: '休屠王骑', tier: 3 },
  jiashi: { name: '迦湿弥罗卫', tier: 1 },  // 喀吉尔·李玄策征克什米尔兵
  gongbu: { name: '工布长弓手', tier: 3 },
  kangba: { name: '康巴骁骑', tier: 2 },   // 理塘宗·康巴
  song2: { name: '松州边军', tier: 3 },      // 嘉诚·唐松州抗蕃戍卒
  xiadun: { name: '廷布卫队', tier: 3 },     // 廷布·夏仲不丹亲卫
  ali: { name: '阿里骑兵', tier: 2 },          // 噶大克·甘丹才旺收复阿里
  gaoliang: { name: '茂州戍卒', tier: 3 },      // 茂州·唐茂州戍卒（注意：这里是川西茂州，并非广东茂名！底层据点占位借用）
  nandou: { name: '勃律山兵', tier: 2 },          // 孽多·苏失利据守抗唐
  bailan: { name: '昌都僧兵', tier: 2 },        // 察木多·帕巴拉协助守城
  jiantang: { name: '建塘马兵', tier: 2 },       // 独克宗·桑杰嘉措驻防
  kongsa: { name: '孔萨土兵', tier: 2 },         // 甘孜·孔萨益多瞻对之役
  gling: { name: '岭国武士', tier: 2 },          // 结古宗·岭格萨尔史诗英雄
  khyungpo: { name: '藏北苏毗兵', tier: 2 },    // 丁青宗·琼波·邦色率苏毗兵灭象雄
  guangwu: { name: '河西边骑', tier: 2 },        // 令居·辛武贤出令居讨羌
  galangdiba: { name: '波密民兵', tier: 2 },     // 噶朗宗·旺钦顿堆波密土王
  daca: { name: '八宿马队', tier: 3 },           // 八宿宗·达擦济咙活佛辖地
  gongtang: { name: '贡唐马队', tier: 3 },       // 吉麦·贡唐仓活佛辖地
  nanjie: { name: '日土边军', tier: 3 },          // 日土宗·南杰旺秋拉达克边军
  niang: { name: '觉木宗戍军', tier: 2 },
  dalung: { name: '达隆寺僧兵', tier: 3 },
  dong: { name: '囊谦千户兵', tier: 2 },
  hor: { name: '霍尔部勇士', tier: 3 },
  ganden: { name: '甘丹寺僧兵', tier: 3 },
};
