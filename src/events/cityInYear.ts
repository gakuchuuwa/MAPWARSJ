/**
 * 某一年这座据点存不存在（剧本期唯一判据）：地图显示、编辑器、出发地选城、会面地一律用它。
 *
 * 🔴 [2026-09-24 主人「历史上哪年有了哪个据点，就显示哪个据点，历史上哪年发生了什么事件，就进行什么事件。
 *    符合历史。符合历史。符合历史。说了八百次了，能不能记住呀」]
 *    起因：前332年推罗战役的出发据点写的是拉塔基亚（古劳迪西亚，约前300年塞琉古才建），
 *    地图上那年不画它，可「出发据点」「默认出发地」各自选城时没过这道闸。
 *
 * 两道闸都要过（与原先 ScriptCityVisibility.compute / routeCheck.eraGateReason 同一口径，只是收成一处）：
 *   ① 建立年份（cityFoundedYears.ts）晚于这一年 → 还没有；
 *   ② 据点归属武将的时代晚于这一年所处的时代 → 还没到它登场的年代。
 * 不存在的城**路照走**（仍是路网节点），只是不显示、不能当任何落脚点。
 */
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralEra, type GeneralEra } from '../data/GeneralEra';

export const ERA_ORDER: GeneralEra[] = ['antiquity', 'feudal', 'castle', 'imperial'];
export const ERA_NAME: Record<GeneralEra, string> = {
    antiquity: '古典', feudal: '封建', castle: '城堡', imperial: '帝国',
};

export function eraOfYear(year: number): GeneralEra {
    if (year < 400) return 'antiquity';
    if (year < 1050) return 'feudal';
    if (year < 1500) return 'castle';
    return 'imperial';
}

/** 这一年这座城为什么不在（null = 在） */
export function cityAbsentReason(cityId: string, year: number): string | null {
    const founded = CITY_FOUNDED_YEAR[cityId];
    if (founded !== undefined && founded > year) return `建立于 ${founded} 年，这一年（${year}）还没有`;
    const g = getCityAnchoredGeneral(cityId);
    const era = g ? getGeneralEra(g.generalId) : undefined;
    if (!era) return '归属武将没有时代，按规矩不上图';
    const cur = eraOfYear(year);
    if (ERA_ORDER.indexOf(era) > ERA_ORDER.indexOf(cur)) {
        return `${ERA_NAME[era]}时代的据点，这时还是${ERA_NAME[cur]}时代`;
    }
    return null;
}

export function cityExistsInYear(cityId: string, year: number): boolean {
    return cityAbsentReason(cityId, year) === null;
}
