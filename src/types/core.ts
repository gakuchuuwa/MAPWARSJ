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

export interface City {
    id: string;
    name: string;
    factionId: string;
    latitude: number;
    longitude: number;
    type: CityType;
    troops: number;

    mirror?: boolean;
    region?: string; // [NEW] Region ID
    startYear?: number; // [NEW] Start Year (Visible from this year)
    endYear?: number;   // [NEW] End Year (Visible until this year)
    image?: string;     // [NEW] Image path injected by RegionSystem

    // [NEW] Advanced Gameplay Stats
    supply?: number;      // 补给值 (0-100)
    defense?: number;     // 城防值 (0-1000)
    population?: number;  // 人口 (兵源基础)
    maxTroops?: number;   // 驻军上限
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
    legionId?: string; // [NEW] Link to LegionConfig
    legionName?: string; // [OPTIONAL] Override name or for one-off
    attackerCityId?: string; // 可选：指定出兵城市（如果不填则自动选择最近的）
    attackerSourceCityId?: string; // [NEW] Optional: Synonym/Alias for attackerCityId for consistent naming
    attackerSourceLocation?: { lat: number, lng: number }; // [NEW] 可选：直接指定出兵坐标（优先级高于 attackerCityId）
    defenderCityId: string;
    attackerGeneralId?: string; // [NEW] 攻击方将领ID
    defenderGeneralId?: string; // [NEW] 防守方将领ID
    attackerTroops?: number;
    defenderTroops?: number; // [NEW] Override city defender troops
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
}


