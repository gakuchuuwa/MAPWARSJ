/**
 * 青藏文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与其它文化区一致：
 * - 番号 3–5 个汉字（界面最多 5 字，禁止 6 字），全局不重复
 * - 同势力只挂一个番号（吐蕃合挂「却杰」赞普亲卫）
 * - 番号去「重装」泛称；依据 史料/古代精锐部队.md §12 共 11 支
 */
export const TIBET_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  shaodang: { name: '湟中义从羌', tier: 3 },  // 玛曲·河湟烧当羌义从骑（§12 #1）
  gusiluo: { name: '青唐甲骑', tier: 3 },     // 青唐城·唃厮啰青唐甲（§12 #2）
  tubo: { name: '却杰军', tier: 0 },           // 逻些·大非川（671）论钦陵破薛仁贵；chos-rje 赞普法王武士
  tuyu_d: { name: '青海骢精骑', tier: 2 },    // 伏俟城·吐谷浑青海骢（§12 #4）
  xiangxiong: { name: '象雄武士', tier: 2 },  // 穹窿银·象雄铜铁甲武士（§12 #5）
  gar_kham: { name: '康巴骁骑', tier: 2 },    // 德格·康巴朵康先锋骑（§12 #7）
  guge: { name: '古格甲兵', tier: 3 },        // 札布让·古格锁子甲步兵（§12 #8）
  khoshut: { name: '和硕特铁骑', tier: 3 },   // 当雄·固始汗卫拉特铁骑（§12 #9）
  pazhu: { name: '帕竹甲兵', tier: 3 },       // 江孜·帕木竹巴绛曲坚赞甲兵（§12 #10）
  gurkha: { name: '廓尔喀弯刀', tier: 1 },    // 加德满都·廓尔喀库克里勇士（§12 #11）
  tsangpa: { name: '藏巴汗卫队', tier: 3 },   // 桑珠孜·藏巴汗亲卫
  // ── 2026-06-16 新增：青藏大区平衡补全（23支） ──
  yangtong: { name: '羊同勇士', tier: 3 },
  supi: { name: '苏毗女卫', tier: 3 },
  xiaobolu: { name: '勃律轻骑', tier: 3 },
  gandenpozhang: { name: '甘丹颇章军', tier: 3 },
  gaxa: { name: '噶厦代本', tier: 3 },
  ladakh: { name: '拉达克卫队', tier: 3 },
  spurgyal: { name: '悉补野王军', tier: 3 },
  khon: { name: '萨迦法王军', tier: 3 },
  lang_clan: { name: '帕木竹巴军', tier: 3 },
  karmapa: { name: '噶玛巴护教', tier: 3 },
  jinchuan_g: { name: '金川土司兵', tier: 3 },
  golog: { name: '果洛游骑', tier: 3 },
  monpa: { name: '门巴勇士', tier: 3 },
  lopi: { name: '珞巴武士', tier: 3 },
  humi: { name: '瓦罕弓骑', tier: 3 },
  nvguo: { name: '女国禁卫', tier: 2 },
  kangba: { name: '康区长刀卒', tier: 3 },
  bailang: { name: '白狼锐卒', tier: 3 },
  faqiang: { name: '发羌劲卒', tier: 3 },
  duomi: { name: '多弥山兵', tier: 3 },
  xiutu: { name: '休屠王骑', tier: 3 },
  jiashi: { name: '迦湿弥罗卫', tier: 3 },
  gongbu: { name: '工布长弓手', tier: 3 },
};
