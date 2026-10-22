/**
 * 🔴 [2026-10-22] 乌拉尔图开局的故事块（docs/探马/故事块样板_乌拉尔图开局.md）。
 * 已接上 URT-01「梦醒」、URT-04「盗马贼」；其余块按样板逐个往这里加。
 */
import type { Storylet, StoryContext, StoryApi } from '../StoryletEngine';
import { startHorseThiefSkirmish } from '../horseThiefSkirmish';

const MERIT_HORSE_THIEF = 300;

/** 盗马贼打赢：缴获 1–2 匹山地马（四到九岁），返回马名 */
function captureMountainHorses(api: StoryApi): string {
    const n = 1 + Math.floor(Math.random() * 2);
    const names: string[] = [];
    for (let i = 0; i < n; i++) {
        const h = api.hero.horses.addHorse({ age: 4 + Math.floor(Math.random() * 6), origin: '从盗马贼手里缴获的山地马' });
        names.push(`「${h.name}」`);
    }
    return names.join('、');
}

/** 盗马贼打输：丢一匹普通马（通灵马不会丢）；返回提示 */
function loseToThieves(api: StoryApi): string {
    const lost = api.hero.horses.loseCommonHorse();
    return lost ? `丢了一匹马「${lost.name}」` : '没能追回被盗的马';
}

/** 开局据点：图什帕（乌拉尔图王都） */
export const URARTU_OPENING_CITY_ID = 'city_tushpa';

/**
 * 百岁模式新开局的出生点：凡湖东南岸（今埃德雷米特一带），图什帕西南约 13 公里。
 * 放在城外（玩家到城判定 0.06° 之外），醒来时不会马上撞进城里的武将对话。
 * 凡湖海拔 1640 米，游戏的陆海判定（掩膜为水 且 海拔 < 0）不把它当海，出生点不会落进「海」里。
 */
export const URARTU_OPENING_SPAWN = { lat: 38.42, lng: 43.26 } as const;

/** 开局段最晚到哪一年（前 797 年底）：过了这年不再把玩家留在图什帕 */
const OPENING_LAST_YEAR = -797;

/**
 * 开局段留人：平民、没入伍、还在图什帕一带、盗马贼那一仗还没打完 → 自动模式不去别处找武将。
 * 前 800 年梦醒之前也算（开局第一帧就要留住，否则自动模式先动身走了）。
 */
export function urartuOpeningHoldsPlayer(ctx: StoryContext): boolean {
    return ctx.year <= OPENING_LAST_YEAR
        && ctx.rank === 'civilian'
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID
        // 看结果标记而不是「弹过没有」：仗还在打时也要留住，打完（赢或输）才放行
        && !ctx.hasFlag('URT-04-won') && !ctx.hasFlag('URT-04-lost')
        && (ctx.isDone('URT-01') || ctx.year === -800);
}

/** URT-01 梦醒：新开百岁模式，前 800 年春（赶不上就夏），在图什帕一带，必触发一次 */
const URT_01_AWAKEN: Storylet = {
    id: 'URT-01',
    speaker: '凡湖岸',
    text: '{玩家}在湖岸醒来，不记得自己是谁。岩壁上刻着一个骑马的人，刻痕已经很旧。'
        + '一匹马走近，低头碰了碰他的手——他忽然看见了马记得的东西：这片湖叫凡湖，城叫图什帕，王叫梅努阿。',
    when: (ctx) => ctx.year === -800
        && ctx.season <= 1
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '牵上这匹马，往图什帕去',
            accent: true,
            pick: (api) => {
                api.setFlag('见过岩壁骑马人');
                api.setFlag('初马');
                api.hero.giveFirstHorse();
                api.notify('🐎 得到第一匹马「初马」（六岁母马，通灵马第 1 代）——摸到马，就能看见它记得的事');
            },
        },
    ],
};

/** URT-04 盗马贼：前 800–前 795 年秋季，平民在图什帕一带；开局那年秋天必来，之后每年秋天 30% 机会 */
const URT_04_HORSE_THIEF: Storylet = {
    id: 'URT-04',
    speaker: '养马人家',
    text: '夜里马厩有动静，几十个山民摸进来牵马，正往东边山里跑。{玩家}，追不追？',
    // 开局那年秋天必来（开局段要有事做，不让玩家在湖边干等）；之后每年秋天 30%
    chance: (ctx) => (ctx.year === -800 ? 1 : 0.3),
    when: (ctx) => ctx.year >= -800 && ctx.year <= -795
        && ctx.season === 2
        && ctx.rank === 'civilian'
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '叫醒养马人家，带人一起追',
            accent: true,
            pick: (api) => {
                startHorseThiefSkirmish(api.app, 'group', (won) => {
                    if (won) {
                        api.addMerit(MERIT_HORSE_THIEF);
                        const got = captureMountainHorses(api);
                        api.setFlag('URT-04-won');
                        api.notify(`🐎 追回了被盗的马，还缴获了山地马${got}，功勋 +${MERIT_HORSE_THIEF}`);
                    } else {
                        api.setFlag('URT-04-lost');
                        api.notify(`🐎 盗马贼跑进了山里，${loseToThieves(api)}`);
                    }
                });
            },
        },
        {
            label: '来不及了，一个人骑马先追',
            pick: (api) => {
                startHorseThiefSkirmish(api.app, 'solo', (won) => {
                    if (won) {
                        api.addMerit(MERIT_HORSE_THIEF);
                        // 单骑追了一夜：坐骑累一季
                        api.hero.horses.tire(1);
                        const got = captureMountainHorses(api);
                        api.setFlag('URT-04-won');
                        api.notify(`🐎 单骑截住了落后的盗马贼，追回马匹，缴获山地马${got}，功勋 +${MERIT_HORSE_THIEF}；坐骑跑累了，要歇一季`);
                    } else {
                        // 人马都挂了彩：坐骑伤一季
                        api.hero.horses.injure(1);
                        api.setFlag('URT-04-lost');
                        api.notify(`🐎 寡不敌众，${api.playerName}和坐骑都受了伤，要养一季；${loseToThieves(api)}`);
                    }
                });
            },
        },
    ],
};

export const URARTU_OPENING_STORYLETS: readonly Storylet[] = [
    URT_01_AWAKEN,
    URT_04_HORSE_THIEF,
];
