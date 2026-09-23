/**
 * 剧本军团（第四层）—— 🔴 [2026-09-23 主人定]
 *
 * 主人原话：「是不是应该新建一个四级……为剧本军团，主要看军团是否符合历史中的三兵种，
 *           因为军团都是三兵种构成的。」「这些也一定都要写到剧本编辑器中，确保以后新的军团都要符合历史。」
 *
 * 与前三层（16 母体 / 59 文明 / 三级自建）的关系：
 *   · 名字**全局唯一**，一个名字一种编制（src/legion-editor/AGENTS.md 铁律），不与前三层任何军团重名；
 *   · **只在历史剧本期、只给当前这一仗的攻 / 守方用**（事件里 attackerLegionName / defenderLegionName 指名）。
 *     乱斗模式根本不读这张表 —— 乱斗里各势力照旧用自己挂的那支军团，一格不变。
 *   · 🔴 一支剧本军团 = **一支历史上的军队本身**（如马其顿军），整场战争通用，**不按某一场仗的一时打法排**，
 *     也不每场换一支（主人：「这是亚历山大率领的远征军，你只看格拉尼库斯河战役，那么下一场还要换军团吗？」）。
 *     同一武将的各场事件用同一支剧本军团；只有史书记载这支军队的编成确实变了，才另立一支。
 *   · 三排 = 三个兵种，**先查史料**这支军队一贯怎么打，按接敌先后排前 / 中 / 后（不许自己编套路）。
 *     战术模式只有前 / 中 / 后三排纵深，**没有两翼**（主人：「战术模式中哪有两翼？」）。
 *     每支都写明史料出处；兵种选用先看素材样貌（AGENTS.md「兵种选用看素材样貌」）。
 *   · 🔴 [2026-09-23 主人定] **先查，再写，绝不留空**：查到史实用史实；查不到用知名度最大的说法
 *     （主人例：关羽的马查不到就写赤兔马）；再没有就按史地合理地编一个。问题从来不是查不到，是不查就乱写。
 *
 * 运行时接入：`CultureFormations.getLegionCompositionByName` 认得这些名字；
 *   剧本期由 `scriptPeriod.getScriptFactionLegionName(factionId)` 把当前这一仗的势力指到这里的军团。
 */
import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface ScriptLegionDef {
    /**
     * 军团名：全局唯一。🔴 [2026-09-23 主人定] **符合历史**：真实历史叫什么、或后世统称叫什么，名字就是什么——
     *   不加时代、不硬加「军团」二字（如「马其顿军」）。不得与任何精锐番号同名（命名铁律：军团 ≠ 精锐）。
     */
    name: string;
    formationMode: FormationMode;
    /** 三排：前 / 中 / 后，每排一个兵种，数量合计 9 且符合阵型 */
    slots: CompositionSlot[];
    /** 战船（跨海时的船型），留空按文化默认 */
    shipId?: string;
    /** 史料出处与兵种依据 */
    source: string;
}

export const SCRIPT_LEGIONS: ScriptLegionDef[] = [
    {
        // 史名：马其顿军（Μακεδονικός στρατός），菲利普二世与亚历山大两代的军队；中文维基条目「马其顿阿吉德王朝陆军」
        name: '马其顿军',
        formationMode: 'fish_scale',   // 鱼鳞 3-4-2：前 3 / 中 4 / 后 2
        slots: [
            { type: 'elite_companion_cavalry', count: 3 },   // 前排：伙伴骑兵，担任决定性一击的矛头
            { type: 'elite_phalangite', count: 4 },          // 中排：萨里沙方阵随后跟进，主体、人数最多
            { type: 'cretan_archer', count: 2 },             // 后排：克里特弓箭手，掩护主力
        ],
        shipId: 'TRIREME',
        source: '维基百科 Ancient Macedonian army「Battle tactics」：自前358年伊里吉翁河谷之战至前331年高加米拉，'
            + '马其顿标准战法为斜线推进、由伙伴骑兵担任矛头发动决定性冲击、方阵随后跟进；「Light infantry / Archers」：'
            + '克里特弓箭手与轻装兵掩护主力。阿里安《亚历山大远征记》I.14 记出征时约三万步兵、五千骑兵，步兵为主体。',
    },
];

export const SCRIPT_LEGION_MAP: ReadonlyMap<string, ScriptLegionDef> =
    new Map(SCRIPT_LEGIONS.map((l) => [l.name, l]));
