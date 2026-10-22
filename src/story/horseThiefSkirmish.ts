/**
 * 🔴 [2026-10-22 主人令「动手做战术模式的小队模式，先用盗马贼这一仗做样板」]
 * 故事块样板 URT-04「盗马贼」（docs/探马/故事块样板_乌拉尔图开局.md）的那一仗：
 * 图什帕一带夜里有山民摸进马厩偷马。
 *   · 带人追（group）：玩家叫醒养马人家，带 20 人追击 20 个盗马贼；
 *   · 一个人追（solo）：玩家单骑先追，以一敌六。
 * 走战术模式的小队模式：1 个小兵＝1 个人，不排军团 10 队。
 * 由故事块引擎调用；开发期也可在控制台 `game.startHorseThiefSkirmish('solo')` 直接打。
 */
import type { GameApp } from '../app/GameApp';
import { GameConfig } from '../config/GameConfig';
import type { Scene13SkirmishSpec } from '../ui/scene13/Scene13Types';

const TUSHPA_ID = 'city_tushpa';

export type HorseThiefChase = 'group' | 'solo';

const SQUADS: Record<HorseThiefChase, Scene13SkirmishSpec> = {
    // 强弱相当、玩家本人能左右胜负：养马人家 武装民兵 12 + 村民 8；山民盗马贼 武装民兵 14 + 投石兵 6
    group: {
        attacker: [{ key: 'militia', count: 12 }, { key: 'villager', count: 8 }],
        defender: [{ key: 'militia', count: 14 }, { key: 'slinger', count: 6 }],
        attackerName: '养马人家',
        defenderName: '盗马贼',
        playerSide: 0,
    },
    // 单骑先追：只追上落在后面的六个人；玩家倒下就算输（小队模式里玩家本人算一个兵）
    solo: {
        attacker: [],
        defender: [{ key: 'militia', count: 4 }, { key: 'slinger', count: 2 }],
        attackerName: '单骑追贼',
        defenderName: '盗马贼',
        playerSide: 0,
    },
};

/**
 * 开打。`onResult` 不传＝控制台直接打：赢了按样板给功勋 +300。
 * 返回 false＝已在打仗或场景被占用，没开打。
 */
export function startHorseThiefSkirmish(
    app: GameApp,
    chase: HorseThiefChase = 'group',
    onResult?: (won: boolean) => void,
): boolean {
    if (app.scene13War?.isActive?.() || app.battleScene?.isActive?.()) return false;
    const tushpa = app.cityManager?.getCity(TUSHPA_ID);
    const lat = tushpa?.latitude ?? 38.5;
    const lng = tushpa?.longitude ?? 43.37;
    const region = tushpa?.region ?? 'ARMENIANS';
    const spec = SQUADS[chase];
    const count = (side: 'attacker' | 'defender') => spec[side].reduce((n, g) => n + g.count, 0);

    app.scene13War.onDecision = (winner) => {
        const won = winner === 'attacker';
        if (onResult) onResult(won);
        else if (won) app.playerHero?.addMerit(300);
        app.scene13War.beginLinger();
        app.battleScene.beginLingerAfterDefeat(GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS);
    };

    app.scene13War.start({
        attackerRegion: region,
        defenderRegion: region,
        attackerFactionId: tushpa?.factionId ?? 'wulaertu_guo',
        defenderFactionId: null,
        attackerTroops: Math.max(1, count('attacker')),
        defenderTroops: count('defender'),
        centerLat: lat,
        centerLng: lng,
        // 追兵从图什帕出来，盗马贼往东边山里跑
        attackerFromLat: lat,
        attackerFromLng: lng - 0.05,
        defenderFromLat: lat,
        defenderFromLng: lng + 0.05,
        battleType: 'field',
        title: '追捕盗马贼',
        getYear: () => app.timeSystem.getYear(),
        skirmish: spec,
    });
    app.battleScene.enter(null, { manualEnd: true });
    return true;
}
