/**
 * 势力六级分档规则（运行时 + 导出 JSON 共用）
 *
 * 1 仅 TIER1_REGIME 单字正式国号（秦汉唐，非姓氏）
 * 2 民族  3 二字国号（含西秦）  4/5 家族州郡  6 起义
 * ⚠ 苻=姓→5级；family/county 审计优先于 regime（防姓氏误升 1 级）
 * ⚠ TIER1 单字国号（秦汉唐…）锁定：禁止写入 family/county/ethnic；运行时须 1 级
 */
import ethnicHomelandAudit from '../../scratch/ethnic_homeland_audit.json' with { type: 'json' };
import regimeCapitalAudit from '../../scratch/regime_capital_audit.json' with { type: 'json' };
import familyStateAudit from '../../scratch/family_state_audit.json' with { type: 'json' };
import countySeatAudit from '../../scratch/county_seat_audit.json' with { type: 'json' };

export type FactionTier = 1 | 2 | 3 | 4 | 5 | 6;

export const FACTION_FLAG_TEMPLATE_BY_TIER: Readonly<Record<FactionTier, number>> = {
    1: 7,
    2: 43,
    3: 14,
    4: 46,
    5: 9,
    6: 8,
};

const TIER6_UPRISING = new Set([
    'wazhai', 'red_turban', 'xushouhui', 'haoding', 'yang_aner', 'chimei',
    'dashun', 'daxi_ming', 'hongguang', 'longwu', 'yongli', 'baibo',
    'bailian', 'liwang', 'taiping', 'zhangshicheng',
    'dengmaoqi', 'linshihong', 'yezongliu',
    'fangla', 'liutong_yangqing',
    'qianhui',
    'miao_qing', 'miaomin',
    'tuoming', 'qiufu',
    'tongma',
    'chendiaoyan', 'zhongxiang'
]);

const TIER2_ETHNIC_SEED = new Set([
    'xiongnu', 'xianbei', 'tuoba', 'qidan', 'jurchen', 'menggu_d', 'houjin',
    'tujue', 'tiele', 'huige', 'rouran', 'chile', 'qiang', 'di', 'jie',
    'yuezhi', 'sogdian', 'donghu', 'sushen', 'wuzhumuqin', 'mohe', 'quanrong',
    'huimo', 'ashikaga', 'xiyu',
]);

const TIER1_REGIME = new Set([
    'han_d', 'shu', 'wu', 'wei', 'qin', 'chu', 'tang', 'song', 'ming_d',
    'yuan_d', 'manzhou_d', 'dajin', 'jin', 'shang', 'xia', 'liao_d', 'sui',
    'nanzhao', 'dali', 'goryeo', 'joseon', 'bohai', 'baiji', 'xinluo',
    'gaogouli', 'yamato', 'dayue', 'tubo', 'dangxiang', 'siam', 'chenla',
    'zhou', 'yan', 'qi', 'han', 'zhao', 'wu_yue', 'yue',
]);

/** 大政权种子（含单字 1 级 + 二字 3 级）；单字者锁定见 tier:check */
export const TIER1_REGIME_SEED = TIER1_REGIME;

type AuditEntry = {
    id?: string;
    factionId?: string;
    cityName?: string;
    jun?: string;
    type?: string;
};

function auditEntries(raw: { entries?: AuditEntry[] } | AuditEntry[]): AuditEntry[] {
    return Array.isArray(raw) ? raw : (raw.entries ?? []);
}

function toAuditMap(raw: { entries?: AuditEntry[] } | AuditEntry[]): Map<string, AuditEntry> {
    return new Map(
        auditEntries(raw).map((e) => {
            const id = e.factionId ?? e.id;
            return [id!, e];
        }),
    );
}

const ethnicAudit = toAuditMap(ethnicHomelandAudit);
const regimeAudit = toAuditMap(regimeCapitalAudit);
const familyAudit = toAuditMap(familyStateAudit);
const countyAudit = toAuditMap(countySeatAudit);

const ALL_ETHNIC = new Set(TIER2_ETHNIC_SEED);
for (const id of ethnicAudit.keys()) ALL_ETHNIC.add(id);

export function flagCharLen(flag: string): number {
    return [...flag].length;
}

function isRegime(id: string): boolean {
    return TIER1_REGIME.has(id) || regimeAudit.has(id);
}

/** 1 级：仅大政权种子表单字国号；regime 审计里 1 字姓/氏不算 */
function isTier1Regime(id: string, len: number): boolean {
    return len === 1 && TIER1_REGIME.has(id);
}

export type FactionTierResult = {
    tier: FactionTier;
    category: string;
    note: string;
    flagLen: number;
};

/** 按 factionId + 旗号汉字（SandboxDisplayNames）计算级别 */
export function classifyFactionTier(factionId: string, flag: string): FactionTierResult {
    const len = flagCharLen(flag);
    let tier: FactionTier = 5;
    let category = '家族州郡(一字)';
    let note = '';

    if (TIER6_UPRISING.has(factionId)) {
        tier = 6;
        category = '起义';
    } else if (ALL_ETHNIC.has(factionId)) {
        tier = 2;
        category = '民族';
        note = ethnicAudit.get(factionId)?.cityName ?? '';
    } else if (familyAudit.has(factionId)) {
        tier = len === 1 ? 5 : 4;
        category = len === 1 ? '家族(一字)' : '家族(二字)';
        const fam = familyAudit.get(factionId)!;
        note = fam.cityName ?? fam.type ?? '';
    } else if (countyAudit.has(factionId)) {
        tier = len === 1 ? 5 : 4;
        category = len === 1 ? '州郡(一字)' : '州郡(二字)';
        note = countyAudit.get(factionId)?.jun ?? '';
    } else if (isRegime(factionId)) {
        if (isTier1Regime(factionId, len)) {
            tier = 1;
            category = '政权(一字·正式国号)';
        } else {
            tier = 3;
            category = len === 1 ? '政权(一字·非1级)' : '政权(二字)';
        }
        note = regimeAudit.get(factionId)?.cityName ?? '';
    } else {
        tier = len === 1 ? 5 : 4;
        category = len === 1 ? '家族州郡(一字)' : '家族州郡(二字)';
        note = '无审计，按旗号字数默认';
    }

    return { tier, category, note, flagLen: len };
}
