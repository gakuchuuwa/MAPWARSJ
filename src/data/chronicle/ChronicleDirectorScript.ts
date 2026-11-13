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
 * 主线每场都开战：玩家去该场出发据点找随行主将（路上念战略播报）→ 随军行军（有史载途经地按站走）→ 战场进战术模式（念战术播报）。
 * 同一主将连战：军团自上一战场续行；换主将：战后离队去下一场出发据点。
 * 史无两军交战的不收；据点代表方圆 50km，被攻城落在某据点 50km 内即按该据点打；同据点同场战争只留最知名一场（注「不收」）；
 * 距现有据点均超过 50km 的注「待定」（须新建据点）。
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
    /** 出发据点：玩家到此与随行主将会合、军团自此起兵（不填＝主将所挂据点）；同一主将连战时军团自上一战场续行，不用此项 */
    from?: string;
    /** 史载行军途经地（按先后，不含出发据点与战场本身）；每站须有史料出处（写在注释） */
    route?: { name: string; lat: number; lng: number }[];
}

type Win = 'attacker' | 'defender' | 'draw';
/** 打：随行主将、站边、对手势力、史载胜方；其余（对手武将 / 据点 / 途经）放 more */
const B = (eventId: string, baton: string, leadGeneralId: string, role: 'attacker' | 'defender', enemyFactionId: string, winner: Win,
    more: Partial<ChronicleScriptEntry> = {}): ChronicleScriptEntry => ({ eventId, baton, leadGeneralId, kind: 'battle', role, enemyFactionId, winner, ...more });
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
    { eventId: 'evt_0009', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'battle', role: 'attacker', enemyFactionId: 'lycia', winner: 'attacker', city: { cityId: 'city_xanthos', before: 'lycia', after: 'aqimeinide' } },   // 希罗多德 I.176：克桑托斯人焚家室后出战尽殁
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
    // ── 第 3 棒 · 大流士 ──
    // 贝希斯敦铭文 §18–20：扎扎纳胜，攻取巴比伦
    // 途经：贝希斯敦铭文 §18「尼丁图-贝尔之军据底格里斯河，朕渡河击之」（渡口位置史失，取巴比伦以北河段）
    // 出发：贝希斯敦铭文 §13–18：大流士于米底诛高墨达，自米底赴巴比伦
    { eventId: 'evt_0031', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', from: 'city_hamadan', role: 'attacker', enemyFactionId: 'jialedi', enemyGeneralId: 'bfe2_nidintu_bel',
        winner: 'attacker', city: { cityId: 'city_babilun', before: 'jialedi', after: 'aqimeinide' },
        route: [{ name: '底格里斯河', lat: 33.35, lng: 44.4 }] },
    // 贝希斯敦铭文 §31–32：昆杜鲁什胜，弗拉奥尔特斯于埃克巴坦那受刑
    { eventId: 'evt_0032', baton: 3, leadGeneralId: 'aqimeinide_daliushi', kind: 'battle', role: 'attacker', enemyFactionId: 'midi', enemyGeneralId: 'midi_phraortes',
        winner: 'attacker', city: { cityId: 'city_hamadan', before: 'midi', after: 'aqimeinide' } },
    // 希罗多德 IV.143–144、V.1–2：梅加巴佐斯留统欧罗巴之军，先破佩林索斯，再西进色雷斯；V.12–17 斯特鲁马河征服佩奥尼亚
    { eventId: 'evt_0041', baton: 3, leadGeneralId: 'aqimeinide_megabazus', kind: 'battle', role: 'attacker', enemyFactionId: 'paeonia', winner: 'attacker',
        route: [{ name: '佩林索斯', lat: 40.98, lng: 27.96 }] },
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
    B('evt_0084', '4', 'lagoniya_leotychidas', 'attacker', 'aqimeinide', 'attacker', { route: [p('萨摩斯', 37.69, 26.94)] }),   // 希罗多德 IX.90–106：自提洛航萨摩斯，米卡列登岸破波斯营
    // 修昔底德 I.94：希腊联军先平塞浦路斯，再围拜占庭克之，城归斯巴达摄政帕萨尼亚斯所统联军
    B('evt_0085', '4', 'gen_aristides', 'attacker', 'aqimeinide', 'attacker', { city: at('city_junshitandingbao', 'aqimeinide', 'lagoniya') }),

    // ── 第 5 棒 · 客蒙与提洛同盟 ──
    B('evt_0087', '5', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker', { city: at('city_anfeibolisi', 'aqimeinide', 'xila') }),   // 埃伊翁在安菲波利斯据点 50km 内；希罗多德 VII.107、修昔底德 I.98
    B('evt_0088', '5', 'xila_cimon', 'attacker', 'dolopes', 'attacker', { city: at('city_skyros', 'dolopes', 'xila') }),   // 修昔底德 I.98；普鲁塔克《客蒙传》8
    B('evt_0092', '5', 'xila_cimon', 'attacker', 'naxos', 'attacker', { city: at('city_chimarros', 'naxos', 'xila') }),   // 修昔底德 I.98：纳克索斯叛盟，被围降服
    // 普鲁塔克《客蒙传》12：客蒙自克尼多斯、法塞利斯出航，于欧律墨冬河口水陆两胜
    B('evt_0094', '5', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker', { route: [p('克尼多斯', 36.69, 27.37), p('法塞利斯', 36.52, 30.55)] }),
    B('evt_0095', '5', 'xila_cimon', 'attacker', 'thasos', 'attacker'),   // 修昔底德 I.100：海战胜，登岛围城
    B('evt_0096', '5', 'lagoniya_archidamus_ii', 'defender', 'messenia', 'defender', { city: at('city_sparta', 'lagoniya', 'lagoniya') }),   // 普鲁塔克《客蒙传》16：地震后黑劳士来攻斯巴达，阿基达穆斯集众击退，起事者退据伊托美
    B('evt_0097', '5', 'xila_cimon', 'attacker', 'thasos', 'attacker', { city: at('city_thasos', 'thasos', 'xila') }),   // 修昔底德 I.101：围三年降，拆墙交舰

    // ── 第 6A 棒 · 伯里克利 ──
    B('evt_0102', '6A', 'xila_pericles', 'attacker', 'lagoniya', 'defender'),   // 普鲁塔克《伯里克利传》10：伯里克利身与塔纳格拉之战；修昔底德 I.108 斯巴达胜
    B('evt_0103', '6A', 'xila_myronides', 'attacker', 'boootiya', 'attacker'),   // 修昔底德 I.108
    B('evt_0105', '6A', 'xila_tolmides', 'attacker', 'lagoniya', 'attacker'),   // 修昔底德 I.108；狄奥多罗斯 XI.84
    B('evt_0109', '6A', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker'),   // 修昔底德 I.112：客蒙卒于围基提翁，舰队于萨拉米斯水陆两胜
    B('evt_0111', '6A', 'xila_tolmides', 'defender', 'boootiya', 'attacker'),   // 修昔底德 I.113：托尔米德斯战死
    B('evt_0112', '6A', 'xila_pericles', 'attacker', 'chalcis', 'attacker', { city: at('city_thebes', 'chalcis', 'xila') }),   // 修昔底德 I.114：伯里克利平优卑亚；卡尔基斯在底比斯据点 50km 内
    B('evt_0117', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker'),   // 修昔底德 I.116：特拉吉亚海战伯里克利胜萨摩斯（伊奥尼亚城邦）
    B('evt_0118', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker', { city: at('city_miletus', 'aiaoniya', 'xila') }),   // 修昔底德 I.117：围九月降；萨摩斯在米利都据点 50km 内

    // ── 第 6B 棒 · 伯罗奔尼撒战争前夜 ──
    B('evt_0121', '6B', 'xila_hagenong', 'attacker', 'seleisi', 'attacker', { city: at('city_anfeibolisi', 'seleisi', 'xila') }),   // 修昔底德 IV.102：哈格农逐埃多尼人，建安菲波利斯
    B('evt_0122', '6B', 'corinth_timanor', 'attacker', 'corcyra', 'defender'),   // 修昔底德 I.29–30：科西拉胜
    B('evt_0123', '6B', 'corinth_xenocleides', 'attacker', 'corcyra', 'attacker'),   // 修昔底德 I.46–54：科林斯胜，雅典援舰至乃退
    B('evt_0124', '6B', 'xila_callias', 'attacker', 'chalkidike', 'attacker'),   // 修昔底德 I.58–63：波提狄亚与卡尔基季基人同叛，卡利亚斯地峡会战胜而阵亡
    // 不收：evt_0125 普拉提亚夜袭（同据点同场战争只留最知名一场，留 evt_0128 普拉提亚之围）
    // 出发：修昔底德 II.84–86：伯罗奔尼撒舰队集结于埃利斯之基利尼
    B('evt_0126', '6B', 'gen_brasidas', 'attacker', 'xila', 'defender', { from: 'city_aolinpiya' }),   // 修昔底德 II.86–92：福尔米奥以寡胜众
    B('evt_0127', '6B', 'xila_paches', 'attacker', 'mytilene', 'attacker', { city: at('city_mytilene', 'mytilene', 'xila') }),   // 修昔底德 III.18、III.27–28：筑墙围城，萨莱托斯所领斯巴达援军未至，城降
    B('evt_0128', '6B', 'lagoniya_archidamus_ii', 'attacker', 'plataea', 'attacker', { city: at('city_thebes', 'plataea', 'boootiya') }),   // 修昔底德 II.71–78、III.52–68：围二年陷城，地归底比斯；普拉提亚在底比斯据点 50km 内
    // 出发：修昔底德 III.105–107：德摩斯梯尼自瑙帕克都赴援（最近据点德尔斐）
    B('evt_0129', '6B', 'xila_demosthenes', 'defender', 'lagoniya', 'defender', { from: 'city_deerfei' }),   // 修昔底德 III.105–108

    // ── 第 7A 棒 · 克里昂与尼西亚斯 ──
    B('evt_0130', '7A', 'xila_demosthenes', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'gen_brasidas' }),   // 修昔底德 IV.11–12：布拉西达斯抢滩负伤
    B('evt_0131', '7A', 'bfe2_cleon', 'attacker', 'lagoniya', 'attacker'),   // 修昔底德 IV.29–38
    B('evt_0132', '7A', 'boootiya_pagondas', 'attacker', 'xila', 'attacker'),   // 修昔底德 IV.91–96
    // 不收：evt_0133 门德（同据点同场战争只留最知名一场，留 evt_0135 斯基奥内）
    // 途经：修昔底德 V.2–3：克里昂先取托罗尼，再至埃伊翁
    B('evt_0134', '7A', 'bfe2_cleon', 'attacker', 'lagoniya', 'defender', { enemyGeneralId: 'gen_brasidas', route: [p('托罗尼', 39.98, 23.89)] }),   // 修昔底德 V.6–11：两将俱殁，斯巴达胜
    B('evt_0135', '7A', 'xila_nixiyasi', 'attacker', 'lagoniya', 'attacker', { from: 'city_yadian', city: at('city_aolinsuosi', 'lagoniya', 'xila') }),   // 修昔底德 IV.123、V.32：波吕达米达斯所留伯罗奔尼撒守军，城破；斯基奥内在奥林索斯据点 50km 内
    B('evt_0136', '7A', 'xila_alcibiades', 'attacker', 'epidaurus', 'defender', { city: at('city_corinth', 'epidaurus', 'epidaurus') }),   // 修昔底德 V.53–56：围攻不克；埃皮道鲁斯在科林斯据点 50km 内
    B('evt_0137', '7A', 'lagoniya_agis_ii', 'attacker', 'argos', 'attacker'),   // 修昔底德 V.65–74
    // 不收：evt_0138 希西亚伊（与 evt_0136 同落科林斯据点、同场战争，只留最知名一场）
    B('evt_0139', '7A', 'xila_cleomedes', 'attacker', 'melos', 'attacker', { city: at('city_melos', 'melos', 'xila') }),   // 修昔底德 V.84–116
    // 修昔底德 VI.30–52：舰队自雅典经科西拉、利吉翁，以卡塔纳为基地；VI.67–70 阿纳波斯河畔首战雅典胜
    // 出发：修昔底德 VI.30–32：舰队自比雷埃夫斯出航
    B('evt_0140', '7A', 'xila_nixiyasi', 'attacker', 'syracuse', 'attacker', { route: [p('科西拉', 39.62, 19.92), p('利吉翁', 38.11, 15.65), p('卡塔纳', 37.5, 15.09)], from: 'city_yadian' }),
    B('evt_0141', '7A', 'xila_nixiyasi', 'attacker', 'syracuse', 'defender', { city: at('city_syracuse', 'syracuse', 'syracuse') }),   // 修昔底德 VII.1–6：吉利普斯至，围墙被截
    B('evt_0142', '7A', 'xila_nixiyasi', 'defender', 'syracuse', 'attacker'),   // 修昔底德 VII.70–87

    // ── 第 7B 棒 · 亚西比德与吕山德 ──
    // 出发：修昔底德 VIII.79–100：雅典舰队以萨摩斯为基地（在米利都据点内）
    B('evt_0144', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker', { from: 'city_miletus' }),   // 色诺芬《希腊史》I.1.4–7
    B('evt_0145', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》I.1.11–18：明达罗斯战死
    B('evt_0148', '7B', 'xila_alcibiades', 'attacker', 'lagoniya', 'attacker', { city: at('city_junshitandingbao', 'lagoniya', 'xila') }),   // 色诺芬《希腊史》I.3.14–22
    B('evt_0150', '7B', 'lagoniya_callicratidas', 'defender', 'xila', 'attacker'),   // 色诺芬《希腊史》I.6.26–33
    // 色诺芬《希腊史》II.1.17–19：吕山德自罗得沿伊奥尼亚北航，取兰普萨库斯；II.1.21–28 羊河口全歼雅典舰队
    // 出发：色诺芬《希腊史》II.1.15–17：吕山德自罗得北航
    B('evt_0152', '7B', 'gen_lysander', 'attacker', 'xila', 'attacker', { enemyGeneralId: 'xila_feiluokelisi', route: [p('兰普萨库斯', 40.35, 26.69)], from: 'city_rhodes' }),
    B('evt_0153', '7B', 'gen_lysander', 'attacker', 'xila', 'attacker', { city: at('city_yadian', 'xila', 'lagoniya') }),   // 色诺芬《希腊史》II.2.20–23
    B('evt_0155', '7B', 'xila_thrasybulus', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》II.4.10–19：三十僭主恃斯巴达驻军，克里提亚斯战死
    B('evt_0156', '7B', 'lagoniya_agis_ii', 'attacker', 'yilisi', 'attacker'),   // 色诺芬《希腊史》III.2.21–31：伊利斯求和

    // ── 第 8A 棒 · 色诺芬与万人军 ──
    // 色诺芬《长征记》I.2–I.4：小居鲁士自撒狄出兵，经科洛赛、凯莱奈、塔尔苏斯、伊苏斯东进；I.8 库纳克萨小居鲁士战死
    // 出发：《长征记》III.1.4–8：色诺芬应普罗克塞努斯之招赴撒狄从军
    B('evt_0157', '8A', 'xila_xenophon', 'attacker', 'aqimeinide', 'defender', { from: 'city_sifaerde',
        route: [p('科洛赛', 37.79, 29.26), p('凯莱奈', 38.07, 30.17), p('塔尔苏斯', 36.92, 34.9), p('伊苏斯', 36.84, 36.2)] }),
    B('evt_0158', '8A', 'xila_xenophon', 'attacker', 'aqimeinide', 'attacker'),   // 《长征记》IV.1–IV.7：奥龙特斯为亚美尼亚总督
    // 出发：法那巴佐斯为赫勒斯滂弗里吉亚总督，治达斯基利翁（色诺芬《希腊史》IV.1.15）
    B('evt_0159', '8A', 'bfe2_pharnabazus', 'defender', 'lagoniya', 'attacker', { city: at('city_teluoyi', 'aqimeinide', 'lagoniya'), from: 'city_dasijiliweng' }),   // 色诺芬《希腊史》III.1.16–28

    // ── 第 8B 棒 · 科林斯战争 ──
    // 出发：色诺芬《希腊史》III.5.6–17：吕山德先至福基斯集兵，再攻哈利亚托斯
    B('evt_0164', '8B', 'gen_lysander', 'attacker', 'boootiya', 'defender', { city: at('city_thebes', 'boootiya', 'boootiya'), from: 'city_deerfei' }),   // 色诺芬《希腊史》III.5.17–20：吕山德殁于哈利亚托斯城下
    // 出发：狄奥多罗斯 XIV.83：科农自洛里马出航（在罗得据点内）
    B('evt_0165', '8B', 'bfe2_conon', 'attacker', 'lagoniya', 'attacker', { from: 'city_rhodes' }),   // 色诺芬《希腊史》IV.3.10–12
    B('evt_0166', '8B', 'bfe2_conon', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》IV.8.8：守军协议弃城
    B('evt_0168', '8B', 'xila_iphicrates', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》IV.5.11–17
    B('evt_0171', '8B', 'gen_chabrias', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》V.1.10–13：戈尔戈帕斯战死
    B('evt_0174', '8B', 'lagoniya_agesipolis_i', 'attacker', 'mantinea', 'attacker', { city: at('city_mantinea', 'mantinea', 'lagoniya') }),   // 色诺芬《希腊史》V.2.1–7：壅奥菲斯河冲毁城墙，析为四村

    // ── 第 9 棒 · 底比斯霸权 ──
    B('evt_0176', '9', 'lagoniya_phoebidas', 'attacker', 'boootiya', 'attacker', { city: at('city_thebes', 'boootiya', 'lagoniya') }),   // 色诺芬《希腊史》V.2.25–31
    B('evt_0177', '9', 'lagoniya_teleutias', 'attacker', 'chalkidike', 'defender'),   // 色诺芬《希腊史》V.3.3–6
    B('evt_0179', '9', 'lagoniya_agesipolis_i', 'attacker', 'chalkidike', 'attacker', { city: at('city_torone', 'chalkidike', 'lagoniya') }),   // 色诺芬《希腊史》V.3.18
    B('evt_0180', '9', 'boootiya_pelopidas', 'attacker', 'lagoniya', 'attacker', { city: at('city_thebes', 'lagoniya', 'boootiya') }),   // 色诺芬《希腊史》V.4.2–12
    B('evt_0182', '9', 'gen_chabrias', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'bfe2_pollis' }),   // 狄奥多罗斯 XV.34–35
    B('evt_0183', '9', 'boootiya_pelopidas', 'attacker', 'lagoniya', 'attacker'),   // 普鲁塔克《佩洛皮达斯传》16–17
    B('evt_0184', '9', 'xila_timotheus', 'defender', 'lagoniya', 'defender'),   // 色诺芬《希腊史》V.4.63–66
    B('evt_0186', '9', 'xila_iphicrates', 'attacker', 'lagoniya', 'attacker'),   // 色诺芬《希腊史》VI.2.27–38
    B('evt_0187', '9', 'gen_epaminondas', 'defender', 'lagoniya', 'defender', { enemyGeneralId: 'bfe2_cleombrotus_i' }),   // 色诺芬《希腊史》VI.4.4–15
    B('evt_0190', '9', 'lagoniya_archidamus_iii', 'attacker', 'arcadia', 'attacker'),   // 色诺芬《希腊史》VII.1.28–32；战场在斯巴达据点 50km 内
    B('evt_0192', '9', 'xila_timotheus', 'attacker', 'aqimeinide', 'attacker', { city: at('city_miletus', 'aqimeinide', 'xila') }),   // 伊索克拉底《论财产交换》111；狄奥多罗斯 XV.47：围十月下之；萨摩斯在米利都据点 50km 内
    B('evt_0194', '9', 'boootiya_pelopidas', 'attacker', 'sesali', 'attacker'),   // 普鲁塔克《佩洛皮达斯传》32：费莱僭主亚历山大，佩洛皮达斯胜而战死
    B('evt_0195', '9', 'xila_timotheus', 'attacker', 'chalkidike', 'attacker', { city: at('city_aolinsuosi', 'chalkidike', 'xila') }),   // 狄奥多罗斯 XV.81：提莫修斯取托罗尼、波提狄亚；两城在奥林索斯据点 50km 内
    B('evt_0196', '9', 'gen_epaminondas', 'attacker', 'lagoniya', 'attacker', { enemyGeneralId: 'lagoniya_agesilaus' }),   // 色诺芬《希腊史》VII.5.18–27

    // ── 第 10 棒 · 腓力二世 ──
    B('evt_0198', '10', 'yili_bardylis', 'attacker', 'maqidun', 'attacker'),   // 狄奥多罗斯 XVI.2：佩尔狄卡斯三世战死
    B('evt_0199', '10', 'gen_philip_ii', 'defender', 'xila', 'defender'),   // 狄奥多罗斯 XVI.3：阿尔盖乌斯率雅典曼提亚斯所部三千重步兵
    B('evt_0200', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.4：伊利里亚王巴尔迪利斯
    B('evt_0203', '10', 'phokis_feiluomoluosi', 'defender', 'boootiya', 'attacker'),   // 狄奥多罗斯 XVI.30–31：菲洛墨洛斯坠崖死
    B('evt_0204', '10', 'gen_philip_ii', 'attacker', 'methone', 'attacker', { city: at('city_salonica', 'methone', 'maqidun') }),   // 狄奥多罗斯 XVI.34：腓力围梅托涅失一目，陷城夷之；梅托涅在佩拉据点 50km 内
    B('evt_0206', '10', 'gen_philip_ii', 'attacker', 'phokis', 'attacker', { enemyGeneralId: 'phokis_aonuomakusi' }),   // 狄奥多罗斯 XVI.35
    B('evt_0209', '10', 'gen_philip_ii', 'attacker', 'chalkidike', 'attacker', { enemyGeneralId: 'chalkidike_outikelatesi', city: at('city_anfeibolisi', 'chalkidike', 'maqidun') }),   // 狄奥多罗斯 XVI.52；斯塔吉拉在安菲波利斯据点 50km 内
    B('evt_0210', '10', 'gen_philip_ii', 'attacker', 'chalkidike', 'attacker', { enemyGeneralId: 'chalkidike_lasiteniesi', city: at('city_aolinsuosi', 'chalkidike', 'maqidun') }),   // 狄奥多罗斯 XVI.53
    B('evt_0212', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.69：伊利里亚王普莱乌拉图斯
    B('evt_0216', '10', 'gen_philip_ii', 'attacker', 'seleisi', 'attacker'),   // 狄奥多罗斯 XVI.71
    B('evt_0219', '10', 'gen_philip_ii', 'attacker', 'sijitai', 'attacker', { enemyGeneralId: 'sijitai_ateas' }),   // 查士丁 IX.2
    B('evt_0220', '10', 'gen_philip_ii', 'attacker', 'boootiya', 'attacker', { enemyGeneralId: 'bfe2_theagenes' }),   // 狄奥多罗斯 XVI.85–86
    B('evt_0221', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.93：伊利里亚王普莱乌里亚斯

    // ── 第 11 棒 · 亚历山大 ──
    // 出发：狄奥多罗斯 XVI.91、XVII.7：帕曼纽先遣军渡海驻小亚
    B('evt_0222', '11B', 'gen_parmenion', 'defender', 'aqimeinide', 'attacker', { enemyGeneralId: 'halikanasu_memnon', from: 'city_teluoyi' }),   // 波吕埃努斯 V.44.4（年份早于底比斯，提前）
    // 出发：阿里安 I.5–7：亚历山大自伊利里亚佩利昂回师南下
    B('evt_0223', '11A', 'gen_alexander_great', 'attacker', 'boootiya', 'attacker', { enemyGeneralId: 'dibisi_phoinix', city: at('city_thebes', 'boootiya', 'maqidun'), from: 'city_peiliang' }),   // 阿里安 I.7–8
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
    B('evt_0233', '11C', 'maqidun_coenus', 'defender', 'sogdian', 'defender', { enemyGeneralId: 'sute_spitamenes' }),   // 阿里安 IV.17
    // 出发：阿里安 IV.18：冬驻诺塔卡，开春进攻粟特岩
    B('evt_0234', '11C', 'gen_alexander_great', 'attacker', 'sogdian', 'attacker', { enemyGeneralId: 'suogediyana_arimazes', city: at('city_suogediyanayan', 'sogdian', 'maqidun'), from: 'city_nuotaka' }),   // 阿里安 IV.18–19
    B('evt_0235', '11D', 'gen_alexander_great', 'attacker', 'bulu', 'attacker', { enemyGeneralId: 'gen_bolusi', route: [p('塔克西拉', 33.75, 72.82)] }),   // 阿里安 V.3–19
    B('evt_0236', '11D', 'gen_alexander_great', 'attacker', 'malli', 'attacker', { city: at('city_malisi', 'malli', 'maqidun') }),   // 阿里安 VI.8–11：马利人首领史失其名
    B('evt_0237', '11E', 'gen_alexander_great', 'attacker', 'kesaiya', 'attacker'),   // 阿里安 VII.15：科赛亚首领史失其名

    // ══ 第二段 · 继业者与战国秦汉（第 12—18 棒） ══
    // ── 第 12A 棒 · 拉米亚战争 ──
    B('evt_0238', '12A', 'maqidun_antipater', 'defender', 'xila', 'defender', { enemyGeneralId: 'xila_leosthenes', city: at('city_deerfei', 'maqidun', 'maqidun') }),   // 狄奥多罗斯 XVIII.12–15：莱奥斯塞尼斯殁于围城，安提帕特待援突围；拉米亚在德尔斐据点 50km 内
    B('evt_0239', '12A', 'maqidun_antipater', 'attacker', 'xila', 'attacker', { enemyGeneralId: 'xila_antiphilus' }),   // 狄奥多罗斯 XVIII.17
    // ── 第 12B 棒 · 继业者 ──
    B('evt_0240', '12B', 'maqidun_craterus', 'attacker', 'macedon_royal', 'defender', { enemyGeneralId: 'maqidun_eumenes', from: 'city_teluoyi' }),   // 狄奥多罗斯 XVIII.29–32：克拉特罗斯渡赫勒斯滂入亚洲，为欧迈尼斯所败阵亡
    // 出发：狄奥多罗斯 XVIII.29–33：佩尔狄卡斯自奇里乞亚进兵埃及
    B('evt_0242', '12B', 'gen_perdiccas', 'attacker', 'tuolemi', 'defender', { enemyGeneralId: 'tuolemi_tuolemi', city: at('city_peiluximu', 'tuolemi', 'tuolemi'), from: 'city_adana' }),   // 狄奥多罗斯 XVIII.33–36
    B('evt_0243', '12B', 'bfe_antigonus', 'attacker', 'macedon_royal', 'attacker', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XVIII.40
    B('evt_0246', '12B', 'bfe_antigonus', 'attacker', 'macedon_royal', 'draw', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XIX.26–31：胜负未分
    B('evt_0248', '12B', 'bfe_antigonus', 'attacker', 'macedon_royal', 'attacker', { enemyGeneralId: 'maqidun_eumenes' }),   // 狄奥多罗斯 XIX.39–43
    // ── 第 13A 棒 · 塞琉古与托勒密 ──
    B('evt_0253', '13A', 'tuolemi_tuolemi', 'attacker', 'antigonid', 'attacker', { enemyGeneralId: 'antigonid_demetrius' }),   // 狄奥多罗斯 XIX.80–85
    // 出发：狄奥多罗斯 XIX.91–92：塞琉古已复据巴比伦
    B('evt_0256', '13A', 'gen_seleucus_i', 'attacker', 'antigonid', 'attacker', { enemyGeneralId: 'bfe_antigonus', from: 'city_babilun' }),   // 波吕埃努斯 IV.9.1
    B('evt_0259', '13A', 'tuolemi_tuolemi', 'defender', 'antigonid', 'attacker', { enemyGeneralId: 'antigonid_demetrius' }),   // 狄奥多罗斯 XX.49–52
    // 出发：狄奥多罗斯 XX.82：德米特里集结于卡里亚海岸洛里马
    B('evt_0260', '13A', 'antigonid_demetrius', 'attacker', 'rhodes', 'defender', { city: at('city_rhodes', 'rhodes', 'rhodes'), from: 'city_halikanasu' }),   // 狄奥多罗斯 XX.81–99
    // 出发：查士丁 XV.4：塞琉古平巴克特里亚后南下印度
    B('evt_0261', '13B', 'gen_seleucus_i', 'attacker', 'kongque', 'defender', { enemyGeneralId: 'kongque_zhantuoluo', from: 'city_lanshi' }),   // 阿庇安《叙利亚战争》55、斯特拉波 XV.2.9：割地议和
    // ── 第 14 棒 · 赵武灵王 ──
    B('evt_0262', '14', 'lingqiu_zhaowuling', 'attacker', 'zhongshan', 'attacker', { city: at('city_daomaguan', 'zhongshan', 'zhao') }),   // 《史记·赵世家》
    B('evt_0266', '14', 'lingqiu_zhaowuling', 'attacker', 'linhu', 'attacker'),   // 《史记·赵世家》：破林胡、楼烦
    B('evt_0270', '14', 'lingqiu_zhaowuling', 'attacker', 'zhongshan', 'attacker', { city: at('city_zhending', 'zhongshan', 'zhao') }),   // 《史记·赵世家》：灵寿在真定据点 50km 内
    // ── 第 15A 棒 · 白起 ──
    B('evt_0272', '15A', 'xin_baiqi', 'attacker', 'han', 'attacker', { city: at('city_luoyang', 'han', 'qin') }),   // 《史记·白起王翦列传》：攻韩新城；新城在洛阳据点 50km 内
    B('evt_0273', '15A', 'xin_baiqi', 'attacker', 'han', 'attacker', { enemyGeneralId: 'han_baoyuan' }),   // 《史记·白起王翦列传》
    B('evt_0274', '15A', 'xin_baiqi', 'attacker', 'wei', 'attacker', { city: at('city_zhiguan', 'wei', 'qin') }),   // 《史记·白起王翦列传》：攻魏取垣
    // 出发：《史记·乐毅列传》：乐毅自燕统五国之兵
    B('evt_0282', '15A', 'yan_leyi', 'attacker', 'qi', 'attacker', { enemyGeneralId: 'bfe_chuzi', from: 'city_beijing' }),   // 《史记·乐毅列传》
    // 途经：《史记·秦本纪》：二十八年拔鄢，二十九年拔郢
    B('evt_0290', '15A', 'xin_baiqi', 'attacker', 'chuguo', 'attacker', { city: at('city_ying', 'chuguo', 'qin'), route: [p('鄢', 31.72, 112.26)] }),   // 《史记·白起王翦列传》：拔郢
    B('evt_0295', '15A', 'xin_baiqi', 'attacker', 'wei', 'attacker'),   // 《史记·白起王翦列传》：芒卯走
    // 出发：《史记·廉颇蔺相如列传》：赵奢去邯郸三十里坚壁
    B('evt_0299', '15A', 'liguo_zhaoshe', 'defender', 'qin', 'defender', { enemyGeneralId: 'bfe3_7', from: 'city_handan' }),   // 《史记·廉颇蔺相如列传》
    B('evt_0304', '15A', 'xin_baiqi', 'attacker', 'han', 'attacker'),   // 《史记·白起王翦列传》
    B('evt_0308', '15A', 'xin_baiqi', 'attacker', 'zhao', 'attacker', { enemyGeneralId: 'zhao_zhaokuo' }),   // 《史记·白起王翦列传》
    B('evt_0309', '15A', 'zhao_lianpo', 'defender', 'qin', 'defender', { city: at('city_handan', 'zhao', 'zhao') }),   // 《史记·白起王翦列传》：王陵攻邯郸不拔
    B('evt_0311', '15A', 'shang_weiwuji', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'bfe3_9' }),   // 《史记·魏公子列传》：城外击秦围营，野战
    // ── 第 15B 棒 · 蒙骜、桓齮、李牧 ──
    B('evt_0312', '15B', 'qin_jiu', 'attacker', 'zhou', 'attacker', { city: at('city_luoyang', 'zhou', 'qin') }),   // 《史记·秦本纪》
    B('evt_0319', '15B', 'qin_mengao', 'attacker', 'zhou', 'attacker', { city: at('city_hulaoguan', 'zhou', 'qin') }),   // 《史记·秦本纪》：东周都巩，在虎牢关据点 50km 内
    B('evt_0320', '15B', 'qin_mengao', 'attacker', 'zhao', 'attacker', { city: at('city_taiyuan', 'zhao', 'qin') }),   // 《史记·秦本纪》庄襄王二年
    B('evt_0321', '15B', 'shang_weiwuji', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'qin_mengao' }),   // 《史记·魏公子列传》
    B('evt_0324', '15B', 'wuzhou_limu', 'attacker', 'xiongnu', 'attacker'),   // 《史记·廉颇蔺相如列传》附李牧
    // 出发：《史记·春申君列传》：春申君为合纵长，楚是年徙都寿春
    B('evt_0328', '15B', 'chunshen_huangxie', 'attacker', 'qin', 'defender', { from: 'city_shouxian' }),   // 《史记·春申君列传》
    B('evt_0333', '15B', 'qin_hengyi', 'attacker', 'zhao', 'attacker', { city: at('city_anyang', 'zhao', 'qin') }),   // 《史记·秦始皇本纪》十一年
    B('evt_0335', '15B', 'qin_hengyi', 'attacker', 'zhao', 'attacker'),   // 《史记·秦始皇本纪》十三年：斩扈辄
    B('evt_0336', '15B', 'wuzhou_limu', 'attacker', 'qin', 'attacker', { enemyGeneralId: 'qin_hengyi' }),   // 《史记·廉颇蔺相如列传》
    B('evt_0337', '15B', 'wuzhou_limu', 'defender', 'qin', 'defender'),   // 同上
    // ── 第 16 棒 · 秦灭六国 ──
    B('evt_0338', '16', 'qin_teng', 'attacker', 'han', 'attacker', { city: at('city_xinzheng', 'han', 'qin') }),   // 《史记·秦始皇本纪》十七年
    // 途经：《史记·白起王翦列传》：王翦将上地，下井陉
    B('evt_0340', '16', 'ruo_wangjian', 'attacker', 'zhao', 'attacker', { city: at('city_handan', 'zhao', 'qin'), route: [p('井陉', 38.04, 114.14)] }),   // 《史记·秦始皇本纪》十九年
    B('evt_0342', '16', 'ruo_wangjian', 'attacker', 'yan', 'attacker', { city: at('city_beijing', 'yan', 'qin') }),   // 《史记·秦始皇本纪》二十一年：拔蓟
    B('evt_0343', '16', 'qin_wangben', 'attacker', 'wei', 'attacker', { city: at('city_bianliang', 'wei', 'qin') }),   // 《史记·秦始皇本纪》二十二年
    B('evt_0344', '16', 'gen_li_xin', 'defender', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13' }),   // 《史记·白起王翦列传》
    B('evt_0345', '16', 'ruo_wangjian', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13' }),   // 同上
    B('evt_0346', '16', 'ruo_wangjian', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'bfe3_13', city: at('city_shouxian', 'chuguo', 'qin') }),   // 同上
    // 出发：《史记·秦始皇本纪》二十五年：王贲自燕地攻辽东
    B('evt_0348', '16', 'qin_wangben', 'attacker', 'yan', 'attacker', { city: at('city_liaoyang', 'yan', 'qin'), from: 'city_beijing' }),   // 《史记·秦始皇本纪》二十五年
    B('evt_0349', '16', 'qin_wangben', 'attacker', 'qi', 'attacker', { city: at('city_linzi', 'qi', 'qin') }),   // 《史记·秦始皇本纪》二十六年：使将军王贲从燕南攻齐，得齐王建
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
    // 出发：《史记·项羽本纪》：项王北至城阳击齐，闻汉入彭城而还；途经：《史记·项羽本纪》：以精兵三万南从鲁出胡陵，西从萧晨击汉军
    B('evt_0372', '18', 'xichu_xiangyu', 'attacker', 'han_d', 'attacker', { enemyGeneralId: 'han_d_liubang', from: 'city_ju', route: [p('鲁', 35.6, 116.99), p('胡陵', 34.9, 116.7), p('萧', 34.19, 116.95)] }),   // 《史记·项羽本纪》
    // 出发：《史记·淮阴侯列传》：破代，禽夏说阏与，乃东下井陉
    B('evt_0373', '18', 'xianyu_hanxin', 'attacker', 'zhao', 'attacker', { enemyGeneralId: 'bfe3_18', from: 'city_eyu' }),   // 《史记·淮阴侯列传》
    B('evt_0374', '18', 'xianyu_hanxin', 'attacker', 'chuguo', 'attacker'),   // 同上：斩龙且
    // 出发：《史记·高祖本纪》：汉王北渡河，至修武，复取成皋
    B('evt_0375', '18', 'han_d_liubang', 'attacker', 'chuguo', 'attacker', { from: 'city_huojia' }),   // 《史记·项羽本纪》：曹咎自刭汜水
    B('evt_0377', '18', 'xianyu_hanxin', 'attacker', 'chuguo', 'attacker', { enemyGeneralId: 'xichu_xiangyu' }),   // 《史记·高祖本纪》
    B('evt_0378', '18', 'xiongnu_maodun', 'attacker', 'han_d', 'attacker', { city: at('city_ningwuguan', 'han_d', 'xiongnu') }),   // 《史记·韩信卢绾列传》：韩王信以马邑降
    // 出发：《史记·高祖本纪》：高祖自晋阳进兵平城
    B('evt_0380', '18', 'han_d_liubang', 'defender', 'xiongnu', 'draw', { enemyGeneralId: 'xiongnu_maodun', from: 'city_taiyuan' }),   // 《史记·匈奴列传》：围七日解围，遂和亲
];
