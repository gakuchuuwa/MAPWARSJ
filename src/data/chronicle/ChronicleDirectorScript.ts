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
    /** 史载胜方（按史，不按游戏胜负） */
    winner?: 'attacker' | 'defender' | 'draw';
    /** 受这一战影响的据点：开战前归史实守方、战后归史载结果（攻城战的被攻城必填） */
    city?: { cityId: string; before: string; after: string };
    /** 史载行军途经地（按先后，不含出发据点与战场本身）；每站须有史料出处（写在注释） */
    route?: { name: string; lat: number; lng: number }[];
}

export const CHRONICLE_SCRIPT: readonly ChronicleScriptEntry[] = [
    // ── 第 1 棒 · 居鲁士开国 ──
    // 那波尼德编年史：米底军倒戈交出阿斯提阿格斯，居鲁士进占埃克巴坦那
    { eventId: 'evt_0001', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'defender', enemyFactionId: 'midi', enemyGeneralId: 'midi_astyages',
        winner: 'defender', city: { cityId: 'city_hamadan', before: 'midi', after: 'aqimeinide' } },
    // 希罗多德 I.76：普特里亚两军死伤相当、胜负未分
    // 途经：那波尼德编年史 II.15–16「居鲁士集军，自阿尔贝拉之下渡底格里斯河」
    { eventId: 'evt_0005', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'defender', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_keluoyisi', winner: 'draw',
        route: [{ name: '阿尔贝拉', lat: 36.19, lng: 44.01 }] },
    // 希罗多德 I.80–84：提姆布拉胜后围撒狄十四日破城
    { eventId: 'evt_0006', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_keluoyisi',
        winner: 'attacker', city: { cityId: 'city_sifaerde', before: 'ldiya', after: 'aqimeinide' } },
    // 希罗多德 I.154–161：帕克提亚斯据撒狄围卫城，马扎雷斯至，叛军溃
    { eventId: 'evt_0007', baton: 1, leadGeneralId: 'aqimeinide_mazares', kind: 'battle', role: 'attacker', enemyFactionId: 'ldiya', enemyGeneralId: 'ldiya_pactyes',
        winner: 'attacker', city: { cityId: 'city_sifaerde', before: 'ldiya', after: 'aqimeinide' } },
    // 希罗多德 I.162–167：哈尔帕古斯筑土山破福西亚（据点克拉佐美奈 34km 代表）
    { eventId: 'evt_0008', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya',
        winner: 'attacker', city: { cityId: 'city_kelazuomeinai', before: 'aiaoniya', after: 'aqimeinide' } },
    { eventId: 'evt_0009', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'narrative' },   // 吕基亚库内无势力
    { eventId: 'evt_0011', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'narrative' },         // 巴克特里亚库内无势力，东征无确载决战
    // 那波尼德编年史 III.12–15：俄庇斯胜，西帕尔不战而降（据点巴格达代表俄庇斯—西帕尔一带）
    // 途经：希罗多德 I.189「进军巴比伦途中渡金德斯河（迪亚拉河），分其水为三百六十渠」
    { eventId: 'evt_0013', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'bfe2_nabonidus',
        winner: 'attacker', city: { cityId: 'city_bageda', before: 'jialedi', after: 'aqimeinide' },
        route: [{ name: '金德斯河', lat: 33.9, lng: 44.9 }] },
    // 那波尼德编年史 III.15–16；希罗多德 I.191：巴比伦陷落
    // 途经：那波尼德编年史 III.14「提斯利月十四日，西帕尔不战而降」
    { eventId: 'evt_0014', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'wuer_boshasha',
        winner: 'attacker', city: { cityId: 'city_babilun', before: 'jialedi', after: 'aqimeinide' },
        route: [{ name: '西帕尔', lat: 33.06, lng: 44.25 }] },
    // 希罗多德 I.214：居鲁士战死，马萨革泰胜
    { eventId: 'evt_0021', baton: 1, leadGeneralId: 'ailan_julushi', kind: 'battle', role: 'attacker', enemyFactionId: 'sijitai', enemyGeneralId: 'sijitai_tomyris', winner: 'defender' },
    // ── 第 2 棒 · 冈比西斯征埃及 ──
    // 波利比乌斯 XVI.22a：加沙抗冈比西斯被围克
    { eventId: 'evt_0025', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'feilisidin',
        winner: 'attacker', city: { cityId: 'city_jiasa', before: 'feilisidin', after: 'aqimeinide' } },
    // 希罗多德 III.11–13：佩卢西姆胜，围孟菲斯受降
    // 途经：希罗多德 III.10–11「两军对阵于尼罗河佩卢西姆河口」
    { eventId: 'evt_0026', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'aiji', enemyGeneralId: 'aiji_psamtik_iii',
        winner: 'attacker', city: { cityId: 'city_mengfeisi', before: 'aiji', after: 'aqimeinide' },
        route: [{ name: '佩卢西姆', lat: 31.04, lng: 32.54 }] },
    // 希罗多德 III.25：远征库施粮尽折返；途经：III.25「至底比斯，分兵五万攻阿蒙人，自率余众南进」
    { eventId: 'evt_0028', baton: 2, leadGeneralId: 'gen_cambyses', kind: 'battle', role: 'attacker', enemyFactionId: 'kushi', winner: 'defender',
        route: [{ name: '底比斯', lat: 25.7, lng: 32.64 }] },
    { eventId: 'evt_0030', baton: 2, leadGeneralId: 'aqimeinide_daliushi', kind: 'narrative' },   // 七人堡中刺杀高墨达，非两军对阵
    // ── 第 3 棒 · 大流士 ──
    // 贝希斯敦铭文 §18–20：扎扎纳胜，攻取巴比伦
    // 途经：贝希斯敦铭文 §18「尼丁图-贝尔之军据底格里斯河，朕渡河击之」（渡口位置史失，取巴比伦以北河段）
    { eventId: 'evt_0031', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'bfe2_nidintu_bel',
        winner: 'attacker', city: { cityId: 'city_babilun', before: 'jialedi', after: 'aqimeinide' },
        route: [{ name: '底格里斯河', lat: 33.35, lng: 44.4 }] },
    // 贝希斯敦铭文 §31–32：昆杜鲁什胜，弗拉奥尔特斯于埃克巴坦那受刑
    { eventId: 'evt_0032', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', role: 'attacker', enemyFactionId: 'midi', enemyGeneralId: 'midi_phraortes',
        winner: 'attacker', city: { cityId: 'city_hamadan', before: 'midi', after: 'aqimeinide' } },
    { eventId: 'evt_0040', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'narrative' },   // 斯基泰坚壁清野，未决战
    { eventId: 'evt_0041', baton: 3, leadGeneralId: 'aqimeinide_megabazus', kind: 'narrative' },  // 佩奥尼亚库内无势力
    // 希罗多德 V.34：围纳克索斯四月无功而返
    // 途经：希罗多德 V.33「舰队泊希俄斯之考卡萨，待北风渡纳克索斯」
    { eventId: 'evt_0056', baton: 3, leadGeneralId: 'aqimeinide_megabates', kind: 'battle', role: 'attacker', enemyFactionId: 'naxos',
        winner: 'defender', city: { cityId: 'city_chimarros', before: 'naxos', after: 'naxos' },
        route: [{ name: '考卡萨', lat: 38.21, lng: 25.93 }] },
    // 希罗多德 V.100–101：焚撒狄下城，阿尔塔弗涅斯守住卫城，伊奥尼亚军退走
    { eventId: 'evt_0058', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'defender', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_charopinus',
        winner: 'defender', city: { cityId: 'city_sifaerde', before: 'aqimeinide', after: 'aqimeinide' } },
    // 希罗多德 V.102：以弗所城外伊奥尼亚军大败
    { eventId: 'evt_0059', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_charopinus', winner: 'attacker' },
    // 希罗多德 VI.14–16：萨摩斯舰队临阵脱逃，伊奥尼亚舰队溃败
    { eventId: 'evt_0066', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya', enemyGeneralId: 'aiaoniya_dionysius', winner: 'attacker' },
    // 希罗多德 VI.18：米利都城破
    { eventId: 'evt_0067', baton: 3, leadGeneralId: 'gen_artaphernes', kind: 'battle', role: 'attacker', enemyFactionId: 'aiaoniya',
        winner: 'attacker', city: { cityId: 'city_miletus', before: 'aiaoniya', after: 'aqimeinide' } },
    // 希罗多德 VI.44–45：布里吉人夜袭伤马尔多尼乌斯，终被征服
    // 途经：希罗多德 VI.43–44「至奇里乞亚登舟，沿岸航至伊奥尼亚，转赫勒斯滂，渡入欧罗巴，经色雷斯赴马其顿」
    { eventId: 'evt_0070', baton: 3, leadGeneralId: 'bfe2_mardonius', kind: 'battle', role: 'attacker', enemyFactionId: 'seleisi', winner: 'attacker',
        route: [
            { name: '奇里乞亚', lat: 36.95, lng: 35.2 },
            { name: '伊奥尼亚', lat: 37.94, lng: 27.34 },
            { name: '赫勒斯滂', lat: 40.23, lng: 26.4 },
        ] },
    // 希罗多德 VI.112–117：雅典军胜；途经：VI.95–102「自奇里乞亚阿勒伊昂平原登舟，经萨摩斯、纳克索斯、提洛、卡里斯托斯、埃雷特里亚，登陆马拉松」
    { eventId: 'evt_0072', baton: 3, leadGeneralId: 'gen_datis', kind: 'battle', role: 'attacker', enemyFactionId: 'xila', enemyGeneralId: 'gen_miltiades', winner: 'defender',
        route: [
            { name: '萨摩斯', lat: 37.69, lng: 26.94 },
            { name: '纳克索斯', lat: 37.1, lng: 25.38 },
            { name: '提洛', lat: 37.4, lng: 25.27 },
            { name: '卡里斯托斯', lat: 38.02, lng: 24.42 },
            { name: '埃雷特里亚', lat: 38.39, lng: 23.79 },
        ] },
];
