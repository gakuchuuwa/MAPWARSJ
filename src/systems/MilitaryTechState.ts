/**
 * 【军事科技 · 应用层】把已解锁的科技叠加到兵种五维上。
 *
 * 作用范围：**只影响 13 战斗模式**（`Scene13WarLayer` 的 `WAR_TYPES`）。
 * 大地图八环的 `sideBasePower` 只吃「兵力 × 文化系数」，根本不读兵种属性，所以这里改不到它。
 *
 * 🔴 **每一方按自己的文化区算**：科技有文化门控（板甲只给拉丁/日耳曼、安息战术只给草原系…），
 *    所以同一个兵种在攻守两方手里数值可能不同 —— 必须按 side 分表，不能全局改 WAR_TYPES。
 * 🔴 **绝不原地改 WAR_TYPES**：那是基础档（未含任何科技的 DE 原值），一旦被就地修改，
 *    下一场战斗会在已加成的值上再加一次，逐场累积爆表。这里一律返回新对象。
 *
 * 单位换算（DE → 我们）：
 *   · range / los 在 DE 以「格」计，落到 `rng` 要 **×40 像素**（与射程、视野同一换算）
 *   · reload 是乘区（拇指环 ×0.85 = 装填变快）
 */

import { MILITARY_TECHS, type MilitaryTech } from '../data/MilitaryTechs';
import { getUnitClass } from '../data/UnitClasses';
import { GameConfig } from '../config/GameConfig';
import type { RegionType } from './RegionSystem';

/** DE 一格 = 40px（与 SIGHT_MAP / rng 同一换算） */
const TILE_PX = 40;

/** 兵种五维里科技会碰的字段（与 Scene13WarLayer 的 WarType 结构对齐，只取需要的部分） */
export interface TechModifiableStats {
    hp: number;
    atk: number;
    meleeArmor: number;
    pierceArmor: number;
    rng: number;
    reload: number;
    spd: number;
    dmgType: 'melee' | 'pierce';
}

/** 取某年、某文化区已解锁的科技 */
export function unlockedTechs(year: number, culture: RegionType): MilitaryTech[] {
    // 乱斗模式（历史脚本关闭）→ 科技全开，不做年份门控；历史脚本开启后按年份逐步开放。
    const timeGated = GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS;
    return MILITARY_TECHS.filter(
        (t) => (!timeGated || t.year === null || year >= t.year)
            && (t.cultures === null || t.cultures.includes(culture)),
    );
}

/**
 * 把科技叠到一个兵种的五维上，返回**新对象**（不改入参）。
 * @param base     该兵种的基础档（WAR_TYPES 原值）
 * @param key      兵种 key（用于查 unit class）
 * @param techs    该方已解锁的科技
 * @param sightPx  该兵种的视野（px）；给了才会返回 sight
 */
export function applyTechsToStats<T extends TechModifiableStats>(
    base: T, key: string, techs: readonly MilitaryTech[], sightPx?: number,
): T & { sight?: number } {
    const cls = getUnitClass(key);
    const out: T & { sight?: number } = { ...base };
    if (sightPx !== undefined) out.sight = sightPx;

    for (const tech of techs) {
        for (const e of tech.effects) {
            if (!e.classes.includes(cls)) continue;
            switch (e.attr) {
                case 'meleeAttack':
                    // 近战攻击只加给近战伤害型的兵（DE 的攻击是按装甲类分的）
                    if (base.dmgType === 'melee') out.atk = e.op === 'mul' ? out.atk * e.value : out.atk + e.value;
                    break;
                case 'pierceAttack':
                    if (base.dmgType === 'pierce') out.atk = e.op === 'mul' ? out.atk * e.value : out.atk + e.value;
                    break;
                case 'meleeArmor':
                    out.meleeArmor = e.op === 'mul' ? out.meleeArmor * e.value : out.meleeArmor + e.value;
                    break;
                case 'pierceArmor':
                    out.pierceArmor = e.op === 'mul' ? out.pierceArmor * e.value : out.pierceArmor + e.value;
                    break;
                case 'hp':
                    out.hp = e.op === 'mul' ? out.hp * e.value : out.hp + e.value;
                    break;
                case 'speed':
                    out.spd = e.op === 'mul' ? out.spd * e.value : out.spd + e.value;
                    break;
                case 'reload':
                    // 装填是「越小越快」，乘区 <1 即提速
                    out.reload = e.op === 'mul' ? out.reload * e.value : out.reload + e.value;
                    break;
                case 'range':
                    // 🔴 DE 以格计 → ×40 像素。只给本来就是远程的兵加（近战 rng=0 不该凭空长出射程）
                    if (base.rng > 0) out.rng = e.op === 'mul' ? out.rng * e.value : out.rng + e.value * TILE_PX;
                    break;
                case 'los':
                    if (out.sight !== undefined) {
                        out.sight = e.op === 'mul' ? out.sight * e.value : out.sight + e.value * TILE_PX;
                    }
                    break;
            }
        }
    }
    return out;
}

/**
 * 【面板用】把已解锁科技汇总成「效果」短语，而不是科技名。
 *
 * 🔴 主人 2026-08-18 定：**科技效果要体现**。面板列「锁子甲·板甲·板甲马铠」观众读不出强弱，
 *    列「甲 步+3/4」才知道到底强了多少。所以面板显示的是**累计数值增量**，名字只留独有那几条。
 *
 * 护甲按 unit class 分三路统计（步6 / 骑12 / 射0）——它们的门控不同，不能合成一个数。
 */
export function summarizeTechEffects(techs: readonly MilitaryTech[]): string[] {
    let meleeAtk = 0, pierceAtk = 0, range = 0;
    const arm = { 6: [0, 0], 12: [0, 0], 0: [0, 0] } as Record<number, [number, number]>;
    let spdMul = 1, reloadMul = 1, hp = 0;
    for (const t of techs) {
        for (const e of t.effects) {
            const hit = (c: number) => e.classes.includes(c);
            switch (e.attr) {
                case 'meleeAttack': if (hit(6) || hit(12)) meleeAtk += e.value; break;
                case 'pierceAttack': if (hit(0) || hit(36)) pierceAtk += e.value; break;
                case 'range': if (hit(0) || hit(36)) range += e.value; break;
                case 'meleeArmor': for (const c of [6, 12, 0]) if (hit(c)) arm[c][0] += e.value; break;
                case 'pierceArmor': for (const c of [6, 12, 0]) if (hit(c)) arm[c][1] += e.value; break;
                case 'speed': spdMul *= e.op === 'mul' ? e.value : 1; break;
                case 'reload': reloadMul *= e.op === 'mul' ? e.value : 1; break;
                case 'hp': hp += e.value; break;
            }
        }
    }
    const out: string[] = [];
    if (meleeAtk) out.push(`近攻+${meleeAtk}`);
    if (pierceAtk) out.push(`远攻+${pierceAtk}`);
    if (range) out.push(`射程+${range}`);
    const armTag = (c: number, label: string) => {
        const [m, p] = arm[c];
        if (m || p) out.push(`${label}甲+${m}/${p}`);
    };
    armTag(6, '步'); armTag(12, '骑'); armTag(0, '射');
    if (hp) out.push(`血+${hp}`);
    if (spdMul !== 1) out.push(`速+${Math.round((spdMul - 1) * 100)}%`);
    if (reloadMul !== 1) out.push(`装填快${Math.round((1 - reloadMul) * 100)}%`);
    return out;
}

/** 把单个科技提炼成对应效果简述（如 "近攻+1", "步甲+1/1", "远攻+1 射程+1"） */
export function summarizeSingleTechEffect(t: MilitaryTech): string {
    const parts: string[] = [];
    let meleeAtk = 0, pierceAtk = 0, range = 0;
    const arm = { 6: [0, 0], 12: [0, 0], 0: [0, 0] } as Record<number, [number, number]>;
    let spdMul = 1, reloadMul = 1, hp = 0;

    for (const e of t.effects) {
        const hit = (c: number) => e.classes.includes(c);
        switch (e.attr) {
            case 'meleeAttack': if (hit(6) || hit(12)) meleeAtk += e.value; break;
            case 'pierceAttack': if (hit(0) || hit(36)) pierceAtk += e.value; break;
            case 'range': if (hit(0) || hit(36)) range += e.value; break;
            case 'meleeArmor': for (const c of [6, 12, 0]) if (hit(c)) arm[c][0] += e.value; break;
            case 'pierceArmor': for (const c of [6, 12, 0]) if (hit(c)) arm[c][1] += e.value; break;
            case 'speed': spdMul *= e.op === 'mul' ? e.value : 1; break;
            case 'reload': reloadMul *= e.op === 'mul' ? e.value : 1; break;
            case 'hp': hp += e.value; break;
        }
    }

    if (meleeAtk) parts.push(`近攻+${meleeAtk}`);
    if (pierceAtk && range) parts.push(`远攻+${pierceAtk} 射程+${range}`);
    else {
        if (pierceAtk) parts.push(`远攻+${pierceAtk}`);
        if (range) parts.push(`射程+${range}`);
    }
    const armTag = (c: number, label: string) => {
        const [m, p] = arm[c];
        if (m || p) parts.push(`${label}甲+${m}/${p}`);
    };
    armTag(6, '步'); armTag(12, '骑'); armTag(0, '射');
    if (hp) parts.push(`血+${hp}`);
    if (spdMul !== 1) parts.push(`速+${Math.round((spdMul - 1) * 100)}%`);
    if (reloadMul !== 1) parts.push(`装填快${Math.round((1 - reloadMul) * 100)}%`);

    return parts.join(' ') || '生效';
}
