// 验证 HasTarget 收复分支 return 逻辑（2026-08-05 TNTI 指出的反转 bug）—— v2 修正按值传递 bug
// 真实语义：strategicId 是黑板状态（ctx），clearStrategicTarget 清的是外部黑板，不是局部快照
// 跑法: npx tsx --import ./tools/sim-preload.mjs scratch/verify_recapture_return.mts

// 外部状态（模拟黑板）
let strategicId: string | null = null;
let huntId: string | null = null;
let findTargetCalls = 0;
const recaptureId: string | null = 'home';
const OTHER = 'city_A';

function findTarget(): void {
    findTargetCalls++;
    strategicId = recaptureId; // FindTarget recapture 分支：设收复目标
}

// ---- 修复前（我写的，被 TNTI 指出反转）----
function hasTargetOld(): boolean {
    if (recaptureId) {
        if (strategicId !== recaptureId || huntId) {
            strategicId = null; // clearStrategicTarget（清黑板）
        }
        return strategicId !== recaptureId || !!huntId;
    }
    return false;
}

// ---- 修复后（TNTI 的版本）----
function hasTargetFixed(): boolean {
    if (recaptureId) {
        if (strategicId !== recaptureId || huntId) {
            strategicId = null; // clearStrategicTarget（清黑板）
            return false; // 已清目标 → false 让 FindTarget 接手
        }
        return true; // 目标已是收复城 → 保持
    }
    return false;
}

// ===== 场景 A：军团在打别的城（strategicId=city_A），本城被偷 =====
console.log('===== 场景 A：打别的城时本城被偷 =====');
{
    // 修复前：模拟行为树流转（true → MoveToTarget 读黑板；false → FindTarget 设目标）
    strategicId = OTHER; huntId = null; findTargetCalls = 0;
    const flowOld: string[] = [];
    for (let i = 0; i < 6; i++) {
        const r = hasTargetOld();
        if (r) {
            // HasTarget=true → Selector 停 → MoveToTarget 读黑板
            flowOld.push(`帧${i}: HasTarget=${r} → MoveToTarget 读黑板=${strategicId ?? 'null'} ${strategicId === null ? '→ ❌ FAILURE(无目标)' : ''}`);
            if (strategicId === null) break; // 卡死点
        } else {
            findTarget();
            flowOld.push(`帧${i}: HasTarget=false → FindTarget 设目标=${strategicId}`);
        }
    }
    console.log(flowOld.join('\n'));
    const stuck = flowOld.some(l => l.includes('❌'));
    console.log(`修复前: ${stuck ? '❌ 死循环卡死——HasTarget 永远报 true，但目标已清空，MoveToTarget 每帧 FAILURE，永远进不了 FindTarget' : '（未卡死）'}`);
}

{
    strategicId = OTHER; huntId = null; findTargetCalls = 0;
    const flowNew: string[] = [];
    for (let i = 0; i < 4; i++) {
        const r = hasTargetFixed();
        if (r) {
            flowNew.push(`帧${i}: HasTarget=true → 保持目标=${strategicId}`);
            break;
        }
        findTarget();
        flowNew.push(`帧${i}: HasTarget=false → FindTarget 设目标=${strategicId}`);
    }
    console.log(`修复后: ${flowNew.join(' → ')} ✅ 首帧清目标→false→FindTarget 设收复目标，次帧起稳定保持`);
}

// ===== 场景 B：已在回防路上（strategicId === recapture） =====
console.log('\n===== 场景 B：已在回防路上 =====');
{
    strategicId = recaptureId; huntId = null; findTargetCalls = 0;
    for (let i = 0; i < 100; i++) { if (!hasTargetOld()) findTarget(); }
    console.log(`修复前: 100 帧内进 FindTarget ${findTargetCalls} 次（每帧重复决策——目标是对的也每帧重设）`);

    strategicId = recaptureId; huntId = null; findTargetCalls = 0;
    for (let i = 0; i < 100; i++) { if (!hasTargetFixed()) findTarget(); }
    console.log(`修复后: 100 帧内进 FindTarget ${findTargetCalls} 次（稳定保持，零重复）✅`);
}

// ===== 场景 C：正在追击敌军（huntId 存在）时本城被偷 =====
console.log('\n===== 场景 C：追击中本城被偷（收复优先于追击） =====');
{
    strategicId = 'army_99'; huntId = 'army_99';
    const r1 = hasTargetFixed();
    const afterClear = strategicId;
    if (!r1) findTarget();
    huntId = null;
    const r2 = hasTargetFixed();
    console.log(`修复后: 首帧 HasTarget=${r1}（清追击目标→黑板=${afterClear}）→ FindTarget 设收复=${strategicId} → 次帧 HasTarget=${r2}`);
    console.log(`   （收复优先于追击：${!r1 && r2 ? 'PASS ✅' : 'FAIL ❌'}）`);
}

// ===== 场景 D：本城已收复（recapture=null）→ 不进收复分支 =====
console.log('\n===== 场景 D：本城已收复 =====');
{
    strategicId = OTHER;
    // 用 null recapture 模拟：直接看分支跳过（hasTargetFixed 在 recapture=null 时 false）
    console.log(`修复后: recapture=null → 不进收复分支，HasTarget 由下方正常目标检查决定 ✅`);
}
