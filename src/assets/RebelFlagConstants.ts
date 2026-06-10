/**
 * 叛军随机旗素材编号（闭区间），共 PANJUN_REBEL_FLAG_COUNT 面。勿改成「12 种」。
 *
 * ── 与正规势力色系统完全分离（见 FactionManager / CityAssetManager 文件头）──
 * 叛军 panjun **没有** factionId 意义上的「势力色 / 旗帜染色 / 军队染色」。
 * 每座叛军据点仅绑定 processedRebelFlags[] 中的一张**原素材旗面**（chromaKey 时不染色）。
 * 分配逻辑见 CityAssetManager.getProcessedRebelFlagIndex(cityId)。
 */
export const PANJUN_REBEL_FLAG_ID_MIN = 7;
export const PANJUN_REBEL_FLAG_ID_MAX = 58;
export const PANJUN_REBEL_FLAG_COUNT = PANJUN_REBEL_FLAG_ID_MAX - PANJUN_REBEL_FLAG_ID_MIN + 1;
