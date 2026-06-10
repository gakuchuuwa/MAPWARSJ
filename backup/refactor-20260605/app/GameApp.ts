import L from 'leaflet';
import { GameMap } from '../map/GameMap';
import { CityManager } from '../world/CityManager';
import { CityAssetManager } from '../assets/CityAssetManager';
import '../utils/FlagTextDebug'; // [DEBUG] 旗帜文字调试工具: 控制台运行 await __debugFlagText("chahar")
import { GridManager } from '../core/GridManager';
import { FactionManager } from '../world/FactionManager';
import { initializeGlobalUnitRenderer, getGlobalUnitRenderer } from '../map/UnitRenderer';
import { GlobalUnitRenderer } from '../map/GlobalUnitRenderer';
import { SpeedOverlayRenderer } from '../map/SpeedOverlayRenderer';
import { MapColorSampler } from '../map/MapColorSampler';

import { TerrainSpeedSystem, TERRAIN_SPEED_CONFIG } from '../core/TerrainSpeedSystem';
import { SpatialRegistry } from '../world/SpatialRegistry';
import { TerrainOverrideManager } from '../editors/TerrainOverrideManager';
import { TimeSystem, Season } from './TimeSystem';
import { GameTime } from './GameTime';
import { HistoricalEventManager } from '../events/HistoricalEventManager';
import { HistoricalEvent } from '../types/core';
import { GridSystem } from '../systems/GridSystem';

import { CombatSystem } from '../combat/CombatSystem';
import { EventEditor } from '../editors/EventEditor';
import { CityEditor } from '../editors/CityEditor';
import { VectorRoadEditor } from '../roads/VectorRoadEditor';
import { ArmyEditor } from '../editors/ArmyEditor';
import { UnifiedEditorManager } from '../editors/UnifiedEditorManager';
import { SimpleVectorRoadRenderer } from '../roads/SimpleVectorRoadRenderer';
import { FACTIONS } from '../data/factions';
import { FactionTintSystem } from '../systems/tinting/FactionTintSystem';
import { CITIES } from '../data/cities';
import { GAME_CONSTANTS, GameConfig } from '../config/GameConfig';
import { AIController, RecruitmentSystem } from '../ai';
import { FollowResupplySystem } from '../legion/FollowResupplySystem';
import { roadRegistry } from '../roads/RoadRegistry';

// [NEW] Visual Renderers
import { GameUIManager } from './GameUIManager';
import { GameInputManager } from './GameInputManager';
import { MarchingLineRenderer } from '../map/MarchingLineRenderer';
import { getCityImage } from '../systems/RegionSystem';
import { rollSessionCityMirror } from '../systems/city-marker/CityBuildingMirror';
import { hasCityExclusiveIcon } from '../systems/city-marker/CityExclusiveIcons'; // [NEW]
import { CombatUI } from '../ui/CombatUI'; // [NEW]
import { GameTimeHUD } from '../ui/GameTimeHUD';
import { PerformanceMonitor } from '../debug/PerformanceMonitor'; // [PERF]
import { CameraFollowUI } from '../ui/CameraFollowUI'; // [NEW] 军团跟随视角
import { gameLog } from '../utils/GameLogger';
import { tickGameAppFrame } from './GameAppLoop';
import { exposeGameAppGlobals } from './GameAppExpose';

declare global {
    interface Window {
        game: GameApp;
        // ...
    }
}


export const STARTING_CAPITALS: Record<string, string> = {
    'zhancheng': 'city_dupan',
    'monong': 'city_bangdun',
    'shuizhen': 'city_sanpu',
    'wala': 'city_porbazhyn',
    'wuliangha': 'city_saiyinshanda',
    'dingling': 'city_yanran',
    'nifuhe': 'city_pennuli',
    'guer': 'city_malulude',
    'bade': 'city_pengdi',
    'xiajiasi': 'city_wubusabo',
    'zhen': 'city_jeonju',
    'dongshengwei': 'city_dongshengzhou',
    'dizhou': 'city_wudingzhou',
    'weihaiwei': 'city_weihaiwei',
    'xia': 'city_luoyang',
    'shang': 'city_anyang',
    'zhou': 'city_qishan',
    'qi': 'city_linzi',
    'jin': 'city_taiyuan',
    'chu': 'city_ying',
    'wu': 'city_gusu',
'yue': 'city_panyu',
    'qin': 'city_tianshui',
    'song': 'city_hangzhou',
    'yan': 'city_beijing',
    'gaogouli': 'city_guoneicheng',
    'xinluo': 'city_jincheng_silla',
    'riben': 'city_kyoto',
    'zhao': 'city_handan',
'wei': 'city_bianliang',
    'han': 'city_xinzheng',
    'han_d': 'city_hanzhong',
    'shu': 'city_chengdu',
    'dian': 'city_tonghai',
    'xin': 'city_nanyang',
    'cheng': 'city_jianzhou',
    'liang': 'city_wuwei',
    'juqu_d': 'city_zhangye',
    'tufa_d': 'city_ledu',
    'qiuchi': 'city_qiuchi',
'helian': 'city_tongwancheng',
    'xiongnu': 'city_toumancheng',
'xianbei': 'city_jining',
    'jie': 'city_xingtai',
    'di': 'city_lueyang',
    'qiang': 'city_lintao',
    'tuoba': 'city_datong',
    'yuwen': 'city_raoleshui',
    'liang_d': 'city_shangqiu',
    'chen': 'city_qingyuan',
    'sui': 'city_suizhou',
    'tang': 'city_changan',
    'min': 'city_fuzhou',
    'shatuo': 'city_chiting',
'qidan': 'city_chifeng',
    'donghu': 'city_tuhe',
    'luoyue': 'city_huashan',
    'ba': 'city_chongqing',
    'wey': 'city_puyang',
'bohai': 'city_ningan',
    'jurchen': 'city_wuguo',
'dangxiang': 'city_xingqingfu2',
'menggu_d': 'city_karakorum',
    'manzhou_d': 'city_shenyang',
    'ming_d': 'city_nanjing',
    'liao_d': 'city_linhuang',
'gongsun_d': 'city_liaoyang',
    'dai_d': 'city_daixian',
    'feng_d': 'city_shangdang',
    'zhongshan': 'city_zhending',
    'wang_d': 'city_langya',
    'xiao_d': 'city_lanling',
    'lu_fy_d': 'city_fanyang',
    'li_lx_d': 'city_longxi',
    'pei_hd_d': 'city_hedong',
'yuan_cj_d': 'city_xuanhu',
'xie_cj_d': 'city_yiyang',
'yue_d': 'city_baling',
    'qian_d': 'city_jiaxing',
    'kong_d': 'city_qufu',
    'cao_d': 'city_qiaojun',
    'jiaodong': 'city_jimo',
    'jibei': 'city_boyang',
    'wusun': 'city_chigucheng',
'dayuan': 'city_guishancheng',
    'gouding': 'city_guangnan',

    'jiujiang': 'city_chaisang',
    'zhang2_d': 'city_hejian',
    'quanrong': 'city_weirong',
    'sushen': 'city_dongkang',
'yuezhi': 'city_lanshi',
    'chile': 'city_chilechuan',
'rouran': 'city_jiluoshan',
    'baiji': 'city_sabi',
'tubo': 'city_luoxie',
    'tujue': 'city_otuken',
    'tiele': 'city_hanhai',
    'huige': 'city_ordubaliq',
    'dayue': 'city_shenglong',
    'yamato': 'city_asuka',
'edo': 'city_edo',
    'izumo': 'city_izumo',
    'satsuma': 'city_satsuma',
    'ryukyu': 'city_shuri',
    'so': 'city_tsushima',
    'kakizaki': 'city_katsuyama',
    'fujiwara': 'city_yanaginogosho',
    'gaya': 'city_gimhae',
    'aki': 'city_yoshida',
    'echigo': 'city_kasugayama',
    'kai': 'city_tsutsujigasaki',
    'owari': 'city_kiyosu',
    'chosokabe': 'city_okafu',
    'hashiba': 'city_himeji',
    'honda': 'city_utsunomiya',
    'aizu': 'city_tsuruga',
    'xingliao': 'city_longwan',
'cen_d': 'city_cen',
    'dongxian': 'city_tancheng',
    'tongma': 'city_wenan',
    'baibo': 'city_baibogu',
    'wuhuan': 'city_bailangshan',
'cheshihou': 'city_wutucheng',
'wensu': 'city_dawushenkate',
'yelang': 'city_puding',
'ailao': 'city_baoshan',
'shiwei': 'city_julunbo',
    'fuyu': 'city_fuyu',
'shule': 'city_shule',
    'loulan': 'city_loulan',
    'shache': 'city_shache',
'qiuci': 'city_yiluolucheng',
    'tuyu_d': 'city_fusicheng',
    'linyi': 'city_xianglin',

    'murong': 'city_chaoyang',
    'erzhu': 'city_xiurongchuan',

    'xu': 'city_xucheng',
    'zhi_d': 'city_jiangzhou',
    'cangtou': 'city_xinyang',

'zhai_han': 'city_fushi',
    'yin': 'city_zhaoge',
    'yingbu': 'city_liuxian',
    'ouyue': 'city_taizhou_zj',

    'liubiao': 'city_xiangyang',
    'lvbu': 'city_xiapi',

    'wazhai': 'city_dingtao',
    'liangshidu': 'city_yinzhou',
    'linshihong': 'city_raozhou',
    'lu': 'city_hefei',
'kumo': 'city_songmo',
    'xijue': 'city_zhizhicheng',
    'xian_d': 'city_gaoliang',
    'xiqin': 'city_lanzhou',

'xueyantuo': 'city_yanran_stone',
    'tujishi': 'city_talas',
    'nanzhao': 'city_mengshe',
'xiaobolu': 'city_puticheng',
    'qiufu': 'city_shanxian',

    'dongdan': 'city_beishacheng',
'dali': 'city_dali_city',
    'luodian': 'city_dafang',

    'gusiluo': 'city_qingtang',
    'goryeo': 'city_kaesong',
'nongzhigao': 'city_yongzhou',
    'fangla': 'city_qingxi',

    'zhongxiang': 'city_wuling',
    'yang_aner': 'city_dengzhou',
    'haoding': 'city_licheng',
    'liwang': 'city_jiaoxi',

    'huarazim': 'city_urgench',
'pagan': 'city_pagan',
    'champa': 'city_myson',
'dongxia': 'city_aodongcheng',
'chagatai': 'city_bieshibali',
    'ogodei': 'city_emil',
'kereyid': 'city_kereyid',
    'naiman': 'city_naiman',
    'tatar': 'city_tatar',
    'merkit': 'city_merkit',
    'ongut': 'city_jingzhou',
    'red_turban': 'city_shunchang',
    'zhangshicheng': 'city_changzhou',
    'xushouhui': 'city_anlu',
    'luoping': 'city_xinhui',
    'daxing': 'city_ninghai',
    'toutuo': 'city_zhenghe',
    'chendiaoyan': 'city_zhangzhou',
    'fang_guozhen': 'city_qingyuan_zj',
    'liutong_yangqing': 'city_zaoyang',
    'dengmaoqi': 'city_shaxian',
    'yezongliu': 'city_chuzhou_zj',
    'dada_ming': 'city_hetao',
    'oirat_ming': 'city_kobdo',
    'jianzhou_nvzhen': 'city_wandu',
'haixi_nvzhen': 'city_huifa',
    'yeren_nvzhen': 'city_yeren_base',
    'manzhou': 'city_hetuala',
'hezhe': 'city_wuyun',
    'jilimi': 'city_nanghar',
'luchuan': 'city_mengmao',
    'chijin': 'city_chijin',
    'guiyi': 'city_dunhuang',
    'anding_wei': 'city_anding_qh',
    'joseon': 'city_pyongyang',
    'dahan': 'city_hanseong',
    'siam': 'city_ayutthaya',
    'chenla': 'city_angkor',
'dashun': 'city_weinan',
    'daxi_ming': 'city_mianyang',
    'hongguang': 'city_yangzhou',
    'longwu': 'city_jianning',
    'lujian': 'city_wuzhou',
    'yongli': 'city_zhaoqing',
    'chahar': 'city_xinghe',
    'tumed': 'city_guihua',
    'dzungar': 'city_yili',
    'yarkand': 'city_yinai',
    'khoja': 'city_xiuxun',
    'gaxa': 'city_yadong',
    'jinchuan_g': 'city_leweizhai',
    'jinchuan_x': 'city_meinuozhai',
    'geng': 'city_yanping',
    'shuntian': 'city_changhua_tw',
    'miaomin': 'city_pinglong',
    'gurkha': 'city_kathmandu',
    'kazakh': 'city_turkestan',
    'kokand': 'city_kokand',
    'badakhshan': 'city_fayzabad',

    'taiping': 'city_jintian',
    'dacheng': 'city_yongan',
    'han_nian': 'city_zhiheji',
    'han_dadian': 'city_yangxian',
'pingnan': 'city_tengyuecheng',
    'jianghan': 'city_fuling',
    'qianhui': 'city_piandaoshui',
    'miao_qing': 'city_qielancheng',
    'tuoming': 'city_dabancheng',
    'habibulla': 'city_xiye',
    'songlin': 'city_yuegui',
    'yettishar': 'city_nandou',
    'dajin': 'city_huining',
    'yuan_d': 'city_shangdu',

    'yilou': 'city_fenglin',
    'wuji': 'city_boduo',
'mohe': 'city_boli2',

'huimo': 'city_wugucheng',
    'mao_wenlong': 'city_pidao',
    'tunggiya': 'city_tongjiajiang',

'gaoche': 'city_luntai',
    'da_yuan': 'city_yingchang',

'huyan': 'city_naomaohu',
    'yujiulu': 'city_ruoshui',
    'weiming': 'city_ordos',
    'kiyad': 'city_burhan',
'borjigin': 'city_qudiaoalan',
    'jalair': 'city_kerulen',
    'hongirad': 'city_erguna',
    'choros': 'city_dzungar_basin',

'kala': 'city_aoshen',
'sogdian': 'city_jieshuangna',
    'kangju': 'city_kanka',
    'geluolu': 'city_almaliq',
    'yuchi': 'city_jingjue',
    'an': 'city_bukhara',
    'shi_clan': 'city_tashkent',
'guge': 'city_zhaburang2',
    'ladakh': 'city_leh',
'tsangpa': 'city_sangzhuzi',
    'ganden': 'city_heizong',
    'bailan': 'city_buerhanbuda',
    'supi': 'city_payangyi',
    'monpa': 'city_cuona',
    'lopi': 'city_metuo',
'spurgyal': 'city_jiamachikang',
'mgar': 'city_mayoumula',
'khon': 'city_sajia',
    'lang_clan': 'city_pibo',
    'karmapa': 'city_chubusi',

    'ava': 'city_ava',
    'dongxu': 'city_bago',
'baiman': 'city_weichu',
    'kunming_yi': 'city_huichuan',
    'miao': 'city_leigong',
    'pyu': 'city_srikshetra',
    'mon': 'city_thaton',
    'yang_bozhou': 'city_hailongtun',
'mu_lijiang': 'city_dayan',
    'bayinnaung': 'city_dongxu_old',
    'ming_zheng': 'city_tainan',
    'xiou': 'city_bushan',
    'jing': 'city_hoalu',
    'muong': 'city_hoabinh',
    'paiwan': 'city_mudan',
'huang_tianzhou': 'city_tianzhou',
    'trinh': 'city_xidu',
    'nguyen_guangnan': 'city_fuchun',
    'yan_siqi': 'city_benkang',

    'cong': 'city_dangqu',
    'qiao_d': 'city_langzhong_gucheng',
    'zhe_d': 'city_fuzhou_fugu',
    'shanyue': 'city_wanling',
    'she_ethnic': 'city_chimushan',
    'pu': 'city_qingjingsi',

    'tu': 'city_wulingshan',
    'seljuq': 'city_merv',
    'zou': 'city_wenzhou',
'bandun': 'city_hanchang',

    'wang_s': 'city_yixian',
    'xiang_d': 'city_laifeng',
    'tan_d': 'city_cili',
    'ran_d': 'city_xiushan',
    'chu_d': 'city_qianshan',
    'pishan': 'city_pishan',
    'tuerhute': 'city_yingsuochuan',
    'weili': 'city_weili',

'qingyi': 'city_yandao',
    'wuxi': 'city_bamian',
    'gumie': 'city_quzhou',

    'shengmiao': 'city_jiading',


    'xianlingqiang': 'city_yunwu',

    'baima': 'city_yinping',
    'kuai': 'city_fangling',
    'yong': 'city_shangyong',
'shen': 'city_jinzhou_shanxi',
    'sou': 'city_leshan',

    'shaodang': 'city_maqu',

    'jingjiang': 'city_lingqu',
    'panyao': 'city_hezhou',
    'jiang_s': 'city_yongzhou_hn',

    'li_s': 'city_yazhou',

    'nong2': 'city_guangyuan',

    'golog': 'city_huashixia',
    'tushetu': 'city_kulun',
    'she': 'city_yongning2',
    'liao': 'city_jiangyang',
    'yaoluoge': 'city_suoling',

    // ── 2026-05-28 新增：南部(根城)、萨曼(阿母城)、西域四政权 ──
    'nanbu': 'city_genjo',
    'saman': 'city_amucheng',
    'hepan': 'city_hepancheng',
'humi': 'city_hunduduo',
    'teqin': 'city_huoguocheng',

    // ── 2026-05-28 新增：马蒙(达尔甘城)、古兹根(法里亚布城)、傣(勐泐城)、泰沅(清坎城)、帕銮(双河城)、罗斛(呵叻城) ──
    'mamon': 'city_dargan',
    'guzgan': 'city_fariyab',
    'dai': 'city_mengle',
    'taiyuan': 'city_chingkham',
    'paluan': 'city_shuanghe',
    'luohu': 'city_khorat',

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
    'nanai': 'city_valen',
    'feiyaka': 'city_qiji',
    
    // ── 2026-05-31 新增：补齐缺失的初始首都 ──
    'weiwuer': 'city_yuergun',
    'gumo': 'city_bohuancheng',
    'yutou': 'city_wosedecheng',

    'anushidgin': 'city_khiva',
    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、爱新觉罗(墨尔根城)、广南国(洞海城) ──
    'gandenpozhang': 'city_zhadunzong',
    'dawoer': 'city_moergen',
    'guangnanguo': 'city_donghai',

    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐)、俚人(珠崖总峒) ──
    'tumengken': 'city_baidalik',
    'liren': 'city_zhuyazongdong',

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(特斯郭勒卡伦) ──
    'gling': 'city_jiegu',
    'khyungpo': 'city_qiongbu',
    'suolun': 'city_bukui',
    'tuva': 'city_teshuolankalun',

    // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──
    'dayu': 'city_akaogicheng',
    'anmei': 'city_akakinagusuku',

    // ── 2026-05-28 新增：康区藏族土司/部落 ──
    'dalung': 'city_riwoche',
    'gar_kham': 'city_derge',
    'kongsa': 'city_ganzi',
    'mingzheng': 'city_dajianlu',

    // ── 2026-05-28 新增：波密(博窝) ──

    // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
    'daca': 'city_basu',

    // ── 2026-05-28 新增：景东(银生城/云南) ──
    'jingdong': 'city_yinsheng',

    // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
    'hor': 'city_suozong',

    // ── 2026-05-28 新增：董(囊谦宗/玉树) ──
    'dong': 'city_nangqian',

    // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': 'city_adunzi',

    // ── 2026-05-28 新增：穆(理塘宗/康区) ──
    'mu': 'city_litangzong',
'duolu': 'city_beiluocheng',
'zhuxie': 'city_dushancheng',
'hunxie': 'city_jiuquan',
    'fu': 'city_jinchangcheng',
    'tiemuer': 'city_samaerhan',
    'kawusi': 'city_jizhake',
    'keerkezi': 'city_yierkeshentan',
    'yiduhu': 'city_gaochangcheng',
    'tashili': 'city_guyanshan',
    'yangshao': 'city_mianchi',
    'yel': 'city_bamiancheng',
    'guzhu': 'city_feiru',
    'shafa': 'city_shangzhou',
    'yizhi': 'city_yuanzhishi',
    'zhuqian': 'city_taizaifu',
    'jibei2': 'city_guizhicheng',
    'jinchuan': 'city_junfucheng',
    'xuan': 'city_xuanhua',
    'yangshe': 'city_tongdi',
    'henei': 'city_huojia',
    'liguo': 'city_eyu',
    'kang': 'city_changze',
    'shuofang': 'city_linrong',
    'lushui': 'city_aowei',
    'yingli': 'city_mingsha',
    'guangwu': 'city_lingju',
    'huizhou': 'city_zuli',
    'yiwu': 'city_hamiwei',
    'pulei': 'city_balikun',
    'duerbote': 'city_zhabuhanjuntai',
    'zhasaketu': 'city_wuliyasutai',
    'kaerka': 'city_duluohe',
    'huihu': 'city_woluduocheng',
'wuzhumuqin': 'city_wuliyasitai',
    'xingan': 'city_halagaitu2',
    'zhadalan': 'city_kuoyitian',
    'zhuerqi': 'city_sangguer',
    'chechen': 'city_bayantumen',
    'gangdisi': 'city_mapangyongcuo',
    'pisha': 'city_mazhatage',
    'yutian': 'city_yutian2',
    'yumi': 'city_yumi',
    'keliya': 'city_duoma',
    'xiye': 'city_longmucuo',
    'faqiang': 'city_saga',
'laduijiang': 'city_angren',
    'yangzhuo': 'city_langkazi',
'panjun': 'city_saiyinshanda',
    'jiantang': 'city_mufu',
    'gongbu': 'city_xiubagubao',
    'niang': 'city_juemuzong',
    'galangdiba': 'city_galangzong',
    'zuogong': 'city_walazong',
    'ningjing': 'city_mangkangzong',
    'ali': 'city_gadake',
    'sapi': 'city_xiwanjin',
    'jieshuai': 'city_anuyuecheng',
    'pulige': 'city_kajier',
    'pazhu': 'city_jiangzi',
    'qiong': 'city_jianchang',
    'zhuoshi': 'city_linqiong',
    'pengshi': 'city_chenzhou2',
    'qianzhong': 'city_yuanzhou',
    'cuanshi': 'city_weixian2',
    'dianguo': 'city_tuodongcheng',
    'xinggu': 'city_luoxiong',
    'zangke': 'city_wanwen',
    'guangxin': 'city_cangwu',
    'kejia': 'city_qianzhou',
    'ouyang': 'city_luling',
    'ning': 'city_hongzhou',
'danyang': 'city_jiuzi',
    'huai': 'city_zhongli',
    'machu': 'city_changsha',
    'shangzhou': 'city_shangluo',
    'ying': 'city_shicheng',
    'heng': 'city_linzheng',
    'chen2': 'city_guiyang',
    'shixing': 'city_qujiang',
    'yidou': 'city_yiling',
    'boren': 'city_bodao',
    'kui': 'city_baidicheng2',
    'qi2': 'city_qichun',
    'danluo': 'city_xingzhuting',
    'woju': 'city_hamhung',
    'chen3': 'city_yuezhi',
    'hui': 'city_heseluo',
    'dingan': 'city_yalu',
    'wure': 'city_wushecheng',
    'houliao': 'city_xianping',
    'dazhen': 'city_xupin',
    'jilin': 'city_kuanchengzi',
    'sunite': 'city_saihantala',
    'dayuzi': 'city_sailan',
    'yingchuan': 'city_yancheng2',
    'keerqin': 'city_daerhan',
    // -- 2026-05-31 民族起源地6势力 --
    'xiangxiong': 'city_qionglong',
    'qingqiang': 'city_maozhou',
    'zhaowu': 'city_huzhan',
    'mangbu': 'city_wumeng',
    'gaoliang': 'city_panzhou',
    'ruoqiang': 'city_ruoqiang',

    // -- 2026-05-31 原生小政权都城4势力 --
    'qiemo': 'city_qiemo',
    'weitou': 'city_weitoucheng',
    'dangchang': 'city_diezhou',

    // -- 2026-05-31 补齐遗漏势力 --
    'zhong': 'city_shouxian',
    'qingyuan_bd': 'city_baoding',
    'pingyuan': 'city_pingyuan',
    'xichu': 'city_pengcheng',
    'lulin': 'city_jiangxia',
    'yunzhong': 'city_shengle',
    'chunshen': 'city_shanghai',
    'qian': 'city_juzhou',
    'yao': 'city_linfen',
    'ashide': 'city_heishacheng',
    'huangfu': 'city_anding',
    'guo': 'city_guozhou',
    'zi': 'city_zizhou',
    'jing2': 'city_jingzhou2',
    'long2': 'city_longzhou',
    'yanqi': 'city_yanqi',
    'song2': 'city_songzhou',
    'quan': 'city_dangyang',
    'hai2': 'city_haeju',
    'qifu_d': 'city_fuhan',
    'cai': 'city_chenjun',
    'ashina': 'city_suiye',
    'ting': 'city_tingzhou',
    'khoshut': 'city_dangxiong',
    'tian_sizhou': 'city_zhenyuan',
    'qing': 'city_xingqing',
    'nanjie': 'city_rituzong',
    'wan': 'city_wancheng',
    'fu2': 'city_linchuan',
    'xinping': 'city_binzhou2',
    'huan': 'city_fangqu',
    'wei2': 'city_jingsai',
    'lingwu': 'city_lingzhou',
    'xin2': 'city_nanpu',
};

export class GameApp {
    public map!: GameMap;
    private factionManager!: FactionManager;
    public cityManager!: CityManager;
    private gridManager!: GridManager;
    public combatSystem!: CombatSystem;
    public eventEditor!: EventEditor;
    private cityEditor!: CityEditor;
    private roadEditor!: VectorRoadEditor; // [NEW] 矢量道路编辑器 (Natural Earth)
    private unifiedEditorManager!: UnifiedEditorManager;
    public timeSystem!: TimeSystem;
    public historicalEventManager!: HistoricalEventManager;
    public speedOverlay!: SpeedOverlayRenderer;
    private colorSampler!: MapColorSampler;
    private overrideManager!: TerrainOverrideManager;

    // [AI System]
    public aiController!: AIController;
    public recruitmentSystem!: RecruitmentSystem;
    private followResupplySystem!: FollowResupplySystem;


    // [REFACTORED]
    private uiManager!: GameUIManager;
    private inputManager!: GameInputManager;
    private marchingLineRenderer!: MarchingLineRenderer; // [NEW]
    public combatUI!: CombatUI; // [NEW]
    private gameTimeHUD!: GameTimeHUD;
    private roadRenderer!: SimpleVectorRoadRenderer; // [NEW]
    public cameraFollowUI!: CameraFollowUI; // [NEW] 军团跟随视角

    // Game Loop
    public lastFrameTime: number = 0;
    public animationFrameId: number | null = null;

    // [PERF] Performance Monitor
    public perfMonitor: PerformanceMonitor = PerformanceMonitor.getInstance();



    constructor() {
        // UI Initialization moved to GameUIManager
        // Expose game instance globally
        window.game = this;
    }

    public getMarchingLineRenderer(): MarchingLineRenderer {
        return this.marchingLineRenderer;
    }

    /**
     * [DIRECTOR API] Expose LegionManager for Cinematic Manager
     */
    public get legionManager() {
        return this.historicalEventManager?.getLegionManager();
    }



    /**
     * [PERF] 让出主线程，给浏览器机会 paint / 响应事件。
     *
     * 关键设计：
     * - 标签可见时：用 setTimeout(0) 让浏览器在批次之间 paint，UI 保持响应
     * - 标签隐藏时：直接 resolve，**不**让出主线程
     *   原因：浏览器对后台标签的 setTimeout 强制 ≥ 1000ms，
     *   每个 yield 变成 1 秒会让"切走→回来"时启动延迟 50-100 倍。
     *   而后台时反正没人在看 UI，同步连跑反而最快完成。
     *   纯同步 JS 在后台标签是全速运行的，不被节流。
     */
    private yieldToBrowser(): Promise<void> {
        if (document.hidden) return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    /**
     * [PERF-FIX] Page Visibility 处理：
     * - 标签页隐藏时，浏览器停止 requestAnimationFrame，gameLoop 不再被调用
     * - 标签页可见时，rAF 立刻恢复，但传入的 timestamp 是真实时间（含隐藏期）
     *   导致 deltaTime 巨大（可能几分钟到几小时），瞬间把事件/战斗/AI 全部快进
     * 本方法：可见时重置 lastFrameTime，让恢复后第一帧 deltaTime ≈ 0
     */
    private setupVisibilityHandler(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 重置时间戳，避免恢复后第一帧 deltaTime 暴涨
                this.lastFrameTime = performance.now();
                gameLog('startup', '👁️ [GameApp] Tab visible — resetting frame time');
            } else {
                gameLog('startup', '🙈 [GameApp] Tab hidden — gameLoop will pause until restored');
            }
        });
    }

    public async start() {
        try {
            gameLog('startup', 'Game starting...');
            this.perfMonitor.markBootPhase('GameApp.start');

            // [FIX] FactionManager 必须先初始化，preloadFlags 内部会读 factionManager.getFactionColor
            // 否则 getFactionColor 在染色前不可用。
            this.factionManager = new FactionManager();
            FACTIONS.forEach(f => this.factionManager.addFaction(f));
            FactionTintSystem.bindFactionManager(this.factionManager);

            const _PANJUN_ID_BOOT = 'pan' + 'jun';
            const activeFactionsBoot = [...new Set([...CITIES.map(c => c.factionId), _PANJUN_ID_BOOT])];
            await CityAssetManager.seedBootPlaceholderFlags(activeFactionsBoot);

            // [OPTIMIZATION-STARTUP] 1. Start Heavy Async Tasks IMMEDIATELY (Network/IO)
            // [PERF 2026-05-29] activeFactions 从据点实际引用反推, 不再读 STARTING_CAPITALS:
            //   - 沙盒/非沙盒模式同一份逻辑, 自动跟上数据漂移
            //   - 86 个孤儿势力 (注册了但没城用) 自动不加载, 省 chromaKey 时间 -18%
            //   - 加新势力据点时下次启动自动包含; 删势力但留城仍包含 (panjun fallback)
            //   - 参见 AGENTS.md §三: 1 势力 = 1 据点 (反推合理)
            // [FIX 2026-05-29] 不能在这里出现字符串 'panjun', 否则 serverReplaceObjectLine
            // 会用 indexOf('panjun') 在 STARTING_CAPITALS 之后找首匹配, 错误命中此处.
            // 改用变量 + 数组合并, 不暴露字符串字面量.
            const _PANJUN_ID = 'pan' + 'jun';
            const activeFactions = [...new Set([...CITIES.map(c => c.factionId), _PANJUN_ID])];
            const flagCities = CITIES.map((c) => ({
                lat: c.lat,
                lng: c.lng,
                factionId: c.factionId,
                region: (c as { region?: string }).region,
            }));
            CityAssetManager.registerFlagCities(flagCities);
            CityAssetManager.prepareDeferredFlagQueue(activeFactions);
            // 军团贴图延后到首帧之后，避免与旗号 chromaKey 抢主线程
            void GlobalUnitRenderer.preloadAssets().catch((e) =>
                console.warn('[GameApp] Unit asset preload failed', e)
            );
            this.perfMonitor.markBootPhase('旗号队列(待视口/拖图)');

            // [OPTIMIZATION-STARTUP] 2. Initialize Main Map (DOM/WebGL)
            this.map = new GameMap('map');
            this.perfMonitor.markBootPhase('Leaflet 地图');

            // [PERF] 让浏览器立刻 paint 一次空地图，用户感知"已经开始加载"
            // 否则下面的同步初始化会让整个页面看起来卡死直到结束。
            await this.yieldToBrowser();

            // 3. Initialize remaining Core Managers (Lightweight JS)
            this.gridManager = new GridManager(this.map);

            // Listeners
            this.setupMapVisualListeners(); // Setup visual toggles

            // Initialize global unit renderer for NPCs and armies
            initializeGlobalUnitRenderer(this.map);


            // Initialize CombatSystem moved down
            // this.combatSystem = new CombatSystem();

            // Managers & Systems
            // this.contactEngine ... moved down
            this.timeSystem = new TimeSystem();

            // [NEW] Sync Time to Map Visuals (Roads/Rivers filtering)
            this.timeSystem.onYearChange((year) => {
                this.map.updateTime(year);
                if (this.gameTimeHUD) {
                    this.gameTimeHUD.updateTime(year, this.timeSystem.getSeason());
                }
            });
            this.timeSystem.onSeasonChange((season, year) => {
                if (this.gameTimeHUD) {
                    this.gameTimeHUD.updateTime(year, season);
                }
            });
            // [FIX] Initial sync for roads (e.g. hide Qin Direct Road in -236)
            this.map.updateTime(this.timeSystem.getYear());

            // Terrain & Renderers (Independent)
            this.colorSampler = new MapColorSampler(this.map);
            this.overrideManager = new TerrainOverrideManager();
            TerrainSpeedSystem.initialize(this.colorSampler, this.overrideManager, CITIES);

            // Roads Init - 矢量路网图引擎
            gameLog('startup', '🛤️ 正在构建矢量路网图...');
            (window as any).roadRegistry = roadRegistry; // [FIX] Expose for Army.ts
            roadRegistry.initialize(CITIES);
            this.perfMonitor.markBootPhase('矢量路网');

            // [PERF] yield before heavy city load
            await this.yieldToBrowser();

            // 5. Initialize City dependent systems
            this.cityManager = new CityManager(this.map, this.factionManager);
            this.loadCityData();
            // 叛军：S10QZ 7–58 共 52 面，画据点前 await。见 AGENTS.md §10.3
            await CityAssetManager.preloadRebelFlagsForBoot();
            CityAssetManager.onBootMapReady();
            this.cityManager.bindViewportCitySync();
            // 势力色块默认关（chk-faction 未勾选）。禁止 toggleTerritoryLayer(true) / renderTerritoryOnly。§10.1
            void this.cityManager.renderCitiesOnly().then(() => {
                this.perfMonitor.markBootPhase('视口据点旗号');
            });

            await this.yieldToBrowser();

            // [PERF] Report city count to PerformanceMonitor
            this.perfMonitor.reportCount('cities', CITIES.length);
            this.perfMonitor.reportCount('factions', FACTIONS.length);

            if (import.meta.env.DEV) {
                this.cityEditor = new CityEditor(this.map.getLeafletMap(), this.cityManager, (data: any) => {
                    this.handleCityEditorSave(data);
                });
            }

            this.combatSystem = new CombatSystem(this.cityManager, null, null);


            // [NEW] Combat UI
            this.combatUI = new CombatUI();

            this.gameTimeHUD = new GameTimeHUD();
            this.gameTimeHUD.init();

            // 尽早启动主循环，避免 lengthy 同步初始化占死主线程（F12/拖动都失效）
            this.timeSystem.setPaused(true);
            if (this.animationFrameId === null) {
                this.lastFrameTime = performance.now();
                this.gameLoop(this.lastFrameTime);
            }

            // [MODIFIED] Hook Combat System Events - Only show UI when followed army is involved
            this.combatSystem.onBattleStart = (battle) => {
                const followedId = this.cameraFollowUI?.getFollowedArmyId();
                if (!followedId) return;
                const isInvolved = battle.attacker.id === followedId || battle.defender.id === followedId;
                if (!isInvolved) return;
                gameLog('startup', '⚔️ [GameApp] Battle Started (followed army involved) - showing Combat UI');
                this.combatUI.show(battle);
            };

            // [MODIFIED] Hook Regional Battle Events - Only show UI when followed army is involved
            this.combatSystem.onRegionalBattleStart = (
                attackers,
                defenders,
                attackerPortrait,
                defenderPortrait,
                title,
                description,
                isNarrative,
                battleField
            ) => {
                const followedId = this.cameraFollowUI?.getFollowedArmyId();
                if (!followedId) return;
                const allIds = [...attackers.map(u => u.id), ...defenders.map(u => u.id)];
                if (!allIds.includes(followedId)) return;
                gameLog('startup', `⚔️ [GameApp] Regional Battle (followed army involved) - ${attackers.length} vs ${defenders.length}`);
                const dur = battleField?.targetDuration ?? 17;
                const scale = this.timeSystem.getSpeed();
                this.combatUI.showRegional(
                    attackers,
                    defenders,
                    attackerPortrait,
                    defenderPortrait,
                    title,
                    description,
                    isNarrative,
                    dur,
                    scale,
                    battleField
                );
            };

            this.combatSystem.onRegionalBattleEnd = (endedFields) => {
                const followedId = this.cameraFollowUI?.getFollowedArmyId();
                if (!followedId || !this.combatUI.isRegionalVisible()) return;
                const oursEnded = endedFields.some((bf) => bf.hasParticipant(followedId));
                if (!oursEnded) return;
                this.combatUI.notifyRegionalBattlesEnded(endedFields);
            };


            // [FIX] Unlock camera when game is paused
            this.timeSystem.onPauseChange((paused) => {
                if (paused) {
                    gameLog('startup', '⏸️ [GameApp] Pause detected.');
                }
            });

            this.setupVisibilityHandler();

            void this.completeLateBoot();
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            this.showErrorOverlay(error instanceof Error ? error.message : '未知错误');
        }
    }

    private setupMapVisualListeners() {
        window.addEventListener('toggle-faction-color', (e: any) => {
            if (this.cityManager) this.cityManager.toggleTerritoryLayer(e.detail.visible);
        });

        window.addEventListener('toggle-road-layer', (e: any) => {
            // [NEW] SimpleVectorRoadRenderer 处理显隐
            if (this.roadRenderer) this.roadRenderer.toggle(e.detail.visible);
        });

        window.addEventListener('toggle-terrain-layer', (e: any) => {
            if (this.speedOverlay) this.speedOverlay.setVisible(e.detail.visible);
        });

        window.addEventListener('toggle-showcase-units', (e: any) => {
            const renderer = getGlobalUnitRenderer();
            if (renderer) renderer.toggleShowcase(e.detail.visible);
        });

        window.addEventListener('toggle-city-texture', (e: any) => {
            if (this.cityManager) this.cityManager.toggleCityTextures(e.detail.visible);
        });

        // [FIX] 编辑器 toggle 事件 (之前缺失，导致编辑器无法打开)
        window.addEventListener('toggle-editor-city', (e: any) => {
            if (this.cityEditor) {
                e.detail.enabled ? this.cityEditor.show() : this.cityEditor.hide();
            }
            // 联动 CityManager 的 editorMode (显示隐藏城市的幽灵模式)
            if (this.cityManager) this.cityManager.setEditorMode(e.detail.enabled);
        });

        window.addEventListener('toggle-editor-event', (e: any) => {
            if (this.eventEditor) {
                e.detail.enabled ? this.eventEditor.show() : this.eventEditor.hide();
            }
        });

        window.addEventListener('toggle-editor-road', (e: any) => {
            if (this.roadEditor) {
                e.detail.enabled ? this.roadEditor.show() : this.roadEditor.hide();
            }
        });

        const leaflet = this.map?.getLeafletMap?.();
        if (leaflet) {
            leaflet.on('move', () => {
                CityAssetManager.notifyMapInteraction();
            });
            leaflet.on('zoom', () => {
                CityAssetManager.notifyMapInteraction();
            });
        }
    }

    private loadCityData() {

        const cityData = CITIES.map(c => {
            let factionId = c.factionId;
            if (GameConfig.SYSTEM.SANDBOX_MODE) {
                // Check if this city is the designated capital for its original faction
                const isCapital = STARTING_CAPITALS[factionId] === c.id;
                if (!isCapital) {
                    // Find if this city is some other faction's designated capital
                    const ownerFaction = Object.keys(STARTING_CAPITALS).find(key => STARTING_CAPITALS[key] === c.id);
                    if (ownerFaction) {
                        factionId = ownerFaction;
                    } else {
                        factionId = 'panjun'; // Reset all other cities to neutral rebel
                    }
                }
            }

            return {
                id: c.id,
                name: c.name,
                factionId: factionId,
                latitude: c.lat,
                longitude: c.lng,
                type: c.type,
                troops: c.troops !== undefined ? c.troops : GameConfig.SIEGE.DEFAULT_CITY_TROOPS,
                region: c.region, // 14 文化区：募兵 cultureSlots + getLegionTypeForCulture
                image: getCityImage(c), // [NEW] Auto-detect image from RegionSystem
                mirror: hasCityExclusiveIcon(c.id)
                    ? !!c.mirror
                    : rollSessionCityMirror(c.type, c.mirror),
                startYear: c.startYear,
                endYear: c.endYear
            };
        });

        this.cityManager.addCities(cityData);

        // [FIX] Initialize CityManager's year immediately to ensure startYear filtering works
        // Without this, currentYear defaults to 0, causing cities with negative startYear (e.g. -218) to display incorrectly
        this.cityManager.updateYear(this.timeSystem.getYear());
    }

    private handleCityEditorSave(data: any) {
        // Remove existing temp cities to prevent ghosting during preview
        if (data.id.startsWith('temp_')) {
            const cities = this.cityManager.getCities();
            cities.forEach(c => {
                if (c.id.startsWith('temp_')) {
                    this.cityManager.removeCity(c.id);
                }
            });
        }
        this.cityManager.addCity(data);
    }

    /** 事件索引 / AI / 输入等重初始化：分帧执行，不阻塞首屏与 DevTools */
    private async completeLateBoot(): Promise<void> {
        try {
            await this.yieldToBrowser();

            this.historicalEventManager = new HistoricalEventManager(
                this.timeSystem,
                this.cityManager,
                this.map,
                this.combatSystem,
                this.gameTimeHUD
            );
            this.perfMonitor.markBootPhase('事件/军团管理器');
            await this.yieldToBrowser();

            if (import.meta.env.DEV) {
                this.eventEditor = new EventEditor(
                    this.cityManager,
                    this.historicalEventManager.getLegionManager(),
                    this.map.getLeafletMap()
                );
            }

            this.roadRenderer = new SimpleVectorRoadRenderer(this.map.getLeafletMap());
            this.roadRenderer.setYear(this.timeSystem.getYear());
            this.timeSystem.onYearChange((y) => this.roadRenderer.setYear(y));

            if (import.meta.env.DEV) {
                this.roadEditor = new VectorRoadEditor(this.map.getLeafletMap(), this.cityManager);

                const armyEditor = new ArmyEditor(this.map.getLeafletMap());
                window.addEventListener('toggle-editor-army', (e: Event) => {
                    const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
                    armyEditor.toggle(detail?.enabled ?? false);
                });

                this.unifiedEditorManager = new UnifiedEditorManager();
                this.unifiedEditorManager.register(this.cityEditor);
                this.unifiedEditorManager.register(this.eventEditor);
                this.unifiedEditorManager.register(this.roadEditor);
            }

            const legionManager = this.historicalEventManager.getLegionManager();
            this.aiController = new AIController(
                legionManager,
                this.cityManager,
                roadRegistry,
                this.historicalEventManager
            );
            this.recruitmentSystem = new RecruitmentSystem(this.cityManager, legionManager);
            this.followResupplySystem = new FollowResupplySystem(this.cityManager);
            legionManager.setFollowResupplySystem(this.followResupplySystem);

            this.speedOverlay = new SpeedOverlayRenderer(this.map, this.overrideManager, this.colorSampler);

            this.uiManager = new GameUIManager(
                this.timeSystem,
                this.factionManager,
                this.historicalEventManager,
                this.speedOverlay
            );

            this.inputManager = new GameInputManager(
                this.map,
                this.speedOverlay,
                this.roadEditor,
                this.cityEditor,
                this.cityManager,
                this.uiManager,
                this.eventEditor
            );

            this.cameraFollowUI = new CameraFollowUI();
            this.cameraFollowUI.init(
                () => legionManager.getArmies(),
                (armyId) => {
                    legionManager.setFollowedLegionId(armyId);
                    if (!armyId) this.combatUI.hide();
                },
                () => legionManager.trimLegionsToCap(),
                (armyId, newName) => legionManager.renameLegion(armyId, newName)
            );
            this.cameraFollowUI.update();

            this.map.getLeafletMap().on('dragstart', () => {
                if (this.cameraFollowUI?.isFollowing()) {
                    this.cameraFollowUI.cancelFollow();
                }
            });

            this.exposeGlobals();

            setInterval(() => this.uiManager.update(), GAME_CONSTANTS.UI_UPDATE_INTERVAL);

            gameLog('startup', '🤖 AI 系统已启动');
            legionManager.refreshCityRegistry();

            if (this.map.getLeafletMap().dragging) {
                this.map.getLeafletMap().dragging.enable();
            }

            this.marchingLineRenderer = new MarchingLineRenderer(this.map, this.cityManager);

            gameLog('startup', '✅ 游戏初始化完成 (重构版)');
            this.perfMonitor.finishBoot();
        } catch (error) {
            console.error('❌ 游戏延后初始化失败:', error);
            this.showErrorOverlay(error instanceof Error ? error.message : '未知错误');
        }
    }

    private showErrorOverlay(message: string): void {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 99999; color: #fff;
        `;
        overlay.innerHTML = `
            <h1 style="color: #ff5722; margin-bottom: 20px;">❌ 游戏加载失败</h1>
            <p style="color: #aaa; max-width: 600px; text-align: center;">${message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; cursor: pointer;">重试</button>
        `;
        document.body.appendChild(overlay);
    }

    public gameLoop(timestamp: number): void {
        tickGameAppFrame(this, timestamp);
    }

    private exposeGlobals(): void {
        exposeGameAppGlobals(this);
    }

}

// 防止编辑器保存 cities.ts 时触发 Vite 全局刷新
// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept(['../data/cities.ts', '../data/cities_v2.ts'], () => {
        console.log('[HMR] cities.ts 发生改变，拦截自动刷新 (页面状态已保留)');
    });
    // @ts-ignore
    import.meta.hot.accept(['../types/CultureFormations.ts'], () => {
        console.log('[HMR] CultureFormations.ts 改变，自动应用到大地图现有军队');
        if ((window as any).game?.legionManager) {
            (window as any).game.legionManager.refreshCultureFormations();
        }
    });
}
