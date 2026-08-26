/**
 * BattleSceneLayer — 独立战斗场景（13 演出档：编队展开 + 镜头跟随将领编队）
 *
 * 2026-08-09 主人定稿：战斗不进 ZOOM13 的旧方案作废，改独立战斗场景。
 *   上层 = 战斗画布（独立 canvas，屏幕坐标，双方自由摆位）—— 后续步骤
 *   下层 = 地图（冻结自动缩放 + 普通跟拍，镜头由本类 tick 接管）
 *
 * ⚠️ 实际行为（2026-08-09 核对修正，勿再按旧注释理解为「静止背景」）：
 *   tick() 每帧 setView 追攻方将领编队的渲染位置（含攻城外推 + 编队推进偏移）——
 *   地图是全程跟拍的，不是静止的。GameAppLoop 冻结的只是 zoomController.tick()
 *   与 cameraFollowUI.tickFollowCamera()（普通跟拍），镜头改由 battleScene.tick 控制。
 *
 * 主要职责：
 *   1. 战斗开始（跟拍军团参与）→ 镜头 flyTo 战场中心 zoom 13
 *   2. 场景激活期间：每帧追攻方将领编队渲染中心（SCENE_FOLLOW_LERP 指数平滑 + 大距离吸附）
 *   3. 自愈：跟拍军团无活跃战斗即自动退出，防 active 残留污染非 13 渲染
 * 退出时由本类 setView 带回进入前 zoom（ZoomController.currentZoom 不感知 flyTo，勿依赖它）。
 */

import L from 'leaflet';
import { GameMap } from '../map/GameMap';
import { getGlobalUnitRenderer } from '../map/UnitRenderer';
import { GameConfig } from '../config/GameConfig'; // [2026-08-11 战败停留] FOLLOW_SWITCH_DELAY_MS 兜底

/** 镜头跟随将领编队：每帧追近比例（指数平滑，与 GameAppLoop 跟拍同款） */
const SCENE_FOLLOW_LERP = 0.22;
/** 已对准判定（米）：小于此距离不再 setView，避免静止时微抖 */
const SCENE_FOLLOW_DEADZONE_M = 120;
/** 距离过大（攻方被 13 视觉拉近到城图旁，镜头需直接吸附而非平滑追 25km） */
const SCENE_FOLLOW_SNAP_M = 12000;

export class BattleSceneLayer {
    private map: GameMap | null = null;
    /** 场景是否处于「激活」状态（演出中） */
    private active = false;
    /** 进入 13 前的 zoom，退出时带回（ZoomController 不知情，必须自己记） */
    private preZoom = 9;
    /** 暂停钩子（GameApp 注入 timeSystem）：GlobalUnitRenderer 编队推进的暂停守卫用（用户手动暂停时编队停） */
    public pauseHook?: { setPaused(p: boolean): void; isGamePaused(): boolean };
    /** 镜头跟随的将领编队单位 id（跟拍军团；战斗推进时每帧追它） */
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

    public bindMap(map: GameMap): void {
        this.map = map;
    }

    /** 战斗开始 → 镜头飞战场中心 zoom 13，并激活冻结。
     *
     *  [2026-08-10 13 独立时钟·主人定稿] 进 13 **暂停大战略**：大地图（年历/AI/募兵/历史事件）
     *  停住，只有这场战斗按自己的时钟跑 —— 三国群英传 / 全面战争式的战略层 ⇄ 战术层分离。
     *  推翻 2026-08-09 的「进 13 不暂停」，理由：引擎给的 10~30 游戏秒装不下编队级演出
     *  （冲锋→接触→逐队阵亡），且大地图要快、战斗要慢的矛盾绑在一个时钟上无解。
     *  ⚠️ 用户自己按了暂停键的情况不接管（strategyPausedByScene=false），那是真暂停。 */
    public enter(center: { lat: number; lng: number }, followUnitId?: string | null): void {
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
        const lMap = this.map?.getLeafletMap();
        if (!lMap) return;
        // 记住进入前 zoom：本方法不再改缩放，但别处若改了，exit 仍据此带回（幂等，没变就空过）
        this.preZoom = lMap.getZoom();
        // 🔴 [2026-08-26 主人定「直接动手」] 原来这里是 `lMap.flyTo([center], 13, {duration:1.6})`，已删。
        //
        // 依据：**Scene13WarLayer 全文不读地图缩放**（grep zoom/getZoom 零命中）。
        // 它是 `position:fixed; inset:0` 的全屏 canvas，宽高取 window.innerWidth/innerHeight，
        // 战场用自己的等距网格（isoCellX/isoCellY）算坐标，与经纬度和 Leaflet zoom 完全无关。
        // 也就是说战斗画面长什么样跟底图是 zoom 9 还是 13 毫无关系 —— 而底图被这块
        // 不透明的全屏战场整个盖住，观众一个像素也看不到。
        //
        // 代价却是观众看得见的：flyTo 那 1.6s 里 13 画布还没铺上，露出来的正是
        // 「正在放大的战略地图」；飞到位后还要等素材解码（292 局实测中位 7.2s、p90 18.6s），
        // 这期间露的还是那张图。一半的战斗要让观众盯着它看 8 秒以上，然后它被完全盖掉。
        // 这是 13 早期按「缩放档位」设计留下的包袱，现在只剩副作用，故去掉。
        //
        // 8/9/10 不受影响：本方法此后不再触碰地图缩放，退出时 zoom 与进入前一致。
        // center 参数保留：调用方（GameAppCombatHooks）仍按战场中心传入，
        // 且 tick() 的每帧跟拍仍需要战场位置，签名不动。
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

        // 13 锁死：flyTo(13) 动画途中（zoom<13）不跟随不推进，非 13 绝无 13 专属行为
        const lMap = this.map?.getLeafletMap();
        if (!lMap) return;
        if (lMap.getZoom() < 13) return;

        // [2026-08-11 13 v2] 出兵口互攻演出：镜头固定（冻结地图当背景），不再追军团。
        // 出场位置 = enter 时 flyTo 的战场中心（zoom 13），演出层全屏 canvas 画精灵。
        const warActive = (window as any).game?.scene13War?.isActive?.() === true;
        if (warActive) return;

        if (!this.followUnitId) return;
        const renderer = getGlobalUnitRenderer();
        // 🔴 [2026-08-10 主人铁律] 镜头**永远跟随军团**（跟拍军团将领编队）——
        // 野战/攻城一律 getGeneralSquadCenter，禁止改成跟战场中点/中心点
        // （曾擅改攻城镜头跟攻守中点被主人怒斥「凭什么给你改」）。
        const rendered = renderer?.getGeneralSquadCenter(this.followUnitId);
        if (!rendered) return;
        const target = L.latLng(rendered.lat, rendered.lng);
        const currentZoom = lMap.getZoom();
        const center = lMap.getCenter();
        const dist = center.distanceTo(target);
        if (dist <= SCENE_FOLLOW_DEADZONE_M) return;
        // 距离过大（13 视觉拉近把攻方挪到城图旁，镜头须直接吸附，不平滑追几十公里）
        if (dist >= SCENE_FOLLOW_SNAP_M) {
            lMap.setView(target, currentZoom, { animate: false });
            return;
        }
        // 每帧向目标插值一小段（指数平滑追踪），与普通跟拍同手感
        const next = L.latLng(
            center.lat + (target.lat - center.lat) * SCENE_FOLLOW_LERP,
            center.lng + (target.lng - center.lng) * SCENE_FOLLOW_LERP,
        );
        lMap.setView(next, currentZoom, { animate: false });
    }

    /** 战斗结束 → 解除冻结，镜头带回进入前的 zoom（勿依赖 ZoomController 自己发现 13） */
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
        const lMap = this.map?.getLeafletMap();
        if (!lMap) return;
        if (Math.abs(lMap.getZoom() - this.preZoom) > 0.01) {
            lMap.setView(lMap.getCenter(), this.preZoom, { animate: false });
        }
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
