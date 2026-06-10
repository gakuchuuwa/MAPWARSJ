import * as fs from 'fs';
import * as path from 'path';

// --- Historical City Coordinate Dictionary (WGS84) ---
// Sources: Historical Geography of China, Google Earth, CHGIS
const CITY_COORDS: Record<string, { lat: number, lng: number, note?: string }> = {
    // === Core Capitals ===
    '长安': { lat: 34.2655, lng: 108.9543, note: 'Tang Chang\'an / Modern Xi\'an' },
    '洛阳': { lat: 34.6197, lng: 112.4536, note: 'Han/Tang Luoyang' },
    '开封': { lat: 34.7973, lng: 114.3072, note: 'Northern Song Bianjing' },
    '许昌': { lat: 34.0353, lng: 113.8260, note: 'Han Xuchang' }, // Xinzheng/Xuchang divergence handled by ID if needed
    '睢阳': { lat: 34.3815, lng: 115.6525, note: 'Song Dynasty Suiyang' },
    '天水': { lat: 34.5809, lng: 105.7249 },
    '燕京': { lat: 39.9042, lng: 116.4074, note: 'Beijing' },
    '朝歌': { lat: 35.6011, lng: 114.2078 },
    '邯郸': { lat: 36.6257, lng: 114.5392, note: 'Zhao Capital' },
    '临淄': { lat: 36.8831, lng: 118.4276, note: 'Qi Capital' },
    '晋阳': { lat: 37.7083, lng: 112.4737, note: 'Taiyuan' },
    '临潢': { lat: 43.8333, lng: 119.2333, note: 'Liao Shangjing' },
    '会宁': { lat: 45.5458, lng: 126.9686, note: 'Jin Shangjing (Acheng)' },
    '丸都': { lat: 41.1775, lng: 126.1747, note: 'Goguryeo Capital' },
    '建康': { lat: 32.0603, lng: 118.7969, note: 'Nanjing' },
    '寿春': { lat: 32.5855, lng: 116.7972, note: 'Shouxian' },
    '姑苏': { lat: 31.2989, lng: 120.5853, note: 'Suzhou' },
    '绍兴': { lat: 29.9958, lng: 120.5861 },
    '南昌': { lat: 28.6820, lng: 115.8579 },
    '福州': { lat: 26.0745, lng: 119.2965 },
    '番禺': { lat: 23.1291, lng: 113.2644, note: 'Guangzhou' },
    '桂林': { lat: 25.2736, lng: 110.2902 },
    '江陵': { lat: 30.3541, lng: 112.1901, note: 'Jingzhou Ancient City' },
    '襄阳': { lat: 32.0090, lng: 112.1228 },
    '江夏': { lat: 30.5402, lng: 114.3060, note: 'Wuchang' },
    '临湘': { lat: 28.2282, lng: 112.9388, note: 'Changsha' },
    '成都': { lat: 30.6570, lng: 104.0661 },
    '南郑': { lat: 33.0728, lng: 107.0244, note: 'Hanzhong' },
    '姑臧': { lat: 37.9283, lng: 102.6371, note: 'Wuwei' },
    '兴庆': { lat: 38.4872, lng: 106.2309, note: 'Yinchuan' },
    '鄯城': { lat: 36.6171, lng: 101.7782, note: 'Xining' },
    '逻些': { lat: 29.6520, lng: 91.1172, note: 'Lhasa' },
    '大理': { lat: 25.6980, lng: 100.1619 },
    '交趾': { lat: 21.0285, lng: 105.8542, note: 'Hanoi' },
    '碎叶': { lat: 42.8093, lng: 75.2952, note: 'Suyab' },
    '赤谷城': { lat: 42.1667, lng: 77.0833, note: 'Approx Wusun Capital' }, // Approximate
    '贵山': { lat: 40.2833, lng: 69.8000, note: 'Khujand' },
    '和林': { lat: 47.1975, lng: 102.8578, note: 'Karakorum' },
    '京都': { lat: 35.0116, lng: 135.7681 },
    '开城': { lat: 37.9611, lng: 126.5564 },

    // === Large Cities & Significant Locations ===
    '西城': { lat: 32.6844, lng: 109.0203, note: 'Ankang' },
    '开阳': { lat: 35.0607, lng: 118.3430, note: 'Linyi' },
    '白帝城': { lat: 31.0456, lng: 109.5694 },
    '九原': { lat: 40.6583, lng: 110.0381, note: 'Baotou' },
    '谯县': { lat: 33.8485, lng: 115.7728, note: 'Bozhou' },
    '布哈拉': { lat: 39.7681, lng: 64.4556 },
    '临沅': { lat: 29.0316, lng: 111.6985, note: 'Changde' },
    '长子': { lat: 36.1264, lng: 112.8711 },
    '常州': { lat: 31.8112, lng: 119.9741 },
    '桂阳': { lat: 25.7937, lng: 113.0480, note: 'Chenzhou' },
    '高昌': { lat: 42.8525, lng: 89.5273 },
    '大定': { lat: 41.5667, lng: 119.3000, note: 'Ningcheng' },
    '丹阳': { lat: 31.0000, lng: 119.5667, note: 'South Jiangsu' }, // Ambiguous, using general area
    '贰师': { lat: 40.5283, lng: 72.8097, note: 'Osh, Kyrgyzstan' }, // Approximate
    '定陶': { lat: 35.0747, lng: 115.5625 },
    '敦煌': { lat: 40.1421, lng: 94.6620 },
    '义渠': { lat: 35.7667, lng: 107.5167, note: 'Qingyang, Ningxian' }, // Approximate Qingyang
    '广陵': { lat: 32.3942, lng: 119.4129, note: 'Yangzhou' },
    '广信': { lat: 23.4764, lng: 111.3129, note: 'Wuzhou' },
    '龟兹': { lat: 41.7250, lng: 82.9367, note: 'Kuqa' },
    '合肥': { lat: 31.8206, lng: 117.2272 },
    '乐成': { lat: 38.3045, lng: 116.8388, note: 'Xianxian' }, // Hejian
    '淮安': { lat: 33.5042, lng: 119.1417 },
    '江户': { lat: 35.6895, lng: 139.6917, note: 'Tokyo' },
    '柴桑': { lat: 29.7056, lng: 115.9933, note: 'Jiujiang' },
    '巨鹿': { lat: 37.2189, lng: 115.0333 },
    '骏府': { lat: 34.9756, lng: 138.3828 },
    '谷昌': { lat: 25.0389, lng: 102.7183, note: 'Kunming' },
    '金城': { lat: 36.0611, lng: 103.8343, note: 'Lanzhou' },
    '襄平': { lat: 41.2700, lng: 123.1700, note: 'Liaoyang' },
    '平阳': { lat: 36.1009, lng: 111.5133, note: 'Linfen' },
    '林邑': { lat: 16.4674, lng: 107.5905, note: 'Hue, Vietnam' },
    '龙城': { lat: 47.4567, lng: 102.7444 }, // Ambiguous, often associated with Karakorum region
    '楼兰': { lat: 40.5200, lng: 89.9200 },
    '轮台': { lat: 41.7778, lng: 84.2528 }, // Luntai (Bugur)
    '木鹿': { lat: 37.6631, lng: 62.1931, note: 'Mary, Turkmenistan' },
    '尼沙普尔': { lat: 36.2133, lng: 58.7958 },
    '平壤': { lat: 39.0392, lng: 125.7625 },
    '濮阳': { lat: 35.7619, lng: 115.0292 },
    '历城': { lat: 36.6512, lng: 117.1200, note: 'Jinan' },
    '泉州': { lat: 24.9100, lng: 118.5800 },
    '建宁': { lat: 25.4947, lng: 103.7962, note: 'Qujing' },
    '雷伊': { lat: 35.5892, lng: 51.4394, note: 'Rey, Iran' },
    '日喀则': { lat: 29.2667, lng: 88.8833 },
    '沮阳': { lat: 40.4000, lng: 115.5333, note: 'Huailai' },
    '受降城': { lat: 41.0500, lng: 108.5167, note: 'Approximate Wuyuan/Baotou area' },
    '疏勒': { lat: 39.4704, lng: 75.9897, note: 'Kashgar' },
    '莎车': { lat: 38.4167, lng: 77.2417 },
    '太宰府': { lat: 33.5150, lng: 130.5231 },
    '第比利斯': { lat: 41.7151, lng: 44.8271 },
    '统万': { lat: 37.9947, lng: 108.8681, note: 'Tongwancheng Ruins' },
    '玉龙杰赤': { lat: 42.2133, lng: 59.1383, note: 'Konye-Urgench' },
    '宛': { lat: 32.9908, lng: 112.5283, note: 'Nanyang' },
    '代城': { lat: 39.7900, lng: 114.3900, note: 'Yuxian' },
    '襄武': { lat: 34.9750, lng: 104.6297, note: 'Longxi' },
    '下邳': { lat: 34.1350, lng: 117.9290, note: 'Suining (Pizhou)' },
    '彭城': { lat: 34.2048, lng: 117.2843, note: 'Xuzhou' },
    '肤施': { lat: 36.5854, lng: 109.4897, note: 'Yan\'an' },
    '焉耆': { lat: 42.0674, lng: 86.5682 },
    '叶米立': { lat: 46.5200, lng: 83.6000, note: 'Emil City/Tacheng' },
    '零陵': { lat: 26.2217, lng: 111.6146, note: 'Yongzhou' },
    '巴陵': { lat: 29.3787, lng: 113.1250, note: 'Yueyang' },
    '安邑': { lat: 35.0264, lng: 111.0069, note: 'Xia County (Ancient Anyi)' },
    '云中': { lat: 40.4200, lng: 111.2000, note: 'Togtoh' },
    '于阗': { lat: 37.1132, lng: 79.9197, note: 'Hotan' },
    '张掖': { lat: 38.9259, lng: 100.4497 },
    '柳城': { lat: 41.5620, lng: 120.4566, note: 'Chaoyang' },
    '真定': { lat: 38.1431, lng: 114.5714, note: 'Zhengding' },
    '重庆': { lat: 29.5630, lng: 106.5516 },
    '陈城': { lat: 33.7432, lng: 114.8872, note: 'Huaiyang' }, // Zhoukou
    '平城': { lat: 40.0768, lng: 113.2970, note: 'Datong' },

    // === Small Cities & Passes ===
    '黑龙江城': { lat: 50.0033, lng: 127.5333, note: 'Aihui' },
    '列城': { lat: 34.1526, lng: 77.5771, note: 'Leh' },
    '安市': { lat: 40.5000, lng: 122.9000, note: 'Haicheng area' },
    '白马': { lat: 35.4833, lng: 114.5333, note: 'Huaxian' },
    '柏乡': { lat: 37.4833, lng: 114.6833 },
    '陈仓': { lat: 34.3541, lng: 107.3942, note: 'Baoji' },
    '巴彦锡勒': { lat: 44.0200, lng: 116.3200, note: 'Xilinhot area' }, // Approx
    '巴音布鲁克': { lat: 42.8250, lng: 84.1500 },
    '采石矶': { lat: 31.6500, lng: 118.4700, note: 'Ma\'anshan' },
    '长坂': { lat: 30.9333, lng: 111.9500, note: 'Dangyang' },
    '长汀': { lat: 25.8344, lng: 116.3533 },
    '潮州': { lat: 23.6667, lng: 116.6333 },
    '赤壁': { lat: 29.8735, lng: 113.9056, note: 'Chibi Battle Site' },
    '大沽口': { lat: 38.9800, lng: 117.7200 },
    '达姆甘': { lat: 36.1683, lng: 54.3417 },
    '砀山': { lat: 34.4286, lng: 116.3528 },
    '武胜关': { lat: 31.9056, lng: 114.0772 },
    '杰尔宾特': { lat: 42.0620, lng: 48.2891 },
    '长平': { lat: 35.8000, lng: 112.9167, note: 'Gaoping' },
    '河曲': { lat: 39.3833, lng: 111.1500 },
    '涪城': { lat: 31.4644, lng: 104.7553, note: 'Mianyang' },
    '符离': { lat: 33.6278, lng: 117.0253, note: 'Suzhou Anhui Fuliji' },
    '雕阴': { lat: 36.1917, lng: 109.3083, note: 'Fuxian' },
    '垓下': { lat: 33.3500, lng: 117.6500, note: 'Lingbi' },
    '格尔木': { lat: 36.4037, lng: 94.9038 },
    '广岛': { lat: 34.3853, lng: 132.4553 },
    '海龙囤': { lat: 27.8167, lng: 106.8292 },
    '河州': { lat: 35.6025, lng: 103.2106, note: 'Linxia' }, // Hezhou Gansu
    '贺州': { lat: 24.4167, lng: 111.5500, note: 'Hezhou Guangxi' },
    '怀远': { lat: 32.9667, lng: 117.1833 },
    '呼玛': { lat: 51.7264, lng: 126.6586 },
    '吉安': { lat: 27.1130, lng: 114.9942 },
    '街亭': { lat: 34.9000, lng: 106.1833, note: 'Qin\'an County Longcheng Town' },
    '姬路': { lat: 34.8258, lng: 134.6946 },
    '精绝': { lat: 37.9500, lng: 82.7000, note: 'Niya Ruins' },
    '金华': { lat: 29.1028, lng: 119.6469 },
    '锦州': { lat: 41.0951, lng: 121.1270 },
    '九宫山': { lat: 29.4000, lng: 114.5667 },
    '居延海': { lat: 42.3000, lng: 101.0667 },
    '昌邑': { lat: 36.8589, lng: 119.3972, note: 'Juye/Changyi distinction' }, // Using Changyi Shandong
    '昆阳': { lat: 33.5933, lng: 113.3644, note: 'Ye County' },
    '廊坊': { lat: 39.5292, lng: 116.7036 },
    '连州': { lat: 24.7828, lng: 112.3833 },
    '林历山': { lat: 29.9300, lng: 117.9200, note: 'Approximate South Anhui' },
    '平凉': { lat: 35.5427, lng: 106.6653 },
    '蕲春': { lat: 30.2261, lng: 115.4353 },
    '且末': { lat: 38.1367, lng: 85.5300 },
    '清河城': { lat: 37.0500, lng: 115.6667, note: 'Qinghe County' },
    '武都': { lat: 33.4000, lng: 104.9167, note: 'Longnan' },
    '曲阿': { lat: 32.0000, lng: 119.5667, note: 'Danyang JS' },
    '荣县': { lat: 29.4583, lng: 104.4172 },
    '上庸': { lat: 32.3333, lng: 110.1500, note: 'Zhushan County' },
    '率宾': { lat: 43.8333, lng: 131.9000, note: 'Ussuriysk' },
    '顺昌': { lat: 26.7900, lng: 117.8000, note: 'Shunchang Fujian' },
    '松州': { lat: 32.6500, lng: 103.6000, note: 'Songpan' },
    '苏达克': { lat: 44.8515, lng: 34.9723 },
    '苏赫巴托': { lat: 50.2314, lng: 106.2078 },
    '临海': { lat: 28.8584, lng: 121.1442, note: 'Taizhou' },
    '恒罗斯': { lat: 42.5300, lng: 71.3700, note: 'Talas' },
    '天门岭': { lat: 41.5000, lng: 124.5000, note: 'Liaodong border' }, // Imprecise
    '威楚': { lat: 25.0333, lng: 101.5500, note: 'Chuxiong' },
    '温宿': { lat: 41.2764, lng: 80.2433 },
    '鹿城': { lat: 28.0000, lng: 120.7000, note: 'Wenzhou' },
    '五原': { lat: 41.1167, lng: 108.2667 }, // Modern Wuyuan
    '五丈原': { lat: 34.3000, lng: 107.5667, note: 'Wuzhang Plains' },
    '下相': { lat: 33.9500, lng: 118.2833, note: 'Suqian' },
    '牧野': { lat: 35.3000, lng: 113.9000, note: 'Xinxiang/Muye' },
    '信阳': { lat: 32.1477, lng: 114.0850 },
    '雁城': { lat: 26.8961, lng: 112.5714, note: 'Hengyang' },
    '宜宾': { lat: 28.7518, lng: 104.6433 },
    '夷陵': { lat: 30.6922, lng: 111.2967, note: 'Yichang' },
    '钓鱼城': { lat: 29.9964, lng: 106.2942, note: 'Diaoyu Fortress' },
    '伊吾': { lat: 43.2500, lng: 94.6833, note: 'Hami' },
    '榆林': { lat: 38.2847, lng: 109.7336 },
    '漳州': { lat: 24.5133, lng: 117.6472 },
    '忠州': { lat: 30.3000, lng: 108.0333, note: 'Zhongxian' },
    '朱提': { lat: 27.3300, lng: 103.7100, note: 'Zhaotong' },

    // Pass and Forts
    '倒马关': { lat: 39.0200, lng: 114.7300 },
    '函谷关': { lat: 34.6360, lng: 110.9575, note: 'Hangu Pass' },
    '大散关': { lat: 34.2200, lng: 106.9900 },
    '虎牢关': { lat: 34.8286, lng: 113.2086 },
    '剑门关': { lat: 32.1550, lng: 105.5700 },
    '嘉峪关': { lat: 39.8000, lng: 98.2100 },
    '居庸关': { lat: 40.2883, lng: 116.0686 },
    '昆仑关': { lat: 23.0167, lng: 108.7667 },
    '狼居胥山': { lat: 48.0000, lng: 107.0000, note: 'Khentii Mountains' },
    '偏头关': { lat: 39.4333, lng: 111.4833 },
    '平型关': { lat: 39.3000, lng: 113.8833 },
    '山海关': { lat: 39.9989, lng: 119.7544 },
    '韶关': { lat: 24.8106, lng: 113.5975 }, // Shaoguan City
    '潼关': { lat: 34.6000, lng: 110.2833 },
    '瓦桥关': { lat: 38.9833, lng: 116.0833, note: 'Xiongxian' },
    '武关': { lat: 33.6000, lng: 110.6667 },
    '仙人关': { lat: 33.5600, lng: 106.0200 },
    '萧关': { lat: 36.2167, lng: 106.3167, note: 'Guyuan' },
    '阳关': { lat: 39.8833, lng: 94.0333 },
    '阳平关': { lat: 32.9333, lng: 106.0333, note: 'Mianxian' },
    '雁门关': { lat: 39.2000, lng: 112.9000 },
    '玉门关': { lat: 40.3547, lng: 93.8589 },
    '紫荆关': { lat: 39.3833, lng: 115.1500 },
    '官渡': { lat: 34.6833, lng: 114.2167, note: 'Zhongmu' },
    '邺城': { lat: 36.3167, lng: 114.4167, note: 'Linzhang' },
    '蔡州': { lat: 32.9833, lng: 114.0167, note: 'Runan' },
    '绥德': { lat: 37.5019, lng: 110.2567 },
    '马邑': { lat: 39.3167, lng: 112.4333, note: 'Shuozhou' },
    '卢奴': { lat: 38.5147, lng: 114.9914, note: 'Dingzhou' },
    '北庭': { lat: 44.0200, lng: 89.1000, note: 'Jimsar' },
    '合浦': { lat: 21.6600, lng: 109.1800 },
    '土木堡': { lat: 40.3333, lng: 115.6333 },
    '公安': { lat: 30.0600, lng: 112.2300 },
    '麦城': { lat: 30.6800, lng: 111.9600, note: 'Near Dangyang/Zhijiang' },
    '梓潼': { lat: 31.6361, lng: 105.1764 },
    '戏水': { lat: 34.3833, lng: 109.3000, note: 'Lintong' },
    '乌巢': { lat: 35.0333, lng: 114.4333, note: 'Yanjin' },
    '博望坡': { lat: 33.1500, lng: 112.8667 },
    '定军山': { lat: 33.1167, lng: 106.7000 },
    '襄国': { lat: 37.0500, lng: 114.4833, note: 'Xingtai' },
    '野王': { lat: 35.0700, lng: 112.9500, note: 'Qinyang' },
    '钟离': { lat: 32.9300, lng: 117.4800, note: 'Fengyang' },
    '宜阳': { lat: 34.5000, lng: 112.1667 },
    '霍邑': { lat: 36.5667, lng: 111.7500, note: 'Huozhou' },
    '岷州': { lat: 34.4200, lng: 104.0200, note: 'Minxian' },
    '大非川': { lat: 35.6000, lng: 99.8000, note: 'Qinghai Lake South' },
    '香积寺': { lat: 34.1333, lng: 108.8833 },
    '奉天': { lat: 34.5428, lng: 108.2325, note: 'Qian County' },
    '魏州': { lat: 36.2700, lng: 115.1700, note: 'Daming' },
    '益津关': { lat: 39.0667, lng: 116.4833, note: 'Bazhou' },
    '陈桥驿': { lat: 34.8833, lng: 114.4500 },
    '好水川': { lat: 35.6167, lng: 106.1167, note: 'Longde' },
    '定川寨': { lat: 36.1000, lng: 106.2500, note: 'Guyuan area' },
    '出河店': { lat: 45.4000, lng: 124.6000, note: 'Zhaozhou' },
    '黄天荡': { lat: 32.1800, lng: 119.0000, note: 'Nanjing NE' },
    '富平': { lat: 34.7511, lng: 109.1811 },
    '郾城': { lat: 33.5800, lng: 114.0000 },
    '柘皋': { lat: 31.7500, lng: 117.7800 },
    '威尼斯': { lat: 45.4408, lng: 12.3155 },
    '耶路撒冷': { lat: 31.7683, lng: 35.2137 },
    '大马士革': { lat: 33.5138, lng: 36.2965 },
    '罗马': { lat: 41.9028, lng: 12.4964 },
    '君士坦丁堡': { lat: 41.0082, lng: 28.9784, note: 'Istanbul' },
    '开罗': { lat: 30.0444, lng: 31.2357 },
    '巴格达': { lat: 33.3152, lng: 44.3661 },
    '泰西封': { lat: 33.0936, lng: 44.5808 },
    '雅典': { lat: 37.9838, lng: 23.7275 },
    '斯巴达': { lat: 37.0817, lng: 22.4236 }
};


// --- Execution ---
// Load src/data/cities.ts
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const citiesPath = path.join(__dirname, '../src/data/cities.ts');
const rawContent = fs.readFileSync(citiesPath, 'utf-8');

console.log('Restoring city coordinates...');

let matchCount = 0;
let updatedContent = rawContent;

// 1. Iterate over every city object in the file loop
// Warning: This regex is brittle but sufficient for the specific format of cities.ts
updatedContent = updatedContent.replace(
    /\{ id: '([^']+)',(.*?)name: '([^']+)',(.*?)lat: ([\d.-]+),(.*?)lng: ([\d.-]+),(.*?)\}/g,
    (match, id, preName, name, preLat, latStr, preLng, lngStr, postLng) => {
        const target = CITY_COORDS[name];

        if (target) {
            matchCount++;
            const newLat = target.lat;
            const newLng = target.lng;
            console.log(`[RESTORE] ${name}: (${latStr}, ${lngStr}) -> (${newLat}, ${newLng})`);
            return `{ id: '${id}',${preName}name: '${name}',${preLat}lat: ${newLat},${preLng}lng: ${newLng},${postLng}}`;
        } else {
            // Keep original if not in dictionary
            return match;
        }
    }
);

fs.writeFileSync(citiesPath, updatedContent, 'utf-8');
console.log(`\nSuccess! Restored ${matchCount} cities to authentic coordinates.`);
