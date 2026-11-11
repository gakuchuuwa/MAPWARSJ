/**
 * 🔴 [2026-11-03 主人令「还是单独算势力吧，没有打过仗的，可以旗号，颜色一致」] 同系政权表。
 *
 * 同一系、彼此没打过仗的政权：各自单独成势力（时代、军团、据点、武将各按原样），
 * 但旗号、势力色、纹章跟本家一致。打过仗的不进本表（罗马帝国/拜占庭、蒙古/大元…）。
 * 殖民地、公司、氏族不是政权，不进本表，直接并入本国（葡属印度→葡萄牙、阿史那→突厥…）。
 *
 * 键＝分支势力，值＝本家势力。颜色唯一性校验（HistoricalFactionColors）与旗面审计据此放行同系同色。
 */
export const FACTION_LINEAGE_PARENT: Readonly<Record<string, string>> = {
    // 🔴 [2026-11-11 主人令「同族同祖就合并」GG第五轮] 12 组同系表已全部处理：11 组并入本家，两西西里←西西里异族异朝解绑，表清空
};

/** 势力的本家（不在表里就是自己） */
export function getLineageRoot(factionId: string): string {
    let id = factionId;
    for (let i = 0; i < 8 && FACTION_LINEAGE_PARENT[id]; i++) id = FACTION_LINEAGE_PARENT[id];
    return id;
}
