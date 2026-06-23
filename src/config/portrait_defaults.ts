/**
 * 战斗 UI 立绘 — **三级分配规则（AGENTS.md §十三，AI 必读）**
 *
 * ① **武将**：专属立绘（文件存在）→ 政权专夹 → 据点/出兵文化区夹。
 * ② **政权**（军团随机、无将城防等）：政权专夹 → 文化区夹。
 * ③ **14+1 文化圈**：每圈仅 **一个** 夹 `public/assets/{RegionType}/`；+1 叛军 `panjun/`。禁止两夹并池。
 * ④ 政权专夹（litang/、yingqin/ 等）与文化区夹分离；映射表指向区夹的条目不算政权专夹。
 *
 * 禁止：portraits/、avg/、REGION_FIELD_PORTRAIT。
 * 同夹禁重复：npm run portrait:folder-audit
 *
 * 素材约定：全部 PNG 未镜像时目视**右侧**。
 * CombatUI：左攻不 scaleX、右守 scaleX(-1)，二人相向中央。
 */
import type { IBattleUnit } from '../core/CombatSystem';
import { CITIES_V2 } from '../data/cities_v2';
import {
    resolveUnitCultureRegion,
    type CultureCombatRole,
} from '../systems/CultureCombat';
import { getCityRegion, REGION_ORDER, type RegionType } from '../systems/RegionSystem';

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

// ── 全库扫描 + 14 文化区打底池（夹名 = RegionType，与 cities_v2.region 一一对应）──

const _allPortraitAssetGlob = import.meta.glob<string>(
    '../../public/assets/**/*.png',
    { eager: true, query: '?url', import: 'default' },
);

/** 将 Vite ?url 结果规范为 `/assets/...`  web 路径 */
export function normalizePortraitWebPath(url: string): string {
    const idx = url.indexOf('/assets/');
    if (idx >= 0) return url.slice(idx);
    try {
        return new URL(url, 'http://local').pathname;
    } catch {
        return url;
    }
}

function collectRegionPortraitPool(region: RegionType): string[] {
    // Windows 文件系统不区分大小写，Vite glob 返回的路径大小写不确定
    // 例：HEXI 文件夹可能返回 /assets/hexi/ 或 /assets/HEXI/，用小写比较兜底
    const prefix = cultureCircleFolderPrefix(region).toLowerCase();
    const pool = Object.values(_allPortraitAssetGlob)
        .map(normalizePortraitWebPath)
        .filter((p) => p.toLowerCase().startsWith(prefix));
    if (pool.length === 0) {
        console.warn(`[Portrait] ⚠️ 文化区 ${region} 立绘池为空！检查 public/assets/${region}/ 文件夹及 Vite glob 大小写`);
    }
    return pool;
}

/** 14 文化区 ↔ 唯一物理夹（与 RegionType 同名，禁止多夹并池） */
export function cultureCircleFolderPrefix(region: RegionType): string {
    return `/assets/${region}/`;
}

/** +1 叛军文化圈（独立于 14 区） */
export const PANJUN_CULTURE_FOLDER = '/assets/panjun/';

/** 14 文化区随机池：每区仅 `public/assets/{RegionType}/*.png` */
export const REGION_PORTRAIT_POOLS: Record<RegionType, string[]> = Object.fromEntries(
    REGION_ORDER.map((r) => [r, collectRegionPortraitPool(r)]),
) as Record<RegionType, string[]>;

// Windows 大小写不敏感：统一转小写存储，查找时也转小写
const KNOWN_PORTRAIT_PATHS = new Set(
    Object.values(_allPortraitAssetGlob)
        .map(normalizePortraitWebPath)
        .map((p) => p.toLowerCase())
        .filter((p) => !/^\/assets\/inbox\//i.test(p)),
);

// 启动诊断：检测 glob 共扫描多少文件，以及各文化区池大小
{
    const total = Object.keys(_allPortraitAssetGlob).length;
    const hexiSize = REGION_PORTRAIT_POOLS.HEXI?.length ?? 0;
    const centralSize = REGION_PORTRAIT_POOLS.CENTRAL?.length ?? 0;
    console.log(`[Portrait] 全局 glob 扫描: ${total} 张 | HEXI池: ${hexiSize} | CENTRAL池: ${centralSize}`);
    if (hexiSize === 0) {
        // 打印前5个 glob 键值帮助诊断 Vite 返回的路径格式
        const sample = Object.entries(_allPortraitAssetGlob).slice(0, 5);
        console.warn(`[Portrait] HEXI池为空！Vite glob 样本:`, sample);
    }
}

/** 旧拼音夹名 → 文化区池（政权 FACTION 映射仍引用这些变量，物理文件已迁入区名夹） */
const _zhongyuanPortraitPool = REGION_PORTRAIT_POOLS.CENTRAL;
const _shuguoPortraitPool = REGION_PORTRAIT_POOLS.BASHU;
const _dianmianPortraitPool = REGION_PORTRAIT_POOLS.DIANQIAN;
const _xiyuPortraitPool = REGION_PORTRAIT_POOLS.WESTERN;
const _hexiPortraitPool = REGION_PORTRAIT_POOLS.HEXI;
const _tuboPortraitPool = REGION_PORTRAIT_POOLS.TIBET;
const _caoyuanPortraitPool = REGION_PORTRAIT_POOLS.STEPPE;
const _dongbeiPortraitPool = REGION_PORTRAIT_POOLS.NORTHEAST;
const _chaoxianPortraitPool = REGION_PORTRAIT_POOLS.KOREA;
const _ribenPortraitPool = REGION_PORTRAIT_POOLS.JAPAN;
const _zhongyaPortraitPool = REGION_PORTRAIT_POOLS.CENTRAL_ASIA;
const _jiangnanPortraitPool = REGION_PORTRAIT_POOLS.JIANGNAN;
const _lingnanPortraitPool = REGION_PORTRAIT_POOLS.LINGNAN;
const _guangzhouPortraitPool = REGION_PORTRAIT_POOLS.LINGNAN;
const _beifangPortraitPool = REGION_PORTRAIT_POOLS.NORTH;

// ── 政权专属立绘（夹名保持政权/史料专夹，不走 14 区重命名）──

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

/** 广州政权专夹已并入 LINGNAN 区夹；政权映射仍用 _guangzhouPortraitPool 别名 */

/** 蒲甘政权专夹（滇缅区蒲甘势力，与 DIANQIAN 区夹并存） */
const _puganPortraitGlob = import.meta.glob<string>(
    '../../public/assets/pugan/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _puganPortraitPool: string[] = Object.values(_puganPortraitGlob);

/** 满清政权专夹 */
const _manqingPortraitGlob = import.meta.glob<string>(
    '../../public/assets/manqing/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _manqingPortraitPool: string[] = Object.values(_manqingPortraitGlob);

/** 殷商专属立绘池（商@安阳 + 殷@朝歌） */
const _xianqinPortraitGlob = import.meta.glob<string>(
    '../../public/assets/xianqin/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _xianqinPortraitPool: string[] = Object.values(_xianqinPortraitGlob);

/** 汉国专属立绘池（南郑） */
const _liuhanPortraitGlob = import.meta.glob<string>(
    '../../public/assets/liuhan/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _liuhanPortraitPool: string[] = Object.values(_liuhanPortraitGlob);

/** 赵宋专属立绘池（临安） */
const _zhaosongPortraitGlob = import.meta.glob<string>(
    '../../public/assets/zhaosong/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _zhaosongPortraitPool: string[] = Object.values(_zhaosongPortraitGlob);

/** 秦国立绘池 */
const _qinPortraitGlob = import.meta.glob<string>(
    '../../public/assets/yingqin/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _qinPortraitPool: string[] = Object.values(_qinPortraitGlob);

/** 叛军立绘池 */
const _panjunPortraitGlob = import.meta.glob<string>(
    '../../public/assets/panjun/*.png',
    { eager: true, query: '?url', import: 'default' },
);
const _panjunPortraitPool: string[] = Object.values(_panjunPortraitGlob);

/** 14 区 + panjun 的 web 路径前缀清单（审计/文档用） */
export const CULTURE_CIRCLE_FOLDERS: readonly string[] = [
    ...REGION_ORDER.map((r) => cultureCircleFolderPrefix(r)),
    PANJUN_CULTURE_FOLDER,
];

function isCultureCircleAssetPath(path: string): boolean {
    const p = normalizePortraitWebPath(path);
    return REGION_ORDER.some((region) => p.startsWith(cultureCircleFolderPrefix(region)));
}

/** 池内是否含政权专夹路径（非 14 区、非 panjun 的 /assets/ 子夹） */
function poolIsFactionOnly(pool: string[]): boolean {
    return pool.some((raw) => {
        const p = normalizePortraitWebPath(raw);
        if (!p.startsWith('/assets/')) return false;
        if (p.startsWith(PANJUN_CULTURE_FOLDER)) return false;
        return !isCultureCircleAssetPath(p);
    });
}

function assertCultureCirclePoolsSingleFolder(): void {
    if (!import.meta.env.DEV) return;
    for (const region of REGION_ORDER) {
        const prefix = cultureCircleFolderPrefix(region);
        for (const p of REGION_PORTRAIT_POOLS[region]) {
            if (!p.startsWith(prefix)) {
                console.warn(`[portrait] 文化区 ${region} 池混入非本夹路径: ${p}`);
            }
        }
    }
    for (const p of _panjunPortraitPool) {
        const n = normalizePortraitWebPath(p);
        if (!n.startsWith(PANJUN_CULTURE_FOLDER)) {
            console.warn(`[portrait] panjun 池混入非 panjun 夹路径: ${n}`);
        }
    }
}
assertCultureCirclePoolsSingleFolder();

const _factionCultureRegionCache = new Map<string, RegionType | undefined>();

/** 势力专属立绘池（factionId → 图片路径数组） */
const FACTION_PORTRAIT_POOLS: Record<string, string[]> = {
    'qin': _qinPortraitPool,
    'wuzhou_d': _wuzhouPortraitPool,
    'tang': _litangPortraitPool,
    'ming_d': _damingPortraitPool,
    'jinling': _litangPortraitPool,
    'guangzhou': _guangzhouPortraitPool,
    // 岭南全境套用广州
    'sagami': _ribenPortraitPool,
    'ryukyu': _ribenPortraitPool,
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
    'hezhou': _shuguoPortraitPool,
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
    'miaomin': _lingnanPortraitPool,
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
    'siam': _puganPortraitPool,
    'chenla': _puganPortraitPool,
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
    'zhuozhou': _zhongyuanPortraitPool,
    'bing': _zhongyuanPortraitPool,
    'dai_d': _zhongyuanPortraitPool,
    'dizhou': _zhongyuanPortraitPool,
    'dongdan': _dongbeiPortraitPool,
    'erzhu': _zhongyuanPortraitPool,
    'gaoqi_d': _zhongyuanPortraitPool,
    'guzhu': _zhongyuanPortraitPool,
    'hejian': _zhongyuanPortraitPool,
    'jinzhou': _damingPortraitPool,
    'kumo': _caoyuanPortraitPool,
    'liangshidu': _zhongyuanPortraitPool,
    'pingyuan': _zhongyuanPortraitPool,
    'qingyuan_bd': _zhongyuanPortraitPool,
    'ranwei_d': _zhongyuanPortraitPool,
    'shizhao_d': _zhongyuanPortraitPool,
    'tongma': _zhongyuanPortraitPool,
    'tuoba': _caoyuanPortraitPool,
    'wangyan': _zhongyuanPortraitPool,
    'weihaiwei': _zhongyuanPortraitPool,
    'xuan': _zhongyuanPortraitPool,
    'yan': _xianqinPortraitPool,
    'yang_aner': _zhongyuanPortraitPool,
    'yangshe': _zhongyuanPortraitPool,
    'yunzhong': _zhongyuanPortraitPool,
    'zhe_d': _zhongyuanPortraitPool,
    'zhongshan': _zhongyuanPortraitPool,
    'zu_d': _zhongyuanPortraitPool,
    // 西域 22 势力
    'anxi': _xiyuPortraitPool,
    'duerbote': _caoyuanPortraitPool,
    'loulan': _xiyuPortraitPool,
    'pisha': _xiyuPortraitPool,
    'pishan': _xiyuPortraitPool,
    'qiemo': _xiyuPortraitPool,
    'qiuci': _xiyuPortraitPool,
    'shache': _xiyuPortraitPool,
    'tuerhute': _caoyuanPortraitPool,
    'weili': _xiyuPortraitPool,
    'weitou': _xiyuPortraitPool,
    'weiwuer': _xiyuPortraitPool,
    'wensu': _xiyuPortraitPool,
    'xibo_d': _dongbeiPortraitPool,
    'xiye': _xiyuPortraitPool,
    'yanqi': _xiyuPortraitPool,
    'yarkand': _xiyuPortraitPool,
    'yiduhu': _xiyuPortraitPool,
    'yuchi': _xiyuPortraitPool,
    'yumi': _xiyuPortraitPool,
    'zhuxie': _xiyuPortraitPool,
    // 河西 22 势力
    'chijin': _hexiPortraitPool,
    'chile': _caoyuanPortraitPool,
    'dada_ming': _caoyuanPortraitPool,
    'dangzhou': _shuguoPortraitPool,
    'dangxiang': _hexiPortraitPool,
    'dongshengwei': _zhongyuanPortraitPool,
    'guiyi': _hexiPortraitPool,
    'helian': _hexiPortraitPool,
    'huan': _hexiPortraitPool,
    'huizhou': _hexiPortraitPool,
    'hunxie': _caoyuanPortraitPool,
    'juqu_d': _hexiPortraitPool,
    'kang': _hexiPortraitPool,
    'lingzhou': _hexiPortraitPool,
    'lushui': _hexiPortraitPool,
    'shuofang': _zhongyuanPortraitPool,
    'wei2': _hexiPortraitPool,
    'weiming': _hexiPortraitPool,
    'lanzhou': _hexiPortraitPool,
    'yeli': _hexiPortraitPool,
    'yingli': _hexiPortraitPool,
    'zhai_han': _zhongyuanPortraitPool,
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
    'guangwu': _hexiPortraitPool,
    'guge': _tuboPortraitPool,
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
    'cheshihou': _xiyuPortraitPool,
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
    'yingzhou_ying_d': _dongbeiPortraitPool,
    'yiwu': _xiyuPortraitPool,
    'yuan_d': _caoyuanPortraitPool,
    'yujiulu': _caoyuanPortraitPool,
    'yuwen': _caoyuanPortraitPool,
    'zhadalan': _caoyuanPortraitPool,
    'zhasaketu': _caoyuanPortraitPool,
    'zhuerqi': _caoyuanPortraitPool,
    // 东北 32 势力
    'aisin_d': _manqingPortraitPool,
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
    'manzhou': _manqingPortraitPool,
    'manzhou_d': _manqingPortraitPool,
    'mohe': _dongbeiPortraitPool,
    'nanai': _dongbeiPortraitPool,
    'nifuhe': _dongbeiPortraitPool,
    'shuidada': _dongbeiPortraitPool,
    'suolun': _dongbeiPortraitPool,
    'sushen': _dongbeiPortraitPool,

    'wuji': _dongbeiPortraitPool,
    'wure': _dongbeiPortraitPool,
    'xianbei': _dongbeiPortraitPool,
    'yeren_nvzhen': _dongbeiPortraitPool,
    'yilou': _dongbeiPortraitPool,
    'yizhou': _dongbeiPortraitPool,
    // 朝鲜 21 势力
    'baishui': _shuguoPortraitPool,
    'baiji': _chaoxianPortraitPool,
    'chen3': _chaoxianPortraitPool,
    'danluo': _chaoxianPortraitPool,
    'luzhou': _chaoxianPortraitPool,
    'gaogouli': _chaoxianPortraitPool,
    'goryeo': _chaoxianPortraitPool,
    'hai2': _chaoxianPortraitPool,
    'hui': _chaoxianPortraitPool,
    'huimo': _chaoxianPortraitPool,
    'sheng_d': _chaoxianPortraitPool,
    'jianzhou_nvzhen': _manqingPortraitPool,
    'joseon': _chaoxianPortraitPool,
    'mao_wenlong': _damingPortraitPool,
    'sabeol': _chaoxianPortraitPool,
    'sambyeol': _chaoxianPortraitPool,
    'tunggiya': _manqingPortraitPool,
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
    'beihai': _ribenPortraitPool,
    'chosokabe': _ribenPortraitPool,
    'dayu': _jiangnanPortraitPool,
    'echigo': _ribenPortraitPool,
    'edo': _ribenPortraitPool,
    'gaya': _chaoxianPortraitPool,
    'hashiba': _ribenPortraitPool,
    'shimotsuke': _ribenPortraitPool,
    'iga_d': _ribenPortraitPool,
    'izumo': _ribenPortraitPool,
    'jibei2': _ribenPortraitPool,
    'jinchuan': _ribenPortraitPool,
    'totomi': _ribenPortraitPool,
    'owari': _ribenPortraitPool,
    'kai': _ribenPortraitPool,
    'kakizaki': _ribenPortraitPool,
    'satsuma': _ribenPortraitPool,
    'so': _ribenPortraitPool,
    'yamato': _ribenPortraitPool,
    'yizhi': _ribenPortraitPool,
    'zhuqian': _ribenPortraitPool,
    // 中亚 31 势力
    'an': _zhongyaPortraitPool,
    'anushidgin': _zhongyaPortraitPool,
    'ashina': _zhongyaPortraitPool,
    'xiliao': _zhongyaPortraitPool,
    'badakhshan': _zhongyaPortraitPool,
    'dayuan': _zhongyaPortraitPool,
    'dayuzi': _zhongyaPortraitPool,
    'geluolu': _caoyuanPortraitPool,
    'muer': _zhongyaPortraitPool,
    'guzgan': _zhongyaPortraitPool,
    'hepan': _zhongyaPortraitPool,
    'jie': _caoyuanPortraitPool,
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
    'guishuang': _zhongyaPortraitPool,
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
    'fu': _zhongyuanPortraitPool,
    'guide_d': _zhongyuanPortraitPool,
    'han': _xianqinPortraitPool,
    'han_d': _liuhanPortraitPool, // 汉国·刘邦；与绿林/新国共用 liuhan 随机池
    'han_dadian': _zhongyuanPortraitPool,
    'hao_d': _zhongyuanPortraitPool,
    'jinan': _zhongyuanPortraitPool,
    'hongguang': _zhongyuanPortraitPool,
    'huai': _zhongyuanPortraitPool,
    'huaiyang': _zhongyuanPortraitPool,
    'huangfu': _zhongyuanPortraitPool,
    'jiaodong': _zhongyuanPortraitPool,
    'jibei': _zhongyuanPortraitPool,
    'jin': _xianqinPortraitPool,
    'xiangzhou': _zhongyuanPortraitPool,
    'zaoyang_d': _zhongyuanPortraitPool,
    'kong_d': _zhongyuanPortraitPool,
    'liang_d': _zhongyuanPortraitPool,
    'liguo': _zhongyuanPortraitPool,
    'dixiang': _liuhanPortraitPool, // 新国·王莽；与汉/绿林共用 liuhan 随机池
    'liwang': _zhongyuanPortraitPool,
    'long2': _zhongyuanPortraitPool,
    'lulin': _liuhanPortraitPool, // 绿林·刘秀；与汉/新国共用 liuhan 随机池
    'suzhou_d': _zhongyuanPortraitPool,
    'mengcheng_d': _zhongyuanPortraitPool,
    'mi': _zhongyuanPortraitPool,
    'qi': _xianqinPortraitPool,
    'qiang': _zhongyuanPortraitPool,
    'yuzhou': _zhongyuanPortraitPool,
    // 'qin': _zhongyuanPortraitPool,  // qin 有专属池
    'qing': _zhongyuanPortraitPool,
    'quanrong': _xianqinPortraitPool,
    'shang': _xianqinPortraitPool,
    'shangzhou': _zhongyuanPortraitPool,
    'shen': _zhongyuanPortraitPool,
    'sima_d': _zhongyuanPortraitPool,
    'sunqin': _zhongyuanPortraitPool,
    'tianxiong': _zhongyuanPortraitPool,
    'wang_d': _zhongyuanPortraitPool,
    'wazhai': _zhongyuanPortraitPool,
    'wei': _xianqinPortraitPool,
    'chanzhou': _zhongyuanPortraitPool,
    'xiezhou': _zhongyuanPortraitPool,
    'xiao_d': _zhongyuanPortraitPool,
    'xichu': _xianqinPortraitPool,
    'xin': _zhongyuanPortraitPool,
    'xinping': _zhongyuanPortraitPool,
    'xiqin': _zhongyuanPortraitPool,
    'pizhou': _zhongyuanPortraitPool,
    'qianzhou': _zhongyuanPortraitPool, // 乾州·奉天；李晟神策军（唐末中原）
    'yanchuan_d': _zhongyuanPortraitPool,
    'yangshao': _zhongyuanPortraitPool,
    'yao': _zhongyuanPortraitPool,
    'yin': _xianqinPortraitPool,
    'yingzhou_d': _zhongyuanPortraitPool,
    'yuan_cj_d': _zhongyuanPortraitPool,
    'zhao': _xianqinPortraitPool,
    'zhong': _zhongyuanPortraitPool,
    'zhou': _xianqinPortraitPool,
    // 江南 47 势力
    'chu_d': _xianqinPortraitPool,
    'hu_d': _jiangnanPortraitPool,
    'chunshen': _xianqinPortraitPool,
    'danyang': _jiangnanPortraitPool,
    'daxing': _jiangnanPortraitPool,
    'fang_guozhen': _jiangnanPortraitPool,
    'fangla': _jiangnanPortraitPool,
    'fu2': _jiangnanPortraitPool,
    'gumie': _jiangnanPortraitPool,
    'heng': _jiangnanPortraitPool,
    'huang_d': _jiangnanPortraitPool,
    'jiujiang': _jiangnanPortraitPool,
    'kejia': _lingnanPortraitPool,
    'linshihong': _jiangnanPortraitPool,
    'liu': _jiangnanPortraitPool,
    'lu': _jiangnanPortraitPool,
    'lujian': _jiangnanPortraitPool,
    'changshaguo': _jiangnanPortraitPool,
    'mi_chu': _xianqinPortraitPool,
    'min': _lingnanPortraitPool,
    'quanzhou': _lingnanPortraitPool,
    'ming_zheng': _lingnanPortraitPool,
    'hongzhou': _jiangnanPortraitPool,
    'ouyang': _jiangnanPortraitPool,
    'ouyue': _jiangnanPortraitPool,
    'pu': _jiangnanPortraitPool,
    'qi_d': _jiangnanPortraitPool,
    'qian_d': _jiangnanPortraitPool,
    'qiufu': _jiangnanPortraitPool,
    'ruochu': _xianqinPortraitPool,
    'shanyue': _jiangnanPortraitPool,
    'she_ethnic': _lingnanPortraitPool,
    'shuntian': _jiangnanPortraitPool,
    'song': _zhaosongPortraitPool,
    'sui': _jiangnanPortraitPool,
    'sunwu_d': _jiangnanPortraitPool,
    'ting': _jiangnanPortraitPool,
    'wan': _jiangnanPortraitPool,
    'wang_s': _jiangnanPortraitPool,
    'wu': _xianqinPortraitPool,
    'wuwu_d': _jiangnanPortraitPool,
    'xie_cj_d': _jiangnanPortraitPool,
    'xushouhui': _jiangnanPortraitPool,
    'yezongliu': _jiangnanPortraitPool,
    'ying': _jiangnanPortraitPool,
    'yiyang_d': _jiangnanPortraitPool,
    'yue': _xianqinPortraitPool,
    'yue_d': _zhaosongPortraitPool,
    'zhangshicheng': _jiangnanPortraitPool,
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
    'shaozhou': _lingnanPortraitPool,
    'taiping': _lingnanPortraitPool,
    'tian_sizhou': _lingnanPortraitPool,
    'trinh': _lingnanPortraitPool,
    'xian_d': _lingnanPortraitPool,
    'xinggu': _lingnanPortraitPool,
    'xiou': _lingnanPortraitPool,
    'yelang': _lingnanPortraitPool,
    'yongli': _lingnanPortraitPool,
    'duanzhou_d': _lingnanPortraitPool,
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
    'panjun': _panjunPortraitPool,
};

/** 据势力首都解析文化区（BattleUnitFactory / 守城立绘 resolve 用） */
export function getFactionCultureRegion(factionId: string): RegionType | undefined {
    if (_factionCultureRegionCache.has(factionId)) {
        return _factionCultureRegionCache.get(factionId);
    }
    const city = CITIES_V2.find(c => c.factionId === factionId);
    if (!city) {
        _factionCultureRegionCache.set(factionId, undefined);
        return undefined;
    }
    // 据点已有 region 时直接用，避免坐标多边形判定
    const region = city.region && REGION_ORDER.includes(city.region as RegionType)
        ? (city.region as RegionType)
        : getCityRegion({
            latitude: city.lat,
            longitude: city.lng,
            region: city.region,
        });
    _factionCultureRegionCache.set(factionId, region);
    return region;
}

/** 仅政权专属池（路径须在政权专夹；映射到区夹的条目不算，交给文化区一步） */
function getFactionPortraitPool(factionId: string | null | undefined): string[] | undefined {
    if (!factionId || factionId === 'panjun') return undefined;
    const pool = FACTION_PORTRAIT_POOLS[factionId];
    if (!pool?.length || !poolIsFactionOnly(pool)) return undefined;
    return pool;
}

/** 政权专夹 → 文化区单夹 → 中原单夹 → panjun 单夹 → 常量兜底（禁止全库乱抽） */
function pickFactionThenCulturePath(
    factionId: string | null | undefined,
    cultureRegion: RegionType,
    exclude?: string,
): string {
    if (factionId === 'panjun') {
        const fromPanjun = pickRandomExisting(_panjunPortraitPool, exclude);
        if (fromPanjun) return normalizePortraitWebPath(fromPanjun);
        return BATTLE_PORTRAIT_FALLBACK;
    }

    const factionPool = getFactionPortraitPool(factionId);
    if (factionPool?.length) {
        const fromFaction = pickRandomExisting(factionPool, exclude);
        if (fromFaction) return normalizePortraitWebPath(fromFaction);
    }

    const regionPool = REGION_PORTRAIT_POOLS[cultureRegion];
    const fromRegion = regionPool ? pickRandomExisting(regionPool, exclude) : undefined;
    if (fromRegion) return normalizePortraitWebPath(fromRegion);

    const fromCentral = pickRandomExisting(REGION_PORTRAIT_POOLS.CENTRAL, exclude);
    if (fromCentral) return normalizePortraitWebPath(fromCentral);

    const fromPanjun = pickRandomExisting(_panjunPortraitPool, exclude);
    if (fromPanjun) return normalizePortraitWebPath(fromPanjun);

    return BATTLE_PORTRAIT_FALLBACK;
}

/**
 * 武将立绘：专图文件存在则用专图；否则 政权专夹 → 文化区夹。
 */
export function resolveGeneralPortraitPath(
    dedicatedPath: string | undefined,
    options?: { factionId?: string; region?: RegionType; exclude?: string },
): string {
    if (dedicatedPath?.trim() && portraitAssetExists(dedicatedPath)) {
        return normalizePortraitWebPath(dedicatedPath);
    }
    const cultureRegion = (options?.region
        ?? (options?.factionId ? getFactionCultureRegion(options.factionId) : undefined)
        ?? 'CENTRAL') as RegionType;
    return pickFactionThenCulturePath(options?.factionId, cultureRegion, options?.exclude);
}

/** @deprecated 内部兼容；请用 getFactionPortraitPool + pickFactionThenCulturePath */
function resolvePortraitPool(
    factionId: string | null | undefined,
    region?: RegionType,
): string[] | undefined {
    const factionPool = getFactionPortraitPool(factionId);
    if (factionPool?.length) return factionPool;
    const cultureRegion = region ?? (factionId ? getFactionCultureRegion(factionId) : undefined);
    if (cultureRegion) {
        const pool = REGION_PORTRAIT_POOLS[cultureRegion];
        if (pool?.length) return pool;
    }
    return undefined;
}

/** 从候选池中随机取一张磁盘上存在的立绘 */
function pickRandom(arr: string[], exclude?: string): string {
    if (exclude && arr.length > 1) {
        const filtered = arr.filter(p => !portraitUrlsEqual(p, exclude));
        if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
    }
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExisting(pool: string[], exclude?: string): string | undefined {
    const existing = pool
        .map(normalizePortraitWebPath)
        .filter(p => portraitAssetExists(p));
    if (!existing.length) return undefined;
    return pickRandom(existing, exclude);
}

/** 比较两个立绘路径是否指向同一文件（浏览器 src 可能解析为完整 URL） */
export function portraitUrlsEqual(a: string, b: string): boolean {
    if (a === b) return true;
    const aName = a.split('/').pop() || a;
    const bName = b.split('/').pop() || b;
    return aName === bName;
}

/** 文化区 / 势力立绘池随机一张（无 unit 时的全局缺省） */
export function getRandomRegionPortraitPath(
    region: RegionType = 'CENTRAL',
    options?: { factionId?: string; exclude?: string },
): string {
    return resolvePortraitAssetPath(undefined, {
        factionId: options?.factionId,
        region,
        exclude: options?.exclude,
    });
}

/** 战斗 UI 最终兜底（禁止 img.src 为空） */
export const BATTLE_PORTRAIT_FALLBACK = '/assets/panjun/panjun.png';

export function portraitAssetExists(path: string | undefined): boolean {
    if (!path) return false;
    return KNOWN_PORTRAIT_PATHS.has(normalizePortraitWebPath(path).toLowerCase());
}

/** F2 绑定新立绘后调用：把运行时复制的文件路径注入内存缓存，无需重启 dev server */
export function registerPortraitPathRuntime(path: string): void {
    const normalized = normalizePortraitWebPath(path).toLowerCase();
    if (normalized) KNOWN_PORTRAIT_PATHS.add(normalized);
}

/**
 * 立绘路径 fallback：
 * 有 requested 且文件在盘 → 直接用；否则 政权专夹 → 文化区夹 → 全局兜底。
 */
export function resolvePortraitAssetPath(
    requested: string | undefined,
    options?: {
        factionId?: string;
        region?: string;
        role?: CultureCombatRole;
        exclude?: string;
    },
): string {
    const { factionId, region, exclude } = options ?? {};

    if (requested?.trim() && portraitAssetExists(requested)) {
        return normalizePortraitWebPath(requested);
    }

    const cultureRegion = (region as RegionType | undefined)
        ?? (factionId ? getFactionCultureRegion(factionId) : undefined)
        ?? 'CENTRAL';
    return pickFactionThenCulturePath(factionId, cultureRegion, exclude);
}

/**
 * 为势力军队随机选取一张立绘。
 * 在 Army 创建时调用一次（存入 portraitPath），之后固定不变。
 */
export function getRandomFactionPortrait(
    factionId: string,
    region?: RegionType,
): string | undefined {
    const cultureRegion = region ?? getFactionCultureRegion(factionId) ?? 'CENTRAL';
    return pickFactionThenCulturePath(factionId, cultureRegion);
}

/** 保证返回可加载路径（军团/城防兜底，禁止空串）：政权专夹 → 文化区夹 */
export function ensureFactionPortraitPath(
    factionId: string,
    options?: { exclude?: string; region?: RegionType },
): string {
    const region = options?.region ?? getFactionCultureRegion(factionId) ?? 'CENTRAL';
    return pickFactionThenCulturePath(factionId, region, options?.exclude);
}

/** 按参战单位选立绘：有固定 portraitPath 则先校验；否则 政权 → 文化（文化区取据点/出兵地） */
export function getCombatPortraitPath(unit: IBattleUnit, excludePath?: string): string {
    const region = resolveUnitCultureRegion(unit);
    const resolveOpts = { factionId: unit.factionId, region, exclude: excludePath };

    if (unit.portraitPath?.trim() && !(excludePath && portraitUrlsEqual(unit.portraitPath, excludePath))) {
        return resolvePortraitAssetPath(unit.portraitPath, resolveOpts);
    }
    return pickFactionThenCulturePath(unit.factionId, region, excludePath);
}
