/**
 * cities_v2.ts — 重构版城市数据
 *
 * 架构原则:
 * - T0 大城 (big_city): 锁定 20 座 — 见 cities.ts §6 / AGENTS.md §六（不以旧版 17 城名单为准）
 * - T1 中城 (medium_city): 现代省会 + 朝代府治 — 待补充
 * - T2 关隘/要塞 (pass): 战略要冲 — 渡口据点归入 small_city
 * - 周边: 日本七道、朝鲜八道、各古代政权首都 — 待补充
 *
 * 命名原则:
 * - 历史大乱斗游戏, 使用各城市最有知名度的名字
 * - 朝代切换时, 通过 historicalNames 数组 (待实现) 动态改名
 *
 * 距离约束 (来自 cities.ts):
 * - 任意两据点距离 >= 50km (经纬度差 >= 0.4°)
 * - 已校验所有 T0 之间满足
 *
 * 14 区文化中心 (15 城, 见 RegionSystem.REGION_CENTERS):
 * - 开局兵力统一 troops: 20000（大城/中城均有）
 *
 * 界城 region 标准（环线锚点 vs 实际文化，详见 RegionSystem.ts REGION_BOUNDARY_LOOPS 注释）:
 * - 环线代称: 威海卫→文登、钓鱼岛城→钓鱼岛、也迷离→也迷里
 * - 哈密卫: 草原环线锚点，文化西域 WESTERN
 * - 石门关: 岭南环线锚点，文化川蜀 BASHU
 * - 尼布楚: 东北/草原共用锚点，文化东北 NORTHEAST
 * - 14 区环线主人定稿见 RegionSystem.ts REGION_BOUNDARY_LOOPS 注释（zoom=6 绘线）
 * - 威海卫/钓鱼岛城/也迷离/哈密/弓月/护密城 等代称与锚点 cityId 见该文件
 */

import { CityType } from '../types/core';

export interface CityDataV2 {
        id: string;
        name: string;
        factionId: string;
        lat: number;
        lng: number;
        type: CityType;
    troops?: number;
    /** 城市层级: 0=大城, 1=中城, 2=要塞/关隘/渡口/港口, 4=周边 (3 暂留备扩展) */
        tier?: 0 | 1 | 2 | 4;
    /** 文化区域分类 (如 KOREA, JAPAN 等) */
    region?: string;
    /** 关隘/港口朝向镜像 */
    mirror?: boolean;
    /** 史地备注（人工录入据点时的可考性说明，运行时不使用） */
    note?: string;
}

// ============================================================
// T0 — 中国十大古都 (基于 2016 成都共识, 有一处替换)
// ============================================================
//
// 长安、洛阳、北京、南京、杭州、成都、汉中、番禺、汴梁、姑臧、太原、安阳、沈阳、哈拉和林、逻些
// + 外国: 梅尔夫、阿瑜陀耶、吴哥、江户、金城（新罗都）
//
// 替换说明 (郑州 → 新郑):
// - 原 2016 成都共识列入"郑州"(因郑州商城遗址)
// - 替换为"新郑": 黄帝故里 + 春秋郑国都城 + 战国韩国都城, 历史代入感更强
// - 地理上, 新郑南移 ~40km 后, 与虎牢关 / 开封 错开成"川"字形,
//   主干道线路更舒展, 减少节点拥挤
//
// 命名说明:
// - 西安 → 显示"长安" (历史游戏汉唐千年知名度)
// - 其余按现代/历史最知名名字 (北京/南京/杭州/开封/大同/新郑/安阳/成都)
//
// 距离自检:
// - 洛阳 (34.62, 112.45) ↔ 新郑 (34.39, 113.72): Δ ≈ 130 km ✓
// - 新郑 ↔ 开封: Δ ≈ 80 km  ✓
// - 新郑 ↔ 安阳: Δ ≈ 190 km ✓
// - 开封 ↔ 安阳: Δ ≈ 145 km ✓
// - 安阳 ↔ 北京: Δ ≈ 420 km ✓
// - 北京 ↔ 大同: Δ ≈ 265 km ✓
// - 长安 ↔ 洛阳: Δ ≈ 320 km ✓
// - 长安 ↔ 成都: Δ ≈ 660 km ✓
// - 洛阳 ↔ 南京: Δ ≈ 700 km ✓
// - 南京 ↔ 杭州: Δ ≈ 250 km ✓
// - 开封 ↔ 南京: Δ ≈ 500 km ✓

export const T0_CAPITALS: CityDataV2[] = [
    // ── 关中 / 西部 ──
    {
        id: 'city_changan',
        name: '长安',
        factionId: 'tang',
        lat: 34.27, lng: 108.93,
        type: 'big_city',
        region: 'CENTRAL',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },
    {
        id: 'city_chengdu',
        name: '成都',
        factionId: 'shu',
        lat: 30.57, lng: 104.07,
        type: 'big_city',
        region: 'BASHU',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },

    // ── 中原核心 ──
    {
        id: 'city_luoyang',
        name: '洛阳',
        factionId: 'wuzhou_d',
        lat: 34.62, lng: 112.45,
        type: 'big_city',
        region: 'CENTRAL',
        troops: 20000,
        mirror: true, // 洛阳 ↔ 新郑 镜像分布
        tier: 0,
        note: '武周神都' },
    
    {
        id: 'city_anyang',
        name: '安阳',
        factionId: 'shang',
        lat: 36.1, lng: 114.39,
        type: 'big_city',
        region: 'CENTRAL',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },

    // ── 北方 ──
    {
        id: 'city_beijing',
        name: '北京',
        factionId: 'ming_d',
        lat: 39.9, lng: 116.41,
        type: 'big_city',
        region: 'NORTH',
        troops: 20000,
        tier: 0,
        note: '元大都/明永乐后京师；大明国都' },
    {
        id: 'city_datong',
        name: '大同',
        factionId: 'tuoba',
        lat: 40.08, lng: 113.3,
        type: 'medium_city',
        region: 'NORTH',
        troops: 10000,
        tier: 1,
        note: '大同；拓跋治所/重镇',
    },

    // ── 江南 ──
    {
        id: 'city_nanjing',
        name: '建业',
        factionId: 'jinling',
        lat: 32.05, lng: 118.77,
        type: 'big_city',
        region: 'JIANGNAN',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },
    {
        id: 'city_hangzhou',
        name: '临安',
        factionId: 'song',
        lat: 30.25, lng: 120.16,
        type: 'big_city',
        region: 'JIANGNAN',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },
    
    {
        id: 'city_taiyuan',
        name: '晋阳',
        factionId: 'bing',
        lat: 37.87, lng: 112.55,
        type: 'big_city',
        region: 'NORTH',
        troops: 20000,
        tier: 0,
        note: '并州治所晋阳' },
    { id: 'city_xiangyang', name: '襄阳', factionId: 'xiangzhou', lat: 32.01, lng: 112.12, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 1, note: '襄州治所；三国至宋荆襄枢纽' },

    { id: 'city_shouxian', name: '寿春', factionId: 'zhong', lat: 32.59, lng: 116.8, type: 'medium_city', region: 'CENTRAL', troops: 10000, tier: 1, note: '楚后期都、淮南/寿州治；淮西重镇' },
    { id: 'city_ueda', name: '上田城', factionId: 'sanada_d', lat: 36.4025, lng: 138.2464, type: 'small_city', troops: 10000, region: 'JAPAN', note: '真田氏名城，两次击退德川大军' },
];

// ============================================================
// T1 中城 — 待添加 (省会 + 朝代府治)
// ============================================================
export const T1_MEDIUM_CITIES: CityDataV2[] = [
    // ── 蜀道沿线 (长安→成都 的中城) ──
        // ── 关中平原历史名城 ──
        { id: 'city_anding', name: '安定', factionId: 'huangfu', lat: 35.327451, lng: 107.358398, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '安定；皇甫小城',
    },
    {
        id: 'city_hanzhong',
        name: '南郑',
        factionId: 'han_d',
        lat: 33.07, lng: 107.02,
        type: 'big_city',
        region: 'BASHU', troops: 20000,
        tier: 0,
        note: '汉中治；蜀汉开国都南郑',
    },
    {
        id: 'city_guozhou',
        name: '南充',
        factionId: 'guo',
        lat: 30.83, lng: 106.11,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '南充；果州小城',
    },
    { id: 'city_mianyang', name: '涪城', factionId: 'daxi_ming', lat: 31.482545, lng: 104.718933, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '涪城；大西小城',
    },
    {
        id: 'city_chongqing',
        name: '重庆',
        factionId: 'ba',
        lat: 29.56, lng: 106.58,
        type: 'medium_city',
        region: 'BASHU',
        troops: 10000,
        tier: 1,
        note: '巴国都·江州；巴蔓子将军故地（《华阳国志·巴志》）' },
    {
        id: 'city_jianzhou',
        name: '阳安',
        factionId: 'cheng',
        lat: 30.38, lng: 104.55,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '阳安；成国小城',
    },
    {
        id: 'city_zizhou',
        name: '盘石',
        factionId: 'zi',
        lat: 29.78, lng: 104.85,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '盘石；资州小城',
    },

    // ── 崤函古道沿线 (洛阳→长安 的中城) ──

    // ── 中原北线/冀南走廊 (洛阳→安阳 的中城) ──
    // ── 幽冀古道/平原走廊 (安阳→北京 的中城) ──
    {
        id: 'city_handan',
        name: '邯郸',
        factionId: 'zhao',
        lat: 36.61, lng: 114.49,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '邯郸；赵国治所/重镇',
    },
    { id: 'city_zhending', name: '真定', factionId: 'zhongshan', lat: 38.130241, lng: 114.590149, type: 'medium_city', region: 'NORTH', troops: 10000, note: '中山国故都；北宋崇宁真定府人口超16万' },
    {
        id: 'city_baoding', name: '保定', factionId: 'qingyuan_bd',
        lat: 38.87, lng: 115.48,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        tier: 1,
        note: '保定；清苑小城',
    },
    {
        id: 'city_hejian',
        name: '乐成',
        factionId: 'liwang',
        lat: 38.18, lng: 116.12,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        note: '乐成（乐寿）；窦建德夏国都（《旧唐书·窦建德传》）' },
    {
        id: 'city_jingzhou2',
        name: '蓨城',
        factionId: 'gaoqi_d',
        lat: 37.68, lng: 116.27,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        note: '渤海蓨县；北齐神武帝高欢故里（《北齐书·神武帝纪》）' },
    {
        id: 'city_pingyuan',
        name: '平原',
        factionId: 'pingyuan',
        lat: 37.16, lng: 116.43,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        note: '平原；高唐小城',
    },
        // ── 京同山川走廊 (北京→大同 的中城) ──
    // ── 晋陕走廊/汾河谷地 (大同→长安 的中城) ──
    { id: 'city_linfen', name: '平阳', factionId: 'yao', lat: 36.088, lng: 111.516724, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '尧都平阳（临汾）；距曲沃≥50km' },
    // ── 太行山脉走廊/八陉周边中城 ──
                // ── 淮海与齐鲁中原走廊中城 ──
    { id: 'city_shangqiu', name: '商丘', factionId: 'liang_d', lat: 34.41, lng: 115.66, type: 'medium_city', region: 'CENTRAL', troops: 10000, tier: 1, note: '宋/梁国都、归德府治；豫东府城' },
    { id: 'city_pengcheng', name: '彭城', factionId: 'xichu', lat: 34.27, lng: 117.18, type: 'medium_city', region: 'CENTRAL', troops: 10000, tier: 1, note: '西楚都、徐州治；淮海枢纽' },
    { id: 'city_langya', name: '琅琊', factionId: 'wang_d', lat: 35.077231, lng: 118.363953, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '琅琊；王氏小城',
    },
    { id: 'city_ju', name: '莒城', factionId: 'chimei', lat: 35.578, lng: 118.832, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '莒城；赤眉小城',
    },
    { id: 'city_lanling', name: '兰陵', factionId: 'xiao_d', lat: 34.798005, lng: 117.647095, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '兰陵；萧氏小城',
    },
    // ── 齐鲁古国与半岛走廊中城 ──
    { id: 'city_dingtao', name: '定陶', factionId: 'wazhai', lat: 35.200716, lng: 115.471802, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '定陶；瓦岗小城',
    },
    { id: 'city_jimo', name: '即墨', factionId: 'jiaodong', lat: 36.403591, lng: 120.445862, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '即墨；胶东小城',
    },
    {
        id: 'city_boyang',
        name: '博阳',
        factionId: 'jibei',
        lat: 36.15, lng: 117.05,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 10000,
        note: '博阳；济北小城',
    },

    {
        id: 'city_licheng',
        name: '历下',
        factionId: 'jinan',
        lat: 36.67, lng: 117,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '历下；济南治所/重镇',
    },
    {
        id: 'city_linzi',
        name: '临淄',
        factionId: 'qi',
        lat: 36.88, lng: 118.43,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '临淄；齐国治所/重镇',
    },
    // ── 岭南、东南与西南地区中城 ──
    {
        id: 'city_bushan',
        name: '布山',
        factionId: 'xiou',
        lat: 23.1, lng: 109.6,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 10000,
        note: '布山；西瓯小城',
    },
    {
        id: 'city_fuzhou',
        name: '冶城',
        factionId: 'min',
        lat: 26.07, lng: 119.3,
        type: 'medium_city',
        region: 'JIANGNAN',
        troops: 10000,
        tier: 1,
        note: '闽国都城故地（史籍亦称长乐府）；番号长乐控鹤，据点名避重改冶城' },
    // ── 淮河流域与中原周边中城 ──
    
    { id: 'city_huaiyang', name: '宛丘', factionId: 'huaiyang', lat: 33.63, lng: 114.7, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '宛丘；淮阳小城',
    },
    { id: 'city_shunchang', name: '顺昌', factionId: 'yingzhou_d', lat: 32.9, lng: 115.81, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '顺昌；颍州小城',
    },
    { id: 'city_qiaojun', name: '谯县', factionId: 'cao_d', lat: 33.88, lng: 115.77, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '谯县；曹氏小城',
    },



    { id: 'city_hefei', name: '合肥', factionId: 'lu', lat: 31.82, lng: 117.23, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 1, note: '庐州府治；江淮要冲' },
    {
        id: 'city_yangzhou',
        name: '广陵',
        factionId: 'yang_zhou',
        lat: 32.393, lng: 119.42,
        type: 'medium_city',
        region: 'JIANGNAN', troops: 10000,
        tier: 1, note: '杨行密吴国都城；黑云长剑都T1' },

    { id: 'city_nanyang', name: '宛城', factionId: 'dixiang', lat: 32.955682, lng: 112.516479, type: 'medium_city', region: 'CENTRAL', troops: 10000, note: '刘縯战死于宛；汉南都，东汉南阳郡240万，2026-06-18 升为中城' },
    // ── 荆楚与三峡巴蜀沿线中城 ──
    {
        id: 'city_fuling',
        name: '涪陵',
        factionId: 'fu_zhou',
        lat: 29.7, lng: 107.39,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000, note: '涪州治所；《华阳国志》涪陵劲卒' },
    { id: 'city_yiling', name: '夷陵', factionId: 'yidou', lat: 30.7, lng: 111.28, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '夷陵；宜都小城',
    },

    {
        id: 'city_ying',
        name: '金鳞',
        factionId: 'chu',
        lat: 30.35, lng: 112.18,
        type: 'medium_city',
        region: 'JIANGNAN', 
        troops: 10000,
        tier: 1,
        note: '金鳞；江陵治所/重镇',
    },


    {
        id: 'city_suizhou',
        name: '汉东',
        factionId: 'sui',
        lat: 31.71, lng: 113.36,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 10000,
        note: '汉东；隋国小城',
    },

    {
        id: 'city_chaisang',
        name: '柴桑',
        factionId: 'jiujiang',
        lat: 29.6802,
        lng: 115.9964,
        type: 'small_city',
        troops: 10000,
        
        note: '柴桑；柴桑小城', region: 'JIANGNAN' },
    { id: 'city_changsha', name: '临湘', factionId: 'changshaguo', lat: 28.19, lng: 112.97, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 1, note: '马楚政权都城；武平军' },

    {
        id: 'city_changzhou',
        name: '延陵',
        factionId: 'zhangshicheng',
        lat: 31.78, lng: 119.97,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 10000,
        note: '延陵；大周小城',
    },
    {
        id: 'city_gusu',
        name: '阊门',
        factionId: 'wu',
        lat: 31.3, lng: 120.62,
        type: 'medium_city',
        region: 'JIANGNAN',
        troops: 10000,
        tier: 1,
        note: '阊门；吴国治所/重镇',
    },
    {
        id: 'city_jiaxing',
        name: '嘉兴',
        factionId: 'qian_d',
        lat: 30.75, lng: 120.76,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 10000,
        note: '嘉兴；钱氏小城',
    },
    { id: 'city_shanxian', name: '剡城', factionId: 'qiufu', lat: 29.556746, lng: 120.822144, type: 'small_city', region: 'JIANGNAN', troops: 10000, mirror: true,
        note: '剡城；裘甫小城',
    },

    // ── 陇右与河西走廊中城 ──
    {
        id: 'city_tianshui',
        name: '天水',
        factionId: 'qin',
        lat: 34.58, lng: 105.73,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '天水；秦国治所/重镇',
    },
    { id: 'city_longzhou', name: '汧源', factionId: 'long2', lat: 34.89, lng: 106.86, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '汧源；陇州小城',
    },
    { id: 'city_longxi', name: '陇西', factionId: 'li_lx_d', lat: 35.032229, lng: 104.587097, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '陇西；李氏小城',
    },
    {
        id: 'city_wuwei',
        name: '姑臧',
        factionId: 'liangzhou',
        lat: 37.93, lng: 102.64,
        type: 'big_city',
        troops: 20000,
        region: 'HEXI', 
        tier: 0,
        note: '姑臧；五凉故都',
    },
    {
        id: 'city_zhangye',
        name: '张掖',
        factionId: 'ganzhou',
        lat: 38.93, lng: 100.45,
        type: 'small_city',
        region: 'HEXI',
        troops: 10000,
        tier: 1,
        note: '张掖；甘州小城',
    },
    { id: 'city_jiuquan', name: '酒泉', factionId: 'suzhou', lat: 39.73, lng: 98.49, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '酒泉；肃州小城',
    },


    // ── 塞北与西域中城 ──
    { id: 'city_zhizhicheng', name: '郅支城', factionId: 'xijue', lat: 42.906205, lng: 72.765198, type: 'pass', region: 'CENTRAL_ASIA', troops: 10000,
        note: '郅支城；十箭关隘',
    },
    { id: 'city_chigucheng', name: '赤谷城', factionId: 'wusun', lat: 42.153304, lng: 77.585449, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '赤谷城；乌孙小城',
    },
    { id: 'city_guishancheng', name: '贵山城', factionId: 'dayuan', lat: 41.290174, lng: 71.666565, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '贵山城；大宛小城',
    },

    {
        id: 'city_loulan',
        name: '扜泥城',
        factionId: 'shanshan',
        lat: 40.5158, lng: 89.92,
        type: 'small_city',
        region: 'WESTERN',
        troops: 10000,
        tier: 1,
        note: '楼兰/鄯善故城（罗布泊西）；楼兰旗号迁精绝' },
    {
        id: 'city_shache',
        name: '渠莎',
        factionId: 'shache',
        lat: 38.41, lng: 77.24,
        type: 'small_city',
        region: 'WESTERN',
        troops: 10000,
        note: '莎车国都；≠西夜叶城' },
    { id: 'city_shule', name: '盘橐', factionId: 'shule', lat: 39.485, lng: 76.0007, type: 'medium_city', troops: 10000,        region: 'WESTERN', tier: 1,
        note: '盘橐；疏勒治所/重镇',
    },

    { id: 'city_yanqi', name: '员渠城', factionId: 'yanqi', lat: 42.06, lng: 86.56, type: 'small_city', region: 'WESTERN', troops: 10000,
        note: '员渠城；焉耆小城',
    },

    {
        id: 'city_dunhuang',
        name: '敦煌',
        factionId: 'shazhou',
        lat: 40.14, lng: 94.66,
        type: 'small_city',
        region: 'HEXI',
        troops: 10000,
        tier: 1,
        note: '敦煌；沙州小城',
    },
    { id: 'city_lanzhou', name: '皋兰', factionId: 'lanzhou', lat: 36.05, lng: 103.8333, type: 'medium_city', region: 'HEXI', troops: 10000, tier: 1, note: '金城郡·兰州治所；赵充国屯田金城' },

    { id: 'city_ledu', name: '浇河', factionId: 'tuyu_d', lat: 35.837926, lng: 101.071472, type: 'small_city', region: 'TIBET', troops: 10000, note: '浇河故地；吐谷浑南界据地（王都伏俟城为隋西海郡）' },
    {
        id: 'city_lintao',
        name: '临洮',
        factionId: 'didao',
        lat: 35.37, lng: 103.86,
        type: 'small_city',
        region: 'HEXI',
        troops: 10000,
        note: '陇西临洮，汉置狄道县；古名狄道，今临洮' },
    { id: 'city_songzhou', name: '嘉诚', factionId: 'song2', lat: 32.787239, lng: 103.625793, type: 'small_city', troops: 10000, 
        note: '嘉诚；松州小城', region: 'TIBET' /* [override] 川西藏羌区, 松潘县 */ },
    { id: 'city_jianchang', name: '邛都', factionId: 'qiong', lat: 27.870652, lng: 102.310181, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '任贵自立邛谷王' },

    { id: 'city_toumancheng', name: '头曼城', factionId: 'xiongnu', lat: 41.302589, lng: 108.50647, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '头曼城；匈奴小城',
    },

    { id: 'city_guangnan', name: '广南', factionId: 'gouding', lat: 23.75526, lng: 105.386353, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '广南；句町小城',
    },    
    { id: 'city_liaoyang', name: '襄平', factionId: 'gongsun_d', lat: 41.27, lng: 123.17, type: 'small_city', region: 'NORTH', troops: 10000, note: '公孙度辽东治所；辽东铁骑' },

    {
        id: 'city_chaoyang',
        name: '朝阳',
        factionId: 'yingzhou_ying_d',
        lat: 41.57, lng: 120.45,
        type: 'small_city', region: 'NORTHEAST',
        troops: 10000,
        note: '慕容皝龙城为都棘城大破石赵' },
    {
        id: 'city_jicheng',
        name: '棘城',
        factionId: 'murong',
        lat: 41.58, lng: 121.055,
        type: 'small_city',
        region: 'STEPPE',
        troops: 10000,
        note: '昌黎棘城；前燕/后燕龙城南移前重镇；慕容恪龙城甲骑标志地' },
    {
        id: 'city_bailangshan',
        name: '白狼山',
        factionId: 'wuhuan',
        lat: 41.4, lng: 119.64,
        type: 'pass',
        region: 'STEPPE',
        troops: 10000,
        note: '白狼山；乌桓关隘',
    },

    { id: 'city_chifeng', name: '木叶山', factionId: 'qidan', lat: 42.7188, lng: 120.726013, type: 'pass', region: 'STEPPE', troops: 10000, note: '耶律阿保机木叶山会盟统铁林军' },
    {
        id: 'city_jiangsheng',
        name: '降圣',
        factionId: 'yel',
        lat: 42.561,
        lng: 119.4818,
        type: 'small_city',
        region: 'STEPPE',
        troops: 10000,
        note: '降圣；耶律小城',
    },
    {
        id: 'city_linhuang',
        name: '临潢府',
        factionId: 'liao_d',
        lat: 43.96, lng: 119.38,
        type: 'medium_city',
        troops: 10000,
        tier: 1,
        region: 'STEPPE',
        note: '辽上京临潢府（今巴林左旗）；皮室军辽太祖直属精锐' },
    { id: 'city_hezhang', name: '可乐城', factionId: 'miao', lat: 27.095807, lng: 104.718933, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '水西土司苗兵据点' },
    { id: 'city_tancheng', name: '郯城', factionId: 'dongxian', lat: 34.549568, lng: 118.317261, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '郯城；海西小城',
    },
    { id: 'city_qucheng', name: '朐城', factionId: 'mi', lat: 34.5292, lng: 119.132996, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '朐城；糜小城',
    },
        { id: 'city_baibogu', name: '白波谷', factionId: 'baibo', lat: 36.135621, lng: 112.206116, type: 'pass', region: 'HEXI', troops: 10000,
        note: '白波谷；黄巾关隘',
    },
    { id: 'city_baoshan', name: '永昌', factionId: 'ailao', lat: 25.11, lng: 99.16, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '永昌；哀牢小城',
    },

    {
        id: 'city_guoneicheng',
        name: '国内城',
        factionId: 'xuantu',
        lat: 41.13, lng: 126.19,
        type: 'small_city',
        region: 'KOREA', troops: 10000,
        tier: 1,
        note: '高句丽早期都城；汉代玄菟郡高句县渊源；旗号玄菟（2026-06-11）' },
    {
        id: 'city_fuyu',
        name: '黄龙府',
        factionId: 'fuyu',
        lat: 44.4278, lng: 125.1758,
        type: 'medium_city',
        region: 'NORTHEAST',
        troops: 10000,
        note: '黄龙府；夫余治所/重镇',
    },
    
    {
        id: 'city_wuling',
        name: '武陵',
        factionId: 'zhongxiang',
        lat: 29.03, lng: 111.69,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '常德武陵；钟相起义据地，提出等贵贱均贫富' },
    // ── 2026-05-25 唐朝势力新增据点 ──

];

// ============================================================
// T2 关隘/要塞/渡口/港口 — 待添加
// ============================================================
export const T2_STRATEGIC: CityDataV2[] = [
    // ── 蜀道沿线关隘 (长安→成都) ──
    {
        id: 'city_dasanguan',
        name: '大散关',
        factionId: 'fengzhou',
        lat: 34.28, lng: 106.95,
        type: 'pass',
        region: 'CENTRAL',
        troops: 10000,
        tier: 2,
        note: '大散关；凤州关隘',
    },
    { id: 'city_dusong', name: '独松关', factionId: 'shenshi', lat: 30.566952, lng: 119.679565, type: 'pass', region: 'JIANGNAN', troops: 10000, mirror: true,
        note: '独松关；吴兴沈氏关隘',
    },//镜像
    { id: 'city_xianxia', name: '仙霞关', factionId: 'huangwang', lat: 28.35, lng: 118.51, type: 'pass', region: 'JIANGNAN', troops: 10000, tier: 2,
        note: '仙霞关；黄王关隘',
    },
    { id: 'city_wuzhou', name: '金华', factionId: 'lujian', lat: 29.08, lng: 119.65, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '金华；鲁监小城',
    },
    { id: 'city_quzhou', name: '信安', factionId: 'gumie', lat: 28.96, lng: 118.87, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '信安；姑蔑小城',
    },
    { id: 'city_raozhou', name: '鄱阳', factionId: 'linshihong', lat: 28.99, lng: 116.66, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '鄱阳；楚南小城',
    },

    
    { id: 'city_qianzhou', name: '南康', factionId: 'dayu', lat: 25.8509, lng: 114.93, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '南康；大庾小城',
    },

    {
        id: 'city_jianmenguan',
        name: '剑门关',
        factionId: 'lizhou_d',
        lat: 32.3, lng: 105.53,
        type: 'pass',
        region: 'BASHU',
        troops: 10000,
        tier: 2,
        note: '剑门关；剑州关隘',
    },
    //── 子午道秦岭关隘 ──
    { id: 'city_ziwu', name: '子午谷', factionId: 'dashun', lat: 33.31223, lng: 108.124695, type: 'pass', region: 'HEXI', troops: 10000, note: '崇祯九年高迎祥出子午谷被伏，李自成接掌闯营；大顺老营驻地' },
    { id: 'city_mianzhuguan', name: '鹿头关', factionId: 'chenghan', lat: 31.32549, lng: 104.172363, type: 'pass', region: 'BASHU', troops: 10000, tier: 2, note: '梓潼鹿头关；成汉李特入蜀要道' },

    // ── 崤函古道沿线关隘 ──
    { id: 'city_hanguguan', name: '函谷关', factionId: 'hongnong_jun', lat: 34.615131, lng: 110.915222, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true,
        note: '函谷关；弘农郡关隘',
    },
    { id: 'city_tongguan', name: '潼关', factionId: 'sunqin', lat: 34.54, lng: 110.29, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true, note: '孙传庭督标秦军潼关战死故地' },
    // ── 中原北线黄河走廊关隘 ──
    { id: 'city_hulaoguan', name: '虎牢关', factionId: 'zhengzhou', lat: 34.81, lng: 113.17, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true,
        note: '虎牢关；郑州关隘',
    },
    // ── 洛阳周边防御关隘群 ──
    { id: 'city_guangchengguan', name: '广成关', factionId: 'ruzhou', lat: 34.139089, lng: 112.887268, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true,
        note: '广成关；汝州关隘',
    },
    
    // ── 京同山川走廊关隘 ──
    { id: 'city_juyongguan', name: '居庸关', factionId: 'you', lat: 40.28, lng: 116.06, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '居庸关；幽州关隘',
    },

    // ── 晋西北外三关及晋东北内长城关隘 ──
    { id: 'city_piantouguan', name: '偏头关', factionId: 'linhu', lat: 39.43, lng: 111.5, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '偏头关；林胡关隘',
    },
    { id: 'city_pingxingguan', name: '平型关', factionId: 'lingqiu', lat: 39.281169, lng: 113.744202, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '平型关；灵丘关隘',
    },
    { id: 'city_lingshiguan', name: '灵石关', factionId: 'huo', lat: 36.844462, lng: 111.796875, type: 'pass', region: 'NORTH', troops: 10000,
        note: '灵石关；霍国关隘',
    },
        // ── 关中盆地防御要塞群 ──
    { id: 'city_wuguan', name: '武关', factionId: 'ruo', lat: 33.6, lng: 110.62, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true,
        note: '武关；鄀国关隘',
    },


    { id: 'city_xiaoguan', name: '萧关', factionId: 'beidi', lat: 35.657289, lng: 106.32019, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true, note: '萧关道，河西北陆羌族重镇' },

    {
        id: 'city_jinsuoguan',
        name: '金锁关',
        factionId: 'yaozhou',
        lat: 35.19, lng: 109.11,
        type: 'pass',
        region: 'CENTRAL',
        troops: 10000,
        tier: 2,
        note: '金锁关；耀州关隘',
    },
    // ── 太行八陉防御要塞关隘群 ──
    { id: 'city_zhiguan', name: '野王', factionId: 'zhi_state', lat: 35.15, lng: 112.3, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true, note: '轵关/太行陉要隘；汉野王县治轵；旗号轵避§4.1防重' },
            {
        id: 'city_jingxingguan',
        name: '井陉关',
        factionId: 'xianyu',
        lat: 38.02, lng: 114,
        type: 'pass',
        region: 'NORTH',
        troops: 10000,
        tier: 2,
        note: '井陉关；鲜虞关隘',
    },
    { id: 'city_daomaguan', name: '倒马关', factionId: 'changshan', lat: 38.841851, lng: 114.807129, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '倒马关；常山关隘',
    },
    { id: 'city_feihu', name: '飞狐', factionId: 'wangyan', lat: 39.3487, lng: 114.6986, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '飞狐；太行小城',
    },
    { id: 'city_zijingguan', name: '紫荆关', factionId: 'yi', lat: 39.472238, lng: 115.265808, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '紫荆关；易州关隘',
    },
    // ── 辽东幽州走廊关隘 ──
    {
        id: 'city_shanhaiguan',
        name: '山海关',
        factionId: 'linyu',
        lat: 40, lng: 119.8,
        type: 'pass',
        region: 'NORTH',
        troops: 10000,
        tier: 2,
        note: '山海关；临榆关隘',
    },
    { id: 'city_wushengguan', name: '武胜关', factionId: 'yiyang_d', lat: 31.83, lng: 114.01, type: 'pass', region: 'JIANGNAN', mirror: true, 
        note: '武胜关；义阳关隘', troops: 10000 },
    // ── 齐鲁关隘 ──
    { id: 'city_mulingguan', name: '大岴', factionId: 'mushi', lat: 36.275259, lng: 118.660583, type: 'pass', region: 'CENTRAL', troops: 10000, note: '穆陵关齐长城要隘旧称大岴；旗号穆避§4.1防重' },
    { id: 'city_qingshiguan', name: '青石关', factionId: 'lai', lat: 36.246502, lng: 117.715759, type: 'pass', region: 'CENTRAL', troops: 10000,
        note: '青石关；莱州关隘',
    },
    {
        id: 'city_diaoyucheng',
        name: '钓鱼城',
        factionId: 'hezhou',
        lat: 30.04, lng: 106.3,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '钓鱼城；合州小城',
    },
    { id: 'city_diezhou', name: '合川', factionId: 'dangchang', lat: 33.975273, lng: 103.482971, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '合川；宕昌小城',
    },
    { id: 'city_panzhou', name: '茂名', factionId: 'gaoliang', lat: 33.578015, lng: 103.029785, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '茂名；高凉小城',
    },
    { id: 'city_maozhou', name: '汶川', factionId: 'qingqiang', lat: 31.693115, lng: 103.867493, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '汶川；青羌小城',
    },
    {
        id: 'city_qingyuan',
        name: '清远',
        factionId: 'chen',
        lat: 23.68, lng: 113.06,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 10000,
        note: '清远；陈国小城',
    },
    { id: 'city_gaoque', name: '高阙塞', factionId: 'baiyang', lat: 41.195202, lng: 107.166138, type: 'pass', region: 'HEXI', mirror: true, troops: 10000, tier: 2,
        note: '高阙塞；白羊关隘',
    },
    {
        id: 'city_hengpuguan',
        name: '横浦关',
        factionId: 'shixing',
        lat: 25.32, lng: 114.26,
        type: 'pass',
        region: 'LINGNAN',
        troops: 10000,
        tier: 2,
        note: '横浦关；石兴岭关隘',
    },
    {
        id: 'city_yangshanguan',
        name: '阳山关',
        factionId: 'paiyao',
        lat: 24.78, lng: 112.65,
        type: 'pass',
        region: 'LINGNAN',
        troops: 10000,
        mirror: true,
        tier: 2,
        note: '阳山关；排瑶关隘',
    },
    {
        id: 'city_huangxiguan',
        name: '湟溪关',
        factionId: 'yingzhou',
        lat: 24.16, lng: 113.38,
        type: 'pass',
        region: 'LINGNAN',
        troops: 10000,
        tier: 2,
        note: '湟溪关；英州关隘',
    },
    { id: 'city_yinzhou', name: '雕阴', factionId: 'liangshidu', lat: 37.796785, lng: 110.206604, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '雕阴；梁朔小城',
    },
    { id: 'city_dongshengzhou', name: '榆林', factionId: 'dongshengwei', lat: 39.810643, lng: 109.959412, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '榆林；东胜卫小城',
    },
    // ── 战略要塞/县级城镇 (移入的小城) ──
    {
        id: 'city_lueyang',
        name: '略阳',
        factionId: 'fushi',
        lat: 33.33, lng: 106.15,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '苻洪略阳氐故地；氐族劲卒T2' },
    { id: 'city_mianchi', name: '渑池', factionId: 'yangshao', lat: 34.76, lng: 111.76, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '渑池；仰韶小城',
    },

        {
        id: 'city_huaiyin',
        name: '淮安',
        factionId: 'sizhou',
        lat: 33.5, lng: 119.13,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 10000, note: '韩世忠故里；克敌军T1（泗州）' },
    {
        id: 'city_dangyang',
        name: '当阳',
        factionId: 'jingmen',
        lat: 30.82, lng: 111.79,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '当阳；荆门小城',
    },
        {
        id: 'city_zaoyang',
        name: '枣阳',
        factionId: 'zaoyang_d',
        lat: 32.13, lng: 112.75,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 10000,
        note: '枣阳军；孟珙统忠顺军抗蒙（《宋史·孟珙传》）' },

    { id: 'city_ruoqiang', name: '卡克里克', factionId: 'ruoqiang', lat: 38.987176, lng: 88.948059, type: 'small_city', region: 'WESTERN', troops: 10000, note: '婼羌部落全民皆兵' },
    {
        id: 'city_qiemo',
        name: '播仙',
        factionId: 'qiemo',
        lat: 38.14, lng: 85.53,
        type: 'small_city', region: 'WESTERN',
        troops: 10000, note: '唐安西四镇之且末镇驻军' },
    {
        id: 'city_jingjue',
        name: '精绝',
        factionId: 'loulan',
        lat: 37.06, lng: 82.69,
        type: 'small_city',
        region: 'WESTERN',
        troops: 10000,
        note: '汉西域精绝国；东汉都护府屯田戍边（索劼《汉官·西域传》）' },
    { id: 'city_pishan', name: '固玛', factionId: 'pishan', lat: 37.570718, lng: 78.250122, type: 'small_city', region: 'WESTERN', troops: 10000, note: '皮山国常备武装' },
        {
        id: 'city_weili',
        name: '库尔勒',
        factionId: 'weili',
        lat: 41.33, lng: 86.26,
        type: 'small_city', region: 'WESTERN',
        troops: 10000, note: '尉犁国王城驻军' },
    // 迪化 — 且弥清新都 (原庭州已删除)
    // 鹰娑川 — 土尔扈特 (天山尤鲁都斯/巴音布鲁克)
    { id: 'city_yingsuochuan', name: '鹰娑川', factionId: 'tuerhute', lat: 42.869899, lng: 83.773499, type: 'pass', region: 'WESTERN', troops: 10000,
        note: '鹰娑川；土尔扈特关隘',
    },
    // 沙图阿满 — 叛军 (清军哨卡)

    // 星星峡 — 叛军 (丝路关隘)
    { id: 'city_xingxingxia', name: '星星峡', factionId: 'xingxingxia', lat: 41.611382, lng: 95.267944, type: 'pass', region: 'HEXI', troops: 10000,
        note: '星星峡；星星峡关隘',
    },
    // 赤亭 — 叛军 (吐鲁番绿洲)
    { id: 'city_chiting', name: '赤亭关', factionId: 'gaochang', lat: 42.85, lng: 91.5, type: 'pass', region: 'WESTERN', troops: 10000,
        note: '赤亭关；高昌关隘',
    },

    {
        id: 'city_xiye',
        name: '叶城',
        factionId: 'xiye',
        lat: 37.884, lng: 77.43,
        type: 'small_city',
        region: 'WESTERN',
        troops: 10000,
        note: '西夜国都（漂沙）；≠莎车' },





    { id: 'city_xiuxun', name: '休循', factionId: 'khoja', lat: 39.709286, lng: 73.22937, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '休循；和卓小城',
    },
    { id: 'city_yinai', name: '英吉沙尔', factionId: 'yarkand', lat: 38.929502, lng: 76.225891, type: 'small_city', region: 'WESTERN', troops: 10000,
        note: '英吉沙尔；叶尔羌小城',
    },
    {
        id: 'city_yumenguan',
        name: '玉门关',
        factionId: 'guiyi',
        lat: 40.35, lng: 93.86,
        type: 'pass',
        region: 'HEXI',
        troops: 10000,
        tier: 2,
        note: '玉门关；归义关隘',
    },
    {
        id: 'city_yangguan',
        name: '阳关',
        factionId: 'yangguan',
        lat: 39.92, lng: 94.06,
        type: 'pass',
        region: 'HEXI',
        troops: 10000,
        tier: 2, 
        note: '阳关；敦煌关隘', mirror: true },
    { id: 'city_wuzhousai', name: '善无', factionId: 'wuzhou', lat: 39.998214, lng: 112.420349, type: 'pass', region: 'STEPPE', troops: 10000, mirror: true,
        note: '善无；武州关隘',
    },
    // ── 2026-06-18 新增：李靖@恶阳岭（贞观四年定襄夜袭）──
    { id: 'city_eyangling', name: '恶阳岭', factionId: 'dingxiang_d', lat: 39.91, lng: 111.65, type: 'pass', troops: 10000, region: 'NORTH', mirror: true, note: '贞观四年李靖三千骑出恶阳岭夜袭定襄城（《旧唐书·李靖传》）；清水河南缘，距盛乐≥50km' },
    { id: 'city_jilusai', name: '鸡鹿塞', factionId: 'weiming', lat: 40.807568, lng: 106.630554, type: 'pass', region: 'HEXI', troops: 10000, mirror: true, tier: 2,
        note: '鸡鹿塞；嵬名关隘',
    },
    {
        id: 'city_guyangsai',
        name: '固阳塞',
        factionId: 'wuyuan_d',
        lat: 41.1, lng: 110.08,
        type: 'pass',
        region: 'NORTH',
        troops: 10000,
        tier: 2,
        note: '五原郡北塞；秦汉防匈奴长城烽燧（陈龟《后汉书》度辽将军）' },
    {
        id: 'city_xiayangdu',
        name: '龙门',
        factionId: 'xiayang_d',
        lat: 35.6020, lng: 110.4520,
        type: 'pass',
        region: 'CENTRAL',
        troops: 10000,
        tier: 2,
        note: '黄河禹门口（龙门）险隘；河津韩城交界，冯翊夏阳故境；司马迁故里（《水经注》）；唐同州河东要冲' },
    // ── 战略渡口 ──
    {
        id: 'city_piaoyujin',
        name: '漂渝津',
        factionId: 'pinghai',
        lat: 39.02, lng: 117.60,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        tier: 2,
        note: '漂渝津；平海小城',
    },

    // ── 太行陉关隘 ──
    { id: 'city_tianjinguan', name: '天井关', factionId: 'xiongding', lat: 35.27, lng: 112.93, type: 'pass', region: 'CENTRAL', troops: 10000, mirror: true,
        note: '天井关；雄定关隘', } ];

// ============================================================
// 周边 — 待添加 (日本七道、朝鲜八道、各古政权首都)
// ============================================================
export const PERIPHERY: CityDataV2[] = [
    {
        id: 'city_dali_city',
        name: '羊苴咩',
        factionId: 'dali',
        lat: 25.6983,
        lng: 100.1488,
        type: 'medium_city',
        region: 'DIANQIAN',
        troops: 10000,
        tier: 1,
        note: '羊苴咩；大理治所/重镇',
    },

    // ── 2026-05-25 唐朝势力新增周边据点 ──
    { id: 'city_mengshe', name: '蒙舍城', factionId: 'nanzhao', lat: 25.058278, lng: 100.500183, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '蒙舍城；南诏小城',
    },
    {
        id: 'city_hanseong',
        name: '汉城',
        factionId: 'joseon',
        lat: 37.52, lng: 126.98,
        type: 'medium_city',
        troops: 10000,
        tier: 1,
        region: 'KOREA',
        note: '朝鲜王朝（李朝）都城汉阳/汉城' },
    { id: 'city_pyongyang', name: '平壤', factionId: 'gaogouli', lat: 39.02, lng: 125.76, type: 'medium_city', region: 'KOREA', troops: 10000, tier: 1, note: '高句丽中后期国都（427 年迁平壤城）' },

    {
        id: 'city_kaesong',
        name: '开城',
        factionId: 'goryeo',
        lat: 37.97, lng: 126.55,
        type: 'medium_city',
        troops: 20000,
        tier: 1,
        
        note: '开城；高丽治所/重镇', region: 'KOREA' },
    { id: 'city_hamhung', name: '咸兴', factionId: 'woju', lat: 39.968685, lng: 127.499084, type: 'small_city', troops: 10000, 
        note: '咸兴；沃沮小城', region: 'KOREA' },
    {
        id: 'city_longer',
        name: '笼耳',
        factionId: 'jingcheng_d',
        lat: 40.967, lng: 129.551,
        type: 'small_city',
        troops: 10000,
        region: 'KOREA',
        note: '镜城兵马使统镜城边军防女真' },
    {
        id: 'city_guoyuancheng',
        name: '国原城',
        factionId: 'chungju_d',
        lat: 36.991, lng: 127.926,
        type: 'small_city',
        troops: 10000,
        region: 'KOREA',
        note: '忠州牧治所；古称国原城、大原城、薮原城、中原京；无政权定都' },
    {
        id: 'city_geumseong',
        name: '锦城',
        factionId: 'naju_d',
        lat: 35.015, lng: 126.71,
        type: 'small_city',
        troops: 10000,
        region: 'KOREA',
        note: '罗州牧治所（全罗南道）；古称发罗郡、通义县；无政权定都' },
    {
        id: 'city_jeonju',
        name: '完山',
        factionId: 'zhen',
        lat: 35.75, lng: 127.14,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        
        note: '完山；后百济小城', region: 'KOREA' },
    {
        id: 'city_jindo',
        name: '鸣梁',
        factionId: 'sambyeol',
        lat: 34.487, lng: 126.263,
        type: 'pass',
        troops: 10000,
        tier: 4,
        region: 'KOREA',
        note: '高丽三别抄抗蒙根据地（1232 裴仲孙）' },
    {
        id: 'city_suncheon_k',
        name: '顺天',
        factionId: 'sheng_d',
        lat: 34.9652, lng: 127.4991,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        region: 'KOREA',
        note: '高丽成宗升州牧治所；古称升州；壬辰倭乱水军重镇' },
    {
        id: 'city_gimhae',
        name: '金海',
        factionId: 'gaya',
        lat: 35.23, lng: 128.88,
        type: 'small_city',
        troops: 10000,
        tier: 4,
         
        note: '金海；伽倻小城', region: 'KOREA' },
    { id: 'city_jincheng_silla', name: '金城', factionId: 'xinluo', lat: 35.808912, lng: 129.210205, type: 'big_city', region: 'KOREA', troops: 20000, tier: 0,
        note: '新罗金城王都',
    }, // [2026-05-30] 升 big_city: 新罗 57BC-935AD = 992 年首都
        {
        id: 'city_haeju',
        name: '朐山',
        factionId: 'hai2',
        lat: 38.03, lng: 125.71,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        
        note: '朐山；瀑池小城', region: 'KOREA' },
    {
        id: 'city_longwan',
        name: '龙湾',
        factionId: 'xingliao',
        lat: 40.1967, lng: 124.5306,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        
        note: '龙湾；兴辽小城', region: 'KOREA' },
    // === 第三批新增据点 ===
    {
        id: 'city_fuhan',
        name: '枹罕',
        factionId: 'qifu_d',
        lat: 35.6, lng: 103.21,
        type: 'small_city',
        region: 'TIBET',
        troops: 10000,
        note: '枹罕；乞伏小城',
    },
    // ---- 从 CITIES_LEGACY 迁移的城市 ----
    { id: 'city_qishan', name: '岐山', factionId: 'zhou', lat: 34.506539, lng: 107.487488, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '岐山；周国小城',
    },
    { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', lat: 38.024286, lng: 109.14917, type: 'small_city', region: 'HEXI', troops: 10000, note: '大夏都城遗址；峰值人口未达中城门槛，2026-06-12 降级' },

    { id: 'city_qiuchi', name: '仇池', factionId: 'qiuchi', lat: 33.86, lng: 105.3, type: 'pass', region: 'HEXI', troops: 10000,
        note: '仇池；杨氏小城',
    },
    { id: 'city_daixian', name: '广武', factionId: 'dai_d', lat: 39.842285, lng: 114.408875, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '广武；代国小城',
    },
    {
        id: 'city_ningan',
        name: '龙泉府',
        factionId: 'bohai',
        lat: 44.128997,
        lng: 129.295349,
        type: 'medium_city',
        troops: 20000,
        tier: 1,
        
        note: '龙泉府；渤海治所/重镇', region: 'NORTHEAST' },

    { id: 'city_yalu', name: '鸭绿府', factionId: 'luzhou', lat: 41.81, lng: 126.91, type: 'small_city', region: 'KOREA', troops: 10000,
        note: '鸭绿府；渌州小城',
    },
    { id: 'city_jilishan', name: '蒺藜山', factionId: 'yizhou', lat: 42.25, lng: 121.8, type: 'pass', troops: 10000, 
        note: '蒺藜山；懿州关隘', region: 'NORTHEAST' },

    // ── 2026-05-26 新建势力：大金(会宁府)、大元(上都) ──
    { id: 'city_huining', name: '会宁府', factionId: 'dajin', lat: 45.519798, lng: 126.971741, type: 'medium_city', region: 'NORTHEAST', troops: 10000, tier: 1, note: '大金政权都城；合扎猛安' },
    { id: 'city_shangdu', name: '上都', factionId: 'yuan_d', lat: 42.275283, lng: 115.760193, type: 'medium_city', region: 'STEPPE', troops: 10000, tier: 1, note: '大元夏都；秃鲁花军' },


    // 额尔古纳已删：室韦都城为俱轮泊 city_julunbo
    { id: 'city_hetuala', name: '赫图阿拉', factionId: 'aisin_d', lat: 41.715981, lng: 125.032654, type: 'small_city', region: 'NORTHEAST', troops: 10000, tier: 1, note: '爱新觉罗氏兴起地；≠大清皇朝旗号' },
    { id: 'city_wuguo', name: '五国城', factionId: 'jurchen', lat: 46.32, lng: 129.56, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '五国城；女真小城',
    },
    
    { id: 'city_yanran', name: '燕然山', factionId: 'pugu', lat: 46.276728, lng: 102.801819, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '燕然山；仆骨关隘',
    },
    { id: 'city_langjuxu', name: '狼居胥山', factionId: 'mengwu', lat: 47.687578, lng: 108.528442, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '狼居胥山；蒙兀关隘',
    },
    {
        id: 'city_luoxie',
        name: '逻些',
        factionId: 'tubo',
        lat: 29.65,
        lng: 91.1,
        type: 'big_city',
        region: 'TIBET',
        troops: 20000,
        tier: 0, note: '南唐李昪建都金陵（建业）；神武军T1' },


    { id: 'city_guanglu', name: '光禄城', factionId: 'shatuo', lat: 41.9, lng: 108.2, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '光禄城；沙陀小城',
    },
    { id: 'city_yanran_stone', name: '燕然勒石', factionId: 'xueyantuo', lat: 45.203318, lng: 104.677734, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '燕然勒石；薛延陀小城',
    },
    { id: 'city_luhun', name: '涿邪山', factionId: 'jiluo_d', lat: 43.58829, lng: 104.661255, type: 'pass', region: 'STEPPE', troops: 10000, note: '汉匈漠北分界；窦宪出涿邪山破北匈奴（《后汉书·窦宪传》）' },
    { id: 'city_chilechuan', name: '云中', factionId: 'chile', lat: 40.591029, lng: 110.044556, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '云中；敕勒小城',
    },
    { id: 'city_lanshi', name: '蓝氏城', factionId: 'guishuang', lat: 36.71248, lng: 67.08252, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, note: '大夏故都，城市之母，鼎盛人口20万，2026-06-18 升为中城' },

    { id: 'city_sabi', name: '泗沘', factionId: 'baiji', lat: 36.255354, lng: 126.949768, type: 'medium_city', region: 'KOREA', troops: 10000,
        note: '泗沘；百济治所/重镇',
    },
    
    { id: 'city_edo', name: '江户城', factionId: 'edo', lat: 35.68, lng: 139.76, type: 'big_city', region: 'JAPAN', troops: 20000,
        note: '江户城；德川幕府治所',
    }, // [2026-05-30] 升 big_city: 江户幕府 264 年 + 1700 年代百万人口世界第一

    {
        id: 'city_kyoto',
        name: '京都',
        factionId: 'ashikaga',
        lat: 35.01,
        lng: 135.77,
        type: 'medium_city',
        troops: 20000,
        tier: 1,
        region: 'JAPAN',
        note: '室町幕府足利将军治所' },
    { id: 'city_tainan', name: '承天', factionId: 'ming_zheng', lat: 22.99, lng: 120.2, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 1, note: '明郑政权都城；郑氏铁人军' },
    { id: 'city_weirong', name: '威戎', factionId: 'quanrong', lat: 35.585841, lng: 105.512695, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '威戎；犬戎小城',
    },
    { id: 'city_xingtai', name: '邢台', factionId: 'shizhao_d', lat: 37.08, lng: 114.48, type: 'small_city', region: 'NORTH', troops: 10000, note: '襄国，后赵石勒都城' },
    { id: 'city_shengle', name: '盛乐', factionId: 'yunzhong', lat: 40.38, lng: 111.82, type: 'small_city', region: 'NORTH', troops: 10000, note: '北魏前期都城；峰值人口未达中城门槛，2026-06-12 降级' },
    
    { id: 'city_izumo', name: '月山富田', factionId: 'izumo', lat: 35.377853, lng: 133.148804, type: 'pass', troops: 10000, region: 'JAPAN', note: '出云国月山富田城；尼子氏（新宫党）' },
    { id: 'city_satsuma', name: '鹿儿岛城', factionId: 'satsuma', lat: 31.6003, lng: 130.5583, type: 'small_city', region: 'JAPAN', troops: 10000, note: '萨摩国鹿儿岛城；岛津氏（隼人众）' },
    // // [DATA LOST - emishi deleted]
    { id: 'city_shuri', name: '首里', factionId: 'ryukyu', lat: 26.22, lng: 127.72, type: 'small_city', region: 'LINGNAN', troops: 10000, tier: 1, note: '琉球王国都城；那霸水师' },
    { id: 'city_tsushima', name: '金石城', factionId: 'so', lat: 34.2031, lng: 129.2892, type: 'small_city', troops: 10000, 
        note: '金石城；对马小城', region: 'JAPAN' },
    { id: 'city_yoshida', name: '吉田郡山', factionId: 'aki', lat: 34.438616, lng: 132.530823, type: 'pass', troops: 10000, 
        note: '吉田郡山；安艺关隘', region: 'JAPAN' },
    { id: 'city_kasugayama', name: '春日山', factionId: 'echigo', lat: 37.16, lng: 138.24, type: 'pass', troops: 10000, region: 'JAPAN', note: '越后国春日山城；上杉氏（轩猿众）' },
    { id: 'city_tsutsujigasaki', name: '躑躅崎馆', factionId: 'kai', lat: 35.6688, lng: 138.4991, type: 'small_city', region: 'JAPAN', troops: 10000,
        note: '躑躅崎馆；甲斐小城',
    },
    { id: 'city_okafu', name: '冈丰城', factionId: 'chosokabe', lat: 33.5972, lng: 133.5756, type: 'pass', region: 'JAPAN', troops: 10000, note: '土佐国冈丰城；长宗我部氏（一领具足）' },
    { id: 'city_himeji', name: '姬路城', factionId: 'hashiba', lat: 34.8394, lng: 134.6939, type: 'small_city', region: 'JAPAN', troops: 10000,
        note: '姬路城；丰臣小城',
    },
    { id: 'city_utsunomiya', name: '宇都宫城', factionId: 'shimotsuke', lat: 36.604491, lng: 139.858704, type: 'small_city', region: 'JAPAN', troops: 10000, note: '下野国宇都宫城；宇都宫氏' },
    { id: 'city_tsuruga', name: '鹤之城', factionId: 'aizu', lat: 37.4878, lng: 139.9297, type: 'small_city', region: 'JAPAN', troops: 10000,
        note: '鹤之城；会津小城',
    },
    // ── 2026-06-11 日本精锐：北条@小田原、伊贺@名张（恶党/千早城距飞鸟宫旧址3km）──
    { id: 'city_nabari', name: '名张', factionId: 'iga_d', lat: 34.627, lng: 136.108, type: 'small_city', region: 'JAPAN', troops: 10000, note: '伊贺国名张郡；伊贺众锚点（2026-06-17 主人裁定：必须名张；上野虽名气更大但与京都<50km，删小留大留京都）' },
    // ── 2026-06-16 新增：日本令制国补点（方案A·6城）──
    { id: 'city_jianghu', name: '金泽', factionId: 'kaga_d', lat: 36.56, lng: 136.65, type: 'small_city', region: 'JAPAN', troops: 10000, note: '加贺国府江沼；加贺一向一揆故地（国府旧称，名气大于江户期金泽城）' },
    { id: 'city_xiantai', name: '仙台', factionId: 'date_d', lat: 38.27, lng: 140.87, type: 'small_city', region: 'JAPAN', troops: 10000, note: '陆前国仙台平；伊达氏居城（古代地名，非江户城专名）' },
    { id: 'city_xiongben', name: '熊本', factionId: 'higo_d', lat: 32.81, lng: 130.71, type: 'medium_city', region: 'JAPAN', troops: 10000, note: '肥后国熊本；菊池氏故地；江户期人口破10万，2026-06-18 升为中城' },
    { id: 'city_songshan', name: '松山', factionId: 'iyo_d', lat: 33.84, lng: 132.77, type: 'small_city', region: 'JAPAN', troops: 10000, note: '伊予国松山；河野氏水军根据地（古代地名）' },
    { id: 'city_funei', name: '府内', factionId: 'otomo_d', lat: 33.24, lng: 131.61, type: 'small_city', region: 'JAPAN', troops: 10000, note: '丰后国府内；大友氏九州据地（府内为大友氏居城旧称）' },
    { id: 'city_gaodao', name: '高岛', factionId: 'suwa_d', lat: 36.0138, lng: 137.9662, type: 'small_city', region: 'JAPAN', troops: 10000, note: '信浓国诹访郡高岛；诹访氏中世本据（考据138.0515°E；与躑躅崎馆<50km，经度西移约7.7km）' },
    { id: 'city_shangdang', name: '长子', factionId: 'xin', lat: 36.148974, lng: 113.008118, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '长子；新国小城',
    },

    { id: 'city_fanyang', name: '范阳', factionId: 'zhuozhou', lat: 39.48, lng: 115.98, type: 'medium_city', region: 'NORTH', troops: 10000, note: '安禄山范阳节度使根基；安史叛军' },
    { id: 'city_hedong', name: '安邑', factionId: 'xiezhou', lat: 35.072716, lng: 111.033325, type: 'medium_city', region: 'CENTRAL', troops: 10000, note: '夏禹之都（《史记·夏本纪》）；阳城过近洛阳已删' },
    { id: 'city_chenjun', name: '新蔡', factionId: 'cai', lat: 32.75, lng: 114.98, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '新蔡；蔡国小城',
    },

    { id: 'city_qufu', name: '曲阜', factionId: 'kong_d', lat: 35.6, lng: 116.98, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '曲阜；孔氏小城',
    },

        

    { id: 'city_fusicheng', name: '伏俟城', factionId: 'xihai_d', lat: 36.76089, lng: 99.742126, type: 'small_city', region: 'TIBET', troops: 10000, note: '吐谷浑王都；大业五年隋置西海郡治（《隋书·吐谷浑传》）' },
    {
        id: 'city_xianglin',
        name: '象林',
        factionId: 'linyi',
        lat: 15, lng: 108.5,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 10000,
        note: '象林；林邑小城',
    },
    // ── 2026-05-25 新增：秦朝核对追加势力城市 ──
    {
        id: 'city_lushi',
        name: '陆浑关',
        factionId: 'yun',
        lat: 34.05, lng: 111.05,
        type: 'pass',
        region: 'CENTRAL',
        troops: 10000,
        mirror: true,
        note: '陆浑关；允戎关隘',
    },//镜像
    
    {
        id: 'city_puyang',
        name: '濮阳',
        factionId: 'chanzhou',
        lat: 35.7621, lng: 115.0291,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 10000,
        tier: 1,
        note: '濮阳；澶州小城',
    },
    { id: 'city_xucheng', name: '符离', factionId: 'suzhou_d', lat: 33.65, lng: 116.97, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '宿州治境；符离古邑，唐宿州治所近此' },
    // ── 2026-05-25 新增：汉朝补全半成品势力城市 ──
    
    // ── 2026-05-25 新增：汉朝核对追加势力都城 ──
    {
        id: 'city_zhaoge',
        name: '朝歌',
        factionId: 'yin',
        lat: 35.6, lng: 114.18,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 10000,
        note: '朝歌；殷国小城',
    },
    { id: 'city_liuxian', name: '六安', factionId: 'liu', lat: 31.74, lng: 116.5, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '六安；九江小城',
    },
    

    // ── 2026-05-25 新增：三国核对追加势力都城 ──
    {
        id: 'city_xiapi',
        name: '下邳',
        factionId: 'pizhou',
        lat: 33.888642,
        lng: 117.877808,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 10000,
        note: '徐国故都；淮泗徐夷核心；汉初楚都下邳；陷阵营成军地' },
    // ── 2026-05-25 新增：两晋核对追加势力城市 ──
    {
        id: 'city_xiurongchuan',
        name: '秀容川',
        factionId: 'erzhu',
        lat: 38.42, lng: 112.73,
        type: 'small_city',
        region: 'NORTH',
        troops: 10000,
        note: '秀容川；尔朱小城',
    },

    // ── 2026-05-25 新增：隋朝核对追加势力城市 ──
    
    
    
    

    { id: 'city_songmo', name: '马盂山', factionId: 'kumo', lat: 41.01735, lng: 118.699036, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '马盂山；奚族关隘',
    },

    {
        id: 'city_gaoliang',
        name: '高凉',
        factionId: 'xian_d',
        lat: 21.9, lng: 110.8,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 10000,
        note: '高凉；冼氏小城',
    },
    { id: 'city_beishacheng', name: '卑沙城', factionId: 'jilizhou', lat: 39.444692, lng: 121.959229, type: 'pass', region: 'NORTHEAST', troops: 10000, note: '辽东卑沙城；公孙氏辽东翼境' },
    // ── 2026-05-25 唐朝势力新增周边据点(续) ──
    {
        id: 'city_suiye',
        name: '屈耽',
        factionId: 'xiliao',
        lat: 42.8, lng: 75.2667,
        type: 'medium_city',
        troops: 10000,
        tier: 1,
        region: 'CENTRAL_ASIA',
        note: '碎叶/八剌沙衮故地（唐屈耽；喀喇契丹虎思斡耳朵）' },
    { id: 'city_nieduo', name: '孽多', factionId: 'nandou', lat: 35.92, lng: 74.3, type: 'small_city', region: 'TIBET', troops: 10000, note: '《汉书·西域传》难兜国王治；《新唐书·西域传》小勃律王居孽多城，高仙芝远征攻破处' },

    // ── 2026-05-26 更新：窝鲁朵八里→富贵城/拜巴里（色楞格河畔漠北回鹘陪都）──

    { id: 'city_woluduobali', name: '窝鲁朵八里', factionId: 'huige', lat: 47.8, lng: 107.5, type: 'medium_city', region: 'STEPPE', troops: 10000,
        note: '窝鲁朵八里；回纥治所/重镇',
    },
    
    { id: 'city_jinshan', name: '金山', factionId: 'huite', lat: 46.939014, lng: 89.598999, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '金山；辉特关隘',
    },
    { id: 'city_dafang', name: '大方城', factionId: 'luodian', lat: 27.04691, lng: 105.707703, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '大方城；罗甸小城',
    },
    { id: 'city_yongzhou', name: '晋兴', factionId: 'nongzhigao', lat: 22.81, lng: 108.31, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '侬智高破邕州建南天国' },

    {
        id: 'city_qingxi',
        name: '清溪',
        factionId: 'fangla',
        lat: 29.6, lng: 119.04,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        
        note: '清溪；圣公小城', region: 'JIANGNAN' },
    // ── 2026-05-25 北宋辽金势力 v2 ──
    {
        id: 'city_dengzhou',
        name: '蓬莱',
        factionId: 'yang_aner',
        lat: 37.82, lng: 120.72,
        type: 'small_city',
        troops: 10000,
        tier: 4,
        
        note: '蓬莱；天顺小城', region: 'NORTH' },
    { id: 'city_jiaoxi', name: '胶西', factionId: 'tongma', lat: 36.228777, lng: 119.924011, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '胶西；铜马小城',
    },

    // ── 2026-05-25 元朝蒙古势力新增城市 ──
    // 第一类：西征摧毁政权
    { id: 'city_urgench', name: '玉龙杰赤', factionId: 'huarazim', lat: 42.244805, lng: 59.631042, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 1,
        note: '玉龙杰赤；花剌子模治所/重镇',
    },
    { id: 'city_merv', name: '木鹿', factionId: 'seljuq', lat: 37.61641, lng: 62.234802, type: 'big_city', region: 'CENTRAL_ASIA', troops: 20000, note: '大塞尔柱都城马鲁/梅尔夫；史籍常称木鹿' },
    { id: 'city_pagan', name: '蒲甘', factionId: 'pagan', lat: 21.207449, lng: 94.894409, type: 'medium_city', troops: 20000, tier: 1, region: 'DIANQIAN', note: '蒲甘王朝都城；缅王战象' },
        // 第二类：四大汗国
    { id: 'city_almaliq', name: '弓月城', factionId: 'geluolu', lat: 43.979013, lng: 79.648132, type: 'small_city', region: 'STEPPE', troops: 10000, mirror: true,
        note: '弓月城；葛逻禄小城',
    },
    { id: 'city_emil', name: '也迷里', factionId: 'ogodei', lat: 46.481378, lng: 83.633423, type: 'small_city', region: 'STEPPE', troops: 10000, note: '草原环线锚点；环线所称也迷离即本据点' },
    // 第三类：蒙古草原部落
    { id: 'city_kereyid', name: '汪吉河', factionId: 'kereyid', lat: 46.600064, lng: 104.570618, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '汪吉河；克烈小城',
    },
    { id: 'city_naiman', name: '阿尔泰', factionId: 'ashina', lat: 47.64, lng: 88.29, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '阿尔泰；阿史那关隘',
    },
    { id: 'city_fuhai', name: '福海', factionId: 'naiman', lat: 47.03645, lng: 87.352295, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '福海；乃蛮小城',
    },
    { id: 'city_tatar', name: '哈拉哈河', factionId: 'tatar', lat: 47.182253, lng: 117.726746, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '哈拉哈河；塔塔尔小城',
    },

    { id: 'city_merkit', name: '色楞格河', factionId: 'merkit', lat: 50.264779, lng: 106.152649, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '色楞格河；蔑儿乞小城',
    },
    // 第四类：汉军世侯及元末军阀
    // 第五类：元末起义政权
    
    {
        id: 'city_xinhui', name: '新会', factionId: 'luoping',
        lat: 22.53, lng: 113.04, type: 'small_city', troops: 10000, tier: 4,
        
        note: '新会；罗平小城', region: 'LINGNAN' },
    {
        id: 'city_ninghai', name: '白峤', factionId: 'hu_d',
        lat: 29.2757, lng: 121.4182, type: 'small_city', troops: 10000, tier: 4,
        
        note: '白峤；胡氏小城', region: 'JIANGNAN' },
    {
        id: 'city_zhenghe', name: '政和', factionId: 'dacheng',
        lat: 27.37, lng: 118.86, type: 'small_city', troops: 10000, tier: 4,
        
        note: '政和；大成小城', region: 'LINGNAN' },
    {
        id: 'city_zhangzhou', name: '龙溪', factionId: 'chendiaoyan',
        lat: 24.51, lng: 117.65, type: 'small_city', troops: 10000,
        
        note: '龙溪；陈吊小城', region: 'LINGNAN' },
    { id: 'city_tingzhou', name: '黄连', factionId: 'kejia', lat: 26.863, lng: 116.637, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '唐黄连县故地（今宁化）；汀州客家祖地，非文天祥故里' },

    // ── 2026-05-25 明朝势力新增城市 ──
    // 第二类：元末群雄
    {
        id: 'city_qingyuan_zj', name: '庆元', factionId: 'fang_guozhen',
        lat: 29.87, lng: 121.54, type: 'small_city', troops: 10000, tier: 4,
        
        note: '庆元；浙方小城', region: 'JIANGNAN' },
    {
        id: 'city_taizhou_zj', name: '临海', factionId: 'ouyue',
        lat: 28.66, lng: 121.42, type: 'small_city', troops: 10000, tier: 4,
        
        note: '临海；瓯越小城', region: 'JIANGNAN' },
    {
        id: 'city_wenzhou', name: '永嘉', factionId: 'wenzhou',
        lat: 28, lng: 120.7, type: 'small_city', troops: 10000, tier: 4,
        
        note: '永嘉；温州小城', region: 'JIANGNAN' },

    // 第三类：农民起义

    {
        id: 'city_shaxian', name: '沙戍堡', factionId: 'dengmaoqi',
        lat: 26.4, lng: 117.79, type: 'pass', troops: 10000, tier: 4,
        
        note: '沙戍堡；铲平关隘', region: 'LINGNAN' },
    {
        id: 'city_yanping', name: '延平', factionId: 'geng',
        lat: 26.67, lng: 118.21, type: 'small_city', troops: 10000, tier: 4,
        
        note: '延平；靖南小城', region: 'LINGNAN' },
    {
        id: 'city_jianning', name: '建宁', factionId: 'longwu',
        lat: 27.12, lng: 118.26, type: 'small_city', troops: 10000, tier: 4,
        region: 'LINGNAN', note: '建宁府治建瓯（今福建建瓯）；非闽西宁化一带' },
    {
        id: 'city_chuzhou_zj', name: '丽水', factionId: 'yezongliu',
        lat: 28.46, lng: 119.91, type: 'small_city', troops: 10000, tier: 4,
        
        note: '丽水；太平小城', region: 'JIANGNAN' },
    {
        id: 'city_wenan', name: '文安', factionId: 'hejian',
        lat: 38.87, lng: 116.46, type: 'small_city', troops: 10000, tier: 4,
        region: 'NORTH', note: '河间郡文安；界桥先登死士翼境（《三国志·袁绍传》）' },
    // 第四类：藩王叛乱
    { id: 'city_wudingzhou', name: '乐安', factionId: 'dizhou', lat: 37.501018, lng: 117.518005, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '乐安；棣州小城',
    },

    // 第五类：边疆民族
    { id: 'city_hetao', name: '河套', factionId: 'dada_ming', lat: 40.442769, lng: 109.333191, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '河套；鞑靼小城',
    },
    {
        id: 'city_kobdo', name: '科布多', factionId: 'oirat_ming',
        lat: 48.01, lng: 91.64, type: 'small_city', troops: 10000,
        region: 'STEPPE', note: '噶尔丹以科布多为东进基地' },
    {
        id: 'city_yeren_base', name: '瑷珲', factionId: 'yeren_nvzhen',
        lat: 50.25, lng: 127.5, type: 'small_city', region: 'NORTHEAST', troops: 10000, tier: 4,
         
        note: '瑷珲；东海小城',
    },
    { id: 'city_chijin', name: '赤金堡', factionId: 'chijin', lat: 40.000221, lng: 97.437744, type: 'pass', region: 'HEXI', troops: 10000, note: '明赤斤蒙古卫驻牧；岳钟琪平准噶尔赤金营（旗号赤避「赤金」全称）' },
    { id: 'city_anding_qh', name: '苦峪堡', factionId: 'anding_wei', lat: 36.230961, lng: 100.59906, type: 'pass', region: 'TIBET', troops: 10000,
        note: '苦峪堡；安定关隘',
    },

    // 第六类：周边国家
    
    {
        id: 'city_ayutthaya', name: '阿瑜陀耶', factionId: 'siam',
        lat: 14.35, lng: 100.58, type: 'big_city', troops: 20000, tier: 4,
        
        note: '阿瑜陀耶王朝都城', region: 'DIANQIAN' },
    {
        id: 'city_angkor', name: '吴哥', factionId: 'chenla',
        lat: 13.41, lng: 103.87, type: 'big_city', troops: 20000, tier: 4,
        region: 'DIANQIAN', note: '真腊吴哥王朝都城；滇缅文化区' },
    // ── 2026-05-25 明清之际新城市 ──
    { id: 'city_shenyang', name: '沈阳', factionId: 'manzhou_d', lat: 41.80203, lng: 123.43689, type: 'big_city', region: 'NORTHEAST', troops: 20000, tier: 0, note: '大清皇朝都城；≠爱新觉罗氏族旗号(aisin_d@赫图阿拉)' },
    {
        id: 'city_guihua', name: '归化城', factionId: 'tumed',
        lat: 40.84, lng: 111.68, type: 'medium_city', troops: 10000,
        
        note: '归化城；土默特治所/重镇', region: 'STEPPE',  // [override] 蒙古土默特部都城, 文化属塞外
    },
    {
        id: 'city_kulun', name: '库伦', factionId: 'tushetu',
        lat: 47.92, lng: 106.84, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '库伦；土谢图小城',
    },
    { id: 'city_yili', name: '固尔札', factionId: 'xibo_d', lat: 43.901854, lng: 81.315308, type: 'small_city', region: 'STEPPE', troops: 10000, note: '清代锡伯营西迁戍边；伊犁将军辖区' },
    { id: 'city_yadong', name: '卓木', factionId: 'gaxa', lat: 28.243709, lng: 89.376526, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '卓木；噶厦小城',
    },
    { id: 'city_leweizhai', name: '勒乌围', factionId: 'jinchuan_g', lat: 31.812147, lng: 101.931152, type: 'pass', region: 'TIBET', troops: 10000,
        note: '勒乌围；金川关隘',
    },
    {
        id: 'city_meinuozhai', name: '美诺寨', factionId: 'jinchuan_x',
        lat: 31, lng: 102.4, type: 'pass', region: 'BASHU', troops: 10000,
        note: '美诺寨；小金川关隘',
    },
    {
        id: 'city_zhaoqing', name: '肇庆', factionId: 'duanzhou_d',
        lat: 23.05, lng: 112.45, type: 'small_city', troops: 10000, region: 'LINGNAN', note: '端州治；马暨统摧锋军抗元（1278）' },
    {
        id: 'city_changhua_tw', name: '彰化', factionId: 'shuntian',
        lat: 24.08, lng: 120.56, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '彰化；顺天小城',
    },
    { id: 'city_pinglong', name: '平陇', factionId: 'miaomin', lat: 28.304379, lng: 109.671021, type: 'pass', region: 'BASHU', troops: 10000,
        note: '平陇；苗民关隘',
    },
    { id: 'city_kathmandu', name: '加德满都', factionId: 'gurkha', lat: 27.715138, lng: 85.185242, type: 'small_city', region: 'TIBET', troops: 10000, tier: 1,
        note: '加德满都；廓喀小城',
    },
    {
        id: 'city_turkestan', name: '亚西', factionId: 'kazakh',
        lat: 43.297, lng: 68.27, type: 'small_city', troops: 10000, tier: 4,
        
        note: '亚西；哈萨小城', region: 'CENTRAL_ASIA' },
    { id: 'city_kokand', name: '浩罕', factionId: 'kokand', lat: 40.5333, lng: 70.9333, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '浩罕；霍罕小城',
    },

    { id: 'city_fayzabad', name: '法扎巴德', factionId: 'badakhshan', lat: 37.068341, lng: 70.675049, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '法扎巴德；达克小城',
    },

    // ── 2026-05-25 晚清／近代城市（35个）──
    // 第一类：太平天国
    {
        id: 'city_jintian', name: '金田村', factionId: 'taiping',
        lat: 23.4, lng: 110.08, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '金田村；太平天国小城',
    },
    // 第三类：大明国/小刀会
    {
        id: 'city_shanghai', name: '上海', factionId: 'chunshen',
        lat: 31.23, lng: 121.47, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '上海；春申小城',
    },

    // ── 洋州@兴势山（王平·兴势之战/无当飞军T1）──
    {
        id: 'city_yangxian', name: '兴势山', factionId: 'yangzhou',
        lat: 33.352, lng: 107.582, type: 'pass', region: 'BASHU', troops: 10000,
        note: '244年王平兴势之战大破曹爽；洋县北傥谷口要塞；洋州·无当飞军T1' },

    // 第六类：平南国（杜文秀）
    // 大理已存在 (city_dali_city), 不再新建

    // 第七类：陕甘回军
    // 第八类：号军/江汉政权
    
    { id: 'city_piandaoshui', name: '偏刀水', factionId: 'qianhui', lat: 27.921633, lng: 107.685242, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '偏刀水；回军小城',
    },
    // 第九类：黔西南回军
    // 第十类：苗民起义
    
    // 第十一类：新疆同治割据

    { id: 'city_wuliyasutai', name: '乌城', factionId: 'zhasaketu', lat: 47.74, lng: 96.84, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '乌城；扎萨克图小城',
    },


    // 第十三类：西南土司
    // 第十四类：回疆割据（托克逊等）
    { id: 'city_tuokexun', name: '托克逊', factionId: 'duerbote', lat: 42.79, lng: 88.65, type: 'small_city', region: 'WESTERN', troops: 10000, note: '杜尔伯特部游牧骑兵' },

    { id: 'city_dabancheng', name: '达坂城', factionId: 'tuoming', lat: 43.339165, lng: 88.258667, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '达坂城；清真关隘',
    },

    // 第十五类：越南阮朝
    { id: 'city_nanghar', name: '囊哈儿', factionId: 'jilimi', lat: 52.209343, lng: 141.951599, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '囊哈儿；吉里小城',
    },
    {
        id: 'city_katsuyama', name: '胜山馆', factionId: 'kakizaki',
        lat: 41.8008, lng: 140.0994, type: 'pass', troops: 10000, tier: 4,
        
        note: '胜山馆；松前关隘', region: 'JAPAN' },
    {
        id: 'city_yanaginogosho', name: '柳之御所', factionId: 'fujiwara',
        lat: 38.99, lng: 141.1208, type: 'small_city', troops: 10000,
        
        note: '柳之御所；奥州小城', region: 'JAPAN' },

    // ── 2026-05-26 新增：肃慎系势力都城（挹娄、勿吉、靺鞨）──
    { id: 'city_fenglin', name: '凤林城', factionId: 'yilou', lat: 46.318508, lng: 132.1875, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '凤林城；挹娄小城',
    },
    

    // ── 2026-05-26 新增：濊貊、毛文龙 ──
    
    {
        id: 'city_pidao', name: '皮岛', factionId: 'mao_wenlong',
        lat: 39.5539, lng: 124.6611, type: 'pass', troops: 10000,
        
        note: '皮岛；毛文龙关隘', region: 'NORTHEAST' },

    // ── 2026-05-26 新增：满洲贵族世家 ──
    {
        id: 'city_tongjiajiang', name: '浑江', factionId: 'jianzhou_nvzhen',
        lat: 41.2681, lng: 125.3625, type: 'small_city', troops: 10000,
        
        note: '浑江；建州小城', region: 'NORTH' },
    
    
    // ── 2026-05-26 新增：渤海国王族大氏 ──
    // ── 2026-05-26 新增：漠北草原势力 ──
    { id: 'city_xiaoyenisei', name: '贝加尔', factionId: 'dingling', lat: 51.8368, lng: 107.6138, type: 'small_city', region: 'STEPPE', troops: 10000, note: '丁零王统丁零游骑牧北海' },
    { id: 'city_gaxian', name: '嘎仙洞', factionId: 'xianbei', lat: 49.323391, lng: 120.709534, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '嘎仙洞；鲜卑关隘',
    },
    { id: 'city_junjishan', name: '浚稽山', factionId: 'gaoche', lat: 45.767504, lng: 106.284485, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '浚稽山；高车关隘',
    },
    { id: 'city_otuken', name: '于都斤山', factionId: 'tujue', lat: 47.602542, lng: 101.230774, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '于都斤山；突厥关隘',
    },
    { id: 'city_yingchang', name: '应昌', factionId: 'da_yuan', lat: 43.385052, lng: 116.82312, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '应昌；北元小城',
    },


    // ── 2026-05-26 新增：漠北草原部落/氏族势力据点 ──
    { id: 'city_ordos', name: '延恩', factionId: 'shuofang', lat: 39.620517, lng: 108.852539, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '延恩；朔方小城',
    },
    { id: 'city_ruoshui', name: '弱水畔', factionId: 'yujiulu', lat: 42.457925, lng: 101.186829, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '弱水畔；郁久闾小城',
    },
    
    { id: 'city_suoling', name: '娑陵', factionId: 'yaoluoge', lat: 49.364493, lng: 102.840271, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '娑陵；药罗葛小城',
    },
    {
        id: 'city_burhan', name: '不儿罕山', factionId: 'kiyad',
        lat: 48.5, lng: 109, type: 'pass', troops: 10000, tier: 4,
        
        note: '不儿罕山；乞颜关隘', region: 'STEPPE' },
    
    { id: 'city_kerulen', name: '克鲁伦河', factionId: 'jalair', lat: 47.969654, lng: 113.005371, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '克鲁伦河；札剌亦儿小城',
    },
    { id: 'city_erguna', name: '捕鱼儿海', factionId: 'hongirad', lat: 48.061537, lng: 117.78717, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '捕鱼儿海；弘吉剌关隘',
    },
    { id: 'city_dzungar_basin', name: '和博克', factionId: 'choros', lat: 46.713523, lng: 85.68512, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '和博克；绰罗斯小城',
    },
    { id: 'city_hanhai', name: '瀚海', factionId: 'tiele', lat: 44.144832, lng: 103.697205, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '瀚海；铁勒小城',
    },
    { id: 'city_keyimen', name: '克夷门', factionId: 'yeli', lat: 39.289647, lng: 106.776123, type: 'pass', region: 'HEXI', troops: 10000, tier: 2, note: '西夏野利氏权臣据险；铁鹞子克夷门之战' },

    // ── 2026-05-26 新增：西域/中亚城池（14个）──
    { id: 'city_talas', name: '怛罗斯', factionId: 'tujishi', lat: 42.885995, lng: 71.347961, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '怛罗斯；突骑施小城',
    },
    {
        id: 'city_bukhara', name: '蒲华', factionId: 'an',
        lat: 39.7667, lng: 64.4333, type: 'medium_city', troops: 10000, region: 'CENTRAL_ASIA', note: '昭武九姓安国故地（布哈拉）；昭武精骑' },
    {
        id: 'city_tashkent', name: '柘折城', factionId: 'shi_clan',
        lat: 41.3, lng: 69.3, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '柘折城；石氏小城',
    },
    // ── 2026-05-26 新增：青藏高原势力城市（24个）──
    // === 第一类：高原帝国与割据强权 ===
    { id: 'city_qionglong', name: '穹窿银', factionId: 'xiangxiong', lat: 31.193972, lng: 80.771484, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '穹窿银；象雄小城',
    },  // [2026-05-29] 原 xiangxiong 势力已删, 暂归叛军
    { id: 'city_leh', name: '列城', factionId: 'ladakh', lat: 34.16, lng: 77.58, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '列城；玛域小城',
    },

    {
        id: 'city_qingtang', name: '青唐城', factionId: 'tufa_d',
        lat: 36.625, lng: 101.775, type: 'small_city', region: 'TIBET', troops: 10000, note: '青唐城故址；南凉秃发南徙后据青唐（《晋书·秃发乌孤传》）' },
    { id: 'city_dangxiong', name: '当雄', factionId: 'khoshut', lat: 30.48, lng: 91.1, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '当雄；和硕特小城',
    },

    // === 第二类：雪域土著与古老强族 ===
    { id: 'city_buerhanbuda', name: '白海堡', factionId: 'duomi', lat: 34.91, lng: 98.21, type: 'pass', region: 'TIBET', troops: 10000,
        note: '白海堡；多弥关隘',
    },
    { id: 'city_mapangyongcuo', name: '玛旁雍错', factionId: 'nvguo', lat: 30.814997, lng: 81.430664, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '玛旁雍错；女国小城',
    },

    {
        id: 'city_kangyanchuan', name: '察木多', factionId: 'bailan',
        lat: 31.1333, lng: 97.1667, type: 'small_city', region: 'TIBET', troops: 10000, tier: 4,
        note: '察木多；白兰小城',
    },
    { id: 'city_heizong', name: '黑河宗', factionId: 'ganden', lat: 31.456786, lng: 92.04071, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '黑河宗；甘丹小城',
    },
    { id: 'city_cuona', name: '错那', factionId: 'monpa', lat: 27.97985, lng: 91.928101, type: 'small_city', region: 'TIBET', troops: 10000, note: '梅惹·洛珠嘉措门巴归附达赖' },
    { id: 'city_metuo', name: '墨脱', factionId: 'lopi', lat: 29.250477, lng: 95.213013, type: 'small_city', region: 'TIBET', troops: 10000, note: '阿波珞巴义都部据守墨脱' },
    // === 第三类：世袭门阀与政教寡头 ===
    { id: 'city_chubusi', name: '楚布寺', factionId: 'karmapa', lat: 30.059496, lng: 90.532837, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '楚布寺；噶玛小城',
    },

    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力 ──
    // ── 第一类：云贵高原与中南半岛的丛林帝国 ──
    {
        id: 'city_ava', name: '阿瓦', factionId: 'ava',
        lat: 21.85, lng: 96.0667, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '阿瓦；掸族小城',
    },
    {
        id: 'city_bago', name: '勃固城', factionId: 'hantawadi',
        lat: 17.3333, lng: 96.4667, type: 'medium_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '勃固城；汉达瓦底治所/重镇',
    },
    { id: 'city_wumeng', name: '乌蒙山', factionId: 'wuman', lat: 26.49764, lng: 103.897705, type: 'pass', region: 'DIANQIAN', troops: 10000,
        note: '乌蒙山；乌蛮关隘',
    },
    { id: 'city_leigong', name: '雷公山', factionId: 'dongzu', lat: 26.573781, lng: 108.091736, type: 'pass', region: 'LINGNAN', troops: 10000,
        note: '雷公山；侗族关隘',
    },
    {
        id: 'city_srikshetra', name: '室利差罗', factionId: 'pyu',
        lat: 18.8333, lng: 95.25, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '室利差罗；骠族小城',
    },
    {
        id: 'city_thaton', name: '直通城', factionId: 'mon',
        lat: 16.5333, lng: 97.6333, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '直通城；孟族小城',
    },
    // ── 第三类：世袭土司与门阀 ──
    {
        id: 'city_tonghai', name: '新兴', factionId: 'dian',
        lat: 24.11, lng: 102.76, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '新兴；通海小城',
    },
    { id: 'city_hailongtun', name: '海龙屯', factionId: 'yang_bozhou', lat: 27.751638, lng: 106.924438, type: 'pass', region: 'BASHU', troops: 10000,
        note: '海龙屯；播州关隘',
    },
    { id: 'city_zhenyuan', name: '镇远', factionId: 'tian_sizhou', lat: 27.05, lng: 108.42, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '镇远；田氏小城',
    },

    { id: 'city_mufu', name: '独克宗', factionId: 'jiantang', lat: 27.82, lng: 99.7, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '独克宗；建塘小城',
    },

    {
        id: 'city_dongxu_old', name: '凯图玛蒂', factionId: 'dongxu',
        lat: 18.8, lng: 96.4, type: 'medium_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '凯图玛蒂；东吁治所/重镇',
    },
    // ── 第四类：岭南帝国、安南正统与海岛王国 ──
    // ── 第五类：百越余脉与南岛语系 ──
    {
        id: 'city_lingqu', name: '始安', factionId: 'xinjiang',
        lat: 25.27, lng: 110.29, type: 'medium_city', region: 'LINGNAN', troops: 10000, tier: 4,
        note: '始安；静江治所/重镇',
    },
    { id: 'city_huashan', name: '花山', factionId: 'luoyue', lat: 22.159442, lng: 107.418823, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '花山；骆越小城',
    },
    { id: 'city_hepu', name: '合浦', factionId: 'li_s', lat: 21.663, lng: 109.207, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '合浦；里族小城',
    },
    { id: 'city_haikang', name: '海康', factionId: 'leizhou', lat: 20.91, lng: 110.08, type: 'small_city', troops: 10000, 
        note: '海康；雷州小城', region: 'LINGNAN' },
    {
        id: 'city_myson', name: '美山', factionId: 'champa',
        lat: 15.5, lng: 108.5, type: 'small_city', region: 'LINGNAN', troops: 10000, tier: 4,
        note: '美山；占婆小城',
    },
    
    {
        id: 'city_hoalu',
        name: '华闾',
        factionId: 'jing',
        lat: 20.25,
        lng: 105.9167,
        type: 'small_city',
        troops: 10000,
        tier: 1,
        
        note: '华闾；京族小城', region: 'LINGNAN' },
    {
        id: 'city_hoabinh', name: '和平', factionId: 'muong',
        lat: 20.7667, lng: 105.3333, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '申从岳芒族据守和平', tier: 4 },
    
    {
        id: 'city_mudan', name: '牡丹社', factionId: 'paiwan',
        lat: 22.2, lng: 120.8333, type: 'small_city', region: 'LINGNAN', troops: 10000, tier: 4, note: '岭南/南方环线共用锚点；文化岭南' },
    // ── 第六类：岭南土司、安南权臣与海商门阀 ──
    { id: 'city_cen', name: '凌云', factionId: 'cen_d', lat: 24.462119, lng: 106.627808, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '岑猛泗城狼兵震广西' },


    {
        id: 'city_xidu', name: '西都城', factionId: 'trinh',
        lat: 19.8, lng: 105.7833, type: 'small_city', region: 'LINGNAN', troops: 10000, tier: 4,
        note: '西都城；郑主小城',
    },
    {
        id: 'city_fuchun', name: '富春', factionId: 'nguyen_guangnan',
        lat: 16.4667, lng: 107.5833, type: 'medium_city', troops: 10000, tier: 1, region: 'LINGNAN', note: '阮主/西山朝都城；西山军' },
    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    {
        id: 'city_dangqu', name: '宕渠', factionId: 'cong',
        lat: 30.87, lng: 106.94, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '宕渠；賨族小城',
    },

    { id: 'city_langzhong_gucheng', name: '隆城', factionId: 'langzhou', lat: 31.583, lng: 105.97, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '隆城；阆州小城',
    },
    {
        id: 'city_fuzhou_fugu', name: '府谷', factionId: 'zhe_d',
        lat: 39.0278, lng: 111.0583, type: 'small_city', region: 'NORTH', troops: 10000, tier: 4,
        note: '府谷；折氏小城',
    },
    {
        id: 'city_wanling', name: '宛陵城', factionId: 'shanyue',
        lat: 30.9333, lng: 118.75, type: 'small_city', region: 'JIANGNAN', troops: 10000, tier: 4,
        note: '宛陵城；山越小城',
    },
    {
        id: 'city_chimushan', name: '敕木山', factionId: 'she_ethnic',
        lat: 27.925, lng: 119.6333, type: 'pass', region: 'JIANGNAN', troops: 10000, tier: 4,
        note: '敕木山；畲族关隘',
    },
    {
        id: 'city_qingjingsi', name: '刺桐', factionId: 'quanzhou',
        lat: 24.9, lng: 118.5833, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 4,
        note: '刺桐；泉州治所/重镇',
    },
    // ── 2026-05-26 Phase 3i：新增朴(新罗门阀)、土(巴人后裔) ──
    
    {
        id: 'city_wulingshan', name: '武陵山', factionId: 'wuling',
        lat: 29.1167, lng: 110.4667, type: 'pass', troops: 10000, tier: 4,
        region: 'BASHU', note: '武陵蛮祖山；相单程武陵蛮（≠钟相钟楚）' }
];

// ============================================================
// 汇总导出
// ============================================================

// RESTORED CITIES
export const RESTORED_CITIES: CityDataV2[] = [


{ id: 'city_ningwuguan', name: '宁武关', factionId: 'loufan', lat: 39.05, lng: 112.24, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '宁武关；楼烦关隘',
    },

{ id: 'city_yanmenguan', name: '雁门关', factionId: 'heng1', lat: 39.19, lng: 112.87, type: 'pass', region: 'NORTH', troops: 10000, mirror: true,
        note: '雁门关；元岳关隘',
    },


{ id: 'city_xingqing', name: '安化', factionId: 'qing', lat: 36.01, lng: 107.87, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '安化；庆州小城',
    },

// ── 大夏(西夏)都城：兴庆府 ──
{ id: 'city_yongan', name: '永安', factionId: 'jingjiang', lat: 24.066563, lng: 110.626831, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '永安；靖江小城',
    },
    { id: 'city_xinzheng', name: '新郑', factionId: 'han', lat: 34.4, lng: 113.74, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '新郑；韩国小城',
    },
    { id: 'city_dongkang', name: '东康', factionId: 'sushen', lat: 44.42792, lng: 131.388245, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '东康；肃慎小城',
    },
    { id: 'city_kanka', name: '康卡', factionId: 'kangju', lat: 40.832522, lng: 68.634338, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '康卡；康居小城',
    },
    { id: 'city_asuka', name: '千早城', factionId: 'yamato', lat: 34.336668, lng: 135.689392, type: 'pass', region: 'JAPAN', troops: 10000,
        note: '千早城；大和关隘',
    },
    {
        id: 'city_shenglong',
        name: '昇龙',
        factionId: 'dayue',
        lat: 21.03, lng: 105.85,
        type: 'medium_city',
        region: 'LINGNAN',
        troops: 10000,
        tier: 1,
        note: '昇龙；大越治所/重镇',
    },
    { id: 'city_boduo', name: '伯都', factionId: 'wuji', lat: 45.4265, lng: 124.6591, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '伯都；勿吉小城',
    },
    { id: 'city_varaksha', name: '瓦拉赫沙', factionId: 'sogdian', lat: 40.402983, lng: 63.088989, type: 'small_city', troops: 10000, 
        note: '瓦拉赫沙；粟特小城', region: 'CENTRAL_ASIA' },
    {
        id: 'city_raoleshui',
        name: '饶乐水',
        factionId: 'kumoxi',
        lat: 43.27, lng: 118.48,
        type: 'small_city',
        region: 'STEPPE',
        troops: 10000,
        note: '西拉木伦河（饶乐水）；库莫奚本部牧地（《魏书·库莫奚传》）' },
    // ── 武川镇 ──
    { id: 'city_wuchuanzhen', name: '武川镇', factionId: 'yuwen', lat: 41.2661, lng: 111.1322, type: 'pass', region: 'STEPPE', troops: 10000, note: '北魏六镇之武川镇；宇文氏祖地；沙苑之战（537）宇文泰以少胜多之战主将' },


    // ── 新增关隘（2026-05-26） ──
    { id: 'city_gubeikou', name: '古北口', factionId: 'yan', lat: 40.69, lng: 117.16, type: 'pass', region: 'NORTH', troops: 10000, tier: 2,
        note: '古北口；燕国关隘',
    },
    { id: 'city_shimenguan', name: '石门关', factionId: 'wumeng', lat: 28.079264, lng: 104.254761, type: 'pass', region: 'BASHU', troops: 10000, note: '岭南环线西北锚点；文化川蜀（入蜀要道）' },


    // ── 2026-05-27 新增：汪(黟县) ──
    {
        id: 'city_yixian',
        name: '黟城',
        factionId: 'wang_s',
        lat: 29.93, lng: 117.94,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 10000,
        note: '黟城；汪氏小城',
    },

    // ── 2026-05-27 新增：向(来凤)、覃(慈利)、冉(秀山)、储(潜山) ──
    {
        id: 'city_laifeng',
        name: '来凤',
        factionId: 'xiang_d',
        lat: 29.49, lng: 109.41,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '来凤土司；向大坤向王天子据地' },
    {
        id: 'city_cili',
        name: '慈利',
        factionId: 'tan_d',
        lat: 29.43, lng: 111.12,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '慈利土司；覃垕率土兵起义（明）' },
    { id: 'city_xiushan', name: '秀山', factionId: 'ran_d', lat: 28.379316, lng: 109.061279, type: 'small_city', region: 'BASHU', troops: 10000, note: '酉阳冉氏土官；冉守忠南宋从征' },
    { id: 'city_qianshan', name: '潜山', factionId: 'chu_d', lat: 30.616642, lng: 116.485291, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '唐舒州同安郡；储氏地方望族，唐团练（非储光羲里居）' },

    // ── 2026-05-27 新增：青衣(雅州) ──
    // ── 2026-05-27 新增：五溪(八面山) ──
    {
        id: 'city_bamian',
        name: '八面山',
        factionId: 'wuxi',
        lat: 28.83, lng: 109.28,
        type: 'pass',
        region: 'BASHU',
        troops: 10000,
        note: '八面山；五溪关隘',
    },

    // ── 2026-05-27 新增：生苗(甲定) ──
    { id: 'city_jiading', name: '甲定', factionId: 'shengmiao', lat: 26.485279, lng: 107.523193, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '甲定；生苗小城',
    },

    // ── 2026-05-27 新增：且兰(且兰城) ──
    { id: 'city_qielancheng', name: '且兰城', factionId: 'miao_qing', lat: 27.247242, lng: 107.880249, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '且兰城；苗军小城',
    },

    // ── 2026-05-27 新增：先零(允吾) ──
    {
        id: 'city_yunwu',
        name: '允吾',
        factionId: 'xianlingqiang',
        lat: 36.32, lng: 102.82,
        type: 'small_city',
        region: 'TIBET',
        troops: 10000,
        note: '金城郡允吾县；先零羌故地（《后汉书·西羌传》）' },

    // ── 2026-05-27 新增：蒯(房陵) ──
    { id: 'city_fangling', name: '房陵', factionId: 'kuai', lat: 32.043007, lng: 110.692749, type: 'small_city', region: 'BASHU', troops: 10000, note: '房陵郡；蒯越蒯氏宗族部曲（汉末荆襄）' },

    // ── 2026-05-27 新增：庸(上庸) ──
    { id: 'city_shangyong', name: '竹山', factionId: 'yong', lat: 32.349768, lng: 109.885254, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '竹山；庸国小城',
    },
    { id: 'city_junzhou', name: '武当', factionId: 'bailian', lat: 32.5417, lng: 111.5133, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '武当；白莲小城',
    },

    // ── 2026-05-27 新增：申(金州) ──
    {
        id: 'city_jinzhou_shanxi',
        name: '安康',
        factionId: 'shen',
        lat: 32.68, lng: 109.02,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 10000,
        note: '安康；申国小城',
    },

    // ── 2026-05-27 新增：叟(乐山) ──
    {
        id: 'city_leshan',
        name: '乐山',
        factionId: 'sou',
        lat: 29.6, lng: 103.79,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '乐山；叟族小城',
    },

    // ── 2026-05-27 新增：板楯(汉昌) ──
    {
        id: 'city_hanchang',
        name: '汉昌',
        factionId: 'bandun',
        lat: 31.86, lng: 106.75,
        type: 'small_city',
        region: 'BASHU',
        troops: 10000,
        note: '汉昌；板楯小城',
    },

    // ── 2026-05-27 新增：烧当(玛曲) ──
    { id: 'city_maqu', name: '玛曲', factionId: 'shaodang', lat: 34.309295, lng: 101.513672, type: 'small_city', region: 'TIBET', troops: 10000, note: '河曲玛曲；烧当羌本部（河湟西羌，《后汉书·西羌传》）' },

    // ── 2026-05-27 新增：叛军(古严关)、盘瑶(贺州)、马楚(麦岭关)、排瑶(连州)、士(广信)、蒋(永州) ──
    {
        id: 'city_guyanguan',
        name: '古严关',
        factionId: 'guizhou',
        lat: 25.68, lng: 110.62,
        type: 'pass',
        region: 'LINGNAN',
        troops: 10000,
        mirror: true,
        tier: 4,
        note: '古严关；桂州关隘',
    },
    {
        id: 'city_hezhou',
        name: '临贺',
        factionId: 'panyao',
        lat: 24.4, lng: 111.55,
        type: 'small_city', region: 'LINGNAN',
        troops: 10000, note: '盘瑶聚居瑶人弩手',
        tier: 4 },
    {
        id: 'city_mailingguan',
        name: '麦岭关',
        factionId: 'daozhou',
        lat: 25.02, lng: 111.23,
        type: 'pass',
        region: 'LINGNAN',
        troops: 10000,
        mirror: true,
        tier: 4,
        note: '麦岭关；道州关隘',
    },
    { id: 'city_yongzhou_hn', name: '零陵', factionId: 'jiang_s', lat: 26.231835, lng: 111.588135, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '蒋琬故里零陵驻军' },
    // ── 2026-05-28 新增：黎(崖州) ──
    { id: 'city_yazhou', name: '珠崖', factionId: 'liren', lat: 18.432692, lng: 108.989868, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '珠崖；俚族小城',
    },
    // ── 2026-05-28 新增：悉勃野(匹播) ──
    { id: 'city_pibo', name: '匹播', factionId: 'lang_clan', lat: 29.224032, lng: 91.746826, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '匹播；帕竹朗小城',
    },
    // ── 2026-05-28 新增：工布(江达宗) ──
    // [2026-05-29] 原 gongbu 势力已删, 暂归叛军
    // ── 2026-05-28 新增：果洛(花石峡)、察哈尔(多伦) ──
    { id: 'city_huashixia', name: '花石峡', factionId: 'heyuan_d', lat: 35.196235, lng: 98.907166, type: 'pass', region: 'TIBET', troops: 10000, mirror: true, note: '青藏东线隘口；隋河源郡积石镇屯田区（刘权《隋书·刘权传》）' },

    // ── 2026-05-30 威海(文登)；威海卫据点已删（与文登重复） ──
    { id: 'city_wendeng', name: '文登', factionId: 'weihaiwei', lat: 37.2, lng: 122.05, type: 'small_city', region: 'NORTH', troops: 10000, note: '朝鲜环线锚点（代威海卫）；文化北方' } ];

// ============================================================
// 汇总导出
// ============================================================
export const CITIES_V2: CityDataV2[] = [
    ...T0_CAPITALS,
    ...T1_MEDIUM_CITIES,
    ...T2_STRATEGIC,
    ...PERIPHERY,
    ...RESTORED_CITIES,
    { id: 'city_guangyuan', name: '广源', factionId: 'nong2', lat: 22.644425, lng: 106.273499, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '侬智高广源起兵建南天国' },
    // ── 2026-05-28 新增：奢氏(永宁/四川叙永) ──
    { id: 'city_yongning2', name: '叙永', factionId: 'she', lat: 28.17, lng: 105.44, type: 'small_city', region: 'BASHU', troops: 10000, note: '永宁宣抚司；奢崇明起兵反明（奢安之乱）' },
    // ── 2026-05-28 新增：僚(江阳/四川泸州) ──
    { id: 'city_jiangyang', name: '江阳', factionId: 'liao', lat: 28.87, lng: 105.42, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '江阳；僚族小城',
    },
    // ── 2026-05-28 新增：普氏(矩州/贵州贵阳) ──
    { id: 'city_juzhou', name: '顺元', factionId: 'qian', lat: 26.576247, lng: 106.685486, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '宋景阳入矩州戍黔中' },

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    { id: 'city_genjo', name: '根城', factionId: 'nanbu', lat: 40.5047, lng: 141.4644, type: 'small_city', region: 'JAPAN', troops: 10000, tier: 4,
        note: '根城；陆奥小城',
    },
    { id: 'city_amucheng', name: '阿母城', factionId: 'saman', lat: 39.0833, lng: 63.5786, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '阿姆河要冲；萨曼王朝域内重镇' },
    { id: 'city_hepancheng', name: '石头城', factionId: 'hepan', lat: 37.7725, lng: 75.2264, type: 'pass', region: 'WESTERN', troops: 10000, tier: 4,
        note: '石头城；朅盘陀关隘',
    },
    { id: 'city_humicheng', name: '护密城', factionId: 'qiepantuo', lat: 36.7266, lng: 71.6133, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 4, note: '青藏/中亚环线共用锚点' },
    { id: 'city_huoguocheng', name: '阿缓城', factionId: 'yanda', lat: 36.7286, lng: 68.8681, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '阿缓城；嚈哒小城',
    },

    // ── 2026-05-28 新增：马蒙(达尔甘)、古兹根(法里亚布)、傣(勐泐城)、泰沅(清坎城)、帕銮(双河城)、罗斛(呵叻城) ──
    { id: 'city_dargan', name: '达尔甘', factionId: 'mamon', lat: 40.5333, lng: 62.2667, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 4,
        note: '达尔甘；马蒙小城',
    },
    { id: 'city_fariyab', name: '法里亚布', factionId: 'guzgan', lat: 35.92, lng: 64.78, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 4,
        note: '法里亚布；古兹根小城',
    },
    { id: 'city_mengle', name: '勐泐城', factionId: 'dai', lat: 22, lng: 100.8, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '刀应勐率傣兵助明御缅' },
    { id: 'city_chingkham', name: '清坎城', factionId: 'taiyuan', lat: 19.52, lng: 100.3, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '芒莱王征服南奔开创兰纳' },
    { id: 'city_shuanghe', name: '双河城', factionId: 'suke', lat: 16.830829, lng: 100.395813, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '双河城；素可泰小城',
    },
    { id: 'city_khorat', name: '呵叻城', factionId: 'luohu', lat: 14.97, lng: 102.1, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '呵叻城；罗斛小城',
    },

    // ── 2026-05-28 新增：黑龙江流域民族/家族据点 ──
    { id: 'city_lahasusu', name: '拉哈苏苏', factionId: 'heishui', lat: 47.654208, lng: 132.497864, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '拉哈苏苏；黑水靺鞨关隘',
    },
    { id: 'city_valen', name: '瓦伦', factionId: 'nanai', lat: 50.55, lng: 137, type: 'small_city', region: 'NORTHEAST', troops: 10000, tier: 4,
        note: '瓦伦；那乃小城',
    },
    { id: 'city_qiji', name: '普禄', factionId: 'feiyaka', lat: 51.58, lng: 140, type: 'small_city', region: 'NORTHEAST', troops: 10000, tier: 4,
        note: '普禄；费雅喀小城',
    },
    // ── 2026-05-28 新增：伊勒巴斯(希瓦)、南杰(日土宗) ──
    { id: 'city_dadoubagu', name: '大斗拔谷', factionId: 'xiutu', lat: 38.0011, lng: 100.9125, type: 'pass', region: 'TIBET', mirror: true, troops: 10000, tier: 4,
        note: '大斗拔谷；休屠王部关隘',
    },
    { id: 'city_khiva', name: '希瓦', factionId: 'anushidgin', lat: 41.564038, lng: 60.710449, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '希瓦；伊勒巴斯小城',
    },
    { id: 'city_rituzong', name: '日土宗', factionId: 'nanjie', lat: 33.367241, lng: 79.705811, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '日土宗；南杰小城',
    },


    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、叛军(三陇沙/肩水金关) ──
    { id: 'city_zhadunzong', name: '扎敦宗', factionId: 'gandenpozhang', lat: 29.645092, lng: 84.171753, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '扎敦宗；甘丹颇章小城',
    },
    { id: 'city_sanlongsha', name: '三陇沙', factionId: 'bailong', lat: 40.4, lng: 92.5, type: 'pass', region: 'WESTERN', troops: 10000, note: '班勇西域长史出三陇沙平车师' },
    { id: 'city_jianshuijinguan', name: '肩水金关', factionId: 'hunxie', lat: 40.413414, lng: 99.434509, type: 'pass', region: 'HEXI', troops: 10000, mirror: true,
        note: '肩水金关；浑邪关隘',
    },//镜像

    // ── 2026-05-28 新增：药罗葛(博尔巴任)、爱新觉罗(墨尔根城)、广南国(洞海城) ──
    // 瓦剌（卫拉特）药罗葛部牧地，与明代卫拉（科布多）分立
    { id: 'city_porbazhyn', name: '博尔巴任', factionId: 'wala', lat: 49.664324, lng: 95.767822, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '博尔巴任；瓦剌关隘',
    },
    { id: 'city_moergen', name: '莫尔根', factionId: 'dawoer', lat: 49.176, lng: 125.228, type: 'small_city', region: 'NORTHEAST', troops: 10000, tier: 4,
        note: '莫尔根；达斡尔小城',
    },
    { id: 'city_donghai', name: '洞海城', factionId: 'guangping', lat: 17.620424, lng: 106.495972, type: 'pass', region: 'LINGNAN', troops: 10000,
        note: '洞海城；广平关隘',
    },

    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐) ──
    { id: 'city_baidalik', name: '拜达里克', factionId: 'tumengken', lat: 46.189304, lng: 99.159851, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '拜达里克；图蒙肯小城',
    },

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(唐努) ──
    { id: 'city_jiegu', name: '结古宗', factionId: 'gling', lat: 33.001753, lng: 97.012024, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '结古宗；岭氏小城',
    },
    { id: 'city_qiongbu', name: '丁青宗', factionId: 'khyungpo', lat: 31.41, lng: 95.59, type: 'small_city', region: 'TIBET', troops: 10000, note: '琼波·邦色率苏毗兵灭象雄' },
    { id: 'city_bukui', name: '卜奎', factionId: 'suolun', lat: 47.305322, lng: 123.752747, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '卜奎；索伦小城',
    },
    { id: 'city_teshuolankalun', name: '唐努', factionId: 'tuva', lat: 49.419915, lng: 98.432007, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '唐努；图瓦小城',
    },

    // ── 2026-05-28 新增：大隅(赤尾木城/九州)、奄美(赤木名城/琉球) ──
    { id: 'city_akaogicheng', name: '赤尾木城', factionId: 'osumi', lat: 30.73, lng: 131, type: 'small_city', troops: 10000, tier: 4, 
        note: '赤尾木城；大隅小城', region: 'JAPAN' },
    { id: 'city_akakinagusuku', name: '赤木名城', factionId: 'anmei', lat: 28.454, lng: 129.674, type: 'pass', region: 'JAPAN', troops: 10000, tier: 4,
        note: '赤木名城；奄美关隘',
    },

    // ── 2026-05-28 新增：康区藏族土司/部落据点 ──
    { id: 'city_riwoche', name: '类乌齐', factionId: 'dalung', lat: 31.36, lng: 96.5, type: 'small_city', region: 'TIBET', troops: 10000, tier: 4,
        note: '类乌齐；达隆小城',
    },
    { id: 'city_derge', name: '德格', factionId: 'gar_kham', lat: 31.924163, lng: 99.181824, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '德格；德司小城',
    },
    { id: 'city_ganzi', name: '甘孜', factionId: 'kongsa', lat: 31.615967, lng: 99.981079, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '甘孜；孔萨小城',
    },
    { id: 'city_dajianlu', name: '打箭炉', factionId: 'mingzheng', lat: 30.05, lng: 101.96, type: 'small_city', region: 'DIANQIAN', troops: 10000, tier: 4,
        note: '打箭炉；明正小城',
    },
    // ── 2026-05-28 新增：波密(博窝/西藏) ──
    // ── 2026-05-28 新增：达擦(八宿宗/达察呼图克图/家族) ──
    { id: 'city_basu', name: '八宿宗', factionId: 'daca', lat: 30.185461, lng: 97.283936, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '八宿宗；达擦小城',
    },


    // ── 2026-05-28 新增：景东(银生城/云南/政权) ──
    { id: 'city_yinsheng', name: '银生城', factionId: 'jingdong', lat: 23.873432, lng: 100.914917, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '银生城；景东小城',
    },

    // ── 2026-05-28 新增：霍尔(索宗/那曲/家族) ──
    { id: 'city_suozong', name: '索宗', factionId: 'hor', lat: 31.889225, lng: 93.804016, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '索宗；霍尔小城',
    },

    // ── 2026-05-28 新增：董(囊谦宗/玉树/家族) ──
    { id: 'city_nangqian', name: '囊谦宗', factionId: 'dong', lat: 32.2, lng: 96.48, type: 'small_city', region: 'TIBET', troops: 10000, tier: 4,
        note: '囊谦宗；隆庆小城',
    },

    // ── 工布土王(尼池/林芝)；巴塘宗改叛军点 ──
    { id: 'city_nichi', name: '太昭', factionId: 'gongbu', lat: 29.752, lng: 93.232, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '太昭；工布小城',
    },
    { id: 'city_litangzong', name: '理塘宗', factionId: 'kangba', lat: 30, lng: 100.27, type: 'small_city', region: 'TIBET', troops: 10000, note: '康巴骁骑招抚理塘' },

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
    { id: 'city_heishacheng', name: '黑沙城', factionId: 'ashide', lat: 43.5, lng: 96.6, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '黑沙城；阿史德小城',
    },

    { id: 'city_beiluocheng', name: '孛罗城', factionId: 'duolu', lat: 44.9, lng: 82.07, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '孛罗城；咄陆小城',
    },

    { id: 'city_dushancheng', name: '独山城', factionId: 'chuyue', lat: 44.42, lng: 84.92, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '独山城；处月部关隘',
    },

    { id: 'city_wutucheng', name: '务涂城', factionId: 'cheshihou', lat: 43.735353, lng: 87.574768, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '务涂城；车师小城',
    },

    { id: 'city_gaochangcheng', name: '高昌', factionId: 'yiduhu', lat: 42.8533, lng: 89.53, type: 'small_city', region: 'WESTERN', troops: 10000, mirror: true, tier: 1,
        note: '高昌；亦都护小城',
    },


    { id: 'city_jinchangcheng', name: '晋昌城', factionId: 'guazhou', lat: 40.5346, lng: 95.820007, type: 'small_city', region: 'HEXI', troops: 10000, note: '唐瓜州治晋昌郡' },
    { id: 'city_jieshuangna', name: '羯霜那', factionId: 'jie', lat: 40.124284, lng: 65.341187, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '羯霜那；羯族小城',
    },
    {
        id: 'city_samaerhan',
        name: '撒马尔罕',
        factionId: 'tiemuer',
        lat: 39.6525,
        lng: 66.9714,
        type: 'medium_city',
        troops: 20000,
        tier: 1,
        
        note: '撒马尔罕；帖木儿治所/重镇', region: 'CENTRAL_ASIA' },
    { id: 'city_jizhake', name: '吉扎克', factionId: 'kawusi', lat: 40.1167, lng: 67.8333, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '吉扎克；卡乌斯小城',
    },
    { id: 'city_yierkeshentan', name: '斯姆哈纳', factionId: 'keerkezi', lat: 39.67, lng: 73.9, type: 'pass', region: 'CENTRAL_ASIA', troops: 10000,
        note: '斯姆哈纳；柯尔克孜关隘',
    },

    { id: 'city_luntai', name: '轮台', factionId: 'quli', lat: 41.77, lng: 84.25, type: 'small_city', region: 'WESTERN', troops: 10000,
        note: '轮台；渠犁国小城',
    },
    { id: 'city_duluohe', name: '独逻河', factionId: 'kaerka', lat: 45.826868, lng: 101.878967, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '独逻河；喀尔喀小城',
    },
    { id: 'city_guyanshan', name: '姑衍山', factionId: 'chenli_d', lat: 43.812726, lng: 98.489685, type: 'pass', region: 'STEPPE', troops: 10000, note: '匈奴祭天圣山；霍去病封狼居胥后禅于姑衍（《汉书·霍去病传》）' },
    { id: 'city_naomaohu', name: '淖毛湖', factionId: 'huyan', lat: 43.279321, lng: 94.713135, type: 'small_city', region: 'STEPPE', troops: 10000, mirror: true,
        note: '淖毛湖；呼衍小城',
    },
    { id: 'city_jiluoshan', name: '稽落山', factionId: 'bayegu', lat: 44.97439, lng: 99.113159, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '稽落山；拔野古关隘',
    },
    { id: 'city_aodongcheng', name: '敖东城', factionId: 'dongdan', lat: 43.37, lng: 128.22, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '东丹国都城敖东城' },
    { id: 'city_longtanshancheng', name: '龙潭山', factionId: 'dongxia', lat: 43.834536, lng: 126.589966, type: 'pass', region: 'NORTHEAST', troops: 10000, note: '东夏国蒲鲜万奴翼境要地' },
    { id: 'city_bamiancheng', name: '八面关', factionId: 'yehe', lat: 43.189189, lng: 124.354248, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '八面关；叶赫部关隘',
    },
    { id: 'city_tuhe', name: '徒河', factionId: 'jinzhou', lat: 41.12, lng: 121.14, type: 'small_city', region: 'NORTH', troops: 10000, note: '徒河水/明锦州卫；旗号锦@锦州（2026-06-11）' },
    { id: 'city_feiru', name: '肥如', factionId: 'guzhu', lat: 39.89, lng: 118.89, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '肥如；孤竹小城',
    },
    { id: 'city_wuzhong', name: '无终', factionId: 'shanrong', lat: 39.95, lng: 117.4, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '无终；山戎小城',
    },
    { id: 'city_wugucheng', name: '乌骨城', factionId: 'huimo', lat: 40.7685, lng: 123.9395, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '乌骨城；濊貊关隘',
    },
    { id: 'city_shangzhou', name: '三白', factionId: 'sabeol', lat: 36.41, lng: 128.16, type: 'small_city', region: 'KOREA', troops: 10000, note: '尚州(沙伐州)旧称；沙伐国都；三白为尚州别称(稻·茧·柿)' },
    { id: 'city_yuanzhishi', name: '原之辻', factionId: 'yizhi', lat: 33.791, lng: 129.703, type: 'small_city', region: 'JAPAN', troops: 10000, note: '壹岐国府旧址' },
    { id: 'city_taizaifu', name: '太宰府', factionId: 'zhuqian', lat: 33.51, lng: 130.52, type: 'small_city', region: 'JAPAN', troops: 10000, note: '筑前国太宰府；九州律令国府、防佛渡海咽喉；室町期警固番役驻地（江户期福冈城在其北约15km，据点名取史地知名度更大者）' },
    { id: 'city_chijianguan', name: '赤间关', factionId: 'taira', lat: 33.95, lng: 130.93, type: 'pass', region: 'JAPAN', troops: 10000, tier: 2,
        note: '赤间关；平氏关隘',
    },
    { id: 'city_guizhicheng', name: '备中高松城', factionId: 'jibei2', lat: 34.69, lng: 133.82, type: 'pass', region: 'JAPAN', troops: 10000, note: '备中国鬼之城；宇喜多氏·备中名城（距冈山/福山城址<50km）' },
    { id: 'city_junfucheng', name: '骏府', factionId: 'jinchuan', lat: 34.97, lng: 138.38, type: 'medium_city', region: 'JAPAN', troops: 10000,
        note: '骏府；骏河治所/重镇',
    },
    { id: 'city_hamamatsu', name: '浜松城', factionId: 'totomi', lat: 34.71, lng: 137.73, type: 'medium_city', region: 'JAPAN', troops: 10000,
        note: '浜松城；远江治所/重镇',
    },
    { id: 'city_atsuta', name: '热田城', factionId: 'owari', lat: 35.12, lng: 136.95, type: 'small_city', region: 'JAPAN', troops: 10000,
        note: '热田城；尾张小城',
    },
    {
        id: 'city_xuanhua',
        name: '宣化',
        factionId: 'xuan',
        lat: 40.609, lng: 115.052,
        type: 'small_city',
        troops: 10000,
        
        note: '徐达宣府筑城防守', region: 'NORTH' },
    { id: 'city_xinghe', name: '兴和', factionId: 'chahar', lat: 41.15, lng: 114.7, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '兴和；察哈小城',
    },
    { id: 'city_jining', name: '集宁', factionId: 'baidi', lat: 41.03, lng: 113.1, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '集宁；白狄小城',
    },
    { id: 'city_jingzhou', name: '净州塞', factionId: 'ongut', lat: 41.56, lng: 111.66, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '净州塞；汪古关隘',
    },

    { id: 'city_saierwusu', name: '赛尔乌苏', factionId: 'rouran', lat: 44.818872, lng: 106.800842, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '赛尔乌苏；柔然小城',
    },
    { id: 'city_tongdi', name: '铜鞮', factionId: 'yangshe', lat: 36.824653, lng: 112.826843, type: 'small_city', region: 'NORTH', troops: 10000,
        note: '铜鞮；羊舌小城',
    },
    { id: 'city_huojia', name: '获嘉', factionId: 'sima_d', lat: 35.26, lng: 113.66, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '河内郡；司马氏郡望' },
    { id: 'city_eyu', name: '阏与', factionId: 'liguo', lat: 36.487, lng: 113.381, type: 'pass', region: 'CENTRAL', troops: 10000,
        note: '阏与；黎国关隘',
    },    
    { id: 'city_fushi', name: '肤施', factionId: 'zhai_han', lat: 36.59, lng: 109.48, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '肤施；翟国小城',
    },
    { id: 'city_changze', name: '长泽', factionId: 'kang', lat: 39.1, lng: 107.98, type: 'small_city', region: 'HEXI', troops: 10000, note: '梁师都鹰扬郎将起兵建梁' },
    { id: 'city_linrong', name: '临戎', factionId: 'woye', lat: 40.3, lng: 107, type: 'small_city', region: 'HEXI', troops: 10000, note: '皇甫规度辽将军驻朔方' },
    { id: 'city_aowei', name: '媪围', factionId: 'lushui', lat: 37.396289, lng: 104.111938, type: 'small_city', region: 'HEXI', troops: 10000, note: '北宫伯玉卢水义从胡起兵凉州' },
    { id: 'city_mingsha', name: '鸣沙', factionId: 'yingli', lat: 37.51, lng: 105.18, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '鸣沙；应理小城',
    },
    { id: 'city_xingqingfu2', name: '兴庆府', factionId: 'dangxiang', lat: 38.537412, lng: 106.295471, type: 'medium_city', region: 'HEXI', troops: 10000,
        note: '兴庆府；大夏治所/重镇',
    },
    { id: 'city_lingju', name: '令居', factionId: 'guangwu', lat: 36.73, lng: 103.26, type: 'small_city', region: 'TIBET', troops: 10000, note: '辛武贤出令居讨羌大破罕羌' },



    { id: 'city_zuli', name: '祖厉', factionId: 'huizhou', lat: 36.56, lng: 104.68, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '祖厉；会州小城',
    },
    // ── 2026-06-11 新增：折墌（薛举西秦/薛仁杲据城）──
    { id: 'city_zhedi', name: '折墌', factionId: 'xiqin', lat: 35.5, lng: 107.94, type: 'pass', region: 'HEXI', troops: 10000, note: '薛仁杲据折墌城；薛举西秦第二据点' },

    // ── 2026-06-11 精锐部队缺口：新建据点 ──
    { id: 'city_jingling', name: '竟陵', factionId: 'ruochu', lat: 30.662, lng: 113.166, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '楚若敖氏旧地；若敖六卒（《左传》）' },
    { id: 'city_yunmeng', name: '云梦', factionId: 'mi_chu', lat: 31.02, lng: 113.75, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '云梦泽故地；楚左广与右广（《左传·宣公》）' },
    { id: 'city_daming', name: '大名', factionId: 'tianxiong', lat: 36.5138, lng: 115.3043, type: 'medium_city', region: 'CENTRAL', troops: 10000, note: '魏博节度使田承嗣治所；魏博牙兵' },
    { id: 'city_shizhu', name: '石柱', factionId: 'tujia_d', lat: 30, lng: 108.11, type: 'small_city', region: 'BASHU', troops: 10000, note: '秦良玉土司衙门；白杆兵成军出库地（川东近乡，不取辽东浑河）' },
    { id: 'city_bijie', name: '毕节', factionId: 'shuixi', lat: 27.302, lng: 105.285, type: 'small_city', region: 'BASHU', troops: 10000, note: '水西安氏土司治所；罗罗兵（奢香/安邦彦）' },
    { id: 'city_tianyang', name: '田阳', factionId: 'zhuang_d', lat: 23.72, lng: 106.65, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '瓦氏田州土官故里；标志战王江泾距嘉兴<50km未立城，据点取成军地' },
    { id: 'city_jingkou', name: '濡须口', factionId: 'wuwu_d', lat: 31.58, lng: 117.92, type: 'pass', region: 'JIANGNAN', troops: 10000, mirror: true, note: '濡须水入巢湖水口；曹魏与孙吴濡须之战古战场；邻无为州' },
    { id: 'city_liyang', name: '巨鹿', factionId: 'ranwei_d', lat: 37.22, lng: 115.04, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '冉魏迁巨鹿；黎阳过密冀南' },
    { id: 'city_ningyuan', name: '宁远', factionId: 'zu_d', lat: 40.618, lng: 120.72, type: 'small_city', region: 'NORTH', troops: 10000, note: '关宁铁骑，祖大寿宁远卫（今兴城）' },

    { id: 'city_salhu', name: '萨尔浒', factionId: 'manzhou', lat: 41.841, lng: 124.046, type: 'pass', region: 'NORTHEAST', troops: 10000, note: '满洲@萨尔浒；1619 白摆牙喇破明四路（≠后金国号@沈阳系）' },
    { id: 'city_wuchang', name: '武昌', factionId: 'sunwu_d', lat: 30.53, lng: 114.32, type: 'medium_city', region: 'JIANGNAN', troops: 10000, tier: 1, note: '孙吴武昌督治，与春秋吴姑苏区分' },
    { id: 'city_quwo', name: '曲沃', factionId: 'jin', lat: 35.631, lng: 111.474, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '晋国曲沃，太原让位柴周' },
    { id: 'city_tacheng', name: '塔城', factionId: 'dzungar', lat: 46.746, lng: 82.983, type: 'small_city', region: 'WESTERN', troops: 10000, note: '准噶尔汗国西北翼；伊犁让位锡伯营' },
    { id: 'city_hamiwei', name: '哈密卫', factionId: 'yiwu', lat: 42.83, lng: 93.51, type: 'small_city', region: 'WESTERN', troops: 10000, note: '草原环线西南锚点；文化西域' },
    { id: 'city_bieshibali', name: '别失八里', factionId: 'chagatai', lat: 43.988866, lng: 89.579773, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '别失八里；察合台小城',
    },
    { id: 'city_balikun', name: '巴里坤', factionId: 'pulei', lat: 43.6, lng: 93, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '巴里坤；蒲类小城',
    },
    { id: 'city_buergenjuntai', name: '布尔根', factionId: 'wulianghai', lat: 46.09, lng: 91.53, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '布尔根；乌梁海关隘',
    },
    { id: 'city_zhabuhanjuntai', name: '扎布汗', factionId: 'wuli_d', lat: 47.844489, lng: 94.174805, type: 'pass', region: 'STEPPE', troops: 10000, note: '乌里雅苏台将军辖区；策楞定边左副将军驻节' },
    { id: 'city_teerhunjuntai', name: '特尔浑', factionId: 'zubu', lat: 48.089107, lng: 99.538879, type: 'pass', region: 'STEPPE', troops: 10000,
        note: '特尔浑；阻卜关隘',
    },
    { id: 'city_woluduocheng', name: '窝鲁朵', factionId: 'huihu', lat: 47.698601, lng: 102.631531, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '窝鲁朵；回鹘小城',
    },
    { id: 'city_douweihunhe', name: '都尉溷河', factionId: 'kelie', lat: 47.859243, lng: 103.96637, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '都尉溷河；克烈部小城',
    },
    { id: 'city_xicheng', name: '息城', factionId: 'lelang', lat: 39.62, lng: 125.66, type: 'pass', region: 'KOREA', troops: 10000,
        note: '息城；乐浪关隘',
    },
    { id: 'city_qudiaoalan', name: '曲雕阿兰', factionId: 'borjigin', lat: 47.146753, lng: 109.204102, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '曲雕阿兰；孛儿只斤小城',
    },

    { id: 'city_bayanwula', name: '巴彦乌拉', factionId: 'donghu', lat: 44.53, lng: 117.6, type: 'small_city', region: 'STEPPE', troops: 10000, note: '东胡王恃强凌冒顿终为所灭' },
    { id: 'city_halagaitu2', name: '哈拉盖图', factionId: 'xingan', lat: 45.780925, lng: 119.245605, type: 'small_city', region: 'STEPPE', troops: 10000, note: '海兰察呼伦贝尔索伦兵' },
    { id: 'city_kuoyitian', name: '阔亦田', factionId: 'zhadalan', lat: 47.135705, lng: 115.290527, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '阔亦田；扎答兰小城',
    },
    { id: 'city_sangguer', name: '斡难河', factionId: 'zhuerqi', lat: 47.262466, lng: 110.717468, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '斡难河；主儿乞小城',
    },
    { id: 'city_bayantumen', name: '巴彦图门', factionId: 'chechen', lat: 48.053, lng: 114.538, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '巴彦图门；车臣小城',
    },
    { id: 'city_huzhan', name: '忽毡', factionId: 'zhaowu', lat: 40.248096, lng: 69.658813, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '忽毡；昭武小城',
    },
    { id: 'city_aoshen', name: '奥什', factionId: 'kala', lat: 40.53, lng: 72.79, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '奥什；喀喇汗王朝小城',
    },
    { id: 'city_dawushenkate', name: '三重城', factionId: 'wensu', lat: 41.13, lng: 82.78, type: 'small_city', region: 'WESTERN', troops: 10000, note: '温宿国王城常备武装' },
    { id: 'city_kungang', name: '昆岗', factionId: 'adao_d', lat: 40.54, lng: 81.26, type: 'pass', region: 'WESTERN', troops: 10000, note: '清代阿克苏道昆岗军台；南疆驿路要冲' },
    { id: 'city_mazhatage', name: '麻扎塔格', factionId: 'pisha', lat: 38.58, lng: 80.8, type: 'pass', region: 'WESTERN', troops: 10000,
        note: '麻扎塔格；毗沙关隘',
    },
    { id: 'city_yutian2', name: '于阗', factionId: 'yuchi', lat: 37.1, lng: 79.92, type: 'medium_city', region: 'WESTERN', troops: 10000,
        note: '于阗；尉迟治所/重镇',
    },
    { id: 'city_yumi', name: '阿赫雅尔', factionId: 'yumi', lat: 36.85, lng: 81.65, type: 'small_city', region: 'WESTERN', troops: 10000, note: '扜弥国王都常备军' },
    { id: 'city_keliyashankou', name: '阿什库尔', factionId: 'keliya', lat: 35.45, lng: 81.1, type: 'pass', region: 'TIBET', troops: 10000, note: '尉迟曜于阗王助唐守克里雅山口' },
    { id: 'city_longmucuo', name: '龙木错', factionId: 'yangtong', lat: 34.572168, lng: 80.348511, type: 'small_city', region: 'TIBET', troops: 10000, note: '赤松德赞征羊同驻龙木错' },
    { id: 'city_gadake', name: '噶大克', factionId: 'ali', lat: 31.940459, lng: 80.139771, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '噶大克；阿里小城',
    },

    { id: 'city_payangyi', name: '帕羊驿', factionId: 'supi', lat: 30.140235, lng: 83.28186, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '帕羊驿；苏毗小城',
    },
    { id: 'city_saga', name: '萨噶', factionId: 'faqiang', lat: 29.33, lng: 85.23, type: 'small_city', region: 'TIBET', troops: 10000, note: '论钦陵征服发羌驻萨噶' },

    { id: 'city_sajia', name: '萨迦', factionId: 'khon', lat: 29.101759, lng: 87.665405, type: 'small_city', troops: 10000,
        
        note: '萨迦；萨迦昆小城', region: 'TIBET' },
    { id: 'city_sangzhuzi', name: '桑珠孜', factionId: 'tsangpa', lat: 29.303155, lng: 88.862915, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '桑珠孜；藏巴汗小城',
    },

    { id: 'city_jiamachikang', name: '甲玛赤康', factionId: 'spurgyal', lat: 29.74, lng: 91.7, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '甲玛赤康；悉补野小城',
    },
    { id: 'city_juemuzong', name: '觉木宗', factionId: 'niang', lat: 29.571086, lng: 94.476929, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '觉木宗；觉木宗小城',
    },
    { id: 'city_galangzong', name: '噶朗宗', factionId: 'galangdiba', lat: 29.86, lng: 95.77, type: 'small_city', region: 'TIBET', troops: 10000, note: '旺钦顿堆波密土王抗清' },
    { id: 'city_mangkangzong', name: '芒康宗', factionId: 'fuguo', lat: 29.67, lng: 98.59, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '芒康宗；附国小城',
    },
    { id: 'city_adunzi', name: '阿墩子', factionId: 'bailang', lat: 28.48, lng: 98.85, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '阿墩子；白狼小城',
    },
    { id: 'city_dayan', name: '大研', factionId: 'mu_lijiang', lat: 26.87, lng: 100.22, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '大研；木氏小城',
    },
    { id: 'city_tengyuecheng', name: '腾越城', factionId: 'pingnan', lat: 25.02, lng: 98.48, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '腾越城；平南小城',
    },
    { id: 'city_mengmao', name: '勐卯', factionId: 'luchuan', lat: 24.01, lng: 97.85, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '勐卯；麓川小城',
    },
    { id: 'city_xiwanjin', name: '悉万斤', factionId: 'yada', lat: 36.66, lng: 65.75, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '悉万斤；嚈哒帝国小城',
    },
    { id: 'city_hunduduo', name: '昏度多', factionId: 'humi', lat: 37.022272, lng: 72.627869, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '昏度多；瓦罕小城',
    },
    { id: 'city_puticheng', name: '菩提城', factionId: 'xiaobolu', lat: 35.3, lng: 75.64, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '菩提城；勃律小城',
    },
    { id: 'city_kajier', name: '喀吉尔', factionId: 'jiashi', lat: 34.55, lng: 76.13, type: 'small_city', region: 'TIBET', troops: 10000, note: '李玄策调克什米尔兵为唐征吐蕃' },
    { id: 'city_zhaburang2', name: '札布让', factionId: 'guge', lat: 31.496599, lng: 79.799194, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '札布让；古格小城',
    },
    { id: 'city_jiangzi', name: '江孜', factionId: 'pazhu', lat: 28.92, lng: 89.59, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '江孜；帕竹小城',
    },
    { id: 'city_linqiong', name: '临邛', factionId: 'zhuoshi', lat: 30.4149, lng: 103.4619, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '临邛；卓氏小城',
    },
    { id: 'city_yandao', name: '严道', factionId: 'qingyi', lat: 30.000133, lng: 102.972107, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '严道；青衣小城',
    },
    { id: 'city_qingxiguan', name: '清溪关', factionId: 'zuo_d', lat: 29.3667, lng: 102.6333, type: 'pass', region: 'DIANQIAN', troops: 10000, tier: 2,
        note: '清溪关；笮人关隘',
    },
    { id: 'city_yuegui', name: '越嶲', factionId: 'yueyi', lat: 28.422864, lng: 102.680969, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '越嶲；越夷小城',
    },
    { id: 'city_huichuan', name: '会川', factionId: 'kunming_yi', lat: 26.6545, lng: 102.2454, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '卤承率昆明夷斩哀牢王封侯' },

    { id: 'city_chenzhou2', name: '沅陵', factionId: 'chenzhou_d', lat: 28.227028, lng: 110.291748, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '沅陵；辰州小城',
    },
    { id: 'city_yuanzhou', name: '芷江', factionId: 'qianzhong', lat: 27.566688, lng: 109.909973, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '芷江；沅州小城',
    },
    { id: 'city_puding', name: '普定', factionId: 'yelang', lat: 26.25, lng: 105.93, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '普定；夜郎小城',
    },
    { id: 'city_shengjingguan', name: '胜境关', factionId: 'zangke', lat: 25.651438, lng: 104.350891, type: 'pass', region: 'LINGNAN', troops: 10000,
        note: '胜境关；牂牁关隘',
    },
    { id: 'city_weixian2', name: '曲靖', factionId: 'cuanshi', lat: 25.49, lng: 103.79, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '曲靖；爨族小城',
    },
    { id: 'city_weichu', name: '威楚', factionId: 'baiman', lat: 25.045791, lng: 101.574097, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '高升泰平杨义贞复大理' },
    { id: 'city_tuodongcheng', name: '滇池', factionId: 'dianguo', lat: 25.05, lng: 102.7, type: 'small_city', troops: 10000, tier: 1, region: 'DIANQIAN', note: '滇国都城；滇池兵' },
    { id: 'city_luoxiong', name: '罗雄', factionId: 'xinggu', lat: 24.769307, lng: 104.224548, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '罗雄；兴古小城',
    },
    { id: 'city_wanwen', name: '宛温', factionId: 'nanzhong', lat: 25.09, lng: 104.89, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '宛温；南中小城',
    },
    { id: 'city_cangwu', name: '苍梧', factionId: 'guangxin', lat: 23.47, lng: 111.31, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '苍梧；广信小城',
    },
    {
        id: 'city_panyu',
        name: '番禺',
        factionId: 'guangzhou',
        lat: 23.12,
        lng: 113.26,
        type: 'big_city',
        troops: 20000,
        tier: 0,
        region: 'LINGNAN',
        note: '广州府治番禺；刘隐清海军节度故地（《旧唐书·刘隐传》）' },
    { id: 'city_longchuan', name: '龙川', factionId: 'nanyue', lat: 24.1, lng: 115.26, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '赵佗为龙川令；南越龙兴之地' },
    { id: 'city_kuaiji', name: '会稽', factionId: 'yue', lat: 29.987, lng: 120.582, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '越国都城；lat 南微调 0.01° 与临安间距≥50km' },
    { id: 'city_luling', name: '庐陵', factionId: 'ouyang', lat: 27.1133, lng: 114.9806, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '吉州治庐陵；欧阳頠世居，梁庐陵蛮兵' },
    { id: 'city_hongzhou', name: '豫章', factionId: 'hongzhou', lat: 28.68, lng: 115.88, type: 'medium_city', region: 'JIANGNAN', troops: 10000,
        note: '豫章；洪州治所/重镇',
    },

    { id: 'city_qingliuguan', name: '清流关', factionId: 'chuzhou_d', lat: 32.28, lng: 118.25, type: 'pass', region: 'JIANGNAN', troops: 10000, mirror: true,
        note: '清流关；滁州关隘',
    },
    { id: 'city_zhongli', name: '盱眙', factionId: 'huai', lat: 33.011, lng: 118.497, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '淮州治盱眙' },
    { id: 'city_bianliang', name: '汴梁', factionId: 'wei', lat: 34.8, lng: 114.31, type: 'big_city', region: 'CENTRAL', troops: 20000, tier: 0, note: '北宋京师；20城白名单' },
    { id: 'city_shangluo', name: '商邑', factionId: 'shangzhou', lat: 33.87, lng: 109.94, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '商邑；商州小城',
    },
    { id: 'city_shicheng', name: '郊郢', factionId: 'ying', lat: 31.16, lng: 112.58, type: 'pass', region: 'JIANGNAN', troops: 10000, note: '楚郢郊郢故址（荆门）；梁郢州曹景宗名片（治所夏口，据点取郢名沾边）' },
    { id: 'city_baling', name: '巴陵', factionId: 'yue_d', lat: 29.35, lng: 113.13, type: 'medium_city', region: 'JIANGNAN', troops: 10000, note: '岳州治所，湖广重镇，2026-06-18 升为中城' },
    { id: 'city_linzheng', name: '临烝', factionId: 'heng', lat: 26.89, lng: 112.6, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '岭南/南方环线共用锚点；文化南方' },
    { id: 'city_guiyang', name: '桂阳', factionId: 'chen2', lat: 25.78, lng: 113, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '赵范守桂阳降刘备' },
    { id: 'city_qujiang', name: '韶关', factionId: 'shaozhou', lat: 24.8, lng: 113.59, type: 'pass', troops: 10000, region: 'LINGNAN', note: '韶州治；张镇孙南宋末抗元，殉国大庾岭（1278）' },
    { id: 'city_bodao', name: '珙县', factionId: 'boren', lat: 28.76, lng: 104.62, type: 'small_city', region: 'BASHU', troops: 10000, note: '僰人悬棺故地；阿大僰人起事（僰道旧称，避旗号防重）' },
    { id: 'city_nanpu', name: '南浦', factionId: 'wanzhou', lat: 30.82, lng: 108.38, type: 'small_city', region: 'BASHU', troops: 10000,
        note: '南浦；万州小城',
    },
    { id: 'city_baidicheng2', name: '白帝城', factionId: 'kui', lat: 31.043, lng: 109.57, type: 'pass', region: 'BASHU', troops: 10000, note: '夔门·白帝城；刘备白毦兵永安托孤' },
    { id: 'city_qichun', name: '蕲春', factionId: 'xushouhui', lat: 30.23, lng: 115.45, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '元末徐寿辉天完政权龙兴地（蕲水/蕲春）' },
    { id: 'city_wancheng', name: '皖城', factionId: 'wan', lat: 30.51, lng: 117.04, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '皖城；舒州小城',
    },

    { id: 'city_jiuzi', name: '鸠兹', factionId: 'danyang', lat: 31.33, lng: 118.38, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '鸠兹；宣州小城',
    },
    { id: 'city_datong2', name: '大通', factionId: 'chizhou', lat: 30.8188, lng: 117.7762, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '大通；池州小城',
    },

    // ── 2026-05-30 新增：哈拉和林(蒙古帝国首都) ──
    {
        id: 'city_karakorum',
        name: '哈拉和林',
        factionId: 'menggu_d',
        lat: 47.137441,
        lng: 103.035278,
        type: 'big_city',
        troops: 20000,
        tier: 0,
        
        note: '蒙古帝国哈拉和林', region: 'STEPPE' },
    { id: 'city_xingzhuting', name: '星主厅', factionId: 'danluo', lat: 33.5131, lng: 126.5215, type: 'small_city', region: 'KOREA', troops: 10000, note: '南方/日本/朝鲜环线共用锚点；文化朝鲜（济州）' },
    { id: 'city_deokwon', name: '德源', factionId: 'donghui', lat: 39.54, lng: 127.24, type: 'pass', region: 'KOREA', troops: 10000, note: '朝鲜德源郡旧地；咸兴—平壤道关隘；≠黑龙江双城' },
    { id: 'city_yuezhi', name: '大木岳', factionId: 'chen3', lat: 36.8353, lng: 127.0417, type: 'pass', region: 'KOREA', troops: 10000,
        note: '大木岳；欢州关隘',
    },
    { id: 'city_heseluo', name: '何瑟罗', factionId: 'hui', lat: 37.75, lng: 128.89, type: 'small_city', region: 'KOREA', troops: 10000, note: '不耐侯濊族君长驻何瑟罗' },
    { id: 'city_wushecheng', name: '乌舍城', factionId: 'wula', lat: 45.821125, lng: 128.161011, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '乌拉部乌舍城故地（布占泰）' },

    { id: 'city_xianping', name: '咸平', factionId: 'houliao', lat: 42.579367, lng: 124.07959, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '咸平；后辽小城',
    },
    { id: 'city_xupin', name: '恤品', factionId: 'dazhen', lat: 42.994587, lng: 129.828186, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '恤品；大真关隘',
    },
    { id: 'city_huifa', name: '辉发', factionId: 'haixi_nvzhen', lat: 42.70463, lng: 125.922546, type: 'pass', region: 'NORTHEAST', troops: 10000,
        note: '辉发；海西关隘',
    },

    { id: 'city_julunbo', name: '俱轮泊', factionId: 'shiwei', lat: 49.251593, lng: 118.262329, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '俱轮泊；室韦小城',
    },
    { id: 'city_boli2', name: '勃利', factionId: 'mohe', lat: 48.48, lng: 135.07, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '勃利；靺鞨小城',
    },
    { id: 'city_kuanchengzi', name: '宽城子', factionId: 'jilin', lat: 43.8725, lng: 125.3595, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '宽城子；吉林小城',
    },
    { id: 'city_wuliyasitai', name: '乌珠穆沁', factionId: 'wuzhumuqin', lat: 45.519, lng: 116.9604, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '乌珠穆沁；乌珠穆沁小城',
    },
    { id: 'city_saihantala', name: '赛汉塔拉', factionId: 'sunite', lat: 42.7701, lng: 112.6099, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '赛汉塔拉；苏尼特小城',
    },
    { id: 'city_sailan', name: '讹答剌', factionId: 'dayuzi', lat: 42.2863, lng: 69.5709, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '讹答剌；大玉兹小城',
    },
    { id: 'city_hakone', name: '箱根关', factionId: 'sagami', lat: 35.1925, lng: 139.0261, type: 'pass', region: 'JAPAN', troops: 10000, note: '天下第一关，关东的物理大门' },
    { id: 'city_fuwa', name: '不破关', factionId: 'mino', lat: 35.3577, lng: 136.4602, type: 'pass', region: 'JAPAN', troops: 10000, note: '关原所在地，畿内防御东国大军的终极险地' },
    { id: 'city_cheollyeong', name: '铁岭关', factionId: 'ssangseong', lat: 38.8102, lng: 127.4959, type: 'pass', region: 'KOREA', troops: 10000, note: '引爆威化岛回军，终结高丽王朝命脉' },
    { id: 'city_saiyinshanda', name: '薛灵哥', factionId: 'wuliangha', lat: 49.437762, lng: 101.428528, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '兀良哈部故地；者勒蔑' },
    { id: 'city_saiyinsanda', name: '赛音山达', factionId: 'nuoyan_d', lat: 44.8870, lng: 110.1407, type: 'pass', region: 'STEPPE', troops: 10000, note: '赛音诺颜部牧地；喀尔喀中路（《清史稿·藩部传》）' },
    { id: 'city_temermen', name: '特尔门', factionId: 'heisha_d', lat: 48.7386, lng: 97.8387, type: 'small_city', region: 'STEPPE', troops: 10000, note: '土拉河支流；漠北牧地，近后突厥黑沙道（与黑沙城同系北疆要冲）' },
    { id: 'city_yancheng2', name: '郾城', factionId: 'yanchuan_d', lat: 33.58, lng: 114.03, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '郾城；郾川小城',
    },
    { id: 'city_xuanhu', name: '汝南', factionId: 'yuan_cj_d', lat: 33.01, lng: 114.36, type: 'medium_city', region: 'CENTRAL', troops: 10000,
        note: '汝南；袁氏治所/重镇',
    },
    {
        id: 'city_yiluolucheng',
        name: '伊逻卢',
        factionId: 'qiuci',
        lat: 41.72, lng: 82.93, type: 'medium_city', troops: 10000, tier: 1, 
        note: '伊逻卢；龟兹治所/重镇', region: 'WESTERN' },
    { id: 'city_yuergun', name: '玉尔滚', factionId: 'weiwuer', lat: 41.35, lng: 81.3, type: 'small_city', region: 'WESTERN', troops: 10000, note: '伯克统领回部治安武装' },
    { id: 'city_bohuancheng', name: '拨换城', factionId: 'anxi', lat: 41.17, lng: 80.25, type: 'small_city', region: 'WESTERN', troops: 10000, note: '唐安西都护府四镇要冲；怛罗斯道拨换城' },
    { id: 'city_dashicheng', name: '大石城', factionId: 'zhuxie', lat: 41.28, lng: 79.22, type: 'pass', region: 'WESTERN', troops: 10000,
        note: '大石城；朱邪关隘',
    },
    { id: 'city_weitoucheng', name: '阿合奇', factionId: 'weitou', lat: 40.3, lng: 79.05, type: 'small_city', region: 'WESTERN', troops: 10000, note: '尉头国王城驻军' },
    { id: 'city_wosedecheng', name: '握瑟德', factionId: 'sai', lat: 39.77, lng: 78.56, type: 'small_city', region: 'WESTERN', troops: 10000, note: '塞种部落骑射武装' },
    { id: 'city_jiaseni', name: '哥疾宁', factionId: 'jiazini', lat: 33.55, lng: 68.42, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 1,
        note: '哥疾宁；伽色尼治所/重镇',
    },
    { id: 'city_bosite', name: '博斯特', factionId: 'xisi', lat: 31.5833, lng: 64.3600, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '赫尔曼德河畔博斯特；萨法尔王朝起兵之地' },
    { id: 'city_fala', name: '法拉', factionId: 'delan', lat: 32.3700, lng: 62.1100, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '古德兰吉亚省法拉河畔要塞；苏伦家族世袭领地' },
    { id: 'city_taibade', name: '泰巴德', factionId: 'baha', lat: 34.7763, lng: 60.7764, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '巴哈尔兹区泰巴德' },
    { id: 'city_salahesi', name: '萨拉赫斯', factionId: 'hali', lat: 36.5449, lng: 61.1577, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '哈里河畔萨拉赫斯；丹达纳克战场' },
    { id: 'city_tusi', name: '图斯', factionId: 'kalan', lat: 36.4833, lng: 59.5167, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '古图斯；卡伦家族领地' },
    { id: 'city_kandaha', name: '坎大哈', factionId: 'dulan_d', lat: 31.6289, lng: 65.7372, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, note: '杜兰尼帝国第一首都；艾哈迈德沙阿1747年在此加冕为阿富汗王' },
    { id: 'city_helate', name: '赫拉特', factionId: 'huluo', lat: 34.3419, lng: 62.2031, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, note: '呼罗珊四大名城；阿布·穆斯林阿拔斯革命策源地' },
    { id: 'city_nishabuer', name: '尼沙布尔', factionId: 'aba', lat: 36.2133, lng: 58.7958, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, note: '萨珊阿巴尔沙赫尔省治；沙普尔一世敕建' },
    { id: 'city_gaofu', name: '迦毕试', factionId: 'jibin', lat: 34.5500, lng: 69.2000, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 10000, tier: 1,
        note: '迦毕试/喀布尔；罽宾（Kapisa）王治，丘就却统一五部贵霜后东进兴都库什重镇',
    },
    { id: 'city_fanyanna', name: '巴米扬', factionId: 'fanyanna', lat: 34.8659, lng: 67.9807, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '巴米扬；梵衍那小城',
    },
    { id: 'city_paixiucheng', name: '排修城', factionId: 'juandu', lat: 39.48, lng: 76.72, type: 'small_city', region: 'WESTERN', troops: 10000,
        note: '排修城；捐毒国小城',
    },
    { id: 'city_daerhan', name: '达尔罕', factionId: 'keerqin', lat: 43.6064, lng: 122.2229, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '达尔罕；科尔沁小城',
    },
    { id: 'city_yiyang', name: '葛溪', factionId: 'xie_cj_d', lat: 28.3524, lng: 117.4466, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '葛溪；信州小城',
    },
    { id: 'city_linchuan', name: '临川', factionId: 'fu2', lat: 27.9779, lng: 116.3562, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '抚州治临川；陈周迪据守，临川郡兵' },
    { id: 'city_binzhou2', name: '新平', factionId: 'xinping', lat: 35.03, lng: 108.08, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '新平；新平小城',
    },
    { id: 'city_fangqu', name: '方渠', factionId: 'huan', lat: 36.58, lng: 107.3, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '方渠；环州小城',
    },
    { id: 'city_jingsai', name: '静塞', factionId: 'wei2', lat: 37.448637, lng: 106.6745, type: 'pass', region: 'HEXI', troops: 10000, mirror: true,
        note: '静塞；静塞关隘',
    },//镜像
    { id: 'city_lingzhou', name: '回乐', factionId: 'lingwu', lat: 37.998341, lng: 106.295471, type: 'small_city', region: 'HEXI', troops: 10000,
        note: '回乐；灵武小城',
    },
    { id: 'city_nuergan', name: '特林', factionId: 'nuergan', lat: 52.92, lng: 139.77, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '特林；奴儿干小城',
    },
    { id: 'city_pennuli', name: '盆奴里', factionId: 'nifuhe', lat: 47.708134, lng: 130.933685, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '盆奴里；尼夫小城',
    },
    // 古尔王朝（Ghurids）呼罗珊边缘要塞
    { id: 'city_malulude', name: '马尔夫鲁德', factionId: 'muer', lat: 35.5833, lng: 63.3167, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000,
        note: '马尔夫鲁德/小木鹿；穆尔加布河畔要塞',
    },
    // 巴达赫尚（Badakhshan）山地政权
    { id: 'city_pengdi', name: '彭迪', factionId: 'maer_d', lat: 36, lng: 62.7, type: 'pass', region: 'CENTRAL_ASIA', troops: 10000, note: '马尔吉亚纳(Margiana)穆尔加布河下游绿洲；波斯至萨珊东北边镇（彭迪城）' },
    // 黠戛斯（坚昆）汗庭漠北牧地
    { id: 'city_wubusabo', name: '乌布萨泊', factionId: 'xiajiasi', lat: 49.9762, lng: 92.0929, type: 'small_city', region: 'STEPPE', troops: 10000,
        note: '乌布萨泊；坚昆小城',
    },
    { id: 'city_zhenzhuhe', name: '真珠河', factionId: 'wuhu', lat: 41.2773, lng: 67.9312, type: 'pass', region: 'CENTRAL_ASIA', troops: 10000, mirror: true,
        note: '真珠河；乌护关隘',
    },//镜像
    { id: 'city_wuyun', name: '乌云', factionId: 'hezhe', lat: 49.018048, lng: 129.91539, type: 'small_city', region: 'NORTHEAST', troops: 10000,
        note: '乌云；赫哲小城',
    },
    // 占城国（林邑/环王国）佛临城阇槃；与占婆国（美山）分立，各 1 势力 1 据点
    { id: 'city_dupan', name: '阇槃', factionId: 'zhancheng', lat: 13.93, lng: 109.11, type: 'medium_city', troops: 10000, 
        note: '阇槃；占城治所/重镇', region: 'LINGNAN' },
    // 孟邦墨侬族故地
    { id: 'city_bangdun', name: '邦敦', factionId: 'monong', lat: 12.87, lng: 107.8, type: 'small_city', troops: 10000,
        note: '邦敦；墨侬小城', region: 'LINGNAN' },
    // 水真腊南境部族
    { id: 'city_sanpu', name: '三菩', factionId: 'shuizhen', lat: 12.77, lng: 105.97, type: 'small_city', troops: 10000,
        note: '三菩；水真小城', region: 'LINGNAN' },
    { id: 'city_juyansai', name: '居延塞', factionId: 'ningkou', lat: 41.8942, lng: 101.044, type: 'pass', region: 'HEXI', troops: 10000,
        note: '居延塞；宁寇关隘',
    },
    { id: 'city_gongzhubao', name: '公主堡', factionId: 'kepantuo', lat: 37.2008, lng: 75.3745, type: 'pass', troops: 10000, 
        note: '公主堡；渴盘陀关隘', region: 'WESTERN' },
    { id: 'city_jimai', name: '吉麦', factionId: 'gongtang', lat: 29.3012, lng: 90.6812, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '吉麦；贡唐小城',
    },
    // ── 2026-06-11 新增：库页岛民族据点 ──
    { id: 'city_nuotuoluo', name: '诺托罗', factionId: 'eluoke', lat: 49.2, lng: 143.1, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '库页岛东岸中部河口，鄂罗克渔猎放牧聚散中心' },
    { id: 'city_baizhu', name: '白主', factionId: 'kuye', lat: 46.71, lng: 142.52, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '库页岛南部白主土城，元代征骨嵬遗址，库页族核心聚落' },
    { id: 'city_bailao', name: '白老', factionId: 'ayinu', lat: 42.55, lng: 141.36, type: 'small_city', region: 'JAPAN', troops: 10000, note: '北海道南端据泊地方，阿伊努传统聚落（白老古名）' },
    { id: 'city_zonggu', name: '宗谷', factionId: 'beihai', lat: 45.5, lng: 141.93, type: 'small_city', region: 'JAPAN', troops: 10000, note: '宗谷海峡界城；日本—库页（白主）水陆枢纽；地名江户期可考' },
    { id: 'city_xierka', name: '锡尔喀', factionId: 'dongping', lat: 46.9, lng: 134.1, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '郎坦东平戍卒锡尔喀' },
    { id: 'city_niman', name: '尼满', factionId: 'wure', lat: 45.51, lng: 131.96, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '兀惹部乌昭度居地（《辽史》）' },
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境据点 ──
    { id: 'city_nibuchu', name: '尼布楚', factionId: 'ewenki', lat: 51.99, lng: 116.58, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '黑龙江上游尼布楚河；水达达部聚居地' },
    { id: 'city_yakesa', name: '雅克萨', factionId: 'aola', lat: 53.39056, lng: 124.0775, type: 'pass', region: 'NORTHEAST', troops: 10000, note: '黑龙江与额木尔河汇口，达斡尔敖拉氏故地（《朔方备乘》）' },
    { id: 'city_geerbiqi', name: '格尔必齐', factionId: 'maomingan', lat: 53.33, lng: 121.45, type: 'small_city', region: 'NORTHEAST', troops: 10000, note: '茂明安部游牧地；格尔必齐河口（《尼布楚条约》界河）' },
    { id: 'city_shilekahe', name: '石勒喀河', factionId: 'bulat', lat: 51.7321, lng: 115.8151, type: 'small_city', region: 'STEPPE', troops: 10000, note: '石勒喀河（黑龙江上游），清代舆图所称斡难河源段，布拉特等部游牧地' },
    { id: 'city_chita', name: '赤塔', factionId: 'buriat', lat: 52.0333, lng: 113.5017, type: 'small_city', region: 'STEPPE', troops: 10000, note: '布里亚特酋长统林中射手世居赤塔' },
    { id: 'city_yangjigan', name: '养吉干', factionId: 'xianhai', lat: 45.6, lng: 62, type: 'pass', region: 'CENTRAL_ASIA', troops: 10000, note: '中亚环线锚点；锡尔河入咸海处要塞，花剌子模东北边境' },
    { id: 'city_zhande', name: '毡的', factionId: 'wugu_d', lat: 44.85, lng: 65.5, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '锡尔河下游 Jand/哲德；乌古斯叶护国王庭（图格里勒1040年代兴起之地）' },
    // ── 2026-06-11 新增：琉球/台湾据点（叛军旗）──
    { id: 'city_mengjia', name: '艋舺', factionId: 'ketagalan', lat: 25.03, lng: 121.5, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '清代台北府淡水厅南境要地，万华故称艋舺' },
    { id: 'city_diaoyudao', name: '钓鱼岛', factionId: 'haikou', lat: 25.75, lng: 123.5, type: 'small_city', region: 'LINGNAN', troops: 10000, note: '南方/日本环线共用锚点；南方环线所称钓鱼岛城即本据点；明清海图及《隋书·流求国传》等见载' },
    { id: 'city_gugudao', name: '宫古岛', factionId: 'gonggu', lat: 24.805, lng: 125.281, type: 'small_city', region: 'JAPAN', troops: 10000, note: '琉球宫古诸岛主岛，见《中山世谱》及明清海图' },
    { id: 'city_qihe', name: '七河', factionId: 'qincha', lat: 44.2219, lng: 64.3332, type: 'small_city', region: 'CENTRAL_ASIA', troops: 10000, note: '钦察汗国七河草原核心带' },
    { id: 'city_shwebo', name: '瑞波', factionId: 'konbaung', lat: 22.5697, lng: 95.6981, type: 'small_city', region: 'DIANQIAN', troops: 10000, note: '贡榜龙兴之地；贡榜禁军' },
    { id: 'city_hengyu', name: '横屿', factionId: 'qi_d', lat: 26.77, lng: 119.7, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '嘉靖横屿大捷古战场；戚家军藤牌灭倭标志战' },
    { id: 'city_luobo', name: '罗博', factionId: 'buyi_d', lat: 25.4112, lng: 106.7377, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '罗博；布依族小城',
    },
    { id: 'city_situo', name: '思陀', factionId: 'hani_d', lat: 23.2243, lng: 102.8485, type: 'small_city', region: 'DIANQIAN', troops: 10000,
        note: '思陀；哈尼小城',
    },
    { id: 'city_shangding', name: '上丁', factionId: 'basha_d', lat: 13.5581, lng: 106.0098, type: 'small_city', region: 'LINGNAN', troops: 10000,
        note: '上丁；巴沙小城',
    },
    // ── 2026-06-12 新增：夏顿@廷布 ──
    { id: 'city_tingbu', name: '廷布', factionId: 'xiadun', lat: 27.472, lng: 89.639, type: 'small_city', region: 'TIBET', troops: 10000, note: '夏仲阿旺朗杰1616年统一不丹后定夏季都城；清史及藏文史籍称布鲁克巴政教合一政权' },
    { id: 'city_huangchuan', name: '弋阳', factionId: 'huang_d', lat: 32.131, lng: 115.051, type: 'small_city', region: 'JIANGNAN', troops: 10000,
        note: '弋阳；黄国小城',
    },
    { id: 'city_yongqiu', name: '雍丘', factionId: 'qiguo_d', lat: 34.55, lng: 114.78, type: 'small_city', region: 'CENTRAL', troops: 10000,
        note: '雍丘；杞国小城',
    },
    { id: 'city_mengcheng', name: '蒙城', factionId: 'mengcheng_d', lat: 33.27, lng: 116.56, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '汉沛郡山桑县治地；唐天宝改蒙城县；庄子故里（有争议）' },
    { id: 'city_yongcheng', name: '永城', factionId: 'guide_d', lat: 33.93, lng: 116.37, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '归德府辖；芒砀山/汉高潜居；走廊东翼' },
    { id: 'city_kunyang', name: '昆阳', factionId: 'lulin', lat: 33.22, lng: 113.22, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '昆阳故城（叶县北）；绿林—刘秀昆阳之战' },
    { id: 'city_yucheng', name: '虞城', factionId: 'dang_d', lat: 34.7758, lng: 116.0678, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '汉砀郡属/虞国故地；豫东商丘东翼' },
    { id: 'city_bengbu', name: '蚌埠', factionId: 'hao_d', lat: 32.92, lng: 117.38, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '濠州治钟离故地；淮滨津渡（今蚌埠）' },
    { id: 'city_liaocheng', name: '聊城', factionId: 'bozhou_d', lat: 36.4322, lng: 115.9552, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '隋唐博州治；春秋聊城邑' },
    { id: 'city_sapi', name: '萨毗城', factionId: 'gar', lat: 37.63147, lng: 88.884888, type: 'small_city', region: 'TIBET', troops: 10000,
        note: '萨毗城；噶尔氏小城',
    },
    { id: 'city_shayuan', name: '长宁', factionId: 'tongzhou', lat: 35.0032, lng: 109.9319, type: 'small_city', region: 'CENTRAL', troops: 10000, note: '大荔沙苑；西魏沙苑之战古战场；唐沙苑监牧马地；同州治' },
    { id: 'city_gasikou', name: '噶斯口', factionId: 'qinghai', lat: 38.078345, lng: 89.288635, type: 'pass', region: 'TIBET', troops: 10000, mirror: true, note: '岳钟琪出噶斯口平罗卜藏丹津' },
    { id: 'city_niubiziliang', name: '牛鼻子梁', factionId: 'golog', lat: 37.838198, lng: 91.678162, type: 'pass', region: 'TIBET', troops: 10000, mirror: true, note: '柴达木东缘驿路隘口；果洛北牧道要冲' },
    { id: 'city_mahaitai', name: '马海台', factionId: 'xining', lat: 38.045995, lng: 94.622498, type: 'pass', region: 'TIBET', troops: 10000, mirror: true, note: '杨应琚西宁道整顿边军' },
    { id: 'city_taijinaier', name: '台吉乃尔', factionId: 'dulan', lat: 36.4266, lng: 94.896, type: 'pass', region: 'TIBET', troops: 10000, note: '柴达木台吉乃尔' },
    { id: 'city_bayinbulage', name: '巴音布拉格', factionId: 'juyan_d', lat: 41.3775, lng: 102.9694, type: 'small_city', region: 'HEXI', troops: 10000, note: '戈壁泉地；汉居延县/居延塞防线；李陵率荆楚五千步卒由此出塞（《史记·李将军列传》）' },
    { id: 'city_gasinaoer', name: '尕斯淖尔', factionId: 'kalun', lat: 38.3593, lng: 90.1334, type: 'pass', mirror: true, region: 'TIBET', troops: 10000, note: '德兴阿卡伦侍卫驻尕斯淖尔' },
    { id: 'city_jieqiao', name: '界桥', factionId: 'qu_d', lat: 36.95, lng: 115.5, type: 'pass', region: 'NORTH', troops: 10000, note: '麴义先登死士破公孙瓒白马义从（192年）' },
    { id: 'city_hakone', name: '箱根关', factionId: 'sagami', lat: 35.1925, lng: 139.0261, type: 'pass', region: 'JAPAN', troops: 10000, note: '天下第一关，关东的物理大门' },
    { id: 'city_fuwa', name: '不破关', factionId: 'mino', lat: 35.3577, lng: 136.4602, type: 'pass', region: 'JAPAN', troops: 10000, note: '关原所在地，畿内防御东国大军的终极险地' },
    { id: 'city_cheollyeong', name: '铁岭关', factionId: 'ssangseong', lat: 38.8102, lng: 127.4959, type: 'pass', region: 'KOREA', troops: 10000, note: '引爆威化岛回军，终结高丽王朝命脉' },
    { id: 'city_saiyinshanda', name: '薛灵哥', factionId: 'wuliangha', lat: 49.437762, lng: 101.428528, type: 'pass', troops: 10000 },
    { id: 'city_biaoshi', name: '表氏', factionId: 'juqu_d', lat: 39.8, lng: 99.8, type: 'small_city', region: 'HEXI', troops: 10000, note: '汉酒泉郡表氏县；沮渠卢水胡故地' },
    { id: 'city_penghu', name: '澎湖', factionId: 'wenling', lat: 23.5, lng: 119.5, type: 'small_city', region: 'JIANGNAN', troops: 10000, note: '施琅福建水师' },
];