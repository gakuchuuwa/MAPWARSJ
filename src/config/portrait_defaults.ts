/**
 * 战斗 UI 默认立绘：14 文化区 × field/garrison + 叛军 panjun
 * 文件位于 public/assets/portraits/{REGION}_{role}.png
 *
 * 素材约定：全部 PNG 未镜像时目视**右侧**。
 * CombatUI：左攻不 scaleX、右守 scaleX(-1)，二人相向中央。
 */
import type { IBattleUnit } from '../core/CombatSystem';
import {
    resolveUnitCultureRegion,
    type CultureCombatRole,
} from '../systems/CultureCombat';

export const PORTRAIT_ASSETS_DIR = '/assets/portraits';

/** PNG 内人物默认目视方向（未做 scaleX 时） */
export type PortraitSourceFacing = 'left' | 'right';

/** 全库立绘统一朝右 */
export const DEFAULT_PORTRAIT_SOURCE_FACING: PortraitSourceFacing = 'right';

/** 从 URL 或参战单位推断 PNG 目视方向（当前恒为朝右） */
export function resolvePortraitSourceFacing(
    _unit?: IBattleUnit,
    _portraitPath?: string,
): PortraitSourceFacing {
    return DEFAULT_PORTRAIT_SOURCE_FACING;
}

/** 左攻右守相向中央：攻方应朝右、守方应朝左 */
export function shouldMirrorPortraitForSide(
    side: 'attacker' | 'defender',
    sourceFacing: PortraitSourceFacing = DEFAULT_PORTRAIT_SOURCE_FACING,
): boolean {
    return side === 'attacker' ? sourceFacing === 'left' : sourceFacing === 'right';
}

export function getCulturePortraitRole(unit: IBattleUnit): CultureCombatRole {
    return unit.unitType === 'city' ? 'garrison' : 'field';
}

// ── 势力专属立绘 ──

/** 武周立绘池：构建时扫描 public/assets/wuzhou/ 下所有 PNG */
const _wuzhouPortraitGlob = import.meta.glob<string>(
    '../../public/assets/wuzhou/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _wuzhouPortraitPool: string[] = Object.values(_wuzhouPortraitGlob);

/** 李唐立绘池 */
const _litangPortraitGlob = import.meta.glob<string>(
    '../../public/assets/litang/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _litangPortraitPool: string[] = Object.values(_litangPortraitGlob);

/** 大明立绘池 */
const _damingPortraitGlob = import.meta.glob<string>(
    '../../public/assets/daming/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _damingPortraitPool: string[] = Object.values(_damingPortraitGlob);

/** 广州立绘池 */
const _guangzhouPortraitGlob = import.meta.glob<string>(
    '../../public/assets/guangzhou/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _guangzhouPortraitPool: string[] = Object.values(_guangzhouPortraitGlob);

/** 蜀国立绘池 */
const _shuguoPortraitGlob = import.meta.glob<string>(
    '../../public/assets/shuguo/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _shuguoPortraitPool: string[] = Object.values(_shuguoPortraitGlob);

/** 滇缅立绘池 */
const _dianmianPortraitGlob = import.meta.glob<string>(
    '../../public/assets/dianmian/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _dianmianPortraitPool: string[] = Object.values(_dianmianPortraitGlob);

/** 蒲甘专属立绘池 */
const _puganPortraitGlob = import.meta.glob<string>(
    '../../public/assets/pugan/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _puganPortraitPool: string[] = Object.values(_puganPortraitGlob);

/** 北方立绘池 */
const _beifangPortraitGlob = import.meta.glob<string>(
    '../../public/assets/beifang/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _beifangPortraitPool: string[] = Object.values(_beifangPortraitGlob);

/** 西域立绘池 */
const _xiyuPortraitGlob = import.meta.glob<string>(
    '../../public/assets/xiyu/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _xiyuPortraitPool: string[] = Object.values(_xiyuPortraitGlob);

/** 河西立绘池 */
const _hexiPortraitGlob = import.meta.glob<string>(
    '../../public/assets/hexi/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _hexiPortraitPool: string[] = Object.values(_hexiPortraitGlob);

/** 吐蕃立绘池 */
const _tuboPortraitGlob = import.meta.glob<string>(
    '../../public/assets/TUBO/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _tuboPortraitPool: string[] = Object.values(_tuboPortraitGlob);

/** 草原立绘池 */
const _caoyuanPortraitGlob = import.meta.glob<string>(
    '../../public/assets/CAOYUAN/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _caoyuanPortraitPool: string[] = Object.values(_caoyuanPortraitGlob);

/** 东北立绘池 */
const _dongbeiPortraitGlob = import.meta.glob<string>(
    '../../public/assets/dongbei/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _dongbeiPortraitPool: string[] = Object.values(_dongbeiPortraitGlob);

/** 朝鲜立绘池 */
const _chaoxianPortraitGlob = import.meta.glob<string>(
    '../../public/assets/chaoxian/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _chaoxianPortraitPool: string[] = Object.values(_chaoxianPortraitGlob);

/** 日本立绘池 */
const _ribenPortraitGlob = import.meta.glob<string>(
    '../../public/assets/riben/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _ribenPortraitPool: string[] = Object.values(_ribenPortraitGlob);

/** 中亚立绘池 */
const _zhongyaPortraitGlob = import.meta.glob<string>(
    '../../public/assets/zhongya/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _zhongyaPortraitPool: string[] = Object.values(_zhongyaPortraitGlob);

/** 中原立绘池 */
const _zhongyuanPortraitGlob = import.meta.glob<string>(
    '../../public/assets/zhongyuan/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _zhongyuanPortraitPool: string[] = Object.values(_zhongyuanPortraitGlob);

/** 南方立绘池 */
const _nanfangPortraitGlob = import.meta.glob<string>(
    '../../public/assets/nanfang/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _nanfangPortraitPool: string[] = Object.values(_nanfangPortraitGlob);

/** 岭南立绘池 */
const _lingnanPortraitGlob = import.meta.glob<string>(
    '../../public/assets/lingnan/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _lingnanPortraitPool: string[] = Object.values(_lingnanPortraitGlob);

/** 秦国立绘池 */
const _qinPortraitGlob = import.meta.glob<string>(
    '../../public/assets/qin/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _qinPortraitPool: string[] = Object.values(_qinPortraitGlob);

/** 势力专属立绘池（factionId → 图片路径数组） */
const FACTION_PORTRAIT_POOLS: Record<string, string[]> = {
    'qin': _qinPortraitPool,
    'wuzhou_d': _wuzhouPortraitPool,
    'tang': _litangPortraitPool,
    'ming_d': _damingPortraitPool,
    'nantang_d': _litangPortraitPool,
    'guangzhou': _guangzhouPortraitPool,
    // 岭南全境套用广州
    'ryukyu': _guangzhouPortraitPool,
    'leizhou': _guangzhouPortraitPool,
    'zhuang_d': _guangzhouPortraitPool,
    'nanyue': _guangzhouPortraitPool,
    'zhancheng': _guangzhouPortraitPool,
    'monong': _guangzhouPortraitPool,
    'shuizhen': _guangzhouPortraitPool,
    'chendiaoyan': _guangzhouPortraitPool,
    'dengmaoqi': _guangzhouPortraitPool,
    'geng': _guangzhouPortraitPool,
    'jing': _guangzhouPortraitPool,
    'longwu': _guangzhouPortraitPool,
    'luoping': _guangzhouPortraitPool,
    'nguyen_guangnan': _guangzhouPortraitPool,
    'paiwan': _guangzhouPortraitPool,
    'shu': _shuguoPortraitPool,
    // 川蜀全境 43 势力套用蜀国
    'guo': _shuguoPortraitPool,
    'daxi_ming': _shuguoPortraitPool,
    'ba': _shuguoPortraitPool,
    'cheng': _shuguoPortraitPool,
    'zi': _shuguoPortraitPool,
    'yidou': _shuguoPortraitPool,
    'chu': _shuguoPortraitPool,
    'li_lx_d': _shuguoPortraitPool,
    'didao': _shuguoPortraitPool,
    'song2': _shuguoPortraitPool,
    'zhongxiang': _shuguoPortraitPool,
    'chenghan': _shuguoPortraitPool,
    'dangchang': _shuguoPortraitPool,
    'qingqiang': _shuguoPortraitPool,
    'di': _shuguoPortraitPool,
    'quan': _shuguoPortraitPool,
    'qiuchi': _shuguoPortraitPool,
    'jinchuan_x': _shuguoPortraitPool,
    'miaomin': _shuguoPortraitPool,
    'qianhui': _shuguoPortraitPool,
    'yang_bozhou': _shuguoPortraitPool,
    'cong': _shuguoPortraitPool,
    'qiao_d': _shuguoPortraitPool,
    'tu': _shuguoPortraitPool,
    'xiang_d': _shuguoPortraitPool,
    'tan_d': _shuguoPortraitPool,
    'ran_d': _shuguoPortraitPool,
    'wuxi': _shuguoPortraitPool,
    'kuai': _shuguoPortraitPool,
    'yong': _shuguoPortraitPool,
    'sou': _shuguoPortraitPool,
    'bandun': _shuguoPortraitPool,
    'she': _shuguoPortraitPool,
    'liao': _shuguoPortraitPool,
    'tujia_d': _shuguoPortraitPool,
    'zhuoshi': _shuguoPortraitPool,
    'qingyi': _shuguoPortraitPool,
    'pengshi': _shuguoPortraitPool,
    'qianzhong': _shuguoPortraitPool,
    'boren': _shuguoPortraitPool,
    'xin2': _shuguoPortraitPool,
    'kui': _shuguoPortraitPool,
    // 滇缅全境 25 势力
    'qiong': _dianmianPortraitPool,
    'ailao': _dianmianPortraitPool,
    'dali': _dianmianPortraitPool,
    'nanzhao': _dianmianPortraitPool,
    'pagan': _puganPortraitPool,
    'siam': _dianmianPortraitPool,
    'chenla': _dianmianPortraitPool,
    'ava': _dianmianPortraitPool,
    'dongxu': _dianmianPortraitPool,
    'pyu': _dianmianPortraitPool,
    'mon': _dianmianPortraitPool,
    'dian': _dianmianPortraitPool,
    'bayinnaung': _dianmianPortraitPool,
    'dai': _dianmianPortraitPool,
    'taiyuan': _dianmianPortraitPool,
    'luohu': _dianmianPortraitPool,
    'jingdong': _dianmianPortraitPool,
    'pingnan': _dianmianPortraitPool,
    'luchuan': _dianmianPortraitPool,
    'kunming_yi': _dianmianPortraitPool,
    'cuanshi': _dianmianPortraitPool,
    'baiman': _dianmianPortraitPool,
    'dianguo': _dianmianPortraitPool,
    'konbaung': _dianmianPortraitPool,
    'hani_d': _dianmianPortraitPool,
    // 北方 28 势力
    'anshi_d': _beifangPortraitPool,
    'bing': _beifangPortraitPool,
    'dai_d': _beifangPortraitPool,
    'dizhou': _beifangPortraitPool,
    'dongdan': _beifangPortraitPool,
    'erzhu': _beifangPortraitPool,
    'gaoqi_d': _beifangPortraitPool,
    'guzhu': _beifangPortraitPool,
    'hejian': _beifangPortraitPool,
    'jinzhou': _beifangPortraitPool,
    'kumo': _beifangPortraitPool,
    'liangshidu': _beifangPortraitPool,
    'pingyuan': _beifangPortraitPool,
    'qingyuan_bd': _beifangPortraitPool,
    'ranwei_d': _beifangPortraitPool,
    'shizhao_d': _beifangPortraitPool,
    'tongma': _beifangPortraitPool,
    'tuoba': _beifangPortraitPool,
    'wangyan': _beifangPortraitPool,
    'weihaiwei': _beifangPortraitPool,
    'xuan': _beifangPortraitPool,
    'yan': _beifangPortraitPool,
    'yang_aner': _beifangPortraitPool,
    'yangshe': _beifangPortraitPool,
    'yunzhong': _beifangPortraitPool,
    'zhe_d': _beifangPortraitPool,
    'zhongshan': _beifangPortraitPool,
    'zu_d': _beifangPortraitPool,
    // 西域 22 势力
    'anxi': _xiyuPortraitPool,
    'duerbote': _xiyuPortraitPool,
    'loulan': _xiyuPortraitPool,
    'pisha': _xiyuPortraitPool,
    'pishan': _xiyuPortraitPool,
    'qiemo': _xiyuPortraitPool,
    'qiuci': _xiyuPortraitPool,
    'shache': _xiyuPortraitPool,
    'tuerhute': _xiyuPortraitPool,
    'weili': _xiyuPortraitPool,
    'weitou': _xiyuPortraitPool,
    'weiwuer': _xiyuPortraitPool,
    'wensu': _xiyuPortraitPool,
    'xibo_d': _xiyuPortraitPool,
    'xiye': _xiyuPortraitPool,
    'yanqi': _xiyuPortraitPool,
    'yarkand': _xiyuPortraitPool,
    'yiduhu': _xiyuPortraitPool,
    'yuchi': _xiyuPortraitPool,
    'yumi': _xiyuPortraitPool,
    'yutian': _xiyuPortraitPool,
    'zhuxie': _xiyuPortraitPool,
    // 河西 22 势力
    'chijin': _hexiPortraitPool,
    'chile': _hexiPortraitPool,
    'dada_ming': _hexiPortraitPool,
    'dangxiang': _hexiPortraitPool,
    'dongshengwei': _hexiPortraitPool,
    'guiyi': _hexiPortraitPool,
    'helian': _hexiPortraitPool,
    'huan': _hexiPortraitPool,
    'huizhou': _hexiPortraitPool,
    'hunxie': _hexiPortraitPool,
    'juqu_d': _hexiPortraitPool,
    'kang': _hexiPortraitPool,
    'liang': _hexiPortraitPool,
    'lingwu': _hexiPortraitPool,
    'lushui': _hexiPortraitPool,
    'shuofang': _hexiPortraitPool,
    'wei2': _hexiPortraitPool,
    'weiming': _hexiPortraitPool,
    'xiliang': _hexiPortraitPool,
    'yeli': _hexiPortraitPool,
    'yingli': _hexiPortraitPool,
    'zhai_han': _hexiPortraitPool,
    // 吐蕃 53 势力
    'ali': _tuboPortraitPool,
    'anding_wei': _tuboPortraitPool,
    'bailan': _tuboPortraitPool,
    'bailang': _tuboPortraitPool,
    'daca': _tuboPortraitPool,
    'dalung': _tuboPortraitPool,
    'dong': _tuboPortraitPool,
    'faqiang': _tuboPortraitPool,
    'galangdiba': _tuboPortraitPool,
    'ganden': _tuboPortraitPool,
    'gandenpozhang': _tuboPortraitPool,
    'gaoliang': _tuboPortraitPool,
    'gar_kham': _tuboPortraitPool,
    'gaxa': _tuboPortraitPool,
    'gling': _tuboPortraitPool,
    'golog': _tuboPortraitPool,
    'gongbu': _tuboPortraitPool,
    'guangwu': _tuboPortraitPool,
    'guge': _tuboPortraitPool,
    'gusiluo': _tuboPortraitPool,
    'hor': _tuboPortraitPool,
    'humi': _tuboPortraitPool,
    'jiantang': _tuboPortraitPool,
    'jinchuan_g': _tuboPortraitPool,
    'karmapa': _tuboPortraitPool,
    'keliya': _tuboPortraitPool,
    'khon': _tuboPortraitPool,
    'khoshut': _tuboPortraitPool,
    'khyungpo': _tuboPortraitPool,
    'kongsa': _tuboPortraitPool,
    'ladakh': _tuboPortraitPool,
    'lang_clan': _tuboPortraitPool,
    'lopi': _tuboPortraitPool,
    'mingzheng': _tuboPortraitPool,
    'monpa': _tuboPortraitPool,
    'mu_lijiang': _tuboPortraitPool,
    'nandou': _tuboPortraitPool,
    'nanjie': _tuboPortraitPool,
    'niang': _tuboPortraitPool,
    'pazhu': _tuboPortraitPool,
    'qifu_d': _tuboPortraitPool,
    'ruoqiang': _tuboPortraitPool,
    'shaodang': _tuboPortraitPool,
    'spurgyal': _tuboPortraitPool,
    'supi': _tuboPortraitPool,
    'tsangpa': _tuboPortraitPool,
    'tubo': _tuboPortraitPool,
    'tufa_d': _tuboPortraitPool,
    'tuyu_d': _tuboPortraitPool,
    'xiadun': _tuboPortraitPool,
    'xiangxiong': _tuboPortraitPool,
    'xianlingqiang': _tuboPortraitPool,
    'xiaobolu': _tuboPortraitPool,
    // 草原 61 势力
    'ashide': _caoyuanPortraitPool,
    'borjigin': _caoyuanPortraitPool,
    'bulat': _caoyuanPortraitPool,
    'chagatai': _caoyuanPortraitPool,
    'chahar': _caoyuanPortraitPool,
    'chechen': _caoyuanPortraitPool,
    'cheshihou': _caoyuanPortraitPool,
    'choros': _caoyuanPortraitPool,
    'da_yuan': _caoyuanPortraitPool,
    'dingling': _caoyuanPortraitPool,
    'donghu': _caoyuanPortraitPool,
    'duolu': _caoyuanPortraitPool,
    'gaoche': _caoyuanPortraitPool,
    'hongirad': _caoyuanPortraitPool,
    'huige': _caoyuanPortraitPool,
    'huihu': _caoyuanPortraitPool,
    'huyan': _caoyuanPortraitPool,
    'jalair': _caoyuanPortraitPool,
    'kaerka': _caoyuanPortraitPool,
    'kereyid': _caoyuanPortraitPool,
    'kiyad': _caoyuanPortraitPool,
    'liao_d': _caoyuanPortraitPool,
    'menggu_d': _caoyuanPortraitPool,
    'merkit': _caoyuanPortraitPool,
    'murong': _caoyuanPortraitPool,
    'naiman': _caoyuanPortraitPool,
    'ogodei': _caoyuanPortraitPool,
    'oirat_ming': _caoyuanPortraitPool,
    'ongut': _caoyuanPortraitPool,
    'pulei': _caoyuanPortraitPool,
    'qidan': _caoyuanPortraitPool,
    'rouran': _caoyuanPortraitPool,
    'shatuo': _caoyuanPortraitPool,
    'shiwei': _caoyuanPortraitPool,
    'sunite': _caoyuanPortraitPool,
    'tatar': _caoyuanPortraitPool,
    'tiele': _caoyuanPortraitPool,
    'tujue': _caoyuanPortraitPool,
    'tumed': _caoyuanPortraitPool,
    'tumengken': _caoyuanPortraitPool,
    'tuoming': _caoyuanPortraitPool,
    'tushetu': _caoyuanPortraitPool,
    'tuva': _caoyuanPortraitPool,
    'wala': _caoyuanPortraitPool,
    'wuhuan': _caoyuanPortraitPool,
    'wuliangha': _caoyuanPortraitPool,
    'wuzhumuqin': _caoyuanPortraitPool,
    'xiajiasi': _caoyuanPortraitPool,
    'xingan': _caoyuanPortraitPool,
    'xiongnu': _caoyuanPortraitPool,
    'xueyantuo': _caoyuanPortraitPool,
    'yaoluoge': _caoyuanPortraitPool,
    'yel': _caoyuanPortraitPool,
    'yingzhou_ying_d': _caoyuanPortraitPool,
    'yiwu': _caoyuanPortraitPool,
    'yuan_d': _caoyuanPortraitPool,
    'yujiulu': _caoyuanPortraitPool,
    'yuwen': _caoyuanPortraitPool,
    'zhadalan': _caoyuanPortraitPool,
    'zhasaketu': _caoyuanPortraitPool,
    'zhuerqi': _caoyuanPortraitPool,
    // 东北 32 势力
    'aisin_d': _dongbeiPortraitPool,
    'beihai': _dongbeiPortraitPool,
    'bohai': _dongbeiPortraitPool,
    'dajin': _dongbeiPortraitPool,
    'dawoer': _dongbeiPortraitPool,
    'dazhen': _dongbeiPortraitPool,
    'dongping': _dongbeiPortraitPool,
    'dongxia': _dongbeiPortraitPool,
    'feiyaka': _dongbeiPortraitPool,
    'fuyu': _dongbeiPortraitPool,
    'gongsun_d': _dongbeiPortraitPool,
    'haixi_nvzhen': _dongbeiPortraitPool,
    'hezhe': _dongbeiPortraitPool,
    'houliao': _dongbeiPortraitPool,
    'jilin': _dongbeiPortraitPool,
    'jurchen': _dongbeiPortraitPool,
    'keerqin': _dongbeiPortraitPool,
    'kuye': _dongbeiPortraitPool,
    'manzhou': _dongbeiPortraitPool,
    'manzhou_d': _dongbeiPortraitPool,
    'mohe': _dongbeiPortraitPool,
    'nanai': _dongbeiPortraitPool,
    'nifuhe': _dongbeiPortraitPool,
    'shuidada': _dongbeiPortraitPool,
    'suolun': _dongbeiPortraitPool,
    'sushen': _dongbeiPortraitPool,
    'wanyan_d': _dongbeiPortraitPool,
    'wuji': _dongbeiPortraitPool,
    'wure': _dongbeiPortraitPool,
    'xianbei': _dongbeiPortraitPool,
    'yeren_nvzhen': _dongbeiPortraitPool,
    'yilou': _dongbeiPortraitPool,
    // 朝鲜 21 势力
    'baiji': _chaoxianPortraitPool,
    'chen3': _chaoxianPortraitPool,
    'danluo': _chaoxianPortraitPool,
    'dingan': _chaoxianPortraitPool,
    'gaogouli': _chaoxianPortraitPool,
    'goryeo': _chaoxianPortraitPool,
    'hai2': _chaoxianPortraitPool,
    'hui': _chaoxianPortraitPool,
    'huimo': _chaoxianPortraitPool,
    'jeolla': _chaoxianPortraitPool,
    'jianzhou_nvzhen': _chaoxianPortraitPool,
    'joseon': _chaoxianPortraitPool,
    'mao_wenlong': _chaoxianPortraitPool,
    'sabeol': _chaoxianPortraitPool,
    'sambyeol': _chaoxianPortraitPool,
    'tunggiya': _chaoxianPortraitPool,
    'woju': _chaoxianPortraitPool,
    'xingliao': _chaoxianPortraitPool,
    'xinluo': _chaoxianPortraitPool,
    'xuantu': _chaoxianPortraitPool,
    'zhen': _chaoxianPortraitPool,
    // 日本 25 势力
    'aizu': _ribenPortraitPool,
    'aki': _ribenPortraitPool,
    'anmei': _ribenPortraitPool,
    'ashikaga': _ribenPortraitPool,
    'ayinu': _ribenPortraitPool,
    'chosokabe': _ribenPortraitPool,
    'dayu': _ribenPortraitPool,
    'echigo': _ribenPortraitPool,
    'edo': _ribenPortraitPool,
    'gaya': _ribenPortraitPool,
    'hashiba': _ribenPortraitPool,
    'hojo_d': _ribenPortraitPool,
    'honda': _ribenPortraitPool,
    'iga_d': _ribenPortraitPool,
    'izumo': _ribenPortraitPool,
    'jibei2': _ribenPortraitPool,
    'jinchuan': _ribenPortraitPool,
    'kai': _ribenPortraitPool,
    'kakizaki': _ribenPortraitPool,
    'owari': _ribenPortraitPool,
    'satsuma': _ribenPortraitPool,
    'so': _ribenPortraitPool,
    'yamato': _ribenPortraitPool,
    'yizhi': _ribenPortraitPool,
    'zhuqian': _ribenPortraitPool,
    // 中亚 31 势力
    'an': _zhongyaPortraitPool,
    'anushidgin': _zhongyaPortraitPool,
    'ashina': _zhongyaPortraitPool,
    'badakhshan': _zhongyaPortraitPool,
    'dayuan': _zhongyaPortraitPool,
    'dayuzi': _zhongyaPortraitPool,
    'geluolu': _caoyuanPortraitPool,
    'guer': _zhongyaPortraitPool,
    'guzgan': _zhongyaPortraitPool,
    'hepan': _zhongyaPortraitPool,
    'jie': _zhongyaPortraitPool,
    'kala': _zhongyaPortraitPool,
    'kangju': _zhongyaPortraitPool,
    'kawusi': _zhongyaPortraitPool,
    'kazakh': _zhongyaPortraitPool,
    'keerkezi': _zhongyaPortraitPool,
    'khoja': _zhongyaPortraitPool,
    'kokand': _zhongyaPortraitPool,
    'mamon': _zhongyaPortraitPool,
    'saman': _zhongyaPortraitPool,
    'seljuq': _zhongyaPortraitPool,
    'shi_clan': _zhongyaPortraitPool,
    'shule': _zhongyaPortraitPool,
    'sogdian': _zhongyaPortraitPool,
    'tiemuer': _zhongyaPortraitPool,
    'tujishi': _zhongyaPortraitPool,
    'wusun': _zhongyaPortraitPool,
    'xijue': _zhongyaPortraitPool,
    'yanda': _zhongyaPortraitPool,
    'yuezhi': _zhongyaPortraitPool,
    'zhaowu': _zhongyaPortraitPool,
    // 中原 66 势力
    'baibo': _zhongyuanPortraitPool,
    'bailian': _zhongyuanPortraitPool,
    'bozhou_d': _zhongyuanPortraitPool,
    'cai': _zhongyuanPortraitPool,
    'cao_d': _zhongyuanPortraitPool,
    'chimei': _zhongyuanPortraitPool,
    'dang_d': _zhongyuanPortraitPool,
    'dashun': _zhongyuanPortraitPool,
    'dongxian': _zhongyuanPortraitPool,
    'feng_d': _zhongyuanPortraitPool,
    'fu': _zhongyuanPortraitPool,
    'guide_d': _zhongyuanPortraitPool,
    'han': _zhongyuanPortraitPool,
    'han_dadian': _zhongyuanPortraitPool,
    'hao_d': _zhongyuanPortraitPool,
    'haoding': _zhongyuanPortraitPool,
    'hongguang': _zhongyuanPortraitPool,
    'huai': _zhongyuanPortraitPool,
    'huaiyang': _zhongyuanPortraitPool,
    'huangfu': _zhongyuanPortraitPool,
    'jiaodong': _zhongyuanPortraitPool,
    'jibei': _zhongyuanPortraitPool,
    'jin': _zhongyuanPortraitPool,
    'jingzhou': _zhongyuanPortraitPool,
    'kong_d': _zhongyuanPortraitPool,
    'liang_d': _zhongyuanPortraitPool,
    'liguo': _zhongyuanPortraitPool,
    'liutong_yangqing': _zhongyuanPortraitPool,
    'liwang': _zhongyuanPortraitPool,
    'long2': _zhongyuanPortraitPool,
    'lulin': _zhongyuanPortraitPool,
    'lvbu': _zhongyuanPortraitPool,
    'mengcheng_d': _zhongyuanPortraitPool,
    'mi': _zhongyuanPortraitPool,
    'qi': _zhongyuanPortraitPool,
    'qiang': _zhongyuanPortraitPool,
    'qiguo_d': _zhongyuanPortraitPool,
    // 'qin': _zhongyuanPortraitPool,  // qin 有专属池
    'qing': _zhongyuanPortraitPool,
    'quanrong': _zhongyuanPortraitPool,
    'shang': _zhongyuanPortraitPool,
    'shangzhou': _zhongyuanPortraitPool,
    'shen': _zhongyuanPortraitPool,
    'sima_d': _zhongyuanPortraitPool,
    'sunqin': _zhongyuanPortraitPool,
    'tianxiong': _zhongyuanPortraitPool,
    'wang_d': _zhongyuanPortraitPool,
    'wazhai': _zhongyuanPortraitPool,
    'wei': _zhongyuanPortraitPool,
    'wey': _zhongyuanPortraitPool,
    'xia': _zhongyuanPortraitPool,
    'xiao_d': _zhongyuanPortraitPool,
    'xichu': _zhongyuanPortraitPool,
    'xin': _zhongyuanPortraitPool,
    'xinping': _zhongyuanPortraitPool,
    'xiqin': _zhongyuanPortraitPool,
    'xu': _zhongyuanPortraitPool,
    'yanchuan_d': _zhongyuanPortraitPool,
    'yangshao': _zhongyuanPortraitPool,
    'yao': _zhongyuanPortraitPool,
    'yin': _zhongyuanPortraitPool,
    'yingzhou_d': _zhongyuanPortraitPool,
    'yuan_cj_d': _zhongyuanPortraitPool,
    'zhao': _zhongyuanPortraitPool,
    'zhong': _zhongyuanPortraitPool,
    'zhou': _zhongyuanPortraitPool,
    // 江南 47 势力
    'chu_d': _nanfangPortraitPool,
    'chunshen': _nanfangPortraitPool,
    'danyang': _nanfangPortraitPool,
    'daxing': _nanfangPortraitPool,
    'fang_guozhen': _nanfangPortraitPool,
    'fangla': _nanfangPortraitPool,
    'fu2': _nanfangPortraitPool,
    'gumie': _nanfangPortraitPool,
    'heng': _nanfangPortraitPool,
    'huang_d': _nanfangPortraitPool,
    'jiujiang': _nanfangPortraitPool,
    'kejia': _nanfangPortraitPool,
    'linshihong': _nanfangPortraitPool,
    'liu': _nanfangPortraitPool,
    'lu': _nanfangPortraitPool,
    'lujian': _nanfangPortraitPool,
    'machu': _nanfangPortraitPool,
    'mi_chu': _nanfangPortraitPool,
    'min': _nanfangPortraitPool,
    'ming_zheng': _nanfangPortraitPool,
    'ning': _nanfangPortraitPool,
    'ouyang': _nanfangPortraitPool,
    'ouyue': _nanfangPortraitPool,
    'pu': _nanfangPortraitPool,
    'qi_d': _nanfangPortraitPool,
    'qian_d': _nanfangPortraitPool,
    'qiufu': _nanfangPortraitPool,
    'ruochu': _nanfangPortraitPool,
    'shanyue': _nanfangPortraitPool,
    'she_ethnic': _nanfangPortraitPool,
    'shuntian': _nanfangPortraitPool,
    'song': _nanfangPortraitPool,
    'sui': _nanfangPortraitPool,
    'sunwu_d': _nanfangPortraitPool,
    'ting': _nanfangPortraitPool,
    'wan': _nanfangPortraitPool,
    'wang_s': _nanfangPortraitPool,
    'wu': _nanfangPortraitPool,
    'wuwu_d': _nanfangPortraitPool,
    'xie_cj_d': _nanfangPortraitPool,
    'xushouhui': _nanfangPortraitPool,
    'yezongliu': _nanfangPortraitPool,
    'ying': _nanfangPortraitPool,
    'yiyang_d': _nanfangPortraitPool,
    'yue': _nanfangPortraitPool,
    'yue_d': _nanfangPortraitPool,
    'zhangshicheng': _nanfangPortraitPool,
    // 岭南补充 36 势力
    'basha_d': _lingnanPortraitPool,
    'buyi_d': _lingnanPortraitPool,
    'cen_d': _lingnanPortraitPool,
    'champa': _lingnanPortraitPool,
    'chen': _lingnanPortraitPool,
    'chen2': _lingnanPortraitPool,
    'dacheng': _lingnanPortraitPool,
    'dayue': _lingnanPortraitPool,
    'gouding': _lingnanPortraitPool,
    'guangnanguo': _lingnanPortraitPool,
    'guangxin': _lingnanPortraitPool,
    'jiang_s': _lingnanPortraitPool,
    'jingjiang': _lingnanPortraitPool,
    'li_s': _lingnanPortraitPool,
    'linyi': _lingnanPortraitPool,
    'liren': _lingnanPortraitPool,
    'luodian': _lingnanPortraitPool,
    'luoyue': _lingnanPortraitPool,
    'miao': _lingnanPortraitPool,
    'miao_qing': _lingnanPortraitPool,
    'muong': _lingnanPortraitPool,
    'nong2': _lingnanPortraitPool,
    'nongzhigao': _lingnanPortraitPool,
    'panyao': _lingnanPortraitPool,
    'qian': _lingnanPortraitPool,
    'shengmiao': _lingnanPortraitPool,
    'shixing': _lingnanPortraitPool,
    'taiping': _lingnanPortraitPool,
    'tian_sizhou': _lingnanPortraitPool,
    'trinh': _lingnanPortraitPool,
    'xian_d': _lingnanPortraitPool,
    'xinggu': _lingnanPortraitPool,
    'xiou': _lingnanPortraitPool,
    'yelang': _lingnanPortraitPool,
    'yongli': _lingnanPortraitPool,
    'zangke': _lingnanPortraitPool,
    // 边缘 15 划归各区
    'aola': _dongbeiPortraitPool,
    'chaoer': _dongbeiPortraitPool,
    'eluoke': _dongbeiPortraitPool,
    'jilimi': _dongbeiPortraitPool,
    'maomingan': _dongbeiPortraitPool,
    'buriat': _caoyuanPortraitPool,
    'dzungar': _xiyuPortraitPool,
    'fujiwara': _ribenPortraitPool,
    'nanbu': _ribenPortraitPool,
    'gurkha': _tuboPortraitPool,
    'huarazim': _zhongyaPortraitPool,
    'qiepantuo': _zhongyaPortraitPool,
    'qincha': _zhongyaPortraitPool,
    'xianhai': _zhongyaPortraitPool,
    'yettishar': _zhongyaPortraitPool,
};

function pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 为势力军队随机选取一张立绘。
 * 在 Army 创建时调用一次（存入 portraitPath），之后固定不变。
 */
export function getRandomFactionPortrait(factionId: string): string | undefined {
    const pool = FACTION_PORTRAIT_POOLS[factionId];
    if (!pool || pool.length === 0) return undefined;
    return pickRandom(pool);
}

/** 按参战单位文化区与军队/守军选默认立绘路径 */
export function getCombatPortraitPath(unit: IBattleUnit): string {
    if (unit.factionId === 'panjun') {
        return '/assets/panjun/panjun.png';
    }
    // 军团创建时已固定 portraitPath（见 Army 构造、BattleUnitFactory）
    if (unit.portraitPath) {
        return unit.portraitPath;
    }
    // 守城方：每次从势力立绘池随机选（代表不同守将）
    const factionId = unit.factionId;
    if (factionId && FACTION_PORTRAIT_POOLS[factionId]) {
        return pickRandom(FACTION_PORTRAIT_POOLS[factionId]);
    }
    const region = resolveUnitCultureRegion(unit);
    const role = getCulturePortraitRole(unit);
    return `${PORTRAIT_ASSETS_DIR}/${region}_${role}.png`;
}
