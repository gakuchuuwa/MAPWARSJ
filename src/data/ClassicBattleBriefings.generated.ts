/**
 * ⚠️ 本文件由 `tools/classic-briefings/import.mts` 生成，不要手改（改了下次导入会被覆盖）。
 * 来源：谷歌云盘「经典战播报·回填表」。
 *
 * 每场：strategic＝战略大局（寻将起念，按段），tactical＝战术背景（开打起念，按段），
 * history＝历史资料（不上屏，审稿用），sources＝史料出处（不上屏）。
 * 没收录的场次：战略回落 `GeneralFirstBattleStrategicBackgrounds`，战术回落 `GeneralFirstBattleBackgrounds`。
 */

export interface ClassicBattleBriefing {
    strategic: string[];
    tactical: string[];
    history?: string;
    sources?: string;
}

export const CLASSIC_BATTLE_BRIEFINGS: Readonly<Record<string, ClassicBattleBriefing>> = {
};
