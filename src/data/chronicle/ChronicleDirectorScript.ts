/**
 * 编年史导演编排表（2026-11-13，AI 导演定稿；主人授权「剧本由 AI 安排」）。
 *
 * 只写「编排」：哪场进主线、跟谁（随行主将）、打仗还是叙事、对手是谁。
 * 事件名、年份、坐标、两段播报一律取自编年史 json（唯一真源），由
 * `tools/chronicle/import-mainline.mts` 合成为 `ChronicleMainline.generated.ts`，本表不重复。
 *
 * 当前范围：第一段第 1 棒 → 第二段第 18 棒（前 550—前 200）。
 * 依据：第 1—3 棒 `docs/02-design/systems/编年史开篇-第一段第1至3棒-细节清单-2026-11-13.md`；
 * 第 4 棒起按 GG《主线大纲_审定版_2026-11-13》棒次，逐场按史定案（出处写在每行注释）。
 * 「讲」＝库内无对应势力 / 无史载对阵 / 主将不在场时只播报，不开战。
 */

export interface ChronicleScriptEntry {
    /** 编年史 json 的事件 ID */
    eventId: string;
    /** 棒号（第 1—3 棒为旧版接力链；第 4 棒起同 GG 大纲棒号，如 '6A'） */
    baton: number | string;
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

type Win = 'attacker' | 'defender' | 'draw';
/** 打：随行主将、站边、对手势力、史载胜方；其余（对手武将 / 据点 / 途经）放 more */
const B = (eventId: string, baton: string, leadGeneralId: string, role: 'attacker' | 'defender', enemyFactionId: string, winner: Win,
    more: Partial<ChronicleScriptEntry> = {}): ChronicleScriptEntry => ({ eventId, baton, leadGeneralId, kind: 'battle', role, enemyFactionId, winner, ...more });
/** 讲：只播报 */
const N = (eventId: string, baton: string, leadGeneralId: string): ChronicleScriptEntry => ({ eventId, baton, leadGeneralId, kind: 'narrative' });
const at = (cityId: string, before: string, after: string) => ({ cityId, before, after });
const p = (name: string, lat: number, lng: number) => ({ name, lat, lng });

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

    // ══ 第一段 · 希腊世界（第 4—11 棒） ══
    // ── 第 4 棒 · 薛西斯入侵 ──
    // 希罗多德 VII.202–206：列奥尼达自斯巴达北上，科林斯等邦兵来会，过底比斯携其人质赴温泉关；VII.223–225 守军覆没
    B('evt_0081', '4', 'gen_leonidas', 'defender', 'aqimeinide', 'attacker', { enemyGeneralId: 'bfe2_xerxes_i', route: [p('科林斯', 37.91, 22.88), p('底比斯', 38.32, 23.32)] }),
    B('evt_0082', '4', 'gen_themistocles', 'defender', 'aqimeinide', 'defender', { enemyGeneralId: 'bfe2_xerxes_i' }),   // 希罗多德 VIII.83–96
    B('evt_0083', '4', 'gen_aristides', 'defender', 'aqimeinide', 'defender', { enemyGeneralId: 'bfe2_mardonius' }),     // 希罗多德 IX.59–70
    N('evt_0084', '4', 'gen_aristides'),   // 米卡列与普拉提亚同日（希罗多德 IX.90、100）；统帅列奥提基达斯不在库
    // 修昔底德 I.94：希腊联军先平塞浦路斯，再围拜占庭克之，城归斯巴达摄政帕萨尼亚斯所统联军
    B('evt_0085', '4', 'gen_aristides', 'attacker', 'aqimeinide', 'attacker', { city: at('city_junshitandingbao', 'aqimeinide', 'lagoniya') }),

    // ── 第 5 棒 · 客蒙与提洛同盟 ──
    B('evt_0087', '5', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker', { city: at('city_anfeibolisi', 'aqimeinide', 'xila') }),   // 埃伊翁在安菲波利斯据点 50km 内；希罗多德 VII.107、修昔底德 I.98
    N('evt_0088', '5', 'xila_cimon'),   // 多洛佩斯海盗库内无势力
    B('evt_0092', '5', 'xila_cimon', 'attacker', 'naxos', 'attacker', { city: at('city_chimarros', 'naxos', 'xila') }),   // 修昔底德 I.98：纳克索斯叛盟，被围降服
    // 普鲁塔克《客蒙传》12：客蒙自克尼多斯、法塞利斯出航，于欧律墨冬河口水陆两胜
    B('evt_0094', '5', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker', { route: [p('克尼多斯', 36.69, 27.37), p('法塞利斯', 36.52, 30.55)] }),
    N('evt_0095', '5', 'xila_cimon'),   // 萨索斯库内无势力
    N('evt_0096', '5', 'xila_cimon'),   // 斯巴达平黑劳士起义，主将不在库
    N('evt_0097', '5', 'xila_cimon'),   // 萨索斯库内无势力（修昔底德 I.101 围城三年降）
    N('evt_0098', '5', 'xila_cimon'),   // 修昔底德 I.102：斯巴达疑雅典，遣客蒙所部归，无决战

    // ── 第 6A 棒 · 伯里克利 ──
    B('evt_0102', '6A', 'xila_pericles', 'attacker', 'lagoniya', 'defender'),   // 普鲁塔克《伯里克利传》10：伯里克利身与塔纳格拉之战；修昔底德 I.108 斯巴达胜
    N('evt_0103', '6A', 'xila_pericles'),   // 米隆尼德斯所统，伯里克利不在场
    N('evt_0105', '6A', 'xila_pericles'),   // 托尔米德斯所统
    B('evt_0109', '6A', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker'),   // 修昔底德 I.112：客蒙卒于围基提翁，舰队于萨拉米斯水陆两胜
    N('evt_0110', '6A', 'xila_pericles'),   // 第二次神圣战争，史无对阵记载
    N('evt_0111', '6A', 'xila_pericles'),   // 托尔米德斯所统
    N('evt_0112', '6A', 'xila_pericles'),   // 优卑亚诸城库内无势力
    B('evt_0117', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker'),   // 修昔底德 I.116：特拉吉亚海战伯里克利胜萨摩斯（伊奥尼亚城邦）
    B('evt_0118', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker', { city: at('city_miletus', 'aiaoniya', 'xila') }),   // 修昔底德 I.117：围九月降；萨摩斯在米利都据点 50km 内

    // ── 第 6B 棒 · 伯罗奔尼撒战争前夜 ──
    B('evt_0121', '6B', 'xila_hagenong', 'attacker', 'seleisi', 'attacker', { city: at('city_anfeibolisi', 'seleisi', 'xila') }),   // 修昔底德 IV.102：哈格农逐埃多尼人，建安菲波利斯
    N('evt_0122', '6B', 'xila_hagenong'),   // 科林斯、科孚库内无势力
    N('evt_0123', '6B', 'xila_hagenong'),   // 同上
    N('evt_0124', '6B', 'xila_hagenong'),   // 卡利亚斯所统，不在库
    N('evt_0125', '6B', 'xila_hagenong'),   // 普拉提亚库内无势力
    B('evt_0126', '6B', 'gen_brasidas', 'attacker', 'xila', 'defender'),   // 修昔底德 II.86–92：福尔米奥以寡胜众
    N('evt_0127', '6B', 'gen_brasidas'),   // 米蒂利尼库内无势力
    N('evt_0128', '6B', 'gen_brasidas'),   // 普拉提亚库内无势力
    B('evt_0129', '6B', 'xila_demosthenes', 'defender', 'lagoniya', 'defender'),   // 修昔底德 III.105–108

    // ── 第 7A 棒 · 克里昂与尼西亚斯 ──
    B('evt_0130', '7A', 'xila_demosthenes', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'gen_brasidas' }),   // 修昔底德 IV.11–12：布拉西达斯抢滩负伤
    B('evt_0131', '7A', 'bfe2_cleon', 'attacker', 'lagoniya', 'attacker'),   // 修昔底德 IV.29–38
    N('evt_0132', '7A', 'bfe2_cleon'),   // 希波克拉底、帕贡达斯不在库
    N('evt_0133', '7A', 'xila_nixiyasi'),   // 门德不在据点 50km 内（最近奥林索斯属卡尔基季基）
    B('evt_0134', '7A', 'bfe2_cleon', 'attacker', 'lagoniya', 'defender', { enemyGeneralId: 'gen_brasidas' }),   // 修昔底德 V.6–11：两将俱殁，斯巴达胜
    N('evt_0135', '7A', 'xila_nixiyasi'),   // 斯基奥内库内无势力
    N('evt_0136', '7A', 'xila_alcibiades'),   // 埃皮道鲁斯不在据点 50km 内
    N('evt_0137', '7A', 'xila_alcibiades'),   // 阿基斯二世、拉凯斯不在库
    N('evt_0138', '7A', 'xila_alcibiades'),   // 同上
    N('evt_0139', '7A', 'xila_nixiyasi'),   // 米洛斯库内无势力
    // 修昔底德 VI.30–52：舰队自雅典经科西拉、利吉翁，以卡塔纳为基地；VI.67–70 阿纳波斯河畔首战雅典胜
    B('evt_0140', '7A', 'xila_nixiyasi', 'attacker', 'syracuse', 'attacker', { route: [p('科西拉', 39.62, 19.92), p('利吉翁', 38.11, 15.65), p('卡塔纳', 37.5, 15.09)] }),
    B('evt_0141', '7A', 'xila_nixiyasi', 'attacker', 'syracuse', 'defender', { city: at('city_syracuse', 'syracuse', 'syracuse') }),   // 修昔底德 VII.1–6：吉利普斯至，围墙被截
    B('evt_0142', '7A', 'xila_nixiyasi', 'defender', 'syracuse', 'attacker'),   // 修昔底德 VII.70–87

    // ── 第 7B 棒 · 亚西比德与吕山德 ──
    B('evt_0144', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》I.1.4–7
    B('evt_0145', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》I.1.11–18：明达罗斯战死
    B('evt_0148', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker', { city: at('city_junshitandingbao', 'lagoniya', 'xila') }),   // 色诺芬《希腊史》I.3.14–22
    N('evt_0150', '7B', 'gen_lysander'),   // 雅典诸将、卡利克拉提达斯不在库；亚西比德已去职
    // 色诺芬《希腊史》II.1.17–19：吕山德自罗得沿伊奥尼亚北航，取兰普萨库斯；II.1.21–28 羊河口全歼雅典舰队
    B('evt_0152', '7B', 'gen_lysander', 'attacker', 'xila', 'attacker', { enemyGeneralId: 'xila_feiluokelisi', route: [p('兰普萨库斯', 40.35, 26.69)] }),
    B('evt_0153', '7B', 'gen_lysander', 'attacker', 'xila', 'attacker', { city: at('city_yadian', 'xila', 'lagoniya') }),   // 色诺芬《希腊史》II.2.20–23
    N('evt_0155', '7B', 'gen_lysander'),   // 斯拉叙布卢斯不在库；雅典民主复辟（归属表 -403）
    N('evt_0156', '7B', 'gen_lysander'),   // 阿基斯二世不在库

    // ── 第 8A 棒 · 色诺芬与万人军 ──
    // 色诺芬《长征记》I.2–I.4：小居鲁士自撒狄出兵，经科洛赛、凯莱奈、塔尔苏斯、伊苏斯东进；I.8 库纳克萨小居鲁士战死
    B('evt_0157', '8A', 'xila_xenophon', 'attacker', 'aqimeinide', 'defender', {
        route: [p('撒狄', 38.49, 28.04), p('科洛赛', 37.79, 29.26), p('凯莱奈', 38.07, 30.17), p('塔尔苏斯', 36.92, 34.9), p('伊苏斯', 36.84, 36.2)] }),
    B('evt_0158', '8A', 'xila_xenophon', 'attacker', 'aqimeinide', 'attacker'),   // 《长征记》IV.1–IV.7：奥龙特斯为亚美尼亚总督
    B('evt_0159', '8A', 'bfe2_pharnabazus', 'defender', 'lagoniya', 'attacker', { city: at('city_teluoyi', 'aqimeinide', 'lagoniya') }),   // 色诺芬《希腊史》III.1.16–28

    // ── 第 8B 棒 · 科林斯战争 ──
    B('evt_0164', '8B', 'gen_lysander', 'attacker', 'boootiya', 'defender', { city: at('city_thebes', 'boootiya', 'boootiya') }),   // 色诺芬《希腊史》III.5.17–20：吕山德殁于哈利亚托斯城下
    B('evt_0165', '8B', 'bfe2_conon', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》IV.3.10–12
    B('evt_0166', '8B', 'bfe2_conon', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》IV.8.8：守军协议弃城
    N('evt_0168', '8B', 'bfe2_conon'),   // 伊菲克拉特斯不在库
    B('evt_0171', '8B', 'gen_chabrias', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》V.1.10–13：戈尔戈帕斯战死
    N('evt_0174', '8B', 'gen_epaminondas'),   // 曼丁尼亚库内无势力（普鲁塔克《佩洛皮达斯传》4：伊巴密浓达救佩洛皮达斯）

    // ── 第 9 棒 · 底比斯霸权 ──
    N('evt_0176', '9', 'gen_epaminondas'),   // 福比达斯不在库；卡德米亚被占（归属表 -382）
    N('evt_0177', '9', 'gen_epaminondas'),   // 特琉提亚斯不在库
    N('evt_0179', '9', 'gen_epaminondas'),   // 阿格西波利斯一世不在库
    B('evt_0180', '9', 'boootiya_pelopidas', 'attacker', 'lagoniya', 'attacker', { city: at('city_thebes', 'lagoniya', 'boootiya') }),   // 色诺芬《希腊史》V.4.2–12
    B('evt_0182', '9', 'gen_chabrias', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'bfe2_pollis' }),   // 狄奥多罗斯 XV.34–35
    B('evt_0183', '9', 'boootiya_pelopidas', 'attacker', 'lagoniya', 'attacker'),   // 普鲁塔克《佩洛皮达斯传》16–17
    N('evt_0184', '9', 'gen_epaminondas'),   // 提莫修斯不在库
    N('evt_0186', '9', 'gen_epaminondas'),   // 伊菲克拉特斯不在库
    B('evt_0187', '9', 'gen_epaminondas', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'bfe2_cleombrotus_i' }),   // 色诺芬《希腊史》VI.4.4–15
    N('evt_0188', '9', 'gen_epaminondas'),   // 色诺芬《希腊史》VI.5.27–32：阿格西劳斯拒不出战，无会战
    N('evt_0190', '9', 'gen_epaminondas'),   // 阿基达姆斯三世不在库
    N('evt_0192', '9', 'gen_epaminondas'),   // 提莫修斯不在库
    B('evt_0194', '9', 'boootiya_pelopidas', 'attacker', 'sesali', 'attacker'),   // 普鲁塔克《佩洛皮达斯传》32：费莱僭主亚历山大，佩洛皮达斯胜而战死
    N('evt_0195', '9', 'gen_epaminondas'),   // 提莫修斯不在库
    B('evt_0196', '9', 'gen_epaminondas', 'attacker', 'lagoniya', 'attacker', { enemyGeneralId: 'lagoniya_agesilaus' }),   // 色诺芬《希腊史》VII.5.18–27

    // ── 第 10 棒 · 腓力二世 ──
    N('evt_0198', '10', 'gen_philip_ii'),   // 佩尔狄卡斯三世、巴尔迪利斯不在库
    B('evt_0199', '10', 'gen_philip_ii', 'defender', 'xila', 'defender'),   // 狄奥多罗斯 XVI.3：阿尔盖乌斯率雅典曼提亚斯所部三千重步兵
    B('evt_0200', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.4：伊利里亚王巴尔迪利斯
    N('evt_0203', '10', 'gen_philip_ii'),   // 第三次神圣战争，腓力未参战
    N('evt_0204', '10', 'gen_philip_ii'),   // 梅托涅库内无势力（在佩拉据点内）
    B('evt_0206', '10', 'gen_philip_ii', 'attacker', 'phokis', 'attacker', { enemyGeneralId: 'phokis_aonuomakusi' }),   // 狄奥多罗斯 XVI.35
    N('evt_0209', '10', 'gen_philip_ii'),   // 斯塔吉拉落安菲波利斯据点，该据点时属马其顿
    B('evt_0210', '10', 'gen_philip_ii', 'attacker', 'chalkidike', 'attacker', { enemyGeneralId: 'chalkidike_lasiteniesi', city: at('city_aolinsuosi', 'chalkidike', 'maqidun') }),   // 狄奥多罗斯 XVI.53
    N('evt_0211', '10', 'gen_philip_ii'),   // 狄奥多罗斯 XVI.59：法莱库斯议降，无会战
    B('evt_0212', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.69：伊利里亚王普莱乌拉图斯
    B('evt_0216', '10', 'gen_philip_ii', 'attacker', 'seleisi', 'attacker'),   // 狄奥多罗斯 XVI.71
    B('evt_0219', '10', 'gen_philip_ii', 'attacker', 'sijitai', 'attacker', { enemyGeneralId: 'sijitai_ateas' }),   // 查士丁 IX.2
    B('evt_0220', '10', 'gen_philip_ii', 'attacker', 'boootiya', 'attacker', { enemyGeneralId: 'bfe2_theagenes' }),   // 狄奥多罗斯 XVI.85–86
    B('evt_0221', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.93：伊利里亚王普莱乌里亚斯

    // ── 第 11 棒 · 亚历山大 ──
    B('evt_0222', '11B', 'gen_parmenion', 'defender', 'aqimeinide', 'attacker', { enemyGeneralId: 'halikanasu_memnon' }),   // 波吕埃努斯 V.44.4（年份早于底比斯，提前）
    B('evt_0223', '11A', 'gen_alexander_great', 'attacker', 'boootiya', 'attacker', { enemyGeneralId: 'dibisi_phoinix', city: at('city_thebes', 'boootiya', 'maqidun') }),   // 阿里安 I.7–8
    // 阿里安 I.11–12：经安菲波利斯、塞斯托斯渡赫勒斯滂，谒伊利昂，东进格拉尼库斯
    B('evt_0224', '11B', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'aqimeinide_aerxitesi',
        route: [p('安菲波利斯', 40.82, 23.85), p('塞斯托斯', 40.23, 26.4), p('伊利昂', 39.96, 26.24)] }),
    // 阿里安 I.17–20：经撒狄、以弗所、米利都南下
    B('evt_0225', '11B', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'halikanasu_memnon', city: at('city_halikanasu', 'aqimeinide', 'maqidun'),
        route: [p('撒狄', 38.49, 28.04), p('以弗所', 37.94, 27.34), p('米利都', 37.53, 27.28)] }),
    // 阿里安 II.3–7：戈尔迪乌姆、安居拉，过奇里乞亚门至塔尔苏斯
    B('evt_0226', '11B', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'daliushi_iii',
        route: [p('戈尔迪乌姆', 39.65, 31.99), p('安居拉', 39.94, 32.86), p('塔尔苏斯', 36.92, 34.9)] }),
    // 阿里安 II.13–16：沿岸南下马拉托斯、比布鲁斯、西顿
    B('evt_0227', '11B', 'gen_alexander_great', 'attacker', 'kanan', 'attacker', { enemyGeneralId: 'kanan_azemier', city: at('city_tuile', 'kanan', 'maqidun'),
        route: [p('马拉托斯', 34.84, 35.9), p('比布鲁斯', 34.12, 35.65), p('西顿', 33.56, 35.37)] }),
    B('evt_0228', '11B', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'feilisidin_batisi', city: at('city_jiasa', 'aqimeinide', 'maqidun') }),   // 阿里安 II.25–27
    B('evt_0229', '11B', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'daliushi_iii', route: [p('推罗', 33.27, 35.2)] }),   // 阿里安 III.6–15：自推罗出兵
    B('evt_0231', '11C', 'gen_alexander_great', 'attacker', 'aqimeinide', 'attacker', { enemyGeneralId: 'aqimeinide_aertabazanuosi',
        route: [p('巴比伦', 32.54, 44.42), p('苏萨', 32.19, 48.25)] }),   // 阿里安 III.16–18
    B('evt_0232', '11C', 'gen_alexander_great', 'attacker', 'sijitai', 'attacker', { enemyGeneralId: 'sijitai_satraces' }),   // 阿里安 IV.4
    N('evt_0233', '11C', 'gen_alexander_great'),   // 科伊诺斯所统，亚历山大不在场
    B('evt_0234', '11C', 'gen_alexander_great', 'attacker', 'sogdian', 'attacker', { enemyGeneralId: 'suogediyana_arimazes', city: at('city_suogediyanayan', 'sogdian', 'maqidun') }),   // 阿里安 IV.18–19
    B('evt_0235', '11D', 'gen_alexander_great', 'attacker', 'bulu', 'attacker', { enemyGeneralId: 'gen_bolusi', route: [p('塔克西拉', 33.75, 72.82)] }),   // 阿里安 V.3–19
    B('evt_0236', '11D', 'gen_alexander_great', 'attacker', 'malli', 'attacker', { city: at('city_malisi', 'malli', 'maqidun') }),   // 阿里安 VI.8–11：马利人首领史失其名
    B('evt_0237', '11E', 'gen_alexander_great', 'attacker', 'kesaiya', 'attacker'),   // 阿里安 VII.15：科赛亚首领史失其名

    // ══ 第二段 · 继业者与战国秦汉（第 12—18 棒） ══
    // ── 第 12A 棒 · 拉米亚战争 ──
    N('evt_0238', '12A', 'maqidun_antipater'),   // 拉米亚落德尔斐据点，守方为马其顿，围城无易手
    B('evt_0239', '12A', 'maqidun_antipater', 'attacker', 'xila', 'attacker', { enemyGeneralId: 'xila_antiphilus' }),   // 狄奥多罗斯 XVIII.17
    // ── 第 12B 棒 · 继业者 ──
    N('evt_0240', '12B', 'maqidun_eumenes'),   // 克拉特罗斯与欧迈尼斯同属马其顿，库内同一势力，不开战
    B('evt_0242', '12B', 'gen_perdiccas', 'attacker', 'tuolemi', 'defender', { enemyGeneralId: 'tuolemi_tuolemi', city: at('city_peiluximu', 'tuolemi', 'tuolemi') }),   // 狄奥多罗斯 XVIII.33–36
    B('evt_0243', '12B', 'bfe_antigonus', 'attacker', 'maqidun', 'attacker', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XVIII.40
    B('evt_0246', '12B', 'bfe_antigonus', 'attacker', 'maqidun', 'draw', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XIX.26–31：胜负未分
    B('evt_0248', '12B', 'bfe_antigonus', 'attacker', 'maqidun', 'attacker', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XIX.39–43
    // ── 第 13A 棒 · 塞琉古与托勒密 ──
    B('evt_0253', '13A', 'tuolemi_tuolemi', 'attacker', 'antigonid', 'attacker', { enemyGeneralId: 'antigonid_demetrius' }),   // 狄奥多罗斯 XIX.80–85
    B('evt_0256', '13A', 'gen_seleucus_i', 'attacker', 'antigonid', 'attacker', { enemyGeneralId: 'bfe_antigonus' }),   // 波吕埃努斯 IV.9.1
    B('evt_0259', '13A', 'tuolemi_tuolemi', 'defender', 'antigonid', 'attacker', { enemyGeneralId: 'antigonid_demetrius' }),   // 狄奥多罗斯 XX.49–52
    N('evt_0260', '13A', 'antigonid_demetrius'),   // 罗得库内无势力
    B('evt_0261', '13B', 'gen_seleucus_i', 'attacker', 'kongque', 'defender', { enemyGeneralId: 'kongque_zhantuoluo' }),   // 阿庇安《叙利亚战争》55、斯特拉波 XV.2.9：割地议和
    // ── 第 14 棒 · 赵武灵王 ──
    N('evt_0262', '14', 'lingqiu_zhaowuling'),   // 中山库内无势力
    N('evt_0266', '14', 'lingqiu_zhaowuling'),   // 林胡、楼烦库内无势力
    N('evt_0270', '14', 'lingqiu_zhaowuling'),   // 中山库内无势力
    // ── 第 15A 棒 · 白起 ──
    N('evt_0272', '15A', 'xin_baiqi'),   // 新城落洛阳据点，时属周室
    B('evt_0273', '15A', 'xin_baiqi', 'attacker', 'han', 'attacker', { enemyGeneralId: 'han_baoyuan' }),   // 《史记·白起王翦列传》
    B('evt_0274', '15A', 'xin_baiqi', 'attacker', 'wei', 'attacker', { city: at('city_zhiguan', 'wei', 'qin') }),   // 《史记·白起王翦列传》：攻魏取垣
    B('evt_0282', '15A', 'yan_leyi', 'attacker', 'qi', 'attacker', { enemyGeneralId: 'bfe_chuzi' }),   // 《史记·乐毅列传》
    B('evt_0290', '15A', 'xin_baiqi', 'attacker', 'chuguo', 'attacker', { city: at('city_ying', 'chuguo', 'qin') }),   // 《史记·白起王翦列传》：拔郢
    B('evt_0295', '15A', 'xin_baiqi', 'attacker', 'wei', 'attacker'),   // 《史记·白起王翦列传》：芒卯走
    B('evt_0299', '15A', 'liguo_zhaoshe', 'defender', 'qin', 'defender', { enemyGeneralId: 'bfe3_7' }),   // 《史记·廉颇蔺相如列传》
    B('evt_0304', '15A', 'xin_baiqi', 'attacker', 'han', 'attacker'),   // 《史记·白起王翦列传》
    B('evt_0308', '15A', 'xin_baiqi', 'attacker', 'zhao', 'attacker', { enemyGeneralId: 'zhao_zhaokuo' }),   // 《史记·白起王翦列传》
    B('evt_0309', '15A', 'zhao_lianpo', 'defender', 'qin', 'defender', { city: at('city_handan', 'zhao', 'zhao') }),   // 《史记·白起王翦列传》：王陵攻邯郸不拔
    N('evt_0311', '15A', 'shang_weiwuji'),   // 援军击围城秦营，非攻城；《史记·魏公子列传》
    // ── 第 15B 棒 · 蒙骜、桓齮、李牧 ──
    N('evt_0312', '15B', 'qin_mengao'),   // 西周国库内无势力（归属表 -256 洛阳入秦）
    N('evt_0319', '15B', 'qin_mengao'),   // 东周国库内无势力
    B('evt_0320', '15B', 'qin_mengao', 'attacker', 'zhao', 'attacker', { city: at('city_taiyuan', 'zhao', 'qin') }),   // 《史记·秦本纪》庄襄王二年
    B('evt_0321', '15B', 'shang_weiwuji', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'qin_mengao' }),   // 《史记·魏公子列传》
    B('evt_0324', '15B', 'wuzhou_limu', 'attacker', 'xiongnu', 'attacker'),   // 《史记·廉颇蔺相如列传》附李牧
    B('evt_0328', '15B', 'chunshen_huangxie', 'attacker', 'qin', 'defender'),   // 《史记·春申君列传》
    B('evt_0333', '15B', 'qin_hengyi', 'attacker', 'zhao', 'attacker', { city: at('city_anyang', 'zhao', 'qin') }),   // 《史记·秦始皇本纪》十一年
    B('evt_0335', '15B', 'qin_hengyi', 'attacker', 'zhao', 'attacker'),   // 《史记·秦始皇本纪》十三年：斩扈辄
    B('evt_0336', '15B', 'wuzhou_limu', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'qin_hengyi' }),   // 《史记·廉颇蔺相如列传》
    B('evt_0337', '15B', 'wuzhou_limu', 'defender', 'qin', 'defender'),   // 同上
    // ── 第 16 棒 · 秦灭六国 ──
    N('evt_0338', '16', 'ruo_wangjian'),   // 内史腾不在库（归属表 -230 新郑入秦）
    B('evt_0340', '16', 'ruo_wangjian', 'attacker', 'zhao', 'attacker', { city: at('city_handan', 'zhao', 'qin') }),   // 《史记·秦始皇本纪》十九年
    B('evt_0342', '16', 'ruo_wangjian', 'attacker', 'yan', 'attacker', { city: at('city_beijing', 'yan', 'qin') }),   // 《史记·秦始皇本纪》二十一年：拔蓟
    N('evt_0343', '16', 'ruo_wangjian'),   // 王贲不在库（归属表 -225 大梁入秦）
    B('evt_0344', '16', 'gen_li_xin', 'defender', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13' }),   // 《史记·白起王翦列传》
    B('evt_0345', '16', 'ruo_wangjian', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13' }),   // 同上
    B('evt_0346', '16', 'ruo_wangjian', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13', city: at('city_shouxian', 'chuguo', 'qin') }),   // 同上
    B('evt_0348', '16', 'gen_li_xin', 'attacker', 'yan', 'attacker', { city: at('city_liaoyang', 'yan', 'qin') }),   // 《史记·秦始皇本纪》二十五年
    B('evt_0349', '16', 'baiyang_mengtian', 'attacker', 'qi', 'attacker', { city: at('city_linzi', 'qi', 'qin') }),   // 《史记·蒙恬列传》
    // ── 第 17 棒 · 北击匈奴、南平百越 ──
    B('evt_0352', '17', 'bfe3_14', 'defender', 'xiou', 'attacker', { enemyGeneralId: 'bfe3_16' }),   // 《淮南子·人间训》：杀尉屠睢
    B('evt_0357', '17', 'baiyang_mengtian', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'bfe_touman' }),   // 《史记·蒙恬列传》
    B('evt_0359', '17', 'nanyue_zhaotuo', 'attacker', 'xiou', 'attacker', { city: at('city_panyu', 'xiou', 'qin') }),   // 《史记·南越列传》
    B('evt_0365', '17', 'zhangchu_chensheng', 'attacker', 'qin', 'attacker', { city: at('city_huaiyang', 'qin', 'zhangchu') }),   // 《史记·陈涉世家》
    // ── 第 18 棒 · 楚汉 ──
    B('evt_0366', '18', 'wazhai_zhanghan', 'defender', 'zhangchu', 'defender'),   // 《史记·陈涉世家》
    B('evt_0367', '18', 'wazhai_zhanghan', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'bfe_xiangliang' }),   // 《史记·项羽本纪》
    B('evt_0368', '18', 'xichu_xiangyu', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'bfe3_17' }),   // 同上
    B('evt_0371', '18', 'han_d_liubang', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'wazhai_zhanghan' }),   // 《史记·高祖本纪》
    B('evt_0372', '18', 'xichu_xiangyu', 'attacker', 'han_d', 'attacker', { enemyGeneralId: 'han_d_liubang' }),   // 《史记·项羽本纪》
    B('evt_0373', '18', 'xianyu_hanxin', 'attacker', 'zhao', 'attacker', { enemyGeneralId: 'bfe3_18' }),   // 《史记·淮阴侯列传》
    B('evt_0374', '18', 'xianyu_hanxin', 'attacker', 'chuguo', 'attacker'),   // 同上：斩龙且
    B('evt_0375', '18', 'han_d_liubang', 'attacker', 'chuguo', 'attacker'),   // 《史记·项羽本纪》：曹咎自刭汜水
    B('evt_0377', '18', 'xianyu_hanxin', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'xichu_xiangyu' }),   // 《史记·高祖本纪》
    B('evt_0378', '18', 'xiongnu_maodun', 'attacker', 'han_d', 'attacker', { city: at('city_ningwuguan', 'han_d', 'xiongnu') }),   // 《史记·韩信卢绾列传》：韩王信以马邑降
    B('evt_0380', '18', 'han_d_liubang', 'defender', 'xiongnu', 'draw', { enemyGeneralId: 'xiongnu_maodun' }),   // 《史记·匈奴列传》：围七日解围，遂和亲
];
