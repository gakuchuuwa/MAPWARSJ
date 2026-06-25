# MAPWAR 音效系统 · 音频清单

> **核心原则：只做跟拍军团。** 全图 20 支军团同时行动，不做全局事件音效（= 噪音污染）。

---

## 已完成（跟拍军团 7/7）

| 文件名 | SoundKey | 触发时机 | 时长 | 来源 |
|--------|----------|----------|------|------|
| `march_loop.ogg` | `march_loop` | 跟拍军团行军中（循环） | 9s | 6月25日(1).WAV |
| `battle_start.ogg` | `battle_start` | 跟拍军团进入战斗 | 11s | 6月25日(2).WAV |
| `battle_loop.ogg` | `battle_loop` | 跟拍军团战斗中（循环） | 31s | 6月25日.WAV |
| `general_skill.ogg` | `general_skill` | 跟拍军团释放武将技 | 2s | 6月25日(5).WAV |
| `battle_victory.ogg` | `battle_victory` | 跟拍军团战胜 | 5s | 6月25日(3).WAV |
| `battle_defeat.ogg` | `battle_defeat` | 跟拍军团战败/覆没 | 8s | 6月25日(4).WAV |
| — | `battle_end` | 已废弃（被胜负拆分替代） | — | — |

跟拍军团完整听觉链路：
```
行军鼓 → 开战号角 → 战场拼杀 → 武将技 → 战胜/战败 → 行军鼓
```

---

## 已分析并排除

| SoundKey | 结论 | 原因 |
|----------|------|------|
| `legion_wipe` | **不需要** | 军团覆没 = 战斗中被歼灭，`battle_defeat` 已覆盖。覆没后 CameraFollowUI 停留 5 秒显示横幅后自动切军团——无独立触发点需额外音效。另一种消失方式 `disband()`（兵力<5000 自动回城解散）是管理事件，不配音效。 |
| `city_capture` | **不做** | 全图每座城被占都响 = 噪音 |
| `pass_siege` | **不做** | 同上，关隘攻防不跟拍无意义 |
| `faction_fall` | **不做** | 势力灭亡是全局事件，观众看不到是哪家 |
| `restoration` | **不做** | 势力复兴同理 |
| `battle_reinforcement` | **不做** | 援军抵达，暂无明确跟拍触发点 |

---

## 待做（按优先级）

### P1 — UI 音效

| 文件名 | SoundKey | 触发时机 | 状态 |
|--------|----------|----------|------|
| `ui_click.ogg` | `ui_click` | UI 按钮点击 | 已接线，缺文件 |
| `ui_confirm.ogg` | `ui_confirm` | 确认操作 | 已接线，缺文件 |

### P2 — 远征

| 文件名 | SoundKey | 触发时机 | 状态 |
|--------|----------|----------|------|
| `expedition.ogg` | `expedition` | 跟拍军团发动远征 | 待接线 + 缺文件 |

---

## 架构备忘（AI 必读）

### 为什么只做跟拍军团

MAPWAR 是即时战略沙盘，全图同时最多 20 支军团行动。每帧都可能发生多场战斗、多座城易主。如果全局事件都播音效，会变成无意义的噪音轰炸。观众跟拍一支军团，听觉焦点就是这支军团的旅程——行军、遇敌、放技能、胜负。

### 跟拍判断方式

所有音效触发点通过 `(window as any).game?.cameraFollowUI?.getFollowedArmyId?.()` 获取当前跟拍军团 ID，与事件的参与者 ID 比对，仅匹配时播放。

### 战斗音效链路

- `BattleField.ts` 构造器：跟拍军团参战 → `battle_start`
- `GeneralSkillCombat.ts` `emitTacticalUi()`：跟拍军团释放战术技 → `general_skill`（与 UI 技能名闪现同步延迟）
- `BattleField.ts` `resolve()`：胜负方判断 → `battle_victory` / `battle_defeat`
- `GameAppLoop.ts`：每帧同步跟拍军团状态 → `march_loop` / `battle_loop` 循环切换

### 战术技 10 种，1 个音效

名将开局 ①–⑤（以逸待劳、避实击虚、侵掠如火、不战而屈、不动如山）和普将逆局 ⑥–⑩（哀兵必胜、攻其不备、置之死地、釜底抽薪、深沟高垒）共用 `general_skill`。UI 已显示不同技能名，音效只需传递"出招了"的信号。战略技（S①–S⑧）是被动加成，无触发事件，不做音效。

### 技术备忘

- 音效目录：`public/sfx/`
- AudioManager 路径：`/sfx/{name}.ogg`
- 格式优先级：OGG > MP3
- 原始 WAV 保留在 `public/sfx/` 供日后重转
- 新增音效源文件后 `ffmpeg -i xxx.WAV -c:a libvorbis -q:a 4 {name}.ogg` 转换
