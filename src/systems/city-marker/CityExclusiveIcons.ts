/** `public/cities/0*.png` 专属据点贴图 */

export const CITY_EXCLUSIVE_ICON_BY_ID: Record<string, string> = {
    city_changan: '/cities/0changan.png',
    city_luoyang: '/cities/0luoyang.png',
    city_beijing: '/cities/0beijing.png',
    city_nanjing: '/cities/0nanjing.png',
    city_luoxie: '/cities/0lasa.png',
    city_yiluolucheng: '/cities/0qiuci.png',
    city_bukhara: '/cities/0buhala.png',
    city_samaerhan: '/cities/0samaerhan.png',
    city_gaochangcheng: '/cities/0tulufan.png',
    city_ayutthaya: '/cities/0ayutuoye.png',
    city_angkor: '/cities/0wuge.png',
    city_panyu: '/cities/0guangzhou.png',
    city_shenglong: '/cities/0shenglong.png',
    city_guangzhou: '/cities/0guangzhou.png',
    city_dali_city: '/cities/0dali.png',
    city_chengdu: '/cities/0chengdu.png',
    changan: '/cities/0changan.png',
    luoyang: '/cities/0luoyang.png',
    nanjing: '/cities/0nanjing.png',
    youzhou: '/cities/0beijing.png',
    city_buhala: '/cities/0buhala.png',
    city_cheshi: '/cities/0tulufan.png',
    city_qingjingsi: '/cities/0quanzhou.png',
    city_quanzhou: '/cities/0quanzhou.png',
    quanzhou: '/cities/0quanzhou.png',
    city_xiangyang: '/cities/0xiangyang.png',
    xiangyang: '/cities/0xiangyang.png',
    city_anyang: '/cities/0anyang.png',
    anyang: '/cities/0anyang.png',
    city_datong: '/cities/0datong.png',
    datong: '/cities/0datong.png',
    city_taiyuan: '/cities/0jinyang.png',
    city_jinyang: '/cities/0jinyang.png',
    jinyang: '/cities/0jinyang.png',
    taiyuan: '/cities/0jinyang.png',
};

/** 比普通大城 baseSize 140 略大 */
export const CITY_EXCLUSIVE_MARKER_BASE_SIZE = 160;

const EXCLUSIVE_ID_SET = new Set(Object.keys(CITY_EXCLUSIVE_ICON_BY_ID));

export function hasCityExclusiveIcon(cityId: string): boolean {
    return EXCLUSIVE_ID_SET.has(cityId);
}

export function getCityExclusiveIconPath(cityId: string): string | undefined {
    return CITY_EXCLUSIVE_ICON_BY_ID[cityId];
}
