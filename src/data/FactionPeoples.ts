/**
 * 势力 → 民族（族群）映射 —— 2026-11-07 主人令「第一符合历史，第二精锐跟着武将走，
 * 第三精锐跟着势力走，第四跟着民族走，第五跟着区域走，第六跟着据点」的**第四层依据**。
 *
 * 用途：判「两个不同势力能不能用同一个精锐番号」——**同一民族的不同政权可以共用同名番号**
 * （蒙古突骑出现在蒙古/大元/伊儿；契丹铁骑出现在辽/西辽；诺曼骑士出现在西西里/高卢），
 * 民族不同的不许共用（如阿豪姆 vs 孟加拉、真腊 vs 占婆，已各自拆号）。
 *
 * 口径：
 *  · 键是 factionId，值是**民族键**（同一史实军事传统/族群体系的政权用同一个键）；
 *  · **只登记「发生过跨势力共用」的势力**（2026-11-07 首批 60 家），按需再补，不求覆盖全库；
 *  · 民族键取史称（蒙古、契丹、诺曼、马其顿…），不新造名字；同一民族跨政权沿用同键；
 *  · 区域层、据点层**不参与共用判定**（跨区域驻防是常态，见 AGENTS §二.3）。
 */
export const FACTION_PEOPLE: Readonly<Record<string, string>> = {
    // 蒙古系（含卫拉特、东蒙古、伊儿、金帐、萨莱）
    menggu_d: '蒙古',
    yuan_d: '蒙古',
    yilihanguo_d: '蒙古',
    dada_ming: '蒙古',
    oirat_ming: '蒙古',
    khoshut: '蒙古',
    ganden: '蒙古',
    jinzhang: '蒙古',
    salai: '蒙古',

    // 匈奴系（含汉赵刘氏）
    xiongnu: '匈奴',
    han_zhao: '匈奴',

    // 柏柏尔系
    mulabite: '柏柏尔',
    muwaxide: '柏柏尔',
    malin: '柏柏尔',
    womaya: '柏柏尔',

    // 突厥—阿富汗—莫卧儿（德里军事传统）
    deli: '突厥',
    sur: '突厥',
    mowoer: '突厥',

    // 缅族诸政权
    dongxu: '缅',
    hantawadi: '缅',

    // 诺曼人
    xixiliwangguo: '诺曼',
    gaolu: '诺曼',

    // 十字军法兰克系
    falanji: '法兰克',
    saipulusi: '法兰克',
    yelusalengwg: '法兰克',

    // 六镇鲜卑系（宇文、高齐）
    yuwen: '六镇鲜卑',
    gaoqi_d: '六镇鲜卑',

    // 马其顿人（含继业者）
    maqidun: '马其顿',
    antigonid: '马其顿',
    sailiugu: '马其顿',

    // 契丹（辽、西辽）
    liao_d: '契丹',

    // 伊比利亚基督教诸国
    leangongguo: '伊比利亚',
    alagong: '伊比利亚',

    // 印度—希腊（旁遮普部族）
    asakaini: '印度-希腊',
    aswaka: '印度-希腊',

    // 唐（安西诸军）
    juandu: '唐',

    // 高棉 vs 占（不同民族，2026-11-07 已拆号，保留映射以免再被合并）
    chenla: '高棉',
    champa: '占',

    // 阿豪姆 vs 孟加拉（不同民族，2026-11-07 已拆号）
    ahaomu: '阿豪姆',
    boluo: '孟加拉',

    // 德意志诸侯（阿斯卡尼亚、霍亨索伦、施瓦本）
    asikanani: '德意志',
    shiwaben: '德意志',

    // 尼泊尔（廓尔喀、马拉）
    gurkha: '尼泊尔',
    malla: '尼泊尔',

    // 越（大越、越南）
    dayue: '越',
    yuenan: '越',

    // 罗斯诸公国
    peilieya_gongguo: '罗斯',

    // 波斯（萨珊、米赫兰）
    sashan: '波斯',
    mihran: '波斯',

    // 乌古斯诸部
    xierhe: '乌古斯',

    // 西班牙（卡斯蒂利亚、西班牙）
    kasidiliya: '西班牙',
    xibanya: '西班牙',
};

/**
 * 跨民族但史实成立的共用（逐条登记，值＝理由）。
 * 用途：一个政权可能出过几个民族的部队（西西里王国＝诺曼人立国、后为德意志霍亨斯陶芬王朝），
 * 势力级映射表达不了，就按番号逐条放行，不为一两例去拆势力或改民族。
 * 键＝精锐番号名。
 */
export const ELITE_SHARE_EXCEPTIONS: Readonly<Record<string, string>> = {
    '施瓦本骑士': '霍亨斯陶芬一家：曼弗雷德是腓特烈二世之子、西西里国王；巴巴罗萨是施瓦本公爵，同族同军',
};

/** 取势力的民族键；没有登记就返回 null（＝无法判定，按「跨民族」处理，逼着补登记） */
export function peopleOfFaction(factionId: string | null | undefined): string | null {
    return FACTION_PEOPLE[String(factionId ?? '')] ?? null;
}

/** 两个势力能不能共用同一个番号：同民族可共用；任一方没登记或民族不同则不可（登记了例外的番号放行） */
export function canShareEliteName(eliteName: string, a: string, b: string): boolean {
    if (a === b) return true;
    if (ELITE_SHARE_EXCEPTIONS[eliteName]) return true;
    const pa = peopleOfFaction(a);
    const pb = peopleOfFaction(b);
    if (!pa || !pb) return false;
    return pa === pb;
}
