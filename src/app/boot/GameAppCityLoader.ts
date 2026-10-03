import { CITIES_V2 as CITIES } from '../../data/cities_v2';
import { STARTING_CAPITALS } from '../../data/StartingCapitals';
import { GameConfig } from '../../config/GameConfig';
import { getCityImage } from '../../systems/RegionSystem';
import { rollSessionCityMirror } from '../../systems/city-marker/CityBuildingMirror';
import type { City } from '../../types/core';
import type { GameApp } from '../GameApp';

export function loadGameAppCityData(app: GameApp): void {
    const cityData = CITIES.map((c) => {
        let factionId = c.factionId;
        if (GameConfig.SYSTEM.SANDBOX_MODE) {
            const isCapital = STARTING_CAPITALS[factionId] === c.id;
            if (!isCapital) {
                const ownerFaction = Object.keys(STARTING_CAPITALS).find(
                    (key) => STARTING_CAPITALS[key] === c.id
                );
                if (ownerFaction) {
                    factionId = ownerFaction;
                } else {
                    factionId = 'panjun';
                }
            }
        }

        return {
            id: c.id,
            name: c.name,
            factionId,
            latitude: c.lat,
            longitude: c.lng,
            type: c.type,
            // 🔴 [2026-09-11 主人定] 开局驻军一律 10000（`cities_v2` 里的 troops 开局被整个忽略）。
            //    原先这里为「战场没有兵力」写过 `...(c.battlefield ? {} : { troops: 10000 })` 的补丁；
            //    战场独立成 `src/data/Battlefields.ts` 之后**据点一律有兵力**，补丁已撤。
            troops: 10000,
            region: c.region,
            buildingStyle: c.buildingStyle,
            image: getCityImage(c),
            // 🔴 [2026-10-03 主人令「大中小城寨，战场都要随机镜像。PASS不要随机镜像」]
            //    大/中/小/城寨**一律每局随机掷一次**（原先「带专属立绘的据点整支照数据」那条约 131 座永远不翻、
            //    以及数据里写了 mirror:true 的照数据的例外，按本条令一并去掉）；
            //    险要（pass）**不掷签** —— `rollSessionCityMirror` 内部对 pass 只认数据。
            mirror: rollSessionCityMirror(c.type, c.mirror),
            startYear: c.startYear,
            endYear: c.endYear,
            stockadeShape: c.stockadeShape,
            stockadeFence: c.stockadeFence,
        };
    });

    app.cityManager.addCities(cityData);
    app.cityManager.updateYear(app.timeSystem.getYear());
}

export function handleGameAppCityEditorSave(app: GameApp, data: City): void {
    if (data.id.startsWith('temp_')) {
        const cities = app.cityManager.getCities();
        cities.forEach((c) => {
            if (c.id.startsWith('temp_')) {
                app.cityManager.removeCity(c.id);
            }
        });
    }
    app.cityManager.addCity(data);
}
