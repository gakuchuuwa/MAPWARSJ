export { SPRITE_PATHS } from './UnitAssets';

export class GameConfig {
    static SYSTEM = {        ENABLE_HISTORY_LOG: true,
        /**
         * 历史事件链（逐年 JSON 脚本）；默认关 = 纯沙盒乱斗。
         * 🔴 [2026-08-19] 此开关**还兼管军事科技的年份门控**（`MilitaryTechState.unlockedTechs`）：
         *   false（乱斗）→ 20 条科技全开，只留文化门控；
         *   true（历史脚本）→ 恢复按 `MilitaryTechs.year` 逐年解锁。
         *   打开它会同时改变 13 的兵种五维口径（拉丁/日耳曼的板甲等不再开局即有），
         *   war_sim 的平衡结论按开关分两套，别跨口径引用。
         */
        ENABLE_HISTORICAL_EVENTS: false,
        SANDBOX_MODE: true,
    };
    /**
     * F12 控制台日志频道（默认关 = 少刷屏）。
     * 排查问题时把对应项改为 true，或在控制台：game.logFlags({ SIEGE: true })
     */
    static LOG = {
        PERFORMANCE_CONSOLE: false,
        BATTLE_TICK: false,
        BATTLE: false,
        SIEGE: false,
        SIEGE_EFFECT: false,
        RECRUITMENT: false,
        UNIT_REGISTER: false,
        LEGION_MARCH: false,
        LEGION_SIEGE: false,
        AI: false,
        /** Army 停步、速度、战后驻留等 */
        ARMY: false,
        /** 占城、SpatialRegistry 重建、兵力继承 */
        WORLD: false,
        /** 启动流程横幅与初始化提示 */
        STARTUP: false,
        /** 编辑器内部调试输出 */
        EDITOR_DEBUG: false,
        /** 跟随军经过己方据点补兵 */
        FOLLOW_RESUPPLY: false,
        /** 远征：下令/功成/覆没/断粮坚持（低频大事，默认开） */
        EXPEDITION: true,
    };
    static CITY = {
        MIN_GARRISON: 1000
    };
    static SIEGE = {
        /**
         * 攻城停步 / 敌城 ZOC（经纬度欧氏°）。
         * 2026-08-04：0.1→0.15（略拉远，减轻叠进放大城图；勿再抬到 0.38 档）。
         * 连带 PASS_RADIUS / 路网截尾 / AI 抵达圈。
         */
        COMBAT_RADIUS: 0.15,
        DEFAULT_CITY_TROOPS: 1000
    };
    /** 离路行军：当前位置接入道路折线的距离阈值（LatLng 欧氏，约 5.5 km） */
    static ROAD = {
        JOIN_EPS: 0.05,
    };
    static LEGION = {
        SPLIT_BUFFER: 1000,
        /** @deprecated 乱斗季末补兵见 CityConfig.recruitPerSeason（大200/中150/小100/关50） */
        RECRUIT_PER_SEASON: 1000,
        /** 自建军团最低出兵数 */
        MIN_ARMY_SIZE: 10000,
        /** 据点军团战后兵力跌破此值 → 撤回出发城解散、兵力并入驻军（远征军团不受此限） */
        DISBAND_TROOP_THRESHOLD: 5000,
        /** 兵力低于此值时进攻锚点改用本城（弱兵收缩防线，回程补兵） */
        HOME_ANCHOR_TROOP_THRESHOLD: 20000,
        /** 沙盒地图上同时存在的军团硬上限（大城/中城数据不变，仅限制出征数量）。
         *  默认 99（2026-08-14 主人改，原 30）；军情面板滑条仍可在 10–99 实时调整。 */
        MAX_ACTIVE_LEGIONS: 99,
        // [2026-08-07 删] REGION_BASELINE_LEGIONS / VIEWPORT_SPAWN_QUOTA —— 全项目零引用的死配置。
        //   文化区保底数（≥1）写死在 RecruitmentSystem.buildSpawnPlan，
        //   同屏保底数（<2）写死在 RecruitmentSystem.trySpawnLegions，改这两个常量不会有任何效果。
        /** 首次出兵错峰：每隔 N ms 放行一批，让军团陆续登场而非同帧爆出 */
        INITIAL_SPAWN_INTERVAL_MS: 200,
        /** 首次出兵错峰：每批最多生成几支 */
        INITIAL_SPAWN_PER_TICK: 1,
        /** 开局集结待命时长 (ms)：首发军团全部生成后在都城列阵不动，到点选定跟随军团 + 全军同时拔营。
         *  2026-08-19 主人定 5 秒。改成 0 = 关闭集结、退回「生成即开拔」。 */
        INITIAL_DEPLOY_HOLD_MS: 5000,
        /** 每季（季度）最多新组建军团数（季末 trySpawnLegions） */
        MAX_LEGIONS_SPAWN_PER_SEASON: 1,
        /** 军团战败后尸体/阵亡动画保留时长 (ms) */
        CORPSE_DISPLAY_MS: 15000,
        /** 尸体消失前最后 N ms 逐渐淡出（0 = 不淡出，直接消失） */
        CORPSE_FADE_OUT_MS: 5000,
        /** 跟随军阵亡后，镜头停留多久再自动切到兵力最多的军团 (ms) */
        FOLLOW_SWITCH_DELAY_MS: 5000,
        /** 各类型据点最低出兵阈值（armySize = 驻军 × 0.9，须 ≥ 此值才可出兵）。2026-08-07 主人定：全部统一 20000。 */
        CITY_MIN_SPAWN_TROOPS: {
            small_city: 20000,
            medium_city: 20000,
            big_city: 20000,
            pass: 20000,
            region_center: 20000,
        } as const,
        /** 可出兵据点：大城、中城、小城、关隘（关隘守城仍有 PASS_GARRISON_MULT 加成） */
        SPAWN_CITY_TYPES: ['big_city', 'medium_city', 'small_city', 'pass'] as const,
        /** 全兵种军团兵力上限（出征 / 跟随补兵；主人 2026-07-09 统一 10 万） */
        ARMY_MAX_TROOPS: 100_000,
        /**
         * @deprecated 已与 ARMY_MAX_TROOPS 同为 10 万；勿再按兵种分上限。
         * 保留字段以免旧脚本/注释引用报错。
         */
        TRIANGLE_CAVALRY_ARMY_MAX_TROOPS: 100_000,
    };
    /** 乱斗游戏时间：现实 1 分钟 = 游戏 1 年（1x 倍速） */
    static TIME = {
        /** 1 季 = 15 游戏秒（1x 下 = 现实 15 秒） */
        SEASON_DURATION: 15,
        SEASONS_PER_YEAR: 4,
        /** 1 年 = 4 季 = 60 游戏秒（1x 下 = 现实 60 秒） */
        YEAR_DURATION: 60,
        /** 战后驻留（游戏秒） */
        POST_BATTLE_REST: 5,
        /** 顶部竹简时间轴：前334年亚历山大东征起 → 公元1912年 */
        TIMELINE_START_YEAR: -334,
        TIMELINE_END_YEAR: 1912
    };
    static COMBAT = {
        /**
         * 战斗时长（2026-08-04 主人定：双将战按兵力比动态 10–30 秒，取代固定 30 秒）：
         *   双方都有将 → 兵力比动态：1:1 = 30 秒（三幕墙钟预算 12+12+6：开战句 / 双方技能 / 溃败），
         *                 兵力每翻一倍 −6.7 秒，≥8:1 贴 10 秒地板（1万 vs 5万 ≈ 14.5 秒）。
         *   其余一切   →  9 秒（一方有将、纯兵对砍）。
         * 导演/剧本时长也钳制在 [9, 30]。
         * ⚠️ 2026-08-09 曾翻倍到 30–60/封顶 90（为拉长 13 演出），主人纠正：13 是独立视觉演出，
         *    引擎时长影响所有双将战（8/9/10 也在内），不许动——已改回 10–30。
         */
        BATTLE_DURATION_BOTH_GENERALS_SEC: 30,
        /** 双将战时长地板：兵力比再悬殊也至少打 10 秒（2026-08-04 主人定） */
        BATTLE_DURATION_MIN_RATIO_SEC: 10,
        BATTLE_DURATION_PARTIAL_GENERAL_SEC: 9,
        /**
         * 每编入一只援军给双将战加的秒数（2026-07-27 主人定）。
         * 累加：来 N 只 = 兵力比基础(10–30) + 10×N，攻守双方的援军都算，封顶 BATTLE_DURATION_MAX_SEC。
         * 只作用于双将战；9 秒的非双将战不加（但援军带将把战斗变成双将战时，按双将走）。
         */
        BATTLE_DURATION_REINFORCEMENT_BONUS_SEC: 10,
        /** 时长封顶（游戏秒）：援军加时最多加到这里，3 只即到顶 */
        BATTLE_DURATION_MAX_SEC: 60,
        /**
         * [2026-08-10 13 战术层固定时长] 主人定：进 13 的战斗一律打满 1 分钟。
         * 覆盖兵力比动态(10–30)、援军加时(+10/只)、导演时长——战术层只认这一个数。
         * 战术层的 delta 走**真实秒**（不乘游戏倍速），所以 60 就是墙钟整 1 分钟，
         * 你把游戏调到 4x 也还是 1 分钟。
         * 🔴 只作用于进了 13 的那场：8/9/10 的战斗、以及没被跟拍的双将战，时长逻辑全不变。
         * 血条/三幕火(0%/40%/80%)/脉冲都按 elapsed÷targetDuration 算，自动铺满 60 秒。
         */
        SCENE13_BATTLE_DURATION_SEC: 60,
        /**
         * [2026-08-10 13 准入门槛] 任一方总兵力低于此数 → **不进 13 战术层**（主人定）。
         * 小仗不值得让全世界停下来看一分钟；不进的战斗照旧按引擎动态时长后台推进。
         * 与「双将战 + 跟拍」是并列的准入条件，三条全满足才进。
         */
        SCENE13_MIN_TROOPS: 10000,
        /** 战术层时间微调倍率：1.0 = 真实秒。调小 = 慢镜头（同时会让那 60 秒变长） */
        SCENE13_TIME_SCALE: 1.0,
        THRESHOLD_SMALL: 20000,
        THRESHOLD_LARGE: 100000,
        /**
         * 战后恢复（2026-06 统一）：胜方恢复本场战损的 30%（野战/攻城/关隘同率）。
         * 注：本作机制为败方全灭（部队解散/彻底溃败），此 30% 的伤兵与收编恢复仅对胜方生效。
         */
        POST_BATTLE_RECOVERY_RATE: 0.3,
        /** @deprecated 推演/旧代码兼容；一律读 POST_BATTLE_RECOVERY_RATE */
        POST_BATTLE_RECOVERY: {
            field: 0.3,
            pass: 0.3,
            small_city: 0.3,
            medium_city: 0.3,
            big_city: 0.3,
        } as Record<string, number>,
        MIN_SURVIVAL_TROOPS: 0.1,
        /** 有效战力随机系数 [0.8, 1.2]：开战整侧掷一次；援军编入再掷一次（系统技「合兵一处」） */
        LUCK_MIN: 0.8,
        LUCK_MAX: 1.2,
        /**
         * 开战编入半径（经纬度欧氏°；开战瞬间 + 每 0.2s 圈内扫描）。
         * 2026-08-04：0.3→0.35，略大于 COMBAT_RADIUS(0.15) 与排队环。
         */
        BATTLE_JOIN_RADIUS: 0.35,
        /**
         * 精锐环（第 7 环）战力乘数 T0→T4，无精锐 ×1.0（AGENTS.md §12.3.1）。
         * 引擎 GeneralSkillCombat.getElitePowerMult 与面板 CultureCombat.getEliteCombatMultiplier 同读此表。
         * ⚠️ 精锐环只有这 5 个档：2026-08-01 删除了并列的 CAMPAIGN_LEGION_MULT=1.2（远征/兜底），
         *    它自 2026-07-24 起就不进引擎、只在面板角标显示，属纯误导。禁止再加任何第 6 个乘数进本环。
         */
        ELITE_TIER_MULT: [1.5, 1.4, 1.3, 1.2, 1.1] as const,
        /**
         * 以战养战：远离己方据点时，每秒恢复 = 军团上限 × 此系数（游戏秒）。
         * FollowResupplySystem 与模拟器共用；连战模拟 tick 秒数见 TIME.POST_BATTLE_REST。
         */
        FIELD_RESUPPLY_RATE_PER_CAP_PER_SEC: 0.00015,
    };
    /**
     * 行军减兵（远输困境）v2（2026-07-21 主人定稿：时间口径·一视同仁·15 秒整跳）：
     *   每个军团维护 timeSinceSupply——自最后一次途经己方据点半径以来的游戏秒数（形成军团即起算）；
     *   超过 FREE_SUPPLY_SEC（=1 季度携行粮）后每 ATTRITION_CHUNK_SEC 整跳一次，扣当前兵力 ATTRITION_CHUNK_RATE；
     *   途经任一己方据点 RESET_RADIUS_KM 内即复位（不要求驻停；攻下敌城变己方城后途经即复位）；
     *   战斗胜利 = 就地进行补给，timeSinceSupply 与整跳计时双双清零（重新计算）；
     *   战斗中照走表（扣减暂停，围城断粮题中之义）；战后休整停表停扣；
     *   远征军团（expeditionTargetCityId 非空，含岳飞脚本军）同样走表（2026-07-27 主人改：原为整体豁免）；
     *   保底 MIN_TROOPS_FLOOR，衰减永不会把军团扣到 0。
     *   一视同仁：不分步骑水陆——同样的时间窗，速度快者走得更远，速度优势自动转为后勤优势。
     */
    static MARCH_ATTRITION = {
        ENABLED: true,
        /** 免费补给时间窗（游戏秒）：15 = 1 个季度（1 季=15 游戏秒），出门带一季粮 */
        FREE_SUPPLY_SEC: 15,
        /** 断粮整跳间隔（游戏秒）：攒满一跳扣一次（主人裁定：15 秒一跳，飘字不刷屏） */
        ATTRITION_CHUNK_SEC: 15,
        /** 每跳减员率：对当前兵力百分比。15% = 1%/秒 × 15 秒，断粮即溃 */
        ATTRITION_CHUNK_RATE: 0.15,
        /** 途经复位半径（km）：距任一己方（同 factionId）据点 ≤ 此值即 timeSinceSupply 清零（不要求驻停） */
        RESET_RADIUS_KM: 20,
        /**
         * 远征军团整体豁免开关（expeditionTargetCityId 非空即豁免，含岳飞脚本军）。
         * 2026-07-27 主人改为 false：远征军也吃行军减兵。孤军深入本就该断粮，
         * 途经己方据点仍会复位，所以只有真正扎进敌境那段才会掉兵。
         * 若发现远征军到不了目标，先看这里。
         */
        EXEMPT_CAMPAIGN_LEGIONS: false,
        /** 兵力保底：衰减扣减后不得低于此值 */
        MIN_TROOPS_FLOOR: 1,
        /** 经纬换算：1 度 ≈ 111 km（全图约定 0.1°≈10–11km；编辑器内联 *111 同源） */
        KM_PER_DEGREE: 111,
    };
    /**
     * 18 文化六维属性（2026-07-31 按战绩排名重排 + 2026-08-02 新增欧洲三区：斯拉夫/日耳曼/拉丁）
     *   TIER_TABLE:             [军团攻, 据点防]
     *   SPEED_TABLE:            军团速
     *   RECRUIT_TABLE:          据点兵（季产驻军乘数）
     *   LEGION_TROOP_CAP_TABLE: 军团兵上限
     *   CITY_TROOP_CAP_TABLE:   据点兵上限
     *   "军团"属性绑军团（legion），"据点"属性绑城池（city），不随攻守方切换。
     *
     * ── 改表前必读的两条约束（2026-07-29 立，2026-07-31 废除规则③）──
     *
     * ① **邻区不得出现严格支配**：排名相邻的两个文化不存在「A 六维逐项 ≥ B 且至少一项 >」。
     *    跨区支配是高位综合强的自然结果，不违规。
     *
     * ② **每个文化必须有真实短板**：至少一项 ≤0.95 且不能只落在「据点兵上限」上——
     *    这一维是六维里影响最小的，拿它当短板等于没有短板。
     *
     *    六维各是一环，速度在 MOVEMENT_MATRIX 的行军大类，与六维无关。
     *    一环是一环，文化特征的攻/防/速/产/军上限/城上限各自独立，不互相补偿。
     */
    static CULTURE_COMBAT = {
        /** region → [军团攻, 据点防] */
        TIER_TABLE: {
            SLAVIC: [1.00, 1.10], GERMANIC: [1.10, 1.00], LATIN: [1.05, 1.10],
            STEPPE: [1.20, 0.85], TIBET: [1.05, 1.10], CENTRAL_ASIA: [1.10, 1.00],
            NORTHEAST: [1.10, 0.90], HEXI: [1.10, 1.00], NORTH: [1.10, 1.00],
            CENTRAL: [1.00, 0.95], WESTERN: [0.90, 1.15], WEST_ASIA: [1.05, 1.10],
            JAPAN: [1.05, 1.05], KOREA: [0.90, 1.20], JIANGNAN: [0.80, 1.00],
            LINGNAN: [0.90, 1.10], DIANQIAN: [1.00, 1.10], BASHU: [0.95, 1.20],
            INDIA: [1.05, 1.10], BERBER: [1.10, 0.90],
        } as Record<string, readonly [number, number]>,
        /** region → 军团速 */
        SPEED_TABLE: {
            SLAVIC: 0.95, GERMANIC: 0.95, LATIN: 0.90,
            STEPPE: 1.04, TIBET: 0.92, CENTRAL_ASIA: 1.00,
            NORTHEAST: 1.00, HEXI: 1.00, NORTH: 1.00,
            CENTRAL: 0.88, WESTERN: 1.00, WEST_ASIA: 1.00,
            JAPAN: 0.88, KOREA: 0.92, JIANGNAN: 0.88,
            LINGNAN: 0.92, DIANQIAN: 0.92, BASHU: 0.85,
            INDIA: 0.90, BERBER: 1.00,
        } as Record<string, number>,
        /** region → 据点兵 */
        RECRUIT_TABLE: {
            SLAVIC: 0.95, GERMANIC: 0.95, LATIN: 0.95,
            STEPPE: 0.85, TIBET: 0.90, CENTRAL_ASIA: 0.90,
            NORTHEAST: 0.95, HEXI: 0.95, NORTH: 0.90,
            CENTRAL: 1.05, WESTERN: 0.90, WEST_ASIA: 0.95,
            JAPAN: 0.95, KOREA: 1.00, JIANGNAN: 1.05,
            LINGNAN: 1.00, DIANQIAN: 1.00, BASHU: 1.00,
            INDIA: 1.05, BERBER: 0.90,
        } as Record<string, number>,
        /** region → 军团兵上限 */
        LEGION_TROOP_CAP_TABLE: {
            SLAVIC: 1.00, GERMANIC: 1.05, LATIN: 1.00,
            STEPPE: 1.20, TIBET: 0.85, CENTRAL_ASIA: 1.05,
            NORTHEAST: 1.10, HEXI: 0.85, NORTH: 1.00,
            CENTRAL: 1.00, WESTERN: 0.85, WEST_ASIA: 0.90,
            JAPAN: 0.85, KOREA: 0.85, JIANGNAN: 1.05,
            LINGNAN: 0.85, DIANQIAN: 0.85, BASHU: 0.85,
            INDIA: 0.90, BERBER: 0.95,
        } as Record<string, number>,
        /** region → 据点兵上限 */
        CITY_TROOP_CAP_TABLE: {
            SLAVIC: 0.95, GERMANIC: 1.00, LATIN: 1.00,
            STEPPE: 0.80, TIBET: 0.95, CENTRAL_ASIA: 0.95,
            NORTHEAST: 0.90, HEXI: 0.85, NORTH: 0.85,
            CENTRAL: 1.00, WESTERN: 0.90, WEST_ASIA: 0.95,
            JAPAN: 0.95, KOREA: 1.00, JIANGNAN: 0.95,
            LINGNAN: 0.90, DIANQIAN: 0.95, BASHU: 0.95,
            INDIA: 0.95, BERBER: 0.85,
        } as Record<string, number>,
        /** 关隘据点守军额外系数（与系统技「据险而守」对应） */
        PASS_GARRISON_MULT: 1.2,
        /** 15 文化中心据点守军额外系数（与系统技「守土继绝」对应） */
        REGION_CENTER_GARRISON_MULT: 1.2,
    };
    // [2026-06-12 删除] static MORALE（士气衰减 + FLANKING 侧翼系数）——全项目零引用的死配置。
    //   主人裁定：点线移动的大战略图无战术战斗界面，士气/侧翼加进来仍是「看数字掉」，
    //   只增 BUG 面无收益。战斗只靠兵力 + 文化五级系数（CultureCombat），保持简单明了。
    //   注：IBattleUnit.morale 字段仍存在但恒为 100、不驱动任何逻辑（拆除需动 5 文件，留作惰性管线）。
    /** 沙盒军团 AI：进攻目标在「道路最近的 N 座敌城」里均匀抽签 */
    static AI = {
        TARGET_NEAR_POOL: 3,
        /**
         * 枪打出头鸟（反雪球）：军团选目标时，候选池（方向池，挨着的 2-3 座城）里
         * 若有全图据点最多的势力（排除 panjun）→ 必打该势力最近的城（确定性、无门槛）。
         * 候选池里没有领头势力的城 → 正常随机抽签，不回头（2026-08-05 GAKU 定）。
         */
        LEADER_HUNT: {
            ENABLED: true,
            /**
             * 「明显领先」门槛（2026-08-12 主人批准）：据点数 ≥ 次名 × 本值才算出头鸟。
             * 🔴 旧判据是「多一座就算」——开局谁先打下第二座城就被所有邻居确定性合击，
             *    观感是莫名其妙的全图公敌。合纵的前提是对方已明显坐大，不是刚冒头。
             * 1.5 = 领先五成才招打。调 1.0 即退回旧行为。
             */
            MIN_LEAD_RATIO: 1.5,
        },
        /**
         * 选目标 / 途中改追：寻附近敌军团（LatLng 欧氏，约 0.8≈90km，贴近 zoom=9 同屏尺度）。
         * 命中则追击接野战；范围内无敌军团再走原「近敌城抽签」。
         * 已锁定据点时也会每帧扫一次，发现敌军则打断攻城改追（见 HasTarget）。
         */
        /**
         * 「打不打得过」闸门（2026-08-12 主人批准）：敌方兵力 > 我方 × 本比值 → 不主动挑它。
         *
         * 🔴 修前**整条选目标链路从不比较兵力**：`TargetEvaluator` 里 troops/garrison 一次都没出现，
         *    `pickNearbyEnemyLegion` 也只判死没死/同不同阵营/距离，于是
         *    5 千残兵会去追 3 万大军、3 万守军的雄关和 5 千残城被抽中的概率完全一样。
         *
         * 🔴 **只是"不主动挑"，不是"不打"**：被动接敌、收复老家、远征锁定目标一律不受此闸限制
         *    —— 打仗当然有打不过也得打的时候，这里管的只是「主动挑谁」。
         * 🔴 **筛空一律回落全池**，绝不让军团因为四周全是硬骨头而卡死不动。
         * 🔴 **3.0，推导过程如下**（2026-08-12；曾拍脑袋写 1.5 又写 5.0，两次都没算，勿再乱调）：
         *
         *   有效战力 = 兵力 × 各环乘积（面板"总"）× 运气。两个边界都是可查的：
         *     · 运气：LUCK 五档 0.8/0.9/1.0/1.1/1.2 等概率 → 我最好 ÷ 对方最差 = **1.5 倍**（1/25 概率）
         *     · 各环乘积：实机采样 7 场，范围 **1.08 ~ 3.17**，中位约 2.3
         *   ⇒ 能翻的盘的**理论天花板** = (3.17 / 1.08) × 1.5 ≈ **4.4 倍**，
         *     且需要「我拿最高环 + 对方拿最低环 + 运气两头拉满」三件事同时发生 ≈ 0 概率。
         *
         *   所以「2 万打 9 万」（4.5 倍）实际上打不赢；**把闸门设在分布的极端尾巴上等于没有闸门**。
         *   按胜率取：3 倍 ≈ 一成胜率（需近乎最优环 + 运气帮忙），2 倍很常见，1.5 倍随便打。
         *   取 3.0 = **只挡胜率一成以下的仗，一成以上的以少打多全部放行**。
         *
         *   ⚠️ 那 7 个采样是从截图里读的，不是跑出来的分布。要精调先测「总」的真实分布再动。
         */
        ENEMY_STRENGTH_MAX_RATIO: 3.0,
        HUNT_ENEMY_LEGION_RADIUS: 0.8,
        /** 追击中敌军团跑出此半径则放弃，改选据点（略大于寻敌半径，防边界抖） */
        HUNT_ENEMY_LEGION_ABANDON_RADIUS: 1.1,
        /**
         * 追击目标一直处于交战中、打不起来的最长忍耐时长（毫秒，**墙钟**）。
         *
         * 背景：AI 现在允许把交战中的敌军选为追击目标（闻着血腥味去等残局），但
         * HoldForFieldContact 会 stopMovement 并返回 SUCCESS，行为树不再往下走攻城分支。
         * 若对方在攻城（攻城串行、且原地不动），它既不会被打死也不会跑出放弃半径，
         * 追击方就会永远停在旁边——src/ai/bt 下没有任何超时机制会把它救出来。
         *
         * 取 45s 的依据：双将战固定 30 游戏秒，1x 倍速下等一场打完还有富余。
         * 注意战斗计时是游戏秒（受 timeScale 影响）而本超时是墙钟（与 recentFailedTargets
         * 冷却同源）：低于 1x 倍速时可能在对方打完前就放弃。这是可接受的——
         * 放弃后只是改去打城，目标进 60s 冷却，之后还能再追。
         */
        HUNT_BLOCKED_TIMEOUT_MS: 45000,
        /**
         * 追击走廊（2026-08-06 主人拍板实装，替代「0.8° 内任何敌军都打断攻城」）：
         * 只有挡在行军方向走廊上的敌军才打断攻城，侧翼/身后/城后面的小股不再拉走。
         * 判据（两个同时满足）：① 敌距 ≤ 城距 × HUNT_MAX_DETOUR_RATIO（不绕远路、不追城后面的）；
         * ② 「我→敌军」与「我→目标城」方向夹角 ≤ HUNT_CORRIDOR_HALF_ANGLE_DEG。
         * 只作用于 HasTarget 的打断路径；FindTarget 主动追击（无城目标时）不过滤。
         */
        HUNT_CORRIDOR_HALF_ANGLE_DEG: 45,
        HUNT_MAX_DETOUR_RATIO: 1.0,
        /** 行军首段超过此距离（LatLng 单位）时打诊断日志 */
        MARCH_DIAG_FIRST_LEG: 0.35,
        /** 距出兵/驻地据点超过此距离时，寻路优先用当前位置最近城作道路起点（避免野战后折返首都） */
        MARCH_PREFER_NEAREST_START_DISTANCE: 0.15,
        FAILED_TARGET_COOLDOWN_MS: 12_000,
        /** 同一军团同类 AI 日志最短间隔（毫秒） */
        BT_LOG_THROTTLE_MS: 8_000
    };
    /** 跟随军：经过己方据点时从据点抽兵补入（仅相机跟随的一支） */
    static FOLLOW_RESUPPLY = {
        ENABLED: true,
        CITY_MIN_TROOPS: 1000,
        TRANSFER_RATIO: 0.5,
        /** 与 LegionManager 抵达攻城一致：SIEGE.COMBAT_RADIUS + 0.1 */
        get PASS_RADIUS(): number {
            return GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
        },
        /** 扫描间隔（ms），避免每帧复制全图据点列表 */
        SCAN_INTERVAL_MS: 250,
    };
    /**
     * 远征：跟拍军团兵力 ≥ UNLOCK_TROOPS 自动出征，目标 = 全图据点最多的敌对势力首都。
     * 出征后不回头：家城被打、失守都不回，直至占领目标城或全军覆没。
     */
    static EXPEDITION = {
        /** 远征解锁线：5 万 */
        UNLOCK_TROOPS: 50_000,
        SELECT_TIMEOUT_MS: 15_000,
        /** UI 状态扫描间隔（ms） */
        SCAN_INTERVAL_MS: 500,
    };

    /**
     * 军团分层（GAME_DIRECTION 改进 B′，2026-06-16）：
     *   有番号据点、&lt;PROMOTE_TROOPS：四档各 25%（在仍可用档位中等概率）；据点将领/精锐各只能出一次。
     *   ≥PROMOTE_TROOPS：在据点配额允许时补精锐/将领（大军规则）。
     */
    static LEGION_TIER = {
        /** 大军线（4 万）：军团长到此线，在据点配额内补精锐番号/将领。与远征无关 */
        PROMOTE_TROOPS: 40_000,
        SPAWN_PLAIN_CHANCE: 0.25,
        SPAWN_ELITE_CHANCE: 0.25,
        SPAWN_GENERAL_ONLY_CHANCE: 0.25,
        SPAWN_ELITE_GENERAL_CHANCE: 0.25,
    };

    /** 异文化占领地起义复国（RebellionSystem） */
    static REBELLION = {
        /** 据点失陷后至少再经过的游戏年数，方可被选为复国目标 */
        MIN_YEARS_AFTER_FALL: 3,
    } as const;
}

/**
 * 钳制到 [floor, 上限] 游戏秒（导演时长 / 事件配置均须走此函数）。
 * @param minSec 可选下限；双将战传 10（BATTLE_DURATION_MIN_RATIO_SEC），默认非双将 9s。
 */
export function clampBattleDurationSec(seconds: number, minSec?: number, maxSec?: number): number {
    const c = GameConfig.COMBAT;
    const floor = minSec ?? c.BATTLE_DURATION_PARTIAL_GENERAL_SEC;
    // 上限默认 30；有援军时由调用方传入放宽后的上限（30 + 10×援军数），否则加时会被这里削回去
    const ceil = maxSec ?? c.BATTLE_DURATION_BOTH_GENERALS_SEC;
    return Math.min(ceil, Math.max(floor, seconds));
}

/** 运气环档距：只出 0.1 的整数档，不出中间小数 */
export const LUCK_STEP = 0.1;

/** 开战 luck：在 [LUCK_MIN, LUCK_MAX] 内按 LUCK_STEP 等概率抽一档（当前 0.8/0.9/1.0/1.1/1.2 五档） */
export function rollCombatLuckMultiplier(): number {
    const { LUCK_MIN, LUCK_MAX } = GameConfig.COMBAT;
    return rollLuckLadder(LUCK_MIN, LUCK_MAX);
}

/** luck 绝对边界（防未来新增技能误传坏值） */
export const LUCK_ABS_MIN = 0.3;
export const LUCK_ABS_MAX = 2.0;

/** 在 [lo, hi] 内按 LUCK_STEP 等概率抽一档；浮点按档距取整，避免 0.30000000000000004 */
function rollLuckLadder(lo: number, hi: number): number {
    const steps = Math.round((hi - lo) / LUCK_STEP);
    if (steps <= 0) return Math.round(lo / LUCK_STEP) * LUCK_STEP;
    const pick = Math.floor(Math.random() * (steps + 1));
    return Math.round((lo + pick * LUCK_STEP) / LUCK_STEP) * LUCK_STEP;
}

/** 在指定区间内按档抽 luck；硬夹到 [LUCK_ABS_MIN, LUCK_ABS_MAX] */
export function rollCombatLuckMultiplierInRange(min: number, max: number): number {
    const lo = Math.max(LUCK_ABS_MIN, Math.min(min, max));
    const hi = Math.min(LUCK_ABS_MAX, Math.max(min, max));
    if (hi - lo < 1e-9) return lo;
    return rollLuckLadder(lo, hi);
}

/** 开战掷有效战力：兵力 × luck（无地形/兵种表） */
export function rollCombatEffectivePower(troops: number): number {
    return troops * rollCombatLuckMultiplier();
}


export const PLAYER_SPEED_TIERS = {
    UNIFIED_MARCH_SPEED: 0.2
};

/**
 * 行军速度（主人 2026-07-09 四系矩阵）。
 * 陆地按 MovementClass × 平原/山地；水域全军统一（登船后兵种加成失效）。
 * 数值为相对 UNIFIED_MARCH_SPEED 的乘数。
 */
export const SEA_SPEED_MULTIPLIER = 1.2;

export const MOVEMENT_MATRIX = {
    /** 平原 2.4（原 3.0）：仍明显快于步骑 1.5；山地 0.9 垫底，步兵 1.1 为山地之王 */
    CAVALRY:  { plain: 2.4, mountain: 0.9 },
    MIXED:    { plain: 1.5, mountain: 0.9 }, // 中原等步骑：平原基准，山地受马辎拖累
    INFANTRY: { plain: 1.4, mountain: 1.1 }, // 日本/川蜀/江南：山地之王
    ELEPHANT: { plain: 1.2, mountain: 0.7 }, // 岭南/滇缅：战略机动笨重
} as const;

/** 地形速度倍率追赶时间常数（游戏秒）：约 0.5s 内贴近目标，消平原↔山地硬切 */
export const TERRAIN_SPEED_LERP_TAU_SEC = 0.5;
/** 平原/山地翻转确认帧数：hex 边界抖动时不立刻改目标倍率 */
export const LAND_TERRAIN_FLIP_CONFIRM_FRAMES = 4;

/**
 * @deprecated 旧地形×骑兵叠乘表；新逻辑用 MOVEMENT_MATRIX + SEA_SPEED_MULTIPLIER。
 * 保留字段供对照/旧脚本，Army 已不再读取。
 */
export const MARCH_SPEED_MULTIPLIERS = {
    TERRAIN: {
        mountain: 1.0,
        plain: 1.5,
        sea: SEA_SPEED_MULTIPLIER,
    },
    CAVALRY_LAND: {
        current: { mountain: 1.5, plain: 2.0 },
        conservative: { mountain: 1.2, plain: 1.5 },
    },
    USE_CONSERVATIVE_CAVALRY_PRESET: false,
} as const;

export const GAME_CONSTANTS = {
    UI_UPDATE_INTERVAL: 100,
    TOTAL_NPC_COUNT: 50
};
