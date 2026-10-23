/**
 * 🔴 [2026-10-22] 乌拉尔图开局的故事块（旧做法，正在换掉）。
 * 🔴 [2026-10-23 主人「同意合并：百岁模式当世界，剧本作为跑在里面的主线」]
 *    平民那一段（梦醒、赶马饮水、盗马贼、走失的小马、梅努阿王征兵）已改写成主线事件，
 *    挪到 src/mainline/urartuMainline.ts，这里的旧块已删；
 *    这里只剩入伍以后的四块（升斥候、看牙口、攻破哈桑卢、大马士革商队），下一轮照主线做法改写后整份删除。
 */
import type { Storylet, StoryContext, StoryApi } from '../StoryletEngine';
import { HASANLU_YEAR, startHasanluSiege, startHasanluSupply } from '../hasanluSiege';
import { startWhenFree } from '../storySkirmish';
import { LORE_TEETH } from '../horseLore';

/** 开局据点：图什帕（乌拉尔图王都） */
export const URARTU_OPENING_CITY_ID = 'city_tushpa';

/** 萨尔杜里的军团在图什帕；他的势力 */
const URARTU_FACTION_ID = 'wulaertu_guo';

/**
 * URT-11 升斥候：入伍乌拉尔图军之后的第一个换季。
 * 样板原写「功勋到 1000 升斥候」；但主人 2026-09-07 定「已投效势力则保底斥候」（PlayerConfig.rankFor），
 * 入伍那一刻官阶就是斥候了，所以这一块改在入伍时演：萨尔杜里交小旗，就是升斥候那一下。
 */
const URT_11_SCOUT_FLAG: Storylet = {
    id: 'URT-11',
    speaker: '萨尔杜里',
    text: '萨尔杜里把一面小旗交给{玩家}：「你会骑马，也认得这一带的路。以后你走在大军前头。」',
    // 🔴 [2026-10-23] 照逐年稿：公元前789年升斥候（原来入伍就升）
    when: (ctx) => ctx.year >= -789
        && ctx.factionId === URARTU_FACTION_ID
        && ctx.attached
        && ctx.rank !== 'civilian',
    options: [
        {
            label: '接过小旗',
            accent: true,
            pick: (api) => {
                api.setFlag('乌拉尔图斥候');
                api.notify(`🚩 ${api.playerName}接过小旗，官阶升为斥候：从今往后走在大军前头，替梅努阿王的大军探路、找水、看敌情`);
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
        {
            label: '改天再学',
            keepOpen: true,
            pick: () => {},
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
                                    a.notify(`🔥 撞车撞开了城门，${a.playerName}这一队头一个冲进哈桑卢，城里的宫殿烧了起来；功勋 +${MERIT_HASANLU_TAKEN}`);
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
        {
            label: '推说马累了，留在大营',
            pick: (api) => {
                api.setFlag('URT-06-done');
                api.notify(`🔥 ${api.playerName}没去。哈桑卢照样在这一年被攻破，烧成了废墟`);
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
        {
            label: '松开手，不买',
            pick: (api) => api.notify('🐎 商队牵着那匹老战马走了'),
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

export const URARTU_OPENING_STORYLETS: readonly Storylet[] = [
    URT_11_SCOUT_FLAG,
    URT_06_HASANLU,
    URT_07_TEETH,
    URT_08_DAMASCUS_HORSE,
];
