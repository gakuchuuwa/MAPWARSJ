/**
 * SituationalSelfCheck.ts — [DEV ONLY] 三势选技 + 战略技 实机自检
 *
 * 按 V 键触发（仅开发模式；生产构建因动态 import 在 import.meta.env.DEV 分支内而被 Rollup 剔除）。
 * 对一批代表名将，调用引擎【真实】的 resolveSituationalSkillId（同一套开局选技逻辑），
 * 屏幕显示「优/均/劣三局各选中的战术技 + 战略技」，一眼验证：
 *   ① 三局选不同技（慢直播播报不重复的根） ② 武将技钉在对应局 ③ 战略技符合历史×远征生效改动。
 * 纯只读（只喂 {generalId} 读 profile），不构造战斗、不碰核心战斗类 → 零风险。
 */
import { getGeneralProfile, getTacticalSkillDef, getStrategicSkillDef } from '../data/GeneralSkills';
import { resolveSituationalSkillId } from '../combat/GeneralSkillCombat';

// 代表名将（覆盖各系改动：战斗str_03 / 补给 / 行军 / 爆兵保留 / 刚改的战略技 / 补齐的三技 / condition改always）
const REPS: Array<[string, string]> = [
    ['xin_baiqi', '白起'],            // 战斗str_03·招牌歼锐无遗
    ['xichu_xiangyu', '项羽'],        // 战斗str_03·破釜沉舟(劣势招牌)
    ['xianyu_hanxin', '韩信'],        // 补给·背水一战
    ['suzhou_huoqubing', '霍去病'],   // 行军·封狼居胥
    ['yanchuan_d_yuefei', '岳飞'],    // 战斗str_04·痛饮黄龙/散阵遏骑/空寨掩击
    ['sima_d_simayi', '司马懿'],      // 爆兵足食足兵(保留·熬国力)
    ['huizhou_zhugeliang', '诸葛亮'], // 改→补给以战养战(北伐为粮所困)
    ['jiaodong_tiandan', '田单'],     // 改→补给以战养战(即墨守城)
    ['zu_d_yuanchonghuan', '袁崇焕'], // 改→补给+战术ts_675改always
    ['bing_liji', '李勣'],            // 改→战斗str_03(灭高句丽)
    ['zhengzhou_chenqingzhi', '陈庆之'], // 改→行军长驱深入(白袍北伐)
    ['wu_sunwu', '孙武'],             // 补齐3技(全出孙子兵法)
];

const STRAT_SYS: Record<string, string> = {
    str_01: '行军', str_10: '行军', str_11: '行军', str_12: '行军',
    str_13: '补给', str_07: '补给', str_06: '补给',
    str_14: '爆兵', str_15: '爆兵',
    str_03: '战斗', str_04: '战斗', str_09: '战斗',
    str_02: '奇策',
    str_05: '据点防', str_08: '据点防',
};

function tacName(unit: { generalId: string }, sit: 'advantage' | 'balance' | 'disadvantage', isAttacker: boolean): string {
    const id = resolveSituationalSkillId(unit as any, sit, isAttacker);
    if (!id) return '—(回退招牌)';
    return getTacticalSkillDef(id)?.displayName ?? id;
}

export function toggleSituationalSelfCheck(): void {
    const existing = document.getElementById('dev-situational-selfcheck');
    if (existing) { existing.remove(); return; }

    const rowsHtml = REPS.map(([gid, name]) => {
        const p = getGeneralProfile(gid);
        if (!p) return `<tr><td>${name}</td><td colspan="8" style="color:#e88">无档案(gid=${gid})</td></tr>`;
        const u = { generalId: gid };
        const atkAdv = tacName(u, 'advantage', true);
        const atkBal = tacName(u, 'balance', true);
        const atkDis = tacName(u, 'disadvantage', true);
        const defAdv = tacName(u, 'advantage', false);
        const defBal = tacName(u, 'balance', false);
        const defDis = tacName(u, 'disadvantage', false);
        const sig = getTacticalSkillDef(p.tacticalSkillId)?.displayName ?? p.tacticalSkillId;
        const strat = p.strategicSkillId
            ? `${getStrategicSkillDef(p.strategicSkillId)?.displayName ?? p.strategicSkillId}(${STRAT_SYS[p.strategicSkillId] ?? '?'})`
            : '—';
        // 招牌应落在某一局；若三局都没包含招牌=丢失(标红)
        const sigOk = [
            p.atkAdvantageSkillId, p.atkBalanceSkillId, p.atkDisadvantageSkillId,
            p.defAdvantageSkillId, p.defBalanceSkillId, p.defDisadvantageSkillId,
            p.advantageSkillId, p.balanceSkillId, p.disadvantageSkillId,
        ].includes(p.tacticalSkillId);
        return `<tr>
            <td style="color:#ffd27a">${name}</td>
            <td>${atkAdv}</td><td>${atkBal}</td><td>${atkDis}</td>
            <td>${defAdv}</td><td>${defBal}</td><td>${defDis}</td>
            <td style="color:${sigOk ? '#8f8' : '#f66'}">${sig}${sigOk ? '' : ' ⚠丢失'}</td>
            <td style="color:#9cf">${strat}</td>
        </tr>`;
    }).join('');

    const el = document.createElement('div');
    el.id = 'dev-situational-selfcheck';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:100000;background:rgba(18,18,22,0.96);color:#e8e8e0;padding:14px 18px;border:1px solid rgba(220,140,70,0.6);border-radius:10px;font-family:SimSun,serif;font-size:13px;max-height:80vh;overflow:auto;box-shadow:0 6px 24px rgba(0,0,0,0.6);';
    el.innerHTML = `
        <div style="font-size:15px;color:#ffd27a;margin-bottom:6px;">三势选技·战略技 实机自检 <span style="color:#888;font-size:12px;">(引擎真实 resolveSituationalSkillId · 再按 V 关闭)</span></div>
        <div style="color:#9c9;font-size:12px;margin-bottom:8px;">开局判局: 我方兵力 &gt;1.5倍→优局 / &lt;0.67倍→劣局 / 之间→均局。同将三局应选不同技=播报不重复。</div>
        <table style="border-collapse:collapse;width:100%;">
            <thead><tr style="color:#f0b96a;border-bottom:1px solid #654;">
                <th style="padding:3px 8px;text-align:left;">名将</th>
                <th style="padding:3px 8px;">攻·优势</th><th style="padding:3px 8px;">攻·均势</th><th style="padding:3px 8px;">攻·劣势</th>
                <th style="padding:3px 8px;">守·优势</th><th style="padding:3px 8px;">守·均势</th><th style="padding:3px 8px;">守·劣势</th>
                <th style="padding:3px 8px;">武将技</th><th style="padding:3px 8px;">战略技</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;
    // 单元格间距
    el.querySelectorAll('td').forEach((td) => { (td as HTMLElement).style.padding = '3px 10px'; (td as HTMLElement).style.borderBottom = '1px solid rgba(100,80,60,0.25)'; });
    document.body.appendChild(el);
}
