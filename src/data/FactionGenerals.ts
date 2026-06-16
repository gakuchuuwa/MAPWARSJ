/**
 * 势力将领：势力开局自带的史实将领（一势力一将领一立绘，AI 也有）。
 *
 * 设计定案（GAME_DIRECTION.md「番号随城，将领随势」2026-06-16）：
 *   **将领随势**——将领绑 factionId，占城不过户（武周占汴梁不得吴起）。
 *   番号随城见 ExpeditionLegions.CITY_ELITE_LEGIONS / getLegionEliteLegionName。
 *
 * 载体规则（LegionManager 维护）：
 *   一个势力同一时刻只有**一支军团**扛将领（单载体不变式）；该军团覆没后，
 *   下一支新建的同势力军团接过将领。避免「白起×3」。
 *
 * 武将技生效：GeneralSkillCombat 门禁只看「军团是否带 generalId 且该 id 有档案」，
 *   不再要求跟随/远征——故 AI 将领同样触发，攻守双方各自结算。
 *
 * ── 添加新将领（三步）────────────────────────────────────────
 *   1. 本表加一行：factionId → { generalId, generalName, portrait }
 *   2. GeneralSkills.ts 的 GENERAL_PROFILES 加 generalId 的武将技档案（不加则技能不触发）
 *   3. 立绘放到 portrait 路径（游戏内 F2 可校正大小）
 *
 * 红线：一势力一将领一立绘，禁止随机池、禁止复用立绘。
 */

export interface FactionGeneral {
    /** 将领 id（须在 GENERAL_PROFILES 有档案，否则武将技不触发） */
    generalId: string;
    /** 将领名（军情/日志显示） */
    generalName: string;
    /** 将领立绘路径 */
    portrait: string;
}

/** factionId → 开局将领。先做秦/白起跑通，其余知名势力逐个补。 */
export const FACTION_GENERALS: Readonly<Record<string, FactionGeneral>> = {
    qin: { generalId: 'baiqi', generalName: '白起', portrait: '/assets/qin/baiqi.png' },
    tang: { generalId: 'lishimin', generalName: '李世民', portrait: '/assets/litang/lishimin.png' },
    wuzhou_d: { generalId: 'direnjie', generalName: '狄仁杰', portrait: '/assets/wuzhou/direnjie.png' },
    ming_d: { generalId: 'zhudi', generalName: '朱棣', portrait: '/assets/daming/zhudi.png' },
    nantang_d: { generalId: 'lisheng', generalName: '李昪', portrait: '/assets/litang/lisheng.png' },
    guangzhou: { generalId: 'liulong', generalName: '刘龑', portrait: '/assets/lingnan/liulong.png' },
    shu: { generalId: 'wangping', generalName: '王平', portrait: '/assets/shuguo/wangping.png' },
    pagan: { generalId: 'anuluvtuo', generalName: '阿奴律陀', portrait: '/assets/dianmian/anuluvtuo.png' },
    liang: { generalId: 'machao', generalName: '马超', portrait: '/assets/hexi/machao.png' },
    qiuci: { generalId: 'baiba', generalName: '白霸', portrait: '/assets/xiyu/baiba.png' },
    tubo: { generalId: 'lunqinling', generalName: '论钦陵', portrait: '/assets/tubo/lunqinling.png' },
    menggu_d: { generalId: 'chengjisihan', generalName: '成吉思汗', portrait: '/assets/caoyuan/chengjisihan.png' },
    bohai: { generalId: 'dazuorong', generalName: '大祚荣', portrait: '/assets/dongbei/dazuorong.png' },
    goryeo: { generalId: 'jiangganzan', generalName: '姜邯赞', portrait: '/assets/chaoxian/jiangganzan.png' },
    ashikaga: { generalId: 'zulijunshi', generalName: '足利尊氏', portrait: '/assets/riben/zulijunshi.png' },
    tiemuer: { generalId: 'tiemuer', generalName: '帖木儿', portrait: '/assets/zhongya/tiemuer.png' },
    siam: { generalId: 'nalixuan', generalName: '纳黎萱', portrait: '/assets/dianmian/nalixuan.png' },
    shang: { generalId: 'fuhao', generalName: '妇好', portrait: '/assets/yinshang/fuhao.png' },
    bing: { generalId: 'lvbu', generalName: '吕布', portrait: '/assets/zhongyuan/lvbu.png' },
    han_d: { generalId: 'hanxin', generalName: '韩信', portrait: '/assets/liuhan/hanxin.png' },
    wei: { generalId: 'wuqi', generalName: '吴起', portrait: '/assets/zhou/wuqi.png' },
    manzhou_d: { generalId: 'nuerhachi', generalName: '努尔哈赤', portrait: '/assets/dongbei/nuerhachi.png' },
    xinluo: { generalId: 'jinyixin', generalName: '金庾信', portrait: '/assets/chaoxian/jinyixin.png' },
    edo: { generalId: 'benduozhongsheng', generalName: '本多忠胜', portrait: '/assets/riben/benduozhongsheng.png' },
    seljuq: { generalId: 'sangjiaer', generalName: '桑贾尔', portrait: '/assets/zhongya/sangjiaer.png' },
    chenla: { generalId: 'suyebamo', generalName: '苏耶跋摩', portrait: '/assets/dianmian/suyebamo.png' },
    song: { generalId: 'menggong', generalName: '孟珙', portrait: '/assets/zhaosong/menggong.png' },
};

/** 取某势力的开局名将；未配置返回 null（该势力不带将） */
export function getFactionGeneral(factionId: string): FactionGeneral | null {
    return FACTION_GENERALS[factionId] ?? null;
}
