# 外部 Agent Skills 评估（2026-11-10）

> 起因：主人问 `gamedev-skills/awesome-gamedev-agent-skills` 有没有用；另有助手（AA）建议连 `Claude-Code-Game-Studios` 一起否掉。
> 本文只记录**核对结果与取舍结论**，不是规则文件，规则仍以 `AGENTS.md` 为准。

---

## 一、两家仓库各是什么（已核实）

### 1. `awesome-gamedev-agent-skills`

- 77 个 `SKILL.md` + 1 个 router，Apache-2.0，带 `validate-skills.py` 校验，版本绑定（Godot 4.7 / Unity 6.3 LTS / UE 5.8）。
- 分层：引擎 42｜方法层（disciplines）15｜类型 9｜工作流 4。

| 层 | 数量 | 对 MAPWAR |
|---|---|---|
| 引擎层（Godot 16 / Unity 8 / Unreal 6 / Web 引擎 6 / 其他 12 / Ebitengine 1） | 42 | **全废**，本项目自研 TS+Vite+Canvas+Leaflet，不用任何引擎 |
| 类型层（platformer / roguelike / rpg / fps / tower-defense / card / visual-novel / survival / puzzle） | 9 | **废**，军团·据点·战术这套类型它没有 |
| 工作流（game-jam / prototype-fast / steam-publish / itch-publish） | 4 | **废**，发布走自研 vercel + 直播链路 |
| **方法层（engine-neutral）** | **15** | **有用**，见第三节 |

**方法层 15 个**：`performance-optimization`、`game-feel`、`game-ui-ux`、`camera-systems`、`input-systems`、`save-systems`、`procedural-gen`、`shader-programming`、`audio-design`、`level-design`、`game-ai`、`dialogue-systems`、`physics-tuning`、`create-game-assets`、`ai-behavior-trees-utility-ai`。

判据：这 15 个不 bind 任何引擎，讲的是帧预算拆 ms / CPU-GPU 分诊、hit-stop 与震屏、锚点缩放、动作映射抽象、存档版本迁移、噪声与种子、着色器原理、总线混音、白盒关卡、行为树与效用 AI。**与用什么引擎无关**。

### 2. `Claude-Code-Game-Studios`（Donchitos）

- 49 个 AI Agent 角色（创意总监 / 制作人 / 主策 / 主程 / QA 主管…）+ 72 个 workflow slash command，模仿真实工作室层级；底层技术角色主打 Godot 4 / Unity / UE5。
- **对本项目不用装**：它的立命之本是让 AI 自己扮演创意总监、开会、脑暴、敏捷排期、自作主张改设计——直接顶撞 `AGENTS.md`「主人只制定规则」「不许自造规则、不许擅自添加」。且 49 层传话会把一步到位的改动拆成多轮角色扮演，慢且费上下文。
- 它唯一有价值的理念是 QC Hooks（守门检查），而本项目已有更贴合的 `scripts/guard.mjs`（`npm run guard`，86 行）、`scripts/audit-game-integrity.mjs`（`npm run audit`，262 行），以及 `scratch/`、`tools/` 下几十个专属审计。

---

## 二、现状（2026-11-10 实测）

| 位置 | 状态 |
|---|---|
| `~/.dsh/skills/` | 15 个，**正好是方法层全部**，已挂进 dsh 会话 |
| `~/.claude/settings.json` → `enabledPlugins` | `gamedev@awesome-gamedev-agent-skills = true`（user 级） |
| `~/.claude/plugins/cache/.../184b72be0288/` | **全套 77**（76 skills + 1 router），3.5 MB，2026-10-26 安装 |
| `~/.claude/plugins/installed_plugins.json` | gamedev 版本 `184b72be0288`，scope=user |

**结论：dsh 侧已是「只装方法层」的最优状态；Claude Code 侧是全套 77 启用。**

体量对比（说明谁才是上下文大户）：

| 项 | 占用 |
|---|---|
| 15 个 skill 的 name+description 目录 | ≈1.5K token（**不加载就不读正文**） |
| 77 个全挂的目录 | ≈7K token |
| `AGENTS.md` | 94,046 字节 → 本会话被预算截断到 65,141 字节 |

---

## 三、取舍：留 15，砍 62

按对 MAPWAR 的实际对口度排序，只作**方法参照系**：

1. **`performance-optimization`** — 最对口。canvas 方阵绘制量大，现成基准有 `legion:zoc-bench`。它那套「帧预算拆 ms → 找单一瓶颈 → 改完再测」可直接套。
2. **`game-feel`** — 震屏 / hit-stop / 缓动 / squash，战术层手感可用。⚠️ 会主动建议「加反馈 / 加提示」，撞 `AGENTS.md`「不许擅自加屏幕上的玩意儿」，**必须先问主人**。
3. **`game-ui-ux`** — 只取 anchors / 分辨率缩放 / 焦点导航等通用原则，不按它的「响应式重构」翻已定的 UI 风格。
4. **`camera-systems`** — 调跟随/边界时对照；已有 ZoomController 与 `zoom:rules-test`，不重写。
5. **`save-systems`** — 只在做存档版本迁移、防损坏写入时看。
6. 其余 10 个（`physics-tuning`、`shader-programming`、`procedural-gen`、`audio-design`、`level-design`、`game-ai`、`dialogue-systems`、`create-game-assets`、`ai-behavior-trees-utility-ai`、`input-systems`）对应部位已自研或有专有铁律（战术 skill 系统、BGM 审计、立绘管线、三排阵型），参考价值低，按需再说。

### 点名对照表（主人说 → 加载哪个）

| 主人说 | 加载 | 用法边界 |
|---|---|---|
| 掉帧 / 卡 / 帧率 / 优化 / 变慢了 / 加载久 | `performance-optimization` | 先测后改，报前后帧时；不许凭感觉改 |
| 手感 / 打起来不爽 / 没打击感 / 加震屏 / 停顿 | `game-feel` | 加任何屏幕反馈都先问主人 |
| 界面 / 面板 / 按钮 / 排版 / 分辨率适配 | `game-ui-ux` | 只取通用原则，不翻已定风格 |
| 镜头 / 跟随 / 缩放 / 视角 / 边界 | `camera-systems` | 已有 ZoomController，只对照不重写 |
| 存档 / 读档 / 存档损坏 / 版本迁移 | `save-systems` | 只在迁移与防损坏写入时用 |
| 输入 / 按键 / 手柄 / 键位 | `input-systems` | — |
| 音效 / 混音 / 音量 / 音乐层 | `audio-design` | 已有 `bgm:audit`，不重做 |
| 地图生成 / 随机 / 种子 / 噪声 | `procedural-gen` | 只用于 NEW 内容，不改既有地理 |
| 着色器 / 描边 / 溶解 / 后期 | `shader-programming` | 只作原理参照 |
| 关卡 / 战场布局 / 白盒 | `level-design` | 战场已有自己的锚点与审计 |
| AI 决策 / 行为树 / 状态机 / 巡逻 | `game-ai` / `ai-behavior-trees-utility-ai` | 战术 skill 系统已有，不替换 |
| NPC 对话 / 分支剧情 | `dialogue-systems` | 剧本走 `剧本工序-单一口径.md` |
| 物理 / 抖动 / 卡进地形 / 穿透 | `physics-tuning` | — |
| 立绘 / 贴图 / 图标 / 美术风格 | `create-game-assets` | 立绘与美术风格属③档 |

**没有对应项 = 不加载任何 skill，照 `AGENTS.md` 办。**

### 使用铁律（重要）

- **只当方法参考，不作执行授权。** 它不知道 `ROW_PITCH=375`、不知道 67 文化链、不知道三档授权表；它建议的「顺手池化 / 重构 UI / 加个特效 / 加提示横幅」一律仍属**③档**，须先问主人。
- **不加载不耗上下文**：靠 `skill` 工具点名展开，平常不展开。
- **不跑 `npx skills add gamedev-skills/awesome-gamedev-agent-skills` 全装**（会把 77 个塞进项目 `.claude/skills/` 或 `.agents/skills/`）。

### 对 AA 判断的两处修正

1. AA 把方法层 15 个一起判没——**错**。它用「AGENTS.md 内容规则精准」去否「通用方法参考」，两者正交：`AGENTS.md` 管内容（哪个势力挂哪个旗号），管不了方法（帧时间超了砍哪块）。全文一万余字，**没有一句讲怎么测帧耗时**。
2. AA 说「90% 以上用不上」——数字虚高，实际 71%（55/77）。另称技术栈含「XState」，实测 `src/` 中 `from 'xstate'` **0 处 import**，是 package.json 里的僵尸依赖，不构成技术画像。

---

## 四、定案（2026-11-10 主人令）

> **「方法层 15，留着，按需点名调用，就这个。」**

- **留 15，砍 62**：方法层 15 个保留，引擎层 42 + 类型层 9 + 工作流 4 + router 不用。
- **按需点名调用**：平常不加载，照第三节点名对照表触发；不加载不耗上下文。
- **不作执行授权**：它不知道 `ROW_PITCH=375`、不知道 67 文化链、不知道三档授权表；它的任何「顺手加/改/重构」建议仍属③档，须先问主人。
- **不跑 `npx skills add` 全装**。
- **`Claude-Code-Game-Studios` 不装**（49 角色虚拟工作室，与本项目规则体系冲突）。

### Claude Code 侧已清理（2026-11-10 主人令「清理」）

| 项 | 改动 |
|---|---|
| `~/.claude/settings.json` | `gamedev@awesome-gamedev-agent-skills`: `true` → `false`（**全文只改这一行**） |
| `~/.claude/skills/` | 新增 15 个方法层目录（从 plugin cache 的 `skills/disciplines/` 复制，SKILL.md 齐全） |
| 备份 | `~/.claude/backups/settings.json.20261110-212347.bak`（8,559 字节，原样） |

**效果**：Claude Code 不再列出引擎层 42 + 类型层 9 + 工作流 4 + router，只保留方法层 15（外加原有的 `reverse-engineer-anything`）。

**回滚**：把备份拷回 `~/.claude/settings.json`，并删除 `~/.claude/skills/` 下那 15 个目录。plugin cache（3.5 MB / 77 个）**保留未删**，随时可重新启用。

**生效条件**：需重开 Claude Code 会话。

**代价（须知）**：`~/.claude/skills/` 是 user 级，这 15 个对 Claude Code 的**所有项目**生效（≈1.5K token 目录，不加载不读正文）。

### 各 AI 工具分布（2026-11-10 实测）

| 工具 | 位置 | 15 个方法层 |
|---|---|---|
| dsh | `~/.dsh/skills/` | 15/15 ✅ |
| Claude Code | `~/.claude/skills/` | 15/15 ✅（清理后） |
| Codex | `~/.codex/skills/` | 0/15（未装） |
| Cursor | `~/.cursor/skills-cursor/` | 0/15（未装） |
| Evox | `~/.evox/agent/skills/` | 0/15（未装） |
| Antigravity | `~/.gemini/antigravity/builtin/skills/` | 0/15（未装） |
| 项目级 `.agents/skills/` | 不存在 | — |

其余工具要用，把任一方法层目录整体复制进对应 skills 目录即可（frontmatter `name` + `description` 格式完全一致，已验证 Codex `imagegen`、Cursor `visualize`、Evox `analyze-paper`、Antigravity `agy-customizations` 同构）。
