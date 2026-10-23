/**
 * 江南文化区远征精锐军团名（JIANGNAN / RegionSystem「江南」）
 *
 * 【三者防重】旗号 / 据点名 / 番号 — 见 AGENTS.md §12.1、ExpeditionLegions.ts 文件头
 * 写入前：npm run expedition:triple-check
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–5 字，全局不重复
 * - 依据 史料/古代精锐部队.md §9 江南 21 支为主
 * - §1 #34 解烦兵交叉收录（孙吴@武昌，史籍属三国江南精锐）
 * - §9 #18–21 已挂岭南区；#9/#10/#16 无合格势力或与岳军重复
 * - 据点优先标志战场（戚家军@横屿等）；§1 #24 丹阳兵@宛陵城·山越（复用 shanyue）
 */
export const JIANGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, {
name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  she_ethnic: { name: '畲族山兵', tier: 3 },  // 具有极强东南丘陵风土特色与民族凝聚力的武装力量，升入T3知名
    sunwu_d: { name: '解烦兵', tier: 2 },
  min: { name: '闽国亲从', tier: 4 },        // 冶城·王审知闽国亲从

    wu: { name: '句吴利趾', tier: 1 },
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
    xushouhui: { name: '双刀水师', tier: 4 },         // 常规番号，降T3
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  huangwang: { name: '冲天军', tier: 2 },       // 黄巢大齐政权极为短命，缺乏长久建制延续性，属于灭国级的短期战役高光，降入T2战术
  yue: { name: '越君子军', tier: 2 },        // 越王勾践麾下仅数千人的敢死先锋突击队，极端战术奇兵，下调至T2战术
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 江南造反武装中极度核心且能打的群体（如黄巢、张士诚），升入T3知名
  ouyue: { name: '东瓯舟师', tier: 4 },        // 临海·东瓯王国水师（《史记·东越列传》）
  // 横海校尉除名
  gouding: { name: '句町部兵', tier: 4 },  // 广南·西南夷句町国部兵
    shuntian: { name: '天地会义军', tier: 3 },         // 反清复明的终极化身，江南华南名气最大的民间秘密武装，升入T3知名
  lujian: { name: '义乌营', tier: 2 },       // 戚继光戚家军绝对步战核心，执行了无数次完美的鸳鸯阵战术，升入T2战术
    linshihong: { name: '大楚水军', tier: 4 },
    wuyue: { name: '安国衣锦军', tier: 3 },
                                            // 原挂「银枪效节军」——那是杨师厚的魏博银枪效节都，属河北魏博（已在 tianxiong「魏博牙兵」），
                                            // 与湖南邵州及马殷无相关性，违 §268，已撤
    ming_zheng: { name: '郑氏铁人军', tier: 2 },
    sui: { name: '骁果军', tier: 2 },
    taiping: { name: '石敢当', tier: 1 },
    longwu: { name: '建宁义旅', tier: 4 },
    dongjin: { name: '北府兵', tier: 1 },
    nan_liang: { name: '白袍军', tier: 2 },
    chuguo: { name: '楚甲士', tier: 2 },
    yangwu: { name: '黑云都', tier: 2 },
};
