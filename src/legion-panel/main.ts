/**
 * 军团编辑面板 —— 🔴 [2026-09-15 主人定]
 *
 * > 「军团方阵那一页就是势力归属；我要的是军团编辑」「没必要再搞一个页面」
 *
 * 挂在「军团方阵」页里的全屏面板（不另开页）。**只干一件事**：改军团自己的编制。
 *   · 直接列出全部三层军团，点一支就改它的三排兵种 + 阵型，不用先去找势力
 *   · 保存走 `/api/save-legion-composition`：**只写这一支军团那一条记录**
 *   · 删除走 `/api/delete-legion`：一级 16 母体与二级 62 文明禁止删，只能删三级
 *   · **绝不碰势力归属**（`FactionCompositions.ts` 一个字都不动）
 */
import { FACTIONS } from '../data/factions';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { planFallbackForDeletedLegion, applyFallbackPlan, isBaseFallbackLegion } from '../systems/LegionFallbackOnDelete';
import {
    CULTURE_LEGION_NAMES,
    getLegionCompositionByName,
    patchLegionComposition,
    dropLegionFromMemory,
    renameLegionInMemory,
    resolveRenamedLegion,
    type FormationMode,
} from '../types/CultureFormations';
import { LEVEL_2_CIV_62_LEGIONS } from '../data/level2Civ62Legions';
import { LEVEL_3_LEGIONS } from '../data/level3CustomLegions';
import { SCRIPT_LEGIONS, SCRIPT_LEGION_MAP } from '../data/scriptLegions';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { CITIES_V2 } from '../data/cities_v2';
import { getCityRegion, type RegionType } from '../systems/RegionSystem';
import { WAR_TYPES } from '../data/WarTypes';
import {
    DE_UNITS_CATALOG, CATEGORY_LABEL, SUBCATEGORY_LABEL,
    getUnitSubcategory, getUnitTier, observeThumbs, drawUnitThumb,
    attachUnitThumbZoom, hideThumbZoom,
} from '../legion-editor/main';
import { getNavalShipChineseName } from '../types/NavalShipTiers';

const BASE_16_LEGION_NAMES: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};

/** 七阵型的前/中/后人数（总和一律 9） */
const MODE_ROWS: Record<FormationMode, [number, number, number]> = {
    square: [3, 3, 3],
    echelon: [4, 3, 2],
    fish_scale: [3, 4, 2],
    crane_wing: [2, 4, 3],
    triangle: [2, 3, 4],
    crescent: [3, 2, 4],
    balance_yoke: [4, 2, 3],
};
const MODE_LABEL: Record<FormationMode, string> = {
    square: '方阵 3+3+3', echelon: '雁行 4+3+2', fish_scale: '鱼鳞 3+4+2',
    crane_wing: '鹤翼 2+4+3', triangle: '锥形 2+3+4', crescent: '偃月 3+2+4',
    balance_yoke: '衡轭 4+2+3',
};

type Layer = '一级' | '二级' | '三级' | '四级';
interface LegionRow {
    name: string;
    layer: Layer;
    mode: FormationMode;
    slots: { type: string; count: number }[];
    users: number;
    shipId: string;
    /** 隶属的建筑风格文化（62+4之一） */
    buildingStyle?: string;
    /** 四级剧本军团的主队（第 10 队）英雄兵模（前三层为空） */
    commanderUnit: string;
    /** 四级剧本军团的史料出处（前三层为空） */
    source: string;
}

const STYLE_LABELS: Record<string, string> = {
    JAPAN: '日本', CENTRAL: '中原', WEI: '河朔', JIANGNAN: '江南', BASHU: '巴蜀', KHITAN: '河西', NORTHEAST: '白山黑水', MONGOL: '漠北蒙古', KOREA: '高丽',
    GERMANIC: '条顿', FRANKS: '法兰克', BURGUNDIANS: '勃艮第', BRITONS: '不列颠', CELTS: '凯尔特', VIKINGS: '维京', GOTHS: '哥特', SAXONS: '撒克逊', VARANGIANS: '瓦良格', DANES: '丹麦',
    BYZANTINE: '拜占庭', ARMENIANS: '亚美尼亚', GEORGIANS: '格鲁吉亚',
    POLES: '波兰', BOHEMIANS: '波希米亚', MAGYAR: '马扎尔', SLAVIC: '斯拉夫', LITHUANIANS: '立陶宛', BULGARIANS: '保加利亚',
    LATIN: '意大利', ROMA: '罗马', SICILIANS: '西西里', SPANISH: '西班牙', PORTUGUESE: '葡萄牙',
    ORIE: '萨拉森',
    HUNS: '匈人', CUMAN: '库曼', TURKS: '奥斯曼', CENTRAL_ASIA: '鞑靼',
    INDIA: '达罗毗荼', MUGHAL: '印度斯坦', BENGALIS: '孟加拉', GURJARAS: '瞿折罗',
    PURU: '普鲁',
    KHMER: '高棉', BURMESE: '缅甸', VIETNAMESE: '越南', MALAY: '马来',
    MAYANS: '玛雅', AMERICA: '阿兹特克',
    INCA: '印加', MUISCA: '穆伊斯卡', MAPUCHE: '马普切', TUPI: '图皮',
    BERBER: '柏柏尔', AFRICA: '马里', ETHIOPIANS: '埃塞俄比亚',
    SASANIAN: '波斯', PERSIAN: '阿契美尼德',
    ATHENIANS: '雅典', SPARTANS: '斯巴达', MACEDONIAN: '马其顿',
    THRACIAN: '色雷斯',
    TIBET: '青藏', WESTERN: '西域', XIANBEI: '漠南鲜卑', GREECE: '希腊',
};

const cn = (id: string) => (WAR_TYPES as Record<string, { name?: string }>)[id]?.name ?? id;
const cityMap = new Map(CITIES_V2.map(c => [c.id, c]));

/**
 * 建筑文化（buildingStyle）下拉项 —— 只有两级，标签口径与左表「建筑风格」列一致（STYLE_LABELS）。
 *   ① 文明建筑文化：level2Civ62Legions 里那 62 个文明的建筑文化（实测 2026-10-16：62 条 / 去重 62）
 *   ② 其它建筑文化：不属于上面 62 个的（希腊 / 青藏 / 西域 / 漠南鲜卑 等，实测 4 个）
 *   —— 合计 62 + 4 = 66。**没有「一级 16 母体」这一组**：母体只是素材底座，不是建筑文化。
 * 两个组的数量都是**现算的**，不写死，数据增删后标签自动跟着变。
 */
function styleSelectHtml(current: string): string {
    const civStyles: string[] = [...new Set<string>(LEVEL_2_CIV_62_LEGIONS.map(l => l.buildingStyle as string))];
    const civSet = new Set(civStyles);
    const otherStyles = Object.keys(STYLE_LABELS).filter(id => !civSet.has(id));
    const labelOf = (id: string): string => STYLE_LABELS[id] ?? id;
    const group = (label: string, ids: string[]): string => {
        const items = ids
            .filter((id, i) => id && ids.indexOf(id) === i)
            .map(id => `<option value="${esc(id)}" ${id === current ? 'selected' : ''}>${esc(`${labelOf(id)}（${id}）`)}</option>`);
        return items.length ? `<optgroup label="${esc(label)}">${items.join('')}</optgroup>` : '';
    };
    const known = new Set([...civStyles, ...otherStyles]);
    // 兜底：库里出现了没登记进 STYLE_LABELS 的风格时，也要能选中当前值
    const orphan = current && !known.has(current)
        ? `<option value="${esc(current)}" selected>${esc(current)}（未登记）</option>`
        : '';
    return orphan
        + group(`文明建筑文化（${civStyles.length}）`, civStyles)
        + group(`其它建筑文化（${otherStyles.length}）`, otherStyles);
}

function countUsers(): Map<string, number> {
    const m = new Map<string, number>();
    for (const f of FACTIONS) {
        const cap = cityMap.get((STARTING_CAPITALS as Record<string, string>)[f.id]);
        const rg: RegionType = cap
            ? getCityRegion({ latitude: cap.lat, longitude: cap.lng, region: cap.region })
            : ('CENTRAL' as RegionType);
        // 🔴 [2026-10-20 修] 面板里刚改过名的军团，势力表/文化区指针还是**旧名**（要等 HMR），
        //    这里必须同样走 resolveRenamedLegion 换算 —— 否则「使用势力」会把这些家算到旧名头上，
        //    新名那一行显示「无」（主人报「封建时代江淮军团 使用势力：无，这个时期没有武将吗」）。
        const ptr = resolveRenamedLegion(
            ((FACTION_COMPOSITIONS as Record<string, { legionName?: string }>)[f.id]?.legionName ?? '').trim(),
        );
        const name = ptr || resolveRenamedLegion((CULTURE_LEGION_NAMES as Record<string, string>)[rg] ?? '');
        if (name) m.set(name, (m.get(name) ?? 0) + 1);
    }
    return m;
}

function buildRows(): LegionRow[] {
    const users = countUsers();
    const out: LegionRow[] = [];
    const push = (rawName: string, layer: Layer) => {
        // 改名后静态表还是旧名（要等 HMR），这里先换成新名再查编制
        const name = resolveRenamedLegion(rawName);
        // 🔴 [2026-10-02 主人报障「编辑器中为什么显示不全呢」] 四级剧本军团的编制**必须直接读 scriptLegions.ts**：
        //    按名字走 `getLegionCompositionByName` 会撞名 —— 四级「色雷斯军团」与**色雷斯文化区那支同名**，
        //    运行时名字表里被文化区占了，于是这一行显示成 衡轭4+2+3／希腊雇佣重步兵高级/色雷斯标枪手高级/塔兰丁骑兵
        //    ＋希腊旗舰伦博斯重装，而它自己的 雁行4-3-2／色雷斯标枪手/长刃斩手/古典轻骑兵 反而看不见。
        //    实测：getLegionCompositionByName('色雷斯军团') = balance_yoke + ELITE_LEMBOS；
        //          SCRIPT_LEGION_MAP.get('色雷斯军团') = echelon、无船。以脚本表为准。
        const scriptDef = layer === '四级' ? SCRIPT_LEGION_MAP.get(name) : undefined;
        const c = scriptDef ?? getLegionCompositionByName(name);
        if (!c) return;
        // 🔴 [2026-10-20 修] 改名后静态表里还是**旧名**（要等 HMR / 刷新才变），
        //    所以查「建筑文化」必须用 push 传进来的 rawName（静态表原名）兜底 ——
        //    原来只按 name（新名）查，.find() 落空 → buildingStyle 变 ''，
        //    右栏「建筑文化」下拉就跳回第一项（主人报「改军团名字的时候，建筑文化也会改」）。
        const l2 = layer === '二级' ? LEVEL_2_CIV_62_LEGIONS.find(l => l.name === rawName || l.name === name) : undefined;
        const l3 = layer === '三级' ? LEVEL_3_LEGIONS.find(l => l.name === rawName || l.name === name) : undefined;
        const buildingStyle = l2?.buildingStyle ?? l3?.buildingStyle ?? '';
        out.push({
            name, layer, mode: c.formationMode,
            slots: c.slots.map(s => ({ type: s.type, count: s.count })),
            users: users.get(name) ?? 0,
            shipId: c.shipId ?? '',
            buildingStyle,
            commanderUnit: c.commanderUnit ?? l2?.commanderUnit ?? l3?.commanderUnit ?? '',
            source: layer === '四级' ? (SCRIPT_LEGION_MAP.get(name)?.source ?? '') : '',
        });
    };
    for (const n of Object.values(BASE_16_LEGION_NAMES)) push(n, '一级');
    for (const l of LEVEL_2_CIV_62_LEGIONS) push(l.name, '二级');
    for (const l of LEVEL_3_LEGIONS) push(l.name, '三级');
    // 🔴 [2026-10-02 主人令「军团编辑里加四级」] 四级：剧本军团（scriptLegions.ts，只给历史剧本事件用）
    for (const l of SCRIPT_LEGIONS) push(l.name, '四级');
    // 🔴 [2026-09-16] 本次会话里新建的三级军团：静态表要等 HMR 才有它，
    //    先从内存补进列表，新建完立刻能看见、能接着编（与保存编制「不等 HMR」同一套路）。
    for (const n of runtimeCreated) if (!out.some(r => r.name === n)) push(n, '三级');
    return out;
}

/** 本次会话里新建的三级军团名（静态表还没有它们） */
const runtimeCreated = new Set<string>();

let rows: LegionRow[] = [];
let keyword = '';
/** 🔴 [2026-10-02 主人报障「修改了兵种，无法保存」] **同名不同层会撞车**（一级文化军团「色雷斯军团」与四级剧本军团「色雷斯军团」同名），
 *  所以选中项必须**按「名字 + 层」一起认**；只按名字 `rows.find(...)` 会拿到排在前面的一级那条，
 *  于是 ① 右栏显示的是另一支军团的编制 ② 保存被路由到文化区表（写错文件、四级那条没写）。 */
let selectedLayer: Layer | null = null;
/** 当前选中的那一行（认层；没有层信息时退回按名字） */
function currentRow(): LegionRow | undefined {
    if (!selected) return undefined;
    return (selectedLayer ? rows.find((r) => r.name === selected && r.layer === selectedLayer) : undefined)
        ?? rows.find((r) => r.name === selected);
}
/** 🔴 [2026-09-16 主人「加一个势力排序」] 按「用它的势力家数」排：none=表原顺序（一→二→三级）/ desc=多在前 / asc=少在前。
 *  点「势力」表头循环切换。无人套用的军团要找出来，点两下切到 asc 就全在最上面。 */
let sortByUsers: 'none' | 'desc' | 'asc' = 'none';
let sortByStyle: 'none' | 'asc' | 'desc' = 'none';
/** 🔴 [2026-10-16 主人「给军团名添加一个排序」] 按军团名排：none=表原顺序（一→二→三→四级）/ asc=拼音升序 / desc=拼音降序。
 *  点「军团名」表头循环切换；三个排序（军团名 / 建筑风格 / 势力）互斥，切一个就把另外两个复位。 */
let sortByName: 'none' | 'asc' | 'desc' = 'none';
let layerFilter: Layer | '全部' = '全部';
let selected: string | null = null;
/** 当前正在编辑的草稿（未保存） */
let draft: { mode: FormationMode; types: [string, string, string]; tierTypes?: Record<number, string>; shipId: string; commanderUnit: string; source: string } | null = null;

/**
 * 换阵型时兵种跟着 2 / 3 / 4 人档位自动走：
 *   除方阵（3+3+3）外，其余 6 种阵型都是 {2, 3, 4} 的排列。
 *   切换阵型时，原 4 人排的兵种自动移到新阵型的 4 人排、3 人排移到 3 人排、2 人排移到 2 人排。
 *   同时用 tierTypes 记住 2/3/4 档对应的兵种，即便中途切过一次 3+3+3 方阵再切回别的阵型也不丢。
 */
function remapTypesOnModeChange(
    prevMode: FormationMode,
    nextMode: FormationMode,
    types: [string, string, string],
    tierTypes?: Record<number, string>,
): { types: [string, string, string]; tierTypes: Record<number, string> } {
    const map: Record<number, string> = { ...(tierTypes ?? {}) };
    if (prevMode !== 'square') {
        const prevCnt = MODE_ROWS[prevMode];
        map[prevCnt[0]] = types[0];
        map[prevCnt[1]] = types[1];
        map[prevCnt[2]] = types[2];
    }
    if (nextMode !== 'square' && map[2] && map[3] && map[4]) {
        const nextCnt = MODE_ROWS[nextMode];
        return {
            types: [map[nextCnt[0]], map[nextCnt[1]], map[nextCnt[2]]],
            tierTypes: map,
        };
    }
    return { types: [types[0], types[1], types[2]], tierTypes: map };
}
let host: HTMLElement;
/** 🔴 [2026-09-15 主人报障「搜索框打不出汉字」]
 *  这两个搜索框每敲一下就 innerHTML 重建整块，输入框节点被换掉，
 *  中文输入法正在进行的「组合（composition）」当场被打断 —— 拼音上不了屏。
 *  解法：组合期间只记值、不重绘，等 compositionend 再重绘一次。 */
let composing = false;

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 🔴 [2026-10-16 主人令「错误提示显示太短，还没看完就不显示了，请长一点」]
 *  · 错误（bad）：**不自动消失，点一下才关**；普通提示按字数给时间（3.5 秒起、封顶 12 秒）；
 *  · 同屏只留最新一条（旧的先摘掉），免得错误条叠在一起看不清。
 */
let currentToast: HTMLElement | null = null;
function toast(msg: string, bad = false): void {
    currentToast?.remove();
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;left:50%;top:56px;transform:translateX(-50%);z-index:20000;
        background:${bad ? '#5a2020' : '#20502a'};border:1px solid ${bad ? '#a05050' : '#4a9a5a'};
        color:#fff;padding:9px 18px;border-radius:5px;font-size:13px;max-width:70vw;line-height:1.5;
        white-space:pre-wrap;user-select:text;${bad ? 'cursor:pointer;' : ''}`;
    document.body.appendChild(el);
    currentToast = el;
    if (bad) {
        el.title = '点一下关闭';
        el.addEventListener('click', () => el.remove());
        return;                                    // 错误常驻，等主人点
    }
    setTimeout(() => el.remove(), Math.min(12000, Math.max(3500, msg.length * 120)));
}

/** 兵种的子分类中文名（剑盾兵 / 长枪兵 / 弓骑兵…），选择器和摘要都用它 */
function subLabelOf(unitId: string): string {
    const sub = getUnitSubcategory(unitId);
    const u = DE_UNITS_CATALOG.find(x => x.id === unitId);
    const cat = u ? (CATEGORY_LABEL as Record<string, string>)[u.category] ?? '' : '';
    const subCn = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '';
    const tier = u && getUnitTier(u) === 'elite' ? ' · ⭐精锐' : '';
    return [cat, subCn].filter(Boolean).join(' / ') + tier;
}

/**
 * 🔴 [2026-09-18 主人「让舰队和其他前中后三排兵种一样显示」]
 * 军团表里存的 `shipId` 是**大写素材 ID**（如 `ANT_WAR_GALLEY`），
 * 而兵种表 `DE_UNITS_CATALOG` 里的船 id 是**小写**（`ant_war_galley`）——
 * 缩略图（drawUnitThumb）与选择器都走兵种表，所以显示前先转小写。
 * 实测（`node scratch/_check_ship_ids.cjs`）：海军中文名表 44 条 + 三张编制表里实际在用的 23 个 shipId，
 * 全部能落到兵种表的「船只」条目上，无一落空。
 */
function shipUnitId(shipId: string | undefined): string {
    return (shipId ?? '').toLowerCase();
}

/** 战船显示名：取兵种表里的中文名（与选择器弹窗里同名），兵种表查无再退回海军中文名表 / 原样 ID。 */
function shipLabel(shipId: string | undefined): string {
    const uid = shipUnitId(shipId);
    if (!uid) return '—';
    return DE_UNITS_CATALOG.find(u => u.id === uid)?.name ?? getNavalShipChineseName(uid);
}

/** 选兵种：带图 + 按子分类分组的弹窗（2026-09-15 主人「选兵种的时候，要有图，要有子分类」） */
let pickerKeyword = '';
let pickerCat: string = 'all';
/**
 * 🔴 [2026-09-18 主人「让舰队和兵种一样显示」] 战船选择器也走这个弹窗，但**分类记忆要分开**：
 *    战船默认停在「船只」，陆战兵种那套照旧记上次看的大类。
 *    共用一个 pickerCat 的话，选完船再点前排，弹窗会只剩船只、陆战兵种全被滤掉。
 */
let pickerShipCat: string = 'naval';
let pickerKind: 'unit' | 'ship' | 'hero' = 'unit';
let pickerStatusFilter: 'all' | 'applied' | 'unapplied' = 'all';

/**
 * @param onPick 给了就把选中的兵种交给它（新建军团弹窗、舰队选船用），不动 draft、不重绘主列表；
 *               不给就是原行为：写进当前编辑中的 draft 那一排。
 * @param kind   'ship' = 给「舰队（战船）」选船（分类默认停船只、标题写舰队）。
 */
function openUnitPicker(rowIdx: number, onPick?: (unitId: string) => void, pickedNow?: string, kind: 'unit' | 'ship' | 'hero' = 'unit'): void {
    if (!draft && !onPick) return;
    pickerKind = kind;
    pickerStatusFilter = 'all';
    if (kind === 'ship') pickerCat = pickerShipCat;
    else if (kind === 'hero') pickerCat = 'hero';
    // 🔴 高亮「当前这一排是谁」：编辑现有军团时读 draft，新建弹窗没有 draft，读调用方传来的值。
    //    原来这里直写 draft!.types[rowIdx]，新建那条路进来时 draft 是 null → 整个 paint 抛异常，
    //    弹窗开出来是**空白的**（overlay 在、一张卡都没有）。
    const currentType = (): string => (onPick ? (pickedNow ?? '') : (draft?.types[rowIdx] ?? ''));
    hideThumbZoom();
    document.getElementById('lp-picker')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'lp-picker';
    overlay.style.cssText = `position:fixed;inset:0;z-index:16000;background:rgba(0,0,0,.72);
        display:flex;align-items:center;justify-content:center;`;
    overlay.addEventListener('click', e => { if (e.target === overlay) { hideThumbZoom(); overlay.remove(); } });

    const box = document.createElement('div');
    box.style.cssText = `width:min(1100px,92vw);height:min(760px,88vh);background:#141210;
        border:1px solid #3a342c;border-radius:6px;display:flex;flex-direction:column;overflow:hidden;`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    attachUnitThumbZoom(overlay);

    const CATEGORY_ORDER = ['infantry', 'cavalry', 'ranged', 'siege', 'naval', 'hero', 'civilian', 'other'];
    const cats = kind === 'hero' ? ['hero'] : ['all', ...CATEGORY_ORDER.filter(c => DE_UNITS_CATALOG.some(u => u.category === c))];

    // 🔴 保持 DE_UNITS_CATALOG 原始子分类顺序（分类绝对不可乱）
    const SUB_ORDER = (() => {
        const arr: string[] = [];
        for (const u of DE_UNITS_CATALOG) {
            const sub = getUnitSubcategory(u.id);
            const key = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '未分类';
            if (!arr.includes(key)) arr.push(key);
        }
        return arr;
    })();

    // 预计算全部军团的兵种/英雄/战船使用情况（支持识别哪些英雄/兵种已被军团套用）
    const allRows = rows.length ? rows : buildRows();
    const usageMap = new Map<string, string[]>();
    for (const r of allRows) {
        const curDraft = (draft && r.name === selected) ? draft : null;
        if (kind === 'hero') {
            const cmdr = curDraft ? curDraft.commanderUnit : r.commanderUnit;
            if (cmdr) {
                if (!usageMap.has(cmdr)) usageMap.set(cmdr, []);
                if (!usageMap.get(cmdr)!.includes(r.name)) usageMap.get(cmdr)!.push(r.name);
            }
            const types = curDraft ? curDraft.types : r.slots.map(s => s.type);
            for (const t of types) {
                if (t) {
                    if (!usageMap.has(t)) usageMap.set(t, []);
                    if (!usageMap.get(t)!.includes(r.name)) usageMap.get(t)!.push(r.name);
                }
            }
        } else if (kind === 'ship') {
            const ship = curDraft ? curDraft.shipId : r.shipId;
            if (ship) {
                const sid = shipUnitId(ship);
                for (const k of [sid, ship, ship.toUpperCase()]) {
                    if (!usageMap.has(k)) usageMap.set(k, []);
                    if (!usageMap.get(k)!.includes(r.name)) usageMap.get(k)!.push(r.name);
                }
            }
        } else {
            const types = curDraft ? curDraft.types : r.slots.map(s => s.type);
            for (const t of types) {
                if (t) {
                    if (!usageMap.has(t)) usageMap.set(t, []);
                    if (!usageMap.get(t)!.includes(r.name)) usageMap.get(t)!.push(r.name);
                }
            }
            const cmdr = curDraft ? curDraft.commanderUnit : r.commanderUnit;
            if (cmdr) {
                if (!usageMap.has(cmdr)) usageMap.set(cmdr, []);
                if (!usageMap.get(cmdr)!.includes(r.name)) usageMap.get(cmdr)!.push(r.name);
            }
        }
    }

    const paint = (): void => {
        hideThumbZoom();
        const kw = pickerKeyword.trim();
        const kwLower = kw.toLowerCase();

        // 当前大类/类型下的全体候选兵种
        const candidateUnits = DE_UNITS_CATALOG.filter(u => {
            if (kind === 'hero') {
                if (u.category !== 'hero') return false;
                const sub = getUnitSubcategory(u.id);
                if (sub === 'naval_hero' || sub === 'noncombat_hero') return false;
                if (['scythian_scout', 'norse_chieftain', 'sosso_guard', 'master_of_the_templar', 'sunda_royal_fighter'].includes(u.id)) return false;
            }
            if (pickerCat !== 'all' && u.category !== pickerCat) return false;
            return true;
        });
        const appliedTotal = candidateUnits.filter(u => (usageMap.get(u.id)?.length ?? 0) > 0).length;
        const unappliedTotal = candidateUnits.length - appliedTotal;

        // 🔴 保持分类顺序：不要在最外层全局按名字排序，否则会把冷兵器等搞到最前面
        const list = candidateUnits.filter(u => {
            const used = usageMap.get(u.id) ?? [];
            const isApplied = used.length > 0;
            if (pickerStatusFilter === 'applied' && !isApplied) return false;
            if (pickerStatusFilter === 'unapplied' && isApplied) return false;

            if (!kw) return true;
            if (u.name.includes(kw) || u.id.toLowerCase().includes(kwLower) || subLabelOf(u.id).includes(kw)) return true;
            if (isApplied && (kw === '已套用' || kw === '已用' || kwLower === 'applied')) return true;
            if (!isApplied && (kw === '未套用' || kw === '闲置' || kw === '空闲' || kwLower === 'unapplied')) return true;
            if (used.some(leg => leg.includes(kw))) return true;
            return false;
        });
        // 按子分类分组
        const groups = new Map<string, typeof list>();
        for (const u of list) {
            const sub = getUnitSubcategory(u.id);
            const key = sub ? (SUBCATEGORY_LABEL as Record<string, string>)[sub] ?? sub : '未分类';
            if (!groups.has(key)) groups.set(key, [] as unknown as typeof list);
            groups.get(key)!.push(u);
        }
        // 🔴 兵种按名称排序：仅在每个子分类组内按中文拼音排序
        for (const us of groups.values()) {
            us.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.id.localeCompare(b.id));
        }
        // 🔴 分类顺序严格按系统原始分类顺序排列（刀盾、双手、长矛...）
        const sortedGroups = [...groups.entries()].sort(
            ([a], [b]) => (SUB_ORDER.indexOf(a) === -1 ? 999 : SUB_ORDER.indexOf(a)) - (SUB_ORDER.indexOf(b) === -1 ? 999 : SUB_ORDER.indexOf(b))
        );
        box.innerHTML = `
          <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <b style="color:#f6e05e;">选兵种 · ${kind === 'hero' ? '英雄（主队）' : (['前排', '中坚', '后排'][rowIdx] ?? '舰队')}</b>
            <input id="lp-pk-search" placeholder="搜兵种 / 子分类 / 军团名 / ID" value="${esc(pickerKeyword)}"
              style="width:200px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
            ${cats.map(c => {
              const icon = c === 'infantry' ? '🛡️ ' : c === 'cavalry' ? '🐎 ' : c === 'ranged' ? '🏹 ' : c === 'siege' ? '⚙️ ' : c === 'naval' ? '🚢 ' : c === 'hero' ? '👑 ' : c === 'civilian' ? '🧺 ' : c === 'other' ? '🐾 ' : '';
              const label = c === 'all' ? '全部' : `${icon}${(CATEGORY_LABEL as Record<string, string>)[c] ?? c}`;
              return `<button data-cat="${c}" class="lp-pk-cat" style="background:${pickerCat === c ? '#5a3c28' : '#243246'};
                border:1px solid ${pickerCat === c ? '#8a6038' : '#4a5568'};color:#e8e0d0;border-radius:4px;padding:5px 9px;cursor:pointer;font-size:12px;">
                ${esc(label)}</button>`;
            }).join('')}
            <div style="display:inline-flex;gap:3px;align-items:center;">
              <button type="button" data-status="all" class="lp-pk-status-btn" style="background:${pickerStatusFilter === 'all' ? '#4a3e2c' : '#1e1c18'};border:1px solid ${pickerStatusFilter === 'all' ? '#c8a84b' : '#363024'};color:${pickerStatusFilter === 'all' ? '#f5e6c8' : '#8a8378'};border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;">全部 (${candidateUnits.length})</button>
              <button type="button" data-status="applied" class="lp-pk-status-btn" style="background:${pickerStatusFilter === 'applied' ? '#183620' : '#1e1c18'};border:1px solid ${pickerStatusFilter === 'applied' ? '#38a169' : '#363024'};color:${pickerStatusFilter === 'applied' ? '#7ee787' : '#8a8378'};border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;">✓ 已套用 (${appliedTotal})</button>
              <button type="button" data-status="unapplied" class="lp-pk-status-btn" style="background:${pickerStatusFilter === 'unapplied' ? '#352417' : '#1e1c18'};border:1px solid ${pickerStatusFilter === 'unapplied' ? '#c05621' : '#363024'};color:${pickerStatusFilter === 'unapplied' ? '#fbd38d' : '#8a8378'};border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;">⚪ 未套用 (${unappliedTotal})</button>
            </div>
            <span style="color:#8a8378;font-size:12px;">显示 ${list.length} 个</span>
            <button id="lp-pk-close" style="margin-left:auto;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;padding:5px 12px;cursor:pointer;">✕</button>
          </div>
          <div id="lp-pk-body" style="flex:1;overflow:auto;padding:12px 14px;">
            ${sortedGroups.map(([sub, us]) => `
              <div style="color:#c8a84b;font-size:12px;margin:10px 0 6px;border-bottom:1px solid #2a2520;padding-bottom:4px;">
                ${esc(sub)} <span style="color:#6a6358;">${us.length}</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px;">
                ${us.map(u => {
                  const isCur = u.id === currentType();
                  const used = usageMap.get(u.id) ?? [];
                  const isApplied = used.length > 0;
                  const borderCol = isCur ? '#c8a84b' : (isApplied ? '#2d5a38' : '#363024');
                  const bgCol = isCur ? '#3a2f1e' : (isApplied ? '#162218' : '#201d18');
                  const roleTxt = kind === 'hero' ? '作为主将' : '作为编制';
                  const usedTooltip = isApplied
                      ? `【${u.name}】${roleTxt}已套用于 ${used.length} 支军团：\n` + used.map((l, i) => `  ${i + 1}. ${l}`).join('\n')
                      : `【${u.name}】当前未在任何军团中套用（闲置）`;
                  return `
                  <div class="lp-pk-card" data-uid="${esc(u.id)}" title="${esc(usedTooltip)}" style="display:flex;gap:8px;align-items:center;
                       background:${bgCol};
                       border:1px solid ${borderCol};
                       border-radius:4px;padding:6px 8px;cursor:pointer;position:relative;">
                    <canvas class="le-unit-thumb" data-uid="${esc(u.id)}" width="48" height="48"
                      style="width:48px;height:48px;flex:0 0 48px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
                    <div style="min-width:0;flex:1;">
                      <div style="color:#e8e0d0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(u.name)}">${esc(u.name)}</div>
                      <div style="color:#8a8378;font-size:10px;margin-top:1px;">${esc(subLabelOf(u.id))}</div>
                      ${isApplied ? `
                        <div style="font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(usedTooltip)}">
                          <span style="display:inline-block;padding:0 4px;border-radius:2px;background:#183620;border:1px solid #2d6639;color:#7ee787;font-weight:bold;font-size:9px;">✓ 已套用${used.length > 1 ? ` (${used.length})` : ''}</span>
                          <span style="color:#9ae6b4;font-size:10px;margin-left:2px;">${esc(used[0])}</span>
                        </div>
                      ` : `
                        <div style="font-size:10px;margin-top:3px;">
                          <span style="display:inline-block;padding:0 4px;border-radius:2px;background:#1d1b17;border:1px solid #332d24;color:#7a7266;font-size:9px;">⚪ 未套用（闲置）</span>
                        </div>
                      `}
                    </div>
                  </div>`;
                }).join('')}
              </div>`).join('')}
          </div>`;

        observeThumbs(box);
        const pkSearch = document.getElementById('lp-pk-search') as HTMLInputElement | null;
        const repaintSearch = (v: string): void => {
            pickerKeyword = v;
            paint();
            const s = document.getElementById('lp-pk-search') as HTMLInputElement;
            s.focus(); s.setSelectionRange(s.value.length, s.value.length);
        };
        pkSearch?.addEventListener('compositionstart', () => { composing = true; });
        pkSearch?.addEventListener('compositionend', e => {
            composing = false;
            repaintSearch((e.target as HTMLInputElement).value);
        });
        pkSearch?.addEventListener('input', e => {
            const v = (e.target as HTMLInputElement).value;
            pickerKeyword = v;
            if (composing) return;             // 同上：组合期间不重绘
            repaintSearch(v);
        });
        box.querySelectorAll('.lp-pk-cat').forEach(b => b.addEventListener('click', () => {
            pickerCat = (b as HTMLElement).dataset.cat!;
            if (pickerKind === 'ship') pickerShipCat = pickerCat;
            paint();
        }));
        box.querySelectorAll('.lp-pk-status-btn').forEach(b => b.addEventListener('click', () => {
            pickerStatusFilter = (b as HTMLElement).dataset.status as 'all' | 'applied' | 'unapplied';
            paint();
        }));
        document.getElementById('lp-pk-close')?.addEventListener('click', () => { hideThumbZoom(); overlay.remove(); });
        box.querySelectorAll('.lp-pk-card').forEach(c => c.addEventListener('click', () => {
            const uid = (c as HTMLElement).dataset.uid!;
            hideThumbZoom();
            overlay.remove();
            if (onPick) { onPick(uid); return; }
            if (draft) {
                draft.types[rowIdx] = uid;
                if (draft.mode !== 'square') {
                    draft.tierTypes = { ...(draft.tierTypes ?? {}), [MODE_ROWS[draft.mode][rowIdx]]: uid };
                }
            }
            render();
        }));
    };
    paint();
}

function visible(): LegionRow[] {
    const kw = keyword.trim();
    const out = rows.filter(r => {
        if (layerFilter !== '全部' && r.layer !== layerFilter) return false;
        if (!kw) return true;
        return r.name.includes(kw)
            || r.slots.some(s => cn(s.type).includes(kw))
            // 🔴 [2026-10-19 主人报「军团编辑搜索，找不到英雄人名」] 主将队英雄兵模也要能搜到（二级/三级主将读自军团表）
            || (r.commanderUnit ? (cn(r.commanderUnit).includes(kw) || r.commanderUnit.includes(kw)) : false)
            || (r.buildingStyle && (r.buildingStyle.includes(kw) || (STYLE_LABELS[r.buildingStyle] ?? '').includes(kw)));
    });
    if (sortByName !== 'none') {
        // 军团名排序：拼音（zh-Hans-CN）升/降序。跨层级一起排——「城堡时代…」「帝国时代…」这些时代前缀
        // 拼音相邻，同一时代的军团自然排在一起；同名不同层（如一级「色雷斯军团」与四级同名那支）
        // 保持表原顺序（一→二→三→四级），不来回跳。
        const dir = sortByName === 'asc' ? 1 : -1;
        out.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') * dir
            || rows.indexOf(a) - rows.indexOf(b));
    } else if (sortByUsers !== 'none') {
        const dir = sortByUsers === 'desc' ? -1 : 1;
        // 家数相同的保持原来的层级顺序，别让同数的军团每次重绘都换位置
        out.sort((a, b) => (a.users - b.users) * dir || rows.indexOf(a) - rows.indexOf(b));
    } else if (sortByStyle !== 'none') {
        const dir = sortByStyle === 'asc' ? 1 : -1;
        out.sort((a, b) => {
            const sA = a.buildingStyle ? (STYLE_LABELS[a.buildingStyle] ?? a.buildingStyle) : '';
            const sB = b.buildingStyle ? (STYLE_LABELS[b.buildingStyle] ?? b.buildingStyle) : '';
            if (!sA && !sB) return rows.indexOf(a) - rows.indexOf(b);
            if (!sA) return 1;
            if (!sB) return -1;
            return (sA.localeCompare(sB, 'zh-Hans-CN') || (a.buildingStyle ?? '').localeCompare(b.buildingStyle ?? '')) * dir
                || rows.indexOf(a) - rows.indexOf(b);
        });
    }
    return out;
}

function formatLegionInfoText(r: LegionRow, useDraft = false): string {
    const d = (useDraft && draft && r.name === selected && r.layer === selectedLayer) ? draft : null;
    const rMode = d ? d.mode : r.mode;
    const rCnt = MODE_ROWS[rMode] ?? [0, 0, 0];
    const rTypes: (string | undefined)[] = d
        ? [d.types[0], d.types[1], d.types[2]]
        : [r.slots[0]?.type, r.slots[1]?.type, r.slots[2]?.type];
    const rShip = d ? d.shipId : r.shipId;
    const rCmdr = d ? d.commanderUnit : r.commanderUnit;
    const rSource = d ? d.source : r.source;
    const styleText = r.buildingStyle
        ? `${STYLE_LABELS[r.buildingStyle] ?? r.buildingStyle}（${r.buildingStyle}）`
        : '—';
    const rowLabels = ['前排', '中坚', '后排'];
    const lines = [
        `军团：${r.name}（${r.layer}）`,
        `建筑风格：${styleText}`,
        `阵型：${MODE_LABEL[rMode] ?? rMode}`,
        `英雄（主队 · 第 10 队）：${rCmdr ? cn(rCmdr) : '—'}`,
        ...[0, 1, 2].map(i => {
            const t = rTypes[i];
            const c = d ? (rCnt[i] ?? 0) : (r.slots[i]?.count ?? 0);
            return `${rowLabels[i]}：${cn(t ?? '—')} ×${c}`;
        }),
        `舰队：${shipLabel(rShip)}`,
        `使用势力：${r.users ? `${r.users} 家` : '无'}`,
        ...(r.layer === '四级' && rSource ? [`史料出处：${rSource}`] : []),
    ];
    return lines.join('\n');
}

async function copyLegionInfo(r: LegionRow, useDraft = false): Promise<void> {
    const text = formatLegionInfoText(r, useDraft);
    try {
        await navigator.clipboard.writeText(text);
        toast(`📋 已复制【${r.name}】的军团信息`);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:50%;top:20%;transform:translateX(-50%);z-index:20000;width:min(560px,90vw);height:220px;';
        document.body.appendChild(ta);
        ta.select();
        toast('⚠️ 剪贴板不可用，已选中文本，按 Ctrl+C 复制；点空白处关闭', true);
        const close = (): void => { ta.remove(); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 300);
    }
}

function render(): void {
    hideThumbZoom();
    const list = visible();
    const sel = selected ? currentRow() : null;
    if (sel && !draft) {
        draft = { mode: sel.mode, types: [sel.slots[0]?.type ?? '', sel.slots[1]?.type ?? '', sel.slots[2]?.type ?? ''], shipId: sel.shipId ?? '', commanderUnit: sel.commanderUnit ?? '', source: sel.source ?? '' };
    }
    const counts = { 一级: 0, 二级: 0, 三级: 0, 四级: 0 } as Record<Layer, number>;
    for (const r of rows) counts[r.layer]++;
    const rowCnt = draft ? MODE_ROWS[draft.mode] : [0, 0, 0];
    const dirty = !!(sel && draft && (draft.mode !== sel.mode
        || draft.types.join(',') !== sel.slots.map(s => s.type).join(',')
        || (draft.shipId ?? '') !== (sel.shipId ?? '')
        || (draft.commanderUnit ?? '') !== (sel.commanderUnit ?? '')
        || (draft.source ?? '') !== (sel.source ?? '')));

    // 🔴 [2026-09-15] 整表是 innerHTML 重建的，点一支军团就换新节点，
    //     不记住滚动位置的话列表会弹回顶部，往下拉着编根本编不下去。
    const keepScroll = document.getElementById('lp-list')?.scrollTop ?? 0;

    host.innerHTML = `
    <div style="padding:10px 14px;border-bottom:1px solid #2a2520;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <input id="lp-search" placeholder="搜军团名 / 兵种 / 建筑风格" value="${esc(keyword)}"
        style="width:230px;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
      <select id="lp-layer" style="background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:6px 9px;">
        ${(['全部', '一级', '二级', '三级', '四级'] as const).map(l =>
            `<option value="${l}" ${layerFilter === l ? 'selected' : ''}>${l}${l === '全部' ? `（${rows.length} 支）` : `（${counts[l as Layer]} 支）`}</option>`).join('')}
      </select>
      <span style="color:#8a8378;font-size:12px;">列出 ${list.length} 支</span>
      <button id="lp-new" style="margin-left:auto;padding:6px 14px;background:#2a4a2a;border:1px solid #4a7a4a;
        color:#d0e8d0;border-radius:4px;font-size:13px;cursor:pointer;">➕ 新建军团</button>
    </div>

    <div style="flex:1;display:flex;min-height:0;">
      <div id="lp-list" style="flex:1;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="position:sticky;top:0;background:#1a1714;">
            <tr style="color:#b8ab8e;text-align:left;">
              <th style="padding:7px 10px;">层级</th>
              <th id="lp-sort-name" title="点击按军团名排序（拼音升序 / 降序 / 原顺序）"
                  style="padding:7px 10px;cursor:pointer;user-select:none;${sortByName !== 'none' ? 'color:#f6e05e;' : ''}">
                军团名${sortByName === 'asc' ? ' ▲' : sortByName === 'desc' ? ' ▼' : ' ⇅'}</th>
              <th id="lp-sort-style" title="点击按建筑风格排序（升序 / 降序 / 原顺序）"
                  style="padding:7px 10px;cursor:pointer;user-select:none;${sortByStyle !== 'none' ? 'color:#f6e05e;' : ''}">
                建筑风格${sortByStyle === 'asc' ? ' ▲' : sortByStyle === 'desc' ? ' ▼' : ' ⇅'}</th>
              <th style="padding:7px 10px;">阵型</th>
              <th style="padding:7px 10px;">英雄（主队 · 第 10 队）</th>
              <th style="padding:7px 10px;">前排</th>
              <th style="padding:7px 10px;">中坚</th>
              <th style="padding:7px 10px;">后排</th>
              <th style="padding:7px 10px;">舰队</th>
              <th id="lp-sort-users" title="点击按势力家数排序（多在前 / 少在前 / 原顺序）"
                  style="padding:7px 10px;cursor:pointer;user-select:none;${sortByUsers !== 'none' ? 'color:#f6e05e;' : ''}">
                势力${sortByUsers === 'desc' ? ' ▼' : sortByUsers === 'asc' ? ' ▲' : ' ⇅'}</th>
              <th style="padding:7px 10px;width:54px;">复制</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(r => {
                /* 🔴 [2026-09-18 主人报障「编辑军团后，信息有的不实时更新」]
                 * 左表原先只读 `r`（已保存的记录），而阵型/兵种/战船改动都写在 `draft` 里，
                 * 于是右侧面板的三排人数当场从 4+2+3 变成 3+3+3，左表那一行却还挂着旧的
                 * 「衡轭 4+2+3 ×4 ×2 ×3」—— 同一屏两个数，主人看到的就是这个。
                 * 现在：**正在编辑的那一行改读 draft**，其余行照旧读已保存值。
                 * 人数与右侧同源，都由 MODE_ROWS[mode] 得出，不会再各算各的。 */
                const d = (draft && r.name === selected) ? draft : null;
                const rMode = d ? d.mode : r.mode;
                const rCnt = MODE_ROWS[rMode] ?? [0, 0, 0];
                const rTypes: (string | undefined)[] = d
                    ? [d.types[0], d.types[1], d.types[2]]
                    : [r.slots[0]?.type, r.slots[1]?.type, r.slots[2]?.type];
                const rShip = d ? d.shipId : r.shipId;
                return `
              <tr data-name="${esc(r.name)}" data-layer="${r.layer}" style="cursor:pointer;border-top:1px solid #221e19;${selected === r.name && selectedLayer === r.layer ? 'background:#2f2a20;' : ''}">
                <td style="padding:6px 10px;color:${r.layer === '一级' ? '#8fc4f0' : r.layer === '二级' ? '#f0c86a' : r.layer === '三级' ? '#c0a0e0' : '#8fd0a0'};">${r.layer}</td>
                <td style="padding:6px 10px;color:#e8e0d0;">${esc(r.name)}</td>
                <td style="padding:6px 10px;color:#cbb98e;">${r.buildingStyle ? `<span style="background:#221e16;padding:2px 6px;border-radius:3px;border:1px solid #4a3e2c;">${esc(STYLE_LABELS[r.buildingStyle] ?? r.buildingStyle)} <span style="color:#8a8378;font-size:11px;">(${esc(r.buildingStyle)})</span></span>` : '<span style="color:#5a544c;">—</span>'}</td>
                <td style="padding:6px 10px;color:#a89f8f;">${MODE_LABEL[rMode] ?? rMode}</td>
                ${/* 🔴 [2026-10-02 主人报障「显示不全」] 五兵 = 英雄队＋前＋中＋后＋舰队 —— 英雄（主队·第 10 队）这一兵原先只在右侧详情里，
                     * 列表里根本没有这一列，四级剧本军团的五兵看起来只有四兵。现补上这一列（读 commanderUnit，与右侧同源）。 */''}
                <td style="padding:4px 10px;color:#d8c898;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${(d ? d.commanderUnit : r.commanderUnit) ? `<canvas class="le-unit-thumb" data-uid="${esc(String(d ? d.commanderUnit : r.commanderUnit))}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                    <span>${esc((d ? d.commanderUnit : r.commanderUnit) ? cn(String(d ? d.commanderUnit : r.commanderUnit)) : '—')}</span>
                  </div></td>
                ${[0, 1, 2].map(i => {
                    const t = rTypes[i];
                    const c = d ? (rCnt[i] ?? 0) : (r.slots[i]?.count ?? 0);
                    return `<td style="padding:4px 10px;color:#d8c898;">
                      <div style="display:flex;align-items:center;gap:6px;">
                        ${t ? `<canvas class="le-unit-thumb" data-uid="${esc(t)}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                        <span>${esc(cn(t ?? '—'))}<span style="color:#6a6358;"> ×${c}</span></span>
                      </div></td>`;
                }).join('')}
                <td style="padding:4px 10px;color:#d8c898;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${rShip ? `<canvas class="le-unit-thumb" data-uid="${esc(shipUnitId(rShip))}" width="36" height="36" style="width:36px;height:36px;background:#141210;border-radius:3px;image-rendering:pixelated;flex:0 0 36px;"></canvas>` : ''}
                    <span>${esc(shipLabel(rShip))}</span>
                  </div></td>
                <td style="padding:6px 10px;color:${r.users ? '#8a8378' : '#e07a7a'};">${r.users || '无'}</td>
                <td style="padding:4px 10px;">
                  <button type="button" class="lp-copy-row" data-name="${esc(r.name)}" data-layer="${r.layer}" title="复制【${esc(r.name)}】的军团信息"
                    style="padding:3px 8px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:12px;cursor:pointer;white-space:nowrap;">📋 复制</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="width:420px;border-left:1px solid #2a2520;overflow:auto;padding:14px;">
        ${sel && draft ? `
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div>
              <div style="font-size:16px;color:#f6e05e;">${esc(sel.name)}</div>
              <div style="font-size:12px;color:#8a8378;margin:4px 0 14px;">
                ${sel.layer}军团 · ${sel.users ? `${sel.users} 家势力在用` : '当前无势力使用'}
              </div>
            </div>
            <button id="lp-copy-sel" type="button" title="复制【${esc(sel.name)}】的军团信息"
              style="flex:0 0 auto;padding:5px 11px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;font-size:12px;cursor:pointer;white-space:nowrap;">📋 一键复制</button>
          </div>

          ${sel.layer === '二级' || sel.layer === '三级' ? `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">建筑文化 <span style="color:#6a6358;font-size:11px;">（决定该军团跟哪套建筑 / 皮肤风格绑定）</span></div>
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <select id="lp-style" style="flex:1;min-width:0;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;">
                ${styleSelectHtml(sel.buildingStyle ?? '')}
              </select>
              <button id="lp-style-go" title="写入 ${sel.layer}军团表"
                style="flex:0 0 auto;padding:7px 12px;background:#22303f;border:1px solid #48607a;color:#cfe0f0;border-radius:4px;font-size:13px;cursor:pointer;white-space:nowrap;">💾 保存文化</button>
            </div>` : `
            <div style="font-size:11px;color:#6a6358;margin-bottom:14px;line-height:1.7;">
              建筑文化：${sel.buildingStyle ? `<b style="color:#e8d8b0;">${esc(STYLE_LABELS[sel.buildingStyle] ?? sel.buildingStyle)}</b>（${esc(sel.buildingStyle)}）` : '—'}
              ${sel.layer === '一级' ? '　·　一级母体军团不设建筑文化（风格由母体素材决定），不可改。' : '　·　四级剧本军团没有建筑文化字段。'}
            </div>`}

          ${sel.layer === '一级' || sel.layer === '四级' ? `
            <div style="font-size:11px;color:#6a6358;margin-bottom:14px;line-height:1.7;">
              ${sel.layer === '四级' ? '四级剧本军团名被战场事件引用，不可改名。' : '一级 16 母体是底座军团，不可改名。'}
            </div>` : `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">军团名</div>
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <input id="lp-rename" value="${esc(sel.name)}" maxlength="24"
                style="flex:1;min-width:0;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;">
              <button id="lp-rename-go" style="flex:0 0 auto;padding:7px 12px;background:#2a2520;border:1px solid #5a5040;color:#e0d8c0;border-radius:4px;font-size:13px;cursor:pointer;white-space:nowrap;">✏️ 改名</button>
            </div>`}

          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">阵型</div>
          <select id="lp-mode" style="width:100%;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;margin-bottom:14px;">
            ${(Object.keys(MODE_ROWS) as FormationMode[]).map(m =>
                `<option value="${m}" ${draft!.mode === m ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}
          </select>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#a89f8f;margin-bottom:5px;">
            <span>英雄（主队 · 第 10 队）</span>
            ${draft!.commanderUnit ? `<button id="lp-commander-clear" type="button" style="background:none;border:none;color:#c87a7a;font-size:11px;cursor:pointer;padding:0;">✕ 清空</button>` : ''}
          </div>
          <div id="lp-commander-card" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
               background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
            <canvas id="lp-thumb-commander" class="le-unit-thumb" ${draft!.commanderUnit ? `data-uid="${esc(draft!.commanderUnit)}"` : ''} width="64" height="64"
              style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
            <div style="flex:1;min-width:0;">
              <div style="color:#e8e0d0;font-size:13px;">${draft!.commanderUnit ? esc(cn(draft!.commanderUnit)) : '未选主队兵模'}</div>
              <div style="color:#6a6358;font-size:11px;">
                ${draft!.commanderUnit ? esc(subLabelOf(draft!.commanderUnit)) + ' · 点击更换' : '点击选择英雄兵模'}
              </div>
            </div>
            <span style="color:#8a8378;font-size:16px;">▾</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;color:#6a6358;">💡 换阵型自动跟随 2/3/4 人档位；也可点按钮直接对调：</span>
            <div style="display:flex;gap:4px;">
              <button type="button" class="lp-swap" data-a="0" data-b="1" title="前排 ↔ 中坚 兵种对调"
                style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 前↔中</button>
              <button type="button" class="lp-swap" data-a="1" data-b="2" title="中坚 ↔ 后排 兵种对调"
                style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 中↔后</button>
              <button type="button" class="lp-swap" data-a="0" data-b="2" title="前排 ↔ 后排 兵种对调"
                style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 前↔后</button>
            </div>
          </div>

          ${['前排尖刀', '中坚突击', '后排底边'].map((label, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#a89f8f;margin-bottom:5px;">
              <span>${label} · <b style="color:#f6e05e;">${rowCnt[i]} 人</b></span>
              ${i < 2 ? `<button type="button" class="lp-swap" data-a="${i}" data-b="${i + 1}" style="padding:1px 6px;background:#1e2631;border:1px solid #3a4a5e;color:#9cb4cc;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 与${i === 0 ? '中坚' : '后排'}对调</button>` : ''}
            </div>
            <div class="lp-unit" data-row="${i}" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
                 background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
              <canvas id="lp-thumb-${i}" class="le-unit-thumb" ${draft!.types[i] ? `data-uid="${esc(draft!.types[i])}"` : ''} width="64" height="64"
                style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
              <div style="flex:1;min-width:0;">
                <div style="color:#e8e0d0;font-size:13px;">${esc(cn(draft!.types[i]))}</div>
                <div style="color:#6a6358;font-size:11px;">
                  ${esc(subLabelOf(draft!.types[i]))} · 点击更换
                </div>
              </div>
              <span style="color:#8a8378;font-size:16px;">▾</span>
            </div>`).join('')}

          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">舰队（战船）</div>
          <div id="lp-ship-card" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
               background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
            <canvas id="lp-thumb-ship" class="le-unit-thumb" ${draft!.shipId ? `data-uid="${esc(shipUnitId(draft!.shipId))}"` : ''} width="64" height="64"
              style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
            <div style="flex:1;min-width:0;">
              <div style="color:#e8e0d0;font-size:13px;">${esc(shipLabel(draft!.shipId))}</div>
              <div style="color:#6a6358;font-size:11px;">
                ${esc(subLabelOf(shipUnitId(draft!.shipId)))} · 点击更换
              </div>
            </div>
            <span style="color:#8a8378;font-size:16px;">▾</span>
          </div>

          ${sel.layer === '四级' ? `
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">史料出处（必填）</div>
          <textarea id="lp-source" rows="6" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:7px 9px;margin-bottom:14px;font-size:12px;line-height:1.5;resize:vertical;">${esc(draft!.source ?? '')}</textarea>
          ` : ''}

          <button id="lp-save" style="width:100%;padding:10px;background:${dirty ? '#5a3c28' : '#2a2520'};border:1px solid ${dirty ? '#8a6038' : '#3a342c'};color:#fff;border-radius:4px;font-size:14px;cursor:pointer;">
            💾 保存军团编制${dirty ? '（有改动未保存）' : ''}
          </button>
          <button id="lp-reset" style="width:100%;padding:7px;margin-top:8px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;font-size:12px;cursor:pointer;">
            ↺ 放弃改动
          </button>
          ${sel.layer === '三级' ? `
            <button id="lp-delete" style="width:100%;padding:7px;margin-top:18px;background:#3a1a1a;border:1px solid #7a3a3a;color:#e0a0a0;border-radius:4px;font-size:12px;cursor:pointer;">
              🗑 删除这支军团${sel.users ? `（${sel.users} 家势力会回落到文化区军团）` : ''}
            </button>` : `
            <div style="font-size:11px;color:#6a6358;margin-top:18px;line-height:1.7;">
              ${sel.layer === '四级' ? '四级剧本军团不可删除（被战场事件引用）。' : `${sel.layer}军团不可删除（一级 16 母体是底座，二级 62 文明是定数）。`}
            </div>`}
          <div style="font-size:11px;color:#6a6358;margin-top:14px;line-height:1.7;">
            保存只写这一支军团那一条记录，<b>不碰势力归属</b>。<br>
            用它的势力会自动跟着变，不需要同步。
          </div>
        ` : '<div style="color:#6a6358;font-size:13px;padding-top:40px;text-align:center;">左边点一支军团</div>'}
      </div>
    </div>`;

    const listBox = document.getElementById('lp-list');
    if (listBox && keepScroll > 0) listBox.scrollTop = keepScroll;

    const search = document.getElementById('lp-search') as HTMLInputElement | null;
    search?.addEventListener('compositionstart', () => { composing = true; });
    search?.addEventListener('compositionend', e => {
        composing = false;
        keyword = (e.target as HTMLInputElement).value;
        render();
        const s = document.getElementById('lp-search') as HTMLInputElement;
        s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    });
    search?.addEventListener('input', e => {
        keyword = (e.target as HTMLInputElement).value;
        if (composing) return;                 // 拼音还在组合中，绝不能重建输入框
        render();
        const s = document.getElementById('lp-search') as HTMLInputElement;
        s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    });
    document.getElementById('lp-layer')?.addEventListener('change', e => {
        layerFilter = (e.target as HTMLSelectElement).value as Layer | '全部';
        render();
    });
    document.getElementById('lp-new')?.addEventListener('click', () => { openCreateDialog(); });
    document.getElementById('lp-sort-name')?.addEventListener('click', () => {
        sortByName = sortByName === 'none' ? 'asc' : sortByName === 'asc' ? 'desc' : 'none';
        sortByUsers = 'none';
        sortByStyle = 'none';
        render();
    });
    document.getElementById('lp-sort-users')?.addEventListener('click', () => {
        sortByUsers = sortByUsers === 'none' ? 'desc' : sortByUsers === 'desc' ? 'asc' : 'none';
        sortByStyle = 'none';
        sortByName = 'none';
        render();
    });
    document.getElementById('lp-sort-style')?.addEventListener('click', () => {
        sortByStyle = sortByStyle === 'none' ? 'asc' : sortByStyle === 'asc' ? 'desc' : 'none';
        sortByUsers = 'none';
        sortByName = 'none';
        render();
    });
    host.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => {
            selected = (tr as HTMLElement).dataset.name!;
            selectedLayer = ((tr as HTMLElement).dataset.layer as Layer) ?? null;
            draft = null;
            render();
        });
    });
    host.querySelectorAll('.lp-copy-row').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const rName = (btn as HTMLElement).dataset.name!;
            const rLayer = ((btn as HTMLElement).dataset.layer as Layer) ?? null;
            const target = (rLayer ? rows.find(r => r.name === rName && r.layer === rLayer) : undefined)
                ?? rows.find(r => r.name === rName);
            if (target) void copyLegionInfo(target, true);
        });
    });
    document.getElementById('lp-copy-sel')?.addEventListener('click', () => {
        if (sel) void copyLegionInfo(sel, true);
    });
    const renameGo = document.getElementById('lp-rename-go');
    const renameIn = document.getElementById('lp-rename') as HTMLInputElement | null;
    renameGo?.addEventListener('click', () => { void rename(renameIn?.value ?? ''); });
    renameIn?.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') void rename(renameIn.value);
    });

    document.getElementById('lp-mode')?.addEventListener('change', e => {
        if (draft) {
            const nextMode = (e.target as HTMLSelectElement).value as FormationMode;
            const remapped = remapTypesOnModeChange(draft.mode, nextMode, draft.types, draft.tierTypes);
            draft.mode = nextMode;
            draft.types = remapped.types;
            draft.tierTypes = remapped.tierTypes;
        }
        render();
    });
    document.getElementById('lp-commander-clear')?.addEventListener('click', e => {
        e.stopPropagation();
        if (draft) { draft.commanderUnit = ''; render(); }
    });
    document.getElementById('lp-commander-card')?.addEventListener('click', () => {
        if (!draft) return;
        // 主队（第 10 队）选英雄兵模：分类默认停在「英雄」
        openUnitPicker(-1, uid => { draft!.commanderUnit = uid; render(); }, draft!.commanderUnit, 'hero');
    });
    host.querySelectorAll('.lp-swap').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!draft) return;
            const a = Number((btn as HTMLElement).dataset.a);
            const b = Number((btn as HTMLElement).dataset.b);
            const tmp = draft.types[a];
            draft.types[a] = draft.types[b];
            draft.types[b] = tmp;
            if (draft.mode !== 'square') {
                const cnt = MODE_ROWS[draft.mode];
                draft.tierTypes = { [cnt[0]]: draft.types[0], [cnt[1]]: draft.types[1], [cnt[2]]: draft.types[2] };
            }
            render();
        });
    });
    document.getElementById('lp-ship-card')?.addEventListener('click', () => {
        if (!draft) return;
        // 选船走和三排兵种同一个弹窗（带图带子分类）：选中即写 draft.shipId，保存沿用 shipId 那条落盘路径
        openUnitPicker(-1, uid => { draft!.shipId = uid.toUpperCase(); render(); }, shipUnitId(draft.shipId), 'ship');
    });
    document.getElementById('lp-source')?.addEventListener('input', e => {
        if (draft) draft.source = (e.target as HTMLTextAreaElement).value;
    });
    host.querySelectorAll('.lp-unit').forEach(el => {
        el.addEventListener('click', () => {
            openUnitPicker(Number((el as HTMLElement).dataset.row));
        });
    });
    // 兵种图：列表用懒加载（滚进视口才画），右侧三排 + 舰队那张立刻画
    observeThumbs(host);
    if (draft) {
        for (let i = 0; i < 3; i++) {
            const c = document.getElementById('lp-thumb-' + i) as HTMLCanvasElement | null;
            if (c && draft.types[i]) void drawUnitThumb(c, draft.types[i]);
        }
        const shipCv = document.getElementById('lp-thumb-ship') as HTMLCanvasElement | null;
        if (shipCv && draft.shipId) void drawUnitThumb(shipCv, shipUnitId(draft.shipId));
        const cmdrCv = document.getElementById('lp-thumb-commander') as HTMLCanvasElement | null;
        if (cmdrCv && draft.commanderUnit) void drawUnitThumb(cmdrCv, draft.commanderUnit);
    }

    document.getElementById('lp-reset')?.addEventListener('click', () => { draft = null; render(); });
    document.getElementById('lp-save')?.addEventListener('click', () => { void save(); });
    document.getElementById('lp-delete')?.addEventListener('click', () => { void remove(); });
    document.getElementById('lp-style-go')?.addEventListener('click', () => { void saveBuildingStyle(); });
}

/**
 * 保存「建筑文化」——写进这支军团自己那条记录（二级 → level2Civ62Legions.ts，三级 → level3CustomLegions.ts）。
 * 建筑文化是军团的属性，不是编制的属性：改完所有使用它的势力自动跟着变，不需要再同步别处。
 */
async function saveBuildingStyle(): Promise<void> {
    const sel = currentRow();
    const box = document.getElementById('lp-style') as HTMLSelectElement | null;
    if (!sel || !box) return;
    const next = box.value;
    if (!next || next === (sel.buildingStyle ?? '')) {
        toast('建筑文化没有变化');
        return;
    }
    try {
        const res = await fetch('/api/save-legion-building-style', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: sel.name, layer: sel.layer, buildingStyle: next }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        const row = rows.find(r => r.name === sel.name && r.layer === sel.layer);
        if (row) row.buildingStyle = next;
        render();
        toast(`✅ 【${sel.name}】建筑文化 → ${STYLE_LABELS[next] ?? next}（${next}）`);
    } catch (e) {
        toast('❌ 建筑文化保存失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

/**
 * 改名。一个军团名在三处各存一份（军团自身记录 / 势力专属归属 / 文化区默认指针），
 * 服务端 `/api/rename-legion` 三处同改并带条数自检，这里只管交互与本地内存刷新。
 * 🔴 有未保存的编制改动时先拦下来——改名会重新拉表，草稿会丢。
 */
async function rename(raw: string): Promise<void> {
    const oldName = selected;
    const newName = (raw ?? '').trim();
    if (!oldName) return;
    if (!newName || newName === oldName) return;
    const sel = rows.find(r => r.name === oldName);
    if (sel && draft && (draft.mode !== sel.mode
        || draft.types.join(',') !== sel.slots.map(s => s.type).join(','))) {
        toast('⚠️ 先保存或放弃编制改动，再改名', true);
        return;
    }
    if (rows.some(r => r.name === newName)) {
        toast(`❌ 【${newName}】已存在，一个军团名只能有一种编制`, true);
        return;
    }
    try {
        const res = await fetch('/api/rename-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        renameLegionInMemory(oldName, newName);
        selected = newName;
        // 🔴 [2026-10-20 修] 原来写死 '三级'：改的是二级军团时，选中层当场错位，
        //    右栏会拿错行（建筑文化/编制都跟着错）。改成沿用被改名那支军团本来的层。
        selectedLayer = sel?.layer ?? '三级';
        draft = null;
        rows = buildRows();
        render();
        toast(`✏️ 【${oldName}】→【${newName}】　势力归属 ${json.factions} 处 · 文化区指针 ${json.cultures} 处已同改`);
    } catch (e) {
        toast('❌ 改名失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

/**
 * 新建军团 —— 🔴 [2026-09-16 主人定「添加一个功能，新建军团。一律属于三级」]
 *
 * 一级 16 母体与二级 62 文明是定数，只能改不能增，所以新建的**一律落三级表**。
 * 弹窗要填三样：
 *   · 军团名：命名法「时代 + 民族 + 军团」（如「城堡时代宋禁军团」），三层里不许重名
 *   · 归属军团 parentLegion：一级 16 或二级 62 里的一支（三级表这个字段是必填）
 *   · 阵型：七阵型之一，三排人数总和恒为 9
 * 三排兵种先照抄归属军团的，战船 shipId 也跟归属军团走 —— 新建出来就是一支能用的军团，
 * 主人再点进去逐排改。绝不留空位：空兵种在渲染层会掉回默认集。
 */
function openCreateDialog(): void {
    document.getElementById('lp-create')?.remove();
    const parents = rows.filter(r => r.layer === '一级' || r.layer === '二级');
    let parentName = parents[0]?.name ?? '';
    let mode: FormationMode = 'square';
    let name = '';
    /** 三排兵种：默认照抄归属军团，点一下就能换成任意兵种 */
    let types: [string, string, string] = ['', '', ''];
    /** 哪几排是主人自己点过的 —— 换归属军团时只刷没点过的那几排，别把手选的覆盖掉 */
    const touched = [false, false, false];
    /* 🔴 [2026-09-18 主人定「新建军团要添加舰队，和套用的武将」]
     *  · 舰队：原先只能从归属军团继承（createLegion 里写死 parent.shipId），现在可当场挑；
     *    与三排兵种同一个规矩 —— 没手动点过就跟着归属军团走，点过就不再被覆盖。
     *  · 套用的武将：新建完把这支军团指派给选中的势力，走与「保存武将换军团」同一个
     *    接口 /api/save-faction-legion（单条写入，不整表覆盖）。留空 = 先不指派。 */
    let shipId = '';
    let shipTouched = false;
    let commanderUnit = '';
    let commanderTouched = false;
    let tierTypes: Record<number, string> | undefined;
    let assignFactionId = '';

    const syncFromParent = (): void => {
        const p = rows.find(r => r.name === parentName);
        if (p && !touched.some(Boolean)) {
            mode = p.mode;
        }
        for (let i = 0; i < 3; i++) {
            if (touched[i] && types[i]) continue;
            types[i] = p?.slots[i]?.type ?? p?.slots[0]?.type ?? '';
        }
        if (!shipTouched) shipId = p?.shipId ?? '';
        if (!commanderTouched) commanderUnit = p?.commanderUnit ?? '';
    };
    syncFromParent();

    const overlay = document.createElement('div');
    overlay.id = 'lp-create';
    overlay.style.cssText = `position:fixed;inset:0;z-index:16000;background:rgba(0,0,0,.72);
        display:flex;align-items:center;justify-content:center;`;
    overlay.addEventListener('click', e => { if (e.target === overlay) { hideThumbZoom(); overlay.remove(); } });
    const box = document.createElement('div');
    box.style.cssText = `width:min(600px,92vw);max-height:92vh;overflow:auto;background:#141210;
        border:1px solid #3a342c;border-radius:6px;padding:18px;color:#e8e0d0;`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    attachUnitThumbZoom(overlay);

    const paint = (): void => {
        hideThumbZoom();
        const cnt = MODE_ROWS[mode];
        box.innerHTML = `
          <div style="font-size:16px;color:#f6e05e;margin-bottom:4px;">新建军团</div>
          <div style="font-size:11px;color:#6a6358;margin-bottom:14px;line-height:1.7;">
            新建的军团一律是<b>三级</b>（一级 16 母体与二级 62 文明是定数，只能改不能增）。<br>
            命名法：时代 + 民族 + 军团，例「城堡时代宋禁军团」。
          </div>
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">军团名</div>
          <input id="lp-c-name" maxlength="24" placeholder="如：城堡时代宋禁军团" value="${esc(name)}"
            style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">归属军团（一级 16 / 二级 62）</div>
          <select id="lp-c-parent" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
            ${parents.map(p => `<option value="${esc(p.name)}" ${p.name === parentName ? 'selected' : ''}>${p.layer}　${esc(p.name)}</option>`).join('')}
          </select>
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">阵型</div>
          <select id="lp-c-mode" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
            ${(Object.keys(MODE_ROWS) as FormationMode[]).map(m => `<option value="${m}" ${m === mode ? 'selected' : ''}>${MODE_LABEL[m]}</option>`).join('')}
          </select>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#a89f8f;margin-bottom:5px;">
            <span>英雄（主队 · 第 10 队）${commanderTouched ? '' : '　<span style="color:#6a6358;">（照抄归属军团，可点换）</span>'}</span>
            ${commanderUnit ? `<button id="lp-c-commander-clear" type="button" style="background:none;border:none;color:#c87a7a;font-size:11px;cursor:pointer;padding:0;">✕ 清空</button>` : ''}
          </div>
          <div id="lp-c-commander" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
               background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
            <canvas id="lp-c-thumb-commander" class="le-unit-thumb" ${commanderUnit ? `data-uid="${esc(commanderUnit)}"` : ''} width="64" height="64"
              style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
            <div style="flex:1;min-width:0;">
              <div style="color:#e8e0d0;font-size:13px;">${commanderUnit ? esc(cn(commanderUnit)) : '未选主队兵模'}</div>
              <div style="color:#6a6358;font-size:11px;">${commanderUnit ? esc(subLabelOf(commanderUnit)) + ' · 点击更换' : '点击选择英雄兵模'}</div>
            </div>
            <span style="color:#8a8378;font-size:16px;">▾</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;color:#6a6358;">💡 换阵型自动跟随 2/3/4 人档位；也可点按钮直接对调：</span>
            <div style="display:flex;gap:4px;">
              <button type="button" class="lp-c-swap" data-a="0" data-b="1" style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 前↔中</button>
              <button type="button" class="lp-c-swap" data-a="1" data-b="2" style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 中↔后</button>
              <button type="button" class="lp-c-swap" data-a="0" data-b="2" style="padding:2px 7px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:3px;font-size:11px;cursor:pointer;">⇅ 前↔后</button>
            </div>
          </div>
          ${['前排尖刀', '中坚突击', '后排底边'].map((label, i) => `
            <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">${label} · ${cnt[i]} 人${touched[i] ? '' : '　<span style="color:#6a6358;">（照抄归属军团，可点换）</span>'}</div>
            <div class="lp-c-unit" data-row="${i}" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;
                 background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
              <canvas id="lp-c-thumb-${i}" class="le-unit-thumb" ${types[i] ? `data-uid="${esc(types[i])}"` : ''} width="64" height="64"
                style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
              <div style="flex:1;min-width:0;">
                <div style="color:#e8e0d0;font-size:13px;">${esc(cn(types[i]))}</div>
                <div style="color:#6a6358;font-size:11px;">${esc(subLabelOf(types[i]))} · 点击更换</div>
              </div>
              <span style="color:#8a8378;font-size:16px;">▾</span>
            </div>`).join('')}
          <!-- 🔴 [2026-09-18 主人定] 舰队：没手动点过就跟着归属军团 -->
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">舰队 · 战船${shipTouched ? '' : '　<span style="color:#6a6358;">（照抄归属军团，可点换）</span>'}</div>
          <div id="lp-c-ship" style="display:flex;gap:10px;align-items:center;margin-bottom:14px;
               background:#151310;border:1px solid #3a342c;border-radius:4px;padding:7px 9px;cursor:pointer;">
            <canvas id="lp-c-thumb-ship" class="le-unit-thumb" ${shipId ? `data-uid="${esc(shipUnitId(shipId))}"` : ''} width="64" height="64"
              style="width:64px;height:64px;flex:0 0 64px;background:#141210;border-radius:3px;image-rendering:pixelated;"></canvas>
            <div style="flex:1;min-width:0;">
              <div style="color:#e8e0d0;font-size:13px;">${esc(shipLabel(shipId))}</div>
              <div style="color:#6a6358;font-size:11px;">${esc(subLabelOf(shipUnitId(shipId)))} · 点击更换</div>
            </div>
            <span style="color:#8a8378;font-size:16px;">▾</span>
          </div>
          <!-- 🔴 [2026-09-18 主人定] 套用的武将：建好后把这支军团指派给该势力 -->
          <div style="font-size:12px;color:#a89f8f;margin-bottom:5px;">套用的武将 / 势力<span style="color:#6a6358;">（可留空，之后再指派）</span></div>
          <select id="lp-c-assign" style="width:100%;box-sizing:border-box;background:#151310;border:1px solid #3a342c;color:#e8e0d0;border-radius:4px;padding:8px 9px;margin-bottom:14px;">
            <option value="">— 暂不指派 —</option>
            ${FACTIONS.map(f => `<option value="${esc(f.id)}" ${f.id === assignFactionId ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
          </select>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <button id="lp-c-go" style="flex:1;padding:9px;background:#2a4a2a;border:1px solid #4a7a4a;color:#d0e8d0;border-radius:4px;font-size:14px;cursor:pointer;">✅ 建立</button>
            <button id="lp-c-cancel" style="flex:0 0 100px;padding:9px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;border-radius:4px;font-size:13px;cursor:pointer;">取消</button>
          </div>`;
        for (let i = 0; i < 3; i++) {
            const cv = document.getElementById('lp-c-thumb-' + i) as HTMLCanvasElement | null;
            if (cv && types[i]) drawUnitThumb(cv, types[i]);
        }
        const shipCv = document.getElementById('lp-c-thumb-ship') as HTMLCanvasElement | null;
        if (shipCv && shipId) drawUnitThumb(shipCv, shipUnitId(shipId));
        const cmdrCv = document.getElementById('lp-c-thumb-commander') as HTMLCanvasElement | null;
        if (cmdrCv && commanderUnit) drawUnitThumb(cmdrCv, commanderUnit);
        const nameIn = document.getElementById('lp-c-name') as HTMLInputElement;
        nameIn.addEventListener('input', e => { name = (e.target as HTMLInputElement).value; });
        document.getElementById('lp-c-parent')?.addEventListener('change', e => {
            parentName = (e.target as HTMLSelectElement).value;
            syncFromParent();
            paint();
        });
        document.getElementById('lp-c-mode')?.addEventListener('change', e => {
            const nextMode = (e.target as HTMLSelectElement).value as FormationMode;
            const remapped = remapTypesOnModeChange(mode, nextMode, types, tierTypes);
            mode = nextMode;
            types = remapped.types;
            tierTypes = remapped.tierTypes;
            paint();
        });
        document.getElementById('lp-c-commander-clear')?.addEventListener('click', e => {
            e.stopPropagation();
            commanderUnit = '';
            commanderTouched = true;
            paint();
        });
        document.getElementById('lp-c-commander')?.addEventListener('click', () => {
            openUnitPicker(-1, uid => { commanderUnit = uid; commanderTouched = true; paint(); }, commanderUnit, 'hero');
        });
        box.querySelectorAll('.lp-c-swap').forEach(btn => btn.addEventListener('click', () => {
            const a = Number((btn as HTMLElement).dataset.a);
            const b = Number((btn as HTMLElement).dataset.b);
            const tmp = types[a];
            types[a] = types[b];
            types[b] = tmp;
            touched[a] = true;
            touched[b] = true;
            if (mode !== 'square') {
                const c = MODE_ROWS[mode];
                tierTypes = { [c[0]]: types[0], [c[1]]: types[1], [c[2]]: types[2] };
            }
            paint();
        }));
        box.querySelectorAll('.lp-c-unit').forEach(el => el.addEventListener('click', () => {
            const i = Number((el as HTMLElement).dataset.row);
            openUnitPicker(i, uid => {
                types[i] = uid;
                touched[i] = true;
                if (mode !== 'square') tierTypes = { ...(tierTypes ?? {}), [MODE_ROWS[mode][i]]: uid };
                paint();
            }, types[i]);
        }));
        // 🔴 [2026-09-18] 选战船：与右侧面板换船同一个弹窗（kind='ship'），选中即记为手动、不再跟归属军团
        document.getElementById('lp-c-ship')?.addEventListener('click', () => {
            openUnitPicker(-1, uid => { shipId = uid.toUpperCase(); shipTouched = true; paint(); }, shipUnitId(shipId), 'ship');
        });
        document.getElementById('lp-c-assign')?.addEventListener('change', e => {
            assignFactionId = (e.target as HTMLSelectElement).value;
        });
        document.getElementById('lp-c-cancel')?.addEventListener('click', () => { hideThumbZoom(); overlay.remove(); });
        document.getElementById('lp-c-go')?.addEventListener('click', () => {
            void createLegion(name, parentName, mode, types, shipId, commanderUnit, assignFactionId, overlay);
        });
    };
    paint();
    (document.getElementById('lp-c-name') as HTMLInputElement)?.focus();
}

async function createLegion(
    rawName: string,
    parentName: string,
    mode: FormationMode,
    types: [string, string, string],
    /** 🔴 [2026-09-18 主人定] 舰队：弹窗里挑的战船；空字符串 = 跟归属军团 */
    pickedShipId: string,
    pickedCommanderUnit: string,
    /** 🔴 [2026-09-18 主人定] 套用的武将：建好后把本军团指派给该势力；空 = 先不指派 */
    assignFactionId: string,
    overlay: HTMLElement,
): Promise<void> {
    const name = (rawName ?? '').trim();
    if (!name) { toast('❌ 请先填军团名', true); return; }
    if (rows.some(r => r.name === name)) { toast(`❌ 【${name}】已存在，一个军团名只能有一种编制`, true); return; }
    const parent = getLegionCompositionByName(parentName);
    if (!parent) { toast(`❌ 归属军团【${parentName}】查不到编制`, true); return; }
    const cnt = MODE_ROWS[mode];
    // 兵种用弹窗里选好的那三个；人数按阵型走（三排总和恒 9，与选兵种无关）
    const slots = [0, 1, 2].map(i => ({ type: types[i], count: cnt[i] }));
    if (slots.some(sl => !sl.type)) { toast('❌ 三排兵种要选全', true); return; }
    try {
        const res = await fetch('/api/create-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                legionName: name,
                formationMode: mode,
                slots,
                parentLegion: parentName,
                // 🔴 [2026-09-18] 舰队改由弹窗决定；没挑就沿用归属军团的（与改前同义）
                shipId: pickedShipId || (parent.shipId ?? ''),
                commanderUnit: pickedCommanderUnit || null,
            }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        patchLegionComposition(name, slots, mode, pickedShipId || parent.shipId || undefined, pickedCommanderUnit || null);   // 不等 HMR，立刻可见可编
        // 🔴 [2026-09-18 主人定] 套用的武将：单条写入归属，与「保存武将换军团」同一个接口，绝不整表覆盖
        let assignedName = '';
        if (assignFactionId) {
            const fa = FACTIONS.find(f => f.id === assignFactionId);
            const ar = await fetch('/api/save-faction-legion', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ factionId: assignFactionId, legionName: name }),
            });
            const aj = await ar.json().catch(() => ({}));
            if (ar.ok && aj.ok) {
                (FACTION_COMPOSITIONS as Record<string, { legionName?: string }>)[assignFactionId] = {
                    ...((FACTION_COMPOSITIONS as Record<string, { legionName?: string }>)[assignFactionId] ?? {}),
                    legionName: name,
                };   // 内存同步，势力数当场就对
                assignedName = fa?.name ?? assignFactionId;
            } else {
                toast(`⚠️ 军团已建，但指派给【${fa?.name ?? assignFactionId}】失败：${aj.error ?? ar.status}`, true);
            }
        }
        runtimeCreated.add(name);
        hideThumbZoom();
        overlay.remove();
        selected = name;
        selectedLayer = '三级';
        draft = null;
        rows = buildRows();
        render();
        /* 🔴 [2026-09-18 主人报障「新建的军团不在第一页显示」]
         * buildRows 的顺序是 一级(16) → 二级(62) → 三级 → runtimeCreated（本次新建的追加在**最末尾**），
         * 所以刚建好的军团排在 198 支的最后一个，第一屏根本看不到 —— 它确实被 selected 高亮了，
         * 但列表不会自己滚过去，看上去就像「没建出来」。
         * 这里把它滚进视口，不动排序（排序由数据结构决定，刷新后它会归到三级那一组里）。 */
        requestAnimationFrame(() => {
            const tr = document.querySelector(`tr[data-name="${CSS.escape(name)}"]`);
            tr?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
        toast(`✅ 已新建三级军团【${name}】（归属 ${parentName}）：${slots.map(sl => cn(sl.type) + '×' + sl.count).join('　')}`
            + `　🚢 ${shipLabel(pickedShipId || parent.shipId || '')}`
            + (assignedName ? `　👤 已套用给【${assignedName}】` : ''));
    } catch (e) {
        toast('❌ 新建失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

/** 保存一支四级剧本军团（scriptLegions.ts）：三排 + 阵型 + 战船 + 史料出处。 */
async function saveScriptLegion(): Promise<void> {
    if (!selected || !draft) return;
    if (!draft.source.trim()) { toast('❌ 四级剧本军团必须写史料出处', true); return; }
    const counts = MODE_ROWS[draft.mode];
    const slots = draft.types.map((type, i) => ({ type, count: counts[i] }));
    try {
        const res = await fetch('/api/save-script-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: selected, formationMode: draft.mode, slots, shipId: draft.shipId || null, commanderUnit: draft.commanderUnit || null, source: draft.source }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        const scrDef = SCRIPT_LEGION_MAP.get(selected);
        if (scrDef) {
            scrDef.formationMode = draft.mode;
            scrDef.slots = slots.map(s => ({ ...s }));
            scrDef.shipId = draft.shipId || undefined;
            scrDef.commanderUnit = draft.commanderUnit || undefined;
            scrDef.source = draft.source;
        }
        patchLegionComposition(selected, slots, draft.mode, draft.shipId || undefined, draft.commanderUnit || null);
        rows = buildRows();
        draft = null;
        render();
        toast(`✅ 剧本军团【${selected}】已保存（写入 scriptLegions.ts）`);
    } catch (e) {
        toast('❌ 保存失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

async function save(): Promise<void> {
    if (!selected || !draft) return;
    // 🔴 [2026-10-02] 四级剧本军团走 scriptLegions.ts（含史料出处），单独保存
    if (currentRow()?.layer === '四级') {
        await saveScriptLegion();
        return;
    }
    const counts = MODE_ROWS[draft.mode];
    const slots = draft.types.map((type, i) => ({ type, count: counts[i] }));
    const prevShip = currentRow()?.shipId ?? '';
    const shipChanged = (draft.shipId ?? '') !== prevShip;
    try {
        const res = await fetch('/api/save-legion-composition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: selected, formationMode: draft.mode, slots, commanderUnit: draft.commanderUnit || null }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        patchLegionComposition(selected, slots, draft.mode, draft.shipId || undefined, draft.commanderUnit || null);
        if (shipChanged && draft.shipId) {
            const shipRes = await fetch('/api/save-legion-ship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legionName: selected, shipId: draft.shipId }),
            });
            const shipJson = await shipRes.json();
            if (!shipRes.ok || !shipJson.ok) throw new Error(shipJson.error ?? `HTTP ${shipRes.status}`);
        }
        rows = buildRows();
        draft = null;
        render();
        toast(`✅ 【${selected}】编制已保存（写入 ${json.file}）`);
    } catch (e) {
        toast('❌ 保存失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

async function remove(): Promise<void> {
    if (!selected) return;
    const name = selected;
    // 🔴 [2026-09-16 主人定 / 2026-10-16 主人收紧口径「只套二级，跟一级没关系」]
    //    删除前先把「谁要重套、各自套哪支」算出来给主人看：
    //    看武将时代 + 据点建筑风格 → 套「该风格 × 该时代」那支二级军团；套不上就跳过。
    //    规则见 src/systems/LegionFallbackOnDelete.ts 文件头。
    const plan = planFallbackForDeletedLegion(name);
    const affected = plan.items.length + plan.skipped.length;
    const lines = plan.items.slice(0, 8).map((i) => '  · ' + i.note).join('\n');
    const more = plan.items.length > 8 ? '\n  …另有 ' + (plan.items.length - 8) + ' 家' : '';
    const skipTip = plan.skipped.length
        ? '\n套不上的 ' + plan.skipped.length + ' 家将跟随文化区：\n  · '
            + plan.skipped.slice(0, 5).map((s) => s.factionId + '（' + s.reason + '）').join('\n  · ')
        : '';
    // 🔴 [2026-10-16 主人定] 二级全部 257 支是武将保底军团，不可删除
    if (isBaseFallbackLegion(name)) {
        window.alert('【' + name + '】是二级军团，不可删除 —— 66 种建筑风格 × 4 时代的武将靠它套军团。');
        return;
    }
    if (!window.confirm(
        '确定删除军团【' + name + '】？\n\n用它的 ' + affected + ' 家势力将重新套二级军团'
        + '（武将时代 × 据点建筑风格）：\n' + lines + more + skipTip,
    )) return;
    try {
        const res = await fetch('/api/delete-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName: name }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        const applied = await applyFallbackPlan(plan);
        // 套不上的：清空条目让它跟随文化区
        for (const sk of plan.skipped) {
            await fetch('/api/save-faction-legion', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ factionId: sk.factionId, legionName: null }),
            });
        }
        dropLegionFromMemory(name);
        selected = null;
    selectedLayer = null;
        draft = null;
        rows = buildRows();
        render();
        toast(
            `🗑 已删除军团【${name}】：${applied.ok} 家已套二级`
            + (applied.failed.length ? `，${applied.failed.length} 家写入失败` : '')
            + (plan.skipped.length ? `，${plan.skipped.length} 家套不上已跟随文化区` : ''),
            applied.failed.length > 0,
        );
        if (applied.failed.length) console.error('[DeleteLegion] 写入失败：', applied.failed);
    } catch (e) {
        toast('❌ 删除失败：' + ((e as Error)?.message ?? String(e)), true);
    }
}

let hostThumbZoomBound = false;
/** 把「军团编辑」挂进军团方阵页的主区（与其它视图页签并排，不另开页、不做浮层） */
export function mountLegionPanel(container: HTMLElement): void {
    host = container;
    if (!hostThumbZoomBound) {
        hostThumbZoomBound = true;
        attachUnitThumbZoom(container);
    }
    rows = buildRows();
    render();
}
