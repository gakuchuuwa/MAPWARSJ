> # 🔴 铁律 · 兵种归属只看「子分类 + 文化区挨不挨着」
>
> 判断一个兵种能不能进某支军团，**只看两条**：
>
> 1. **兵种子分类对不对** —— 近战骑兵 / 弓骑兵 / 枪骑兵 / 步弓手 / 重步兵 / 攻城器…
>    要补的是哪一类，就从那一类里挑。
> 2. **文化区在地理上挨着** —— 这个兵的本源文化区，和要用它的文化区，别隔太远。挨着就行，不必同族。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**都不是判据**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> **正例**：铁浮屠是**近战骑兵**、本源**东北** → 朝鲜、北方、草原、契丹、女真、西夏、蒙古**都能用**。
> 　　　　西辽挨着蒙古、离女真远 → 西辽 4 档用**怯薛军**比铁浮屠更合适。
> **反例**：图皮黑木弓箭手（南美）给阿伊努（北海道）—— 子分类虽同是步弓，但隔着太平洋，**太远，不行**。
>
> **禁止**：只因为兵名里带别族的民族词，就说「跨国乱炖 / 不符合历史」。这条已被主人当场抓过三次：
> - 「契丹军团用女真铁浮屠 = 乱炖」→ **错**，同是东北近战骑兵，文化区挨着。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**，波兰捷克接壤。
>
> 另一条同级铁律：**别人（主人 / 其他 AI）已经做好的编制，不许擅自改。**
> 只有改动前就是红的（格位不符阵型 / 兵种不存在 / 象攻城违规 / 战力离群）才准动，其余一律先问。
> 自动闸门：`npm run legion:no-unjustified-edits`（已挂 PostToolUse 钩子，改完自动拦）。

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
