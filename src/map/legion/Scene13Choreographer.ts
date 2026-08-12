/**
 * Scene13Choreographer — 13 战斗「剧本法」编队走位（纯函数，无状态、无副作用）
 *
 * 规范：`docs/02-design/scene13-choreography-spec.md`
 *
 * 为什么存在：2026-08-10 一天在「编队自主寻敌 + 硬碰撞」上打了五刀补丁，
 * 「被友军挡住」的编队数 5~11 → 0~3 → 14，每修一刀冒一个新死结。三方独立复盘一致——
 * 那是多智能体路径规划（MAPF），启发式堆叠在数学上不收敛，**死锁是常态不是意外**。
 * 而胜负在 t=0 就由八环锁定，这个模拟不产出任何影响结果的信息，只需要好看。
 *
 * 所以改成剧本：**位置 = f(起点, 终点, t)，单值函数，没有运行时决策，没有碰撞检测。**
 *
 * 🔴 范围（2026-08-10 主人砍定，别再加戏）：
 *   - 只有三个状态：待命 IDLE / 移动 MOVE / 攻击 ATTACK
 *   - 没有崩溃后退、没有过冲回弹、没有随机扰动、没有各自寻敌
 *   - 「冲锋」只是幕名，画面就是现有的 MOVE 走路帧，零新美术
 *
 * 🔴 2026-08-11 修订（主人「第一排在打，第二排在空砍」）：
 *   刚体平移 + 整军一个状态 → 九个编队同时播 ATTACK，可身前是自己人的那六队
 *   在对着空气挥。改成**按格位查表**（spec §2 的角色表，接线时漏掉的那层）：
 *   前排咬、弓弩放箭、两翼骑兵递次投入、主将压阵。
 *   仍然没有运行时决策——每个格位的位移和状态都只是 f(格位, 幕, t)。
 *   唯一放宽的是「九队共用同一位移」：格位 3/5 有自己的一段侧翼补间，
 *   同样是写死的单值函数，重复观看走位完全一致。
 */

/** 三幕占比（总时长 = 引擎给的战斗时长，按比例切，不改任何时长常量） */
export const SCENE13_ACTS = {
    /** 一 列阵：两军静止对峙——这三秒的静止就是悬念 */
    DEPLOY: 0.10,
    /** 二 压上：整个方阵平移到咬合位置 */
    CHARGE: 0.20,
    /** 三 消耗：原地互搏，直到战斗结束（占满剩余时间） */
    GRIND: 0.70,
} as const;

export type Scene13Act = 'DEPLOY' | 'CHARGE' | 'GRIND';

/**
 * 前排交错咬合量（px）——**这是解决「隔空空砍」的那个数**。
 *
 * 停止位置不取「两个外框刚好相切」，而是让两军前缘**重叠**这么多。
 * 原因：外框是 4.375×兵宽 的并集，而精灵图四周有透明留白，士兵身体在框里更靠中间，
 * 所以「框贴上」时画面上两排人之间还隔着一段空气。这段空气取决于美术留白，
 * **任何公式都推不出来，只能量一次定死**。
 *
 * 2026-08-10 之前两天所有尝试（缩 hitbox 0.55/0.70、换支撑半径、加到位容差、
 * 加停滞检测）都在改「怎么把距离算准」，而距离从来没算错，错的是少了这个常量；
 * 且当时位置由每帧判距决定、每次停的地方都不一样，所以肉眼反推不出该改多少。
 * 剧本法下位置确定，看一眼画面就能把这个数定死，从此永远对。
 */
export const SCENE13_CONTACT_RATIO = 0.70;
// 调档记录（主人看画面定，别自己改）：
//   绝对值档：25 → 55 → 130（2026-08-10 主人两次「还得近」）
//   → 改比例档 0.70（2026-08-10 主人「有的方向第一排重叠，有的方向有空隙」）
//
// 🔴 为什么从「减固定像素」改成「乘比例」：
//   停止距离由 squadContactDistance 按外框支撑半径算，而矩形沿 45° 斜向的支撑半径
//   远大于沿边方向（约 (a+b)/√2 vs a 或 b）。同一支军团在 8 个朝向上的相切距离
//   能在 300~500px 之间浮动，统一减掉一个固定值 → 短的那档减过头（重叠）、
//   长的那档没减够（留缝）。乘比例则随方向自动缩放，八个朝向观感一致。
//   数值越小越贴（0.70 = 停在相切距离的七成，即前缘重叠三成）；穿模了就往上加。

/** 幕次 + 幕内进度（0~1）。progress = 本场战斗已进行的比例（0~1） */
export function actAt(progress: number): { act: Scene13Act; t: number } {
    const p = Math.max(0, Math.min(1, progress));
    if (p < SCENE13_ACTS.DEPLOY) {
        return { act: 'DEPLOY', t: p / SCENE13_ACTS.DEPLOY };
    }
    const chargeEnd = SCENE13_ACTS.DEPLOY + SCENE13_ACTS.CHARGE;
    if (p < chargeEnd) {
        return { act: 'CHARGE', t: (p - SCENE13_ACTS.DEPLOY) / SCENE13_ACTS.CHARGE };
    }
    return { act: 'GRIND', t: Math.min(1, (p - chargeEnd) / SCENE13_ACTS.GRIND) };
}

export function easeInOut(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * 本帧整个军团的位移量（本地坐标，−y = 阵型正前方）。
 * @param advance 开战时算死的总推进量（px，≥0）；调用方负责缓存，全程不重算
 */
export function blockOffsetAt(act: Scene13Act, t: number, advance: number): { x: number; y: number } {
    if (act === 'DEPLOY') return { x: 0, y: 0 };
    if (act === 'CHARGE') return { x: 0, y: -advance * easeInOut(t) };
    return { x: 0, y: -advance }; // GRIND：停在咬合位置
}

/** 本帧动作。只有三种：待命 / 移动 / 攻击（阵亡由调用方判 DEATH，不进这里） */
export function stateAt(act: Scene13Act, advance: number): string {
    if (act === 'DEPLOY') return 'IDLE';
    // 已经贴着了（推进量 ≈ 0，例如攻城守军原地据守）→ 压上这一幕也直接开打，不空走
    if (act === 'CHARGE') return advance > 1 ? 'MOVE' : 'ATTACK';
    return 'ATTACK';
}

// ─────────────────────────────────────────────────────────────────────────────
// 角色表（spec §2）：3×3 编制全文化区同构，所以「谁打谁」不是求解问题，是查表
//   Row 0  枪/盾/轻步  格位 0,1,2 —— 前排，跟刚体压上咬死
//   Row 1  骑/将骑/骑  格位 3,4,5 —— 3/5 两翼骑兵递次投入，4 主将压阵
//   Row 2  弓/弩       格位 6,7,8 —— 跟刚体保持队形，原位放箭
// ─────────────────────────────────────────────────────────────────────────────

/** 两翼骑兵的侧翼终点（格距倍数）：绕出战线外侧 1 格、前压到略越过前排 */
export const SCENE13_FLANK = {
    /** 横向外扩（×格宽）。0 = 不外扩 */
    LATERAL: 1.0,
    /** 纵向前压（×格高）。前排在本地 y = −sp.y，1.15 表示骑兵略越过前排咬敌前排的侧面 */
    FORWARD: 1.15,
    /** 消耗幕内起步时刻（0~1）：前排先咬住，骑兵晚半拍再上——画面有节奏，也是史实打法 */
    START: 0.30,
    /** 消耗幕内到位时刻（0~1）。到位后转 ATTACK */
    END: 0.48,
} as const;

/** 本帧某格位的完整剧本：相对整军刚体位移的**额外**偏移 + 动作状态 */
export interface Scene13SlotPlan {
    /** 本地坐标额外偏移（px），已含刚体位移之外的部分；−y = 阵型正前方 */
    offset: { x: number; y: number };
    state: string;
}

/**
 * 按格位查表出本帧的位移与动作。**这是「第二排空砍」的解**。
 *
 * 病根：上一版 `stateAt` 只按幕次返回一个状态，九个格位共用 →
 * 骑兵排和弓弩排身前站着自己的前排，却一起播 ATTACK。
 *
 * @param slot     格位 0~8
 * @param block    整军刚体位移（`blockOffsetAt` + 横向对齐后的结果）
 * @param sp       格距 { x: 格宽, y: 格高 }（px）
 * @param advance  开战算死的推进量，用于判「已经贴着了」的守军情形
 */
export function slotPlanAt(
    act: Scene13Act,
    t: number,
    slot: number,
    block: { x: number; y: number },
    sp: { x: number; y: number },
    advance: number,
): Scene13SlotPlan {
    const row = Math.floor(slot / 3);
    const col = slot % 3;
    const base = stateAt(act, advance);

    // 列阵 / 压上两幕：整军一个刚体，九队同进同止，队形一步不散
    if (act !== 'GRIND') {
        return { offset: block, state: base };
    }

    // ── 消耗幕：按角色分工 ──
    // 前排（row 0）：真接敌，砍
    // 弓弩（row 2）：ATTACK = 放箭，箭矢由 ProjectileRenderer 飞向对面，不是空砍
    if (row !== 1) {
        return { offset: block, state: 'ATTACK' };
    }

    // 主将格（4）：前排身后居中压阵。**不挥空**——主将亲自砍本来就不该是常态画面
    if (col === 1) {
        return { offset: block, state: 'IDLE' };
    }

    // 两翼骑兵（3 左 / 5 右）：待命 → 绕出侧翼 → 咬上
    const side = col === 0 ? -1 : 1;
    if (t < SCENE13_FLANK.START) {
        return { offset: block, state: 'IDLE' }; // 还在阵中待命，持械不挥
    }
    const span = Math.max(1e-6, SCENE13_FLANK.END - SCENE13_FLANK.START);
    const k = easeInOut(Math.min(1, (t - SCENE13_FLANK.START) / span));
    const offset = {
        x: block.x + side * sp.x * SCENE13_FLANK.LATERAL * k,
        y: block.y - sp.y * SCENE13_FLANK.FORWARD * k,
    };
    return { offset, state: k >= 1 ? 'ATTACK' : 'MOVE' };
}
