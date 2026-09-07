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

# Combat System Unification Walkthrough

## Overview
We have successfully unified the combat logic across the game. Previously, combat was handled disparately in `HistoricalEventManager` (for wars) and `main.ts` (for NPC battles), with no real combat logic for the player other than simple subtraction.

Now, a central `CombatSystem` manages all battles, ensuring consistent rules for damage calculation, duration, and resolution.

## Key Components

### 1. CombatSystem (`src/core/CombatSystem.ts`)
- **`IBattleUnit` Interface**: Defines the standard contract for any entity that can fight.
    - `id`, `name`, `factionId`, `troops`, `maxTroops`
    - `setTroops(count)`
    - `onBattleStart()`, `onBattleEnd(result, opponent)`
- **`Battle` Class**: Manages a single engagement between two units.
    - Calculates duration based on total troops.
    - Handles "tick" updates to apply damage.
    - Determines advantage (currently simple, can be expanded).
- **`CombatSystem` Class**: Manages the list of active battles and updates them each frame.

### 2. Entity Integration

#### Player (`src/core/Player.ts`)
- Implements `IBattleUnit`.
- `factionId` getter added.
- `onBattleEnd` callback support for UI updates.

#### NPC (`src/core/NPCManager.ts`)
- `NPC` interface extends `IBattleUnit`.
- Implemented `setTroops` to update tooltip.
- Implemented `onBattleEnd` to remove self on defeat.

#### Army (`src/core/Army.ts`)
- Implemented `IBattleUnit`.
- Removed internal `handleBattleTick` and `resolveCombat` logic.
- Visual feedback (red color) during battle via `onBattleStart`/`onBattleEnd`.

#### City (via `HistoricalEventManager.ts`)
- Cities are adapted to `IBattleUnit` on the fly using a `CityBattleAdapter` in `HistoricalEventManager`.
- This allows cities to defend against armies using the same combat system without rewriting the entire `City` data structure.

### 3. Main Loop Integration (`src/main.ts`)
- `combatSystem` is instantiated and updated in the `gameLoop`.
- NPC interactions now trigger `combatSystem.startBattle(player, npc)` instead of instant resolution.

## Verification
- **Player vs NPC**: Clicking an NPC moves the player there and starts a **Field Battle** where the player (attacker) has advantage. The disadvantaged NPC only deals 60-100% of normal damage.
- **Army vs City**: Historical events spawn armies. When they arrive at a city, a **Siege Battle** starts where the city (defender) has advantage. The disadvantaged army only deals 60-100% of normal damage.
- **Battle Duration**: Scales with total troops involved (15-45 seconds game time).
- **Visual Feedback**: Armies turn red during combat.

## Battle Advantage System
The combat system now properly distinguishes between two types of battles:

### Field Battle (野战)
- **Participants**: Player vs NPC, Army vs NPC
- **Advantage**: Attacker
- **Logic**: The attacker deals full damage (1.0x), while the defender deals reduced damage (0.6-1.0x random)
- **Example**: When a player attacks a bandit NPC, the player has the advantage

### Siege Battle (攻城战)
- **Participants**: Army vs City
- **Advantage**: Defender  
- **Logic**: The defender (city) deals full damage (1.0x), while the attacker (army) deals reduced damage (0.6-1.0x random)
- **Example**: When a historical war event spawns an army to attack a city, the city has defensive advantage

The advantage determination is automatic based on the defender's characteristics:
- If defender ID starts with `npc_` → Field Battle
- If defender has maxTroops >= 20000 and is a known city ID → Siege Battle
- Otherwise → No advantage (equal combat)

## Future Improvements
- **Visuals**: Add a "சords crossing" icon or effect over battling units.
- **Field Battles**: Allow Army vs Army or Player vs Army battles.
- **Complex Advantage**: Implement terrain bonuses, general stats, and unit type counters in `CombatSystem`.
