/**
 * 🔴 [2026-10-22] 乌拉尔图开局的故事块（docs/探马/故事块样板_乌拉尔图开局.md）。
 * 已接上 URT-01「梦醒」、URT-02「赶马饮水」、URT-03「走失的小马」、URT-04「盗马贼」、URT-08「通灵·大马士革城下」；其余块按样板逐个往这里加。
 *
 * 开局段（前 800 年）的顺序：春 梦醒 → 夏 赶马饮水 → 秋 盗马贼 → 冬 走失的小马，演完放玩家去找武将。
 * （样板原写 02→03→04；盗马贼只在秋天来，故把小马挪到盗马贼之后的冬天，一年四季各一件。）
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

/** 开局段的几个地方（图什帕＝38.5, 43.37） */
/** 养马人家：图什帕城南城外 */
const HERDERS = { lat: 38.47, lng: 43.38, label: '养马人家' } as const;
/** 渠边饮马处：梅努阿王修的引水渠，图什帕东南约 10 公里 */
const CANAL = { lat: 38.43, lng: 43.45, label: '梅努阿渠' } as const;
/** 东边山里：小马走失的山沟，图什帕以东约 14 公里 */
const EAST_HILLS = { lat: 38.46, lng: 43.53, label: '东边山里' } as const;

/**
 * 开局段留人：平民、没入伍、还在图什帕一带、开局四件事（到走失的小马）还没演完 → 自动模式不去别处找武将。
 * 前 800 年梦醒之前也算（开局第一帧就要留住，否则自动模式先动身走了）。
 */
export function urartuOpeningHoldsPlayer(ctx: StoryContext): boolean {
    return ctx.year <= OPENING_LAST_YEAR
        && ctx.rank === 'civilian'
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID
        // 看结果标记而不是「弹过没有」：小马还在找、仗还在打时也要留住，办完才放行
        && !ctx.hasFlag('URT-03-done')
        && (ctx.isDone('URT-01') || ctx.year === -800);
}

/** URT-02 赶马饮水的赏罚 */
const MERIT_WATERING = 150;
const MERIT_WATERING_LATE = 50;
/** 先遛马、汗落了再饮：在渠边多耽搁的游戏秒数（约三分之一季） */
const COOL_DOWN_STAY_S = 5;

/** URT-03 走失的小马的赏 */
const MERIT_FOAL_TRACKED = 200;
const MERIT_FOAL_SPIRIT = 100;

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

/**
 * URT-02 赶马饮水：梦醒之后（开局那年夏天），在图什帕一带。
 * 赶着马群去梅努阿渠饮水、太阳落山前（本季之内）赶回来；赶马群走不快（行军 ×0.5）。
 * 到了渠边问怎么饮：马上饮省时间，但马跑热了喝急水，一半机会坐骑伤肠胃一季（吃了亏才学会）；
 * 先遛马汗落了再饮，学到马经，但在渠边多耽搁：坐骑若已累着、伤着，就赶不上日落了。
 * 准时 → 功勋 +150；误了 → 功勋 +50，摸黑赶回来，坐骑累一季。
 * （实测：赶马群去程约 1.5 游戏秒、回程约 1 秒，一季 15 秒，光靠路程误不了日落，
 *   所以「误不误」看遛马时坐骑的状态；本季之内办不完也算误。）
 */
const URT_02_WATERING: Storylet = {
    id: 'URT-02',
    speaker: '养马人家',
    text: '图什帕城外的养马人家缺人手：「{玩家}，把马群赶到梅努阿渠饮水，太阳落山前赶回来。」',
    when: (ctx) => ctx.year >= -800 && ctx.year <= OPENING_LAST_YEAR
        && ctx.isDone('URT-01')
        && ctx.rank === 'civilian'
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '接下这活，赶着马群出发',
            accent: true,
            pick: (api) => {
                api.notify('🐎 马群跟在身后，往梅努阿渠去——赶着马群走不快，要赶在日落前回来');
                // 遛马时坐骑已累着/伤着 → 耽搁不起，赶不上日落
                let delayed = false;
                api.startErrand({
                    pace: 0.5,
                    deadlineSeasons: 1,
                    stops: [
                        {
                            ...CANAL,
                            onArrive: (a, next) => a.ask('梅努阿渠', '马群一路小跑过来，浑身是汗，挤着要往水里去。', [
                                {
                                    label: '先牵着遛一遛，汗落了再喝',
                                    accent: true,
                                    pick: (b) => {
                                        const mount = b.hero.horses.getMount();
                                        delayed = !mount || b.hero.horses.statusOf(mount) !== 'ok';
                                        b.setFlag('马经-饮水');
                                        b.notify('📖 马经：远路回来不能马上饮，先遛马、汗落了再喝');
                                        next(COOL_DOWN_STAY_S);
                                    },
                                },
                                {
                                    label: '马上让它们喝，好早点回去',
                                    pick: (b) => {
                                        if (Math.random() < 0.5) {
                                            b.hero.horses.injure(1);
                                            b.setFlag('马经-饮水');
                                            b.notify('🐎 坐骑跑热了喝急水，肚子胀痛，要养一季。老马夫叹气：远路回来不能马上饮');
                                        }
                                        next();
                                    },
                                },
                            ]),
                        },
                        HERDERS,
                    ],
                    onDone: (a, onTime) => {
                        if (onTime && !delayed) {
                            a.addMerit(MERIT_WATERING);
                            a.notify(`🐎 日落前把马群赶回来了，功勋 +${MERIT_WATERING}`);
                        } else {
                            a.addMerit(MERIT_WATERING_LATE);
                            a.hero.horses.tire(1);
                            a.notify(`🐎 天黑了才摸回来，马群和坐骑都累垮了，坐骑要歇一季；功勋 +${MERIT_WATERING_LATE}`);
                        }
                    },
                });
            },
        },
    ],
};

/**
 * URT-03 走失的小马：盗马贼那一仗打完之后（开局那年冬天），在图什帕一带。
 * 循着蹄印上山：跑一趟东边山里再回来，一定找到，功勋 +200，爬山累坏坐骑一季。
 * 让初马通灵去找：不用跑，初马累一季，功勋 +100；一半机会小马已受伤，带回治好，学到马经「治马」。
 * 初马伤着就通不了灵，只能自己上山。
 * 结果都记下「养马人家欠你一份情」（后面送马任务会用到）。
 */
const URT_03_LOST_FOAL: Storylet = {
    id: 'URT-03',
    speaker: '养马人家',
    text: '一匹小马昨夜走失了，蹄印往东边山里去。「{玩家}，帮着找找吧。」',
    when: (ctx) => ctx.year >= -800 && ctx.year <= OPENING_LAST_YEAR
        && ctx.isDone('URT-02')
        && (ctx.hasFlag('URT-04-won') || ctx.hasFlag('URT-04-lost'))
        && ctx.rank === 'civilian'
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '让初马通灵去找',
            accent: true,
            pick: (api) => {
                const spirit = api.hero.horses.getSpirit();
                if (!spirit || api.hero.horses.statusOf(spirit) === 'injured') {
                    api.notify('🐎 初马的伤还没好，通不了灵，只能自己循着蹄印上山');
                    trackFoalOnFoot(api);
                    return;
                }
                api.hero.horses.tire(1, spirit);
                api.addMerit(MERIT_FOAL_SPIRIT);
                api.setFlag('养马人家欠你一份情');
                if (Math.random() < 0.5) {
                    api.setFlag('马经-治马');
                    api.notify(`🐎 ${api.playerName}摸着${spirit.name}的脖子，看见了它闻到的东西：山沟石缝里卡着一匹小马。`
                        + `找回来时小马腿上挂了彩——📖 马经：治马，先止血，再敷草药。${spirit.name}累了，要歇一季；功勋 +${MERIT_FOAL_SPIRIT}`);
                } else {
                    api.notify(`🐎 ${api.playerName}摸着${spirit.name}的脖子，看见了它闻到的东西：山沟里，小马正低头啃枯草。`
                        + `当天就找回来了。${spirit.name}累了，要歇一季；功勋 +${MERIT_FOAL_SPIRIT}`);
                }
                api.setFlag('URT-03-done');
            },
        },
        {
            label: '循着蹄印上山',
            pick: (api) => trackFoalOnFoot(api),
        },
    ],
};

/** URT-03 选「循着蹄印上山」（或初马通不了灵）：跑一趟东边山里再回来 */
function trackFoalOnFoot(api: StoryApi): void {
    api.notify('🐎 循着蹄印，往东边山里去');
    api.startErrand({
        stops: [EAST_HILLS, HERDERS],
        onDone: (a) => {
            a.hero.horses.tire(1);
            a.addMerit(MERIT_FOAL_TRACKED);
            a.setFlag('养马人家欠你一份情');
            a.setFlag('URT-03-done');
            a.notify(`🐎 在山沟里找到了小马，牵回了养马人家。爬了一天山，坐骑累了，要歇一季；功勋 +${MERIT_FOAL_TRACKED}`);
        },
    });
}

/** 亚述围大马士革那一年 */
const DAMASCUS_796_YEAR = -796;

/** 大马士革（亚述围城的地方）：URT-08 那匹马从这里走过来 */
const DAMASCUS = { lat: 33.5131, lng: 36.3094 } as const;
/** 商队一年走多远（公里）：大马士革到图什帕约 750 公里，正好一年左右 */
const CARAVAN_KM_PER_YEAR = 1500;

/** 大马士革到玩家所在地，商队要走几年（至少一年） */
function caravanYearsFromDamascus(ctx: StoryContext): number {
    const cosLat = Math.cos(((ctx.lat + DAMASCUS.lat) / 2) * Math.PI / 180);
    const km = Math.hypot((ctx.lat - DAMASCUS.lat) * 111.32, (ctx.lng - DAMASCUS.lng) * 111.32 * cosLat);
    return Math.max(1, Math.ceil(km / CARAVAN_KM_PER_YEAR));
}

/**
 * URT-08 通灵·大马士革城下：前 796 年亚述围大马士革；一匹参战的亚述战马退役后随叙利亚商队走到{玩家}身边。
 * 骨架（主人定）：马必须真的走到主角身边，时间按马走到的年份算 —— 所以不限在图什帕：
 * {玩家}在哪座据点，马就走到哪，按距离算要走几年（图什帕约一年＝前 795 年起）。
 * 摸到箭疤就能进它的记忆（horseMemories.ts：同步 / 完全同步 / 失步）；也可以先买下，改天在马厩里「通灵」。
 */
const URT_08_DAMASCUS_HORSE: Storylet = {
    id: 'URT-08',
    speaker: '叙利亚商队',
    text: (ctx) => `一支从叙利亚来的商队到了${ctx.nearCityName ?? '这里'}，牵着一匹亚述的退役战马。马的左腿上有一道箭疤。`
        + '{玩家}把手放上去——看见了大马士革的城墙。',
    when: (ctx) => ctx.isDone('URT-01')
        && ctx.nearCityId !== null
        && ctx.year >= DAMASCUS_796_YEAR + caravanYearsFromDamascus(ctx),
    options: [
        {
            label: '跟着它的记忆进去',
            accent: true,
            pick: (api) => {
                const h = buyArrowScarHorse(api);
                api.readHorseMemory(h.id);
            },
        },
        {
            label: '先买下它，改天再看',
            pick: (api) => {
                const h = buyArrowScarHorse(api);
                api.notify(`🐎 买下了「${h.name}」。想看它记得的事，到马厩里对它点「通灵」`);
            },
        },
    ],
};

function buyArrowScarHorse(api: StoryApi) {
    return api.hero.horses.addHorse({
        name: '箭疤',
        sex: 'stallion',
        age: 13,
        origin: '叙利亚商队带来的亚述退役战马，左腿有箭疤',
        memoryId: 'damascus_-796',
    });
}

/** URT-04 盗马贼：前 800–前 795 年秋季，平民在图什帕一带；开局段的秋天必来，演完开局段以后每年秋天 30% 机会 */
const URT_04_HORSE_THIEF: Storylet = {
    id: 'URT-04',
    speaker: '养马人家',
    text: '夜里马厩有动静，几十个山民摸进来牵马，正往东边山里跑。{玩家}，追不追？',
    // 开局段的秋天必来（开局那年赶马误到秋天，就顺延到下一年秋天）；开局段演完以后每年秋天 30%
    chance: (ctx) => (ctx.hasFlag('URT-03-done') ? 0.3 : 1),
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
    URT_02_WATERING,
    URT_04_HORSE_THIEF,
    URT_03_LOST_FOAL,
    URT_08_DAMASCUS_HORSE,
];
