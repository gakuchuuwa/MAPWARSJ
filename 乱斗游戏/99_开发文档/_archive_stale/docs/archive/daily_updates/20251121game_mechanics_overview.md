> # 🔴 铁律 · 兵种只认素材样貌，不认兵名
>
> 判断一个兵种能不能进某支军团，**只看 `public/SUCAI/` 里的素材长什么样**——甲胄形制、武器、马匹、旗号。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**全都不算数**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> 反面教材（都被主人当场抓过）：
> - 「契丹军团用女真铁浮屠精锐 = 乱炖」→ **错**。契丹有铁林军重甲骑兵，那副具装甲骑的样貌本来就对。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。那个素材的样貌和东北人本来就像。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**。胡斯军本来就用连枷 / 战锤。
>
> **没裁图看过素材，就不许下「不符合历史 / 跨国乱炖 / 时代不对」的结论。**
> 裁图工具：`scratch/tools_sprite_sheet.py`。判据优先级：**样貌 → 兵种类型 → 时代 → 名字**。

# Game Mechanics & Architecture Overview

> [!NOTE]
> This document serves as a reference for AI assistants to understand the current state of the "MAPWAR" project.

## 1. Core Architecture

### Tech Stack
- **Language**: TypeScript
- **Map Engine**: Leaflet.js
- **Build Tool**: Vite

### Key Managers
- **`GameMap`**: Wrapper around Leaflet instance.
- **`TimeSystem`**: Manages game time (Year/Season), pause state, and time scale (speed).
- **`HistoricalEventManager`**: Handles historical events, army spawning, and combat logic.
- **`CityManager`**: Manages city entities, troop counts, and ownership.
- **`GridSystem`**: Converts Lat/Lng to Hex coordinates (Axial).
- **`TerrainSpeedSystem`**: Determines terrain type and speed multipliers based on map color.

## 2. Time System

- **Scale**:
    - 1 Month = 5 seconds (Real Time at 1x speed)
    - 1 Year = 60 seconds
    - Seasons: Spring, Summer, Autumn, Winter (15s each)
- **Synchronization**:
    - `gameDeltaTime` is calculated in `main.ts` as `deltaTime * timeSystem.getTimeScale()`.
    - If paused, `gameDeltaTime` is 0.
    - **Crucial**: All movement and combat updates MUST use `gameDeltaTime` to respect pause/speed controls.

## 3. Movement System

### Terrain Speed
Terrain affects movement speed for both **Player** and **Armies**.
- **Normal (Plains/Green)**: 1.0x
- **Slow (Mountains/Forests/Orange)**: 0.5x
- **Water (Blue)**: 0.3x

### Tiered Speed System (Troop-Dependent)
Base speed is determined by troop count using a tiered system to simulate logistical constraints.

| Tier | Name | Troop Range | Base Speed (deg/s) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Scout** | < 100 | **4.0** | Extremely fast, single unit/small squad. |
| **2** | **Vanguard** | 100 - 1,000 | **2.0** | Fast, light infantry/cavalry. |
| **3** | **Legion** | 1,000 - 10,000 | **0.8** | Standard army marching speed. |
| **4** | **Grand Army** | > 10,000 | **Variable** | Decreases by 0.1 per 10k troops. Min 0.2. |

**Formula**: `Final Speed = TierBaseSpeed * TerrainMultiplier`

## 4. Combat System

### Mechanics
- **Trigger**: Happens when an Army reaches a hostile City.
- **Casualties**: Fixed ratio. Attacker kills 1000, loses 800 (example).
- **Duration**: Calculated based on **Total Casualties**.
    - Rate: **1000 casualties / second** (Game Time).
    - This ensures visual synchronization: when the battle timer ends, the troop numbers have finished decrementing.

### Visualization
- **City**: Shows "Breathing" red effect and crossed swords icon (⚔️).
- **Army**: Flashes red.
- **Troops**: Numbers update in real-time (interpolated) during the battle.

## 5. Player Entity

- **State**: Managed in `Player.ts`.
- **Data**: Initial config in `playerData.ts`.
- **Movement**:
    - Uses the same **Tiered Speed System** and **Terrain Speed** as armies.
    - Fully synchronized with `TimeSystem` (pauses when game pauses).
- **Attributes**: Rank, Merit, Faction, Troops.

## 6. Map & Grid

- **Hex Grid**: Pointy-topped hexes.
- **Territory**: Voronoi-like regions assigned to the nearest city.
- **Terrain Identification**:
    - Automatic: Scans map tiles for color (Green=Normal, Orange=Slow, Blue=Water).
    - Manual: `TerrainOverrideManager` allows painting terrain types to fix auto-detection errors.

## 7. Future Considerations

- **Pathfinding**: Currently, movement is straight-line (Euclidean). A* pathfinding on the Hex grid is a potential future upgrade.
- **Fog of War**: Not yet implemented.
- **Save/Load**: Basic `localStorage` support exists for terrain edits, but full game state save is not fully robust.
