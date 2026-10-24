/**
 * 武将文化的**唯一真相来源**：武将挂在哪座据点，就是那座据点的建筑文化（66 之一）。
 * 🔴 [2026-10-24 主人「一个据点一个文化，武将和据点要同文化…优先同文化」]
 *   `GeneralCulture.ts` 里那张表只作**无据点武将的兜底**（正常全库武将都有据点）。
 *   这样新增武将只需写 `cityId`，文化、军团全部自动对齐，不需要手改第二份数据、也不需要人工检查。
 */
import { CITIES_V2, type BuildingStyle } from './cities_v2';
import { getRawGeneralByGeneralId } from './FactionGenerals';

/** cityId → buildingStyle（据点文化），建一次复用 */
const CITY_STYLE: ReadonlyMap<string, string> = new Map(
    (CITIES_V2 as any[]).map((c) => [c.id as string, String(c.buildingStyle ?? '')]),
);

/** 该武将所在据点的建筑文化；没有据点/据点没风格 → undefined */
export function getGeneralCityCulture(generalId: string | null | undefined): BuildingStyle | undefined {
    if (!generalId) return undefined;
    const hit = getRawGeneralByGeneralId(generalId) as any;
    const cityId: string | undefined = hit?.general?.cityId ?? hit?.cityId;
    if (!cityId) return undefined;
    const style = CITY_STYLE.get(cityId);
    return style ? (style as BuildingStyle) : undefined;
}
