/**
 * 🔴 [2026-11-03 主人定] 一字旗号规则 —— 所有模式（乱斗 / 剧本 / 百岁）同一口径。
 *
 * 主人原话：
 *   「把势力XX族的旗号改为前一个字，例如傣族，旗号一个字傣」
 *   「XX州，XX国，XX族的这种，反是可以用一个字就代表势力的才可以用一字旗号」
 *   「还有XX氏，XX家等等」「所有模式的势力都一样的呀」
 *   「我觉得西方尽量不要用单字，用符号更好。」
 *
 * 口径：旗上要画的名字是「一个字＋通称」（州/国/族/氏/家/部/人/朝）两字时，下面三条都满足才缩成那一个字：
 *   ① 不是西方势力（西方＝欧洲/西亚/北非/非洲/美洲的据点文化，见 WESTERN_STYLES）——西方用符号旗，没纹章的写两字；
 *   ② 那一个字单独就能代表这个势力（不能代表的登记在 NO_ONE_CHAR，例：土家→「土」看不出是谁）；
 *   ③ 那一个字没被别的势力当一字旗号用（撞了就照旧两字，例：匈人≠匈牙利的「匈」）。
 * 不满足就照旧取前两字。同一家可共用一字的（源氏＝源），直接在 SANDBOX_DISPLAY_NAMES 写一字，不走这里。
 */
import { SANDBOX_DISPLAY_NAMES } from './SandboxDisplayNames';
import { CITIES_V2 } from './cities_v2';

/** 可去掉的通称结尾 */
const ONE_CHAR_SUFFIXES = new Set(['州', '国', '族', '氏', '家', '部', '人', '朝']);

/** ② 单字代表不了势力的两字名（照旧写两字） */
const NO_ONE_CHAR = new Set(['土家', '五部', '南部', '南朝', '萨朝', '中国', '附国', '濊族']);

/**
 * 3 字以上势力名中允许保留单字旗号的中国/东亚历史国号、姓氏军号与专属单字简称。
 * 供 FactionTier（旗形模板判定）与 CityAssetManager（3字以上转符号判定）共用同一真源。
 */
export const HISTORICAL_SINGLE_CHAR_FLAGS: ReadonlySet<string> = new Set([
    '夏', '商', '周', '秦', '汉', '魏', '蜀', '吴', '晋', '隋', '唐', '宋',
    '齐', '梁', '陈', '辽', '金', '元', '明', '清', '燕', '赵', '韩', '楚', '凉', '越',
    '鲁', '巴', '滇', '成', '代',
    '倭', '卫', '董', '奚', '播',
]);

/** ① 西方据点文化：欧洲、西亚、北非、撒哈拉以南非洲、美洲 */
const WESTERN_STYLES = new Set([
    'ORIE', 'PERSIAN', 'SASANIAN', 'TURKS', 'ARMENIANS', 'GEORGIANS',
    'SLAVIC', 'GERMANIC', 'FRANKS', 'GREECE', 'ATHENIANS', 'SPARTANS', 'MACEDONIAN', 'THRACIAN',
    'SPANISH', 'PORTUGUESE', 'LATIN', 'ROMA', 'BYZANTINE', 'SICILIANS', 'BRITONS', 'CELTS',
    'POLES', 'LITHUANIANS', 'BOHEMIANS', 'MAGYAR', 'BULGARIANS', 'CUMAN', 'BURGUNDIANS',
    'VIKINGS', 'DANES', 'VARANGIANS', 'SAXONS', 'GOTHS', 'HUNS',
    'BERBER', 'ETHIOPIANS', 'AFRICA',
    'INCA', 'MAYANS', 'MUISCA', 'MAPUCHE', 'TUPI', 'AMERICA',
]);

/** 势力 → 首座据点的建筑文化（没传据点文化时用） */
let factionStyle: Map<string, string> | null = null;
function styleOfFaction(factionId: string): string | undefined {
    if (!factionStyle) {
        factionStyle = new Map();
        for (const city of CITIES_V2) {
            if (city.buildingStyle && !factionStyle.has(city.factionId)) factionStyle.set(city.factionId, city.buildingStyle);
        }
    }
    return factionStyle.get(factionId);
}

/** ③ 一字旗号 → 用它的势力 */
let oneCharOwners: Map<string, string[]> | null = null;
function oneCharTakenByOther(ch: string, factionId: string): boolean {
    if (!oneCharOwners) {
        oneCharOwners = new Map();
        for (const [id, text] of Object.entries(SANDBOX_DISPLAY_NAMES)) {
            if (Array.from(text).length !== 1) continue;
            const owners = oneCharOwners.get(text) ?? [];
            owners.push(id);
            oneCharOwners.set(text, owners);
        }
    }
    return (oneCharOwners.get(ch) ?? []).some((id) => id !== factionId);
}

/** 旗上实际写的字：1–2 字（AGENTS.md：旗面 1–2 汉字），「一个字＋通称」按上面三条决定要不要缩成一字 */
export function toFlagText(text: string, factionId: string, buildingStyle?: string): string {
    const chars = Array.from(text);
    if (chars.length === 2 && ONE_CHAR_SUFFIXES.has(chars[1]) && !NO_ONE_CHAR.has(text)) {
        const style = buildingStyle ?? styleOfFaction(factionId);
        if (!(style && WESTERN_STYLES.has(style)) && !oneCharTakenByOther(chars[0], factionId)) return chars[0];
    }
    return chars.slice(0, 2).join('');
}
