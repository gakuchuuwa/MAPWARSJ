/**
 * 🔴 [2026-10-22] 故事块打的小仗（战术模式小队模式）的公用开打口：
 * 通灵战役（horseMemories.ts）、攻破哈桑卢（hasanluSiege.ts）都走这里。
 * 不碰战略地图上的军团：小仗是盖在战略地图上的一场战术模式，打完回原处，期间游戏时间不走。
 */
import type { GameApp } from '../app/GameApp';
import { GameConfig } from '../config/GameConfig';
import type { CityType } from '../types/core';
import type { Scene13SkirmishSpec } from '../ui/scene13/Scene13Types';

export interface StorySkirmishOptions {
    title: string;
    /** 战场（攻城战＝城的位置） */
    lat: number;
    lng: number;
    /** 战术地图地形、建筑风格用 */
    attackerRegion: string;
    defenderRegion: string;
    attackerFactionId: string;
    defenderFactionId: string | null;
    /** 打仗那一年（科技、兵种外观按它） */
    year: number;
    /** 攻方从哪个方向来（度，相对战场；默认从北边来） */
    attackerFrom?: { dLat: number; dLng: number };
    /** 攻城战：守方城的等级（画什么城）；险要可另给地形（mound＝多层台地，像土丘上的城堡） */
    siege?: { cityType: CityType; passTerrain?: 'mound' | 'flat' | 'plateau' };
    spec: Scene13SkirmishSpec;
}

/** 开打；返回 false＝已在打仗或场景被占用。onResult 的 won＝攻方赢（玩家一方恒为攻方时即玩家赢） */
export function startStorySkirmish(app: GameApp, o: StorySkirmishOptions, onResult: (won: boolean) => void): boolean {
    if (app.scene13War?.isActive?.() || app.battleScene?.isActive?.()) return false;
    const count = (side: 'attacker' | 'defender') => o.spec[side].reduce((n, g) => n + g.count, 0);
    const from = o.attackerFrom ?? { dLat: 0.05, dLng: 0 };

    app.scene13War.onDecision = (winner) => {
        onResult(winner === 'attacker');
        app.scene13War.beginLinger();
        app.battleScene.beginLingerAfterDefeat(GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS);
    };

    app.scene13War.start({
        attackerRegion: o.attackerRegion,
        defenderRegion: o.defenderRegion,
        attackerFactionId: o.attackerFactionId,
        defenderFactionId: o.defenderFactionId,
        attackerTroops: Math.max(1, count('attacker')),
        defenderTroops: count('defender'),
        centerLat: o.lat,
        centerLng: o.lng,
        attackerFromLat: o.lat + from.dLat,
        attackerFromLng: o.lng + from.dLng,
        defenderFromLat: o.lat - from.dLat,
        defenderFromLng: o.lng - from.dLng,
        battleType: o.siege ? 'siege' : 'field',
        defenderCityType: o.siege?.cityType ?? null,
        defenderPassTerrain: o.siege?.passTerrain ?? null,
        defenderCityLat: o.siege ? o.lat : undefined,
        defenderCityLng: o.siege ? o.lng : undefined,
        title: o.title,
        getYear: () => o.year,
        skirmish: o.spec,
    });
    app.battleScene.enter(null, { manualEnd: true });
    return true;
}

/**
 * 上一场还在收场时开不了下一场：每半秒再试，最多等 20 秒。
 * start 返回 true＝开成了。
 */
export function startWhenFree(start: () => boolean, tries = 0): void {
    if (start()) return;
    if (tries < 40) window.setTimeout(() => startWhenFree(start, tries + 1), 500);
}
