/**
 * passMountainDecision.ts — 关隘「大山场景」触发判定（方案 C：双重结合）
 *
 * 核心准则（2026-09-20 主人定死）：
 * 只有真正依山险峻的关隘，才在战术模式攻城战中生成大山场景；
 * 渡口、水上要塞、海防海岛、平原堡垒绝对排除！
 *
 * 判定管线：
 * 1. 【绝对排除】濡须口、皖口、界桥、钓鱼岛、马耳他等水上与平原据点 → 100% false
 * 2. 【史实保底】虎牢关、函谷关、潼关、剑门关、居庸关、嘉峪关等天下名关 → 100% true
 * 3. 【真实高程与地形】DEM 海拔 >= 200m 或 坡度 >= 2.0°，或山岭地名 → true
 */

import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';

/** 绝对排除的渡口、江防、海防、海岛与平原要塞（绝不出山） */
export const EXCLUDED_PASS_IDS = new Set<string>([
    // 江防 / 渡口 / 水网桥梁
    'city_jingkou',      // 濡须口（长江要津水战渡口）
    'city_wancheng',     // 皖口（长江渡口）
    'city_jieqiao',      // 界桥（漳水平原桥梁）
    'city_longwan',      // 龙湾（采石矶江防）
    'city_mingliang',    // 鸣梁（海峡水战）
    'city_duluohe',      // 推河堡（平原河流要塞）
    'city_kaerkahe',     // 卡尔卡河（河滨要津）
    'city_shilekahe',    // 石勒喀堡（河流要塞）
    'city_ditu',         // 临津江渡口
    // 海防 / 海岛 / 海港
    'city_diaoyudao',    // 钓鱼岛（海岛）
    'city_hengyu',       // 横屿（海岛抗倭要塞）
    'city_pidao',        // 皮岛（海岛）
    'city_xinhui',       // 厓山（南海出海口）
    'city_chijianguan',  // 赤间关（关门海峡渡口）
    'city_malta',        // 马耳他（地中海海岛）
    'city_guanabara',    // 瓜纳巴拉（海湾）
    'city_donghai',      // 洞海城（平原海岸要塞）
    'city_beishacheng',  // 卑沙城（海滨要塞）
    // 欧洲与中亚平原城堡（曾归为 pass）
    'city_hamburg',      // 汉堡（平原港口）
    'city_goteborg',     // 哥德堡（平原港口）
    'city_uppsala',      // 乌普萨拉（平原城）
    'city_szeged',       // 塞格德（匈牙利平原）
    'city_brandenburg',  // 勃兰登堡（北德平原）
    'city_magdeburg',    // 马格德堡（易北河平原）
    'city_regensburg',   // 雷根斯堡（多瑙河平原）
    'city_nuremberg',    // 纽伦堡（平原丘陵）
    'city_strasbourg',   // 斯特拉斯堡（莱茵河平原）
    'city_konigsberg',   // 柯尼斯堡（波罗的海平原）
    'city_saratov',      // 萨拉托夫（伏尔加河平原）
    'city_kharkov',      // 哈尔科夫（东欧平原）
    'city_voronezh',     // 沃罗涅日（东欧平原）
    'city_chambord',     // 香波堡（卢瓦尔河平原沼泽）
    'city_la_mota',      // 拉莫塔堡（卡斯蒂利亚平原）
    'city_bedzin',       // 本津堡（西里西亚平原）
    'city_braganca',     // 布拉干萨（高原平原）
]);

/** 史实闻名、雄踞崇山峻岭的绝对保底险隘名单（100% 出山） */
export const HISTORIC_MOUNTAIN_PASS_IDS = new Set<string>([
    // 中原关中与北方险关
    'city_hulaoguan',     // 虎牢关（嵩山/邙山余脉）
    'city_tongguan',      // 潼关（秦岭/崤函之险）
    'city_hanguguan',     // 函谷关（崤函峡谷咽喉）
    'city_jianmenguan',   // 剑门关（大剑山小剑山）
    'city_juyongguan',    // 居庸关（太行军都山）
    'city_shanhaiguan',   // 山海关（燕山山海相扼）
    'city_jiuquan',       // 嘉峪关（祁连山与黑山之间）
    'city_dasanguan',     // 大散关（大散岭）
    'city_yanmenguan',    // 雁门关（雁门山）
    'city_zijingguan',    // 紫荆关（太行八陉）
    'city_jingxingguan',  // 井陉关（太行八陉）
    'city_pingxingguan',  // 平型关（平型岭）
    'city_piantouguan',   // 偏头关（偏头山）
    'city_wuguan',        // 武关（少习山险隘）
    'city_xiaoguan',      // 萧关（六盘山）
    'city_jinsuoguan',    // 金锁关（关陇险道）
    'city_daomaguan',     // 倒马关（太行八陉）
    'city_dusong',        // 独松关（天目山独松岭）
    'city_xianxia',       // 仙霞关（仙霞岭闽浙要冲）
    'city_baishuiguan',   // 白水关（秦蜀通道山隘）
    'city_mianzhuguan',   // 鹿头关（龙泉山脉）
    'city_guangchengguan',// 广成关（临汝山隘）
    'city_wushengguan',   // 武胜关（大别山三关）
    'city_qingshiguan',   // 青石关（鲁中齐鲁险关）
    'city_hengpuguan',    // 横浦关（大庾岭梅关）
    'city_yangshanguan',  // 阳山关（骑田岭隘口）
    'city_huangxiguan',   // 湟溪关（连江峡谷要隘）
    'city_chiting',       // 赤亭关（天山山谷）
    'city_yumenguan',     // 玉门关（戈壁台地险关）
    'city_yangguan',      // 阳关（阿尔金山余脉红山口）
    'city_dangchang',     // 阴平（摩天岭天险）
    'city_hailongtun',    // 海龙屯（龙岩山悬崖要塞）
    'city_diaoyucheng',   // 钓鱼城（钓鱼山顶绝壁天险）
    'city_gubeikou',      // 古北口（燕山潮河隘口）
    'city_shimenguan',    // 石门关（乌蒙山险道）
    'city_qingxiguan',    // 清溪关（大相岭隘道）
    'city_shengjingguan', // 胜境关（滇黔咽喉乌蒙山脉）
    'city_qingliuguan',   // 清流关（琅琊山峡谷）
    'city_baidicheng2',   // 白帝城（长江三峡夔门绝壁）
    'city_cheollyeong',   // 铁岭关（朝鲜铁岭隘口）
    'city_salhu',         // 萨尔浒（萨尔浒山）
    'city_ningwuguan',    // 宁武关（管涔山与芦芽山）
    'city_guyan',         // 古严关（越城岭）
    'city_mailin',        // 麦岭关（萌渚岭）
    'city_daban',         // 达坂城（天山峡谷）
    'city_xingshishan',   // 兴势山（秦岭兴势岭）
    'city_eyang',         // 恶阳岭（太行峡谷）
    'city_longtanshancheng', // 龙潭山（山城）
    'city_wugucheng',     // 乌骨城（山城要塞）
    'city_bamiancheng',   // 八面山/八面关（湘西北险峰）
    // 日本及世界著名山险要塞
    'city_hakone',        // 箱根关（箱根山天下之险）
    'city_fuwa',          // 不破关（关原群山之间）
    'city_tushpa',        // 图什帕（悬崖高山巨壁城堡）
    'city_akhaltsikhe',   // 阿哈尔齐赫（小高加索山地城堡）
    'city_machu_picchu',  // 马丘比丘（安第斯山巅云端要塞）
    'city_bam_citadel',   // 巴姆古城（高原堡垒）
    'city_fasil_fort',    // 法西尔堡（埃塞俄比亚高原要塞）
    'city_gwalior_fort',  // 瓜廖尔堡（300英尺孤立砂岩悬崖城堡）
    'city_golconda',      // 戈尔康达（花岗岩孤山要塞）
    'city_kolossi',       // 科洛西城堡
    'city_debuleidamo',   // 德布雷达莫（平顶山绝壁要塞）
    'city_debuleilibanuosi', // 德布雷利巴诺斯（山谷悬崖要冲）
]);

/**
 * 判定关隘据点是否属于「有山关隘」
 * @param cityId 据点 ID（如 city_hulaoguan, city_jingkou 等）
 * @param lat 纬度
 * @param lng 经度
 * @param cityName 可选据点名（用于山地关键词辅助研判）
 */
export function isMountainPass(
    cityId: string | null | undefined,
    lat?: number,
    lng?: number,
    cityName?: string
): boolean {
    if (!cityId) return false;

    // 1. 绝对排除：水上渡口/江防水防/海防岛屿/平原城堡 100% 杜绝出山
    if (EXCLUDED_PASS_IDS.has(cityId)) {
        return false;
    }

    // 2. 史实保底：天下闻名的崇山险隘 100% 出现巍峨大山
    if (HISTORIC_MOUNTAIN_PASS_IDS.has(cityId)) {
        return true;
    }

    // 3. 真实 DEM 高程与地形坡度采样（全图其余 150+ 座海外/边缘 pass）
    if (lat !== undefined && lng !== undefined) {
        try {
            const sampler = LandSeaSystem.getSampler();
            const sample = sampler.getElevationAndSlopeSync(lat, lng);
            if (sample) {
                // 海拔 >= 200 米，或者地形坡度 >= 2.0°，判定为山地险要
                if (sample.elevationM !== null && sample.elevationM >= 200) return true;
                if (sample.slopeDeg !== null && sample.slopeDeg >= 2.0) return true;
            }
        } catch {
            // 忽略运行时采样容错
        }
    }

    // 4. 地名山险关键词（如：山、岭、崖、峡、宗、塞、关），排除水性词后
    if (cityName) {
        const mountainKeywords = ['关', '山', '岭', '崖', '峡', '塞', '陉', '屯', '宗', '堡'];
        const waterKeywords = ['口', '桥', '岛', '渡', '津', '海', '水', '屿', '湾', '堤', '港'];
        const hasMountain = mountainKeywords.some((k) => cityName.includes(k));
        const hasWater = waterKeywords.some((k) => cityName.includes(k));
        if (hasMountain && !hasWater) {
            return true;
        }
    }

    // 默认平原关防，不出大山
    return false;
}
