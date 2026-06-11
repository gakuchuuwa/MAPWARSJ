/**
 * 日本文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 跟拍军团兵力 ≥ 5 万且势力在此表中有映射时，方可下达远征；
 * 下令时保存军团原名 → 改为精锐番号；远征功成后**保留番号**（仅目标城异常消失时恢复原名）。
 *
 * 收录红线（主人 2026-06-11）：
 * - 不收幕末—明治近代番号（新选组、奇兵队、白虎队、萨摩藩兵等）
 * - 不收热兵器专名（铁炮队、百人组、骑马铁炮、杂贺铁炮等）
 * - 冷兵器专名优先；辞典 §5 + 可考增补；宁缺毋滥
 */
export const JAPAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, string>> = {
    // ── 室町·元寇·四国水军·萨摩（辞典增补 + 史地分置）──
    ashikaga: '足利奉公众',   // 京都·室町将军直属
    so: '弘安御敌',           // 对马·元寇首战前哨（≠番役；番役见筑前）
    zhuqian: '元寇番役',      // 太宰府·异国警固番役、博多防线
    chosokabe: '长宗我部水军', // 冈丰·四国水军
    satsuma: '萨摩隼人',      // 内城·萨摩武士传统
    hojo_d: '风魔党',         // 小田原·北条氏（辞典 #17）
    iga_d: '伊贺众',          // 名张·伊贺国（辞典 #16）

    // ── 战国—安土桃山（冷兵器）──
    hashiba: '七手组',        // 姬路→丰臣大阪近卫
    kai: '武田赤备',          // 躑躅崎馆·武田赤备
    owari: '母衣众',          // 清洲·织田母衣众
    jinchuan: '马回众',       // 骏府·大名马回
    echigo: '轩猿众',         // 春日山·上杉轩猿（辞典 #18）
    aki: '九鬼水军',          // 吉田郡山·濑户内水军（冷兵接舷）
    izumo: '长柄足轻队',
    honda: '长柄足轻队',

    // ── 江户（刀剑旗本，非铁炮百人组）──
    edo: '旗本武士',
    aizu: '大番',             // 鹤之城·会津藩代；取代幕末白虎队

    // ── 镰仓—奥州·东北（御家人体系）──
    fujiwara: '御家人',       // 柳之御所·奥州藤原
    kakizaki: '御家人',       // 胜山馆·松前
    nanbu: '御家人',          // 根城·陆奥南部

    // ── 九州南·岛链 ──
    dayu: '防人',             // 赤尾木城·大隅；取代幕末萨摩藩兵
    anmei: '海贼众',          // 赤木名城·奄美（接舷冷兵）

    // ── 古代·民族 ──
    yamato: '健儿武士',       // 飞鸟宫·平安健儿（辞典 #2）
    ayinu: '阿伊努毒箭勇士',
    beihai: '阿伊努毒箭勇士',

    // ── 琉球（文化区岭南；水师冷兵）──
    ryukyu: '那霸水师',
};

export function getExpeditionEliteLegionName(factionId: string): string | null {
    return JAPAN_EXPEDITION_ELITE_LEGIONS[factionId] ?? null;
}

export function canFactionLaunchExpedition(factionId: string): boolean {
    return factionId !== 'panjun' && getExpeditionEliteLegionName(factionId) != null;
}

/** 远征下令：保存原名并改为精锐名；已保存则不再覆盖 */
export function applyExpeditionEliteRename(army: {
    name: string;
    expeditionSavedName: string | null;
    getFactionId(): string;
}): boolean {
    const elite = getExpeditionEliteLegionName(army.getFactionId());
    if (!elite) return false;
    if (army.name !== elite) {
        if (army.expeditionSavedName == null) {
            army.expeditionSavedName = army.name;
        }
        army.name = elite;
    }
    return true;
}

/** 远征功成：保留精锐番号，释放暂存的原名引用（便于再次远征） */
export function commitExpeditionEliteLegionName(army: {
    expeditionSavedName: string | null;
}): void {
    army.expeditionSavedName = null;
}

/** 远征异常结束（目标城已删等）：恢复募兵/默认军团名 */
export function restoreExpeditionLegionName(army: {
    name: string;
    expeditionSavedName: string | null;
}): void {
    if (army.expeditionSavedName == null) return;
    army.name = army.expeditionSavedName;
    army.expeditionSavedName = null;
}
