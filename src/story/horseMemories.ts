/**
 * 🔴 [2026-10-22 主人令「接着做通灵：摸马读记忆、通灵战役与同步率（URT-08 大马士革）」]
 *
 * 通灵战役：马记得的仗。{玩家}摸到马，就以那匹马当年骑手的身份把那一仗再打一遍（战术模式小队模式）。
 * 规则依据 docs/探马/骨架.md（主人定：主角摸到马才能读它的记忆；记忆是过去的事，结果改不了）；
 * 同步率的说法参照《刺客信条》（见 docs/探马/故事块样板_乌拉尔图开局.md URT-08）：
 *   · 同步：跟着史实打赢 —— 记忆照史实走完；
 *   · 完全同步：打赢，而且{玩家}骑的马整场没倒下（没落马）——「整场不丢一匹马」；
 *   · 失步：打输了 —— 史实不是这样，记忆断开，可以再进去一次。
 * 记忆不占游戏时间：战术模式期间战略地图本来就不走。
 */
import type { GameApp } from '../app/GameApp';
import type { Scene13SkirmishSpec } from '../ui/scene13/Scene13Types';
import { startStorySkirmish } from './storySkirmish';

export type MemoryResult = 'desync' | 'sync' | 'full';

export interface HorseMemory {
    id: string;
    /** 面板与对话里的名字 */
    title: string;
    /** 那一仗的年份 */
    year: number;
    /** 战场 */
    lat: number;
    lng: number;
    /** 战术地图取地形、建筑风格用 */
    region: string;
    /** 马当年那一方（玩家所在一方，恒为攻方）与对方的势力 */
    attackerFactionId: string;
    defenderFactionId: string | null;
    /** 小队编成；playerSide 恒为 0 */
    spec: Scene13SkirmishSpec;
    /** 同步时学到的马经（剧情标记名 + 一句话） */
    lore: { flag: string; text: string };
    /** 完全同步时放进兵模收藏的一种兵 */
    unit: { key: string; factionId: string };
}

/**
 * 前 796 年 亚述阿达德尼拉里三世围大马士革，大马士革王（马里）臣服纳贡。
 * 记忆里是城下一仗：亚述的战车与两人一组的骑兵（一人控缰持矛、一人射箭）对出城的亚兰步兵。
 */
const DAMASCUS_796: HorseMemory = {
    id: 'damascus_-796',
    title: '大马士革城下',
    year: -796,
    lat: 33.5131,
    lng: 36.3094,
    region: 'ORIE',
    attackerFactionId: 'yashu',
    defenderFactionId: null,
    spec: {
        // 亚述：战车 4、骑射手 8、持矛轻骑 8（两人一组）；亚兰：长矛兵 14、弓手 8、战车 2
        attacker: [
            { key: 'war_chariot', count: 4 },
            { key: 'antiquity_cavalry_archer', count: 8 },
            { key: 'antiquity_light_cavalry', count: 8 },
        ],
        defender: [
            { key: 'antiquity_spearman', count: 14 },
            { key: 'archer', count: 8 },
            { key: 'war_chariot', count: 2 },
        ],
        attackerName: '亚述',
        defenderName: '大马士革',
        playerSide: 0,
    },
    lore: { flag: '马经-亚述骑兵两人一组', text: '亚述骑兵两人一组：一人控缰持矛，一人放箭' },
    unit: { key: 'antiquity_cavalry_archer', factionId: 'yashu' },
};

export const HORSE_MEMORIES: Readonly<Record<string, HorseMemory>> = {
    [DAMASCUS_796.id]: DAMASCUS_796,
};

export function memoryLabel(m: HorseMemory): string {
    return `${m.title}（${m.year < 0 ? `前 ${-m.year}` : `公元 ${m.year}`}）`;
}

/**
 * 进入一段记忆打那一仗。返回 false＝已在打仗或场景被占用，没进去。
 * onResult 在分出胜负时回调（之后战术模式照常收场）。
 */
export function startMemoryBattle(app: GameApp, mem: HorseMemory, onResult: (r: MemoryResult) => void): boolean {
    const hero = app.playerHero;
    const downsBefore = hero?.heroDowns ?? 0;
    // 亚述从北边压过来，守军从城里（南边）出来（startStorySkirmish 默认来向）
    return startStorySkirmish(app, {
        title: `通灵·${mem.title}`,
        lat: mem.lat,
        lng: mem.lng,
        attackerRegion: mem.region,
        defenderRegion: mem.region,
        attackerFactionId: mem.attackerFactionId,
        defenderFactionId: mem.defenderFactionId,
        year: mem.year,
        spec: mem.spec,
    }, (won) => {
        const fell = (hero?.heroDowns ?? 0) > downsBefore;
        onResult(!won ? 'desync' : fell ? 'sync' : 'full');
    });
}
