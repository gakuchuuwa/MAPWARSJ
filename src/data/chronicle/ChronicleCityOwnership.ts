/**
 * 据点历年归属表（2026-11-13，AI 导演按史填写；范围：编年史第一段第 1—3 棒涉及地区）。
 * 编年史推演中，表内据点的归属以本表为准，不再按「在场武将」推算；
 * 编年史各场战斗按史载结果改写的归属（ChronicleDirector.setChronicleCityOwner）优先于同年及更早的表项。
 * 格式：[起始年, 势力]，按年升序。库内无对应势力者不填（如前 550 年的奇里乞亚王国）。
 */
export const CHRONICLE_CITY_OWNERSHIP: Readonly<Record<string, readonly (readonly [number, string])[]>> = {
    // 安善／帕萨尔加德：居鲁士本土
    city_bosibolisi: [[-550, 'aqimeinide']],
    // 埃兰苏萨；前 539 年后归波斯（那波尼德编年史、居鲁士圆柱）
    city_susa: [[-550, 'ailan'], [-539, 'aqimeinide']],
    // 埃克巴坦那：米底王都，其后由编年史战事改写
    city_hamadan: [[-550, 'midi']],
    // 撒狄：吕底亚王都，其后由编年史战事改写
    city_sifaerde: [[-550, 'ldiya']],
    // 俄庇斯—西帕尔一带、巴比伦：新巴比伦（迦勒底）
    city_bageda: [[-550, 'jialedi']],
    city_babilun: [[-550, 'jialedi']],
    // 加沙（卡迪提斯）：非利士城邦
    city_jiasa: [[-550, 'feilisidin']],
    // 孟菲斯：埃及第二十六王朝
    city_mengfeisi: [[-550, 'aiji']],
    // 福西亚（据点克拉佐美奈）：伊奥尼亚城邦
    city_kelazuomeinai: [[-550, 'aiaoniya']],
    // 米利都：与居鲁士立约臣服（希罗多德 I.141、I.169）；前 499 年首倡起义（V.35–38）
    city_miletus: [[-550, 'aiaoniya'], [-546, 'aqimeinide'], [-499, 'aiaoniya']],
    // 以弗所：克罗伊索斯首攻之城（I.26）；吕底亚亡后归波斯；伊奥尼亚起义；前 494 年复归波斯
    city_yifusuo: [[-550, 'ldiya'], [-546, 'aqimeinide'], [-499, 'aiaoniya'], [-494, 'aqimeinide']],
    // 纳克索斯：前 490 年达提斯焚其城（VI.96）
    city_chimarros: [[-550, 'naxos'], [-490, 'aqimeinide']],
    // 特洛阿德：吕底亚疆域，吕底亚亡后归波斯
    city_teluoyi: [[-550, 'ldiya'], [-546, 'aqimeinide']],
    // 斯特鲁马河口（后之安菲波利斯）：色雷斯埃多尼人地；前 512 年梅加巴佐斯征服色雷斯（V.1–15）
    city_anfeibolisi: [[-550, 'seleisi'], [-512, 'aqimeinide']],
};
