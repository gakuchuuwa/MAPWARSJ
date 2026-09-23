/**
 * 核心类型定义
 */

// 位置坐标
export interface Position {
    x: number;
    y: number;
}

// 经纬度坐标
export interface LatLng {
    lat: number;
    lng: number;
}

// 地形类型
export enum TerrainType {
    OCEAN = 'ocean',
    NORMAL = 'normal',
    SLOW = 'slow',
    UNKNOWN = 'unknown'
}

// 地形属性
export interface TerrainProperties {
    name: string;
    passable: boolean;
    navalPassable: boolean;
    isWater: boolean;
    color: string;
    moveCost: number;
    speedMultiplier: number;
}

// RGB颜色
export interface RGBColor {
    r: number;
    g: number;
    b: number;
    a?: number;
}

// 队伍/势力
export interface Faction {
    id: string;
    name: string;
    /** 运行时由 FactionManager 每局随机写入；factions.ts 数据不含此字段 */
    color?: string;
    armyName?: string;
    defaultLegionType?: string;
    capitalCityId?: string;
}

export type CityType =
    | 'big_city'      // 大城 (包括皇都/巨都/首都)
    | 'medium_city'   // 中城 (标准城市)
    | 'small_city'    // 小城（含原渡口等小型据点）
    | 'pass'          // 关隘 (包括山关/要塞)
    | 'stockade'      // 城寨 (2026-09-03 新增：边境屯戍/羁縻小寨，比小城更小的军事哨所)

export interface City {
    id: string;
    name: string;
    factionId: string;
    latitude: number;
    longitude: number;
    type: CityType;
    /** 驻军兵力。🔴 [2026-09-12 主人定] 必填：战场已独立出去（`src/data/Battlefields.ts`），
     *  **据点一律有兵力**，故这里不再可选。（原先为「战场没有兵力」把本字段改成可选的补丁已撤销。） */
    troops: number;

    mirror?: boolean;
    tier?: 0 | 1 | 2 | 4; // 据点分级（与 cities_v2 对齐，0/1 为核心大城级）
    region?: string; // [NEW] Region ID
    buildingStyle?: string; // 建筑风格 (ASIA, WEST, EAST, SLAV, MEDI, ORIE, CEAS, INDI, PURU, SEAS, MESO, ANDE, AFRI, PERSIAN, GREEK, THRACIAN)
    startYear?: number; // [NEW] Start Year (Visible from this year)
    endYear?: number;   // [NEW] End Year (Visible until this year)
    image?: string;     // [NEW] Image path injected by RegionSystem

    // [NEW] Advanced Gameplay Stats
    supply?: number;      // 补给值 (0-100)
    defense?: number;     // 城防值 (0-1000)
    population?: number;  // 人口 (兵源基础)
    maxTroops?: number;   // 驻军上限

    /** 据点级：历史上是否已从该城派出过带将领军团（将领档消耗，换旗号重置） */
    spawnGeneralUsed?: boolean;
    /** 据点级：历史上是否已从该城派出过精锐军团（精锐档消耗，换旗号重置） */
    spawnEliteUsed?: boolean;
    /** 失陷年份（易主时写入；复国须距此至少 1 游戏年） */
    fallenAtYear?: number;
    // 🔴 [2026-09-12 主人定] 这里原先有个 `battlefield?: boolean`（战场当时挂在据点上）。
    //    主人改定「把战场独立出来，不做为据点，就叫战场。一个地名而已。类似奇观」，
    //    战场已迁到 `src/data/Battlefields.ts`（`bf_*`）+ `src/map/BattlefieldLayer.ts`，故本字段已删。
}

// 游戏状态
export interface GameState {
    units: any[]; // 临时用any，后续替换为Unit[]
    cities: City[];
    effects: any[];
    gameSpeed: number;
}

// ==================== 历史事件类型 (Historical Events) ====================


export type EventType = 'siege' | 'field_battle' | 'narrative';

export interface SiegeData {
    attackerFactionId: string;
    /**
     * 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] **守方势力**。
     *
     * 原先只有 `FieldBattleData` 有字段，`SiegeData` 靠「被攻据点」的 `city.factionId` 反推 ——
     * 而战场要塞（一之谷/千早城/马萨加/马里斯/推罗）**没有据点**，守方势力就无处可写，
     * 连带「按势力取精锐番号」也取不到。现在显式写明。
     * 兼容：为空的旧数据仍可回落 `city.factionId`。
     */
    defenderFactionId?: string;
    legionId?: string; // [NEW] Link to LegionConfig
    legionName?: string; // [OPTIONAL] Override name or for one-off
    attackerCityId?: string; // 可选：指定出兵城市（如果不填则自动选择最近的）
    attackerSourceCityId?: string; // [NEW] Optional: Synonym/Alias for attackerCityId for consistent naming
    attackerSourceLocation?: { lat: number, lng: number }; // [NEW] 可选：直接指定出兵坐标（优先级高于 attackerCityId）
    attackerLegionName?: string; // [NEW] 攻方军团名（战场编辑器可显式指定；留空走势力/建筑风格默认）
    /**
     * 被攻打的据点 id。
     * 🔴 [2026-09-19 主人定] **可以留空**：战场要塞（`targetBattlefieldId`）这种攻城战
     *    打的是一块**战场**而不是据点，此时本字段为空 —— 两者必居其一。
     *    消费方凡读它，都必须能接住"这次打的不是城"。
     */
    defenderCityId?: string;
    attackerGeneralId?: string; // [NEW] 攻击方将领ID
    defenderGeneralId?: string; // [NEW] 防守方将领ID
    attackerTroops?: number;
    defenderTroops?: number; // [NEW] Override city defender troops
    defenderLegionName?: string; // [NEW] 守方军团名（战场编辑器可显式指定；留空走势力/建筑风格默认）
    /**
     * 🔴 [2026-09-12 主人令「写呀，不写怎么继续？」] 逐事件独立行军航点（**攻城剧本用**）。
     * 与 `FieldBattleData.marchWaypoints` 同口径（军团逐段以据点为目标）；区别是走完航点后
     * **奔向目标城**（`defenderCityId`）、抵达城下即交给 `SiegeManager` 开打，而不是去野战场坐标。
     */
    marchWaypoints?: string[];
    /**
     * 🔴 [2026-09-19 主人定] **攻城战的战场目标**（只给「战场事件」用，AI 攻城一律不填）。
     *
     * 主人原话：「战场和现有据点不是一回事，所有战场都新建。」
     *   → 一之谷这种**要塞战场本身就是一个战场**（`bf_yinotani`，34.64,135.10），不是据点；
     *     但它又必须能被打下来（源义经鹎越奇袭破之）。
     *
     * 引擎的攻城链一路都要求「被攻的目标是一座城」（`cityManager.getCity` 拿不到就直接放弃），
     * 于是战场要塞打不了。此字段让战场事件**直接指定战场 id**：`SiegeManager` 收到它时
     * 用战场记录**合成**一个本次攻城专用的目标（id/名称/坐标/守军兵力都取自战场），
     * 不改据点表、不新增据点、也不影响任何 AI 攻城路径。
     */
    targetBattlefieldId?: string;
    result?: 'attacker_win' | 'defender_win';
    customDuration?: number; // [NEW] Director-controlled battle duration in seconds (overrides troop-based calculation)
    speedMultiplier?: number; // [NEW] Custom movement speed for this event
    autoEnterRTS?: boolean; // [NEW] Automatically enter RTS combat mode
    attackerPortrait?: string; // Path to attacker portrait image
    defenderPortrait?: string; // Path to defender portrait image
    title?: string; // [NEW] Historical Battle Title (e.g. "公元前236年 秦赵邺城之战")
    description?: string; // [NEW] Historical background description
    // 战后行动 (单一)
    afterBattle?: 'garrison' | 'move_to_city' | 'attack_city';
    afterBattleTargetCityId?: string; // 用于 move_to_city 或 attack_city
    // 战后行动链 (多步)
    afterBattleChain?: Array<{
        action: 'garrison' | 'move_to_city' | 'attack_city' | 'destroy';
        targetCityId?: string;
        speedMultiplier?: number;
    }>;
    destroyAfterBattle?: boolean; // 战后军队解散（通用标签，攻城战和野战均可用）
    /** 沙盒 AI/碰撞动态攻城：胜后空 chain → 交还 BT，不默认 garrison */
    isDynamic?: boolean;
    newCityParams?: {
        name: string;
        lat: number;
        lng: number;
        factionId: string;
        image?: string;
        troops?: number;
        type?: CityType;
    };
}

export interface FieldBattleData {
    attackerFactionId: string;
    defenderFactionId: string;
    attackerLegionId?: string;
    defenderLegionId?: string;
    attackerGeneralId?: string; // [NEW] 攻击方将领ID
    defenderGeneralId?: string; // [NEW] 防守方将领ID
    attackerLegionName?: string;  // [NEW] Create new attacker legion
    defenderLegionName?: string;  // [NEW] Create new defender legion
    attackerTroops?: number;      // [NEW] Troops for new attacker legion
    defenderTroops?: number;      // [NEW] Troops for new defender legion
    speedMultiplier?: number;     // [NEW] Custom movement speed for this event

    // [NEW] 多军团参战支持
    attackerSourceCityId?: string; // [NEW] Optional: Specify source city for attacker
    attackerSourceLocation?: { lat: number, lng: number }; // [NEW] Optional: Specify source coordinates for attacker
    defenderSourceCityId?: string; // [NEW] Optional: Specify source city for defender
    attackerLegionIds?: string[]; // 指定多支攻击方军团ID
    defenderLegionIds?: string[]; // 指定多支防守方军团ID
    attackerLegionNames?: string[]; // 按名称指定多支攻击方军团
    defenderLegionNames?: string[]; // 按名称指定多支防守方军团

    location?: { lat: number, lng: number }; // 战场坐标(遗留直接填坐标)
    locationCityId?: string; // [NEW] 使用预定义战场据点ID (如 bf_pingyang)
    marchWaypoints?: string[]; // [2026-09-12 主人定] 逐事件独立行军航点（军团逐段以据点为目标；最后一段走 location 野战场坐标）
    result?: 'attacker_win' | 'defender_win';
    title?: string;
    description?: string;
    autoEnterRTS?: boolean; // [NEW] Automatically enter RTS combat mode
    customDuration?: number; // [NEW] Director-controlled battle duration in seconds
    isNarrative?: boolean; // [NEW] 叙事模式（仅展示 UI，不创建军队实体）
    newCityParams?: {
        name: string;
        lat: number;
        lng: number;
        factionId: string;
        image?: string;
        troops?: number;
        type?: CityType;
    };
    afterBattle?: 'garrison' | 'siege' | 'move_to_city' | 'destroy';
    afterBattleTargetCityId?: string; // 用于 siege 或 move_to_city
    destroyAfterBattle?: boolean; // [NEW] 战后所有军队解散（无论攻防胜负）
    siegeAfterBattleChain?: Array<{
        action: 'garrison' | 'move_to_city' | 'attack_city' | 'destroy';
        targetCityId?: string;
        speedMultiplier?: number;
    }>;
}

export interface NarrativeData {
    factionId?: string;
    legionId?: string;
    moveToCityId?: string;
    moveToLocation?: { lat: number; lng: number };
    speedMultiplier?: number;
    afterBattleChain?: Array<{
        action: 'garrison' | 'move_to_city' | 'attack_city' | 'destroy';
        targetCityId?: string;
    }>;
}

export interface HistoricalEvent {
    title?: string;
    year: number;
    regnalYear?: string;
    season: number; // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
    description: string;
    type: EventType;
    siegeData?: SiegeData;
    fieldBattleData?: FieldBattleData;
    narrativeData?: NarrativeData;
    cityUpdates?: Array<{ cityId: string; factionId?: string; troops?: number }>;
    /**
     * 🔴 [2026-09-19 主人定] **这场战役归属哪位武将** —— 「一个武将一个真实的历史事件」。
     *
     * 主人原话：「我希望和武将对话后，加入武将军团，然后触发事件任务。……
     *   之前是时间来触发，我想改为找到武将后，第一次触发，每个武将一个真实的历史事件，然后就随机。」
     *
     * 判据：玩家与这位武将对话/野外会面并入伍 → 这就是他的那一场史实战役 →
     *   随他走到该战役战场 → 选边开打 → 打完后这个事件就算被他用掉了（回归乱斗）。
     *
     * ⚠️ **必须区分它和攻守双方主帅**（`*GeneralId`，在 `siegeData` / `fieldBattleData` 里）：
     *   那两位是**这一仗谁打谁**，本字段是**这一仗是谁的**。
     *   同一位武将可能以攻方或守方身份出现在别人的事件里，那不算他「自己的事件」——
     *   所以查询（`findHistoricalEventOfGeneral`）**只认本字段**，不看攻守主帅。
     *
     * 可空：留空 = 这条事件不归属任何武将（如原先那批按年份触发的战役），
     *   归自动模式按「同年 → 年份最早」的老规矩挑，行为与加本字段之前完全一致。
     * 一年可以有多条事件（主人定「先不要时间这个限定了」），同年不再互斥。
     */
    generalId?: string;
    /**
     * 🔴 [2026-09-23 主人定] **武将邀约对白**：剧本模式下玩家找到归属武将时，他请玩家同赴此役说的话。
     * 带语音念出；赶路背景播报等它念完才开始，两段不重叠。留空 = 用通用的一句邀约。
     */
    inviteText?: string;
}


