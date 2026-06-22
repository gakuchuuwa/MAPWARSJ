import { CITIES } from '../../data/cities';
import { STARTING_CAPITALS } from '../../data/StartingCapitals';
import { GameConfig } from '../../config/GameConfig';
import { getCityImage } from '../../systems/RegionSystem';
import { rollSessionCityMirror } from '../../systems/city-marker/CityBuildingMirror';
import { hasCityExclusiveIcon } from '../../systems/city-marker/CityExclusiveIcons';
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
            troops: 20000,
            region: c.region,
            image: getCityImage(c),
            mirror: hasCityExclusiveIcon(c.id) ? !!c.mirror : rollSessionCityMirror(c.type, c.mirror),
            startYear: c.startYear,
            endYear: c.endYear,
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
