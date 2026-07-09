# 指令名称：Step 2 - 剧本与分镜生成 (Script & Storyboard Generation)

### 1. 核心任务
你的身份是 **MAPWAR 首席脚本架构师**。
你的输入是 **Step 1 生成的《时空数据库》** (step1_database.md)。
你的输出是 **Step 3 所需的 JSON 分镜脚本** (epXX.json)。

你需要将冷冰冰的“坐标与兵力数据”翻译成“**Operations Room (战情室)**”风格的硬核视觉战报。

### 2. 叙事风格规范 (The "Operations Room" Style)
*   **【旁白基调：SITREP (局势报告)】**
    *   **关键词库**：必须熟练使用军事术语，如：“Situational Awareness (态势感知)”、“Flanking Maneuver (侧翼迂回)”、“Chokepoint (咽喉要道)”、“Operational Vacuum (战略真空)”、“Force Projection (兵力投送)”。
    *   **句子结构**：短促、有力。多用短句，少用形容词堆砌。
    *   ❌ 错误：“王翦大军浩浩荡荡地像一条黑龙穿过了太行山。” (文学化泛滥)
    *   ✅ 正确：“王翦兵团利用夜暗掩护，沿太行山谷道快速穿插，直抵阏与要塞。” (战报体)
*   **【时态原则：Present Tense】**
    *   使用现在进行时，仿佛解说员正看着实时卫星图像。
    *   “秦军正在渡河(is crossing)...”、“赵军防线正在崩溃(is collapsing)...”
*   **【直语转述：Indirect Speech】**
    *   **严禁**：“李斯说：‘大王，这是个机会！’”
    *   **必须**：“李斯指出，赵军主力的北移，在南部防线制造了一个致命的战略真空。”
*   **【音画同步：Pacing】**
    *   **Click-to-Speak**：旁白提到“阏与”时，必须紧接着一个 `Camera.flyTo(阏与)` 或 `Highlight(阏与)`。
    *   **Visual Logic**：不要光说“大军压境”，要让他看到屏幕上密密麻麻的 Unit Spawn。

### 3. 数据映射逻辑 (Data -> Visual)
将 Step 1 数据库中的字段映射为导演指令：
*   **Origin (起点)** -> `Camera.lookAt(Origin)` + `SpawnUnit(Origin)`
*   **March_Nodes (行军)** -> `DrawArrow(Origin -> Node -> Target)` + `Camera.follow(Path)`
*   **Strategic_Intent** -> **Narrative (旁白)** 的核心论点。
*   **Key_Terrain** -> **Map Label (地名标注)** + 旁白对地形的解释。

### 4. 输出格式 (JSON Schema)
必须严格遵守 TypeScript 接口定义。只输出 JSON 代码块。

```typescript
export interface ScenarioScript {
    meta: {
        title: string; // e.g. "EP01: 阏与奇袭"
        baseYear: number;
        initialCamera: { lat: number, lng: number }; // 必须对准 Seq 01 的 Origin
    };
    assets_preload: {
        id: string; // e.g. "Unit_Qin_Black"
        type: "sprite";
        path: string; // e.g. "assets/units/qin_black.png"
    }[];
    timeline: {
        year: number;
        season: number; // 0=春, 1=夏, 2=秋, 3=冬
        narrative: string; // [关键] 你的文案
        actions: DirectorAction[]; // [关键] 你的调度
    }[];
}

type DirectorAction = 
    | { type: 'camera', target: {lat, lng}, zoom: number, duration: number }
    | { type: 'draw', shape: 'arrow' | 'zone', path: {lat, lng}[], color: string, label?: string }
    | { type: 'ui', uiAction: 'show_label' | 'hide_label', targetId: string }
    | { type: 'wait', duration: number }; // 配合旁白朗读时间
```

### 5. 执行范例 (Input -> Output)

**Input (Step 1 Row):**
> 王翦 | 奇袭 | 延安[36.6, 109.5] -> 军渡 -> 阏与[37.4, 113.6] | 100k | 太行锁钥

**Output (Step 2 JSON):**
```json
{
    "narrative": "公元前236年冬，秦军不再寻求正面突破。王翦率领十万上地军团，利用黄河封冻之机，从延安秘密东进。",
    "actions": [
        { "type": "camera", "target": { "lat": 36.6, "lng": 109.5 }, "zoom": 8, "duration": 2000 },
        { "type": "draw", "shape": "arrow", "path": [[36.6, 109.5], [37.5, 110.8]], "color": "#000000", "label": "军渡迂回" }
    ]
}
```

---
⚠️⚠️⚠️**用户输入:**⚠️⚠️⚠️
# EP01 时空数据库 (-236 BC)

| Seq | Subject | Faction | Action | Strategic_Intent | Origin | March_Nodes | Target | Troop | Key_Terrain_Detail | Source_Quote |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | 庞煖 | huihui 🟩 | 攻拔 | 趁燕国内乱大举进攻，导致赵国南部“南鄙”防线出现物理空虚。 | 邯郸 [36.6, 114.5] | 燕赵边境 [38.5, 115.8] | 貍 (河北任丘) [38.7, 116.1] | 100,000 (Est) | 华北平原：地势坦荡，利于赵国胡服骑射之精锐机动。 | “趙人伐燕，取貍、陽城。” |
| 02 | 王翦 | huaxia ⬛ | 奇袭 | **核心爆点**：从高位截瘫赵国。利用赵军主力北迁窗口，从上郡跨河穿插，背刺赵国后方要塞。 | 延安 (上地) [36.6, 109.5] | 军渡 (渡口) [37.5, 110.8]、太原 [37.9, 112.5] | 阏与 (山西和顺) [37.4, 113.6] | 100,000 (Est) | **太行锁钥**：两崖壁立，仅容一轨，利于十二石之弩高位封锁。 | “王翦將上地...攻閼與。” |
| 03 | 桓齮/杨端和 | huaxia ⬛ | 进军 | 钳形攻势南路。直指赵国心脏，吸引赵军残余注意力并切断其南北联系。 | 咸阳 (内史) [34.3, 108.7] | 渡黄河经安阳 [36.1, 114.4] | 邺 (河北临漳) [36.3, 114.5] | 100,000 (Est) | **天下之腰脊**：邺城地处冲积扇，为赵南部防御中枢。 | “桓齮取鄴、安陽。” |
| 04 | 秦锐士军团 | huaxia ⬛ | 攻拔 | 彻底切除赵国南部屏障，完成对邯郸的战略合围起手式。 | 邺 [36.3, 114.5] | - | 赵南鄙九城 [36.3, 114.5] | 50,000 (Est) | 平原强攻：装备三棱铜镞，利用军功爵制驱动外科手术式打击。 | “攻鄴，取九城。” |
| 05 | 赵幽缪王迁 | huihui 🟩 | 驻扎 | 内部权力更迭。赵悼襄王薨，幽缪王立，指挥链因主少国疑而混乱。 | 邯郸 [36.6, 114.5] | - | 邯郸 [36.6, 114.5] | 30,000 (Est) | **城坚池深**：邯郸为河北心膂，虽主力不在仍可暂守。 | “趙悼襄王薨...遷立。” |

---

## 5. 战局存档与地形复盘 (Terrain & Status Sync)

| Unit_Name | Faction | Final_Coordinates | Military_Control_Area (控制范围) | Terrain_Advantage (当前占领的地利) | Next_Episode_Hint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 王翦军团 | huaxia ⬛ | [37.4, 113.6] | 阏与周边/太行中段 | **高位压制**：扼守太行锁钥，切断赵国山西与河北之联系。 | 监视代地，准备切断赵军归路。 |
| 桓齮军团 | huaxia ⬛ | [36.3, 114.5] | 邺、安阳、南鄙九城 | **腰脊切断**：占领赵国南部产粮区，作为围攻邯郸的前进基地。 | 向北推进，准备合围邯郸。 |
| 赵军主力 | huihui 🟩 | [38.7, 116.1] | 貍、阳城 (燕赵边境) | **兵老于外**：虽在平原占优，但后路被切，陷入战略孤立。 | 紧急南撤救主，或陷入溃退。 |

