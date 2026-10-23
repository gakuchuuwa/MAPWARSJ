/**
 * 🔴 [2026-10-22 主人令「接着做 URT-06 攻破哈桑卢：先定加据点还是改野战战场，再接上送料和攻城」]
 *
 * 哈桑卢（Hasanlu Tepe，今伊朗西阿塞拜疆省纳加代附近，37.004, 45.458）：曼纳人的土丘城堡，
 * 前 800 年前后被攻破焚毁（通常认为是乌拉尔图所为），废墟里出土了著名的「哈桑卢金碗」。
 *
 * 定案（Claude 定，理由见 docs/探马/故事块样板_乌拉尔图开局.md URT-06）：
 *   不加据点，也不改野战 —— 在哈桑卢的史实坐标打一场故事攻城战，战略地图上不新增任何东西。
 *   ① 哈桑卢就毁在这一仗，之后再没成过有名的城；为一场仗在千城地图上常驻一座据点（还得配势力、武将、精锐、旗号），不值；
 *   ② AGENTS.md：新增实体归主人管、不许擅自添加据点；首战规则第 4 条：城库没有对应据点时，战场坐标用史实地点；
 *   ③ 它是「攻破」，史实是攻城，改野战就不像了。
 * 城的样子：借同一地理单元最近的据点马拉盖的城池（见 HASANLU_LOOK_ANCHOR），画成有城墙的小城。
 *
 * 两仗都是小队模式（几十人），玩家在攻方：
 *   · 送料：护着运木料的马夫队到城下，曼纳人出城来烧料；
 *   · 攻城：木料运到了多造一架撞车、多上一队人。
 */
import type { GameApp } from '../app/GameApp';
import type { StorySkirmishOptions } from './storySkirmish';
import { startStorySkirmish } from './storySkirmish';

/** 哈桑卢土丘城堡的史实坐标 */
const HASANLU = { lat: 37.004, lng: 45.458 } as const;
/**
 * 城的样子借马拉盖（82 公里外、同在乌尔米耶湖盆地、伊朗高原风格的小城）：
 * 首战规则第 4 条「城库没有对应据点 → 锚定同一地理单元最近的据点，坐标仍用史实地点」。
 * 战术模式没有据点记录就画不出城墙（2026-10-22 实测只剩一片空地）。
 */
const HASANLU_LOOK_ANCHOR = 'city_malagai';
/** 攻破哈桑卢那一年 */
export const HASANLU_YEAR = -795;
const URARTU_FACTION_ID = 'wulaertu_guo';
/** 乌拉尔图从北边（凡湖、乌尔米耶湖西岸）南下 */
const FROM_NORTH = { dLat: 0.05, dLng: -0.01 };

const BASE: Omit<StorySkirmishOptions, 'title' | 'spec' | 'siege' | 'lat' | 'lng'> = {
    attackerRegion: 'ARMENIANS',
    // 曼纳人在伊朗高原西北，城的样子按伊朗高原（同哈马丹/埃克巴坦那一档）
    defenderRegion: 'PERSIAN',
    attackerFactionId: URARTU_FACTION_ID,
    defenderFactionId: null,
    year: HASANLU_YEAR,
    attackerFrom: FROM_NORTH,
};

/** 送料：城北几公里的路上，马夫 6、民兵 6、长矛兵 4、斥候 2 护着木料；曼纳人斥候 2、轻骑 4、投石兵 6、民兵 4 出城来烧 */
export function startHasanluSupply(app: GameApp, onResult: (won: boolean) => void): boolean {
    return startStorySkirmish(app, {
        ...BASE,
        title: '运木料到哈桑卢城下',
        lat: HASANLU.lat + 0.04,
        lng: HASANLU.lng,
        spec: {
            attacker: [
                { key: 'villager', count: 6 },
                { key: 'militia', count: 6 },
                { key: 'antiquity_spearman', count: 4 },
                // 🔴 [2026-10-23 主人令「攻守都要有些初级兵」] 前头探路的斥候
                { key: 'antiquity_scout_cavalry', count: 2 },
            ],
            defender: [
                { key: 'antiquity_scout_cavalry', count: 2 },
                { key: 'antiquity_light_cavalry', count: 4 },
                { key: 'slinger', count: 6 },
                { key: 'militia', count: 4 },
            ],
            attackerName: '乌拉尔图运料队',
            defenderName: '曼纳',
            playerSide: 0,
        },
    }, onResult);
}

/**
 * 攻城：乌拉尔图长矛兵 14（木料齐了 20）、弓手 8、撞车 1（木料齐了 2）、民兵 6、斥候 3；曼纳民兵 8、长矛兵 12、弓手 10 守城。
 */
export function startHasanluSiege(app: GameApp, suppliesArrived: boolean, onResult: (won: boolean) => void): boolean {
    return startStorySkirmish(app, {
        ...BASE,
        title: '攻破哈桑卢',
        lat: HASANLU.lat,
        lng: HASANLU.lng,
        siege: { cityType: 'small_city', anchorCityId: HASANLU_LOOK_ANCHOR },
        spec: {
            attacker: [
                { key: 'antiquity_spearman', count: suppliesArrived ? 20 : 14 },
                { key: 'archer', count: 8 },
                { key: 'antiquity_battering_ram', count: suppliesArrived ? 2 : 1 },
                // 🔴 [2026-10-23 主人令「攻守都要有些初级兵」] 征来的民兵、绕城的斥候
                { key: 'militia', count: 6 },
                { key: 'antiquity_scout_cavalry', count: 3 },
            ],
            defender: [
                { key: 'militia', count: 8 },
                { key: 'antiquity_spearman', count: 12 },
                { key: 'archer', count: 10 },
            ],
            attackerName: '乌拉尔图',
            defenderName: '哈桑卢',
            playerSide: 0,
        },
    }, onResult);
}
