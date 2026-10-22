/**
 * 🔴 [2026-10-22 主人令「接着做马经图鉴，把学到的马经显示出来，顺手做 URT-07 看牙口」]
 *
 * 马经：{玩家}一路学到的养马、用马、马的传说。学到＝玩家身上有对应的剧情标记（storyFlags，随存档走）。
 * 马厩面板的「马经」一栏按这张表列出：学到的显示全文，没学到的只显示「？？？」和在哪一卷能学到（收集感）。
 * 新加马经：在这里加一条，故事块里 setFlag(flag) 即可。
 */

export type HorseLoreKind = '养马' | '战法' | '传说';

export interface HorseLore {
    /** 剧情标记名（学到＝玩家有这个标记） */
    flag: string;
    title: string;
    text: string;
    kind: HorseLoreKind;
    /** 在哪儿学到（没学到时给提示） */
    hint: string;
}

export const HORSE_LORE: readonly HorseLore[] = [
    { flag: '马经-饮水', title: '饮水', text: '远路回来不能马上饮，先遛马、汗落了再喝', kind: '养马', hint: '乌拉尔图·赶马饮水' },
    { flag: '马经-治马', title: '治马', text: '马受了伤，先止血，再敷草药', kind: '养马', hint: '乌拉尔图·走失的小马' },
    { flag: '马经-看牙口', title: '看牙口', text: '看门牙磨到哪儿，就知道马几岁；学会以后，买来、缴来的马也能看出马龄', kind: '养马', hint: '乌拉尔图·马多了以后' },
    { flag: '马经-亚述骑兵两人一组', title: '亚述骑兵两人一组', text: '亚述骑兵两人一组：一人控缰持矛，一人放箭', kind: '战法', hint: '通灵·大马士革城下' },
    { flag: '马经-哈桑卢的金碗', title: '哈桑卢的金碗', text: '哈桑卢城破那天宫殿烧塌，三个守兵抱着一只金碗死在了废墟里', kind: '传说', hint: '乌拉尔图·攻破哈桑卢' },
];

export function getHorseLore(flag: string): HorseLore | undefined {
    return HORSE_LORE.find((l) => l.flag === flag);
}

/** 会看牙口：外来的马（买来、缴来的）也能看出马龄 */
export const LORE_TEETH = '马经-看牙口';
