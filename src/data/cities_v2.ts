/**
 * cities_v2.ts — 重构版城市数据
 *
 * 架构原则:
 * - T0 大城 (big_city): 见 AGENTS.md §六（符合累计国都年≥92年或人口≥50万地标）
 * - T1 中城 (medium_city): 现代省会 + 朝代府治 — 待补充
 * - T2 关隘/要塞 (pass): 战略要冲 — 渡口据点归入 small_city
 * - 周边: 日本七道、朝鲜八道、各古代政权首都 — 待补充
 *
 * 命名原则:
 * - 历史大乱斗游戏, 使用各城市最有知名度的名字
 * - 朝代切换时, 通过 historicalNames 数组 (待实现) 动态改名
 *
 * 距离约束 (来自 cities.ts / AGENTS §2.1 / §2.1.1):
 * - 全图任意两据点距离 >= 50km
 * - 新建/改坐标前 --probe：与最近已有城须 <= 500km（禁止孤悬远点）
 * - 已校验所有 T0 之间满足
 *
 * 14 区文化中心 (14 城, 见 RegionSystem.REGION_CENTERS):
 * - 开局兵力统一 troops: 30000（大城/中城均有）
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
    /** 据点出现的游戏起始年（含）*/
    startYear?: number;
    /** 据点消失的游戏终止年（含）*/
    endYear?: number;
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
        troops: 30000,
        tier: 0,
        note: '十三朝国都；关中核心',
    },
    {
        id: 'city_chengdu',
        name: '成都',
        factionId: 'shu',
        lat: 30.5700, lng: 104.0700,
        type: 'big_city',
        region: 'BASHU',
        troops: 30000,
        tier: 0,
        note: '蜀汉及前后蜀等都城；川蜀中心',
    },

    // ── 中原核心 ──
    {
        id: 'city_luoyang',
        name: '洛阳',
        factionId: 'wuzhou_d',
        lat: 34.62, lng: 112.45,
        type: 'big_city',
        region: 'CENTRAL',
        troops: 30000,
        mirror: true, // 洛阳 ↔ 新郑 镜像分布
        tier: 0,
        note: '武周神都；李多祚羽林军T1' },
    
    {
        id: 'city_anyang',
        name: '安阳',
        factionId: 'shang',
        lat: 36.10, lng: 114.39,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 30000,
        tier: 0,
        note: '殷墟；商都安阳',
    },

    // ── 北方 ──
    { id: 'city_hedong', name: '安邑', factionId: 'wei', lat: 35.15, lng: 111.0, type: 'medium_city', troops: 30000, region: 'CENTRAL', note: '夏禹之都（《史记·夏本纪》）；战国魏都/河东郡治；解池盐业贸易人口破10万' },
    { id: 'city_beijing', name: '北京', factionId: 'ming_d', lat: 39.9, lng: 116.41, type: 'big_city', troops: 30000, region: 'NORTH' },

    { id: 'city_datong', name: '大同', factionId: 'tuoba', lat: 40.08, lng: 113.3, type: 'big_city', troops: 30000, region: 'NORTH' },


    // ── 江南 ──
    {
        id: 'city_nanjing',
        name: '金陵',
        factionId: 'jinling',
        lat: 32.0500, lng: 118.7700,
        type: 'big_city',
        region: 'JIANGNAN',
        troops: 30000,
        tier: 0,
        note: '南京金陵；刘宋檀道济唱筹量沙',
    },
    { id: 'city_hangzhou', name: '杭州', factionId: 'wuyue', lat: 30.25, lng: 120.16, type: 'big_city', troops: 30000, region: 'JIANGNAN' },


    
    { id: 'city_taiyuan', name: '晋阳', factionId: 'bing', lat: 37.87, lng: 112.55, type: 'big_city', troops: 30000, region: 'NORTH' },

    { id: 'city_xiangyang', name: '襄阳', factionId: 'xiangzhou', lat: 32.01, lng: 112.12, type: 'medium_city', troops: 30000, region: 'JIANGNAN' },



    { id: 'city_shouxian', name: '寿春', factionId: 'zhong', lat: 32.59, lng: 116.8, type: 'medium_city', region: 'CENTRAL', troops: 30000, tier: 1, note: '楚后期都、淮南/寿州治；淮西重镇' },
    { id: 'city_ueda', name: '上田城', factionId: 'sanada_d', lat: 36.4025, lng: 138.2464, type: 'pass', troops: 30000, region: 'JAPAN' },

];

// ============================================================
// T1 中城 — 待添加 (省会 + 朝代府治)
// ============================================================
export const T1_MEDIUM_CITIES: CityDataV2[] = [
    // ── 蜀道沿线 (长安→成都 的中城) ──
        // ── 关中平原历史名城 ──
        { id: 'city_anding', name: '安定', factionId: 'jingzhou_gs', lat: 35.327451, lng: 107.358398, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_hanzhong', name: '南郑', factionId: 'han_d', lat: 33.07, lng: 107.02, type: 'small_city', troops: 30000, region: 'CENTRAL', note: '汉中郡治，秦岭南麓枢纽' },


    {
        id: 'city_guozhou',
        name: '南充',
        factionId: 'guo',
        lat: 30.83, lng: 106.11,
        type: 'small_city',
        region: 'BASHU',
        troops: 30000,
        note: '南充；果州小城',
    },
    { id: 'city_mianyang', name: '涪城', factionId: 'daxi_ming', lat: 31.482545, lng: 104.718933, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    {
        id: 'city_chongqing',
        name: '重庆',
        factionId: 'ba',
        lat: 29.56, lng: 106.58,
        type: 'medium_city',
        region: 'BASHU',
        troops: 30000,
        tier: 1,
        note: '巴国都·江州；巴蔓子将军故地（《华阳国志·巴志》）' },
    {
        id: 'city_zizhou',
        name: '盘石',
        factionId: 'zi',
        lat: 29.78, lng: 104.85,
        type: 'medium_city',
        region: 'BASHU',
        troops: 30000,
        note: '盘石；资州小城',
    },

    // ── 崤函古道沿线 (洛阳→长安 的中城) ──

    // ── 中原北线/冀南走廊 (洛阳→安阳 的中城) ──
    // ── 幽冀古道/平原走廊 (安阳→北京 的中城) ──
    { id: 'city_handan', name: '邯郸', factionId: 'zhao', lat: 36.61, lng: 114.49, type: 'medium_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_zhending', name: '真定', factionId: 'zhongshan', lat: 38.130241, lng: 114.590149, type: 'medium_city', region: 'NORTH', troops: 30000, note: '中山国故都；北宋崇宁真定府人口超16万' },
    { id: 'city_baoding', name: '保定', factionId: 'qingyuan_bd', lat: 38.87, lng: 115.48, type: 'small_city', troops: 30000, region: 'NORTH' },

    { id: 'city_hejian', name: '乐成', factionId: 'liwang', lat: 38.18, lng: 116.12, type: 'small_city', troops: 30000, region: 'NORTH' },

    {
        id: 'city_jingzhou2',
        name: '蓨城',
        factionId: 'gaoqi_d',
        lat: 37.68, lng: 116.27,
        type: 'small_city',
        region: 'NORTH',
        troops: 30000,
        note: '渤海蓨县；北齐神武帝高欢故里（《北齐书·神武帝纪》）' },
    {
        id: 'city_pingyuan',
        name: '平原城',
        factionId: 'pingyuan',
        lat: 37.16, lng: 116.43,
        type: 'medium_city',
        region: 'NORTH',
        troops: 30000,
        note: '汉平原郡治城邑；颜真卿平原义军锚点；旗号高唐避重',
    },
        // ── 京同山川走廊 (北京→大同 的中城) ──
    // ── 晋陕走廊/汾河谷地 (大同→长安 的中城) ──
    { id: 'city_linfen', name: '临汾', factionId: 'yao', lat: 36.088, lng: 111.516724, type: 'medium_city', troops: 30000, region: 'CENTRAL' },


    // ── 太行山脉走廊/八陉周边中城 ──
                // ── 淮海与齐鲁中原走廊中城 ──
    { id: 'city_shangqiu', name: '商丘', factionId: 'liang_d', lat: 34.41, lng: 115.66, type: 'medium_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_pengcheng', name: '彭城', factionId: 'xichu', lat: 34.27, lng: 117.18, type: 'medium_city', region: 'CENTRAL', troops: 30000, tier: 1, note: '西楚都、徐州治；淮海枢纽' },
    { id: 'city_langya', name: '琅琊', factionId: 'wang_d', lat: 35.077231, lng: 118.363953, type: 'small_city', troops: 30000, region: 'CENTRAL' },



    { id: 'city_ju', name: '莒城', factionId: 'chimei', lat: 35.578, lng: 118.832, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_lanling', name: '氶城', factionId: 'xiao_d', lat: 34.798005, lng: 117.647095, type: 'small_city', troops: 30000, region: 'CENTRAL' },





    // ── 齐鲁古国与半岛走廊中城 ──
    { id: 'city_dingtao', name: '定陶', factionId: 'wazhai', lat: 35.200716, lng: 115.471802, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_jimo', name: '即墨', factionId: 'jiaodong', lat: 36.403591, lng: 120.445862, type: 'small_city', region: 'CENTRAL', troops: 30000,
        note: '即墨；胶东小城',
    },
    { id: 'city_boyang', name: '奉高', factionId: 'jibei', lat: 36.15, lng: 117.05, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    {
        id: 'city_licheng',
        name: '历下',
        factionId: 'jinan',
        lat: 36.67, lng: 117.00,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 30000,
        tier: 1,
        note: '历下；济南治所/重镇',
    },
    { id: 'city_linzi', name: '临淄', factionId: 'qi', lat: 36.88, lng: 118.43, type: 'big_city', troops: 30000, region: 'CENTRAL' },


    // ── 岭南、东南与西南地区中城 ──
    {
        id: 'city_bushan',
        name: '布山',
        factionId: 'xiou',
        lat: 23.10, lng: 109.60,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 30000,
        note: '布山；西瓯小城',
    },
    {
        id: 'city_fuzhou',
        name: '冶城',
        factionId: 'min',
        lat: 26.07, lng: 119.30,
        type: 'medium_city',
        region: 'JIANGNAN',
        troops: 30000,
        tier: 1,
        note: '闽国都城故地（史籍亦称长乐府）；番号长乐控鹤，据点名避重改冶城' },
    // ── 淮河流域与中原周边中城 ──
    
    { id: 'city_huaiyang', name: '宛丘', factionId: 'huaiyang', lat: 33.63, lng: 114.7, type: 'small_city', region: 'CENTRAL', troops: 30000,
        note: '宛丘；淮阳小城',
    },
    { id: 'city_shunchang', name: '顺昌', factionId: 'yingzhou_d', lat: 32.9, lng: 115.81, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_qiaojun', name: '谯县', factionId: 'cao_d', lat: 33.88, lng: 115.77, type: 'small_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_hefei', name: '合肥', factionId: 'lu', lat: 31.82, lng: 117.23, type: 'medium_city', region: 'JIANGNAN', troops: 30000, tier: 1, note: '庐州府治；江淮要冲' },
    {
        id: 'city_yangzhou',
        name: '广陵',
        factionId: 'yang_zhou',
        lat: 32.3930, lng: 119.4200,
        type: 'big_city',
        region: 'JIANGNAN', troops: 30000,
        tier: 1, note: '杨行密吴国都城；黑云长剑都T1' },

    { id: 'city_nanyang', name: '宛城', factionId: 'dixiang', lat: 32.955682, lng: 112.516479, type: 'medium_city', region: 'CENTRAL', troops: 30000, note: '刘縯战死于宛；汉南都，东汉南阳郡240万，2026-06-18 升为中城' },
    // ── 荆楚与三峡巴蜀沿线中城 ──
    {
        id: 'city_fuling',
        name: '涪陵',
        factionId: 'fu_zhou',
        lat: 29.70, lng: 107.39,
        type: 'small_city',
        region: 'BASHU',
        troops: 30000, note: '涪州治所；《华阳国志》涪陵劲卒' },
    { id: 'city_yiling', name: '夷陵', factionId: 'yidou', lat: 30.7, lng: 111.28, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '夷陵；宜都小城',
    },

    { id: 'city_ying', name: '江陵', factionId: 'chu', lat: 30.35, lng: 112.18, type: 'medium_city', troops: 30000, region: 'JIANGNAN' },




    { id: 'city_suizhou', name: '汉东', factionId: 'sui', lat: 31.71, lng: 113.36, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    {
        id: 'city_chaisang',
        name: '柴桑',
        factionId: 'jiujiang',
        lat: 29.6802,
        lng: 115.9964,
        type: 'small_city',
        troops: 30000,
        
        note: '柴桑；柴桑小城', region: 'JIANGNAN' },
    { id: 'city_changsha', name: '长沙', factionId: 'changshaguo', lat: 28.19, lng: 112.97, type: 'medium_city', troops: 30000, region: 'JIANGNAN' },


    {
        id: 'city_changzhou',
        name: '延陵',
        factionId: 'zhangshicheng',
        lat: 31.78, lng: 119.97,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 30000,
        note: '延陵；大周小城',
    },
    { id: 'city_gusu', name: '姑苏', factionId: 'wu', lat: 31.3, lng: 120.62, type: 'big_city', troops: 30000, region: 'JIANGNAN' },
    { id: 'city_jiaxing', name: '嘉兴', factionId: 'qian_d', lat: 30.75, lng: 120.76, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_shanxian', name: '剡城', factionId: 'qiufu', lat: 29.556746, lng: 120.822144, type: 'small_city', region: 'JIANGNAN', troops: 30000, mirror: true,
        note: '剡城；裘甫小城',
    },

    // ── 陇右与河西走廊中城 ──
    { id: 'city_tianshui', name: '天水', factionId: 'qin', lat: 34.58, lng: 105.73, type: 'medium_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_longzhou', name: '汧源', factionId: 'long2', lat: 34.89, lng: 106.86, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_longxi', name: '襄武', factionId: 'li_lx_d', lat: 35.032229, lng: 104.587097, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_wuwei', name: '姑臧', factionId: 'liangzhou', lat: 37.93, lng: 102.64, type: 'medium_city', troops: 30000, region: 'HEXI' },


    { id: 'city_zhangye', name: '张掖', factionId: 'ganzhou', lat: 38.93, lng: 100.45, type: 'medium_city', troops: 30000, region: 'HEXI' },

    { id: 'city_jiuquan', name: '嘉峪关', factionId: 'suzhou', lat: 39.7822, lng: 98.3414, type: 'pass', troops: 30000, region: 'HEXI', mirror: true },









    // ── 塞北与西域中城 ──
    { id: 'city_zhizhicheng', name: '郅支城', factionId: 'xijue', lat: 42.906205, lng: 72.765198, type: 'pass', troops: 30000, region: 'STEPPE' },



    { id: 'city_chigucheng', name: '赤谷城', factionId: 'wusun', lat: 42.153304, lng: 77.585449, type: 'small_city', region: 'WESTERN', troops: 30000,
        note: '赤谷城；乌孙小城',
    },
    { id: 'city_guishancheng', name: '贵山城', factionId: 'dayuan', lat: 41.290174, lng: 71.666565, type: 'pass', region: 'WESTERN', troops: 30000,
        note: '贵山城；大宛小城',
    },

    {
        id: 'city_loulan',
        name: '扜泥城',
        factionId: 'shanshan',
        lat: 40.5158, lng: 89.92,
        type: 'pass',
        region: 'WESTERN',
        troops: 30000,
        tier: 1,
        note: '楼兰/鄯善故城（罗布泊西）；楼兰旗号迁精绝' },
    {
        id: 'city_shache',
        name: '渠莎',
        factionId: 'shache',
        lat: 38.41, lng: 77.24,
        type: 'small_city',
        region: 'WESTERN',
        troops: 30000,
        note: '莎车国都；≠西夜叶城' },
    { id: 'city_shule', name: '盘橐', factionId: 'shule', lat: 39.4850, lng: 76.0007, type: 'medium_city', troops: 30000,        region: 'WESTERN', tier: 1,
        note: '盘橐；疏勒治所/重镇',
    },

    { id: 'city_yanqi', name: '员渠城', factionId: 'yanqi', lat: 42.06, lng: 86.56, type: 'small_city', troops: 30000, region: 'WESTERN' },


    {
        id: 'city_dunhuang',
        name: '敦煌',
        factionId: 'shazhou',
        lat: 40.14, lng: 94.66,
        type: 'medium_city',
        region: 'HEXI',
        troops: 30000,
        tier: 1,
        note: '敦煌；沙州小城',
    },
    { id: 'city_lanzhou', name: '皋兰', factionId: 'lanzhou', lat: 36.062422, lng: 103.765869, type: 'medium_city', troops: 30000, region: 'HEXI' },


    { id: 'city_ledu', name: '浇河', factionId: 'tuyu_d', lat: 35.7264, lng: 101.2061, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_lintao', name: '狄道', factionId: 'didao', lat: 35.37, lng: 103.86, type: 'small_city', troops: 30000, region: 'HEXI' },

    { id: 'city_songzhou', name: '嘉诚', factionId: 'song2', lat: 32.787239, lng: 103.625793, type: 'small_city', troops: 30000, region: 'TIBET' },



    { id: 'city_jianchang', name: '邛都', factionId: 'qiong', lat: 27.870652, lng: 102.310181, type: 'small_city', troops: 30000, region: 'BASHU' },


    { id: 'city_toumancheng', name: '头曼城', factionId: 'xiongnu', lat: 41.302589, lng: 108.506470, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '头曼城；匈奴小城',
    },

    { id: 'city_guangnan', name: '广南', factionId: 'gouding', lat: 23.755260, lng: 105.386353, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '广南；句町小城',
    },    
    { id: 'city_liaoyang', name: '襄平', factionId: 'gongsun_d', lat: 41.270000, lng: 123.170000, type: 'medium_city', region: 'NORTH', troops: 30000, note: '公孙度辽东治所；辽东铁骑' },

    { id: 'city_chaoyang', name: '朝阳', factionId: 'yingzhou_ying_d', lat: 41.57, lng: 120.45, type: 'medium_city', troops: 30000, region: 'NORTHEAST' },



    { id: 'city_jicheng', name: '棘城', factionId: 'murong', lat: 41.58, lng: 121.055, type: 'small_city', troops: 30000, region: 'STEPPE' },


    {
        id: 'city_bailangshan',
        name: '白狼山',
        factionId: 'wuhuan',
        lat: 41.40, lng: 119.64,
        type: 'pass',
        region: 'STEPPE',
        troops: 30000,
        note: '白狼山；乌桓关隘',
    },

    { id: 'city_chifeng', name: '木叶山', factionId: 'qidan', lat: 42.718800, lng: 120.726013, type: 'pass', region: 'STEPPE', troops: 30000, note: '耶律阿保机木叶山会盟统铁林军' },
    {
        id: 'city_jiangsheng',
        name: '降圣',
        factionId: 'yel',
        lat: 42.5610,
        lng: 119.4818,
        type: 'pass',
        region: 'STEPPE',
        troops: 30000,
        note: '降圣；耶律小城',
    },
    { id: 'city_linhuang', name: '临潢府', factionId: 'liao_d', lat: 43.96, lng: 119.38, type: 'medium_city', troops: 30000, region: 'STEPPE' },



    { id: 'city_hezhang', name: '可乐城', factionId: 'miao', lat: 27.095807, lng: 104.718933, type: 'small_city', region: 'LINGNAN', troops: 30000, note: '水西土司苗兵据点' },
    { id: 'city_tancheng', name: '郯城', factionId: 'dongxian', lat: 34.549568, lng: 118.317261, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_qucheng', name: '朐城', factionId: 'mi', lat: 34.5292, lng: 119.132996, type: 'small_city', troops: 30000, region: 'CENTRAL' },

        { id: 'city_baibogu', name: '白波谷', factionId: 'baibo', lat: 36.135621, lng: 112.206116, type: 'pass', region: 'CENTRAL', troops: 30000,
        note: '白波谷；黄巾关隘',
    },
    { id: 'city_baoshan', name: '永昌', factionId: 'ailao', lat: 25.11, lng: 99.16, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '永昌；哀牢小城',
    },

    {
        id: 'city_guoneicheng',
        name: '国内城',
        factionId: 'xuantu',
        lat: 41.13, lng: 126.19,
        type: 'pass',
        region: 'KOREA', troops: 30000,
        tier: 1,
        note: '高句丽早期都城；汉代玄菟郡高句县渊源；旗号玄菟（2026-06-11）' },
    {
        id: 'city_fuyu',
        name: '黄龙府',
        factionId: 'fuyu',
        lat: 44.4278, lng: 125.1758,
        type: 'medium_city',
        region: 'NORTHEAST',
        troops: 30000,
        note: '黄龙府；夫余治所/重镇',
    },
    
    { id: 'city_wuling', name: '常德', factionId: 'zhongxiang', lat: 29.03, lng: 111.69, type: 'small_city', troops: 30000, region: 'BASHU' },




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
        lat: 34.2800, lng: 106.9500,
        type: 'pass',
        region: 'CENTRAL',
        troops: 30000,
        tier: 2,
        note: '大散关；凤州关隘',
    },
    { id: 'city_dusong', name: '独松关', factionId: 'shenshi', lat: 30.566952, lng: 119.679565, type: 'pass', troops: 30000, region: 'JIANGNAN', mirror: true },

//镜像
    { id: 'city_xianxia', name: '仙霞关', factionId: 'huangwang', lat: 28.35, lng: 118.51, type: 'pass', region: 'JIANGNAN', troops: 30000, tier: 2,
        note: '仙霞关；黄王关隘',
    },
    { id: 'city_wuzhou', name: '金华', factionId: 'lujian', lat: 29.08, lng: 119.65, type: 'small_city', region: 'JIANGNAN', troops: 30000,
        note: '金华；鲁监小城',
    },
    { id: 'city_quzhou', name: '信安', factionId: 'gumie', lat: 28.96, lng: 118.87, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_raozhou', name: '鄱阳', factionId: 'linshihong', lat: 28.99, lng: 116.66, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    
    { id: 'city_qianzhou', name: '南康', factionId: 'dayu', lat: 25.8509, lng: 114.93, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    {
        id: 'city_jianmenguan',
        name: '剑门关',
        factionId: 'lizhou_d',
        lat: 32.28, lng: 105.53,
        type: 'pass',
        region: 'BASHU',
        troops: 30000,
        tier: 2,
        note: '剑门关；剑州关隘',
    },
    { id: 'city_baishuiguan', name: '白水关', factionId: 'baishui', lat: 32.74, lng: 105.5, type: 'pass', troops: 30000, region: 'BASHU' },

    //── 子午道秦岭关隘 ──
    { id: 'city_ziwu', name: '子午谷', factionId: 'dashun', lat: 33.312230, lng: 108.124695, type: 'pass', region: 'CENTRAL', troops: 30000, note: '崇祯九年高迎祥出子午谷被伏，李自成接掌闯营；大顺老营驻地' },
    { id: 'city_mianzhuguan', name: '鹿头关', factionId: 'chenghan', lat: 31.32549, lng: 104.172363, type: 'pass', troops: 30000, region: 'BASHU' },


    // ── 崤函古道沿线关隘 ──
    { id: 'city_hanguguan', name: '函谷关', factionId: 'hongnong_jun', lat: 34.615131, lng: 110.915222, type: 'pass', troops: 30000, region: 'CENTRAL' },

    { id: 'city_tongguan', name: '潼关', factionId: 'sunqin', lat: 34.540000, lng: 110.290000, type: 'pass', region: 'CENTRAL', troops: 30000, mirror: true, note: '孙传庭督标秦军潼关战死故地' },
    // ── 中原北线黄河走廊关隘 ──
    { id: 'city_hulaoguan', name: '虎牢关', factionId: 'zhengzhou', lat: 34.810000, lng: 113.170000, type: 'pass', region: 'CENTRAL', troops: 30000, mirror: true,
        note: '虎牢关；郑州关隘',
    },
    // ── 洛阳周边防御关隘群 ──
    { id: 'city_guangchengguan', name: '广成关', factionId: 'ruzhou', lat: 34.139089, lng: 112.887268, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },


    
    // ── 京同山川走廊关隘 ──
    { id: 'city_juyongguan', name: '居庸关', factionId: 'you', lat: 40.28, lng: 116.06, type: 'pass', troops: 30000, region: 'NORTH', mirror: true },



    // ── 晋西北外三关及晋东北内长城关隘 ──
    { id: 'city_piantouguan', name: '偏头关', factionId: 'linhu', lat: 39.43, lng: 111.5, type: 'pass', troops: 30000, region: 'NORTH' },




    { id: 'city_pingxingguan', name: '平型关', factionId: 'lingqiu', lat: 39.281169, lng: 113.744202, type: 'pass', troops: 30000, region: 'NORTH', mirror: true },


    { id: 'city_lingshiguan', name: '灵石关', factionId: 'huo', lat: 36.844462, lng: 111.796875, type: 'pass', region: 'NORTH', troops: 30000,
        note: '灵石关；宋老生霍邑',
    },
        // ── 关中盆地防御要塞群 ──
    { id: 'city_wuguan', name: '武关', factionId: 'ruo', lat: 33.6, lng: 110.62, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },






    { id: 'city_xiaoguan', name: '萧关', factionId: 'beidi', lat: 35.657289, lng: 106.32019, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },



    {
        id: 'city_jinsuoguan',
        name: '金锁关',
        factionId: 'yaozhou',
        lat: 35.19, lng: 109.11,
        type: 'pass',
        region: 'CENTRAL',
        troops: 30000,
        tier: 2,
        note: '金锁关；耀州关隘',
    },
    // ── 太行八陉防御要塞关隘群 ──
    { id: 'city_zhiguan', name: '轵关', factionId: 'jiyuan', lat: 35.15, lng: 112.3, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },


            { id: 'city_jingxingguan', name: '井陉关', factionId: 'xianyu', lat: 38.02, lng: 114, type: 'pass', troops: 30000, region: 'NORTH' },




    { id: 'city_daomaguan', name: '倒马关', factionId: 'changshan', lat: 38.861098, lng: 114.768677, type: 'pass', troops: 30000, region: 'NORTH', mirror: true },


    { id: 'city_feihu', name: '飞狐', factionId: 'wangyan', lat: 39.3487, lng: 114.6986, type: 'pass', troops: 20000, region: 'NORTHEAST' },
    { id: 'city_zijingguan', name: '紫荆关', factionId: 'yi', lat: 39.472238, lng: 115.265808, type: 'pass', region: 'NORTH', troops: 30000, mirror: true,
        note: '紫荆关；易州关隘',
    },
    // ── 辽东幽州走廊关隘 ──
    { id: 'city_shanhaiguan', name: '山海关', factionId: 'linyu', lat: 40, lng: 119.8, type: 'pass', troops: 30000, region: 'NORTH' },

    { id: 'city_wushengguan', name: '武胜关', factionId: 'yiyang_d', lat: 31.83, lng: 114.01, type: 'pass', region: 'JIANGNAN', mirror: true, 
        note: '武胜关；义阳关隘', troops: 30000 },
    // ── 齐鲁关隘 ──
    { id: 'city_mulingguan', name: '大岘关', factionId: 'mushi', lat: 36.275259, lng: 118.660583, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },




    { id: 'city_qingshiguan', name: '青石关', factionId: 'lai', lat: 36.246502, lng: 117.715759, type: 'pass', region: 'CENTRAL', troops: 30000,
        note: '青石关；莱州关隘',
    },
    {
        id: 'city_diaoyucheng',
        name: '钓鱼城',
        factionId: 'hezhou',
        lat: 30.04, lng: 106.30,
        type: 'pass',
        region: 'BASHU',
        troops: 30000,
        note: '钓鱼城；合州山城要塞',
    },
    { id: 'city_diezhou', name: '迭部', factionId: 'dangchang', lat: 33.975273, lng: 103.482971, type: 'pass', troops: 30000, region: 'BASHU' },


    { id: 'city_panzhou', name: '潘城', factionId: 'gaoliang', lat: 33.578015, lng: 103.029785, type: 'small_city', troops: 30000, region: 'TIBET' },







    { id: 'city_maozhou', name: '汶山城', factionId: 'qingqiang', lat: 31.693115, lng: 103.867493, type: 'small_city', troops: 30000, region: 'BASHU' },


    { id: 'city_qingyuan', name: '清远', factionId: 'chen', lat: 23.68, lng: 113.06, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_gaoque', name: '高阙塞', factionId: 'baiyang', lat: 41.195202, lng: 107.166138, type: 'pass', troops: 30000, region: 'HEXI' },

    { id: 'city_hengpuguan', name: '横浦关', factionId: 'shixing', lat: 25.32, lng: 114.26, type: 'pass', troops: 30000, region: 'LINGNAN' },

    {
        id: 'city_yangshanguan',
        name: '阳山关',
        factionId: 'paiyao',
        lat: 24.78, lng: 112.65,
        type: 'pass',
        region: 'LINGNAN',
        troops: 30000,
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
        troops: 30000,
        tier: 2,
        note: '湟溪关；英州关隘',
    },
    { id: 'city_yinzhou', name: '绥德', factionId: 'liangshidu', lat: 37.5119, lng: 110.2396, type: 'small_city', troops: 30000, region: 'NORTH' },

    { id: 'city_dongshengzhou', name: '增山', factionId: 'dongshengwei', lat: 39.810643, lng: 109.959412, type: 'pass', troops: 30000, region: 'STEPPE' },



    // ── 战略要塞/县级城镇 (移入的小城) ──
    {
        id: 'city_lueyang',
        name: '略阳',
        factionId: 'fushi',
        lat: 33.3300, lng: 106.1500,
        type: 'small_city',
        region: 'BASHU',
        troops: 30000,
        note: '王猛灭前燕统一北方；氐秦锐士T3' },
    { id: 'city_mianchi', name: '渑池', factionId: 'yangshao', lat: 34.76, lng: 111.76, type: 'pass', troops: 30000, region: 'CENTRAL' },




        {
        id: 'city_huaiyin',
        name: '淮安',
        factionId: 'sizhou',
        lat: 33.5000, lng: 119.1300,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 30000, note: '韩世忠故里；克敌军T1（泗州）' },
    {
        id: 'city_dangyang',
        name: '当阳',
        factionId: 'jingmen',
        lat: 30.82, lng: 111.79,
        type: 'small_city',
        region: 'BASHU',
        troops: 30000,
        note: '当阳；荆门小城',
    },
        {
        id: 'city_zaoyang',
        name: '枣阳',
        factionId: 'zaoyang_d',
        lat: 32.13, lng: 112.75,
        type: 'small_city',
        region: 'JIANGNAN',
        troops: 30000,
        note: '枣阳军；孟珙统忠顺军抗蒙（《宋史·孟珙传》）' },

    { id: 'city_ruoqiang', name: '卡克里克', factionId: 'ruoqiang', lat: 38.987176, lng: 88.948059, type: 'small_city', region: 'WESTERN', troops: 30000, note: '婼羌部落全民皆兵' },
    {
        id: 'city_qiemo',
        name: '播仙',
        factionId: 'qiemo',
        lat: 38.14, lng: 85.53,
        type: 'small_city', region: 'WESTERN',
        troops: 30000, note: '唐安西四镇之且末镇驻军' },
    {
        id: 'city_jingjue',
        name: '精绝',
        factionId: 'loulan',
        lat: 37.06, lng: 82.69,
        type: 'pass',
        region: 'WESTERN',
        troops: 30000,
        note: '汉西域精绝国；东汉都护府屯田戍边（索劼《汉官·西域传》）' },
    { id: 'city_pishan', name: '固玛', factionId: 'pishan', lat: 37.570718, lng: 78.250122, type: 'small_city', region: 'WESTERN', troops: 30000, note: '皮山国常备武装' },
        {
        id: 'city_weili',
        name: '库尔勒',
        factionId: 'weili',
        lat: 41.33, lng: 86.26,
        type: 'small_city', region: 'WESTERN',
        troops: 30000, note: '尉犁国王城驻军' },
    // 迪化 — 且弥清新都 (原庭州已删除)
    // 鹰娑川 — 土尔扈特 (天山尤鲁都斯/巴音布鲁克)
    { id: 'city_yingsuochuan', name: '鹰娑川', factionId: 'tuerhute', lat: 42.869899, lng: 83.773499, type: 'small_city', troops: 30000, region: 'STEPPE' },
    // 沙图阿满 — 叛军 (清军哨卡)

    // 星星峡 — 叛军 (丝路关隘)
    { id: 'city_xingxingxia', name: '五峰燧', factionId: 'xingxingxia', lat: 41.611382, lng: 95.267944, type: 'pass', region: 'HEXI', troops: 30000,
        note: '星星峡；星星峡关隘',
    },
    // 赤亭 — 叛军 (吐鲁番绿洲)
    { id: 'city_chiting', name: '赤亭关', factionId: 'gaochang', lat: 42.85, lng: 91.5, type: 'pass', troops: 30000, region: 'WESTERN' },


    {
        id: 'city_xiye',
        name: '叶城',
        factionId: 'xiye',
        lat: 37.884, lng: 77.430,
        type: 'small_city',
        region: 'WESTERN',
        troops: 30000,
        note: '西夜国都（漂沙）；≠莎车' },





    { id: 'city_xiuxun', name: '休循', factionId: 'khoja', lat: 39.709286, lng: 73.22937, type: 'pass', troops: 30000, region: 'WESTERN', mirror: true },
    { id: 'city_yinai', name: '英吉沙尔', factionId: 'yarkand', lat: 38.929502, lng: 76.225891, type: 'small_city', region: 'WESTERN', troops: 30000,
        note: '英吉沙尔；叶尔羌小城',
    },
    { id: 'city_yumenguan', name: '玉门关', factionId: 'guiyi', lat: 40.35, lng: 93.86, type: 'pass', troops: 30000, region: 'HEXI' },


    { id: 'city_yangguan', name: '阳关', factionId: 'yangguan', lat: 39.92, lng: 94.06, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },





    { id: 'city_wuzhousai', name: '善无', factionId: 'wuzhou', lat: 39.998214, lng: 112.420349, type: 'pass', troops: 30000, region: 'STEPPE' },

    // ── 2026-06-18 新增：李靖@恶阳岭（贞观四年定襄夜袭）──
    { id: 'city_eyangling', name: '恶阳岭', factionId: 'dingxiang_d', lat: 39.910000, lng: 111.650000, type: 'pass', troops: 30000, region: 'NORTH', mirror: true, note: '贞观四年李靖三千骑出恶阳岭夜袭定襄城（《旧唐书·李靖传》）；清水河南缘，距盛乐≥50km' },
    { id: 'city_jilusai', name: '鸡鹿塞', factionId: 'weiming', lat: 40.46, lng: 106.26, type: 'pass', troops: 30000, region: 'HEXI' },





    {
        id: 'city_guyangsai',
        name: '固阳塞',
        factionId: 'wuyuan_d',
        lat: 41.10, lng: 110.08,
        type: 'pass',
        region: 'NORTH',
        troops: 30000,
        tier: 2,
        note: '五原郡北塞；秦汉防匈奴长城烽燧（陈龟《后汉书》度辽将军）' },
    { id: 'city_xiayangdu', name: '龙门', factionId: 'xiayang_d', lat: 35.602, lng: 110.452, type: 'pass', troops: 30000, region: 'CENTRAL' },

    // ── 战略渡口 ──
    { id: 'city_piaoyujin', name: '漂渝津', factionId: 'pinghai', lat: 39.02, lng: 117.6, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    // ── 太行陉关隘 ──
    { id: 'city_tianjinguan', name: '天井关', factionId: 'xiongding', lat: 35.27, lng: 112.93, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },

];

// ============================================================
// 周边 — 待添加 (日本七道、朝鲜八道、各古政权首都)
// ============================================================
export const PERIPHERY: CityDataV2[] = [
    { id: 'city_dali_city', name: '羊苴咩', factionId: 'dali', lat: 25.6983, lng: 100.1488, type: 'medium_city', troops: 30000, region: 'DIANQIAN' },



    // ── 2026-05-25 唐朝势力新增周边据点 ──
    { id: 'city_mengshe', name: '蒙舍城', factionId: 'nanzhao', lat: 25.058278, lng: 100.500183, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '蒙舍城；南诏小城',
    },
    {
        id: 'city_hanseong',
        name: '汉城',
        factionId: 'joseon',
        lat: 37.52, lng: 126.98,
        type: 'medium_city',
        troops: 30000,
        tier: 1,
        region: 'KOREA',
        note: '朝鲜王朝（李朝）都城汉阳/汉城' },
    { id: 'city_pyongyang', name: '平壤', factionId: 'gaogouli', lat: 39.02, lng: 125.76, type: 'medium_city', troops: 30000, region: 'KOREA' },


    { id: 'city_kaesong', name: '开城', factionId: 'goryeo', lat: 37.97, lng: 126.55, type: 'medium_city', troops: 30000, region: 'KOREA' },

    { id: 'city_hamhung', name: '咸兴', factionId: 'woju', lat: 39.968685, lng: 127.499084, type: 'small_city', troops: 30000, 
        note: '咸兴；沃沮小城', region: 'KOREA' },
    { id: 'city_longer', name: '笼耳', factionId: 'jingcheng_d', lat: 40.967, lng: 129.551, type: 'small_city', troops: 30000, region: 'KOREA' },

    { id: 'city_guoyuancheng', name: '国原城', factionId: 'chungju_d', lat: 36.991, lng: 127.926, type: 'small_city', troops: 30000, region: 'KOREA' },

    { id: 'city_geumseong', name: '锦城', factionId: 'naju_d', lat: 35.015, lng: 126.71, type: 'small_city', troops: 30000, region: 'KOREA' },


    { id: 'city_jeonju', name: '完山', factionId: 'zhen', lat: 35.75, lng: 127.14, type: 'small_city', troops: 30000, region: 'KOREA' },


    { id: 'city_jindo', name: '鸣梁', factionId: 'sambyeol', lat: 34.487, lng: 126.263, type: 'pass', troops: 30000, region: 'KOREA' },

    {
        id: 'city_suncheon_k',
        name: '顺天',
        factionId: 'sheng_d',
        lat: 34.9652, lng: 127.4991,
        type: 'pass',
        troops: 30000,
        tier: 4,
        region: 'KOREA',
        note: '高丽成宗升州牧治所；古称升州；壬辰倭乱水军重镇' },
    {
        id: 'city_gimhae',
        name: '金海',
        factionId: 'gaya',
        lat: 35.23, lng: 128.88,
        type: 'small_city',
        troops: 30000,
        tier: 4,
         
        note: '金海；伽倻小城', region: 'KOREA' },
    { id: 'city_jincheng_silla', name: '金城', factionId: 'xinluo', lat: 35.808912, lng: 129.210205, type: 'big_city', region: 'KOREA', troops: 30000, tier: 0,
        note: '新罗金城王都',
    }, // [2026-05-30] 升 big_city: 新罗 57BC-935AD = 992 年首都
        { id: 'city_haeju', name: '瀑池', factionId: 'hai2', lat: 38.03, lng: 125.71, type: 'small_city', troops: 30000, region: 'KOREA' },

    { id: 'city_longwan', name: '龙湾', factionId: 'xingliao', lat: 40.1967, lng: 124.5306, type: 'pass', troops: 30000, region: 'KOREA' },

    // === 第三批新增据点 ===
    { id: 'city_fuhan', name: '枹罕', factionId: 'qifu_d', lat: 35.6, lng: 103.21, type: 'small_city', troops: 30000, region: 'TIBET' },

    // ---- 从 CITIES_LEGACY 迁移的城市 ----
    { id: 'city_qishan', name: '岐山', factionId: 'zhou', lat: 34.506539, lng: 107.487488, type: 'pass', region: 'CENTRAL', troops: 30000,
        note: '岐山；周国小城',
    },
    { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', lat: 38.024286, lng: 109.14917, type: 'medium_city', troops: 20000, region: 'STEPPE' },


    { id: 'city_qiuchi', name: '上禄', factionId: 'qiuchi', lat: 33.86, lng: 105.3, type: 'small_city', troops: 30000, region: 'BASHU' },



    { id: 'city_ganquanyi', name: '武都', factionId: 'wudu', lat: 33.4293, lng: 105.1419, type: 'small_city', troops: 30000, region: 'CENTRAL' },



    { id: 'city_dangchang', name: '阴平', factionId: 'dangzhou', lat: 33.6997, lng: 104.5239, type: 'pass', troops: 30000, region: 'DIANQIAN' },


    { id: 'city_daixian', name: '灵仙', factionId: 'dai_d', lat: 39.842285, lng: 114.408875, type: 'small_city', region: 'NORTH', troops: 30000,
        note: '灵仙；代国小城',
    },
    {
        id: 'city_ningan',
        name: '龙泉府',
        factionId: 'bohai',
        lat: 44.128997,
        lng: 129.295349,
        type: 'medium_city',
        troops: 30000,
        tier: 1,
        
        note: '龙泉府；渤海治所/重镇', region: 'NORTHEAST' },

    { id: 'city_yalu', name: '鸭绿府', factionId: 'luzhou', lat: 41.81, lng: 126.91, type: 'small_city', region: 'KOREA', troops: 30000,
        note: '鸭绿府；渌州小城',
    },
    { id: 'city_jilishan', name: '蒺藜山', factionId: 'yizhou', lat: 42.25, lng: 121.80, type: 'pass', troops: 30000, 
        note: '蒺藜山；懿州关隘', region: 'NORTHEAST' },

    // ── 2026-05-26 新建势力：大金(会宁府)、大元(上都) ──
    { id: 'city_huining', name: '会宁府', factionId: 'dajin', lat: 45.519798, lng: 126.971741, type: 'medium_city', troops: 30000, region: 'NORTHEAST' },


    { id: 'city_shangdu', name: '上都', factionId: 'yuan_d', lat: 42.275283, lng: 115.760193, type: 'medium_city', troops: 30000, region: 'STEPPE' },



    // 额尔古纳已删：室韦都城为俱轮泊 city_julunbo
    { id: 'city_hetuala', name: '赫图阿拉', factionId: 'aisin_d', lat: 41.715981, lng: 125.032654, type: 'pass', region: 'NORTHEAST', troops: 30000, tier: 1, note: '爱新觉罗氏兴起地；≠大清皇朝旗号' },
    { id: 'city_wuguo', name: '五国城', factionId: 'jurchen', lat: 46.32, lng: 129.56, type: 'pass', region: 'NORTHEAST', troops: 30000,
        note: '五国城；女真小城',
    },
    
    { id: 'city_yanran', name: '燕然山', factionId: 'pugu', lat: 46.276728, lng: 102.801819, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_langjuxu', name: '狼居胥山', factionId: 'mengwu', lat: 47.687578, lng: 108.528442, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_luoxie', name: '逻些', factionId: 'tubo', lat: 29.65, lng: 91.1, type: 'medium_city', troops: 30000, region: 'TIBET', mirror: true },



    { id: 'city_guanglu', name: '光禄城', factionId: 'shatuo', lat: 41.9000, lng: 108.2000, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '光禄城；沙陀小城',
    },
    { id: 'city_yanran_stone', name: '燕然勒石', factionId: 'xueyantuo', lat: 45.203318, lng: 104.677734, type: 'pass', troops: 30000, region: 'STEPPE' },


    { id: 'city_luhun', name: '涿邪山', factionId: 'jiluo_d', lat: 43.58829, lng: 104.661255, type: 'pass', troops: 20000, region: 'HEXI' },
    { id: 'city_chilechuan', name: '九原', factionId: 'chile', lat: 40.591029, lng: 110.044556, type: 'small_city', troops: 30000, region: 'HEXI' },

    { id: 'city_lanshi', name: '蓝氏城', factionId: 'guishuang', lat: 36.71248, lng: 67.08252, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },



    { id: 'city_sabi', name: '泗沘', factionId: 'baiji', lat: 36.255354, lng: 126.949768, type: 'small_city', region: 'KOREA', troops: 30000,
        note: '泗沘；百济治所/重镇',
    },
    
    { id: 'city_edo', name: '江户城', factionId: 'edo', lat: 35.68, lng: 139.76, type: 'big_city', troops: 30000, note: '德川幕府治所；盛期城居约40万+，与京都升大口径一致，升 big_city', region: 'JAPAN' },

 // [2026-05-30] 升 big_city: 江户幕府 264 年 + 1700 年代百万人口世界第一

    {
        id: 'city_kyoto',
        name: '京都',
        factionId: 'ashikaga',
        lat: 35.01,
        lng: 135.77,
        type: 'big_city',
        troops: 30000,
        tier: 1,
        region: 'JAPAN',
        note: '室町幕府足利将军治所；大城门槛放宽至约40万——大坂宽永/江户盛期约40万够大，京都按同档升 big_city' },
    { id: 'city_tainan', name: '承天', factionId: 'ming_zheng', lat: 22.99, lng: 120.2, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_weirong', name: '威戎', factionId: 'quanrong', lat: 35.585841, lng: 105.512695, type: 'pass', troops: 30000, region: 'STEPPE' },
    { id: 'city_xingtai', name: '邢台', factionId: 'shizhao_d', lat: 37.07, lng: 114.50, type: 'small_city', troops: 30000, region: 'NORTH' },

    { id: 'city_shengle', name: '盛乐', factionId: 'yunzhong', lat: 40.38, lng: 111.82, type: 'small_city', troops: 30000, region: 'NORTH' },

    
    { id: 'city_izumo', name: '月山富田', factionId: 'izumo', lat: 35.377853, lng: 133.148804, type: 'pass', troops: 30000, region: 'JAPAN', note: '出云国月山富田城；尼子氏（新宫党）' },
    { id: 'city_satsuma', name: '鹿儿岛城', factionId: 'satsuma', lat: 31.6003, lng: 130.5583, type: 'small_city', troops: 30000, region: 'JAPAN' },

    // // [DATA LOST - emishi deleted]
    { id: 'city_shuri', name: '首里', factionId: 'ryukyu', lat: 26.22, lng: 127.72, type: 'medium_city', region: 'LINGNAN', troops: 30000, tier: 1, note: '琉球王国都城；那霸水师' },
    { id: 'city_tsushima', name: '金石城', factionId: 'so', lat: 34.2031, lng: 129.2892, type: 'small_city', troops: 30000, 
        note: '金石城；对马小城', region: 'JAPAN' },
    { id: 'city_yoshida', name: '吉田郡山', factionId: 'aki', lat: 34.438616, lng: 132.530823, type: 'pass', troops: 30000, 
        note: '吉田郡山；安艺关隘', region: 'JAPAN' },
    { id: 'city_kasugayama', name: '春日山', factionId: 'echigo', lat: 37.16, lng: 138.24, type: 'pass', troops: 30000, region: 'JAPAN', note: '越后国春日山城；上杉氏（轩猿众）' },
    { id: 'city_tsutsujigasaki', name: '躑躅崎馆', factionId: 'kai', lat: 35.6688, lng: 138.4991, type: 'pass', troops: 30000, region: 'JAPAN' },

    { id: 'city_okafu', name: '冈丰城', factionId: 'chosokabe', lat: 33.5972, lng: 133.5756, type: 'pass', region: 'JAPAN', troops: 30000, note: '土佐国冈丰城；长宗我部氏（一领具足）' },
    { id: 'city_himeji', name: '姬路城', factionId: 'hashiba', lat: 34.8394, lng: 134.6939, type: 'pass', troops: 30000, region: 'JAPAN' },

    { id: 'city_utsunomiya', name: '宇都宫城', factionId: 'shimotsuke', lat: 36.604491, lng: 139.858704, type: 'small_city', region: 'JAPAN', troops: 30000, note: '下野国宇都宫城；宇都宫氏' },
    { id: 'city_tsuruga', name: '鹤之城', factionId: 'aizu', lat: 37.4878, lng: 139.9297, type: 'pass', region: 'JAPAN', troops: 30000,
        note: '鹤之城；会津小城',
    },
    // ── 2026-06-11 日本精锐：北条@小田原、伊贺@名张（恶党/千早城距飞鸟宫旧址3km）──
    { id: 'city_nabari', name: '名张', factionId: 'iga_d', lat: 34.627, lng: 136.108, type: 'pass', troops: 30000, region: 'JAPAN' },

    // ── 2026-06-16 新增：日本令制国补点（方案A·6城）──
    { id: 'city_jianghu', name: '金泽', factionId: 'kaga_d', lat: 36.56, lng: 136.65, type: 'medium_city', region: 'JAPAN', troops: 30000, note: '加贺一向一揆尾山御坊故地（金泽古名）；下间赖廉守备' },
    { id: 'city_xiantai', name: '青叶城', factionId: 'date_d', lat: 38.27, lng: 140.87, type: 'small_city', troops: 30000, region: 'JAPAN' },

    { id: 'city_xiongben', name: '熊本', factionId: 'higo_d', lat: 32.81, lng: 130.71, type: 'small_city', region: 'JAPAN', troops: 30000, note: '肥后国治/加藤清正居城；江户时代城下町常住人口约4万-6万，为标准藩镇要地' },
    { id: 'city_songshan', name: '松山', factionId: 'iyo_d', lat: 33.84, lng: 132.77, type: 'small_city', troops: 30000, region: 'JAPAN' },

    { id: 'city_funei', name: '府内', factionId: 'otomo_d', lat: 33.24, lng: 131.61, type: 'small_city', region: 'JAPAN', troops: 30000, note: '丰后国府内；大友氏九州据地（府内为大友氏居城旧称）' },
    { id: 'city_gaodao', name: '高岛', factionId: 'suwa_d', lat: 36.0138, lng: 137.9662, type: 'pass', region: 'JAPAN', troops: 30000, note: '信浓国诹访郡高岛；诹访氏中世本据（考据138.0515°E；与躑躅崎馆<50km，经度西移约7.7km）' },
    { id: 'city_shangdang', name: '长子', factionId: 'xin', lat: 36.148974, lng: 113.008118, type: 'small_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_fanyang', name: '范阳', factionId: 'zhuozhou', lat: 39.48, lng: 115.98, type: 'medium_city', troops: 30000, region: 'NORTH' },
    { id: 'city_chenjun', name: '新蔡', factionId: 'cai', lat: 32.75, lng: 114.98, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_qufu', name: '曲阜', factionId: 'kong_d', lat: 35.6, lng: 116.98, type: 'small_city', troops: 30000, region: 'CENTRAL' },


        

    { id: 'city_fusicheng', name: '伏俟城', factionId: 'xihai_d', lat: 36.76089, lng: 99.742126, type: 'small_city', troops: 30000, region: 'TIBET' },

    {
        id: 'city_xianglin',
        name: '象林',
        factionId: 'linyi',
        lat: 15.00, lng: 108.50,
        type: 'small_city',
        region: 'LINGNAN',
        troops: 30000,
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
        troops: 30000,
        mirror: true,
        note: '陆浑关；允戎关隘',
    },//镜像
    
    {
        id: 'city_puyang',
        name: '濮阳',
        factionId: 'chanzhou',
        lat: 35.7621, lng: 115.0291,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 30000,
        tier: 1,
        note: '濮阳；澶州小城',
    },
    { id: 'city_xucheng', name: '符离', factionId: 'suzhou_d', lat: 33.65, lng: 116.97, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    // ── 2026-05-25 新增：汉朝补全半成品势力城市 ──
    
    // ── 2026-05-25 新增：汉朝核对追加势力都城 ──
    {
        id: 'city_zhaoge',
        name: '朝歌',
        factionId: 'yin',
        lat: 35.60, lng: 114.18,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 30000,
        note: '朝歌；殷国小城',
    },
    { id: 'city_liuxian', name: '六安', factionId: 'liu', lat: 31.74, lng: 116.5, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    

    // ── 2026-05-25 新增：三国核对追加势力都城 ──
    {
        id: 'city_xiapi',
        name: '下邳',
        factionId: 'pizhou',
        lat: 33.888642,
        lng: 117.877808,
        type: 'medium_city',
        region: 'CENTRAL',
        troops: 30000,
        note: '徐国故都；淮泗徐夷核心；汉初楚都下邳；陷阵营成军地' },
    // ── 2026-05-25 新增：两晋核对追加势力城市 ──
    {
        id: 'city_xiurongchuan',
        name: '秀容川',
        factionId: 'erzhu',
        lat: 38.42, lng: 112.73,
        type: 'pass',
        region: 'NORTH',
        troops: 30000,
        note: '秀容川；尔朱关隘川谷',
    },

    // ── 2026-05-25 新增：隋朝核对追加势力城市 ──
    
    
    
    

    { id: 'city_songmo', name: '马盂山', factionId: 'kumo', lat: 41.017350, lng: 118.699036, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '马盂山；奚族关隘',
    },

    { id: 'city_gaoliang', name: '高凉', factionId: 'xian_d', lat: 21.9, lng: 110.8, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_beishacheng', name: '卑沙城', factionId: 'jilizhou', lat: 39.444692, lng: 121.959229, type: 'pass', troops: 30000, region: 'NORTHEAST' },


    // ── 2026-05-25 唐朝势力新增周边据点(续) ──
    { id: 'city_suiye', name: '碎叶', factionId: 'xiliao', lat: 42.8, lng: 75.2667, type: 'medium_city', troops: 20000, region: 'STEPPE' },


    { id: 'city_nieduo', name: '孽多', factionId: 'nandou', lat: 35.92, lng: 74.3, type: 'small_city', region: 'TIBET', troops: 30000, note: '《汉书·西域传》难兜国王治；《新唐书·西域传》小勃律王居孽多城，高仙芝远征攻破处' },

    // ── 2026-05-26 更新：窝鲁朵八里→富贵城/拜巴里（色楞格河畔漠北回鹘陪都）──

    { id: 'city_woluduobali', name: '卜古罕城', factionId: 'huige', lat: 47.8, lng: 107.5, type: 'small_city', troops: 30000, region: 'STEPPE' },


    
    { id: 'city_jinshan', name: '额尔齐斯', factionId: 'huite', lat: 46.939014, lng: 89.598999, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '额尔齐斯；辉特关隘',
    },
    { id: 'city_dafang', name: '大方城', factionId: 'luodian', lat: 27.046910, lng: 105.707703, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '大方城；罗甸小城',
    },
    { id: 'city_yongzhou', name: '晋兴', factionId: 'nongzhigao', lat: 22.81, lng: 108.31, type: 'medium_city', region: 'LINGNAN', troops: 30000, note: '侬智高破邕州建南天国' },

    { id: 'city_qingxi', name: '帮源洞', factionId: 'fangla', lat: 29.6, lng: 119.04, type: 'pass', troops: 30000, region: 'JIANGNAN' },

    // ── 2026-05-25 北宋辽金势力 v2 ──
    { id: 'city_dengzhou', name: '蓬莱', factionId: 'yang_aner', lat: 37.82, lng: 120.72, type: 'small_city', troops: 30000, region: 'NORTH' },

    { id: 'city_jiaoxi', name: '黔陬', factionId: 'tongma', lat: 36.228777, lng: 119.924011, type: 'small_city', troops: 30000, region: 'CENTRAL' },






    // ── 2026-05-25 元朝蒙古势力新增城市 ──
    // 第一类：西征摧毁政权
    { id: 'city_urgench', name: '玉龙杰赤', factionId: 'huarazim', lat: 42.24, lng: 59.63, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA', mirror: true },

    { id: 'city_merv', name: '木鹿', factionId: 'seljuq', lat: 37.616410, lng: 62.234802, type: 'big_city', region: 'CENTRAL_ASIA', troops: 30000, note: '大塞尔柱都城马鲁/梅尔夫；史籍常称木鹿' },
    { id: 'city_pagan', name: '蒲甘', factionId: 'pagan', lat: 21.207449, lng: 94.894409, type: 'medium_city', troops: 30000, tier: 1, region: 'DIANQIAN', note: '蒲甘王朝都，万塔之城' },
        // 第二类：四大汗国
    { id: 'city_almaliq', name: '弓月城', factionId: 'geluolu', lat: 43.979013, lng: 79.648132, type: 'small_city', region: 'STEPPE', troops: 30000, mirror: true,
        note: '弓月城；葛逻禄小城',
    },
    { id: 'city_emil', name: '也迷里', factionId: 'ogodei', lat: 46.481378, lng: 83.633423, type: 'pass', region: 'STEPPE', troops: 30000, note: '草原环线锚点；环线所称也迷离即本据点' },
    // 第三类：蒙古草原部落
    { id: 'city_kereyid', name: '汪吉河', factionId: 'kereyid', lat: 46.600064, lng: 104.570618, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_naiman', name: '金微山', factionId: 'ashina', lat: 47.64, lng: 88.29, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_fuhai', name: '福海', factionId: 'naiman', lat: 47.036450, lng: 87.352295, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '福海；乃蛮小城',
    },
    { id: 'city_tatar', name: '额布都格', factionId: 'tatar', lat: 47.182253, lng: 117.726746, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '哈拉哈河汊清额布都格卡伦；塔塔儿牧地/答阑捏木儿格思战场景域',
    },

    { id: 'city_merkit', name: '买卖城', factionId: 'merkit', lat: 50.264779, lng: 106.152649, type: 'pass', troops: 30000, region: 'STEPPE', note: '清恰克图对岸买卖城；蔑儿乞色楞格渊源' },

    // 第四类：汉军世侯及元末军阀
    // 第五类：元末起义政权
    
    {
        id: 'city_xinhui', name: '厓山', factionId: 'luoping',
        lat: 22.53, lng: 113.04, type: 'pass', troops: 30000, tier: 4,
        
        note: '厓山；海口防线关隘要塞', region: 'LINGNAN' },
    { id: 'city_ninghai', name: '白峤', factionId: 'hu_d', lat: 29.2757, lng: 121.4182, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    {
        id: 'city_zhenghe', name: '政和', factionId: 'dacheng',
        lat: 27.37, lng: 118.86, type: 'small_city', troops: 30000, tier: 4,
        
        note: '政和；大成小城', region: 'LINGNAN' },
    {
        id: 'city_zhangzhou', name: '龙溪', factionId: 'chendiaoyan',
        lat: 24.51, lng: 117.65, type: 'small_city', troops: 30000,
        
        note: '龙溪；陈吊小城', region: 'LINGNAN' },
    { id: 'city_tingzhou', name: '黄连', factionId: 'kejia', lat: 26.26, lng: 116.65, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    { id: 'city_ruijin', name: '瑞金', factionId: 'tingzhou_d', lat: 25.9262, lng: 116.0458, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '宋瑞金监，客家大本营' },

    // ── 2026-05-25 明朝势力新增城市 ──
    // 第二类：元末群雄
    { id: 'city_qingyuan_zj', name: '宁波', factionId: 'fang_guozhen', lat: 29.87, lng: 121.54, type: 'medium_city', troops: 30000, region: 'JIANGNAN' },


    {
        id: 'city_taizhou_zj', name: '临海', factionId: 'ouyue',
        lat: 28.66, lng: 121.42, type: 'small_city', troops: 30000, tier: 4,
        
        note: '临海；瓯越小城', region: 'JIANGNAN' },
    { id: 'city_wenzhou', name: '永嘉', factionId: 'wenzhou', lat: 28, lng: 120.7, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    // 第三类：农民起义

    {
        id: 'city_shaxian', name: '沙戍堡', factionId: 'dengmaoqi',
        lat: 26.40, lng: 117.79, type: 'pass', troops: 30000, tier: 4,
        
        note: '沙戍堡；铲平关隘', region: 'LINGNAN' },
    {
        id: 'city_yanping', name: '延平', factionId: 'geng',
        lat: 26.670, lng: 118.210, type: 'small_city', troops: 30000, tier: 4,
        
        note: '延平；靖南小城', region: 'LINGNAN' },
    {
        id: 'city_jianning', name: '建宁', factionId: 'longwu',
        lat: 27.12, lng: 118.26, type: 'medium_city', troops: 30000, tier: 4,
        region: 'LINGNAN', note: '建宁府治建瓯（今福建建瓯）；非闽西宁化一带' },
    { id: 'city_chuzhou_zj', name: '丽水', factionId: 'yezongliu', lat: 28.46, lng: 119.91, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    {
        id: 'city_wenan', name: '文安', factionId: 'hejian',
        lat: 38.87, lng: 116.46, type: 'small_city', troops: 30000, tier: 4,
        region: 'NORTH', note: '河间郡文安；界桥先登营翼境（《三国志·袁绍传》）' },
    // 第四类：藩王叛乱
    { id: 'city_wudingzhou', name: '乐安', factionId: 'dizhou', lat: 37.501018, lng: 117.518005, type: 'small_city', troops: 30000, region: 'NORTH' },


    // 第五类：边疆民族
    { id: 'city_hetao', name: '河套', factionId: 'dada_ming', lat: 40.442769, lng: 109.333191, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_kobdo', name: '科布多', factionId: 'oirat_ming', lat: 48.01, lng: 91.64, type: 'small_city', troops: 30000, region: 'STEPPE' },


    { id: 'city_yeren_base', name: '瑷珲', factionId: 'yeren_nvzhen', lat: 50.25, lng: 127.5, type: 'pass', troops: 30000, region: 'NORTHEAST' },



    { id: 'city_chijin', name: '赤金堡', factionId: 'chijin', lat: 40.000221, lng: 97.437744, type: 'pass', region: 'HEXI', troops: 30000, note: '明赤斤蒙古卫驻牧；岳钟琪平准噶尔赤金营（旗号赤避「赤金」全称）' },
    { id: 'city_dafeichuan', name: '大非川', factionId: 'dafeichuan', lat: 36.1379, lng: 100.7611, type: 'pass', troops: 30000, region: 'TIBET' },



    // 第六类：周边国家
    
    {
        id: 'city_ayutthaya', name: '阿瑜陀耶', factionId: 'siam',
        lat: 14.35, lng: 100.58, type: 'medium_city', troops: 30000, tier: 4,
        
        note: '阿瑜陀耶王朝都城；1600年前人口约15–25万，未达大城50万门槛，降 medium_city', region: 'DIANQIAN' },
    { id: 'city_angkor', name: '吴哥', factionId: 'chenla', lat: 13.41, lng: 103.87, type: 'big_city', troops: 30000, region: 'DIANQIAN', note: '真腊/吴哥王朝都城；盛期大吴哥人口量级常估≥50万，升 big_city' },

    // ── 2026-05-25 明清之际新城市 ──
    { id: 'city_shenyang', name: '沈阳', factionId: 'manzhou_d', lat: 41.80203, lng: 123.43689, type: 'medium_city', troops: 30000, region: 'NORTHEAST' },


    {
        id: 'city_guihua', name: '归化城', factionId: 'tumed',
        lat: 40.84, lng: 111.68, type: 'medium_city', troops: 30000,
        
        note: '归化城；土默特治所/重镇', region: 'STEPPE',  // [override] 蒙古土默特部都城, 文化属塞外
    },
    {
        id: 'city_kulun', name: '库伦', factionId: 'tushetu',
        lat: 47.92, lng: 106.84, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '库伦；土谢图小城',
    },
    { id: 'city_yili', name: '固尔札', factionId: 'xibo_d', lat: 43.901854, lng: 81.315308, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_yadong', name: '卓木', factionId: 'gaxa', lat: 28.243709, lng: 89.376526, type: 'pass', region: 'TIBET', troops: 30000,
        note: '卓木；噶厦小城',
    },
    { id: 'city_leweizhai', name: '勒乌围', factionId: 'jinchuan_g', lat: 31.812147, lng: 101.931152, type: 'pass', troops: 30000, region: 'TIBET', mirror: true },



 // 镜像
    { id: 'city_meinuozhai', name: '美诺寨', factionId: 'agui', lat: 31, lng: 102.4, type: 'pass', troops: 30000, region: 'BASHU' },



 // 镜像
    { id: 'city_zhaoqing', name: '肇庆', factionId: 'duanzhou_d', lat: 23.05, lng: 112.45, type: 'medium_city', troops: 30000, region: 'LINGNAN' },


    {
        id: 'city_haiyang', name: '海阳', factionId: 'chaozhou_d',
        lat: 23.6697, lng: 116.6394, type: 'small_city', troops: 30000, region: 'LINGNAN', note: '海阳；马发潮州义勇' },
    { id: 'city_changhua_tw', name: '彰化', factionId: 'shuntian', lat: 24.08, lng: 120.56, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_pinglong', name: '平陇', factionId: 'miaomin', lat: 28.304379, lng: 109.671021, type: 'pass', region: 'BASHU', troops: 30000,
        note: '平陇；苗民关隘',
    },
    { id: 'city_kathmandu', name: '加德满都', factionId: 'gurkha', lat: 27.715138, lng: 85.185242, type: 'medium_city', region: 'TIBET', troops: 30000, tier: 1,
        note: '加德满都；廓喀小城',
    },
    {
        id: 'city_turkestan', name: '亚西', factionId: 'kazakh',
        lat: 43.297, lng: 68.270, type: 'small_city', troops: 30000, tier: 4,
        
        note: '亚西；哈萨小城', region: 'STEPPE' },
    { id: 'city_kokand', name: '浩罕', factionId: 'kokand', lat: 40.5333, lng: 70.9333, type: 'medium_city', region: 'WESTERN', troops: 30000,
        note: '浩罕；霍罕小城',
    },

    { id: 'city_fayzabad', name: '法扎巴德', factionId: 'badakhshan', lat: 37.068341, lng: 70.675049, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000,
        note: '法扎巴德；达克小城',
    },

    // ── 2026-05-25 晚清／近代城市（35个）──
    // 第一类：太平天国
    { id: 'city_jintian', name: '金田村', factionId: 'taiping', lat: 23.4, lng: 110.08, type: 'pass', troops: 30000, region: 'JIANGNAN' },


    // 第三类：大明国/小刀会
    { id: 'city_shanghai', name: '上海', factionId: 'chunshen', lat: 31.23, lng: 121.47, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    // ── 洋州@兴势山（王平·兴势之战/无当飞军T1）──
    { id: 'city_yangxian', name: '兴势山', factionId: 'yangzhou', lat: 33.352, lng: 107.582, type: 'pass', troops: 30000, region: 'DIANQIAN' },


    // 第六类：平南国（杜文秀）
    // 大理已存在 (city_dali_city), 不再新建

    // 第七类：陕甘回军
    // 第八类：号军/江汉政权
    
    { id: 'city_piandaoshui', name: '偏刀水', factionId: 'qianhui', lat: 27.921633, lng: 107.685242, type: 'pass', region: 'BASHU', troops: 30000,
        note: '偏刀水；回军小城',
    },
    // 第九类：黔西南回军
    // 第十类：苗民起义
    
    // 第十一类：新疆同治割据

    { id: 'city_wuliyasutai', name: '乌城', factionId: 'zhasaketu', lat: 47.74, lng: 96.84, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '乌城；扎萨克图小城',
    },


    // 第十三类：西南土司
    // 第十四类：回疆割据（托克逊等）
    { id: 'city_tuokexun', name: '托克逊', factionId: 'duerbote', lat: 42.79, lng: 88.65, type: 'small_city', region: 'WESTERN', troops: 30000, note: '杜尔伯特部游牧骑兵' },

    { id: 'city_dabancheng', name: '达坂城', factionId: 'tuoming', lat: 43.339165, lng: 88.258667, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '达坂城；清真关隘',
    },

    // 第十五类：越南阮朝
    { id: 'city_nanghar', name: '囊哈儿', factionId: 'jilimi', lat: 52.209343, lng: 141.951599, type: 'small_city', region: 'NUERGAN', troops: 30000,
        note: '囊哈儿；吉里小城',
    },
    {
        id: 'city_katsuyama', name: '胜山馆', factionId: 'kakizaki',
        lat: 41.8008, lng: 140.0994, type: 'pass', troops: 30000, tier: 4,
        
        note: '胜山馆；松前关隘', region: 'NUERGAN' },
    {
        id: 'city_yanaginogosho', name: '柳之御所', factionId: 'fujiwara',
        lat: 38.99, lng: 141.1208, type: 'small_city', troops: 30000,
        
        note: '柳之御所；奥州小城', region: 'JAPAN' },

    // ── 2026-05-26 新增：肃慎系势力都城（挹娄、勿吉、靺鞨）──
    { id: 'city_fenglin', name: '凤林城', factionId: 'yilou', lat: 46.318508, lng: 132.187500, type: 'pass', region: 'NORTHEAST', troops: 30000,
        note: '凤林城；挹娄小城',
    },
    

    // ── 2026-05-26 新增：濊貊、毛文龙 ──
    
    {
        id: 'city_pidao', name: '皮岛', factionId: 'mao_wenlong',
        lat: 39.5539, lng: 124.6611, type: 'pass', troops: 30000,
        
        note: '皮岛；毛文龙关隘', region: 'NORTHEAST' },

    // ── 2026-05-26 新增：满洲贵族世家 ──
    {
        id: 'city_tongjiajiang', name: '浑江', factionId: 'jianzhou_nvzhen',
        lat: 41.2681, lng: 125.3625, type: 'small_city', troops: 30000,
        
        note: '浑江；建州小城', region: 'NORTH' },
    
    
    // ── 2026-05-26 新增：渤海国王族大氏 ──
    // ── 2026-05-26 新增：漠北草原势力 ──
    { id: 'city_xiaoyenisei', name: '贝加尔', factionId: 'dingling', lat: 51.8368, lng: 107.6138, type: 'small_city', region: 'STEPPE', troops: 30000, note: '丁零王统丁零游骑牧北海' },
    { id: 'city_gaxian', name: '嘎仙洞', factionId: 'xianbei', lat: 49.323391, lng: 120.709534, type: 'pass', region: 'NORTHEAST', troops: 30000,
        note: '嘎仙洞；鲜卑关隘',
    },
    { id: 'city_junjishan', name: '浚稽山', factionId: 'gaoche', lat: 45.767504, lng: 106.284485, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '浚稽山；高车关隘',
    },
    { id: 'city_otuken', name: '于都斤山', factionId: 'tujue', lat: 47.602542, lng: 101.230774, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '于都斤山；突厥关隘',
    },
    { id: 'city_yingchang', name: '应昌', factionId: 'da_yuan', lat: 43.385052, lng: 116.82312, type: 'small_city', troops: 30000, region: 'STEPPE' },



    // ── 2026-05-26 新增：漠北草原部落/氏族势力据点 ──
    { id: 'city_ordos', name: '延恩', factionId: 'shuofang', lat: 39.620517, lng: 108.852539, type: 'small_city', region: 'HEXI', troops: 30000,
        note: '延恩；朔方小城',
    },
    { id: 'city_ruoshui', name: '弱水畔', factionId: 'yujiulu', lat: 42.457925, lng: 101.186829, type: 'small_city', troops: 30000, region: 'STEPPE' },

    
    { id: 'city_suoling', name: '娑陵', factionId: 'yaoluoge', lat: 49.364493, lng: 102.840271, type: 'small_city', troops: 30000, region: 'STEPPE' },

    {
        id: 'city_burhan', name: '不儿罕山', factionId: 'kiyad',
        lat: 48.50, lng: 109.00, type: 'pass', troops: 30000, tier: 4,
        
        note: '不儿罕山；乞颜关隘', region: 'STEPPE' },
    
    { id: 'city_kerulen', name: '巴拉斯城', factionId: 'jalair', lat: 47.969654, lng: 113.005371, type: 'small_city', troops: 30000, region: 'STEPPE', note: '克鲁伦中游巴尔斯浩特/契丹河董城；清克鲁伦巴尔和屯会盟城；札剌亦儿' },

    { id: 'city_erguna', name: '捕鱼儿海', factionId: 'hongirad', lat: 48.061537, lng: 117.787170, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '捕鱼儿海；弘吉剌关隘',
    },
    { id: 'city_dzungar_basin', name: '和博克', factionId: 'choros', lat: 46.713523, lng: 85.68512, type: 'small_city', troops: 30000, region: 'STEPPE' },




    { id: 'city_hanhai', name: '瀚海', factionId: 'tiele', lat: 44.144832, lng: 103.697205, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_keyimen', name: '克夷门', factionId: 'yeli', lat: 39.289647, lng: 106.776123, type: 'pass', troops: 30000, region: 'CENTRAL' },


    // ── 2026-05-26 新增：西域/中亚城池（14个）──
    { id: 'city_talas', name: '怛罗斯', factionId: 'tujishi', lat: 42.885995, lng: 71.347961, type: 'pass', troops: 30000, region: 'WESTERN' },

    { id: 'city_bukhara', name: '布哈拉', factionId: 'an', lat: 39.7667, lng: 64.4333, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_tashkent', name: '柘折城', factionId: 'shi_clan', lat: 41.3, lng: 69.3, type: 'medium_city', troops: 30000, region: 'WESTERN' },

    // ── 2026-05-26 新增：青藏高原势力城市（24个）──
    // === 第一类：高原帝国与割据强权 ===
    { id: 'city_qionglong', name: '穹窿银', factionId: 'xiangxiong', lat: 31.193972, lng: 80.771484, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '穹窿银；象雄小城',
    },  // [2026-05-29] 原 xiangxiong 势力已删, 暂归叛军
    { id: 'city_leh', name: '列城', factionId: 'ladakh', lat: 34.16, lng: 77.58, type: 'small_city', troops: 30000, region: 'TIBET' },


    { id: 'city_qingtang', name: '青唐城', factionId: 'tufa_d', lat: 36.644182, lng: 101.738892, type: 'medium_city', troops: 30000, region: 'TIBET' },


    { id: 'city_dangxiong', name: '当雄', factionId: 'khoshut', lat: 30.48, lng: 91.1, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '当雄；和硕特小城',
    },

    // === 第二类：雪域土著与古老强族 ===
    { id: 'city_buerhanbuda', name: '白海堡', factionId: 'duomi', lat: 34.9100, lng: 98.2100, type: 'pass', region: 'TIBET', troops: 30000,
        note: '白海堡；多弥关隘',
    },
    { id: 'city_mapangyongcuo', name: '玛旁雍错', factionId: 'nvguo', lat: 30.814997, lng: 81.430664, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '玛旁雍错；女国小城',
    },

    {
        id: 'city_kangyanchuan', name: '察木多', factionId: 'bailan',
        lat: 31.1333, lng: 97.1667, type: 'small_city', region: 'TIBET', troops: 30000, tier: 4,
        note: '察木多；白兰小城',
    },
    { id: 'city_heizong', name: '黑河宗', factionId: 'ganden', lat: 31.456786, lng: 92.04071, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_cuona', name: '错那', factionId: 'monpa', lat: 27.979850, lng: 91.928101, type: 'pass', region: 'TIBET', troops: 30000, note: '梅惹·洛珠嘉措门巴归附达赖' },
    { id: 'city_metuo', name: '墨脱', factionId: 'lopi', lat: 29.250477, lng: 95.213013, type: 'small_city', region: 'TIBET', troops: 30000, note: '阿波珞巴义都部据守墨脱' },
    // === 第三类：世袭门阀与政教寡头 ===
    { id: 'city_chubusi', name: '楚布寺', factionId: 'karmapa', lat: 30.059496, lng: 90.532837, type: 'pass', region: 'TIBET', troops: 30000,
        note: '楚布寺；噶玛小城',
    },

    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力 ──
    // ── 第一类：云贵高原与中南半岛的丛林帝国 ──
    {
        id: 'city_ava', name: '阿瓦', factionId: 'ava',
        lat: 21.85, lng: 96.0667, type: 'medium_city', region: 'DIANQIAN', troops: 30000, tier: 4,
        note: '阿瓦；掸族小城',
    },
    {
        id: 'city_bago', name: '勃固城', factionId: 'hantawadi',
        lat: 17.3333, lng: 96.4667, type: 'medium_city', region: 'DIANQIAN', troops: 30000, tier: 1,
        note: '勃固城；汉达瓦底治所/重镇',
    },
    { id: 'city_wumeng', name: '乌蒙山', factionId: 'wuman', lat: 26.497640, lng: 103.897705, type: 'pass', region: 'DIANQIAN', troops: 30000,
        note: '乌蒙山；乌蛮关隘',
    },
    { id: 'city_leigong', name: '雷公山', factionId: 'dongzu', lat: 26.573781, lng: 108.091736, type: 'pass', region: 'DIANQIAN', troops: 30000,
        note: '雷公山；侗族关隘',
    },
    {
        id: 'city_srikshetra', name: '室利差罗', factionId: 'pyu',
        lat: 18.8333, lng: 95.25, type: 'small_city', region: 'DIANQIAN', troops: 30000, tier: 4,
        note: '室利差罗；骠族小城',
    },
    {
        id: 'city_thaton', name: '直通城', factionId: 'mon',
        lat: 16.5333, lng: 97.6333, type: 'small_city', region: 'DIANQIAN', troops: 30000, tier: 4,
        note: '直通城；孟族小城',
    },
    // ── 第三类：世袭土司与门阀 ──
    { id: 'city_tonghai', name: '通海城', factionId: 'dian', lat: 24.11, lng: 102.76, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_hailongtun', name: '海龙屯', factionId: 'yang_bozhou', lat: 27.751638, lng: 106.924438, type: 'pass', region: 'BASHU', mirror: true, troops: 30000,
        note: '海龙屯；播州关隘',
    },
    { id: 'city_zhenyuan', name: '㵲溪', factionId: 'tian_sizhou', lat: 27.05, lng: 108.42, type: 'small_city', troops: 30000, region: 'LINGNAN' },


    { id: 'city_mufu', name: '独克宗', factionId: 'jiantang', lat: 27.82, lng: 99.7, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '独克宗；建塘小城',
    },

    { id: 'city_dongxu_old', name: '凯图玛蒂', factionId: 'dongxu', lat: 18.8, lng: 96.4, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    // ── 第四类：岭南帝国、安南正统与海岛王国 ──
    // ── 第五类：百越余脉与南岛语系 ──
    {
        id: 'city_lingqu', name: '始安', factionId: 'xinjiang',
        lat: 25.27, lng: 110.29, type: 'medium_city', region: 'LINGNAN', troops: 30000, tier: 1,
        note: '始安；静江治所/重镇',
    },
    { id: 'city_huashan', name: '花山', factionId: 'luoyue', lat: 22.159442, lng: 107.418823, type: 'pass', region: 'LINGNAN', troops: 30000,
        note: '花山；骆越小城',
    },
    { id: 'city_hepu', name: '海门', factionId: 'li_s', lat: 21.663, lng: 109.207, type: 'small_city', troops: 30000, region: 'CENTRAL' },






    { id: 'city_haikang', name: '海康', factionId: 'leizhou', lat: 20.9100, lng: 110.0800, type: 'small_city', troops: 30000, 
        note: '海康；雷州小城', region: 'LINGNAN' },
    {
        id: 'city_myson', name: '美山', factionId: 'champa',
        lat: 15.50, lng: 108.50, type: 'small_city', region: 'LINGNAN', troops: 30000, tier: 4,
        note: '美山；占婆小城',
    },
    
    {
        id: 'city_hoalu',
        name: '华闾',
        factionId: 'jing',
        lat: 20.25,
        lng: 105.9167,
        type: 'pass',
        troops: 30000,
        tier: 1,
        
        note: '华闾；京族小城', region: 'LINGNAN' },
    {
        id: 'city_hoabinh', name: '和平', factionId: 'muong',
        lat: 20.7667, lng: 105.3333, type: 'small_city', region: 'LINGNAN', troops: 30000, note: '申从岳芒族据守和平' },
    
    {
        id: 'city_mudan', name: '牡丹社', factionId: 'paiwan',
        lat: 22.20, lng: 120.8333, type: 'pass', region: 'LINGNAN', troops: 30000, tier: 4, note: '岭南/南方环线共用锚点；文化岭南' },
    // ── 第六类：岭南土司、安南权臣与海商门阀 ──
    { id: 'city_cen', name: '凌云', factionId: 'cen_d', lat: 24.462119, lng: 106.627808, type: 'pass', troops: 30000, region: 'LINGNAN' },



    { id: 'city_xidu', name: '蓝山', factionId: 'leloi', lat: 19.8, lng: 105.7833, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_fuchun', name: '富春', factionId: 'nguyen_guangnan', lat: 16.4667, lng: 107.5833, type: 'small_city', troops: 30000, region: 'LINGNAN' },



    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    {
        id: 'city_dangqu', name: '宕渠', factionId: 'cong',
        lat: 30.87, lng: 106.94, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '宕渠；賨族小城',
    },

    { id: 'city_langzhong_gucheng', name: '隆城', factionId: 'langzhou', lat: 31.583, lng: 105.97, type: 'medium_city', troops: 30000, region: 'BASHU' },

    { id: 'city_fuzhou_fugu', name: '府谷', factionId: 'zhe_d', lat: 39.0278, lng: 111.0583, type: 'small_city', troops: 30000, region: 'NORTH' },

    {
        id: 'city_wanling', name: '宛陵城', factionId: 'shanyue',
        lat: 30.9333, lng: 118.75, type: 'small_city', region: 'JIANGNAN', troops: 30000, tier: 4,
        note: '宛陵城；山越小城',
    },
    {
        id: 'city_chimushan', name: '敕木山', factionId: 'she_ethnic',
        lat: 27.9250, lng: 119.6333, type: 'pass', region: 'JIANGNAN', troops: 30000, tier: 4,
        note: '敕木山；畲族关隘',
    },
    {
        id: 'city_qingjingsi', name: '刺桐', factionId: 'quanzhou',
        lat: 24.90, lng: 118.5833, type: 'big_city', region: 'JIANGNAN', troops: 30000, tier: 1,
        note: '刺桐；泉州治所/重镇',
    },
    // ── 2026-05-26 Phase 3i：新增朴(新罗门阀)、土(巴人后裔) ──
    
    { id: 'city_wulingshan', name: '壶头山', factionId: 'wuling', lat: 29.1167, lng: 110.4667, type: 'pass', troops: 30000, region: 'BASHU' },

];

// ============================================================
// 汇总导出
// ============================================================

// RESTORED CITIES
export const RESTORED_CITIES: CityDataV2[] = [


{ id: 'city_ningwuguan', name: '宁武关', factionId: 'loufan', lat: 39.05, lng: 112.24, type: 'pass', troops: 30000, region: 'NORTH' },


{ id: 'city_yanmenguan', name: '雁门关', factionId: 'heng1', lat: 39.19, lng: 112.87, type: 'pass', troops: 30000, region: 'NORTH', mirror: true },






{ id: 'city_xingqing', name: '合水', factionId: 'qing', lat: 36.01, lng: 107.87, type: 'pass', troops: 30000, region: 'CENTRAL', mirror: true },







// ── 大夏(西夏)都城：兴庆府 ──
{ id: 'city_yongan', name: '永安', factionId: 'jingjiang', lat: 24.066563, lng: 110.626831, type: 'small_city', troops: 30000, 
        note: '永安；靖江小城', region: 'LINGNAN' },
    { id: 'city_xinzheng', name: '新郑', factionId: 'han', lat: 34.4, lng: 113.74, type: 'small_city', region: 'CENTRAL', troops: 30000,
        note: '新郑；韩国小城',
    },
    { id: 'city_dongkang', name: '东康', factionId: 'sushen', lat: 44.427920, lng: 131.388245, type: 'small_city', region: 'NORTHEAST', troops: 30000,
        note: '东康；肃慎小城',
    },
    { id: 'city_kanka', name: '康卡', factionId: 'kangju', lat: 40.832522, lng: 68.634338, type: 'small_city', region: 'WESTERN', troops: 30000,
        note: '康卡；康居小城',
    },
    { id: 'city_asuka', name: '千早城', factionId: 'yamato', lat: 34.336668, lng: 135.689392, type: 'pass', region: 'JAPAN', troops: 30000,
        note: '千早城；大和关隘',
    },
    {
        id: 'city_shenglong',
        name: '昇龙',
        factionId: 'dayue',
        lat: 21.03, lng: 105.85,
        type: 'medium_city',
        region: 'LINGNAN',
        troops: 30000,
        tier: 1,
        note: '昇龙；大越治所/重镇',
    },
    { id: 'city_boduo', name: '伯都', factionId: 'wuji', lat: 45.4265, lng: 124.6591, type: 'small_city', region: 'NORTHEAST', troops: 30000,
        note: '伯都；勿吉小城',
    },
    { id: 'city_varaksha', name: '瓦拉赫沙', factionId: 'sogdian', lat: 40.402983, lng: 63.088989, type: 'small_city', troops: 30000, 
        note: '瓦拉赫沙；粟特小城', region: 'CENTRAL_ASIA' },
    {
        id: 'city_raoleshui',
        name: '饶乐水',
        factionId: 'kumoxi',
        lat: 43.27, lng: 118.48,
        type: 'small_city',
        region: 'STEPPE',
        troops: 30000,
        note: '西拉木伦河（饶乐水）；库莫奚本部牧地（《魏书·库莫奚传》）' },
    // ── 武川镇 ──
    { id: 'city_wuchuanzhen', name: '武川镇', factionId: 'yuwen', lat: 41.2661, lng: 111.1322, type: 'pass', troops: 30000, region: 'NORTH' },




    // ── 新增关隘（2026-05-26） ──
    { id: 'city_gubeikou', name: '古北口', factionId: 'yan', lat: 40.69, lng: 117.16, type: 'pass', region: 'NORTH', troops: 30000, tier: 2,
        note: '古北口；燕国关隘',
    },
    { id: 'city_shimenguan', name: '石门关', factionId: 'wumeng', lat: 28.079264, lng: 104.254761, type: 'pass', region: 'BASHU', troops: 30000, note: '岭南环线西北锚点；文化川蜀（入蜀要道）' },


    // ── 2026-05-27 新增：汪(黟县) ──
    { id: 'city_yixian', name: '黟城', factionId: 'wang_s', lat: 29.93, lng: 117.94, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    // ── 2026-05-27 新增：向(来凤)、覃(慈利)、冉(秀山)、储(潜山) ──
    { id: 'city_laifeng', name: '散毛关', factionId: 'xiang_d', lat: 29.49, lng: 109.41, type: 'pass', troops: 30000, region: 'BASHU', mirror: true },



    { id: 'city_cili', name: '慈利', factionId: 'tan_d', lat: 29.43, lng: 111.12, type: 'small_city', troops: 30000, region: 'BASHU' },

    { id: 'city_xiushan', name: '秀山', factionId: 'ran_d', lat: 28.379316, lng: 109.061279, type: 'small_city', troops: 30000, region: 'BASHU' },

    { id: 'city_qianshan', name: '潜山', factionId: 'chu_d', lat: 30.616642, lng: 116.485291, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '唐舒州同安郡；陆康庐江太守守城' },

    // ── 2026-05-27 新增：青衣(雅州) ──
    // ── 2026-05-27 新增：五溪(八面山) ──
    { id: 'city_bamian', name: '八面山', factionId: 'wuxi', lat: 28.83, lng: 109.28, type: 'pass', troops: 30000, region: 'STEPPE' },



    // ── 2026-05-27 新增：生苗(甲定) ──
    { id: 'city_jiading', name: '甲定', factionId: 'shengmiao', lat: 26.485279, lng: 107.523193, type: 'pass', region: 'LINGNAN', troops: 30000,
        note: '甲定；生苗小城',
    },

    // ── 2026-05-27 新增：且兰(且兰城) ──
    { id: 'city_qielancheng', name: '且兰城', factionId: 'miao_qing', lat: 27.247242, lng: 107.880249, type: 'small_city', troops: 30000, region: 'LINGNAN' },


    // ── 2026-05-27 新增：先零(允吾) ──
    { id: 'city_yunwu', name: '允吾', factionId: 'xianlingqiang', lat: 36.301845, lng: 102.897949, type: 'small_city', troops: 30000, region: 'TIBET' },




    // ── 2026-05-27 新增：蒯(房陵) ──
    { id: 'city_fangling', name: '房陵', factionId: 'kuai', lat: 32.043007, lng: 110.692749, type: 'small_city', troops: 30000, region: 'BASHU' },


    // ── 2026-05-27 新增：庸(上庸) ──
    { id: 'city_shangyong', name: '竹山', factionId: 'yong', lat: 32.349768, lng: 109.885254, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '竹山；庸国小城',
    },
    { id: 'city_junzhou', name: '武当', factionId: 'bailian', lat: 32.5417, lng: 111.5133, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    // ── 2026-05-27 新增：申(金州) ──
    {
        id: 'city_jinzhou_shanxi',
        name: '安康',
        factionId: 'shen',
        lat: 32.68, lng: 109.02,
        type: 'small_city',
        region: 'CENTRAL',
        troops: 30000,
        note: '安康；申国小城',
    },

    // ── 2026-05-27 新增：叟(乐山) ──
    {
        id: 'city_leshan',
        name: '乐山',
        factionId: 'sou',
        lat: 29.60, lng: 103.79,
        type: 'small_city',
        region: 'BASHU',
        troops: 30000,
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
        troops: 30000,
        note: '汉昌；板楯小城',
    },

    // ── 2026-05-27 新增：烧当(玛曲) ──
    { id: 'city_maqu', name: '玛曲',
        factionId: 'shaodang', lat: 34.309295, lng: 101.513672, type: 'small_city', region: 'TIBET', troops: 30000, note: '河曲玛曲；烧当羌本部（河湟西羌，《后汉书·西羌传》）' },

    // ── 2026-05-27 新增：叛军(古严关)、盘瑶(贺州)、马楚(麦岭关)、排瑶(连州)、士(广信)、蒋(永州) ──
    {
        id: 'city_guyanguan',
        name: '古严关',
        factionId: 'guizhou',
        lat: 25.68, lng: 110.62,
        type: 'pass',
        region: 'LINGNAN',
        troops: 30000,
        tier: 4,
        note: '古严关；桂州关隘',
    },
    {
        id: 'city_hezhou',
        name: '临贺',
        factionId: 'panyao',
        lat: 24.40, lng: 111.55,
        type: 'small_city', region: 'LINGNAN',
        troops: 30000, note: '盘瑶聚居瑶人弩手',
        tier: 4 },
    { id: 'city_mailingguan', name: '麦岭关', factionId: 'daozhou', lat: 25.02, lng: 111.23, type: 'pass', troops: 30000, region: 'LINGNAN', mirror: true },


    { id: 'city_yongzhou_hn', name: '泉陵', factionId: 'jiang_s', lat: 26.231835, lng: 111.588135, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    // ── 2026-05-28 新增：黎(崖州) ──
    { id: 'city_yazhou', name: '珠崖', factionId: 'liren', lat: 18.432692, lng: 108.989868, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '珠崖；俚族小城',
    },
    // ── 2026-05-28 新增：悉勃野(匹播) ──
    { id: 'city_pibo', name: '匹播', factionId: 'lang_clan', lat: 29.224032, lng: 91.746826, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '匹播；帕竹朗小城',
    },
    // ── 2026-05-28 新增：工布(江达宗) ──
    // [2026-05-29] 原 gongbu 势力已删, 暂归叛军
    // ── 2026-05-28 新增：果洛(花石峡)、察哈尔(多伦) ──
    { id: 'city_huashixia', name: '花石峡', factionId: 'heyuan_d', lat: 35.196235, lng: 98.907166, type: 'pass', region: 'TIBET', troops: 30000, mirror: true, note: '黑齿常之河源军大破吐蕃' },

    // ── 2026-05-30 威海(文登)；威海卫据点已删（与文登重复） ──
    { id: 'city_wendeng', name: '文登', factionId: 'weihaiwei', lat: 37.20, lng: 122.05, type: 'small_city', region: 'NORTH', troops: 30000, note: '苏定方东征神灭军' } ];

// ============================================================
// 汇总导出
// ============================================================
export const CITIES_V2: CityDataV2[] = [
    { id: 'city_moyoro', name: '莫约罗', factionId: 'ayinu_ezo', lat: 44.02, lng: 144.27, type: 'pass', troops: 30000, region: 'NUERGAN', note: '北海道东部阿伊努民族与鄂霍次克文化起源遗址莫约罗' },


    { id: 'city_thebes', name: '底比斯', factionId: 'boootiya', lat: 38.32, lng: 23.31, type: 'small_city', troops: 30000, region: 'GREEK' },
    { id: 'city_rhodes', name: '罗得城', factionId: 'luodesi', lat: 36.44, lng: 28.22, type: 'pass', troops: 30000, region: 'GREEK' },
    { id: 'city_knossos', name: '诺索斯', factionId: 'kelite', lat: 35.33, lng: 25.13, type: 'small_city', troops: 30000, region: 'GREEK' },

    { id: 'city_salamanca', name: '萨拉曼卡', factionId: 'leangongguo', lat: 40.96, lng: -5.66, type: 'small_city', troops: 30000, region: 'LATIN' },

    { id: 'city_verona', name: '维罗纳', factionId: 'bohepingyuan', lat: 45.43, lng: 10.99, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_palermo', name: '巴勒莫', factionId: 'xixiliwangguo', lat: 38.11, lng: 13.36, type: 'medium_city', troops: 30000, region: 'LATIN' },

    { id: 'city_bremen', name: '不莱梅', factionId: 'weixi', lat: 53.07, lng: 8.8, type: 'small_city', troops: 30000, region: 'GERMANIC' },

    { id: 'city_sparta', name: '斯巴达', factionId: 'lagoniya', lat: 37.07, lng: 22.42, type: 'small_city', troops: 30000, region: 'GREEK' },
    { id: 'city_salonica', name: '萨洛尼卡', factionId: 'maqidun', lat: 40.64, lng: 22.94, type: 'medium_city', troops: 30000, region: 'GREEK' },
    { id: 'city_ragusa', name: '拉古萨', factionId: 'lagusa', lat: 42.65, lng: 18.09, type: 'small_city', troops: 30000, region: 'SLAVIC' },

    { id: 'city_gothenburg', name: '哥德堡', factionId: 'ruidian_yota', lat: 57.7, lng: 11.97, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_rostock', name: '罗斯托克', factionId: 'meikelunbao', lat: 54.09, lng: 12.13, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_bruges', name: '布鲁日', factionId: 'didi', lat: 51.21, lng: 3.22, type: 'small_city', troops: 30000, region: 'GERMANIC' },

    { id: 'city_pisa', name: '比萨', factionId: 'anuo', lat: 43.72, lng: 10.4, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_seville', name: '塞维利亚', factionId: 'guadaer', lat: 37.38, lng: -5.98, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_valencia', name: '巴伦西亚', factionId: 'balunxiya', lat: 39.47, lng: -0.37, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_messina', name: '梅西纳', factionId: 'moxina', lat: 38.19, lng: 15.55, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_cagliari', name: '卡利亚里', factionId: 'sading', lat: 39.22, lng: 9.12, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_feisi', name: '非斯', factionId: 'yidelisi', lat: 34.03, lng: -5, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_cherkasy', name: '切尔卡瑟', factionId: 'qiekase', lat: 49.44, lng: 32.06, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_sofia', name: '索非亚', factionId: 'saierdika', lat: 42.7, lng: 23.32, type: 'medium_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_sarajevo', name: '萨拉热窝', factionId: 'bosiniya', lat: 43.85, lng: 18.41, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_gradeci', name: '格拉代茨', factionId: 'keluodiya', lat: 45.81, lng: 15.97, type: 'small_city', troops: 20000, region: 'SLAVIC' },

    { id: 'city_malajiashen', name: '马拉喀什', factionId: 'mulabite', lat: 31.63, lng: -7.98, type: 'medium_city', troops: 30000, region: 'LATIN' },

    { id: 'city_xiuta', name: '休达', factionId: 'zhibuluotuo', lat: 35.89, lng: -5.31, type: 'pass', troops: 30000, region: 'LATIN' },

    { id: 'city_teleimusen', name: '特莱姆森', factionId: 'zhayan', lat: 34.88, lng: -1.32, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_aerjier', name: '阿尔及尔', factionId: 'babali', lat: 36.75, lng: 3.05, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_bujiaya', name: '布佳亚', factionId: 'hamade', lat: 36.75, lng: 5.08, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_jiataji', name: '迦太基', factionId: 'buni', lat: 36.85, lng: 10.32, type: 'big_city', troops: 30000, region: 'LATIN', mirror: true },
    { id: 'city_kailuwan', name: '凯鲁万', factionId: 'aguelabu', lat: 35.67, lng: 10.1, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_deliboli', name: '的黎波里', factionId: 'telibolisi', lat: 32.88, lng: 13.19, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_banjiaxi', name: '班加西', factionId: 'jileinaijia', lat: 32.11, lng: 20.06, type: 'small_city', troops: 30000, region: 'LATIN' },

    { id: 'city_oxford', name: '牛津', factionId: 'maixiya', lat: 51.75, lng: -1.25, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_hague', name: '海牙', factionId: 'nidelan', lat: 52.07, lng: 4.3, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_gdansk', name: '格但斯克', factionId: 'boumeilaniyan', lat: 54.35, lng: 18.64, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_toulouse', name: '图卢兹', factionId: 'langgeduoke', lat: 43.6, lng: 1.44, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_nantes', name: '南特', factionId: 'aermolika', lat: 47.21, lng: -1.55, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_florence', name: '佛罗伦萨', factionId: 'tuosikana', lat: 43.76, lng: 11.25, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_venice', name: '威尼斯', factionId: 'yadelaiya', lat: 45.44, lng: 12.31, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_naples', name: '那不勒斯', factionId: 'kanpaniya', lat: 40.85, lng: 14.26, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_barcelona', name: '巴塞罗那', factionId: 'jiatailuoniya', lat: 41.38, lng: 2.17, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_granada', name: '格拉纳达', factionId: 'nasier', lat: 37.17, lng: -3.6, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_genoa', name: '热那亚', factionId: 'liguliya', lat: 44.4, lng: 8.94, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_plovdiv', name: '普罗夫迪夫', factionId: 'seleisi', lat: 42.14, lng: 24.74, type: 'small_city', troops: 20000, region: 'LATIN' },
    { id: 'city_brest', name: '布列斯特', factionId: 'bolisiya', lat: 52.09, lng: 23.68, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_zhytomyr', name: '日托米尔', factionId: 'zhituo', lat: 50.25, lng: 28.65, type: 'small_city', troops: 30000, region: 'SLAVIC' },

    { id: 'city_heidelberg', name: '海德堡', factionId: 'pufaerci', lat: 49.4, lng: 8.68, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_hamburg', name: '汉堡', factionId: 'hansa', lat: 53.55, lng: 9.99, type: 'medium_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_utrecht', name: '乌特勒支', factionId: 'batawei', lat: 52.09, lng: 5.12, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_york', name: '约克', factionId: 'weijing_york', lat: 53.95, lng: -1.08, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_carlisle', name: '卡莱尔', factionId: 'kanbuliya', lat: 54.89, lng: -2.93, type: 'pass', troops: 30000, region: 'GERMANIC' },
    { id: 'city_lyon', name: '里昂', factionId: 'gaolu_luoma', lat: 45.76, lng: 4.83, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_bordeaux', name: '波尔多', factionId: 'aquidan', lat: 44.83, lng: -0.57, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_avignon', name: '阿维尼翁', factionId: 'puluowangsi', lat: 43.94, lng: 4.8, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_milan', name: '米兰', factionId: 'lunbadi', lat: 45.46, lng: 9.19, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_ravenna', name: '拉文纳', factionId: 'donggete', lat: 44.41, lng: 12.2, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_toledo', name: '托莱多', factionId: 'xigete', lat: 39.86, lng: -4.02, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_cordoba', name: '科尔多瓦', factionId: 'andaluoxiya', lat: 37.88, lng: -4.77, type: 'big_city', troops: 30000, region: 'LATIN', note: '后伍麦叶鼎盛约20–30万，未达大城50万门槛，降 medium_city' },
    { id: 'city_zaragoza', name: '萨拉戈萨', factionId: 'alagong', lat: 41.65, lng: -0.88, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_eger', name: '维雷茨基', factionId: 'shaiyue', lat: 48.77, lng: 23.17, type: 'pass', troops: 30000, region: 'SLAVIC' },

    { id: 'city_dublin', name: '都柏林', factionId: 'gaer', lat: 53.34, lng: -6.26, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_calais', name: '加莱', factionId: 'fulandesi', lat: 50.95, lng: 1.85, type: 'pass', troops: 30000, region: 'LATIN' },
    { id: 'city_rennes', name: '雷恩', factionId: 'bulietani', lat: 48.11, lng: -1.67, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_syracuse', name: '锡拉库萨', factionId: 'xilagu', lat: 37.07, lng: 15.28, type: 'medium_city', troops: 30000, region: 'GREEK' },
    { id: 'city_bucharest', name: '布加勒斯特', factionId: 'mengtainiya', lat: 44.43, lng: 26.1, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_belgrade', name: '贝尔格莱德', factionId: 'saierweiya', lat: 44.78, lng: 20.45, type: 'pass', troops: 30000, region: 'SLAVIC' },

    { id: 'city_aidingbao', name: '爱丁堡', factionId: 'piketai', lat: 55.95, lng: -3.18, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_wupusala', name: '乌普萨拉', factionId: 'nuosi', lat: 59.85, lng: 17.63, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_lundun', name: '伦敦', factionId: 'anggelu', lat: 51.5, lng: -0.12, type: 'medium_city', troops: 30000, region: 'GERMANIC', note: '1600年前约4–8万，17世纪初约15万；名气从宽升 medium_city（未达大城约40万）' },
    { id: 'city_bali', name: '巴黎', factionId: 'gaolu', lat: 48.85, lng: 2.35, type: 'medium_city', troops: 30000, region: 'LATIN', note: '1600年前约15–22万，中世纪欧洲最大城仍未达50万，降 medium_city' },
    { id: 'city_luoma', name: '罗马城', factionId: 'luoma_diguo', lat: 41.9, lng: 12.49, type: 'big_city', troops: 30000, region: 'LATIN' },
    { id: 'city_yadian', name: '雅典', factionId: 'xila', lat: 37.98, lng: 23.72, type: 'medium_city', troops: 30000, region: 'GREEK' },
    { id: 'city_jiadisi', name: '加的斯', factionId: 'feiniqi', lat: 36.52, lng: -6.28, type: 'small_city', troops: 30000, region: 'LATIN' },
    { id: 'city_lisiben', name: '里斯本', factionId: 'putaoya', lat: 38.72, lng: -9.13, type: 'medium_city', troops: 30000, region: 'LATIN' },

    { id: 'city_weiyeena', name: '维也纳', factionId: 'habusibao', lat: 48.2, lng: 16.37, type: 'medium_city', troops: 30000, region: 'GERMANIC', note: '哈布斯堡治所；中世约2–2.5万、1600约5万，未达约10万中城门槛，降 small_city' },
    { id: 'city_bulage', name: '布拉格', factionId: 'boximiya', lat: 50.07, lng: 14.43, type: 'medium_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_budapeisi', name: '布达佩斯', factionId: 'mazhaer', lat: 47.49, lng: 19.04, type: 'medium_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_kelong', name: '科隆', factionId: 'falanji', lat: 50.93, lng: 6.95, type: 'medium_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_yachen', name: '亚琛', factionId: 'jialuolin', lat: 50.77, lng: 6.08, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_meiyinci', name: '美因茨', factionId: 'rierman', lat: 50, lng: 8.27, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_aogesibao', name: '奥格斯堡', factionId: 'shiwaben', lat: 48.37, lng: 10.89, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_bolandengbao', name: '勃兰登堡', factionId: 'asikanani', lat: 52.41, lng: 12.55, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_magedebao', name: '马格德堡', factionId: 'wende', lat: 52.13, lng: 11.61, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_leigensibao', name: '雷根斯堡', factionId: 'bafaliya', lat: 49.01, lng: 12.09, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_niulunbao', name: '纽伦堡', factionId: 'huohengsuolun', lat: 49.45, lng: 11.07, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_teerier', name: '特里尔', factionId: 'mozeer', lat: 49.75, lng: 6.64, type: 'small_city', troops: 20000, region: 'LATIN' },
    { id: 'city_basaier', name: '巴塞尔', factionId: 'ruishi', lat: 47.55, lng: 7.58, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_sitelasibao', name: '斯特拉斯堡', factionId: 'aersasi', lat: 48.57, lng: 7.75, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_aoermuci', name: '奥尔穆茨', factionId: 'molaweiya', lat: 49.59, lng: 17.25, type: 'small_city', troops: 30000, region: 'GERMANIC' },
    { id: 'city_buernuo', name: '布尔诺', factionId: 'damolaweiya', lat: 49.19, lng: 16.6, type: 'small_city', troops: 30000, region: 'GERMANIC' },

    { id: 'city_jifu', name: '基辅', factionId: 'luosi', lat: 50.45, lng: 30.52, type: 'medium_city', troops: 30000, region: 'SLAVIC', mirror: true },
    { id: 'city_nuofugeerdede', name: '诺夫哥罗德', factionId: 'liulike', lat: 58.52, lng: 31.27, type: 'small_city', troops: 30000, region: 'SLAVIC', note: '商业共和国；14–15C盛期约2.5–4万，未达约10万，降 small_city' },
    { id: 'city_mosike', name: '莫斯科', factionId: 'mosike_gongguo', lat: 55.75, lng: 37.61, type: 'medium_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_fulajimier', name: '弗拉基米尔', factionId: 'fulajimier_gongguo', lat: 56.12, lng: 40.4, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_simolengsike', name: '斯摩棱斯克', factionId: 'daniebo', lat: 54.78, lng: 32.04, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_qiernigeweifu', name: '切尔尼戈夫', factionId: 'qiernigeweifu_gongguo', lat: 51.49, lng: 31.28, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_jialiqi', name: '加利奇', factionId: 'jialixiya', lat: 49.12, lng: 24.72, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_pusikefu', name: '普斯科夫', factionId: 'pusikefu_gongheguo', lat: 57.82, lng: 28.33, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_liangzan', name: '梁赞', factionId: 'ouka', lat: 54.62, lng: 39.74, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_boluocike', name: '波洛茨克', factionId: 'xideweina', lat: 55.48, lng: 28.76, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_salai', name: '萨莱', factionId: 'jinzhang', lat: 48.15, lng: 47.15, type: 'big_city', troops: 30000, region: 'STEPPE', note: '金帐汗国都城（新萨莱）；盛期人口高估约60万，约40万门槛从宽升 big_city' },
    { id: 'city_kashan', name: '喀山', factionId: 'baojiaer', lat: 55.79, lng: 49.11, type: 'medium_city', troops: 30000, region: 'STEPPE' },
    { id: 'city_heersongniesi', name: '赫尔松涅斯', factionId: 'taolika', lat: 44.61, lng: 33.49, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_kafa', name: '卡法', factionId: 'kelimiya', lat: 45.03, lng: 35.38, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_saermizerhetusha', name: '萨尔米泽', factionId: 'dajiya', lat: 45.51, lng: 22.96, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_salatuofu', name: '萨拉托夫', factionId: 'qincha', lat: 51.53, lng: 46.03, type: 'small_city', troops: 30000, region: 'STEPPE' },
    { id: 'city_weierniwusi', name: '维尔纽斯', factionId: 'litaowan', lat: 54.68, lng: 25.27, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_huasha', name: '华沙', factionId: 'bolan', lat: 52.22, lng: 21.01, type: 'medium_city', troops: 30000, region: 'SLAVIC' },
    // ── 2026-08-04 新增：波兹南（大波兰公国治所；普热梅斯二世故都）──
    { id: 'city_poznan', name: '波兹南', factionId: 'dabolan', lat: 52.4064, lng: 16.9252, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_kelakefu', name: '克拉科夫', factionId: 'piyasite', lat: 50.06, lng: 19.94, type: 'medium_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_liga', name: '里加', factionId: 'baojian_qishi', lat: 56.95, lng: 24.1, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_teweier', name: '特维尔', factionId: 'teweier_gongguo', lat: 56.86, lng: 35.9, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_xianuofugeerdede', name: '下诺城', factionId: 'suzidaer', lat: 56.32, lng: 44, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_zhapoluore', name: '塞契', factionId: 'gesake', lat: 47.83, lng: 35.16, type: 'pass', troops: 30000, region: 'SLAVIC', note: '扎波罗热哥萨克军事营地（Sich=设防要塞）' },
    { id: 'city_yaxi', name: '雅西', factionId: 'moerdaweiya', lat: 47.16, lng: 27.58, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_teergewishite', name: '特尔城', factionId: 'walajiyia', lat: 44.86, lng: 25.46, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_kenisibao', name: '柯尼斯堡', factionId: 'tiaodun_qishi', lat: 54.71, lng: 20.51, type: 'pass', troops: 30000, region: 'GERMANIC' },
    { id: 'city_talin', name: '塔林', factionId: 'liwoniya', lat: 59.43, lng: 24.75, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_youliyefu', name: '尤里耶夫', factionId: 'chude', lat: 58.37, lng: 26.72, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_akeman', name: '阿克曼', factionId: 'deniesite', lat: 46.19, lng: 30.34, type: 'pass', troops: 30000, region: 'SLAVIC' },
    { id: 'city_asu', name: '阿速城', factionId: 'dunhe', lat: 47.23, lng: 39.70, type: 'small_city', troops: 30000, region: 'SLAVIC', note: '俄罗斯亚速（Азов，中文亦称阿速夫）；顿河下游河口，距亚速海16km；古希腊殖民地塔纳伊斯→中世纪热那亚商站塔纳→奥斯曼亚速堡；1637顿河哥萨克攻占，1641亚速围城战以少胜多坚守' },
    { id: 'city_geluodenuo', name: '格罗德诺', factionId: 'nieman', lat: 53.68, lng: 23.83, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_chalijin', name: '察里津', factionId: 'fuerjia', lat: 48.7, lng: 44.51, type: 'pass', troops: 30000, region: 'STEPPE' },
    { id: 'city_samala', name: '萨马拉', factionId: 'nuogai', lat: 53.2, lng: 50.15, type: 'small_city', troops: 30000, region: 'STEPPE' },
    { id: 'city_wufa', name: '乌法', factionId: 'bashekeer', lat: 54.73, lng: 55.96, type: 'small_city', troops: 30000, region: 'STEPPE' },
    { id: 'city_bieergeleide', name: '别尔哥罗德', factionId: 'beisilafu', lat: 50.6, lng: 36.58, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    // ── 2026-08-04 新增：哈尔科夫（1654哥萨克要塞；斯洛博达乌克兰·哈尔科夫团治所）──
    { id: 'city_haerkefu', name: '哈尔科夫', factionId: 'siluoboda', lat: 49.9935, lng: 36.2304, type: 'small_city', troops: 30000, region: 'SLAVIC', note: '乌克兰哈尔科夫；1654年哥萨克筑要塞于哈尔科夫河与洛潘河交汇；1659–1765为斯洛博达乌克兰哈尔科夫团治所；团校多涅茨等抗克里米亚鞑靼' },
    // ── 2026-08-04 新增：沃罗涅日（1586南疆要塞，守穆拉夫小道防鞑靼）──
    { id: 'city_woluonerizh', name: '沃罗涅日', factionId: 'yedi', lat: 51.6608, lng: 39.2003, type: 'small_city', troops: 30000, region: 'SLAVIC', note: '俄国沃罗涅日；1586年费奥多尔一世诏建要塞于沃罗涅日河畔，督军萨布罗夫主持；守穆拉夫小道，防克里米亚/诺盖鞑靼；后入别尔哥罗德防线；彼得一世顿河舰队造船基地' },
    { id: 'city_peilieyasilafu', name: '佩列斯拉夫', factionId: 'peilieya_gongguo', lat: 50.07, lng: 31.45, type: 'small_city', troops: 30000, region: 'SLAVIC' },
    { id: 'city_weijiebusike', name: '维捷布斯克', factionId: 'weijiebusike_gongguo', lat: 55.19, lng: 30.2, type: 'small_city', troops: 30000, region: 'SLAVIC' },

    ...T0_CAPITALS,
    ...T1_MEDIUM_CITIES,
    ...T2_STRATEGIC,
    ...PERIPHERY,
    ...RESTORED_CITIES,
    { id: 'city_guangyuan', name: '广源', factionId: 'nong2', lat: 22.644425, lng: 106.273499, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    // ── 2026-05-28 新增：奢氏(永宁/四川叙永) ──
    { id: 'city_yongning2', name: '叙永', factionId: 'she', lat: 28.17, lng: 105.44, type: 'small_city', troops: 30000, region: 'BASHU' },

    // ── 2026-05-28 新增：僚(江阳/四川泸州) ──
    { id: 'city_jiangyang', name: '江阳', factionId: 'liao', lat: 28.87, lng: 105.42, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '江阳；僚族小城',
    },
    // ── 2026-05-28 新增：普氏(矩州/贵州贵阳) ──
    { id: 'city_juzhou', name: '顺元', factionId: 'qian', lat: 26.576247, lng: 106.685486, type: 'small_city', region: 'LINGNAN', troops: 30000, note: '宋景阳入矩州戍黔中' },

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    { id: 'city_genjo', name: '根城', factionId: 'nanbu', lat: 40.5047, lng: 141.4644, type: 'pass', region: 'JAPAN', troops: 30000, tier: 4,
        note: '根城；陆奥小城',
    },
    { id: 'city_amucheng', name: '阿母城', factionId: 'saman', lat: 39.0833, lng: 63.5786, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, note: '阿姆河要冲；萨曼王朝域内重镇' },
    { id: 'city_hepancheng', name: '石头城', factionId: 'hepan', lat: 37.7725, lng: 75.2264, type: 'pass', troops: 20000, region: 'HEXI' },


    { id: 'city_humicheng', name: '护密城', factionId: 'qiepantuo', lat: 36.7266, lng: 71.6133, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, tier: 4, note: '青藏/中亚环线共用锚点' },
    { id: 'city_huoguocheng', name: '阿缓城', factionId: 'yanda', lat: 36.7286, lng: 68.8681, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },


    // ── 2026-05-28 新增：马蒙(达尔甘)、古兹根(法里亚布)、傣(勐泐城)、泰沅(清坎城)、帕銮(双河城)、罗斛(呵叻城) ──
    { id: 'city_dargan', name: '达尔甘', factionId: 'mamon', lat: 40.5333, lng: 62.2667, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },


    { id: 'city_fariyab', name: '法里亚布', factionId: 'guzgan', lat: 35.9200, lng: 64.7800, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, tier: 4,
        note: '法里亚布；古兹根小城',
    },
    { id: 'city_mengle', name: '勐泐城', factionId: 'dai', lat: 22.0000, lng: 100.8000, type: 'small_city', region: 'DIANQIAN', troops: 30000, note: '刀应勐率傣兵助明御缅' },
    { id: 'city_chingkham', name: '清坎城', factionId: 'taiyuan', lat: 19.52, lng: 100.3, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_shuanghe', name: '双河城', factionId: 'suke', lat: 16.830829, lng: 100.395813, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_khorat', name: '呵叻城', factionId: 'luohu', lat: 14.9700, lng: 102.1000, type: 'small_city', region: 'DIANQIAN', troops: 30000, tier: 4,
        note: '呵叻城；罗斛小城',
    },

    // ── 2026-05-28 新增：黑龙江流域民族/家族据点 ──
    { id: 'city_lahasusu', name: '拉哈苏苏', factionId: 'heishui', lat: 47.654208, lng: 132.497864, type: 'small_city', troops: 30000, region: 'NORTHEAST' },


    { id: 'city_valen', name: '瓦伦', factionId: 'nanai', lat: 50.5500, lng: 137.0000, type: 'small_city', region: 'NORTHEAST', troops: 30000, tier: 4,
        note: '瓦伦；那乃小城',
    },
    { id: 'city_qiji', name: '普禄', factionId: 'feiyaka', lat: 51.5800, lng: 140.0000, type: 'small_city', region: 'NUERGAN', troops: 30000, tier: 4,
        note: '普禄；费雅喀小城',
    },
    // ── 2026-05-28 新增：伊勒巴斯(希瓦)、南杰(日土宗) ──
    { id: 'city_dadoubagu', name: '大斗拔谷', factionId: 'xiutu', lat: 38.0011, lng: 100.9125, type: 'pass', troops: 30000, region: 'TIBET', mirror: true },

    { id: 'city_khiva', name: '希瓦', factionId: 'anushidgin', lat: 41.564038, lng: 60.710449, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA', mirror: true },
    { id: 'city_rituzong', name: '日土宗', factionId: 'nanjie', lat: 33.367241, lng: 79.705811, type: 'pass', region: 'TIBET', troops: 30000,
        note: '日土宗；南杰小城',
    },


    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、叛军(三陇沙/肩水金关) ──
    { id: 'city_zhadunzong', name: '扎敦宗', factionId: 'gandenpozhang', lat: 29.645092, lng: 84.171753, type: 'pass', troops: 30000, region: 'TIBET' },

    { id: 'city_sanlongsha', name: '三陇沙', factionId: 'bailong', lat: 40.4000, lng: 92.5000, type: 'pass', region: 'WESTERN', troops: 30000, note: '班勇西域长史出三陇沙平车师' },
    { id: 'city_jianshuijinguan', name: '肩水金关', factionId: 'hunxie', lat: 40.413414, lng: 99.434509, type: 'pass', region: 'HEXI', troops: 30000, mirror: true,
        note: '肩水金关；浑邪关隘',
    },//镜像

    // ── 2026-05-28 新增：药罗葛(博尔巴任)、爱新觉罗(墨尔根城)、广南国(洞海城) ──
    // 瓦剌（卫拉特）药罗葛部牧地，与明代卫拉（科布多）分立
    { id: 'city_porbazhyn', name: '博尔巴任', factionId: 'wala', lat: 49.664324, lng: 95.767822, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '博尔巴任；瓦剌关隘',
    },
    { id: 'city_moergen', name: '莫尔根', factionId: 'dawoer', lat: 49.176, lng: 125.228, type: 'small_city', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_donghai', name: '洞海城', factionId: 'guangping', lat: 17.620424, lng: 106.495972, type: 'pass', troops: 30000, region: 'LINGNAN', mirror: true, note: '占城北境·阮文张抗西山' },

    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐) ──
    { id: 'city_baidalik', name: '拜达里克', factionId: 'tumengken', lat: 46.189304, lng: 99.159851, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '拜达里克；图蒙肯小城',
    },

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(唐努) ──
    { id: 'city_jiegu', name: '结古宗', factionId: 'gling', lat: 33.001753, lng: 97.012024, type: 'pass', troops: 30000, region: 'TIBET' },



    { id: 'city_qiongbu', name: '丁青宗', factionId: 'khyungpo', lat: 31.4100, lng: 95.5900, type: 'pass', region: 'TIBET', troops: 30000, tier: 4,
        note: '丁青宗；琼波小城',
    },
    { id: 'city_bukui', name: '卜奎', factionId: 'suolun', lat: 47.305322, lng: 123.752747, type: 'small_city', troops: 30000, region: 'NORTHEAST' },


    { id: 'city_teshuolankalun', name: '唐努', factionId: 'tuva', lat: 49.419915, lng: 98.432007, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '唐努；图瓦小城',
    },

    // ── 2026-05-28 新增：大隅(赤尾木城/九州)、奄美(赤木名城/琉球) ──
    { id: 'city_akaogicheng', name: '赤尾木城', factionId: 'osumi', lat: 30.7300, lng: 131.0000, type: 'pass', troops: 30000, tier: 4, 
        note: '赤尾木城；大隅小城', region: 'JAPAN' },
    { id: 'city_akakinagusuku', name: '赤木名城', factionId: 'anmei', lat: 28.4540, lng: 129.6740, type: 'pass', region: 'JAPAN', troops: 30000, tier: 4,
        note: '赤木名城；奄美关隘',
    },

    // ── 2026-05-28 新增：康区藏族土司/部落据点 ──
    { id: 'city_riwoche', name: '类乌齐', factionId: 'dalung', lat: 31.3600, lng: 96.5000, type: 'small_city', region: 'TIBET', troops: 30000, tier: 4,
        note: '类乌齐；达隆小城',
    },
    { id: 'city_derge', name: '德格', factionId: 'gar_kham', lat: 31.924163, lng: 99.181824, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '德格；德司小城',
    },
    { id: 'city_ganzi', name: '甘孜', factionId: 'kongsa', lat: 31.615967, lng: 99.981079, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '甘孜；孔萨小城',
    },
    { id: 'city_dajianlu', name: '打箭炉', factionId: 'mingzheng', lat: 30.0500, lng: 101.9600, type: 'pass', region: 'DIANQIAN', troops: 30000, tier: 4,
        note: '打箭炉；明正小城',
    },
    // ── 2026-05-28 新增：波密(博窝/西藏) ──
    // ── 2026-05-28 新增：达擦(八宿宗/达察呼图克图/家族) ──
    { id: 'city_basu', name: '八宿宗', factionId: 'daca', lat: 30.185461, lng: 97.283936, type: 'pass', region: 'TIBET', troops: 30000,
        note: '八宿宗；达擦小城',
    },


    // ── 2026-05-28 新增：景东(银生城/云南/政权) ──
    { id: 'city_yinsheng', name: '银生城', factionId: 'jingdong', lat: 23.873432, lng: 100.914917, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '银生城；景东小城',
    },

    // ── 2026-05-28 新增：霍尔(索宗/那曲/家族) ──
    { id: 'city_suozong', name: '索宗', factionId: 'hor', lat: 31.889225, lng: 93.804016, type: 'pass', region: 'TIBET', troops: 30000,
        note: '索宗；霍尔小城',
    },

    // ── 2026-05-28 新增：董(囊谦宗/玉树/家族) ──
    { id: 'city_nangqian', name: '囊谦宗', factionId: 'dong', lat: 32.2000, lng: 96.4800, type: 'pass', region: 'TIBET', troops: 30000, tier: 4,
        note: '囊谦宗；隆庆小城',
    },

    // ── 工布土王(尼池/林芝)；巴塘宗改叛军点 ──
    { id: 'city_nichi', name: '太昭', factionId: 'gongbu', lat: 29.752, lng: 93.232, type: 'pass', region: 'TIBET', troops: 30000,
        note: '太昭；工布小城',
    },
    { id: 'city_litangzong', name: '理塘宗', factionId: 'kangba', lat: 30.0000, lng: 100.2700, type: 'pass', region: 'TIBET', troops: 30000, note: '康巴骁骑招抚理塘' },

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
    { id: 'city_heishacheng', name: '黑沙城', factionId: 'ashide', lat: 43.5, lng: 96.6, type: 'pass', troops: 20000, region: 'STEPPE' },


    { id: 'city_beiluocheng', name: '孛罗城', factionId: 'duolu', lat: 44.9, lng: 82.07, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '孛罗城；咄陆小城',
    },

    { id: 'city_dushancheng', name: '独山城', factionId: 'chuyue', lat: 44.42, lng: 84.92, type: 'pass', troops: 30000, region: 'STEPPE' },


    { id: 'city_wutucheng', name: '迪化城', factionId: 'cheshihou', lat: 43.735353, lng: 87.574768, type: 'small_city', troops: 30000, region: 'STEPPE' },


    { id: 'city_gaochangcheng', name: '高昌', factionId: 'yiduhu', lat: 42.8533, lng: 89.53, type: 'medium_city', region: 'WESTERN', troops: 30000, mirror: true, tier: 1,
        note: '高昌；亦都护小城',
    },


    { id: 'city_jinchangcheng', name: '晋昌城', factionId: 'guazhou', lat: 40.5346, lng: 95.820007, type: 'small_city', troops: 30000, region: 'HEXI' },

    { id: 'city_jieshuangna', name: '羯霜那', factionId: 'jie', lat: 40.124284, lng: 65.341187, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000,
        note: '羯霜那；羯族小城',
    },
    { id: 'city_samaerhan', name: '撒马尔罕', factionId: 'tiemuer', lat: 39.6525, lng: 66.9714, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },

    { id: 'city_jizhake', name: '吉扎克', factionId: 'kawusi', lat: 40.1167, lng: 67.8333, type: 'pass', troops: 20000, region: 'CENTRAL_ASIA', mirror: true },


    { id: 'city_yierkeshentan', name: '斯姆哈纳', factionId: 'keerkezi', lat: 39.67, lng: 73.9, type: 'pass', region: 'CENTRAL_ASIA', troops: 30000,
        note: '斯姆哈纳；柯尔克孜关隘',
    },

    { id: 'city_luntai', name: '轮台', factionId: 'quli', lat: 41.77, lng: 84.25, type: 'pass', troops: 30000, region: 'WESTERN' },

    { id: 'city_duluohe', name: '推河城', factionId: 'kaerka', lat: 45.826868, lng: 101.878967, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '清雍正九年推河城（图音河西岸设戍）；非独逻/土拉；喀尔喀',
    },
    { id: 'city_guyanshan', name: '姑衍山', factionId: 'chenli_d', lat: 48.6184, lng: 110.6488, type: 'pass', troops: 30000, region: 'STEPPE' },




    { id: 'city_naomaohu', name: '淖毛湖', factionId: 'huyan', lat: 43.279321, lng: 94.713135, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_jiluoshan', name: '稽落山', factionId: 'bayegu', lat: 44.974390, lng: 99.113159, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '稽落山；拔野古关隘',
    },
    { id: 'city_aodongcheng', name: '敖东城', factionId: 'dongdan', lat: 43.37, lng: 128.22, type: 'small_city', region: 'NORTHEAST', troops: 30000, note: '东丹国都城敖东城' },
    { id: 'city_longtanshancheng', name: '龙潭山', factionId: 'dongxia', lat: 43.834536, lng: 126.589966, type: 'pass', region: 'NORTHEAST', troops: 30000, note: '东夏国蒲鲜万奴翼境要地' },
    { id: 'city_bamiancheng', name: '八面关', factionId: 'yehe', lat: 43.189189, lng: 124.354248, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_tuhe', name: '徒河', factionId: 'jinzhou', lat: 41.12, lng: 121.14, type: 'small_city', region: 'NORTH', troops: 30000, note: '徒河水/明锦州卫；旗号锦@锦州（2026-06-11）' },
    { id: 'city_feiru', name: '肥如', factionId: 'guzhu', lat: 39.89, lng: 118.89, type: 'small_city', troops: 30000, region: 'NORTH' },

    { id: 'city_wuzhong', name: '无终', factionId: 'shanrong', lat: 39.95, lng: 117.4, type: 'small_city', troops: 30000, region: 'NORTH' },




    { id: 'city_wugucheng', name: '乌骨城', factionId: 'huimo', lat: 40.7685, lng: 123.9395, type: 'pass', region: 'NORTHEAST', troops: 30000,
        note: '乌骨城；濊貊关隘',
    },
    { id: 'city_shangzhou', name: '三白', factionId: 'sabeol', lat: 36.41, lng: 128.16, type: 'small_city', troops: 30000, region: 'KOREA' },

    { id: 'city_yuanzhishi', name: '原之辻', factionId: 'yizhi', lat: 33.791, lng: 129.703, type: 'small_city', region: 'JAPAN', troops: 30000, note: '壹岐国府旧址' },
    { id: 'city_taizaifu', name: '太宰府', factionId: 'zhuqian', lat: 33.51, lng: 130.52, type: 'medium_city', troops: 30000, region: 'JAPAN' },

    { id: 'city_chijianguan', name: '赤间关', factionId: 'taira', lat: 33.95, lng: 130.93, type: 'pass', troops: 30000, region: 'JAPAN' },

    { id: 'city_guizhicheng', name: '备中高松城', factionId: 'jibei2', lat: 34.69, lng: 133.82, type: 'pass', region: 'JAPAN', troops: 30000, note: '备中高松城·清水宗治水攻切腹（1582）' },
    { id: 'city_junfucheng', name: '骏府', factionId: 'jinchuan', lat: 34.97, lng: 138.38, type: 'medium_city', region: 'JAPAN', troops: 30000,
        note: '骏府；骏河治所/重镇',
    },
    { id: 'city_hamamatsu', name: '浜松城', factionId: 'totomi', lat: 34.71, lng: 137.73, type: 'pass', troops: 30000, region: 'JAPAN' },

    { id: 'city_atsuta', name: '热田城', factionId: 'owari', lat: 35.12, lng: 136.95, type: 'small_city', troops: 20000, region: 'JAPAN' },
    { id: 'city_xuanhua', name: '宣化', factionId: 'xuan', lat: 40.609, lng: 115.052, type: 'medium_city', troops: 20000, region: 'NORTH' },
    { id: 'city_xinghe', name: '兴和城', factionId: 'chahar', lat: 41.15, lng: 114.7, type: 'small_city', troops: 30000, region: 'STEPPE', note: '明兴和守御千户所/张北古城；元高原县·兴和路故地' },



    { id: 'city_jining', name: '集宁', factionId: 'baidi', lat: 41.03, lng: 113.1, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '集宁；白狄小城',
    },
    { id: 'city_jingzhou', name: '净州塞', factionId: 'ongut', lat: 41.56, lng: 111.66, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '净州塞；汪古关隘',
    },

    { id: 'city_saierwusu', name: '赛尔乌苏', factionId: 'rouran', lat: 44.818872, lng: 106.800842, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '赛尔乌苏；柔然小城',
    },
    { id: 'city_tongdi', name: '铜鞮', factionId: 'yangshe', lat: 36.824653, lng: 112.826843, type: 'small_city', region: 'NORTH', troops: 30000,
        note: '铜鞮；羊舌小城',
    },
    { id: 'city_huixian', name: '河池', factionId: 'huizhou_d', lat: 33.80, lng: 106.06, type: 'pass', region: 'BASHU', troops: 30000, note: '河池；诸葛亮元戎' },
{ id: 'city_huojia', name: '获嘉', factionId: 'sima_d', lat: 35.26, lng: 113.66, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_eyu', name: '阏与', factionId: 'liguo', lat: 36.487, lng: 113.381, type: 'pass', troops: 30000, region: 'CENTRAL' },


    
    { id: 'city_fushi', name: '肤施', factionId: 'zhai_han', lat: 36.59, lng: 109.48, type: 'small_city', troops: 30000, region: 'HEXI' },


    { id: 'city_changze', name: '长泽', factionId: 'kang', lat: 39.1, lng: 107.98, type: 'pass', troops: 30000, region: 'HEXI' },

    { id: 'city_linrong', name: '临戎', factionId: 'woye', lat: 40.3, lng: 107, type: 'small_city', troops: 30000, region: 'HEXI' },


    { id: 'city_aowei', name: '媪围', factionId: 'lushui', lat: 37.396289, lng: 104.111938, type: 'small_city', troops: 30000, region: 'STEPPE' },


    { id: 'city_mingsha', name: '鸣沙', factionId: 'yingli', lat: 37.51, lng: 105.18, type: 'small_city', region: 'HEXI', troops: 30000,
        note: '鸣沙；应理小城',
    },
    { id: 'city_xingqingfu2', name: '兴庆府', factionId: 'dangxiang', lat: 38.537412, lng: 106.295471, type: 'medium_city', troops: 30000, region: 'HEXI' },


    { id: 'city_lingju', name: '令居', factionId: 'guangwu', lat: 36.73, lng: 103.26, type: 'small_city', troops: 30000, region: 'TIBET' },




    { id: 'city_zuli', name: '祖厉', factionId: 'huizhou', lat: 36.56, lng: 104.68, type: 'small_city', region: 'HEXI', troops: 30000,
        note: '祖厉；会州小城',
    },
    // ── 2026-06-11 新增：折墌（薛举西秦/薛举据城）──
    { id: 'city_zhedi', name: '真宁', factionId: 'xiqin', lat: 35.5, lng: 107.94, type: 'small_city', troops: 30000, region: 'HEXI' },


    // ── 2026-06-11 精锐部队缺口：新建据点 ──
    { id: 'city_jingling', name: '竟陵', factionId: 'ruochu', lat: 30.662000, lng: 113.166000, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '楚若敖氏旧地；若敖六卒（《左传》）' },
    { id: 'city_yunmeng', name: '云梦', factionId: 'mi_chu', lat: 31.02, lng: 113.75, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_daming', name: '大名', factionId: 'tianxiong', lat: 36.5138, lng: 115.3043, type: 'medium_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_shizhu', name: '石柱', factionId: 'tujia_d', lat: 30, lng: 108.11, type: 'small_city', troops: 30000, region: 'BASHU' },

    { id: 'city_bijie', name: '毕节', factionId: 'shuixi', lat: 27.302000, lng: 105.285000, type: 'small_city', region: 'BASHU', troops: 30000, note: '水西安氏土司治所；罗罗兵（奢香/安邦彦）' },
    { id: 'city_tianyang', name: '田阳', factionId: 'zhuang_d', lat: 23.720000, lng: 106.650000, type: 'small_city', region: 'LINGNAN', troops: 30000, note: '瓦氏田州土官故里；标志战王江泾距嘉兴<50km未立城，据点取成军地' },
    { id: 'city_hailing', name: '海陵', factionId: 'taizhou', lat: 32.550000, lng: 120.000000, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '唐/杨吴海陵镇，后升泰州；李昪为制置使时所治发迹之地' },
    { id: 'city_jingkou', name: '濡须口', factionId: 'wuwu_d', lat: 31.580000, lng: 117.920000, type: 'pass', region: 'JIANGNAN', troops: 30000, mirror: true, note: '濡须水入巢湖水口；曹魏与孙吴濡须之战古战场；邻无为州' },
    { id: 'city_liyang', name: '巨鹿', factionId: 'ranwei_d', lat: 37.22, lng: 115.04, type: 'small_city', troops: 30000, region: 'CENTRAL' },

    { id: 'city_ningyuan', name: '宁远城', factionId: 'zu_d', lat: 40.618, lng: 120.72, type: 'pass', troops: 30000, region: 'NORTH' },


    { id: 'city_salhu', name: '萨尔浒', factionId: 'manzhou', lat: 41.841, lng: 124.046, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_wuchang', name: '武昌', factionId: 'sunwu_d', lat: 30.53, lng: 114.32, type: 'medium_city', troops: 30000, region: 'JIANGNAN', mirror: true },
    { id: 'city_quwo', name: '曲沃', factionId: 'jin', lat: 35.631000, lng: 111.474000, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '晋国曲沃，太原让位柴周' },
    { id: 'city_tacheng', name: '塔城', factionId: 'dzungar', lat: 46.746, lng: 82.983, type: 'small_city', troops: 30000, region: 'STEPPE' },



    { id: 'city_hamiwei', name: '哈密卫', factionId: 'yiwu', lat: 42.8, lng: 93.5, type: 'pass', troops: 30000, region: 'WESTERN', note: '草原环线西南锚点；文化西域；明羁縻军事卫所' },
    { id: 'city_bieshibali', name: '务涂城', factionId: 'chagatai', lat: 43.988866, lng: 89.579773, type: 'pass', troops: 20000, region: 'WESTERN' },


    { id: 'city_balikun', name: '巴里坤', factionId: 'pulei', lat: 43.6, lng: 93, type: 'small_city', troops: 20000, region: 'HEXI' },

    { id: 'city_buergenjuntai', name: '布尔根', factionId: 'wulianghai', lat: 46.09, lng: 91.53, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '布尔根；乌梁海关隘',
    },
    { id: 'city_zhabuhanjuntai', name: '扎布汗', factionId: 'wuli_d', lat: 47.844489, lng: 94.174805, type: 'pass', region: 'STEPPE', troops: 30000, note: '乌里雅苏台将军辖区；策楞定边左副将军驻节' },
    { id: 'city_teerhunjuntai', name: '特尔浑', factionId: 'zubu', lat: 48.089107, lng: 99.538879, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_woluduocheng', name: '青岭牙帐', factionId: 'huihu', lat: 47.698601, lng: 102.631531, type: 'pass', troops: 30000, region: 'STEPPE' },


    { id: 'city_douweihunhe', name: '都尉溷河', factionId: 'kelie', lat: 47.859243, lng: 103.96637, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_xicheng', name: '息城', factionId: 'lelang', lat: 39.62, lng: 125.66, type: 'small_city', troops: 30000, region: 'KOREA' },

    { id: 'city_qudiaoalan', name: '曲雕阿兰', factionId: 'borjigin', lat: 47.146753, lng: 109.204102, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '曲雕阿兰；孛儿只斤小城',
    },

    { id: 'city_bayanwula', name: '巴彦乌拉', factionId: 'donghu', lat: 44.53, lng: 117.6, type: 'small_city', region: 'STEPPE', troops: 30000, note: '东胡王恃强凌冒顿终为所灭' },
    { id: 'city_halagaitu2', name: '哈拉盖图', factionId: 'xingan', lat: 45.780925, lng: 119.245605, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_kuoyitian', name: '阔亦田', factionId: 'zhadalan', lat: 47.135705, lng: 115.290527, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_sangguer', name: '温都尔汗', factionId: 'zhuerqi', lat: 47.262466, lng: 110.717468, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '克鲁伦岸温都尔汗/温都尔罕；清车臣旗府地；非斡难；主儿乞',
    },
    { id: 'city_bayantumen', name: '巴彦图门', factionId: 'chechen', lat: 48.053, lng: 114.538, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '巴彦图门；车臣小城',
    },
    { id: 'city_huzhan', name: '忽毡', factionId: 'zhaowu', lat: 40.248096, lng: 69.658813, type: 'small_city', troops: 30000, region: 'WESTERN' },

    { id: 'city_aoshen', name: '奥什', factionId: 'kala', lat: 40.53, lng: 72.79, type: 'small_city', troops: 30000, region: 'WESTERN' },




    { id: 'city_dawushenkate', name: '三重城', factionId: 'wensu', lat: 41.13, lng: 82.78, type: 'pass', region: 'WESTERN', troops: 30000, note: '温宿国王城常备武装' },
    { id: 'city_kungang', name: '昆岗', factionId: 'adao_d', lat: 40.54, lng: 81.26, type: 'pass', region: 'WESTERN', troops: 30000, note: '清代阿克苏道昆岗军台；南疆驿路要冲' },
    { id: 'city_mazhatage', name: '麻扎塔格', factionId: 'pisha', lat: 38.58, lng: 80.8, type: 'pass', region: 'WESTERN', troops: 30000,
        note: '麻扎塔格；毗沙关隘',
    },
    { id: 'city_yutian2', name: '于阗', factionId: 'yuchi', lat: 37.1000, lng: 79.9200, type: 'medium_city', region: 'WESTERN', troops: 30000,
        note: '于阗；尉迟治所/重镇',
    },
    { id: 'city_yumi', name: '阿赫雅尔', factionId: 'yumi', lat: 36.85, lng: 81.65, type: 'small_city', region: 'WESTERN', troops: 30000, note: '扜弥国王都常备军' },
    { id: 'city_keliyashankou', name: '阿什库尔', factionId: 'keliya', lat: 35.45, lng: 81.1, type: 'pass', region: 'TIBET', troops: 30000, note: '尉迟曜于阗王助唐守克里雅山口' },
    { id: 'city_longmucuo', name: '龙木错', factionId: 'yangtong', lat: 34.572168, lng: 80.348511, type: 'small_city', region: 'TIBET', troops: 30000, note: '赤松德赞征羊同驻龙木错' },
    { id: 'city_gadake', name: '噶大克', factionId: 'ali', lat: 31.940459, lng: 80.139771, type: 'small_city', troops: 30000, region: 'TIBET' },


    { id: 'city_payangyi', name: '帕羊驿', factionId: 'supi', lat: 30.140235, lng: 83.281860, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '帕羊驿；苏毗小城',
    },
    { id: 'city_saga', name: '萨噶', factionId: 'faqiang', lat: 29.33, lng: 85.23, type: 'small_city', region: 'TIBET', troops: 30000, note: '论钦陵征服发羌驻萨噶' },

    { id: 'city_sajia', name: '萨迦', factionId: 'khon', lat: 29.101759, lng: 87.665405, type: 'small_city', troops: 30000,
        
        note: '萨迦；萨迦昆小城', region: 'TIBET' },
    { id: 'city_sangzhuzi', name: '桑珠孜', factionId: 'tsangpa', lat: 29.303155, lng: 88.862915, type: 'medium_city', region: 'TIBET', troops: 30000,
        note: '桑珠孜；藏巴汗小城',
    },

    { id: 'city_jiamachikang', name: '甲玛赤康', factionId: 'spurgyal', lat: 29.74, lng: 91.7, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_juemuzong', name: '觉木宗', factionId: 'niang', lat: 29.571086, lng: 94.476929, type: 'pass', region: 'TIBET', troops: 30000,
        note: '觉木宗；觉木宗小城',
    },
    { id: 'city_galangzong', name: '噶朗宗', factionId: 'galangdiba', lat: 29.86, lng: 95.77, type: 'pass', region: 'TIBET', troops: 30000, note: '旺钦顿堆波密土王抗清' },
    { id: 'city_mangkangzong', name: '芒康宗', factionId: 'fuguo', lat: 29.67, lng: 98.59, type: 'pass', region: 'TIBET', troops: 30000,
        note: '芒康宗；附国小城',
    },
    { id: 'city_adunzi', name: '阿墩子', factionId: 'bailang', lat: 28.48, lng: 98.85, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '阿墩子；白狼小城',
    },
    { id: 'city_dayan', name: '大研', factionId: 'mu_lijiang', lat: 26.87, lng: 100.22, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_tengyuecheng', name: '腾越城', factionId: 'pingnan', lat: 25.02, lng: 98.48, type: 'pass', troops: 30000, region: 'CENTRAL' },



    { id: 'city_mengmao', name: '勐卯', factionId: 'luchuan', lat: 24.01, lng: 97.85, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '勐卯；麓川小城',
    },
    { id: 'city_xiwanjin', name: '悉万斤', factionId: 'yada', lat: 36.66, lng: 65.75, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },


    { id: 'city_hunduduo', name: '昏度多', factionId: 'humi', lat: 37.022272, lng: 72.627869, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '昏度多；瓦罕小城',
    },
    { id: 'city_puticheng', name: '菩提城', factionId: 'xiaobolu', lat: 35.3, lng: 75.64, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '菩提城；勃律小城',
    },
    { id: 'city_kajier', name: '喀吉尔', factionId: 'jiashi', lat: 34.55, lng: 76.13, type: 'small_city', region: 'TIBET', troops: 30000, note: '李玄策调克什米尔兵为唐征吐蕃' },
    { id: 'city_zhaburang2', name: '札布让', factionId: 'guge', lat: 31.496599, lng: 79.799194, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '札布让；古格小城',
    },
    { id: 'city_jiangzi', name: '江孜', factionId: 'pazhu', lat: 28.92, lng: 89.59, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_linqiong', name: '临邛', factionId: 'zhuoshi', lat: 30.4149, lng: 103.4619, type: 'small_city', troops: 30000, region: 'BASHU' },



    { id: 'city_yandao', name: '严道', factionId: 'qingyi', lat: 30.000133, lng: 102.972107, type: 'pass', region: 'BASHU', troops: 30000,
        note: '严道；范长生天师道',
    },
    { id: 'city_qingxiguan', name: '清溪关', factionId: 'zuo_d', lat: 29.3667, lng: 102.6333, type: 'pass', region: 'DIANQIAN', troops: 30000, tier: 2,
        note: '清溪关；笮人关隘',
    },
    { id: 'city_yuegui', name: '越嶲', factionId: 'yueyi', lat: 28.422864, lng: 102.680969, type: 'pass', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_huichuan', name: '会川', factionId: 'kunming_yi', lat: 26.6545, lng: 102.2454, type: 'small_city', troops: 30000, region: 'DIANQIAN' },


    { id: 'city_chenzhou2', name: '沅陵', factionId: 'chenzhou_d', lat: 28.227028, lng: 110.291748, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '沅陵；辰州小城',
    },
    { id: 'city_yuanzhou', name: '芷江', factionId: 'qianzhong', lat: 27.566688, lng: 109.909973, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '芷江；沅州小城',
    },
    { id: 'city_puding', name: '普定', factionId: 'yelang', lat: 26.25, lng: 105.93, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '普定；夜郎小城',
    },
    { id: 'city_shengjingguan', name: '胜境关', factionId: 'zangke', lat: 25.651438, lng: 104.350891, type: 'pass', region: 'LINGNAN', troops: 30000,
        note: '胜境关；牂牁关隘',
    },
    { id: 'city_weixian2', name: '曲靖', factionId: 'cuanshi', lat: 25.49, lng: 103.79, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '曲靖；爨族小城',
    },
    { id: 'city_weichu', name: '威楚', factionId: 'baiman', lat: 25.045791, lng: 101.574097, type: 'small_city', region: 'DIANQIAN', troops: 30000, note: '高升泰平杨义贞复大理' },
    { id: 'city_tuodongcheng', name: '滇池', factionId: 'dianguo', lat: 25.05, lng: 102.7, type: 'medium_city', troops: 30000, region: 'DIANQIAN' },


    { id: 'city_luoxiong', name: '罗雄', factionId: 'xinggu', lat: 24.769307, lng: 104.224548, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '罗雄；兴古小城',
    },
    { id: 'city_wanwen', name: '宛温', factionId: 'nanzhong', lat: 25.09, lng: 104.89, type: 'small_city', troops: 20000, region: 'BASHU' },

    { id: 'city_cangwu', name: '苍梧', factionId: 'guangxin', lat: 23.47, lng: 111.31, type: 'medium_city', region: 'LINGNAN', troops: 30000,
        note: '苍梧；广信小城',
    },
    {
        id: 'city_panyu',
        name: '番禺',
        factionId: 'guangzhou',
        lat: 23.120000,
        lng: 113.260000,
        type: 'big_city',
        troops: 30000,
        tier: 0,
        region: 'LINGNAN',
        note: '广州府治番禺；刘隐清海军节度故地（《旧唐书·刘隐传》）' },
    { id: 'city_longchuan', name: '龙川', factionId: 'nanyue', lat: 24.1, lng: 115.26, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_kuaiji', name: '会稽', factionId: 'yue', lat: 29.987000, lng: 120.582000, type: 'medium_city', region: 'JIANGNAN', troops: 30000, note: '越国都城；lat 南微调 0.01° 与临安间距≥50km' },
    { id: 'city_luling', name: '庐陵', factionId: 'ouyang', lat: 27.1133, lng: 114.9806, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '吉州治庐陵；欧阳頠世居，梁庐陵蛮兵' },
    { id: 'city_hongzhou', name: '豫章', factionId: 'hongzhou', lat: 28.68, lng: 115.88, type: 'medium_city', troops: 30000, region: 'JIANGNAN' },


    { id: 'city_qingliuguan', name: '清流关', factionId: 'chuzhou_d', lat: 32.280000, lng: 118.250000, type: 'pass', region: 'JIANGNAN', troops: 30000, mirror: true,
        note: '清流关；滁州关隘',
    },
    { id: 'city_zhongli', name: '盱眙', factionId: 'huai', lat: 33.011000, lng: 118.497000, type: 'pass', region: 'CENTRAL', troops: 30000, note: '淮州治盱眙' },
    { id: 'city_bianliang', name: '开封', factionId: 'song', lat: 34.8, lng: 114.31, type: 'big_city', troops: 30000, region: 'CENTRAL', note: '北宋东京汴梁，17世纪前人口破百万（北宋盛期~100万），升 big_city' },

    { id: 'city_shangluo', name: '商邑', factionId: 'shangzhou', lat: 33.87, lng: 109.94, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '商鞅商於封地商邑' },
    { id: 'city_shicheng', name: '郊郢', factionId: 'ying', lat: 31.16, lng: 112.58, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_baling', name: '巴陵', factionId: 'yue_d', lat: 29.35, lng: 113.13, type: 'small_city', troops: 30000, region: 'JIANGNAN' },




    { id: 'city_linzheng', name: '临烝', factionId: 'heng', lat: 26.89, lng: 112.6, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '岭南/南方环线共用锚点；文化南方' },
    { id: 'city_guiyang', name: '桂阳', factionId: 'chen2', lat: 25.78, lng: 113, type: 'small_city', region: 'LINGNAN', troops: 30000, note: '赵范守桂阳降刘备' },
    { id: 'city_qujiang', name: '韶关', factionId: 'shaozhou', lat: 24.8, lng: 113.59, type: 'pass', troops: 30000, region: 'LINGNAN', note: '韶州治；粤北关隘门户（梅岭古道咽喉）；张镇孙南宋末抗元，殉国大庾岭（1278）' },
    { id: 'city_bodao', name: '珙县', factionId: 'boren', lat: 28.76, lng: 104.62, type: 'small_city', region: 'BASHU', troops: 30000, note: '僰人悬棺故地；阿大僰人起事（僰道旧称，避旗号防重）' },
    { id: 'city_nanpu', name: '南浦', factionId: 'wanzhou', lat: 30.82, lng: 108.38, type: 'small_city', region: 'BASHU', troops: 30000,
        note: '南浦；万州小城',
    },
    { id: 'city_baidicheng2', name: '白帝城', factionId: 'kui', lat: 31.0430, lng: 109.5700, type: 'pass', region: 'BASHU', troops: 30000, note: '夔门·白帝城；刘备白毦兵永安托孤' },
    { id: 'city_qichun', name: '蕲春', factionId: 'xushouhui', lat: 30.23, lng: 115.45, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_wancheng', name: '皖口', factionId: 'wan', lat: 30.51, lng: 117.04, type: 'pass', region: 'JIANGNAN', troops: 30000,
        note: '皖口；刘源安庆',
    },

    { id: 'city_jiuzi', name: '姑孰', factionId: 'danyang', lat: 31.55, lng: 118.47, type: 'small_city', troops: 30000, region: 'JIANGNAN' },



    { id: 'city_datong2', name: '大通', factionId: 'chizhou', lat: 30.8188, lng: 117.7762, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    // ── 2026-05-30 新增：哈拉和林(蒙古帝国首都) ──
    { id: 'city_karakorum', name: '哈拉和林', factionId: 'menggu_d', lat: 47.137441, lng: 103.035278, type: 'medium_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_xingzhuting', name: '星主厅', factionId: 'danluo', lat: 33.5131, lng: 126.5215, type: 'small_city', region: 'KOREA', troops: 30000, note: '南方/日本/朝鲜环线共用锚点；文化朝鲜（济州）' },
    { id: 'city_deokwon', name: '德源', factionId: 'donghui', lat: 39.54, lng: 127.24, type: 'pass', region: 'KOREA', troops: 30000, note: '朝鲜德源郡旧地；咸兴—平壤道关隘；≠黑龙江双城' },
    { id: 'city_yuezhi', name: '大木岳', factionId: 'chen3', lat: 36.8353, lng: 127.0417, type: 'pass', region: 'KOREA', troops: 30000,
        note: '大木岳；欢州关隘',
    },
    { id: 'city_heseluo', name: '何瑟罗', factionId: 'hui', lat: 37.75, lng: 128.89, type: 'small_city', region: 'KOREA', troops: 30000, note: '不耐侯濊族君长驻何瑟罗' },
    { id: 'city_wushecheng', name: '乌舍城', factionId: 'wula', lat: 45.821125, lng: 128.161011, type: 'small_city', troops: 30000, region: 'NORTHEAST' },


    { id: 'city_xianping', name: '咸平', factionId: 'houliao', lat: 42.579367, lng: 124.07959, type: 'small_city', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_xupin', name: '恤品', factionId: 'dazhen', lat: 42.994587, lng: 129.828186, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_huifa', name: '辉发', factionId: 'haixi_nvzhen', lat: 42.70463, lng: 125.922546, type: 'pass', troops: 30000, region: 'NORTHEAST' },


    { id: 'city_julunbo', name: '俱轮泊', factionId: 'shiwei', lat: 49.251593, lng: 118.262329, type: 'pass', region: 'STEPPE', troops: 30000,
        note: '俱轮泊；室韦小城',
    },
    { id: 'city_boli2', name: '勃利', factionId: 'mohe', lat: 48.48, lng: 135.07, type: 'small_city', troops: 30000, region: 'NORTHEAST' },




    { id: 'city_kuanchengzi', name: '宽城子', factionId: 'jilin', lat: 43.8725, lng: 125.3595, type: 'small_city', region: 'NORTHEAST', troops: 30000,
        note: '宽城子；吉林小城',
    },
    { id: 'city_wuliyasitai', name: '古尔班赛堪', factionId: 'wuzhumuqin', lat: 45.519, lng: 116.9604, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '乌珠穆沁；乌珠穆沁小城',
    },
    { id: 'city_saihantala', name: '赛汉塔拉', factionId: 'sunite', lat: 42.7701, lng: 112.6099, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '赛汉塔拉；苏尼特小城',
    },
    { id: 'city_sailan', name: '讹答剌', factionId: 'dayuzi', lat: 42.2863, lng: 69.5709, type: 'medium_city', troops: 30000, region: 'WESTERN' },

    { id: 'city_saiyinshanda', name: '薛灵哥', factionId: 'wuliangha', lat: 49.437762, lng: 101.428528, type: 'small_city', troops: 30000, region: 'STEPPE' },



    // ── 2026-06-18 新增：赛音山达（漠东隘口，叛军旗）──
    { id: 'city_saiyinsanda', name: '赛音山达', factionId: 'nuoyan_d', lat: 44.8870, lng: 110.1407, type: 'pass', region: 'STEPPE', troops: 30000, note: '赛音诺颜部牧地；喀尔喀中路（《清史稿·藩部传》）' },
    // ── 2026-06-19 特尔门·黑沙（草原）──
    { id: 'city_temermen', name: '特尔门',
        factionId: 'heisha_d', lat: 48.7386, lng: 97.8387, type: 'pass', region: 'STEPPE', troops: 30000, note: '土拉河支流；漠北牧地，近后突厥黑沙道（与黑沙城同系北疆要冲）' },
    { id: 'city_yancheng2', name: '郾城', factionId: 'yanchuan_d', lat: 33.58, lng: 114.03, type: 'small_city', troops: 30000, region: 'NORTH' },








    { id: 'city_xuanhu', name: '悬瓠', factionId: 'yuan_cj_d', lat: 33.01, lng: 114.36, type: 'small_city', troops: 30000, region: 'CENTRAL' },




    {
        id: 'city_yiluolucheng',
        name: '伊逻卢',
        factionId: 'qiuci',
        lat: 41.720000, lng: 82.930000, type: 'medium_city', troops: 30000, tier: 1, 
        note: '伊逻卢；龟兹治所/重镇', region: 'WESTERN' },
    { id: 'city_yuergun', name: '玉尔滚', factionId: 'weiwuer', lat: 41.35, lng: 81.3, type: 'small_city', region: 'WESTERN', troops: 30000, note: '伯克统领回部治安武装' },
    { id: 'city_bohuancheng', name: '拨换城', factionId: 'anxi', lat: 41.17, lng: 80.25, type: 'pass', troops: 30000, region: 'HEXI' },





    { id: 'city_dashicheng', name: '大石城', factionId: 'zhuxie', lat: 41.28, lng: 79.22, type: 'pass', region: 'WESTERN', troops: 30000,
        note: '大石城；朱邪关隘',
    },
    { id: 'city_weitoucheng', name: '阿合奇', factionId: 'weitou', lat: 40.3, lng: 79.05, type: 'small_city', region: 'WESTERN', troops: 30000, note: '尉头国王城驻军' },
    { id: 'city_wosedecheng', name: '握瑟德', factionId: 'sai', lat: 39.77, lng: 78.56, type: 'small_city', region: 'WESTERN', troops: 30000, note: '塞种部落骑射武装' },
    { id: 'city_jiaseni', name: '哥疾宁', factionId: 'jiazini', lat: 33.55, lng: 68.42, type: 'medium_city', region: 'CENTRAL_ASIA', troops: 30000, tier: 1,
        note: '哥疾宁；伽色尼治所/重镇',
    },
    // ── 2026-08-05 罽宾迁白沙瓦；喀布尔归还巴布尔（1504 发迹地）──
    { id: 'city_gaofu', name: '喀布尔', factionId: 'babuer', lat: 34.55, lng: 69.2, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA', note: '喀布尔；巴布尔发迹地（帖木儿王朝后裔 1504 占城）' },
    { id: 'city_baishawa', name: '白沙瓦', factionId: 'jibin', lat: 34.01, lng: 71.52, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA', note: '白沙瓦；罽宾（迦腻色迦贵霜都，犍陀罗核心）' },



    { id: 'city_fanyanna', name: '巴米扬', factionId: 'fanyanna', lat: 34.8659, lng: 67.9807, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000,
        note: '巴米扬；梵衍那小城',
    },
    { id: 'city_paixiucheng', name: '排修城', factionId: 'juandu', lat: 39.48, lng: 76.72, type: 'small_city', troops: 30000, region: 'WESTERN' },




    { id: 'city_daerhan', name: '达尔罕', factionId: 'keerqin', lat: 43.6064, lng: 122.2229, type: 'small_city', region: 'NORTHEAST', troops: 30000,
        note: '达尔罕；科尔沁小城',
    },
    { id: 'city_yiyang', name: '葛溪', factionId: 'xie_cj_d', lat: 28.3524, lng: 117.4466, type: 'small_city', region: 'JIANGNAN', troops: 30000,
        note: '葛溪；信州小城',
    },
    { id: 'city_linchuan', name: '临川', factionId: 'fu2', lat: 27.9779, lng: 116.3562, type: 'small_city', region: 'JIANGNAN', troops: 30000, note: '抚州治临川；陈周迪据守，临川郡兵' },
    { id: 'city_binzhou2', name: '新平', factionId: 'xinping', lat: 35.03, lng: 108.08, type: 'small_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_fangqu', name: '方渠', factionId: 'huan', lat: 36.58, lng: 107.3, type: 'small_city', region: 'HEXI', troops: 30000,
        note: '方渠；环州小城',
    },
    { id: 'city_jingsai', name: '静塞', factionId: 'wei2', lat: 37.448637, lng: 106.674500, type: 'pass', region: 'HEXI', troops: 30000, mirror: true,
        note: '静塞；静塞关隘',
    },//镜像
    { id: 'city_lingzhou', name: '回乐', factionId: 'lingzhou', lat: 37.998341, lng: 106.295471, type: 'small_city', region: 'HEXI', troops: 30000,
        note: '回乐；灵武小城',
    },
    { id: 'city_nuergan', name: '特林', factionId: 'nuergan', lat: 52.92, lng: 139.77, type: 'pass', region: 'NUERGAN', troops: 30000, note: '明奴儿干都司；康旺；旗面「都卫」避与据点名 §4.1 防重' },
    { id: 'city_pennuli', name: '盆奴里', factionId: 'nifuhe', lat: 47.708134, lng: 130.933685, type: 'small_city', troops: 30000, region: 'NORTHEAST' },

    // 古尔王朝（Ghurids）呼罗珊边缘要塞
    { id: 'city_malulude', name: '马尔夫鲁德', factionId: 'muer', lat: 35.58, lng: 63.32, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },



    // 巴达赫尚（Badakhshan）山地政权
    { id: 'city_pengdi', name: '彭迪', factionId: 'maer_d', lat: 36, lng: 62.7, type: 'pass', troops: 30000, region: 'CENTRAL_ASIA', mirror: true },



    // 黠戛斯（坚昆）汗庭漠北牧地
    { id: 'city_wubusabo', name: '乌布萨泊', factionId: 'xiajiasi', lat: 49.9762, lng: 92.0929, type: 'small_city', region: 'STEPPE', troops: 30000,
        note: '乌布萨泊；坚昆小城',
    },
    { id: 'city_zhenzhuhe', name: '真珠河', factionId: 'wuhu', lat: 41.2773, lng: 67.9312, type: 'pass', region: 'WESTERN', troops: 30000, mirror: true,
        note: '真珠河；乌护关隘',
    },//镜像
    { id: 'city_wuyun', name: '乌云', factionId: 'hezhe', lat: 49.018048, lng: 129.91539, type: 'pass', troops: 30000, region: 'NORTHEAST' },



    // 占城国（林邑/环王国）佛临城阇槃；与占婆国（美山）分立，各 1 势力 1 据点
    { id: 'city_dupan', name: '阇槃', factionId: 'zhancheng', lat: 13.93, lng: 109.11, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    // 孟邦墨侬族故地
    { id: 'city_bangdun', name: '邦敦', factionId: 'monong', lat: 12.87, lng: 107.8, type: 'small_city', troops: 30000,
        note: '邦敦；墨侬小城', region: 'LINGNAN' },
    // 水真腊南境部族
    { id: 'city_sanpu', name: '三菩', factionId: 'shuizhen', lat: 12.77, lng: 105.97, type: 'small_city', troops: 30000,
        note: '三菩；水真小城', region: 'LINGNAN' },
    { id: 'city_juyansai', name: '遮虏障', factionId: 'ningkou', lat: 41.8942, lng: 101.044, type: 'pass', troops: 30000, region: 'HEXI', note: '李陵五千步卒浚稽山血战匈奴八万骑' },




    { id: 'city_gongzhubao', name: '公主堡', factionId: 'kepantuo', lat: 37.2008, lng: 75.3745, type: 'pass', troops: 30000, 
        note: '公主堡；渴盘陀关隘', region: 'WESTERN' },
    { id: 'city_jimai', name: '吉麦', factionId: 'gongtang', lat: 29.3012, lng: 90.6812, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '吉麦；贡唐小城',
    },
    // ── 2026-06-11 新增：库页岛民族据点 ──
    { id: 'city_nuotuoluo', name: '诺托罗', factionId: 'eluoke', lat: 49.2, lng: 143.1, type: 'pass', region: 'NUERGAN', troops: 30000, note: '库页岛东岸中部河口，鄂罗克渔猎放牧聚散中心' },
    { id: 'city_baizhu', name: '白主', factionId: 'kuye', lat: 46.71, lng: 142.52, type: 'pass', region: 'NUERGAN', troops: 30000, note: '库页岛南部白主土城，元代征骨嵬遗址，库页族核心聚落' },
    { id: 'city_bailao', name: '白老', factionId: 'ayinu', lat: 42.55, lng: 141.36, type: 'small_city', region: 'NUERGAN', troops: 30000, note: '北海道南端据泊地方，阿伊努传统聚落（白老古名）' },
    { id: 'city_zonggu', name: '宗谷', factionId: 'beihai', lat: 45.5, lng: 141.93, type: 'small_city', troops: 30000, region: 'NUERGAN' },
    { id: 'city_xierka', name: '锡尔喀', factionId: 'dongping', lat: 46.9, lng: 134.1, type: 'pass', troops: 20000, region: 'NORTHEAST' },
    { id: 'city_niman', name: '尼满', factionId: 'wure', lat: 45.51, lng: 131.96, type: 'small_city', region: 'NORTHEAST', troops: 30000, note: '兀惹部乌昭度居地（《辽史》）' },
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境据点 ──
    { id: 'city_nibuchu', name: '尼布楚', factionId: 'ewenki', lat: 51.99, lng: 116.58, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_yakesa', name: '雅克萨', factionId: 'aola', lat: 53.39056, lng: 124.0775, type: 'pass', region: 'NORTHEAST', troops: 30000, note: '黑龙江与额木尔河汇口，达斡尔敖拉氏故地（《朔方备乘》）' },
    { id: 'city_geerbiqi', name: '格尔必齐', factionId: 'maomingan', lat: 53.33, lng: 121.45, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_shilekahe', name: '石勒喀城', factionId: 'bulat', lat: 51.7321, lng: 115.8151, type: 'small_city', region: 'STEPPE', troops: 30000, note: '石勒喀河岸要塞城；近尼布楚而分立；布拉特' },
    { id: 'city_chita', name: '赤塔', factionId: 'buriat', lat: 52.0333, lng: 113.5017, type: 'small_city', region: 'STEPPE', troops: 30000, note: '布里亚特酋长统林中射手世居赤塔' },
    { id: 'city_yangjigan', name: '养吉干', factionId: 'xianhai', lat: 45.6, lng: 62, type: 'pass', region: 'STEPPE', troops: 30000, note: '中亚环线锚点；锡尔河入咸海处要塞，花剌子模东北边境' },
    { id: 'city_zhande', name: '毡的', factionId: 'wugu_d', lat: 44.85, lng: 65.5, type: 'small_city', troops: 30000, region: 'STEPPE' },

    // ── 2026-06-11 新增：琉球/台湾据点（叛军旗）──
    { id: 'city_mengjia', name: '艋舺', factionId: 'ketagalan', lat: 25.03, lng: 121.50, type: 'pass', region: 'LINGNAN', troops: 30000, note: '清代台北府淡水厅南境要地，万华故称艋舺' },
    { id: 'city_diaoyudao', name: '钓鱼岛', factionId: 'haikou', lat: 25.75, lng: 123.5, type: 'pass', troops: 30000, region: 'BASHU' },



    { id: 'city_gugudao', name: '平良', factionId: 'gonggu', lat: 24.805, lng: 125.281, type: 'small_city', troops: 30000, region: 'JAPAN' },

    { id: 'city_qihe', name: '哲德', factionId: 'xierhe', lat: 44.2219, lng: 64.3332, type: 'small_city', region: 'STEPPE', troops: 30000, note: '锡尔河下游Jand/毡的故址一带（哲德为异译）；乌古斯后钦察要城；非七河地区' },
    // ── 2026-06-20 替换：巴哈尔兹·泰巴德（原扎姆）──
    { id: 'city_taibade', name: '泰巴德', factionId: 'baha', lat: 34.7763, lng: 60.7764, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, note: '巴哈尔兹区泰巴德；呼罗珊东南边境重镇，巴哈尔兹重甲戟兵驻防' },
    // ── 2026-06-20 新增：哈里·萨拉赫斯 ──
    { id: 'city_salahesi', name: '萨拉赫斯', factionId: 'hali', lat: 36.5449, lng: 61.1577, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },



    // ── 2026-06-20 新增：卡伦·图斯 ──
    { id: 'city_tusi', name: '图斯', factionId: 'kalan', lat: 36.45, lng: 59.57, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, note: '古图斯/马什哈德近郊；卡伦家族（Karen-Pahlav）世袭领地，萨珊东北边防元帅驻跸' },
    // ── 2026-06-20 新增：锡斯坦·博斯特 ──
    { id: 'city_bosite', name: '博斯特', factionId: 'xisi', lat: 31.5833, lng: 64.3600, type: 'small_city', region: 'CENTRAL_ASIA', troops: 30000, note: '赫尔曼德河畔博斯特/拉什卡尔加；萨法尔王朝雅库布铜匠起兵之地，锡斯坦核心重镇' },
    // ── 2026-06-20 新增：德兰吉亚·法拉 ──
    { id: 'city_fala', name: '法拉', factionId: 'delan', lat: 32.3700, lng: 62.1100, type: 'pass', region: 'CENTRAL_ASIA', troops: 30000, note: '古德兰吉亚省法拉河畔要塞；苏伦家族世袭领地，帕提亚东境战略枢纽' },
    // ── 2026-06-20 新增：杜兰尼·坎大哈 ──
    { id: 'city_kandaha', name: '坎大哈', factionId: 'dulan_d', lat: 31.6289, lng: 65.7372, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },

    // ── 2026-06-20 新增：呼罗珊·赫拉特 ──
    { id: 'city_helate', name: '赫拉特', factionId: 'huluo', lat: 34.3419, lng: 62.2031, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },


    // ── 2026-06-20 新增：阿巴尔·尼沙布尔 ──
    { id: 'city_nishabuer', name: '尼沙布尔', factionId: 'aba', lat: 36.2133, lng: 58.7958, type: 'medium_city', tier: 1, region: 'CENTRAL_ASIA', troops: 30000, note: '萨珊省治，呼罗珊枢纽' },
    // —— 2026-06-20 新增：那竭国·顶骨城 ——
    { id: 'city_dinggucheng', name: '顶骨城', factionId: 'najie', lat: 34.43, lng: 70.45, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },

    // —— 2026-06-20 新增：旁遮普·阿托克 ——
    { id: 'city_atuoke', name: '阿托克', factionId: 'pangzha', lat: 33.7666, lng: 72.3608, type: 'pass', region: 'CENTRAL_ASIA', troops: 30000, note: '印度河阿托克要塞；兰季特·辛格旁遮普帝国西北锁钥，哈里·辛格扼开伯尔隘口' },
    { id: 'city_shwebo', name: '瑞波', factionId: 'konbaung', lat: 22.57, lng: 95.7, type: 'pass', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_hengyu', name: '横屿', factionId: 'qi_d', lat: 26.77, lng: 119.7, type: 'pass', troops: 30000, region: 'JIANGNAN' },


    { id: 'city_luobo', name: '罗博', factionId: 'buyi_d', lat: 25.4112, lng: 106.7377, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_situo', name: '思陀', factionId: 'hani_d', lat: 23.2243, lng: 102.8485, type: 'small_city', region: 'DIANQIAN', troops: 30000,
        note: '思陀；哈尼小城',
    },
    { id: 'city_shangding', name: '上丁', factionId: 'basha_d', lat: 13.5581, lng: 106.0098, type: 'small_city', region: 'LINGNAN', troops: 30000,
        note: '上丁；巴沙小城',
    },
    // ── 2026-06-12 新增：夏顿@廷布 ──
    { id: 'city_tingbu', name: '廷布', factionId: 'xiadun', lat: 27.472, lng: 89.639, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_huangchuan', name: '弋阳', factionId: 'huang_d', lat: 32.131, lng: 115.051, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_yongqiu', name: '雍丘', factionId: 'yuzhou', lat: 34.55, lng: 114.78, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_mengcheng', name: '蒙城', factionId: 'mengcheng_d', lat: 33.27, lng: 116.56, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '汉沛郡山桑县治地；唐天宝改蒙城县；庄子故里（有争议）' },
    { id: 'city_yongcheng', name: '永城', factionId: 'guide_d', lat: 33.93, lng: 116.37, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '归德府辖；芒砀山/汉高潜居；走廊东翼' },
    { id: 'city_kunyang', name: '昆阳', factionId: 'lulin', lat: 33.22, lng: 113.22, type: 'pass', region: 'CENTRAL', troops: 30000, note: '昆阳故城（叶县北）；绿林—刘秀昆阳之战' },
    { id: 'city_yucheng', name: '虞城', factionId: 'dang_d', lat: 34.7758, lng: 116.0678, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '汉砀郡属/虞国故地；豫东商丘东翼' },
    { id: 'city_bengbu', name: '钟离', factionId: 'hao_d', lat: 32.92, lng: 117.38, type: 'small_city', troops: 30000, region: 'CENTRAL' },




    { id: 'city_liaocheng', name: '聊城', factionId: 'bozhou_d', lat: 36.4322, lng: 115.9552, type: 'small_city', troops: 30000, region: 'CENTRAL' },


    { id: 'city_sapi', name: '萨毗城', factionId: 'gar', lat: 37.631470, lng: 88.884888, type: 'small_city', region: 'TIBET', troops: 30000,
        note: '萨毗城；噶尔氏小城',
    },
    { id: 'city_shayuan', name: '长宁', factionId: 'tongzhou', lat: 35.0032, lng: 109.9319, type: 'pass', region: 'CENTRAL', troops: 30000, note: '大荔沙苑；西魏沙苑之战古战场；唐沙苑监牧马地；同州治' },
    { id: 'city_gasikou', name: '噶斯口', factionId: 'qinghai', lat: 38.078345, lng: 89.288635, type: 'pass', troops: 30000, region: 'TIBET', mirror: true },


    { id: 'city_niubiziliang', name: '牛鼻子梁', factionId: 'golog', lat: 37.838198, lng: 91.678162, type: 'small_city', troops: 30000, region: 'TIBET' },

    { id: 'city_mahaitai', name: '马海台', factionId: 'xining', lat: 38.045995, lng: 94.622498, type: 'pass', troops: 30000, region: 'TIBET' },

    { id: 'city_taijinaier', name: '台吉乃尔', factionId: 'dulan', lat: 36.4266, lng: 94.896, type: 'pass', troops: 30000, region: 'TIBET' },



    { id: 'city_gasinaoer', name: '尕斯淖尔', factionId: 'kalun', lat: 38.3593, lng: 90.1334, type: 'pass', troops: 30000, region: 'TIBET', mirror: true },



    { id: 'city_jieqiao', name: '界桥', factionId: 'qu_d', lat: 36.95, lng: 115.5, type: 'pass', troops: 30000, region: 'NORTH' },

    { id: 'city_biaoshi', name: '表氏', factionId: 'juqu_d', lat: 39.8, lng: 99.8, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_hakone', name: '箱根关', factionId: 'sagami', lat: 35.1925, lng: 139.0261, type: 'pass', region: 'JAPAN', troops: 30000, note: '天下第一关，关东的物理大门' },
    { id: 'city_fuwa', name: '不破关', factionId: 'mino', lat: 35.3577, lng: 136.4602, type: 'pass', region: 'JAPAN', troops: 30000, note: '关原所在地，畿内防御东国大军的终极险地' },
    { id: 'city_cheollyeong', name: '铁岭关', factionId: 'ssangseong', lat: 38.8102, lng: 127.4959, type: 'pass', troops: 30000, region: 'NORTH' },

    { id: 'city_penghu', name: '澎湖', factionId: 'wenling', lat: 23.5, lng: 119.5, type: 'pass', troops: 20000, region: 'DIANQIAN' },

    { id: 'city_fengtian', name: '奉天', factionId: 'qianzhou', lat: 34.53, lng: 108.24, type: 'small_city', region: 'CENTRAL', troops: 30000, note: '李晟神策军收复长安' },
    { id: 'city_taqian', name: '它乾城', factionId: 'xiyuduhu', lat: 41.875, lng: 83.59, type: 'pass', troops: 30000, region: 'HEXI' },
    { id: 'city_shaozhou', name: '邵州', factionId: 'shaozhou_d', lat: 27.24, lng: 111.47, type: 'small_city', troops: 30000, region: 'JIANGNAN' },

    { id: 'city_zizhou_d', name: '梓州', factionId: 'zizhou', lat: 31.0788, lng: 105.0925, type: 'small_city', troops: 30000, region: 'JIANGNAN' },


    { id: 'city_qingchi', name: '清池', factionId: 'cangzhou', lat: 38.3, lng: 116.83, type: 'small_city', troops: 30000, region: 'NORTH' },
    { id: 'city_shandan', name: '删丹', factionId: 'yuezhi', lat: 38.78, lng: 101.08, type: 'small_city', troops: 30000, region: 'STEPPE' },

    { id: 'city_chongan', name: '崇安', factionId: 'minyue', lat: 27.76, lng: 118.02, type: 'small_city', troops: 30000, region: 'LINGNAN' },
    { id: 'city_piyetuo', name: '毗耶陀', factionId: 'funan', lat: 11.66, lng: 104.93, type: 'small_city', troops: 30000, region: 'LINGNAN', mirror: true },

    { id: 'city_langbolabang', name: '琅勃拉邦', factionId: 'lancang', lat: 20.0469, lng: 102.2292, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_geergang', name: '戈尔冈', factionId: 'ahaomu', lat: 27.479, lng: 94.8889, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_huma', name: '呼玛', factionId: 'elunchunzu', lat: 51.72, lng: 126.65, type: 'pass', troops: 30000, region: 'NORTHEAST' },

    { id: 'city_cangyuan', name: '沧源', factionId: 'wazu', lat: 23.3725, lng: 99.4263, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_huoluoge', name: '霍罗格', factionId: 'tajikezu', lat: 37.49, lng: 71.55, type: 'small_city', troops: 30000, region: 'WESTERN' },

    { id: 'city_mizhina', name: '密支那', factionId: 'jingpozu', lat: 25.38, lng: 97.4, type: 'small_city', troops: 30000, region: 'DIANQIAN' },

    { id: 'city_sandou', name: '三都', factionId: 'shuizu', lat: 25.98, lng: 107.87, type: 'small_city', troops: 30000, region: 'LINGNAN' },

    { id: 'city_tanzhong', name: '潭中', factionId: 'liuzhou', lat: 24.28, lng: 109.41, type: 'small_city', troops: 30000, region: 'LINGNAN' },
    { id: 'city_yunyang', name: '郧阳', factionId: 'luming', lat: 32.8127, lng: 110.8122, type: 'small_city', troops: 30000, region: 'CENTRAL' },
    { id: 'city_zhongshan', name: '中山', factionId: 'dingzhou', lat: 38.4708, lng: 115.0626, type: 'medium_city', troops: 30000, region: 'NORTH' },
    { id: 'city_ledou', name: '乐都', factionId: 'shanzhou', lat: 36.49, lng: 102.37, type: 'small_city', troops: 30000, region: 'TIBET', mirror: true },



    { id: 'city_xuecheng', name: '薛城', factionId: 'weizhou', lat: 31.43, lng: 103.16, type: 'small_city', troops: 30000, region: 'BASHU' },
    { id: 'city_zhangguojuncheng', name: '彰国军城', factionId: 'yingzhou_d2', lat: 39.5761, lng: 113.1894, type: 'pass', troops: 30000, region: 'NORTH' },

    { id: 'city_yunzhongcheng', name: '君子津', factionId: 'dongsheng', lat: 40.2732, lng: 111.1404, type: 'pass', troops: 30000, region: 'STEPPE' },

    { id: 'city_haomen', name: '浩门', factionId: 'weiyuan', lat: 37.464, lng: 101.4258, type: 'pass', troops: 30000, region: 'HEXI' },
    { id: 'city_yulin', name: '榆林', factionId: 'yansui', lat: 38.3567, lng: 109.7644, type: 'small_city', troops: 30000, region: 'CENTRAL' },
    { id: 'city_jingbianbao', name: '靖边堡', factionId: 'xiazhou', lat: 37.5685, lng: 108.8608, type: 'pass', troops: 30000, region: 'HEXI' },
    { id: 'city_quyancheng', name: '朐衍城', factionId: 'yanzhou', lat: 37.7794, lng: 107.4078, type: 'small_city', troops: 30000, region: 'HEXI' },

    { id: 'city_lishi', name: '离石', factionId: 'shizhou', lat: 37.48, lng: 111.09, type: 'small_city', troops: 30000, region: 'NORTH' },
    { id: 'city_chiwubao', name: '赤乌堡', factionId: 'cangsong', lat: 37.477, lng: 102.8815, type: 'pass', troops: 30000, region: 'HEXI' },


    { id: 'city_wulihong', name: '乌利洪', factionId: 'manghuti', lat: 49.53, lng: 112.54, type: 'small_city', troops: 30000, region: 'STEPPE' },
    { id: 'city_mubang', name: '木邦', factionId: 'xingwei', lat: 23.32, lng: 97.98, type: 'small_city', troops: 30000, region: 'DIANQIAN' },
    { id: 'city_baihage', name: '白哈格', factionId: 'saerbadaer', lat: 36.21, lng: 57.68, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_damugan', name: '达姆甘', factionId: 'kumisi', lat: 36.17, lng: 54.35, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_leiyi', name: '雷伊', factionId: 'ribale', lat: 35.6, lng: 51.44, type: 'medium_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_jiaziwen', name: '加兹温', factionId: 'safawei', lat: 36.27, lng: 50, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },


    { id: 'city_zanzhan', name: '赞詹', factionId: 'yilihanguo', lat: 36.67, lng: 48.48, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },



    { id: 'city_dabulishi', name: '大不里士', factionId: 'yilihanguo_d', lat: 38.08, lng: 46.29, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_malagai', name: '马拉盖', factionId: 'asaibaijiang', lat: 37.39, lng: 46.24, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_ailiwen', name: '埃里温', factionId: 'wulaertu', lat: 40.18, lng: 44.51, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_dibilisi', name: '第比利斯', factionId: 'gelujiya', lat: 41.72, lng: 44.79, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_telabuzong', name: '特拉布宗', factionId: 'bendou', lat: 41, lng: 39.73, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },

    { id: 'city_kutayixi', name: '库塔伊西', factionId: 'keerjisi', lat: 42.27, lng: 42.7, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_amaxiya', name: '阿马西亚', factionId: 'bendou_d', lat: 40.65, lng: 35.83, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_hatusha', name: '哈图沙', factionId: 'heti', lat: 40.02, lng: 34.61, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_geerdiweng', name: '戈尔迪乌姆', factionId: 'fulijiya', lat: 39.65, lng: 31.98, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_sifaerde', name: '斯法尔德', factionId: 'ldiya', lat: 38.48, lng: 28.03, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_peierjiameng', name: '佩尔加蒙', factionId: 'pajiama', lat: 39.12, lng: 27.18, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_nixiya', name: '尼凯亚', factionId: 'bitiniya', lat: 40.43, lng: 29.72, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_junshitandingbao', name: '君士坦丁堡', factionId: 'baizanting', lat: 41.01, lng: 28.97, type: 'big_city', troops: 20000, region: 'LATIN' },
    { id: 'city_yikeniwumu', name: '伊科尼乌姆', factionId: 'luomu', lat: 37.87, lng: 32.48, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_antiejiya', name: '安提俄基亚', factionId: 'sailiugu', lat: 36.2, lng: 36.16, type: 'big_city', troops: 30000, region: 'WEST_ASIA', mirror: true },
    { id: 'city_damasikusi', name: '大马士革', factionId: 'womaya', lat: 33.51, lng: 36.29, type: 'big_city', troops: 30000, region: 'WEST_ASIA', note: '倭马亚都，西亚千年都会' },

    { id: 'city_yelusaleng', name: '耶路撒冷', factionId: 'xibolai', lat: 31.77, lng: 35.21, type: 'medium_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_ake', name: '阿卡', factionId: 'shengdian_qishi', lat: 32.93, lng: 35.08, type: 'pass', troops: 20000, region: 'WEST_ASIA', mirror: true },
    { id: 'city_mengfeisi', name: '孟菲斯', factionId: 'aiji', lat: 29.85, lng: 31.25, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_wasaite', name: '瓦塞特', factionId: 'dibisi', lat: 25.7, lng: 32.64, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_yalishanda', name: '亚历山大', factionId: 'tuolemi', lat: 31.2, lng: 29.91, type: 'big_city', troops: 30000, region: 'WEST_ASIA', mirror: true },
    { id: 'city_babilun', name: '巴比伦', factionId: 'jialedi', lat: 32.53, lng: 44.42, type: 'big_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_tademoer', name: '塔德莫尔', factionId: 'paermila', lat: 34.55, lng: 38.27, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_bageda', name: '巴格达', factionId: 'abasi', lat: 33.33, lng: 44.37, type: 'big_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_awalisi', name: '阿瓦里斯', factionId: 'xikesuosi', lat: 30.79, lng: 31.83, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_duershelujin', name: '尼尼微', factionId: 'yashu', lat: 36.36, lng: 43.15, type: 'medium_city', troops: 30000, region: 'WEST_ASIA' },

    { id: 'city_anate', name: '阿纳特', factionId: 'youfaladi', lat: 34.47, lng: 41.96, type: 'pass', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_hamadan', name: '哈马丹', factionId: 'midi', lat: 34.8, lng: 48.51, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_adana', name: '阿达纳', factionId: 'qiliqiya', lat: 37.06, lng: 35.77, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_bosibolisi', name: '波斯波利斯', factionId: 'aqimeinide', lat: 29.93, lng: 52.89, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_susa', name: '苏萨', factionId: 'ailan', lat: 32.19, lng: 48.24, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_yisifahan', name: '伊斯法罕', factionId: 'safawei_d', lat: 32.65, lng: 51.66, type: 'medium_city', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_wuluke', name: '乌鲁克', factionId: 'sumeier', lat: 31.32, lng: 45.64, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_alepo', name: '阿勒颇', factionId: 'ayoubu', lat: 36.2, lng: 37.16, type: 'medium_city', troops: 30000, region: 'WEST_ASIA', note: '阿尤布都，黎凡特商路枢纽' },
    // ── 2026-08-04 新增：埃德萨（奥斯若恩国都；十字军埃德萨伯国首府）──
    { id: 'city_aidesa', name: '埃德萨', factionId: 'aosiruowen', lat: 37.1674, lng: 38.7955, type: 'medium_city', troops: 30000, region: 'WEST_ASIA', note: '今土耳其乌尔法（Şanlıurfa）；塞琉古建城名埃德萨，奥斯若恩王国国都；叙利亚基督教中心；1098–1144十字军埃德萨伯国首府；与尼尼微—阿勒颇走廊十字路口' },
    { id: 'city_daerban', name: '打耳班', factionId: 'kesa', lat: 42.06, lng: 48.3, type: 'pass', troops: 30000, region: 'CENTRAL_ASIA' },
    { id: 'city_yifusuo', name: '以弗所', factionId: 'aiaoniya', lat: 37.94, lng: 27.34, type: 'medium_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_ankala', name: '安卡拉', factionId: 'jialatai', lat: 39.93, lng: 32.87, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_yashucheng', name: '亚述城', factionId: 'guyashu', lat: 35.46, lng: 43.26, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_nisa', name: '尼萨', factionId: 'ansxi', lat: 37.9, lng: 58.2, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA', note: '安息（帕提亚）帝国第一个首都与皇家陵园，UNESCO世界遗产' },
    { id: 'city_peitra', name: '佩特拉', factionId: 'nabatai', lat: 30.3, lng: 35.4, type: 'small_city', troops: 30000, region: 'WEST_ASIA', note: '纳巴泰王国首都；公元363/551年大地震后彻底废弃沦为古城遗址，18世纪前无常住人口' },
    { id: 'city_laheer', name: '拉合尔', factionId: 'xike', lat: 31.55, lng: 74.35, type: 'medium_city', troops: 30000, region: 'DIANQIAN', note: '锡克帝国首都，兰季特·辛格"拉合尔之狮"，统一旁遮普' },
    { id: 'city_deli', name: '德里', factionId: 'deli', lat: 28.61, lng: 77.23, type: 'big_city', troops: 30000, region: 'DIANQIAN', note: '德里苏丹国首都（1206–1526），阿拉乌丁·卡尔吉击退蒙古入侵，帝国版图巅峰' },
    { id: 'city_agela', name: '阿格拉', factionId: 'mowoer', lat: 27.18, lng: 78.02, type: 'big_city', troops: 30000, region: 'DIANQIAN', note: '莫卧儿帝国首都（阿克巴大帝），泰姬陵所在地' },
        { id: 'city_qunvcheng', name: '曲女城', factionId: 'jieri', lat: 27.05, lng: 79.92, type: 'medium_city', troops: 30000, region: 'DIANQIAN', note: '戒日帝国首都，玄奘到访，统一北印度' },
    { id: 'city_walanaxi', name: '瓦拉纳西', factionId: 'jiashi_d', lat: 25.32, lng: 83.01, type: 'medium_city', troops: 30000, region: 'DIANQIAN', note: '迦尸国（十六雄国之一）首都，印度教圣城；城居常估约10万级（约1300年前后破10万、1600年约15万），升 medium_city' },
        { id: 'city_huashicheng', name: '华氏城', factionId: 'kongque', lat: 25.61, lng: 85.13, type: 'big_city', troops: 30000, region: 'DIANQIAN', mirror: true },

        { id: 'city_wangshecheng', name: '王舍城', factionId: 'mojietuo', lat: 25.03, lng: 85.42, type: 'medium_city', troops: 30000, region: 'DIANQIAN', note: '摩揭陀王国古都（频毗娑罗/阿阇世王），佛陀弘法地' },
    { id: 'city_gaodacheng', name: '高达城', factionId: 'boluo', lat: 24.88, lng: 88.13, type: 'big_city', troops: 30000, region: 'DIANQIAN', note: '波罗帝国首都（达磨波罗），印度最后一个佛教大帝国' },
        { id: 'city_danmoledi', name: '耽摩栗底', factionId: 'sumo', lat: 22.28, lng: 87.92, type: 'small_city', troops: 30000, region: 'DIANQIAN', note: '古代孟加拉湾第一大港，海上丝路起点，法显回国出发港' },
    { id: 'city_beileinisi', name: '贝雷尼斯', factionId: 'beileinisi', lat: 23.91, lng: 35.48, type: 'small_city', troops: 30000, region: 'WEST_ASIA', note: '托勒密/罗马时期埃及红海第一大港，通往印度商路起点' },
    { id: 'city_taima', name: '泰马', factionId: 'dedan', lat: 27.6, lng: 38.5, type: 'small_city', troops: 30000, region: 'WEST_ASIA', note: '德丹王国古商路大绿洲，纳巴泰/阿拉伯贸易枢纽' },
        { id: 'city_maidina', name: '麦地那', factionId: 'maidina', lat: 24.5, lng: 39.6, type: 'medium_city', troops: 30000, region: 'WEST_ASIA', note: '伊斯兰第二圣城，第一个伊斯兰国家首都，先知迁徙地' },
        { id: 'city_maijia', name: '麦加', factionId: 'gulaishi', lat: 21.4, lng: 39.8, type: 'medium_city', troops: 30000, region: 'WEST_ASIA', note: '伊斯兰第一圣城，古莱什部落控制，克尔白天房所在地' },
    { id: 'city_baku', name: '巴库', factionId: 'xierwan', lat: 40.4, lng: 49.9, type: 'small_city', troops: 30000, region: 'CENTRAL_ASIA', note: '希尔万要塞/拜火教圣地；18世纪前常住人口仅约1万，19世纪石油时代后爆发增长' },
    { id: 'city_xiemianjieer', name: '谢缅杰尔', factionId: 'xiemian', lat: 43, lng: 47.4, type: 'small_city', troops: 30000, region: 'STEPPE', note: '可萨汗国早期首都；10世纪被罗斯大公斯维亚托斯拉夫摧毁后彻底废弃淹没' },
        { id: 'city_yidier', name: '伊蒂尔', factionId: 'yidier', lat: 46, lng: 48, type: 'medium_city', troops: 30000, region: 'STEPPE', note: '可萨汗国鼎盛期首都，伏尔加河三角洲，丝路草原枢纽' },
    { id: 'city_salaichuke', name: '萨莱楚克', factionId: 'salai', lat: 47.5, lng: 51.7, type: 'medium_city', troops: 30000, region: 'STEPPE', note: '金帐汗国乌拉尔河渡口大城，草原丝路伏尔加-中亚段枢纽' },
    { id: 'city_mangshilake', name: '曼格什拉克', factionId: 'mangshi', lat: 44, lng: 52, type: 'small_city', troops: 30000, region: 'STEPPE', note: '里海东岸曼格什拉克半岛，乌古斯/塞尔柱草原商路门户' },
    { id: 'city_kefu', name: '科孚', factionId: 'kejila', lat: 39.62, lng: 19.92, type: 'pass', troops: 30000, region: 'LATIN', note: '古科基拉城邦都城（前8世纪-前229年独立），威尼斯堡垒扼亚得里亚海出口，四次围城' },
    { id: 'city_malta', name: '马耳他', factionId: 'maerta_qishi', lat: 35.9, lng: 14.44, type: 'pass', troops: 30000, region: 'LATIN', note: '医院骑士团堡垒岛驻地（1530起），1565马耳他大围攻圣埃尔莫堡血战' },
    { id: 'city_gebenhagen', name: '哥本哈根', factionId: 'danmai', lat: 55.68, lng: 12.57, type: 'small_city', troops: 30000, region: 'GERMANIC', note: '哥本哈根；丹麦，阿布萨隆 1167 建城' },
    { id: 'city_sidedegelmo', name: '斯德哥尔摩', factionId: 'ruidian_si', lat: 59.32, lng: 18.06, type: 'medium_city', troops: 20000, region: 'GERMANIC' },
    { id: 'city_madeli', name: '马德里', factionId: 'kasidiliya', lat: 40.41, lng: -3.7, type: 'medium_city', troops: 30000, region: 'LATIN' },
    { id: 'city_boertu', name: '波尔图', factionId: 'duluo', lat: 41.15, lng: -8.62, type: 'small_city', troops: 30000, region: 'LATIN', note: '波尔图；杜罗河口，葡萄牙国名发源地' },
    { id: 'city_teluoyi', name: '特洛伊', factionId: 'teluoyi', lat: 39.95, lng: 26.23, type: 'small_city', troops: 30000, region: 'WEST_ASIA' },
    { id: 'city_bashila', name: '巴士拉', factionId: 'alabo', lat: 30.50, lng: 47.78, type: 'medium_city', troops: 30000, region: 'WEST_ASIA', note: '巴士拉；阿拉伯帝国 636 年军事营地' },
        ];
// ── 14 文化区（RegionType）────────────────────────────────
// region: 'JAPAN',         // 日本
// region: 'KOREA',         // 朝鲜
// region: 'NORTHEAST',     // 东北
// region: 'STEPPE',        // 草原
// region: 'WESTERN',       // 西域
// region: 'CENTRAL_ASIA',  // 中亚
// region: 'TIBET',         // 青藏
// region: 'DIANQIAN',      // 滇缅
// region: 'LINGNAN',       // 岭南
// region: 'BASHU',         // 川蜀
// region: 'HEXI',          // 河西
// region: 'NORTH',         // 北方
// region: 'CENTRAL',       // 中原
// region: 'JIANGNAN',      // 南方