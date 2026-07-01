/**
 * 青藏文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与其它文化区一致：
 * - 番号 3–5 个汉字（界面最多 5 字，禁止 6 字），全局不重复
 * - 同势力只挂一个番号（吐蕃合挂「却杰」赞普亲卫）
 * - 番号去「重装」泛称；依据 史料/古代精锐部队.md §12 共 11 支
 */
export const TIBET_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  keliya: { name: '疏勒镇军', tier: 4 },   // 阿什库尔·尉迟曜于阗王助唐（常规番号，降T3）
  qinghai: { name: '青海汛兵', tier: 4 }, // 噶斯口·岳钟琪出噶斯口平罗卜藏丹津（常规番号，降T3）
  xining: { name: '西宁边军', tier: 4 }, // 马海台·杨应琚整顿边军（常规番号，降T3）
  dulan: { name: '和硕特精骑', tier: 4 }, // 台吉乃尔·达什巴图尔（缺乏极其著名的战术高光，降T3）
    kalun: { name: '尕斯铁卫', tier: 4 },
  shaodang: { name: '湟中义从羌', tier: 3 },  // 东汉经典羌族从军制度，兵种名号极具特色，升T2
  tubo: { name: '吐蕃大纛军', tier: 1 },       // 逻些·松赞干布吐蕃大纛军
  gar: { name: '却杰军', tier: 1 },           // 萨毗城·论钦陵大破唐军的野战主力
  tuyu_d: { name: '青海骢精骑', tier: 3 },    // 吐谷浑青海骢名马文化符号（李白杜甫诗咏），升T2
  dafeichuan: { name: '退浑骑', tier: 4 },    // 大非川·《旧唐书》载“退浑之众”（缺乏极其著名的战术高光，降T3）
  xiangxiong: { name: '象雄武士', tier: 3 },  // 西藏史前最大王国铜铁甲武士，苯教文明核心武力，兵种特色鲜明，升T2
  gar_kham: { name: '德格骁骑', tier: 4 },    // 德格·康巴朵康先锋骑（§12 #7）（缺乏极其著名的战术高光，降T3）
  guge: { name: '古格甲兵', tier: 3 },        // 札布让·阿里古格王国（缺乏极其著名的战术高光，降T3）
  khoshut: { name: '和硕特铁骑', tier: 1 },   // 当雄·固始汗武力统一雪域的战略主力
    pazhu: { name: '江孜宗武士', tier: 4 },
  gurkha: { name: '廓尔喀弯刀', tier: 1 },    // 加德满都·廓尔喀库克里勇士
  tsangpa: { name: '藏巴汗卫队', tier: 3 },   // 桑珠孜·藏巴汗亲卫
  // ── 2026-06-16 新增：青藏大区平衡补全（23支） ──
  yangtong: { name: '羊同勇士', tier: 4 },  // 龙木错·赤松德赞征羊同（缺乏极其著名的战术高光，降T3）
  supi: { name: '苏毗女卫', tier: 4 },
  xiaobolu: { name: '勃律轻骑', tier: 4 },
    gandenpozhang: { name: '扎敦卫藏兵', tier: 4 },
  gaxa: { name: '噶厦代本', tier: 4 },
  ladakh: { name: '拉达克卫队', tier: 4 },
  spurgyal: { name: '悉补野王军', tier: 4 },
  khon: { name: '萨迦法王军', tier: 4 },               // 缺乏知名度支撑，降T3
  lang_clan: { name: '帕木竹巴军', tier: 4 },
  karmapa: { name: '噶玛巴护教', tier: 4 },
  golog: { name: '果洛游骑', tier: 4 },
  xihai_d: { name: '西海骁锐', tier: 4 },     // 伏俟城·隋西海郡属县戍兵（郡治无专将）
  heyuan_d: { name: '河源军', tier: 2 },        // 花石峡·黑齿常之夜袭吐蕃大营（战术突袭，T2）
  monpa: { name: '门巴勇士', tier: 4 },  // 错那·梅惹·洛珠嘉措归附达赖（缺乏极其著名的战术高光，降T3）
  lopi: { name: '珞巴武士', tier: 4 },
  humi: { name: '瓦罕弓骑', tier: 4 },
  nvguo: { name: '女国禁卫', tier: 4 },
  // 康区长刀卒除名（无此兵种）
  bailang: { name: '白狼锐卒', tier: 4 },
  faqiang: { name: '发羌劲卒', tier: 4 },  // 萨噶·论钦陵征服发羌（缺乏极其著名的战术高光，降T3）
  duomi: { name: '多弥山兵', tier: 4 },
  xiutu: { name: '休屠王骑', tier: 4 },
  jiashi: { name: '迦湿弥罗卫', tier: 3 },  // 喀吉尔·王玄策借兵平乱（借兵辅助，T2）
  gongbu: { name: '工布长弓手', tier: 3 },
  kangba: { name: '康巴骁骑', tier: 3 },   // 康巴汉子尚武精神代名词，显著文化知名度，升T2
  xiadun: { name: '廷布卫队', tier: 4 },     // 廷布·夏仲不丹亲卫
  ali: { name: '阿里骑兵', tier: 4 },          // 噶大克·甘丹才旺收复阿里（缺乏极其著名的战术高光，降T3）
    gaoliang: { name: '茂州飞骑', tier: 4 },
  nandou: { name: '勃律山兵', tier: 4 },          // 孽多·苏失利据守抗唐（缺乏极其著名的战术高光，降T3）
  bailan: { name: '昌都僧兵', tier: 4 },        // 察木多·帕巴拉协助守城（缺乏极其著名的战术高光，降T3）
  jiantang: { name: '建塘马兵', tier: 4 },       // 独克宗·桑杰嘉措驻防（缺乏极其著名的战术高光，降T3）
  kongsa: { name: '孔萨土兵', tier: 4 },         // 甘孜·孔萨益多瞻对之役（常规番号，降T3）
  gling: { name: '岭国武士', tier: 3 },          // 格萨尔史诗英雄，藏族最伟大英雄IP，极高文化知名度，升T2
  khyungpo: { name: '藏北苏毗兵', tier: 2 },    // 琼波邦色率苏毗兵灭象雄，吐蕃统一史关键，升T2
  guangwu: { name: '河西边骑', tier: 4 },        // 令居·辛武贤出令居讨羌（常规番号，降T3）
  galangdiba: { name: '波密民兵', tier: 4 },     // 噶朗宗·旺钦顿堆波密土王（常规番号，降T3）
  daca: { name: '八宿马队', tier: 4 },           // 八宿宗·达擦济咙活佛辖地
  gongtang: { name: '贡唐马队', tier: 4 },       // 吉麦·贡唐仓活佛辖地
  nanjie: { name: '日土铁卫', tier: 4 },          // 日土宗·南杰旺秋拉达克边军
  niang: { name: '琼结卫', tier: 4 },                // 缺乏知名度支撑，降T3
  dalung: { name: '达隆寺僧兵', tier: 4 },
  dong: { name: '囊谦千户兵', tier: 4 },               // 缺乏知名度支撑，降T3
  hor: { name: '霍尔部勇士', tier: 4 },
    ganden: { name: '格鲁僧兵', tier: 4 },
};
