/**
 * 模拟器共用：文化区兵力上限（与 CultureTroopCaps / CityConfig 同源）
 */
export {
    getArmyMaxTroops,
    getLegionTroopCapMult,
    getCityTroopCapMult,
    scaleCityBaseMaxTroops,
} from '../src/systems/CultureTroopCaps';
export { getCityMaxTroops } from '../src/config/CityConfig';
