/**
 * 武将 ↔ 军团 对应校验：每位武将必须有 时代（势力时代 FACTION_ERA，按武将自己的势力）+ 文化（GENERAL_CULTURE），
 * 且他的军团（武将自己的 → 势力挂的）＝ 二级军团表里「该文化 × 该时代」那一支。
 * 🔴 [2026-10-19 主人令]「一个武将要有一个对应的军团」「必须给每个武将单独添加一个文化属性，才能对应上军团」
 *
 * 🔴 [2026-10-20 主人最新令「这次改回来，以后就不要动三级军团了，省的误伤」] 三级军团一律不动：
 *   挂三级军团的武将保持原样，**只作参考报告，不再判「应改二级」**；旧「三级也查」判法作废。
 *   唯一例外仍是「帝国时代盗贼团伙团」（盗贼团伙铁律）。
 * 🔴 [2026-10-20 主人设定] 西班牙线：帝国时代西班牙方阵军团＝欧洲武将；帝国时代西班牙征服军团（三级）＝美洲武将。
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/verify-general-legion.mts
 */
import { FACTION_GENERALS, getGeneralOwnLegionName } from '../src/data/FactionGenerals';
import { FACTIONS } from '../src/data/factions';
import { getGeneralEra } from '../src/data/FactionEra';
import { getGeneralCulture } from '../src/data/GeneralCulture';
import { FACTION_COMPOSITIONS } from '../src/data/FactionCompositions';
import { LEVEL_2_CIV_62_LEGIONS } from '../src/data/level2Civ62Legions';
import { LEVEL_3_LEGIONS } from '../src/data/level3CustomLegions';
import { getFactionLegionComposition, getLegionNameOfGeneral } from '../src/types/CultureFormations';
import { getGeneralEraSubtagLegion } from '../src/data/GeneralEraSubtags';

const L2 = LEVEL_2_CIV_62_LEGIONS as any[];
const byKey = new Map<string, string>(L2.map((l) => [`${l.buildingStyle}|${l.age}`, l.name]));
const l3 = new Set((LEVEL_3_LEGIONS as any[]).map((l) => l.name));
const fname = (id: string) => (FACTIONS as any[]).find((f) => f.id === id)?.name ?? '';

const problems: string[] = [];
// 🔴 [2026-11-05 主人令「这些人可以取消吧，然后按势力，文化套军团」] 动乱番号「盗贼团伙」（原名「起义军」）不再由武将手写挂载，
//    原 25 家动乱势力的武将一律改走「势力时代 × 据点文化」自动判定；三级军团本体照旧保留、不动。
const UPRISING_LEGION = '盗贼团伙';   // 仍存在的三级番号（现无武将挂载，保留定义）
let total = 0, ok = 0, uprisingOk = 0, thirdKept = 0;
const usedL2 = new Set<string>();
for (const [fid, entry] of Object.entries(FACTION_GENERALS as any)) {
    for (const g of (Array.isArray(entry) ? entry : [entry]) as any[]) {
        total++;
        const gfid = g.factionId ?? fid;
        const era = getGeneralEra(g.generalId, gfid);
        const culture = getGeneralCulture(g.generalId);
        const legion = getLegionNameOfGeneral(gfid, g.generalId) ?? getGeneralOwnLegionName(g.generalId) ?? (FACTION_COMPOSITIONS as any)[gfid]?.legionName;
        if (legion) usedL2.add(legion);
        const who = `${gfid}｜${fname(gfid)}｜${g.generalName}`;
        if (!era) { problems.push(`${who}｜缺时代`); continue; }
        if (!culture) { problems.push(`${who}｜缺文化`); continue; }
        const want = byKey.get(`${culture}|${era}`);
        if (!want) { problems.push(`${who}｜${culture}×${era} 没有二级军团`); continue; }
        if (legion === UPRISING_LEGION && (FACTION_COMPOSITIONS as any)[gfid]?.legionName === UPRISING_LEGION) {
            uprisingOk++;   // 盗贼团伙：军团口径按铁律，不按文化×时代
            continue;
        }
        // 🔴 [2026-10-20 主人令「姬发他们是先秦军团，编制却不对」] 细分标签「古典·先秦」武将：军团必须是其细分专属军团（古典时代先秦军团，战车＋步＋弓、无骑无弩，符合商周史实），
        //    不按「文化×时代」套华夏（华夏编制含诸葛弩、虎骑，姬发牧野之战前1046年不可能有）。
        const subLegion = getGeneralEraSubtagLegion(g.generalId);
        if (subLegion) {
            if (legion !== subLegion) { problems.push(`${who}｜先秦标签武将现「${legion}」应「${subLegion}」`); continue; }
            if (!getFactionLegionComposition(gfid, g.generalId)) { problems.push(`${who}｜「${legion}」取不到编制`); continue; }
            ok++;
            continue;
        }
        if (l3.has(legion)) {
            // 🔴 [2026-10-20 主人最新令「以后就不要动三级军团了，省的误伤」] 三级军团一律不动：
            //    挂三级军团的武将保持原样，此处只作参考，不判错、不要求改二级。
            thirdKept++;
            continue;
        }
        if (legion !== want) { problems.push(`${who}｜现「${legion}」应「${want}」（${culture}×${era}）`); continue; }
        if (!getFactionLegionComposition(gfid, g.generalId)) { problems.push(`${who}｜「${legion}」取不到编制`); continue; }
        ok++;
    }
}
// 🔴 [2026-11-10 主人令「如果二级军团没有武将套用，请报错」]
for (const l of L2) {
    if (!usedL2.has(l.name)) {
        problems.push(`【二级军团无武将套用】${l.name}（${l.buildingStyle}×${l.age}）`);
    }
}
console.log({ 武将总数: total, 对应上: ok, 动乱番号残留: uprisingOk, 三级保留: thirdKept, 二级军团总数: L2.length, 二级已套用: L2.filter((l) => usedL2.has(l.name)).length, 有问题: problems.length });
for (const p of problems) console.log('  ', p);
process.exit(problems.length ? 1 : 0);

