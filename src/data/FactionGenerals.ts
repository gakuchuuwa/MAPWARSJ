/**
 * 势力名将：势力开局自带的史实名将（一势力一名将一立绘，AI 也有）。
 *
 * 设计定案（2026-06-15 主人拍板，见 GAME_DIRECTION.md「名将归势力」）：
 *   名将是**势力的属性**，不是远征/玩家专属 buff。知名势力的军团出生即带名将，
 *   AI 自己打就是名将对名将（白起对廉颇）——这才是观赏产品要看的历史名场面。
 *
 * 载体规则（LegionManager.createArmy 维护）：
 *   一个势力同一时刻只有**一支军团**扛名将（单载体不变式）；该军团覆没后，
 *   下一支新建的同势力军团接过名将。避免「白起×3」。
 *
 * 武将技生效：GeneralSkillCombat 门禁只看「军团是否带 generalId 且该 id 有档案」，
 *   不再要求跟随/远征——故 AI 名将同样触发，攻守双方各自结算。
 *
 * ── 添加新名将（三步）────────────────────────────────────────
 *   1. 本表加一行：factionId → { generalId, generalName, portrait }
 *   2. GeneralSkills.ts 的 GENERAL_PROFILES 加 generalId 的武将技档案（不加则技能不触发）
 *   3. 立绘放到 portrait 路径（游戏内 F2 可校正大小）
 *
 * 红线：一势力一名将一立绘，禁止随机池、禁止复用立绘。
 */

export interface FactionGeneral {
    /** 将领 id（须在 GENERAL_PROFILES 有档案，否则武将技不触发） */
    generalId: string;
    /** 将领名（军情/日志显示） */
    generalName: string;
    /** 将领立绘路径 */
    portrait: string;
}

/** factionId → 开局名将。先做秦/白起跑通，其余知名势力逐个补（廉颇、韩信、项羽…）。 */
export const FACTION_GENERALS: Readonly<Record<string, FactionGeneral>> = {
    qin: { generalId: 'baiqi', generalName: '白起', portrait: '/assets/qin/baiqi.png' },
    tang: { generalId: 'lishimin', generalName: '李世民', portrait: '/assets/litang/lishimin.png' },
    wuzhou_d: { generalId: 'direnjie', generalName: '狄仁杰', portrait: '/assets/wuzhou/direnjie.png' },
    ming_d: { generalId: 'zhudi', generalName: '朱棣', portrait: '/assets/daming/zhudi.png' },
    nantang_d: { generalId: 'lisheng', generalName: '李昪', portrait: '/assets/litang/lisheng.png' },
    guangzhou: { generalId: 'liulong', generalName: '刘龑', portrait: '/assets/lingnan/liulong.png' },
    shu: { generalId: 'wangping', generalName: '王平', portrait: '/assets/shuguo/wangping.png' },
    pagan: { generalId: 'anuluvtuo', generalName: '阿奴律陀', portrait: '/assets/dianmian/anuluvtuo.png' },
};

/** 取某势力的开局名将；未配置返回 null（该势力不带将） */
export function getFactionGeneral(factionId: string): FactionGeneral | null {
    return FACTION_GENERALS[factionId] ?? null;
}
