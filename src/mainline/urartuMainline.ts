/**
 * 🔴 [2026-10-23 主人「同意合并：百岁模式当世界，剧本作为跑在里面的主线」] 探马主线 · 乌拉尔图开局（平民这一段）。
 * 底稿：docs/探马/逐年_01_前800至前740.md（前 800 梦醒、前 799–前 797 平民放牧饮马找马、被征入军）。
 * 做法：.claude/skills/tanma-mainline/SKILL.md（点 → 路 → 文案）。
 *
 * 点：这一段全在**图什帕**一个点上——梦醒的湖岸、梅努阿渠、养马人家、东边山里都在图什帕 40 公里之内，
 *     按「一个据点代表周围 40 公里」记到图什帕，不另立点，所以这一段没有路，只有到点后的旁白和小仗。
 * 事件顺序：前 800 年 春 梦醒 → 夏 赶马饮水 → 秋 盗马贼（小仗）→ 冬 走失的小马 → 前 799 年春 梅努阿王征兵。
 * 征兵之后玩家进图什帕见萨尔杜里，走现成的入伍（首战）流程；入伍以后的几段（升斥候、看牙口、攻破哈桑卢、
 * 大马士革商队）还在旧故事块里，下一轮再改。
 */
import type { MainlineApi, MainlineEvent } from './MainlineDirector';
import { startHorseThiefSkirmish } from '../story/horseThiefSkirmish';
import { startWhenFree } from '../story/storySkirmish';

/** 开局据点：图什帕（乌拉尔图王都） */
export const URARTU_MAINLINE_CITY_ID = 'city_tushpa';

const MERIT_WATERING = 150;
const MERIT_HORSE_THIEF = 300;
const MERIT_FOAL_SPIRIT = 100;
const MERIT_FOAL_TRACKED = 200;
/** 征兵的功勋门槛；到前 798 年不论功勋都来征 */
const MERIT_CONSCRIPTION = 500;
const CONSCRIPTION_ANY_MERIT_YEAR = -798;

/** 盗马贼打赢：缴获一到两匹山地马（四到九岁） */
function captureMountainHorses(api: MainlineApi): void {
    const n = 1 + Math.floor(Math.random() * 2);
    const names: string[] = [];
    for (let i = 0; i < n; i++) {
        const h = api.hero.horses.addHorse({ age: 4 + Math.floor(Math.random() * 6), origin: '从盗马贼手里缴获的山地马' });
        names.push(`「${h.name}」`);
    }
    api.notice(`马厩里多了山地马${names.join('、')}`);
}

/** 盗马贼打输：丢一匹普通马（通灵马不会丢） */
function loseToThieves(api: MainlineApi): void {
    const lost = api.hero.horses.loseCommonHorse();
    if (lost) api.notice(`丢了一匹马「${lost.name}」`);
}

export const URARTU_MAINLINE: readonly MainlineEvent[] = [
    {
        id: 'URT-01',
        title: '梦醒',
        kind: 'small',
        year: -800,
        season: 0,
        cityId: URARTU_MAINLINE_CITY_ID,
        lines: [
            '公元前800年春，{玩家}在图什帕城外的湖岸边醒来，想不起自己是谁，也想不起是怎么走到这里的。',
            '湖岸一面岩壁上刻着一个骑马的人，刻痕已经很旧；一匹母马慢慢走过来，低头碰了碰{玩家}的手。',
            '{玩家}摸着这匹马的脖子，看见了它记得的东西：这片湖叫凡湖，湖边的城叫图什帕，乌拉尔图的王叫梅努阿。',
        ],
        run: (api, done) => {
            api.setFlag('见过岩壁骑马人');
            api.setFlag('初马');
            api.hero.giveFirstHorse();
            api.notice('得到第一匹马「初马」（六岁母马，通灵马第 1 代）：摸到马，就能看见它记得的事');
            done();
        },
    },
    {
        id: 'URT-02',
        title: '赶马饮水',
        kind: 'small',
        year: -800,
        season: 1,
        cityId: URARTU_MAINLINE_CITY_ID,
        lines: [
            { speaker: '养马人家', text: '图什帕城外的养马人家缺人手，托{玩家}把马群赶到梅努阿王新修的引水渠边饮水，赶在太阳落山之前回来。' },
            '马群一路小跑到了梅努阿渠，一匹匹浑身是汗，挤着要往水里去，{玩家}想起养马人家的叮嘱，先把马群拦住。',
            '{玩家}牵着马群在渠边遛了一圈，等身上的汗落了才放下水；远路回来的马不能马上饮水，这一条记进了马经。',
            { speaker: '养马人家', text: '太阳落山之前，{玩家}把马群一匹不少地赶回了养马人家，养马人家的塔胡站在栏边连声道谢。' },
        ],
        run: (api, done) => {
            api.setFlag('马经-饮水');
            api.addMerit(MERIT_WATERING, '日落前把马群赶了回来');
            done();
        },
    },
    {
        id: 'URT-04',
        title: '盗马贼',
        kind: 'small',
        year: -800,
        season: 2,
        cityId: URARTU_MAINLINE_CITY_ID,
        lines: [
            '秋夜里马厩外传来响动，一伙山民摸进来牵走了马群，正往东边山里跑，{玩家}叫醒养马人家，一起骑马追了上去。',
        ],
        run: (api, done) => {
            const start = () => startHorseThiefSkirmish(api.app, 'group', (won) => {
                if (won) {
                    api.setFlag('URT-04-won');
                    captureMountainHorses(api);
                    api.addMerit(MERIT_HORSE_THIEF, '追回了被盗的马');
                    api.say(['盗马贼丢下马群逃进了东边山里，被盗的马全都追了回来，{玩家}还牵回了几匹山里的好马。'], done);
                } else {
                    api.setFlag('URT-04-lost');
                    loseToThieves(api);
                    api.say(['盗马贼抢先逃进了东边山里，追兵在山口外失了踪迹，养马人家为丢掉的马心疼了好些日子。'], done);
                }
            });
            startWhenFree(start);
        },
    },
    {
        id: 'URT-03',
        title: '走失的小马',
        kind: 'small',
        year: -800,
        season: 3,
        cityId: URARTU_MAINLINE_CITY_ID,
        lines: [
            { speaker: '养马人家', text: '入冬以后，养马人家的一匹小马夜里走失了，小小的蹄印一直通到东边山里，{玩家}牵着初马进山去找。' },
        ],
        run: (api, done) => {
            const horses = api.hero.horses;
            const spirit = horses.getSpirit();
            api.setFlag('养马人家欠你一份情');
            api.setFlag('URT-03-done');
            if (spirit && horses.statusOf(spirit) !== 'injured') {
                horses.tire(1, spirit);
                api.addMerit(MERIT_FOAL_SPIRIT, '找回了走失的小马');
                const lines = ['{玩家}摸着初马的脖子，看见了它闻到的东西：山沟石缝里卡着那匹小马，当天就把小马牵回了养马人家。'];
                if (Math.random() < 0.5) {
                    api.setFlag('马经-治马');
                    lines.push('小马腿上挂了彩，{玩家}照养马人家教的先止血、再敷上草药，治马的法子也记进了马经。');
                }
                api.say(lines, done);
                return;
            }
            horses.tire(1);
            api.addMerit(MERIT_FOAL_TRACKED, '找回了走失的小马');
            api.say(['初马腿上的伤还没有好，通不了灵，{玩家}只好循着蹄印翻山去找，直到天黑才把小马牵回养马人家。'], done);
        },
    },
    {
        id: 'URT-05',
        title: '梅努阿王征兵',
        kind: 'small',
        year: -799,
        season: 0,
        cityId: URARTU_MAINLINE_CITY_ID,
        when: (api) => api.hero.merit >= MERIT_CONSCRIPTION || api.app.timeSystem.getYear() >= CONSCRIPTION_ANY_MERIT_YEAR,
        lines: [
            { speaker: '梅努阿王的使者', text: '公元前799年春，梅努阿王的使者来到图什帕城外，传令各家出人出马，到萨尔杜里将军帐下听用，抵御南边集结的亚述人。' },
            '养马人家都推举{玩家}，城外的马数{玩家}骑得最好；{玩家}跟养马人家道了别，牵上马进了图什帕，去萨尔杜里帐下报到。',
        ],
        run: (api, done) => {
            api.setFlag('URT-05-enlisted');
            done();
            // 进城见萨尔杜里：之后走现成的入伍（首战）流程
            api.hero.travelToCity(URARTU_MAINLINE_CITY_ID);
        },
    },
];
