/**
 * 🔴 [2026-10-22 主人令「动手做战术模式的小队模式，先用盗马贼这一仗做样板」]
 * 故事块样板 URT-04「盗马贼」（docs/探马/故事块样板_乌拉尔图开局.md）：
 * 图什帕一带夜里有山民摸进马厩偷马，玩家叫醒养马人家，带 20 人追击 30 个盗马贼。
 * 走战术模式的小队模式：1 个小兵＝1 个人，不排军团 10 队。
 * 入口：控制台 `game.startHorseThiefSkirmish()`。
 */
import type { GameApp } from '../app/GameApp';
import { GameConfig } from '../config/GameConfig';

const TUSHPA_ID = 'city_tushpa';
const MERIT_ON_WIN = 300;

export function startHorseThiefSkirmish(app: GameApp): boolean {
    if (app.scene13War?.isActive?.() || app.battleScene?.isActive?.()) return false;
    const tushpa = app.cityManager?.getCity(TUSHPA_ID);
    const lat = tushpa?.latitude ?? 38.5;
    const lng = tushpa?.longitude ?? 43.37;
    const region = tushpa?.region ?? 'ARMENIANS';

    app.scene13War.onDecision = (winner) => {
        const hero = app.playerHero;
        if (winner === 'attacker') {
            hero?.addMerit(MERIT_ON_WIN);
            hero?.notifyPlayer(`🐎 追回了被盗的马，功勋 +${MERIT_ON_WIN}`);
        } else {
            hero?.notifyPlayer('🐎 盗马贼跑了，丢了一匹马');
        }
        app.scene13War.beginLinger();
        app.battleScene.beginLingerAfterDefeat(GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS);
    };

    app.scene13War.start({
        attackerRegion: region,
        defenderRegion: region,
        attackerFactionId: tushpa?.factionId ?? 'wulaertu_guo',
        defenderFactionId: null,
        attackerTroops: 20,
        defenderTroops: 30,
        centerLat: lat,
        centerLng: lng,
        // 村民从图什帕追出来，盗马贼往东边山里跑
        attackerFromLat: lat,
        attackerFromLng: lng - 0.05,
        defenderFromLat: lat,
        defenderFromLng: lng + 0.05,
        battleType: 'field',
        title: '追捕盗马贼',
        getYear: () => app.timeSystem.getYear(),
        skirmish: {
            attacker: [{ key: 'villager', count: 20 }],
            defender: [{ key: 'bandit', count: 22 }, { key: 'outlaw', count: 8 }],
            playerSide: 0,
        },
    });
    app.battleScene.enter(null, { manualEnd: true });
    return true;
}
