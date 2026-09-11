/**
 * GeneralDrawer —— 已停用（2026-09-09）。
 *
 * 原本画的是三国志10 的武将小人精灵（`/SUCAI/S10B/42-1.png` 等四张帧带）。两件事同时成立：
 *   ① 素材随「三国志10 兵种素材全部移除」一起删了；
 *   ② `draw()` **全项目从未被任何地方调用过** —— 只有 `preload()` 被 LegionPhalanxDrawer 调，
 *      也就是说这四张图开机加载 + 抠绿完就丢在那儿，画面上一帧都没出现过。
 *
 * 现在连 preload 也摘了。整个文件已无人引用，随时可以整份删除；留着只是不擅自删源文件。
 * 大地图上你看到的武将信息是**名牌文字**（LegionFlagDrawer / getGeneralRecordByGeneralId），
 * 与本文件无关，不受影响。
 */
export type GeneralState = 'IDLE' | 'MOVE' | 'ATTACK' | 'DAMAGE' | 'DEATH';
