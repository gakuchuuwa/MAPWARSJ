/**
 * BattleSceneLayer — 独立全屏战斗场景的生命周期控制
 *
 * 2026-08-09 主人定稿：战斗不进 ZOOM13 的旧方案作废，改独立战斗场景。
 *   上层 = Scene13WarLayer 全屏 canvas（独立屏幕坐标与等距网格）
 *   下层 = 战略地图（保持进入前的中心和 zoom，不参与战斗演出）
 *
 * 主要职责：
 *   1. 进场时暂停大战略、收起战略面板
 *   2. 场景激活期间维护战斗结束与残局停留生命周期
 *   3. 退场时解冻战斗、恢复大战略和面板
 */

import { GameConfig } from '../config/GameConfig'; // [2026-08-11 战败停留] FOLLOW_SWITCH_DELAY_MS 兜底

export class BattleSceneLayer {
    /** 场景是否处于「激活」状态（演出中） */
    private active = false;
    /** 暂停钩子（GameApp 注入 timeSystem）：GlobalUnitRenderer 编队推进的暂停守卫用（用户手动暂停时编队停） */
    public pauseHook?: { setPaused(p: boolean): void; isGamePaused(): boolean };
    /** 战术层独立时钟只放行此军团所在的战斗。 */
    private followUnitId: string | null = null;
    /** [2026-08-10 13 独立时钟] 本次进场是否由**场景**把大战略暂停的（用户手动暂停不算）。
     *  true = 大地图停住、只有这场 13 战斗在跑（三国群英传/全面战争式的战术层）；
     *  用户自己按了暂停键进场的，标 false —— 那是真暂停，连战斗一起停。 */
    private strategyPausedByScene = false;
    /** [2026-08-11 战败停留] 战败后保持 13 画面（冻结待命）到何时（performance.now 时间戳）。0 = 不停留 */
    private lingerUntil = 0;
    /** 本场 13 冻结着的战斗（BattleField 或 1v1 Battle）；退场时解冻，见 unfreezeScene13Battle */
    private frozenBattle: { scene13Frozen: boolean } | null = null;

    public isLingering(): boolean {
        return this.lingerUntil > 0;
    }

    /** 战斗开始 → 激活独立战斗画布并冻结大战略。
     *
     *  [2026-08-10 13 独立时钟·主人定稿] 进 13 **暂停大战略**：大地图（年历/AI/募兵/历史事件）
     *  停住，只有这场战斗按自己的时钟跑 —— 三国群英传 / 全面战争式的战略层 ⇄ 战术层分离。
     *  推翻 2026-08-09 的「进 13 不暂停」，理由：引擎给的 10~30 游戏秒装不下编队级演出
     *  （冲锋→接触→逐队阵亡），且大地图要快、战斗要慢的矛盾绑在一个时钟上无解。
     *  ⚠️ 用户自己按了暂停键的情况不接管（strategyPausedByScene=false），那是真暂停。 */
    public enter(followUnitId?: string | null): void {
        this.active = true;
        this.followUnitId = followUnitId ?? null;
        // [2026-08-11 战败停留] 新战斗进场 → 取消残留的停留（上一场战败的 linger 不带到下一场）
        this.lingerUntil = 0;
        // 大战略暂停：仅在「本来没暂停」时接管，退场时原样还回去
        // 🔴 先置 strategyPausedByScene 再 setPaused(true)：setPaused 同步触发 onPauseChange
        //   （GameApp → audioManager.setGamePaused），回调里 isStrategyPausedByScene() 要能读到 true，
        //   否则 13 场景暂停会被当成用户真暂停，battle_loop 被停、13 战斗没有音效（2026-08-12 修）。
        if (this.pauseHook && !this.pauseHook.isGamePaused()) {
            this.strategyPausedByScene = true;
            this.pauseHook.setPaused(true);
        } else {
            this.strategyPausedByScene = false;
        }

        // [2026-08-16 主人需求] 进入 13 战斗模式后，军团面板和军情面板自动收起（记录状态供退出时还原）
        const game = (window as any).game;
        game?.cameraFollowUI?.onEnterBattleScene13?.();
        game?.brawlFeedPanel?.onEnterBattleScene13?.();
    }

    /**
     * [2026-08-11 战败停留] 跟拍军团战败后：保持 13 画面（冻结待命）delayMs 毫秒，
     * 期间镜头不切回 zoom8、不追新军团；到期由 tick 统一 exit（回 zoom8）。
     * 与 CameraFollowUI 的 FOLLOW_SWITCH_DELAY_MS（切新军团延迟）同长，
     * 这样「停留 5 秒 → 直接切新军团」一气呵成，不再先跳 ZOOM8 干等（主人 2026-08-11 实锤）。
     */
    public beginLingerAfterDefeat(delayMs: number): void {
        this.lingerUntil = performance.now() + Math.max(0, delayMs);
    }

    /** 每帧镜头跟随：追将领编队实际渲染中心（含攻城外推） */
    public tick(): void {
        if (!this.active) return;

        // [2026-08-11 战败停留] 战败后保持 13 画面（冻结待命）到 lingerUntil 到期才真正退出。
        // 到期时直接 exit（回 zoom8）；期间 tickFollowCamera 的 5 秒延迟由 GameAppLoop 放行驱动，
        // 切新军团动作由 CameraFollowUI 完成，这里只管「何时退 13」。
        if (this.lingerUntil > 0 && performance.now() >= this.lingerUntil) {
            this.lingerUntil = 0;
            this.exit();
            return;
        }

        // [2026-08-10 13 独立时钟] 补接管：进场时用户正暂停着 → 当时没接管（尊重他按的暂停）。
        // 他一按「继续」，若不在这里补接管，这场战斗就退回「大地图一起跑」的老行为，
        // 战术层等于随「开战那一刻恰好暂停没暂停」随机失效。
        // 🔴 同样先置标志再 setPaused：onPauseChange 同步回调里 isStrategyPausedByScene 必须为 true，
        //   否则音频把这次暂停当用户真暂停 → battle_loop 被停（2026-08-12 与 enter 同步修）。
        if (!this.strategyPausedByScene && this.pauseHook && !this.pauseHook.isGamePaused()) {
            this.strategyPausedByScene = true;
            this.pauseHook.setPaused(true);
        }

        // [2026-08-09 13锁死+自愈] 跟拍军团已无任何活跃战斗（攻城/野战/1v1 全查）→
        // 战斗结束即退出场景，防 active 残留（攻城战结束此前无 exit 挂点，残留会让后续
        // 普通战斗/地图渲染误入 13 模式——主人血训：13 与其他 zoom 完全隔离）。
        // [2026-08-11 战败停留] 战败后（无活跃战斗 + 演出已停）不立即 exit：
        // 保持 13 冻结画面 5 秒，让 tickFollowCamera 的延迟切换期间镜头留在战场。
        const game = (window as any).game;
        const followedId = game?.cameraFollowUI?.getFollowedArmyId?.();
        if (followedId) {
            const fields: any[] = game?.combatSystem?.getActiveBattleFields?.() ?? [];
            const stillFieldFight = fields.some(
                (bf: any) => !bf?.isOver && bf?.hasParticipant?.(followedId),
            );
            const battles: any[] = game?.combatSystem?.getActiveBattles?.() ?? [];
            const still1v1 = battles.some(
                (b: any) => !b?.isOver
                    && (b?.attacker?.id === followedId || b?.defender?.id === followedId),
            );
            if (!stillFieldFight && !still1v1) {
                // 🔴 战败停留：战斗结束（无活跃战斗）→ 统一 5 秒停留再 exit，不管演出停没停。
                // [2026-08-11 修复] 1v1/攻城战路径：演出判负只置 over 不置 active（Scene13WarLayer
                //   判负段没有 stop），又没有外部钩子停演出（onRegionalBattleEnd 只管区域战）→
                //   原 `if (!warStillActive)` 把「演出还 active」挡在停留外 → 判负 1 帧后直接
                //   exit 闪退（主人实锤「一结束就没了」）。修复 = 演出还 active 时先
                //   stop('战斗正常结束', true) 保留残局帧，再进入 5 秒停留；区域战路径
                //   （onRegionalBattleEnd 已 stop + 已 linger）走到这里 lingerUntil>0，行为不变。
                if (this.lingerUntil <= 0) {
                    if (game?.scene13War?.isActive?.() === true) {
                        game.scene13War.beginLinger();   // 残局待命 5 秒：士兵待命动作 + 旗帜继续飘，不是静止帧
                    }
                    this.beginLingerAfterDefeat(GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS);
                    return;
                }
                if (performance.now() < this.lingerUntil) {
                    return;
                }
                this.exit();
                return;
            }
        }

    }

    /** 战斗结束 → 解除冻结并恢复大战略；战略地图镜头始终未被本场景改动。 */
    public exit(): void {
        if (!this.active) return;
        this.active = false;
        this.followUnitId = null;
        // [2026-08-11 13 v2] 自愈/外部终结路径：演出层一并停（正常结束走 onRegionalBattleEnd 停）
        (window as any).game?.scene13War?.stop?.('场景自愈退出');
        // 🔴 [2026-08-12 修永久冻结] 退场必须把引擎的冻结还回去。
        //   scene13Frozen 原本**只有 forceScene13Result 一条清除路径**（演出判负才走），
        //   而这里是「演出没判负就退场」的路 —— 跟拍目标一换，自愈判据
        //   hasParticipant(新 followedId) 为假 → 判定"没仗打了" → exit，
        //   可那场仗根本没结束，只是被冻着 → update() 永远第一行 return → **永远不结束**，
        //   双方永久 isExternalCombat：军团不再行军、城永远打不下（主人 2026-08-12 实锤）。
        //   这里不补判负结果——演出没给出结论，就把这仗**交还引擎按八环自己打完**，
        //   语义最正、改动最小。BattleField/Battle 里另有 120s 看门狗兜底第四条退场路。
        this.unfreezeScene13Battle();
        // [2026-08-10 13 独立时钟] 只还回**自己**暂停的那次；用户手动暂停进场的不动，
        // 否则退场会替用户把暂停解掉（他按的暂停凭空消失）。
        if (this.strategyPausedByScene) {
            this.strategyPausedByScene = false;
            this.pauseHook?.setPaused(false);
        }
        // [2026-08-17 主人需求] 13 战斗模式结束后，恢复展开军团面板与军情面板
        const game = (window as any).game;
        game?.cameraFollowUI?.onExitBattleScene13?.();
        game?.brawlFeedPanel?.onExitBattleScene13?.();
    }

    /**
     * 记下本场 13 冻结的那个战斗对象（BattleField 或 1v1 Battle），退场时据此解冻。
     * 由 GameAppCombatHooks 在置 scene13Frozen = true 的同一处调用。
     */
    public setFrozenBattle(b: { scene13Frozen: boolean } | null): void {
        this.frozenBattle = b;
    }

    /** 退场解冻：演出没判负就把这场仗交还引擎（已判负的话 scene13Frozen 早已是 false，这里空过） */
    private unfreezeScene13Battle(): void {
        const b = this.frozenBattle;
        this.frozenBattle = null;
        if (b && b.scene13Frozen) {
            b.scene13Frozen = false;
            console.warn('🔓 [BattleScene] 退场时演出未判负 → 解冻战斗，交还引擎按八环推演');
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    /**
     * [2026-08-10 13 独立时钟] 当前的「暂停」是不是场景为了跑战术层而接管的？
     * true  → 大地图停着，但这场 13 战斗要继续推进（GameAppLoop 放行 / 编队推进不冻结）
     * false → 真暂停（用户按的）或没在场景里，一切照停
     */
    public isStrategyPausedByScene(): boolean {
        return this.active && this.strategyPausedByScene;
    }

    /** 跟拍中的军团 id（GameAppLoop 用它筛出「只推进这一场战斗」） */
    public getFollowUnitId(): string | null {
        return this.followUnitId;
    }
}
