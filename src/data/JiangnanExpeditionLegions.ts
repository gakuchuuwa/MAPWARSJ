/**
 * 江南文化区远征精锐军团名（JIANGNAN / RegionSystem「江南」）
 *
 * 【三者防重】旗号 / 据点名 / 番号 — 见 AGENTS.md §12.1、ExpeditionLegions.ts 文件头
 * 写入前：npm run expedition:triple-check
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §9 江南 21 支为主
 * - §1 #34 解烦兵交叉收录（孙吴@武昌，史籍属三国江南精锐）
 * - §9 #18–21 已挂岭南区；#9/#10/#16 无合格势力或与岳军重复
 * - 据点优先标志战场（戚家军@横屿等）；§1 #24 丹阳兵@宛陵城·山越（复用 shanyue）
 */
export const JIANGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, {
name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  chuzhou_d: { name: '清淮劲卒', tier: 4 },        // 清流关·皇甫晖守滁州抗蒙（缺乏极其著名的战术高光，降T3）
  she_ethnic: { name: '畲族山兵', tier: 3 },  // 具有极强东南丘陵风土特色与民族凝聚力的武装力量，升入T3知名
  shanyue: { name: '丹阳兵', tier: 2 },      // 三国精锐步兵兵源，战术素养极高，但未像虎豹骑主导大势，下调至T2战术
    chu: { name: '荆州校刀手', tier: 3 },
  sunwu_d: { name: '解烦兵', tier: 2 },      // 武昌·孙吴禁卫
  jinling: { name: '量沙军', tier: 2 },     // 南朝宋檀道济唱筹量沙，中国古代心理战与战术欺骗的极致代表，升入T2战术
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=寿·寿州）
  yang_zhou: { name: '黑云长剑都', tier: 2 },   // 广陵·杨行密黑云长剑都（扬州）
  lu: { name: '逍遥津突将', tier: 2 },       // 合肥·张辽八百破十万（一次性战术突击队）
  min: { name: '闽国亲从', tier: 4 },        // 冶城·王审知闽国亲从
  quanzhou: { name: '清源军', tier: 4 },        // 刺桐·留从效清源军

    yue_d: { name: '巴陵楼船', tier: 2 },
    xiangzhou: { name: '襄樊孤军', tier: 3 },
  zaoyang_d: { name: '忠顺军', tier: 1 },       // 枣阳·孟珙忠顺军（《宋史·孟珙传》）
  sizhou: { name: '克敌军', tier: 2 },       // 南宋因装备战术兵器克敌弓而建立的特种部队，属于战术兵器部队，下调至T2战术
    qian_d: { name: '嘉兴水师', tier: 3 },
    qi_d: { name: '鸳鸯阵兵', tier: 1 },
  jiujiang: { name: '蒙冲斗舰', tier: 2 },     // 东吴专门用于撞击的战术舰船，属于战术兵器兵种，而非宏大战略舰队，下调至T2战术
    fangla: { name: '圣公兵', tier: 3 },             // 方腊起义军的代表，震动东南半壁的著名农民起义符号，升入T3知名
    fang_guozhen: { name: '甬江水营', tier: 4 },
  ruochu: { name: '若敖六卒', tier: 2 },       // 楚国早期精锐，在楚庄王时期有战术高光，但非贯穿时代的战略主力，降为T2战术。
    mi_chu: { name: '左广右广', tier: 2 },
  heng: { name: '衡州义军', tier: 4 },         // 临烝·何腾蛟南明衡州抗清
    yezongliu: { name: '处州矿徒', tier: 4 },
  jinan: { name: '神牌弩手', tier: 2 },   // 历下·铁铉固守济南（防御战术铁壁）
  wu: { name: '句吴利趾', tier: 1 },        // 阊门·孙武句吴利趾
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
    xushouhui: { name: '双刀水师', tier: 4 },         // 常规番号，降T3
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
    changshaguo: { name: '飞虎军', tier: 2 },
    hongzhou: { name: '洪都火卫', tier: 3 },
  huangwang: { name: '冲天军', tier: 2 },       // 黄巢大齐政权极为短命，缺乏长久建制延续性，属于灭国级的短期战役高光，降入T2战术
  yue: { name: '越君子军', tier: 2 },        // 越王勾践麾下仅数千人的敢死先锋突击队，极端战术奇兵，下调至T2战术
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 江南造反武装中极度核心且能打的群体（如黄巢、张士诚），升入T3知名
  ouyue: { name: '东瓯舟师', tier: 4 },        // 临海·东瓯王国水师（《史记·东越列传》）
    huang_d: { name: '弋阳弩手', tier: 3 },
  // 横海校尉除名
    chizhou: { name: '九华伏兵', tier: 3 },
    wenzhou: { name: '永嘉水师', tier: 4 },
    hu_d: { name: '白峤汛卫', tier: 4 },
  wan: { name: '野人原义兵', tier: 4 },            // 皖口·刘源（缺乏极其著名的战术高光，降T3）
    ying: { name: '汉沔水锋', tier: 3 },
    kejia: { name: '黄连峒兵', tier: 4 },
  tingzhou_d: { name: '破敌军', tier: 2 },          // 瑞金·陈敏破敌军T2
  fu2: { name: '临川郡兵', tier: 4 },            // 临川·周迪陈朝据守（常规番号，降T3）
  ouyang: { name: '庐陵蛮兵', tier: 4 },         // 庐陵·欧阳頠世居统蛮兵（《梁书》）（缺乏极其著名的战术高光，降T3）
  chu_d: { name: '庐江义旅', tier: 4 },       // 潜山·陆康庐江守城
    shenshi: { name: '勤王义军', tier: 4 },
  wuwu_d: { name: '楼船军', tier: 1 },        // 濡须口·王濬楼船灭吴（《晋书》）
  taizhou: { name: '海陵镇兵', tier: 4 },       // 海陵·李昪发迹之地（常规番号，降T3）
  xie_cj_d: { name: '信州弩士', tier: 4 },      // 葛溪·谢枋得信州抗元（缺乏极其著名的战术高光，降T3）
    liu: { name: '九江裂骑', tier: 3 },
    chunshen: { name: '春申门客', tier: 4 },
  jiaodong: { name: '即墨火牛阵', tier: 2 },  // 即墨·田单火牛阵大破燕军（一次性战术奇谋）
  guo: { name: '果州戍兵', tier: 4 },  // 南充·唐果州戍兵
  zi: { name: '资州戍兵', tier: 4 },  // 盘石·唐资州戍兵
  jibei: { name: '赤眉余部', tier: 3 },  // 摧毁王莽新朝的绝对主力赤眉军，名震天下的农民起义符号，升入T3知名
  gouding: { name: '句町部兵', tier: 4 },  // 广南·西南夷句町国部兵
  quanrong: { name: '西戎骑兵', tier: 4 },  // 威戎·犬戎部落武装
qiufu: { name: '剡城义军', tier: 4 },     // 剡城·裘甫起义大破唐军（常规番号，降T3）
    shuntian: { name: '天地会义军', tier: 3 },         // 反清复明的终极化身，江南华南名气最大的民间秘密武装，升入T3知名
  lujian: { name: '义乌营', tier: 2 },       // 戚继光戚家军绝对步战核心，执行了无数次完美的鸳鸯阵战术，升入T2战术
    danyang: { name: '姑孰护卫', tier: 2 },
  linshihong: { name: '大楚水军', tier: 4 },  // 鄱阳·林士弘称帝建楚（常规番号，降T3）
    gumie: { name: '衢州镇标', tier: 4 },
    wang_s: { name: '新安兵', tier: 4 },
    wuyue: { name: '安国衣锦军', tier: 3 },
    shaozhou_d: { name: '银枪效节军', tier: 2 },
    ming_zheng: { name: '郑氏铁人军', tier: 2 },
    dayu: { name: '南赣标军', tier: 3 },
    sui: { name: '骁果军', tier: 2 },
};
