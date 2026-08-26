/**
 * 南印度（达罗毗荼 PURU）文化区远征精锐军团名（2026-08-27 拆印度新增，朱罗/潘地亚 2 势力）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const PURU_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    zhuluo: { name: '软剑士', tier: 3 },           // 坦贾武尔·拉金德拉：达罗毗荼软剑士（乌卢米软鞭剑）
    pandiya: { name: '骑象弓', tier: 3 },         // 马杜赖·贾塔瓦尔曼：潘地亚象背弓骑（南印度泰米尔战象游射）
};
