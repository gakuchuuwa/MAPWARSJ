/**
 * 剧本文案里**不许念的城名**（2026-09-27 立）。
 *
 * 为什么有这张表：主人 2026-09-26 定「**图中那年不显示的站，播报里不念城名**，改念那年真有的河、山、隘口、部族」；
 * 随后主人转呈 NN 的逐片地名考证，把「图上会显示、但那年其实还不叫这个名字（或早成废墟）」的站也点了出来
 * （阿托克＝1583 年阿克巴筑堡以后的名字、蒙格＝现代村名、呼勒万／巴姆＝帕提亚萨珊以后的城、尼尼微／亚述城＝前 614／612 已成废墟……）。
 * 那些站**过得了年代闸**（库里年代记的是古名或干脆记 -2000），所以闸门管不到，只能靠这张名单拦。
 *
 * 用法两处：
 *   ① 编辑器（`eventRules.ts`）扫文案，命中就报「改念 XXX」；
 *   ② 我写逐路旁白前自查（`scratch/_audit_part*_copy.mts` 同一条口径）。
 *
 * 🔴 只列**考证点过名**的；不确定的不进表（宁缺勿滥，别自己发明）。
 */
import { CITIES_V2 } from './cities_v2';
import { cityExistsInYear } from '../events/cityInYear';

/** 同名豁免：文案里出现的这些名字**不是那座城**（是人名／河名／战役名），闸门会误报，一律放行 */
export const SCRIPT_SPOKEN_NAME_EXEMPTIONS: Array<{ name: string; why: string }> = [
    { name: '亚历山大', why: '主角人名；埃及那座城另行写作「亚历山大城」' },
    { name: '格拉尼库斯', why: '河名／战役名；库里那条同名「城」是战场节点，念河名不算念城名' },
];
export interface ForbiddenCityName {
    /** 文案里不许出现的名字（库里据点名，或该站常见的现代名） */
    name: string;
    /** 对应哪座据点（有就用它顺便查年代闸） */
    cityId?: string;
    /** 只在这个年份及以前不许念（不填＝任何年份都不许念） */
    untilYear?: number;
    /** 这一年及以后就可以了（例如「亚历山大城」前 331 建成后正常念） */
    fromYear?: number;
    /** 改念什么 */
    instead: string;
    /** 依据 */
    why: string;
}

export const SCRIPT_FORBIDDEN_CITY_NAMES: ForbiddenCityName[] = [
    // ── 那年已成废墟，只当途经地理标记 ──
    { name: '尼尼微', cityId: 'city_niniwei', untilYear: -1, instead: '底格里斯河渡口那一带（废墟）', why: '前 612 年被米底与新巴比伦联军毁成废墟（阿里安也只在写旧事时提它）' },
    { name: '巴格达', cityId: 'city_bageda', untilYear: -1, instead: '俄皮斯平原（古称西蒂斯）', why: '🔴 [2026-10-02 逐场复核查出] 「巴格达」是公元 762 年阿拔斯朝新建都城之名；那年这里是底格里斯河畔的俄皮斯/西蒂斯平原。库里 city_bageda 的年代记的是**地方成城年**（前 539 年欧皮斯战役），闸门拦不住**名字**（同阿托克、呼勒万）' },
    { name: '亚述城', cityId: 'city_yashucheng', untilYear: -1, instead: '底格里斯河西岸的旧城废墟', why: '前 614 年被毁，前 331／前 329 已成土丘' },
    // ── 名字是后世才有的（站过得了年代闸，闸门拦不住）──
    { name: '阿托克', cityId: 'city_atuoke', untilYear: -1, instead: '印度河渡口（乌达班达普拉／Ohind）', why: 'Attock 是 1583 年阿克巴筑阿托克堡以后的名字；前 326 这里是印度河渡口' },
    { name: '蒙格', cityId: 'city_meng', untilYear: -1, instead: '战场旁新建的两座城（尼卡亚、布凯法利亚）', why: 'Mong 是现代村名；前 326 战后亚历山大在战场旁筑尼卡亚、对岸筑布凯法利亚' },
    { name: '呼勒万', cityId: 'city_hulewan', untilYear: -1, instead: '扎格罗斯山那条皇家大道上的隘口（古称 Chala／Chalonitis）', why: '呼勒万是帕提亚／萨珊以后的城；库里记 -2000，年代闸拦不住' },
    { name: '巴姆', cityId: 'city_bam_citadel', untilYear: -1, instead: '卡尔马尼亚的绿洲堡寨', why: '巴姆（Arg-e Bam）是帕提亚／萨珊以后的堡寨；库里记 -2000，年代闸拦不住' },
    { name: '锡尔詹', cityId: 'city_xierzhan', untilYear: -1, instead: '卡尔马尼亚（Carmania）那一片', why: '那年的地名是卡尔马尼亚；锡尔詹是后世名字（会师与胜利祭典就写在这片）' },
    { name: '贵山城', cityId: 'city_guishancheng', untilYear: -1, instead: '药杀水／塞人边境', why: '贵山城是汉代大宛国都之称，亚历山大时代不用这个名字' },
    { name: '羯霜那', cityId: 'city_jieshuangna', untilYear: -1, instead: '诺塔卡（Nautaca）', why: '羯霜那（Kesh）是隋唐译名；希腊化时期叫诺塔卡，今沙赫里萨布兹' },
    { name: '白沙瓦', cityId: 'city_baishawa', untilYear: -1, instead: '佩乌克劳提斯（Peucelaotis／梵文 Pushkalavati）', why: 'Purushapura／白沙瓦是贵霜以后的名字（与第五、六片同一条口径）' },
    { name: '忽毡', cityId: 'city_huzhan', untilYear: -1, instead: '药杀水南岸那座新城（绝域亚历山大城）', why: '库里这座城那几年过不了年代闸（锚定武将属城堡时代）—— 不显示就不念' },
];

/** 一座据点在某个年份**能不能上地图**（与游戏同一判据） */
export function cityNameHiddenInYear(cityId: string, year: number): boolean {
    return !cityExistsInYear(cityId, year);
}

/**
 * 扫一段文案，返回命中的**禁念名**（去重）。
 * @param year 这一场的年份（负数表公元前）
 */
export function forbiddenCityNamesIn(text: string, year: number, roadStations?: readonly string[]): ForbiddenCityName[] {
    if (!text) return [];
    const hit: ForbiddenCityName[] = [];
    const exemptAll = new Set(SCRIPT_SPOKEN_NAME_EXEMPTIONS.map((e) => e.name));
    const seen = new Set<string>();
    for (const row of SCRIPT_FORBIDDEN_CITY_NAMES) {
        if (exemptAll.has(row.name)) continue;
        if (!text.includes(row.name)) continue;
        if (row.untilYear !== undefined && year > row.untilYear) continue;
        if (row.fromYear !== undefined && year < row.fromYear) continue;
        if (seen.has(row.name)) continue;
        seen.add(row.name);
        hit.push(row);
    }
    // ② 「这一趟路上的站」那一类：库里年代说了算，不用手抄。
    //    🔴 只扫**本段路线上的站**（roadStations，由编辑器按段表传进来）——
    //    全库扫会把「亚历山大」「开城」「瓦卡」这类同字误报（人名、开城归附、卡瓦克山口）。
    const exempt = new Set(SCRIPT_SPOKEN_NAME_EXEMPTIONS.map((e) => e.name));
    const stations = roadStations ? new Set(roadStations.map((s) => s.replace(/^⚔/, ''))) : null;
    for (const c of CITIES_V2 as Array<{ id: string; name: string }>) {
        if (seen.has(c.name) || exempt.has(c.name)) continue;
        if (stations && !stations.has(c.name)) continue;
        if (!stations) continue;
        if (!text.includes(c.name)) continue;
        if (!cityNameHiddenInYear(c.id, year)) continue;
        seen.add(c.name);
        hit.push({ name: c.name, cityId: c.id, instead: '那年的河、山、隘口或部族名', why: `库里年代闸：这座城在 ${year < 0 ? '前' + -year : year} 年还不存在，图上不画、播报也不念` });
    }
    return hit;
}
