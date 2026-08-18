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
    return MILITARY_TECHS.filter(
        (t) => (t.year === null || year >= t.year)
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
 * 本年度**新解锁**的科技（用于播报）：去年没有、今年有的。
 * 静默改数值观众看不见，所以解锁必须播报（项目铁律：技能必须有可见演出）。
 */
export function newlyUnlocked(year: number, culture: RegionType): MilitaryTech[] {
    const now = unlockedTechs(year, culture);
    const before = unlockedTechs(year - 1, culture);
    const had = new Set(before.map((t) => t.id));
    return now.filter((t) => !had.has(t.id));
}

/** 播报文案：「1400 年 · 板甲问世 —— 近战防御+1、远程防御+2」 */
export function techAnnouncement(tech: MilitaryTech): string {
    const LABEL: Record<string, string> = {
        meleeAttack: '近战攻击', pierceAttack: '远程攻击',
        meleeArmor: '近战防御', pierceArmor: '远程防御',
        hp: '兵员耐久', speed: '行进速度', reload: '出手速度',
        range: '射程', los: '视野',
    };
    const parts: string[] = [];
    for (const e of tech.effects) {
        const name = LABEL[e.attr] ?? e.attr;
        if (parts.some((p) => p.startsWith(name))) continue;
        parts.push(e.op === 'mul'
            ? `${name}${e.value < 1 ? '加快' : '提升'} ${Math.round(Math.abs(1 - e.value) * 100)}%`
            : `${name}+${e.value}`);
    }
    return `${tech.name}问世 —— ${parts.join('、')}`;
}
