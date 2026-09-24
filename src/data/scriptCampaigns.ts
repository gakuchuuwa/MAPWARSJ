/**
 * 🔴 [2026-09-24 主人定「给这个剧本命名，亚历山大东征」] **剧本名**。
 *
 * 依据 AGENTS.md §零之二「剧本的讲法：**人物传记** —— 一个人物一条线」：
 *   · 一个剧本 = 一位主角（归属武将 `generalId`）的那一整条战争线；
 *   · 事件数据**不新增字段**：剧本由「这一场归属哪位武将」推出来（`getScriptCampaignNameOfGeneral`）；
 *   · 主角换人（如主角死后接继业者）就是另一个剧本，在本表再加一条即可。
 */

/** 一个剧本：一位主角 + 主人定的剧本名 */
export interface ScriptCampaign {
    /** 主角武将 id（= 事件里的 `generalId`） */
    generalId: string;
    /** 剧本名（主人定，原文照用） */
    name: string;
    /** 一句话说明（可空） */
    note?: string;
}

export const SCRIPT_CAMPAIGNS: readonly ScriptCampaign[] = [
    {
        generalId: 'gen_alexander_great',
        name: '亚历山大东征',
        note: '前334年渡赫勒斯滂起兵，逐场东进：格拉尼库斯—米利都—哈利卡纳苏斯—伊苏斯—推罗—加沙—高加米拉—乌克西亚隘口—波斯门……至前324年科塞亚止。',
    },
];

const BY_GENERAL = new Map(SCRIPT_CAMPAIGNS.map((c) => [c.generalId, c]));

/** 这位主角的剧本；没登记 → null */
export function getScriptCampaignOfGeneral(generalId: string | null | undefined): ScriptCampaign | null {
    return generalId ? BY_GENERAL.get(generalId) ?? null : null;
}

/** 这位主角的剧本名；没登记 → null（界面按「无剧本」处理） */
export function getScriptCampaignNameOfGeneral(generalId: string | null | undefined): string | null {
    return getScriptCampaignOfGeneral(generalId)?.name ?? null;
}
