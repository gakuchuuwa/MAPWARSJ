/**
 * 🔴 [2026-10-22] 乌拉尔图开局的故事块（docs/探马/故事块样板_乌拉尔图开局.md）。
 * 已接上 URT-01「梦醒」、URT-02「赶马饮水」、URT-03「走失的小马」、URT-04「盗马贼」、URT-05「梅努阿王征兵」、URT-06「攻破哈桑卢」、URT-07「看牙口」、
 * URT-08「通灵·大马士革城下」、URT-11「升斥候」；其余块按样板逐个往这里加。
 *
 * 开局段的顺序：前 800 年 春 梦醒 → 夏 赶马饮水 → 秋 盗马贼 → 冬 走失的小马 → 前 799 年春 梅努阿王征兵
 * → 应征进图什帕见萨尔杜里，走他现成的入伍（首战）对话 → 入伍乌拉尔图军时升斥候。
 * （样板原写 02→03→04；盗马贼只在秋天来，故把小马挪到盗马贼之后的冬天，一年四季各一件。
 *   征兵样板原写前 796 年冬；开局四件事演完已是前 800 年冬，功勋也够了，空等三年没东西玩，故提到前 799 年春。）
 * 「平民」一律按「还没投效势力」判（factionId 为空），不看官阶：没投效时功勋过 1000 官阶也会显示斥候。
 */
import type { Storylet, StoryContext, StoryApi, ErrandStop } from '../StoryletEngine';
import { startHorseThiefSkirmish } from '../horseThiefSkirmish';
import { HASANLU_YEAR, startHasanluSiege, startHasanluSupply } from '../hasanluSiege';
import { startWhenFree } from '../storySkirmish';
import { LORE_TEETH } from '../horseLore';

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
 * 百岁模式新开局在哪儿醒来：三处随机一处，都离岩壁 60–80 公里，不在城边。
 * 🔴 [2026-10-22 主人令「让玩家起始离任务点稍微远一点。有的时候我启动游戏还要干别的呢，你现在弄得上来就接任务」
 *     ＋「梦醒可以在山洞，农村，田野呀」「非得在城边吗」]
 *    原来出生在岩壁旁边，开局第一帧就弹梦醒对话、游戏暂停；现在醒来只飘一句提示（不弹框、不暂停），
 *    故事领着玩家走到凡湖东南岸的岩壁（urartuOpeningLead），走到了才弹梦醒，开局有一段空当。
 * 凡湖一带海拔一千五六百米，游戏的陆海判定（掩膜为水 且 海拔 < 0）不会把出生点当成海。
 */
export interface OpeningWakeSpot {
    id: string;
    lat: number;
    lng: number;
    /** 醒来那一刻飘的提示（`{玩家}` 换成称呼） */
    notice: string;
}
export const URARTU_WAKE_SPOTS: readonly OpeningWakeSpot[] = [
    { id: '山洞', lat: 38.9, lng: 42.83, notice: '{玩家}在凡湖北边山里的一个山洞里醒来，不记得自己是谁。洞外看得见湖，顺着山路往湖边走' },
    { id: '农村', lat: 39.03, lng: 43.7, notice: '{玩家}在凡湖东北的一个村子里醒来，躺在别人家的草垛上，不记得自己是谁。村里人指了指南边的湖' },
    { id: '田野', lat: 38.48, lng: 42.33, notice: '{玩家}在凡湖西岸的一片麦田里醒来，不记得自己是谁。顺着田埂往东，沿湖岸走' },
];
/** 醒来的地方记成剧情标记「醒在-山洞」等（随存档走） */
export const WAKE_FLAG_PREFIX = '醒在-';
export function pickUrartuWakeSpot(): OpeningWakeSpot {
    return URARTU_WAKE_SPOTS[Math.floor(Math.random() * URARTU_WAKE_SPOTS.length)];
}

/** 刻着骑马人的岩壁：凡湖东南岸（今埃德雷米特一带），图什帕西南约 13 公里，梦醒（URT-01）在这里 */
const ROCK = { lat: 38.42, lng: 43.26, label: '凡湖东南岸' } as const;
/** 到了岩壁的判定（公里） */
const ROCK_NEAR_KM = 5;

function kmTo(ctx: StoryContext, p: { lat: number; lng: number }): number {
    const cosLat = Math.cos((ctx.lat * Math.PI) / 180);
    return Math.hypot((ctx.lat - p.lat) * 111.32, (ctx.lng - p.lng) * 111.32 * cosLat);
}

/**
 * 开局领路：前 800 年还没梦醒、离岩壁还远 → 故事领着玩家走到岩壁（自动、手动模式都领）。
 * 第一次领路时飘一句醒来的提示（醒在哪儿看剧情标记）。
 */
export function urartuOpeningLead(ctx: StoryContext): { stop: ErrandStop; notice?: string } | null {
    if (ctx.year !== -800 || ctx.isDone('URT-01') || ctx.factionId !== null || ctx.attached) return null;
    if (kmTo(ctx, ROCK) <= ROCK_NEAR_KM) return null;
    const spot = URARTU_WAKE_SPOTS.find((s) => ctx.hasFlag(WAKE_FLAG_PREFIX + s.id));
    return { stop: ROCK, notice: spot ? `🌅 ${spot.notice}` : undefined };
}

/** 开局段最晚到哪一年（前 797 年底）：过了这年不再把玩家留在图什帕 */
const OPENING_LAST_YEAR = -797;

/** 开局段的几个地方（图什帕＝38.5, 43.37） */
/** 养马人家：图什帕城南城外 */
const HERDERS = { lat: 38.47, lng: 43.38, label: '养马人家' } as const;
/** 渠边饮马处：梅努阿王修的引水渠，图什帕东南约 10 公里 */
const CANAL = { lat: 38.43, lng: 43.45, label: '梅努阿渠' } as const;
/** 东边山里：小马走失的山沟，图什帕以东约 14 公里 */
const EAST_HILLS = { lat: 38.46, lng: 43.53, label: '东边山里' } as const;

/** 应征了（URT-05 选了应征）：开局段到此为止 */
const URT_05_ENLISTED = 'URT-05-enlisted';
/** 推说马病没去：来年春天再征一次，这次推不掉 */
const URT_05_DECLINED = 'URT-05-declined';
/** 征兵的功勋门槛（样板：500）；到前 798 年不论功勋都来征 */
const MERIT_CONSCRIPTION = 500;
const CONSCRIPTION_ANY_MERIT_YEAR = -798;
/** 萨尔杜里的军团在图什帕；他的势力 */
const URARTU_FACTION_ID = 'wulaertu_guo';

/**
 * 开局段留人：没投效、没入伍、还在图什帕一带、还没应征 → 自动模式不去别处找武将。
 * 应征（URT-05）那一刻放行：玩家自己进城见萨尔杜里，之后走现成的入伍流程。
 * 前 800 年梦醒之前也算（开局第一帧就要留住，否则自动模式先动身走了）；最晚留到前 797 年底。
 */
export function urartuOpeningHoldsPlayer(ctx: StoryContext): boolean {
    return ctx.year <= OPENING_LAST_YEAR
        && ctx.factionId === null
        && !ctx.attached
        // 梦醒之前还在往岩壁走，不在图什帕一带也要留住
        && (ctx.nearCityId === URARTU_OPENING_CITY_ID || (ctx.year === -800 && !ctx.isDone('URT-01') && ctx.autoMode))
        // 看结果标记而不是「弹过没有」：小马还在找、仗还在打时也要留住
        && !ctx.hasFlag(URT_05_ENLISTED)
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

/**
 * URT-01 梦醒：新开百岁模式，前 800 年，走到图什帕一带（40 公里内）必触发一次。
 * 自动模式由故事领到岩壁；自动关着时不领路，玩家自己走过来才弹（三个醒来处都在 40 公里外）。
 */
const URT_01_AWAKEN: Storylet = {
    id: 'URT-01',
    speaker: '凡湖岸',
    text: '{玩家}走到凡湖东南岸，湖边一面岩壁上刻着一个骑马的人，刻痕已经很旧。'
        + '一匹马走近，低头碰了碰他的手——他忽然看见了马记得的东西：这片湖叫凡湖，城叫图什帕，王叫梅努阿。',
    when: (ctx) => ctx.year === -800
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
        && ctx.factionId === null
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
        && ctx.factionId === null
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

/**
 * 应征：放行开局段，让玩家进图什帕见萨尔杜里。城里的对话、入伍、首战全走现成流程
 * （PlayerQuestSystem.onArrive：萨尔杜里有首战「凡湖击退亚述之战」，就是这一趟征兵要打的仗）。
 */
function answerConscription(api: StoryApi): void {
    api.setFlag(URT_05_ENLISTED);
    api.notify(`🛡️ ${api.playerName}应征了，牵上马进图什帕，去萨尔杜里将军帐下报到`);
    api.hero.travelToCity(URARTU_OPENING_CITY_ID);
}

/**
 * URT-05 梅努阿王征兵：走失的小马办完之后（开局段是前 799 年春），在图什帕一带，功勋 ≥ 500（到前 798 年不论功勋）。
 * 应征 → 进城见萨尔杜里入伍；推说马病 → 留在图什帕再做一年平民，来年春天再征一次（URT-05B），这次推不掉。
 * 使者说的是亚述来犯：入伍后要打的正是萨尔杜里的首战「凡湖击退亚述之战」，说法要对得上
 * （样板原写「攻打曼纳的哈桑卢」，那是 URT-06，等做哈桑卢时再接）。
 */
const URT_05_CONSCRIPTION: Storylet = {
    id: 'URT-05',
    speaker: '梅努阿王的使者',
    text: '王的使者到了：「亚述人又在南边集结，梅努阿王要各家出人出马，到萨尔杜里将军帐下听用。」'
        + '养马人家都看着{玩家}——这几年城外的马，数他骑得最好。',
    when: (ctx) => ctx.year >= -800 && ctx.year <= OPENING_LAST_YEAR
        && ctx.hasFlag('URT-03-done')
        && (ctx.merit >= MERIT_CONSCRIPTION || ctx.year >= CONSCRIPTION_ANY_MERIT_YEAR)
        && ctx.factionId === null
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '应征，牵马去萨尔杜里帐下',
            accent: true,
            pick: (api) => answerConscription(api),
        },
        {
            label: '推说马病了，不去',
            pick: (api) => {
                api.setFlag(URT_05_DECLINED);
                api.notify('🐎 推说马病了。使者记下了名字：「明年开春，各家还得出人。」');
            },
        },
    ],
};

/** URT-05B 再征：推说马病之后的下一个春天，这次推不掉 */
const URT_05B_CONSCRIPTION_AGAIN: Storylet = {
    id: 'URT-05B',
    speaker: '梅努阿王的使者',
    text: '开春，使者又来了：「今年各家都得出人，马病了就换一匹。」这次推不掉了。',
    when: (ctx) => ctx.hasFlag(URT_05_DECLINED)
        && !ctx.hasFlag(URT_05_ENLISTED)
        && ctx.season === 0
        && ctx.factionId === null
        && !ctx.attached
        && ctx.nearCityId === URARTU_OPENING_CITY_ID,
    options: [
        {
            label: '应征，牵马去萨尔杜里帐下',
            accent: true,
            pick: (api) => answerConscription(api),
        },
    ],
};

/**
 * URT-11 升斥候：入伍乌拉尔图军之后的第一个换季。
 * 样板原写「功勋到 1000 升斥候」；但主人 2026-09-07 定「已投效势力则保底斥候」（PlayerConfig.rankFor），
 * 入伍那一刻官阶就是斥候了，所以这一块改在入伍时演：萨尔杜里交小旗，就是升斥候那一下。
 */
const URT_11_SCOUT_FLAG: Storylet = {
    id: 'URT-11',
    speaker: '萨尔杜里',
    text: '萨尔杜里把一面小旗交给{玩家}：「你会骑马，也认得这一带的路。以后你走在大军前头。」',
    when: (ctx) => ctx.factionId === URARTU_FACTION_ID
        && ctx.attached
        && ctx.rank !== 'civilian',
    options: [
        {
            label: '接过小旗',
            accent: true,
            pick: (api) => {
                api.setFlag('乌拉尔图斥候');
                api.notify('🚩 官阶：斥候。走在大军前头，替大军探路');
            },
        },
    ],
};

/**
 * URT-07 看牙口（收集）：马厩里有 3 匹以上的马，梦醒之后任何时候、任何地方，一次性。
 * 学到马经「看牙口」：此后外来的马（买来、缴来）也能看出马龄（学会之前马厩里显示「？岁」）。
 * 开局里通常是盗马贼缴到山地马之后的那一季。
 */
const URT_07_TEETH: Storylet = {
    id: 'URT-07',
    speaker: '老马夫',
    text: '老马夫掰开一匹马的嘴，让{玩家}凑近看：「看门牙磨到哪儿，就知道它几岁。买马的人十个有九个被骗，就骗在这儿。」',
    when: (ctx) => ctx.isDone('URT-01') && ctx.horseCount >= 3,
    options: [
        {
            label: '跟着学',
            accent: true,
            pick: (api) => {
                api.setFlag(LORE_TEETH);
                api.notify('📖 马经：看牙口——门牙磨到哪儿，就知道马几岁。马厩里外来的马现在也看得出马龄了');
            },
        },
    ],
};

/** URT-06 攻破哈桑卢的赏 */
const MERIT_HASANLU_TAKEN = 500;
const MERIT_HASANLU_OTHERS_TOOK = 150;
/** 两仗之间等上一场战术模式收场再问（毫秒） */
const BETWEEN_BATTLES_ASK_MS = 2500;

/**
 * URT-06 攻破哈桑卢（锚点战役）：前 795–前 790 年，已入伍乌拉尔图军（授过小旗），在军中。
 * 萨尔杜里分一支偏师随梅努阿王南下曼纳的哈桑卢（战略地图上的大军不动，这是分出去的一支）。
 * 先送料：护运料队到城下（小队战）；送到 → 攻城多一架撞车、多一队人；坐骑连运三天料，累一季。
 * 再攻城：在哈桑卢史实坐标打攻城战（hasanluSiege.ts，不加据点）。
 * 天命锁：不论这一队打没打上去，哈桑卢都在这一年被攻破 —— 打上去功勋 +500，没打上去别的队破城，功勋 +150。
 * 都学到马经传说条目「哈桑卢的金碗」。
 */
const URT_06_HASANLU: Storylet = {
    id: 'URT-06',
    speaker: '萨尔杜里',
    text: '萨尔杜里分出一支人马，随梅努阿王南下曼纳的哈桑卢：「哈桑卢城墙又高又厚，城里人以为攻不下。'
        + '三天之内，把造撞车的木料运到城下。」{玩家}走在运料队前头。',
    when: (ctx) => ctx.factionId === URARTU_FACTION_ID
        && ctx.attached
        && ctx.isDone('URT-11')
        && ctx.year >= HASANLU_YEAR && ctx.year <= HASANLU_YEAR + 5,
    options: [
        {
            label: '护着运料队上路',
            accent: true,
            pick: (api) => {
                startHasanluSupply(api.app, (arrived) => {
                    api.hero.horses.tire(1);
                    window.setTimeout(() => api.ask('哈桑卢城下', arrived
                        ? '木料一根不少运到了城下，马夫们连夜造出两架撞车。坐骑连跑三天，累得直喘。'
                        : '曼纳人冲出来烧了一半木料，只造出一架撞车。坐骑连跑三天，累得直喘。', [
                        {
                            label: '跟着撞车攻城',
                            accent: true,
                            pick: (a) => startWhenFree(() => startHasanluSiege(a.app, arrived, (won) => {
                                a.setFlag('URT-06-done');
                                a.setFlag('马经-哈桑卢的金碗');
                                if (won) {
                                    a.addMerit(MERIT_HASANLU_TAKEN);
                                    a.notify(`🔥 哈桑卢城破，${a.playerName}这一队先登，功勋 +${MERIT_HASANLU_TAKEN}`);
                                } else {
                                    a.addMerit(MERIT_HASANLU_OTHERS_TOOK);
                                    a.notify(`🔥 这一队没攻上去，梅努阿王的大军从另一面破了城。哈桑卢还是在这一年烧成了废墟；功勋 +${MERIT_HASANLU_OTHERS_TOOK}`);
                                }
                                a.notify('📖 马经（传说）：哈桑卢的金碗——城破那天宫殿烧塌，三个守兵抱着一只金碗死在了废墟里');
                            })),
                        },
                    ]), BETWEEN_BATTLES_ASK_MS);
                });
            },
        },
    ],
};

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
        && ctx.factionId === null
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
    URT_05_CONSCRIPTION,
    URT_05B_CONSCRIPTION_AGAIN,
    URT_11_SCOUT_FLAG,
    URT_06_HASANLU,
    URT_07_TEETH,
    URT_08_DAMASCUS_HORSE,
];
