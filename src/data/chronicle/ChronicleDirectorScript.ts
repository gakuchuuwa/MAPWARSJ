/**
 * 编年史导演编排表（2026-11-13，AI 导演定稿；主人授权「剧本由 AI 安排」）。
 *
 * 只写「编排」：哪场进主线、跟谁（随行主将）、打仗还是叙事、对手是谁。
 * 事件名、年份、坐标、两段播报一律取自编年史 json（唯一真源），由
 * `tools/chronicle/import-mainline.mts` 合成为 `ChronicleMainline.generated.ts`，本表不重复。
 *
 * 当前范围：第一段第 1—3 棒（居鲁士 → 冈比西斯 → 大流士，前 550—前 490）。
 * 依据：`docs/02-design/systems/编年史开篇-第一段第1至3棒-细节清单-2026-11-13.md`。
 */

export interface ChronicleScriptEntry {
    /** 编年史 json 的事件 ID */
    eventId: string;
    /** 棒号（旧版 16 段接力链） */
    baton: number;
    /** 随行主将：玩家这一场跟谁 */
    leadGeneralId: string;
    /** battle：开战术战；narrative：只播报不开战 */
    kind: 'battle' | 'narrative';
    /** 主将在这一战站哪边 */
    role?: 'attacker' | 'defender';
    /** 对手势力 */
    enemyFactionId?: string;
    /** 对手武将（史失其名则不填，显示「军团名＋将军」） */
    enemyGeneralId?: string;
}

export const CHRONICLE_SCRIPT: readonly ChronicleScriptEntry[] = [
    // ── 第 1 棒 · 居鲁士开国 ──
    { eventId: 'evt_0001', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'defender', enemyFactionId: 'midi', enemyGeneralId: 'midi_astyages' },
    { eventId: 'evt_0005', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'defender', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_keluoyisi' },
    { eventId: 'evt_0006', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_keluoyisi' },
    { eventId: 'evt_0007', baton: 1, leadGeneralId: 'aqimeinide_mazares', kind: 'battle', role: 'attacker', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_pactyes' },
    { eventId: 'evt_0008', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya' },
    { eventId: 'evt_0009', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'narrative' },   // 吕基亚库内无势力
    { eventId: 'evt_0011', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'narrative' },         // 巴克特里亚库内无势力，东征无确载决战
    { eventId: 'evt_0013', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'bfe2_nabonidus' },
    { eventId: 'evt_0014', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'wuer_boshasha' },
    { eventId: 'evt_0021', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'sijitai', enemyGeneralId: 'sijitai_tomyris' },
    // ── 第 2 棒 · 冈比西斯征埃及 ──
    { eventId: 'evt_0025', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'feilisidin' },
    { eventId: 'evt_0026', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'aiji', enemyGeneralId: 'aiji_psamtik_iii' },
    { eventId: 'evt_0028', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'kushi' },
    { eventId: 'evt_0030', baton: 2, leadGeneralId: 'aqimeinide_daliushi', kind: 'narrative' },   // 七人堡中刺杀高墨达，非两军对阵
    // ── 第 3 棒 · 大流士 ──
    { eventId: 'evt_0031', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'bfe2_nidintu_bel' },
    { eventId: 'evt_0032', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', role: 'attacker', enemyFactionId: 'midi', enemyGeneralId: 'midi_phraortes' },
    { eventId: 'evt_0040', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'narrative' },   // 斯基泰坚壁清野，未决战
    { eventId: 'evt_0041', baton: 3, leadGeneralId: 'aqimeinide_megabazus', kind: 'narrative' },  // 佩奥尼亚库内无势力
    { eventId: 'evt_0056', baton: 3, leadGeneralId: 'aqimeinide_megabates', kind: 'battle', role: 'attacker', enemyFactionId: 'naxos' },
    { eventId: 'evt_0058', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'defender', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_charopinus' },
    { eventId: 'evt_0059', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_charopinus' },
    { eventId: 'evt_0066', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_dionysius' },
    { eventId: 'evt_0067', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya' },
    { eventId: 'evt_0070', baton: 3, leadGeneralId: 'bfe2_mardonius', kind: 'battle', role: 'attacker', enemyFactionId: 'seleisi' },
    { eventId: 'evt_0072', baton: 3, leadGeneralId: 'gen_datis', kind: 'battle', role: 'attacker', enemyFactionId: 'xila', enemyGeneralId: 'gen_miltiades' },
];
