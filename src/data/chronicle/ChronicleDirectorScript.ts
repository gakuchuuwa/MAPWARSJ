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
    { eventId: 'evt_0009', baton: 1, leadGeneralId: 'aqimeinide_harpagus', kind: 'battle', enemyGeneralId: 'lycia_shouling', role: 'attacker', enemyFactionId: 'lycia', winner: 'attacker', city: { cityId: 'city_xanthos', before: 'lycia', after: 'aqimeinide' } },   // 希罗多德 I.176：克桑托斯人焚家室后出战尽殁
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
    { eventId: 'evt_0041', baton: 3, leadGeneralId: 'aqimeinide_megabazus', kind: 'battle', enemyGeneralId: 'paeonia_shouling', role: 'attacker', enemyFactionId: 'paeonia', winner: 'attacker',
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
    B('evt_0088', '5', 'xila_cimon', 'attacker', 'dolopes', 'attacker', { city: at('city_skyros', 'dolopes', 'xila'), enemyGeneralId: 'dolopes_shouling' }),   // 修昔底德 I.98；普鲁塔克《客蒙传》8
    B('evt_0092', '5', 'xila_cimon', 'attacker', 'naxos', 'attacker', { city: at('city_chimarros', 'naxos', 'xila') }),   // 修昔底德 I.98：纳克索斯叛盟，被围降服
    // 普鲁塔克《客蒙传》12：客蒙自克尼多斯、法塞利斯出航，于欧律墨冬河口水陆两胜
    B('evt_0094', '5', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker', { route: [p('克尼多斯', 36.69, 27.37), p('法塞利斯', 36.52, 30.55)] }),
    B('evt_0095', '5', 'xila_cimon', 'attacker', 'thasos', 'attacker', { enemyGeneralId: 'thasos_shouling' }),   // 修昔底德 I.100：海战胜，登岛围城
    B('evt_0096', '5', 'lagoniya_archidamus_ii', 'defender', 'messenia', 'defender', { city: at('city_sparta', 'lagoniya', 'lagoniya'), enemyGeneralId: 'messenia_shouling' }),   // 普鲁塔克《客蒙传》16：地震后黑劳士来攻斯巴达，阿基达穆斯集众击退，起事者退据伊托美
    B('evt_0097', '5', 'xila_cimon', 'attacker', 'thasos', 'attacker', { city: at('city_thasos', 'thasos', 'xila'), enemyGeneralId: 'thasos_shouling' }),   // 修昔底德 I.101：围三年降，拆墙交舰

    // ── 第 6A 棒 · 伯里克利 ──
    B('evt_0102', '6A', 'xila_pericles', 'attacker', 'lagoniya', 'defender'),   // 普鲁塔克《伯里克利传》10：伯里克利身与塔纳格拉之战；修昔底德 I.108 斯巴达胜
    B('evt_0103', '6A', 'xila_myronides', 'attacker', 'boootiya', 'attacker'),   // 修昔底德 I.108
    B('evt_0105', '6A', 'xila_tolmides', 'attacker', 'lagoniya', 'attacker'),   // 修昔底德 I.108；狄奥多罗斯 XI.84
    B('evt_0109', '6A', 'xila_cimon', 'attacker', 'aqimeinide', 'attacker'),   // 修昔底德 I.112：客蒙卒于围基提翁，舰队于萨拉米斯水陆两胜
    B('evt_0111', '6A', 'xila_tolmides', 'defender', 'boootiya', 'attacker'),   // 修昔底德 I.113：托尔米德斯战死
    B('evt_0112', '6A', 'xila_pericles', 'attacker', 'chalcis', 'attacker', { city: at('city_thebes', 'chalcis', 'xila'), enemyGeneralId: 'chalcis_shouling' }),   // 修昔底德 I.114：伯里克利平优卑亚；卡尔基斯在底比斯据点 50km 内
    B('evt_0117', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker'),   // 修昔底德 I.116：特拉吉亚海战伯里克利胜萨摩斯（伊奥尼亚城邦）
    B('evt_0118', '6A', 'xila_pericles', 'attacker', 'aiaoniya', 'attacker', { city: at('city_miletus', 'aiaoniya', 'xila') }),   // 修昔底德 I.117：围九月降；萨摩斯在米利都据点 50km 内

    // ── 第 6B 棒 · 伯罗奔尼撒战争前夜 ──
    B('evt_0121', '6B', 'xila_hagenong', 'attacker', 'seleisi', 'attacker', { city: at('city_anfeibolisi', 'seleisi', 'xila') }),   // 修昔底德 IV.102：哈格农逐埃多尼人，建安菲波利斯
    B('evt_0122', '6B', 'corinth_timanor', 'attacker', 'corcyra', 'defender', { enemyGeneralId: 'corcyra_meiciades' }),   // 修昔底德 I.29–30：科西拉胜
    B('evt_0123', '6B', 'corinth_xenocleides', 'attacker', 'corcyra', 'attacker', { enemyGeneralId: 'corcyra_meiciades' }),   // 修昔底德 I.46–54：科林斯胜，雅典援舰至乃退
    B('evt_0124', '6B', 'xila_callias', 'attacker', 'chalkidike', 'attacker'),   // 修昔底德 I.58–63：波提狄亚与卡尔基季基人同叛，卡利亚斯地峡会战胜而阵亡
    // 不收：evt_0125 普拉提亚夜袭（同据点同场战争只留最知名一场，留 evt_0128 普拉提亚之围）
    // 出发：修昔底德 II.84–86：伯罗奔尼撒舰队集结于埃利斯之基利尼
    B('evt_0126', '6B', 'gen_brasidas', 'attacker', 'xila', 'defender', { from: 'city_aolinpiya' }),   // 修昔底德 II.86–92：福尔米奥以寡胜众
    B('evt_0127', '6B', 'xila_paches', 'attacker', 'mytilene', 'attacker', { city: at('city_mytilene', 'mytilene', 'xila'), enemyGeneralId: 'mytilene_shouling' }),   // 修昔底德 III.18、III.27–28：筑墙围城，萨莱托斯所领斯巴达援军未至，城降
    B('evt_0128', '6B', 'lagoniya_archidamus_ii', 'attacker', 'plataea', 'attacker', { city: at('city_thebes', 'plataea', 'boootiya'), enemyGeneralId: 'plataea_eupompides' }),   // 修昔底德 II.71–78、III.52–68：围二年陷城，地归底比斯；普拉提亚在底比斯据点 50km 内
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
    B('evt_0136', '7A', 'xila_alcibiades', 'attacker', 'epidaurus', 'defender', { city: at('city_corinth', 'epidaurus', 'epidaurus'), enemyGeneralId: 'epidaurus_shouling' }),   // 修昔底德 V.53–56：围攻不克；埃皮道鲁斯在科林斯据点 50km 内
    B('evt_0137', '7A', 'lagoniya_agis_ii', 'attacker', 'argos', 'attacker', { enemyGeneralId: 'argos_thrasyllus' }),   // 修昔底德 V.65–74
    // 不收：evt_0138 希西亚伊（与 evt_0136 同落科林斯据点、同场战争，只留最知名一场）
    B('evt_0139', '7A', 'xila_cleomedes', 'attacker', 'melos', 'attacker', { city: at('city_melos', 'melos', 'xila'), enemyGeneralId: 'melos_shouling' }),   // 修昔底德 V.84–116
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
    B('evt_0174', '8B', 'lagoniya_agesipolis_i', 'attacker', 'mantinea', 'attacker', { city: at('city_mantinea', 'mantinea', 'lagoniya'), enemyGeneralId: 'mantinea_shouling' }),   // 色诺芬《希腊史》V.2.1–7：壅奥菲斯河冲毁城墙，析为四村

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
    B('evt_0190', '9', 'lagoniya_archidamus_iii', 'attacker', 'arcadia', 'attacker', { enemyGeneralId: 'arcadia_lycomedes' }),   // 色诺芬《希腊史》VII.1.28–32；战场在斯巴达据点 50km 内
    B('evt_0192', '9', 'xila_timotheus', 'attacker', 'aqimeinide', 'attacker', { city: at('city_miletus', 'aqimeinide', 'xila') }),   // 伊索克拉底《论财产交换》111；狄奥多罗斯 XV.47：围十月下之；萨摩斯在米利都据点 50km 内
    B('evt_0194', '9', 'boootiya_pelopidas', 'attacker', 'sesali', 'attacker'),   // 普鲁塔克《佩洛皮达斯传》32：费莱僭主亚历山大，佩洛皮达斯胜而战死
    B('evt_0195', '9', 'xila_timotheus', 'attacker', 'chalkidike', 'attacker', { city: at('city_aolinsuosi', 'chalkidike', 'xila') }),   // 狄奥多罗斯 XV.81：提莫修斯取托罗尼、波提狄亚；两城在奥林索斯据点 50km 内
    B('evt_0196', '9', 'gen_epaminondas', 'attacker', 'lagoniya', 'attacker', { enemyGeneralId: 'lagoniya_agesilaus' }),   // 色诺芬《希腊史》VII.5.18–27

    // ── 第 10 棒 · 腓力二世 ──
    B('evt_0198', '10', 'yili_bardylis', 'attacker', 'maqidun', 'attacker'),   // 狄奥多罗斯 XVI.2：佩尔狄卡斯三世战死
    B('evt_0199', '10', 'gen_philip_ii', 'defender', 'xila', 'defender'),   // 狄奥多罗斯 XVI.3：阿尔盖乌斯率雅典曼提亚斯所部三千重步兵
    B('evt_0200', '10', 'gen_philip_ii', 'attacker', 'yili', 'attacker'),   // 狄奥多罗斯 XVI.4：伊利里亚王巴尔迪利斯
    B('evt_0203', '10', 'phokis_feiluomoluosi', 'defender', 'boootiya', 'attacker'),   // 狄奥多罗斯 XVI.30–31：菲洛墨洛斯坠崖死
    B('evt_0204', '10', 'gen_philip_ii', 'attacker', 'methone', 'attacker', { city: at('city_salonica', 'methone', 'maqidun'), enemyGeneralId: 'methone_shouling' }),   // 狄奥多罗斯 XVI.34：腓力围梅托涅失一目，陷城夷之；梅托涅在佩拉据点 50km 内
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
    B('evt_0236', '11D', 'gen_alexander_great', 'attacker', 'malli', 'attacker', { city: at('city_malisi', 'malli', 'maqidun'), enemyGeneralId: 'malli_shouling' }),   // 阿里安 VI.8–11：马利人首领史失其名
    B('evt_0237', '11E', 'gen_alexander_great', 'attacker', 'kesaiya', 'attacker', { enemyGeneralId: 'kesaiya_shouling' }),   // 阿里安 VII.15：科赛亚首领史失其名

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
    B('evt_0260', '13A', 'antigonid_demetrius', 'attacker', 'rhodes', 'defender', { city: at('city_rhodes', 'rhodes', 'rhodes'), from: 'city_halikanasu', enemyGeneralId: 'rhodes_shouling' }),   // 狄奥多罗斯 XX.81–99
    // 出发：查士丁 XV.4：塞琉古平巴克特里亚后南下印度
    B('evt_0261', '13B', 'gen_seleucus_i', 'attacker', 'kongque', 'defender', { enemyGeneralId: 'kongque_zhantuoluo', from: 'city_lanshi' }),   // 阿庇安《叙利亚战争》55、斯特拉波 XV.2.9：割地议和
    // ── 第 14 棒 · 赵武灵王 ──
    B('evt_0262', '14', 'lingqiu_zhaowuling', 'attacker', 'zhongshan', 'attacker', { city: at('city_daomaguan', 'zhongshan', 'zhao'), enemyGeneralId: 'zhongshan_simazhou' }),   // 《史记·赵世家》
    B('evt_0266', '14', 'lingqiu_zhaowuling', 'attacker', 'linhu', 'attacker', { enemyGeneralId: 'linhu_shouling' }),   // 《史记·赵世家》：破林胡、楼烦
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

    // ── 第 19 棒 ──
    B('evt_0381', '19', 'han_d_liubang', 'attacker', 'zhao_han', 'attacker', { enemyGeneralId: 'zhao_han_gen_43', from: 'city_datong', city: at('city_zhending', 'zhao_han', 'han_d'), route: [p('洛阳', 34.62, 112.45)] }),
    B('evt_0384', '19', 'han_d_liubang', 'attacker', 'dai_chenxi', 'attacker', { enemyGeneralId: 'dai_chenxi_gen_46', from: 'city_changan', city: at('city_handan', 'han_d', 'han_d'), route: [p('邯郸', 36.61, 114.49), p('曲逆', 38.84, 115.13)] }),
    B('evt_0385', '19', 'yangshao_zhoubo', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_42', from: 'city_changan', city: at('city_datong', 'xiongnu', 'han_d'), route: [p('马邑', 39.38, 112.43), p('楼烦', 38.67, 111.78)] }),
    B('evt_0386', '19', 'han_d_liubang', 'attacker', 'huainan', 'attacker', { enemyGeneralId: 'huainan_shouling', from: 'city_changan', city: at('city_xucheng', 'huainan', 'han_d') }),
    B('evt_0387', '19', 'yangshao_zhoubo', 'attacker', 'yan_luwan', 'attacker', { enemyGeneralId: 'yan_luwan_gen_50', from: 'city_changan', city: at('city_juyongguan', 'yan_luwan', 'han_d'), route: [p('蓟城', 39.9, 116.41), p('上兰', 40.38, 115.8)] }),
    // ── 第 20 棒 ──
    B('evt_0392', '20', 'sailiugu_antiaoke', 'defender', 'luoma_gongheguo', 'attacker', { enemyGeneralId: 'luoma_gongheguo_gen_51', route: [p('阿波罗尼亚', 40.72, 19.47), p('拉里萨', 39.64, 22.42), p('法尔萨卢斯', 39.29, 22.38), p('拉米亚', 38.9, 22.43)] }),
    B('evt_0393', '20', 'sailiugu_antiaoke', 'defender', 'luoma_gongheguo', 'attacker', { enemyGeneralId: 'luoma_gongheguo_gen_53', city: at('city_sifaerde', 'sailiugu', 'pajiama') }),
    // ── 第 21A 棒 ──
    B('evt_0394', '21A', 'luoma_gongheguo_gen_1', 'attacker', 'jialatai', 'attacker', { enemyGeneralId: 'jialatai_gen_57', from: 'city_yifusuo', city: at('city_geerdiweng', 'jialatai', 'pajiama'), route: [p('马格尼西亚', 37.85, 27.53), p('阿帕米亚', 38.07, 30.17), p('辛纳达', 38.54, 30.55)] }),
    B('evt_0395', '21A', 'luoma_gongheguo_gen_1', 'defender', 'seleisi', 'draw', { enemyGeneralId: 'seleisi_shouling', route: [p('阿帕米亚', 38.07, 30.17), p('赫勒斯滂海峡', 40.2, 26.41), p('利西马其亚', 40.55, 26.75), p('库普塞拉', 40.92, 26.38)] }),
    B('evt_0402', '21A', 'luoma_gongheguo_gen_59', 'defender', 'arevaci', 'defender', { enemyGeneralId: 'arevaci_shouling', from: 'city_tarraco', city: at('city_toledo', 'luoma_diguo', 'luoma_diguo') }),
    B('evt_0403', '21A', 'luoma_gongheguo_gen_59', 'defender', 'arevaci', 'defender', { enemyGeneralId: 'arevaci_shouling' }),
    B('evt_0404', '21A', 'luoma_gongheguo_shouling', 'attacker', 'arevaci', 'attacker', { enemyGeneralId: 'arevaci_shouling', from: 'city_tarraco', city: at('city_numantia', 'arevaci', 'luoma_diguo'), route: [p('蒙达', 41.2, -1.55), p('克尔蒂马', 41.35, -1.8), p('阿尔克', 41.55, -2.1)] }),
    B('evt_0411', '21A', 'luoma_gongheguo_gen_63', 'defender', 'maqidun', 'attacker', { enemyGeneralId: 'maqidun_gen_61', from: 'city_pelina', route: [p('阿波罗尼亚', 40.72, 19.47), p('贡菲', 39.46, 21.69)] }),
    B('evt_0413', '21A', 'luoma_gongheguo_shouling', 'defender', 'maqidun', 'attacker', { enemyGeneralId: 'maqidun_gen_61', city: at('city_prilep', 'luoma_diguo', 'maqidun') }),
    B('evt_0414', '21A', 'luoma_gongheguo_gen_64', 'attacker', 'maqidun', 'attacker', { enemyGeneralId: 'maqidun_gen_61', from: 'city_luoma', city: at('city_salonica', 'maqidun', 'luoma_diguo'), route: [p('赫拉克利乌姆', 40.0, 22.59), p('皮提翁山道', 40.06, 22.22), p('迪翁', 40.17, 22.49)] }),
    // ── 第 21B 棒 ──
    B('evt_0431', '21B', 'luoma_gongheguo_gen_65', 'defender', 'arevaci', 'attacker', { enemyGeneralId: 'bfe_rhetogenes', from: 'city_tarraco', city: at('city_numantia', 'arevaci', 'arevaci'), route: [p('塞格达', 41.33, -1.56), p('阿克苏尼乌姆', 41.52, -2.28)] }),
    B('evt_0432', '21B', 'luoma_gongheguo_gen_67', 'attacker', 'arevaci', 'attacker', { enemyGeneralId: 'bfe_rhetogenes', from: 'city_tarraco', city: at('city_zaragoza', 'arevaci', 'luoma_diguo'), route: [p('奥基利斯', 41.13, -2.43)] }),
    B('evt_0433', '21B', 'luoma_gongheguo_gen_3', 'attacker', 'vaccaei', 'draw', { enemyGeneralId: 'vaccaei_shouling', from: 'city_tarraco', city: at('city_la_mota', 'vaccaei', 'vaccaei'), route: [p('塔古斯河', 39.96, -4.83), p('杜罗河', 41.51, -5.49), p('考卡', 41.22, -4.52)] }),
    B('evt_0434', '21B', 'numidia_gen_69', 'attacker', 'buni', 'attacker', { enemyGeneralId: 'buni_gen_70', from: 'city_cirta' }),
    B('evt_0437', '21B', 'bfe_vetilius', 'defender', 'luxitaniya', 'attacker', { enemyGeneralId: 'luxitaniya_viriathus', route: [p('图尔德塔尼亚', 37.39, -5.98)] }),
    B('evt_0438', '21B', 'luoma_gongheguo_gen_3', 'attacker', 'buni', 'attacker', { enemyGeneralId: 'buni_gen_70', from: 'city_luoma', city: at('city_jiataji', 'buni', 'luoma_diguo'), route: [p('乌提卡', 37.06, 10.06), p('墨伽拉城区', 36.87, 10.32)] }),
    // ── 第 22 棒 ──
    B('evt_0436', '22', 'ansxi_gen_4', 'attacker', 'sailiugu', 'attacker', { enemyGeneralId: 'sailiugu_gen_71', from: 'city_nisa', city: at('city_hamadan', 'sailiugu', 'ansxi') }),
    B('evt_0443', '22', 'ansxi_gen_4', 'attacker', 'sailiugu', 'attacker', { enemyGeneralId: 'sailiugu_shouling', from: 'city_hamadan', city: at('city_babilun', 'sailiugu', 'ansxi'), route: [p('塞琉西亚', 33.09, 44.52)] }),
    B('evt_0444', '22', 'ansxi_gen_4', 'defender', 'sailiugu', 'defender', { enemyGeneralId: 'sailiugu_gen_72', from: 'city_babilun', city: at('city_susa', 'sailiugu', 'ansxi'), route: [p('安提俄基亚', 36.2, 36.16), p('美索不达米亚', 33.09, 44.52)] }),
    // ── 第 23 棒 ──
    B('evt_0456', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_juyongguan', route: [p('上谷', 40.37, 115.63)] }),
    B('evt_0457', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_wuzhousai' }),
    B('evt_0458', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_yunzhongcheng', city: at('city_gaoque', 'xiongnu', 'han_d'), route: [p('高阙', 41.2, 107.17), p('陇西', 35.42, 103.85)] }),
    B('evt_0459', '23', 'xiongnu_yizhixie', 'attacker', 'yudan_xiongnu', 'attacker', { enemyGeneralId: 'yudan_taizi', city: at('city_karakorum', 'xiongnu', 'xiongnu') }),
    B('evt_0461', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_gaoque', route: [p('朔方', 40.3, 107.0)] }),
    B('evt_0462', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'draw', { enemyGeneralId: 'xiongnu_yizhixie', from: 'city_shengle' }),
    B('evt_0464', '23', 'suzhou_huoqubing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_lintao', city: at('city_shandan', 'xiongnu', 'han_d'), route: [p('乌戾山', 36.06, 103.77), p('焉支山', 38.78, 101.08), p('皋兰山', 36.02, 103.84)] }),
    B('evt_0465', '23', 'suzhou_huoqubing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_hunxiewang', from: 'city_fangqu', city: at('city_zhangye', 'xiongnu', 'han_d'), route: [p('钧耆水', 39.8, 99.8), p('居延泽', 42.25, 101.15)] }),
    B('evt_0466', '23', 'li_lx_d_liguang', 'defender', 'xiongnu', 'draw', { enemyGeneralId: 'xiongnu_yizhixie', from: 'city_wuzhong' }),
    B('evt_0467', '23', 'shuofang_weiqing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_yizhixie', from: 'city_shengle', city: at('city_woluduocheng', 'xiongnu', 'han_d'), route: [p('大漠', 44.14, 103.7)] }),
    B('evt_0468', '23', 'suzhou_huoqubing', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling', from: 'city_daixian', route: [p('离侯山', 44.82, 106.8), p('弓闾河', 47.26, 110.72), p('狼居胥山', 47.69, 108.53), p('姑衍山', 48.62, 110.65)] }),
    // ── 第 24A 棒 ──
    B('evt_0476', '24A', 'han_lubode', 'attacker', 'nanyue', 'attacker', { enemyGeneralId: 'nanyue_gen_76', from: 'city_guiyang', city: at('city_panyu', 'nanyue', 'han_d'), route: [p('湟水', 24.7, 112.73), p('横浦关', 25.4, 114.3), p('寻狭', 24.18, 113.42)] }),
    B('evt_0477', '24A', 'han_d_gen_78', 'attacker', 'minyue', 'attacker', { enemyGeneralId: 'minyue_gen_80', from: 'city_kuaiji', city: at('city_fuzhou', 'minyue', 'han_d'), route: [p('句章', 29.99, 121.43), p('武林', 28.75, 117.65), p('梅岭', 27.76, 117.96)] }),
    B('evt_0480', '24A', 'han_d_gen_81', 'attacker', 'wiman_joseon', 'attacker', { enemyGeneralId: 'bfe3_31', from: 'city_liaoyang', city: at('city_pyongyang', 'wiman_joseon', 'han_d'), route: [p('浿水', 39.67, 125.5), p('｜水路:齐地', 37.75, 120.75), p('洌口', 38.73, 125.4)] }),
    // ── 第 24B 棒 ──
    B('evt_0479', '24B', 'han_d_gen_74', 'attacker', 'shanshan', 'attacker', { enemyGeneralId: 'shanshan_shouling', from: 'city_dunhuang', city: at('city_loulan', 'shanshan', 'shanshan'), route: [p('玉门关', 40.35, 93.86), p('盐泽', 40.5, 90.5)] }),
    B('evt_0484', '24B', 'bfe3_36', 'attacker', 'dayuan', 'defender', { enemyGeneralId: 'dayuan_wugua', from: 'city_dunhuang', city: at('city_aoshen', 'dayuan', 'dayuan'), route: [p('盐水', 40.5, 90.5)] }),
    B('evt_0487', '24B', 'bfe3_36', 'attacker', 'dayuan', 'attacker', { enemyGeneralId: 'dayuan_wugua', from: 'city_dunhuang', city: at('city_guishancheng', 'dayuan', 'dayuan'), route: [p('轮台', 41.77, 84.25), p('郁成', 40.53, 72.79)] }),
    B('evt_0490', '24B', 'bfe3_36', 'attacker', 'xiongnu', 'draw', { enemyGeneralId: 'bfe3_38', from: 'city_jiuquan', route: [p('酒泉', 39.74, 98.51)] }),
    B('evt_0491', '24B', 'ningkou_liling', 'defender', 'xiongnu', 'attacker', { enemyGeneralId: 'bfe3_38', from: 'city_juyansai', route: [p('浚稽山', 45.2, 100.8), p('龙城故道', 44.5, 101.0), p('鞮汗山', 42.8, 101.1)] }),
    B('evt_0493', '24B', 'bfe3_36', 'attacker', 'xiongnu', 'draw', { enemyGeneralId: 'bfe3_38', from: 'city_linrong' }),
    B('evt_0500', '24B', 'bfe3_36', 'defender', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_83', from: 'city_chilechuan', route: [p('夫羊句山', 42.5, 107.5), p('郅居水', 46.8, 103.5)] }),
    // ── 第 25 棒 ──
    B('evt_0520', '25', 'han_d_gen_84', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling_2', from: 'city_chigucheng' }),
    B('evt_0524', '25', 'bfe3_45', 'attacker', 'chagatai', 'attacker', { enemyGeneralId: 'chagatai_gen_87', from: 'city_luntai', city: at('city_tuokexun', 'chagatai', 'han_d'), route: [p('渠犁', 41.6, 86.15), p('交河城', 42.95, 89.06)] }),
    B('evt_0526', '25', 'han_d_gen_88', 'attacker', 'shache', 'attacker', { enemyGeneralId: 'shache_gen_89', from: 'city_ruoqiang', city: at('city_shache', 'shache', 'shache'), route: [p('伊循城', 39.02, 88.16), p('于阗', 37.1, 79.92)] }),
    B('evt_0530', '25', 'lanzhou_zhaochongguo', 'attacker', 'xianlingqiang', 'attacker', { enemyGeneralId: 'bfe3_43', from: 'city_changan', city: at('city_lanzhou', 'xianlingqiang', 'han_d'), route: [p('金城', 36.06, 103.77), p('四望峡', 36.33, 102.98), p('浩亹', 36.35, 102.85)] }),
    // ── 第 26 棒 ──
    B('evt_0538', '26', 'delan_sulun', 'defender', 'luoma_gongheguo', 'defender', { enemyGeneralId: 'bfe_crassus', city: at('city_aidesa', 'luoma_diguo', 'ansxi') }),
    // ── 第 27A 棒 ──
    B('evt_0543', '27A', 'gen_julius_caesar', 'attacker', 'pompeians', 'attacker', { enemyGeneralId: 'pompeians_shouling', from: 'city_nabone', city: at('city_zaragoza', 'luoma_diguo', 'luoma_diguo'), route: [p('马西利亚', 43.3, 5.37), p('纳博讷', 43.18, 3.0), p('比利牛斯山口', 42.46, 2.86)] }),
    B('evt_0544', '27A', 'gen_julius_caesar', 'attacker', 'pompeians', 'defender', { enemyGeneralId: 'pompeians_shouling', from: 'city_brundisium', city: at('city_antiwali', 'luoma_diguo', 'luoma_diguo'), route: [p('帕莱斯特', 40.16, 19.6), p('奥里库姆', 40.32, 19.43), p('阿波罗尼亚', 40.72, 19.47)] }),
    B('evt_0545', '27A', 'gen_julius_caesar', 'attacker', 'pompeians', 'attacker', { enemyGeneralId: 'pompeians_shouling', from: 'city_dyrrachium', route: [p('阿波罗尼亚', 40.72, 19.47), p('贡菲', 39.46, 21.69), p('梅特罗波利斯', 39.34, 21.84), p('｜守方:坎达维亚大道', 41.12, 20.08), p('拉里萨', 39.64, 22.42)] }),
    B('evt_0546', '27A', 'gen_julius_caesar', 'defender', 'tuolemi', 'defender', { enemyGeneralId: 'tuolemi_gen_92', city: at('city_yalishanda', 'tuolemi', 'tuolemi') }),
    B('evt_0547', '27A', 'gen_julius_caesar', 'defender', 'bosi_puluosi', 'defender', { enemyGeneralId: 'bfe_cb_bendou_d_1', from: 'city_yalishanda', city: at('city_amaxiya', 'bosi_puluosi', 'luoma_diguo'), route: [p('阿卡', 32.92, 35.07), p('安提俄基亚', 36.2, 36.16), p('塔尔苏斯', 36.92, 34.9), p('马扎卡', 38.72, 35.48), p('科马纳', 40.38, 36.63)] }),
    B('evt_0548', '27A', 'gen_julius_caesar', 'attacker', 'pompeians', 'attacker', { enemyGeneralId: 'pompeians_gen_96', from: 'city_lilybaeum', city: at('city_jiemu', 'luoma_diguo', 'luoma_diguo'), route: [p('哈德鲁梅图姆', 35.83, 10.64), p('鲁斯皮纳', 35.76, 10.82), p('乌齐塔', 35.69, 10.8)] }),
    B('evt_0549', '27A', 'gen_julius_caesar', 'attacker', 'pompeians', 'attacker', { enemyGeneralId: 'pompeians_gen_98', from: 'city_luoma', city: at('city_cordoba', 'luoma_diguo', 'luoma_diguo'), route: [p('萨贡托', 39.68, -0.28), p('奥布尔科', 37.88, -4.19), p('乌利亚', 37.65, -4.69), p('阿特瓜', 37.75, -4.59)] }),
    B('evt_0550', '27A', 'luoma_gongheguo_gen_101', 'defender', 'pompeians', 'attacker', { enemyGeneralId: 'pompeians_gen_100', city: at('city_cordoba', 'luoma_diguo', 'luoma_diguo') }),
    B('evt_0551', '27A', 'antonians_gen_5', 'defender', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_gen_8', city: at('city_verona', 'luoma_diguo', 'luoma_diguo') }),
    B('evt_0552', '27A', 'antonians_gen_5', 'attacker', 'liberators', 'attacker', { enemyGeneralId: 'liberators_gen_103', from: 'city_brundisium', route: [p('迪拉基乌姆', 41.32, 19.46), p('安菲波利斯', 40.82, 23.85), p('｜守方:撒狄', 38.49, 28.04), p('阿比多斯', 40.2, 26.41), p('塞斯托斯', 40.23, 26.42)] }),
    B('evt_0553', '27A', 'antonians_gen_105', 'defender', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_gen_8', city: at('city_florence', 'luoma_diguo', 'luoma_diguo') }),
    // ── 第 27B 棒 ──
    B('evt_0554', '27B', 'luoma_gongheguo_gen_108', 'defender', 'ansxi', 'attacker', { enemyGeneralId: 'ansxi_gen_106', city: at('city_antiejiya', 'luoma_diguo', 'ansxi') }),
    B('evt_0555', '27B', 'luoma_gongheguo_gen_6', 'defender', 'ansxi', 'defender', { enemyGeneralId: 'ansxi_gen_109', from: 'city_yadian' }),
    B('evt_0556', '27B', 'luoma_gongheguo_gen_6', 'defender', 'ansxi', 'defender', { enemyGeneralId: 'ansxi_gen_106', from: 'city_antiejiya', route: [p('泽乌格马', 37.06, 37.87)] }),
    B('evt_0557', '27B', 'luoma_gongheguo_gen_110', 'attacker', 'hasmonean', 'attacker', { enemyGeneralId: 'hasmonean_gen_112', from: 'city_antiejiya', city: at('city_yelusaleng', 'xibolai', 'luoma_diguo'), route: [p('腓尼基海岸', 33.89, 35.5), p('撒马利亚', 32.28, 35.19)] }),
    B('evt_0558', '27B', 'antonians_gen_5', 'attacker', 'ansxi', 'defender', { enemyGeneralId: 'ansxi_gen_113', from: 'city_antiejiya', city: at('city_malagai', 'ansxi', 'ansxi'), route: [p('泽乌格马', 37.06, 37.87), p('卡拉纳', 39.91, 41.27), p('阿拉克斯河', 39.0, 45.5)] }),
    // ── 第 28 棒 ──
    B('evt_0560', '28', 'quli_chentang', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xijue_ganyanshou', from: 'city_luntai', city: at('city_talas', 'xiongnu', 'kangju'), route: [p('温宿', 41.27, 80.24), p('赤谷城', 42.15, 77.59), p('阗池', 42.45, 77.2), p('｜南道:疏勒', 39.49, 76.0), p('葱岭', 39.8, 73.8), p('大宛', 41.29, 71.67)] }),
    // ── 第 29A 棒 ──
    B('evt_0565', '29A', 'luoma_diguo_gen_8', 'attacker', 'antonians', 'attacker', { enemyGeneralId: 'antonians_gen_5', from: 'city_brundisium', city: at('city_anbulajiya', 'tuolemi', 'luoma_diguo'), route: [p('科孚', 39.62, 19.92), p('梅托涅', 36.82, 21.7), p('帕特雷', 38.25, 21.73)] }),
    B('evt_0566', '29A', 'luoma_diguo_gen_8', 'attacker', 'antonians', 'attacker', { enemyGeneralId: 'antonians_gen_5', from: 'city_antiejiya', city: at('city_yalishanda', 'tuolemi', 'luoma_diguo'), route: [p('佩卢西姆', 31.04, 32.54), p('｜西路加卢斯:昔兰尼', 32.82, 21.86), p('帕莱托尼乌姆', 31.35, 27.24)] }),
    B('evt_0567', '29A', 'luoma_gongheguo_gen_116', 'attacker', 'bastarnae', 'attacker', { enemyGeneralId: 'bastarnae_gen_117', from: 'city_salonica', route: [p('色雷斯', 42.15, 24.75), p('海姆斯山脉', 42.78, 24.9)] }),
    B('evt_0568', '29A', 'luoma_gongheguo_gen_118', 'attacker', 'aquitani', 'attacker', { enemyGeneralId: 'aquitani_shouling', from: 'city_nabone', city: at('city_bordeaux', 'aquitani', 'luoma_diguo'), route: [p('阿塔克斯河谷', 43.21, 2.35)] }),
    B('evt_0575', '29A', 'luoma_diguo_gen_119', 'attacker', 'camunni', 'attacker', { enemyGeneralId: 'camunni_shouling' }),
    B('evt_0576', '29A', 'luoma_diguo_gen_9', 'attacker', 'cantabri', 'attacker', { enemyGeneralId: 'cantabri_shouling', from: 'city_bordeaux', city: at('city_vellica', 'cantabri', 'luoma_diguo') }),
    B('evt_0579', '29A', 'luoma_diguo_gen_121', 'defender', 'sicambri', 'attacker', { enemyGeneralId: 'sicambri_gen_120' }),
    B('evt_0580', '29A', 'luoma_diguo_gen_122', 'attacker', 'raeti', 'attacker', { enemyGeneralId: 'raeti_shouling', from: 'city_verona', route: [p('南路:特里登图姆', 46.07, 11.12), p('伊萨尔库斯河谷', 46.67, 11.16), p('博登湖', 47.6, 9.4)] }),
    B('evt_0582', '29A', 'luoma_diguo_gen_9', 'attacker', 'pannonii', 'attacker', { enemyGeneralId: 'pannonii_shouling', from: 'city_gradeci' }),
    // ── 第 29B 棒 ──
    B('evt_0583', '29B', 'luoma_diguo_gen_122', 'attacker', 'cherusci', 'attacker', { enemyGeneralId: 'cherusci_shouling', from: 'city_vetera', route: [p('德鲁苏斯运河', 51.98, 5.91), p('弗莱沃湖', 52.6, 5.4)] }),
    B('evt_0584', '29B', 'luoma_diguo_gen_122', 'attacker', 'cherusci', 'attacker', { enemyGeneralId: 'cherusci_shouling', from: 'city_vetera', route: [p('利珀河', 51.66, 7.35), p('威悉河', 51.78, 9.38)] }),
    B('evt_0586', '29B', 'luoma_diguo_gen_122', 'attacker', 'marcomanni', 'attacker', { enemyGeneralId: 'bfe_maroboduus', from: 'city_meiyinci', city: at('city_magedebao', 'marcomanni', 'luoma_diguo'), route: [p('卡蒂领地', 51.1, 9.4), p('威悉河', 51.55, 9.65)] }),
    B('evt_0592', '29B', 'luoma_diguo_gen_123', 'attacker', 'cherusci', 'attacker', { enemyGeneralId: 'cherusci_shouling', from: 'city_vetera' }),
    B('evt_0596', '29B', 'luoma_diguo_gen_124', 'defender', 'yili', 'defender', { enemyGeneralId: 'yili_bato', city: at('city_belgrade', 'luoma_diguo', 'luoma_diguo') }),
    B('evt_0597', '29B', 'luoma_diguo_gen_124', 'defender', 'yili', 'defender', { enemyGeneralId: 'yili_bato', route: [p('守方终抵锡斯基亚', 45.48, 16.37)] }),
    B('evt_0599', '29B', 'luoma_diguo_gen_10', 'attacker', 'yili', 'attacker', { enemyGeneralId: 'yili_bato', from: 'city_gradeci', city: at('city_sarajevo', 'yili', 'luoma_diguo'), route: [p('锡斯基亚', 45.48, 16.37)] }),
    B('evt_0600', '29B', 'luoma_diguo_gen_127', 'defender', 'cherusci', 'attacker', { enemyGeneralId: 'bfe_arminius', route: [p('威悉河夏营', 52.23, 8.92)] }),
    B('evt_0606', '29B', 'luoma_diguo_gen_11', 'attacker', 'cherusci', 'attacker', { enemyGeneralId: 'bfe_arminius', from: 'city_vetera', route: [p('巴塔维岛', 51.9, 5.4), p('德鲁苏斯运河', 51.98, 5.91), p('埃姆斯河口', 53.37, 7.21)] }),
    // ── 第 30 棒 ──
    B('evt_0610', '30', 'chimei_fanchong', 'attacker', 'dixiang', 'attacker', { enemyGeneralId: 'dixiang_shouling', from: 'city_ju', city: at('city_ju', 'dixiang', 'chimei'), route: [p('泰山', 36.25, 117.1)] }),
    B('evt_0613', '30', 'lvlin_gen_128', 'attacker', 'dixiang', 'attacker', { enemyGeneralId: 'dixiang_shouling', from: 'city_jingling', city: at('city_jingling', 'dixiang', 'lvlin'), route: [p('绿林山', 31.05, 113.0), p('云杜', 30.66, 113.17), p('竟陵', 30.65, 113.16), p('安陆', 31.26, 113.69)] }),
    B('evt_0614', '30', 'chimei_fanchong', 'attacker', 'dixiang', 'attacker', { enemyGeneralId: 'dixiang_gen_130', city: at('city_boyang', 'dixiang', 'chimei'), route: [p('守方:长安', 34.27, 108.93), p('无盐', 35.94, 116.47)] }),
    B('evt_0615', '30', 'lulin_liuxiu', 'attacker', 'dixiang', 'attacker', { enemyGeneralId: 'bfe3_56', from: 'city_yancheng2', city: at('city_kunyang', 'gengshi', 'gengshi'), route: [p('攻方:昆阳', 33.22, 113.22), p('定陵', 33.52, 113.78), p('郾城', 33.58, 114.03), p('昆阳｜守方:长安', 34.27, 108.93), p('洛阳', 34.62, 112.45), p('颍阳', 34.12, 113.06)] }),
    // ── 第 31A 棒 ──
    B('evt_0616', '31A', 'lulin_liuxiu', 'attacker', 'wanglang_han', 'attacker', { enemyGeneralId: 'bfe_cb_zhao_3', from: 'city_xindu', city: at('city_handan', 'wanglang_han', 'han_d'), route: [p('宋子', 37.75, 114.92), p('巨鹿', 37.22, 115.03), p('广阿', 37.19, 114.73)] }),
    B('evt_0617', '31A', 'lulin_liuxiu', 'attacker', 'tongma', 'attacker', { enemyGeneralId: 'tongma_shouling', from: 'city_handan', route: [p('鄡县', 38.03, 115.2), p('清阳', 37.05, 115.48)] }),
    B('evt_0619', '31A', 'lulin_liuxiu', 'attacker', 'gengshi', 'attacker', { enemyGeneralId: 'gengshi_gen_141', from: 'city_huojia', city: at('city_luoyang', 'gengshi', 'han_d'), route: [p('怀县', 35.1, 113.4), p('孟津', 34.83, 112.44)] }),
    B('evt_0620', '31A', 'han_d_gen_142', 'attacker', 'liuyong_liang', 'attacker', { enemyGeneralId: 'liuyong_liang_gen_143', from: 'city_luoyang', city: at('city_shangqiu', 'liuyong_liang', 'han_d'), route: [p('敖仓', 34.9, 113.43), p('襄邑', 34.43, 115.07), p('睢阳', 34.41, 115.66), p('虞县', 34.57, 115.93)] }),
    B('evt_0621', '31A', 'xiayang_d_dengyu', 'defender', 'chimei', 'attacker', { enemyGeneralId: 'chimei_fanchong', from: 'city_tongguan', route: [p('长安', 34.27, 108.93), p('华阴', 34.57, 110.09)] }),
    B('evt_0622', '31A', 'han_d_gen_144', 'attacker', 'chimei', 'attacker', { enemyGeneralId: 'chimei_fanchong', from: 'city_luoyang', route: [p('湖县', 34.62, 110.92), p('崤底', 34.58, 111.45), p('渑池', 34.76, 111.76), p('宜阳', 34.51, 112.18)] }),
    B('evt_0623', '31A', 'han_d_gen_145', 'attacker', 'yan_pengchong', 'attacker', { enemyGeneralId: 'yan_pengchong_gen_147', from: 'city_luoyang', city: at('city_fanyang', 'zhangfeng_jun', 'han_d'), route: [p('良乡', 39.73, 116.14), p('涿郡', 39.49, 115.97), p('阳乡', 39.62, 116.38), p('雍奴', 39.42, 117.02), p('泉州', 39.53, 117.2)] }),
    B('evt_0624', '31A', 'you_gengyan', 'attacker', 'qi_zhangbu', 'attacker', { enemyGeneralId: 'bfe3_58', from: 'city_luoyang', city: at('city_linzi', 'qi_zhangbu', 'han_d'), route: [p('祝阿', 36.68, 116.78), p('历下', 36.67, 117.02), p('巨里', 36.73, 117.65), p('西安', 36.93, 118.23), p('临淄', 36.88, 118.43), p('剧县', 36.7, 118.83)] }),
    B('evt_0625', '31A', 'han_d_gen_144', 'attacker', 'shuoning', 'attacker', { enemyGeneralId: 'shuoning_gen_148', from: 'city_changan', city: at('city_binzhou2', 'han_d', 'han_d'), route: [p('汧县', 34.67, 106.87), p('陇坻', 34.88, 106.55)] }),
    B('evt_0627', '31A', 'han_d_gen_150', 'attacker', 'shuoning', 'attacker', { enemyGeneralId: 'shuoning_gen_148', from: 'city_changan', city: at('city_longcheng', 'shuoning', 'han_d'), route: [p('汧县', 34.67, 106.87), p('番须口', 34.82, 106.63), p('回中道', 34.92, 106.32)] }),
    B('evt_0629', '31A', 'you_gengyan', 'attacker', 'shuoning', 'attacker', { enemyGeneralId: 'shuoning_gen_151', from: 'city_changan', city: at('city_longxi', 'shuoning', 'han_d'), route: [p('高平第一城', 36.0, 106.28), p('襄武', 34.72, 104.62)] }),
    B('evt_0630', '31A', 'han_d_gen_153', 'attacker', 'chengjia', 'attacker', { enemyGeneralId: 'chengjia_gen_154', from: 'city_ying', city: at('city_yiling', 'chengjia', 'han_d'), route: [p('夷陵', 30.7, 111.28), p('荆门山', 30.53, 111.4), p('巫县江关', 31.05, 109.6), p('江州', 29.56, 106.55)] }),
    B('evt_0631', '31A', 'han_d_gen_156', 'attacker', 'chengjia', 'attacker', { enemyGeneralId: 'kui_gongsunshu', from: 'city_yiling', city: at('city_chengdu', 'chengjia', 'han_d'), route: [p('鱼复', 31.02, 109.47), p('武阳', 30.18, 103.85), p('广都', 30.5, 104.05)] }),
    // ── 第 31B 棒 ──
    B('evt_0632', '31B', 'li_s_mayuan', 'attacker', 'canlang_qiang', 'attacker', { enemyGeneralId: 'canlang_qiang_shouling', from: 'city_lintao', city: at('city_ganquanyi', 'canlang_qiang', 'han_d') }),
    B('evt_0634', '31B', 'han_d_gen_158', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling_3' }),
    B('evt_0637', '31B', 'li_s_mayuan', 'attacker', 'luoyue', 'attacker', { enemyGeneralId: 'luoyue_zhengce', from: 'city_hepu', city: at('city_shenglong', 'luoyue', 'han_d'), route: [p('古森河口', 21.0, 107.3), p('浪泊', 21.05, 105.84), p('禁溪', 21.18, 105.55)] }),
    B('evt_0641', '31B', 'li_s_mayuan', 'attacker', 'wuhuan', 'attacker', { enemyGeneralId: 'wuhuan_shouling', from: 'city_datong' }),
    B('evt_0643', '31B', 'bfe_liu_shang', 'defender', 'wuling', 'attacker', { enemyGeneralId: 'wuling_xiangdancheng', from: 'city_ying', route: [p('临沅', 29.03, 111.69)] }),
    B('evt_0644', '31B', 'han_d_gen_162', 'defender', 'wuling', 'defender', { enemyGeneralId: 'wuling_xiangdancheng', city: at('city_wuling', 'han_d', 'han_d') }),
    B('evt_0645', '31B', 'nan_xiongnu_gen_164', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'huyan_peicen', from: 'city_chilechuan', route: [p('五原塞', 40.65, 109.8)] }),
    B('evt_0646', '31B', 'li_s_mayuan', 'attacker', 'wuling', 'attacker', { enemyGeneralId: 'wuling_xiangdancheng', from: 'city_luoyang', city: at('city_wulingshan', 'wuling', 'han_d'), route: [p('临沅', 29.03, 111.69), p('下隽道', 29.2, 111.2)] }),
    // ── 第 32B 棒 ──
    B('evt_0655', '32B', 'luoma_diguo_gen_12', 'attacker', 'armenia_arsacid', 'attacker', { enemyGeneralId: 'armenia_arsacid_gen_166', from: 'city_erzurum', city: at('city_ailiwen', 'armenia_arsacid', 'luoma_diguo'), route: [p('阿拉克斯河谷', 40.02, 43.8), p('阿尔塔克萨塔', 39.89, 44.58)] }),
    B('evt_0657', '32B', 'luoma_diguo_gen_12', 'attacker', 'armenia_arsacid', 'attacker', { enemyGeneralId: 'armenia_arsacid_shouling', from: 'city_ailiwen', city: at('city_tigranocerta', 'armenia_arsacid', 'luoma_diguo'), route: [p('阿尔塔克萨塔', 39.89, 44.58), p('陶鲁斯山道', 38.65, 42.2)] }),
    B('evt_0660', '32B', 'luoma_diguo_gen_168', 'defender', 'ansxi', 'attacker', { enemyGeneralId: 'ansxi_gen_167', from: 'city_mazaka', city: at('city_rhandeia', 'luoma_diguo', 'armenia_arsacid'), route: [p('尼西比斯', 37.07, 41.22), p('陶鲁斯山隘', 38.35, 40.2)] }),
    // ── 第 33A 棒 ──
    B('evt_0672', '33A', 'pulei_dougu', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'bfe_huyan_wang', from: 'city_jiuquan', city: at('city_hamiwei', 'xiongnu', 'han_d'), route: [p('酒泉塞', 39.74, 98.51), p('蒲类海', 43.6, 93.0), p('伊吾卢', 42.83, 93.52)] }),
    B('evt_0674', '33A', 'xiyuduhu_banchao', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling_3', from: 'city_balikun', city: at('city_loulan', 'shanshan', 'shanshan') }),
    B('evt_0675', '33A', 'xiyuduhu_banchao', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling_3', from: 'city_loulan', city: at('city_yutian2', 'yuchi', 'yuchi') }),
    B('evt_0678', '33A', 'chagatai_genggong', 'defender', 'xiongnu', 'defender', { enemyGeneralId: 'xiongnu_shouling_4', city: at('city_bieshibali', 'han_d', 'han_d') }),
    B('evt_0679', '33A', 'han_d_gen_170', 'attacker', 'chagatai', 'attacker', { enemyGeneralId: 'chagatai_shouling', from: 'city_jiuquan', city: at('city_tuokexun', 'chagatai', 'chagatai'), route: [p('酒泉', 39.74, 98.51), p('柳中', 42.73, 89.78), p('交河城', 42.95, 89.06), p('车师疏勒城', 43.99, 89.58), p('玉门关', 40.35, 93.86)] }),
    B('evt_0681', '33A', 'xiyuduhu_banchao', 'attacker', 'qiuci', 'attacker', { enemyGeneralId: 'qiuci_shouling', from: 'city_shule', city: at('city_kungang', 'qiuci', 'qiuci') }),
    B('evt_0682', '33A', 'xiyuduhu_banchao', 'attacker', 'shule', 'attacker', { enemyGeneralId: 'shule_gen_173', from: 'city_shule', city: at('city_shule', 'shule', 'shule') }),
    B('evt_0687', '33A', 'xiyuduhu_banchao', 'attacker', 'shule', 'attacker', { enemyGeneralId: 'bfe_shulezhong', from: 'city_shule', city: at('city_sunzhong', 'shule', 'shule') }),
    B('evt_0689', '33A', 'xiyuduhu_banchao', 'attacker', 'shache', 'attacker', { enemyGeneralId: 'shache_shouling', from: 'city_shule', city: at('city_shache', 'shache', 'shache') }),
    // ── 第 33B 棒 ──
    B('evt_0691', '33B', 'jiluo_d_douxian', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'bfe3_64', from: 'city_guanglu', route: [p('鸡鹿塞', 40.75, 106.95), p('涿邪山', 44.52, 101.45), p('稽落山', 44.97, 99.11), p('燕然山', 46.0, 101.5)] }),
    B('evt_0693', '33B', 'han_d_gengkui', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'bfe3_64', from: 'city_juyansai' }),
    B('evt_0694', '33B', 'han_d_gen_175', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_177', from: 'city_juyansai', route: [p('蒲类海', 43.6, 93.0)] }),
    B('evt_0696', '33B', 'han_d_gen_179', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_180', route: [p('朔方塞', 40.75, 108.65)] }),
    B('evt_0697', '33B', 'han_d_gen_181', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_183', from: 'city_chilechuan', route: [p('固阳塞', 41.08, 109.92)] }),
    B('evt_0699', '33B', 'nan_xiongnu_gen_184', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_180', from: 'city_eyangling', route: [p('美稷', 39.86, 111.23)] }),
    // ── 第 34A 棒 ──
    B('evt_0707', '34A', 'luoma_diguo_gen_13', 'attacker', 'daqiya', 'attacker', { enemyGeneralId: 'daqiya_gen_185', from: 'city_luoma', city: at('city_huneiduolala', 'daqiya', 'luoma_diguo'), route: [p('德罗贝塔跨多瑙河石桥', 44.62, 22.67), p('铁门关隘', 45.51, 22.78)] }),
    // ── 第 34B 棒 ──
    B('evt_0715', '34B', 'luoma_diguo_gen_13', 'attacker', 'armenia_arsacid', 'attacker', { enemyGeneralId: 'armenia_arsacid_gen_186', from: 'city_antiejiya', city: at('city_erzurum', 'armenia_arsacid', 'luoma_diguo'), route: [p('梅利特内', 38.35, 38.31), p('萨塔拉', 40.05, 39.6)] }),
    B('evt_0717', '34B', 'luoma_diguo_gen_13', 'attacker', 'ansxi', 'attacker', { enemyGeneralId: 'ansxi_gen_188', from: 'city_antiejiya', city: at('city_bageda', 'ansxi', 'luoma_diguo'), route: [p('尼西比斯', 37.07, 41.22), p('阿迪亚波纳', 36.19, 44.01), p('巴比伦', 32.54, 44.42), p('塞琉西亚', 33.09, 44.52), p('泰西封', 33.09, 44.58)] }),
    B('evt_0719', '34B', 'luoma_diguo_gen_13', 'attacker', 'hatra', 'defender', { enemyGeneralId: 'hatra_gen_189', from: 'city_bageda', city: at('city_hatra', 'hatra', 'hatra'), route: [p('泰西封', 33.09, 44.58)] }),
    // ── 第 35A 棒 ──
    B('evt_0722', '35A', 'yumen_suoban', 'defender', 'chagatai', 'attacker', { enemyGeneralId: 'chagatai_gen_190', city: at('city_hamiwei', 'han_d', 'xiongnu') }),
    B('evt_0726', '35A', 'han_d_gen_14', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_192', from: 'city_yiluolucheng', route: [p('柳中', 42.73, 89.78), p('楼兰', 40.52, 89.92), p('龟兹', 41.72, 82.93), p('伊尔王谷', 41.95, 82.9)] }),
    B('evt_0727', '35A', 'han_d_gen_14', 'attacker', 'chagatai', 'attacker', { enemyGeneralId: 'chagatai_gen_190', from: 'city_gaochangcheng', city: at('city_bieshibali', 'chagatai', 'chagatai'), route: [p('柳中', 42.73, 89.78), p('东天山道', 43.35, 89.65)] }),
    B('evt_0728', '35A', 'han_d_gen_14', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_shouling_5', from: 'city_gaochangcheng', route: [p('柳中', 42.73, 89.78), p('蒲类海西', 43.6, 92.8)] }),
    B('evt_0730', '35A', 'han_d_gen_14', 'attacker', 'yanqi', 'attacker', { enemyGeneralId: 'bfe_cb_yanqi_1', from: 'city_dunhuang', city: at('city_yanqi', 'yanqi', 'yanqi'), route: [p('柳中', 42.73, 89.78), p('爵离关', 41.82, 86.18)] }),
    // ── 第 35B 棒 ──
    B('evt_0739', '35B', 'han_d_gen_15', 'attacker', 'zhong_qiang', 'attacker', { enemyGeneralId: 'zhong_qiang_gen_196', from: 'city_yunwu' }),
    B('evt_0744', '35B', 'han_d_gen_195', 'defender', 'shaodang', 'attacker', { enemyGeneralId: 'shaodang_gen_197', city: at('city_lingju', 'han_d', 'han_d') }),
    B('evt_0745', '35B', 'han_d_gen_15', 'attacker', 'shaodang', 'attacker', { enemyGeneralId: 'shaodang_gen_197', from: 'city_yunwu', route: [p('允吾', 36.43, 102.83)] }),
    B('evt_0746', '35B', 'han_d_gen_15', 'defender', 'xiongnu', 'defender', { enemyGeneralId: 'xiongnu_gen_199', city: at('city_eyangling', 'han_d', 'han_d') }),
    B('evt_0747', '35B', 'han_d_gen_195', 'defender', 'qiedong_qiang', 'attacker', { enemyGeneralId: 'qiedong_qiang_shouling', from: 'city_tianshui' }),
    B('evt_0748', '35B', 'han_d_gen_201', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_199', from: 'city_eyangling' }),
    B('evt_0749', '35B', 'han_d_gen_202', 'attacker', 'shaodang', 'defender', { enemyGeneralId: 'shaodang_shouling', from: 'city_yunwu' }),
    B('evt_0757', '35B', 'han_d_gen_16', 'attacker', 'xiongnu', 'attacker', { enemyGeneralId: 'xiongnu_gen_204', route: [p('美稷', 39.86, 111.23), p('上郡龟兹县', 38.45, 110.15)] }),
    B('evt_0760', '35B', 'han_d_gen_16', 'attacker', 'xianbei', 'attacker', { enemyGeneralId: 'xianbei_shouling', from: 'city_eyangling' }),
    B('evt_0761', '35B', 'han_d_gen_17', 'attacker', 'shaodang', 'attacker', { enemyGeneralId: 'shaodang_shouling', from: 'city_yunwu', route: [p('罗亭谷', 35.42, 103.35), p('积石河', 35.58, 102.78)] }),
    B('evt_0762', '35B', 'han_d_gen_17', 'attacker', 'shaodang', 'attacker', { enemyGeneralId: 'shaodang_shouling', from: 'city_yunwu', route: [p('允吾', 36.43, 102.83), p('积石山', 35.45, 102.25), p('白石河源', 35.3, 101.8)] }),
    B('evt_0769', '35B', 'han_d_gen_17', 'attacker', 'xianlian_qiang', 'attacker', { enemyGeneralId: 'xianlian_qiang_shouling', from: 'city_yunwu', route: [p('鸾鸟', 37.75, 102.85)] }),
    B('evt_0770', '35B', 'han_d_gen_17', 'attacker', 'xianlian_qiang', 'attacker', { enemyGeneralId: 'xianlian_qiang_shouling', from: 'city_anding', route: [p('彭阳', 35.68, 107.2)] }),
    B('evt_0771', '35B', 'han_d_gen_17', 'attacker', 'xianlian_qiang', 'attacker', { enemyGeneralId: 'xianlian_qiang_shouling', from: 'city_xiaoguan', route: [p('凡亭山', 35.53, 106.68), p('射虎谷', 35.48, 106.52), p('汉阳西县', 34.38, 105.35)] }),
    // ── 第 35C 棒 ──
    B('evt_0778', '35C', 'han_d_gen_206', 'defender', 'xianbei', 'defender', { enemyGeneralId: 'xianbei_gen_208', from: 'city_anding' }),
    B('evt_0781', '35C', 'han_d_gen_206', 'defender', 'xianbei', 'attacker', { enemyGeneralId: 'xianbei_gen_208', from: 'city_datong', route: [p('高柳', 40.36, 113.75)] }),
    B('evt_0785', '35C', 'jingzhou_gs_huangfusong', 'attacker', 'baibo', 'attacker', { enemyGeneralId: 'baibo_zhangjue', from: 'city_luoyang', city: at('city_xinzheng', 'baibo', 'han_d'), route: [p('长社', 34.22, 113.82), p('东郡仓亭', 35.98, 115.65), p('广宗', 37.0, 115.35), p('下曲阳', 37.52, 114.95)] }),
    B('evt_0786', '35C', 'han_d_gen_212', 'attacker', 'baibo', 'attacker', { enemyGeneralId: 'baibo_gen_213', from: 'city_xinzheng', city: at('city_nanyang', 'baibo', 'han_d'), route: [p('长社', 34.22, 113.82), p('西鄂精山', 33.15, 112.48)] }),
    B('evt_0787', '35C', 'lushui_dongzhuo', 'attacker', 'liangzhou', 'attacker', { enemyGeneralId: 'liangzhou_gen_215', from: 'city_changan', route: [p('美阳', 34.36, 107.88), p('榆中', 35.85, 104.11)] }),
    B('evt_0788', '35C', 'xianbei_gen_217', 'attacker', 'han_d', 'defender', { enemyGeneralId: 'han_d_shouling', city: at('city_lingzhou', 'han_d', 'han_d') }),
    B('evt_0789', '35C', 'han_d_gen_219', 'defender', 'liangzhou', 'attacker', { enemyGeneralId: 'bfe3_67', city: at('city_tianshui', 'han_d', 'liangzhou') }),
    B('evt_0790', '35C', 'jingzhou_gs_huangfusong', 'attacker', 'liangzhou', 'attacker', { enemyGeneralId: 'bfe3_67', from: 'city_changan', city: at('city_qishan', 'han_d', 'han_d') }),
    B('evt_0791', '35C', 'xiliangjun_gen_220', 'defender', 'baibo', 'attacker', { enemyGeneralId: 'baibo_guotai', from: 'city_luoyang', route: [p('陕津', 34.78, 111.18), p('河东安邑', 35.14, 110.99)] }),
    B('evt_0792', '35C', 'xiliangjun_gen_221', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'cao_d_caocao', from: 'city_luoyang', route: [p('酸枣', 35.15, 114.2)] }),
    // ── 第 36A 棒 ──
    B('evt_0793', '36A', 'xiliangjun_gen_222', 'defender', 'sunwu_d', 'attacker', { enemyGeneralId: 'ruzhou_sunjian', from: 'city_luoyang', route: [p('鲁阳', 33.74, 112.9), p('梁东', 34.15, 112.88), p('阳人聚', 34.18, 112.82), p('大谷关', 34.45, 112.6), p('洛阳', 34.62, 112.45)] }),
    B('evt_0794', '36A', 'hejian_gongsunzan', 'defender', 'yuan_shao', 'attacker', { enemyGeneralId: 'bfe3_71', from: 'city_beijing' }),
    B('evt_0795', '36A', 'xiliangjun_gen_223', 'attacker', 'lvbu', 'attacker', { enemyGeneralId: 'pizhou_lvbu', from: 'city_hanguguan', city: at('city_changan', 'han_d', 'xiliangjun'), route: [p('陕县', 34.77, 111.1), p('蓝田', 34.15, 109.32)] }),
    B('evt_0796', '36A', 'cao_d_caocao', 'attacker', 'baibo', 'attacker', { enemyGeneralId: 'baibo_shouling', from: 'city_puyang', route: [p('寿张', 35.9, 116.12), p('济北', 36.25, 116.45)] }),
    B('evt_0797', '36A', 'cao_d_caocao', 'attacker', 'zhongjia', 'attacker', { enemyGeneralId: 'zhongjia_gen_226', from: 'city_dingtao', route: [p('鄄城', 35.56, 115.51), p('白马', 35.53, 114.68), p('封丘', 35.04, 114.42), p('匡亭', 35.08, 114.58), p('襄邑', 34.43, 115.07), p('宁陵', 34.45, 115.32), p('寿春', 32.58, 116.78)] }),
    B('evt_0799', '36A', 'cao_d_caocao', 'attacker', 'lvbu', 'draw', { enemyGeneralId: 'pizhou_lvbu', from: 'city_pengcheng', city: at('city_puyang', 'lvbu', 'lvbu'), route: [p('郯城', 34.61, 118.35), p('鄄城', 35.56, 115.51)] }),
    B('evt_0800', '36A', 'cao_d_caocao', 'attacker', 'lvbu', 'attacker', { enemyGeneralId: 'pizhou_lvbu', from: 'city_dingtao', city: at('city_dingtao', 'lvbu', 'caowei'), route: [p('巨野', 35.39, 116.09), p('东缗', 35.07, 116.31)] }),
    B('evt_0801', '36A', 'shanyue_sunce', 'attacker', 'han_d', 'attacker', { enemyGeneralId: 'bfe3_70', from: 'city_shouxian', city: at('city_changzhou', 'han_d', 'sunwu_d'), route: [p('历阳', 31.72, 118.36), p('牛渚', 31.68, 118.45), p('神亭岭', 31.95, 119.52)] }),
    B('evt_0804', '36A', 'cao_d_caocao', 'defender', 'xiliangjun', 'attacker', { enemyGeneralId: 'xiliangjun_gen_229', city: at('city_nanyang', 'caowei', 'xiliangjun') }),
    B('evt_0806', '36A', 'cao_d_caocao', 'attacker', 'lvbu', 'attacker', { enemyGeneralId: 'pizhou_lvbu', from: 'city_xuchang', city: at('city_xiapi', 'lvbu', 'caowei'), route: [p('彭城', 34.26, 117.18)] }),
    B('evt_0807', '36A', 'hejian_gongsunzan', 'defender', 'yuan_shao', 'attacker', { enemyGeneralId: 'bfe3_71', city: at('city_fanyang', 'you', 'yuan_shao') }),
    B('evt_0808', '36A', 'shanyue_sunce', 'attacker', 'jingzhou', 'attacker', { enemyGeneralId: 'bfe_cb_jingzhou_1', from: 'city_qianshan', route: [p('寻阳', 29.73, 115.98)] }),
    B('evt_0809', '36A', 'cao_d_caocao', 'defender', 'yuan_shao', 'defender', { enemyGeneralId: 'bfe_cb_yuan_shao_1', from: 'city_bianliang', route: [p('黎阳', 35.67, 114.55), p('官渡', 34.75, 114.08), p('延津', 35.15, 114.2)] }),
    B('evt_0810', '36A', 'bfe3_71', 'defender', 'caowei', 'attacker', { enemyGeneralId: 'cao_d_caocao', from: 'city_zhaoge', route: [p('官渡', 34.75, 114.08), p('乌巢', 35.06, 114.38)] }),
    // ── 第 36B 棒 ──
    B('evt_0811', '36B', 'cao_d_caocao', 'attacker', 'yuan_shao', 'attacker', { enemyGeneralId: 'bfe3_71', from: 'city_xuchang' }),
    B('evt_0812', '36B', 'shu_liubei', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'bozhou_d_yujin', from: 'city_nanyang', route: [p('新野', 32.52, 112.36)] }),
    B('evt_0814', '36B', 'cao_d_caocao', 'attacker', 'yuan_shao', 'attacker', { enemyGeneralId: 'yuan_shao_gen_238', from: 'city_zhaoge', city: at('city_anyang', 'yuan_shao', 'caowei'), route: [p('黎阳', 35.67, 114.55), p('邯郸', 36.61, 114.49), p('滏水', 36.42, 114.45)] }),
    B('evt_0815', '36B', 'cao_d_caocao', 'attacker', 'yuan_shao', 'attacker', { enemyGeneralId: 'yuan_shao_gen_241', from: 'city_anyang', city: at('city_qingchi', 'yuan_shao', 'caowei'), route: [p('邺城', 36.32, 114.42), p('平原', 37.16, 116.43)] }),
    B('evt_0816', '36B', 'cao_d_caocao', 'attacker', 'yuan_shao', 'attacker', { enemyGeneralId: 'yuan_shao_gen_242', from: 'city_anyang', city: at('city_shangdang', 'yuan_shao', 'caowei'), route: [p('邺城', 36.32, 114.42), p('太行陉', 35.22, 112.92)] }),
    B('evt_0817', '36B', 'cao_d_caocao', 'attacker', 'wuhuan', 'attacker', { enemyGeneralId: 'wuhuan_tadun', from: 'city_anyang', city: at('city_bailangshan', 'wuhuan', 'caowei'), route: [p('邺城', 36.32, 114.42), p('无终', 40.04, 117.4), p('卢龙塞', 40.42, 118.35), p('白檀', 40.98, 117.65), p('平冈', 41.05, 118.85), p('白狼山', 41.15, 119.72), p('柳城', 41.28, 120.42)] }),
    B('evt_0818', '36B', 'jiujiang_zhouyu', 'attacker', 'jingzhou', 'attacker', { enemyGeneralId: 'bfe_cb_jingzhou_1', from: 'city_gusu', city: at('city_wuchang', 'jingzhou', 'sunwu_d'), route: [p('柴桑', 29.7, 115.99)] }),
    B('evt_0819', '36B', 'cao_d_caocao', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'shu_liubei', from: 'city_xiangyang', route: [p('当阳长坂', 30.82, 111.79), p('汉津', 30.58, 112.58), p('夏口', 30.55, 114.28)] }),
    B('evt_0820', '36B', 'cao_d_caocao', 'defender', 'sunwu_d', 'attacker', { enemyGeneralId: 'jiujiang_zhouyu', from: 'city_ying', route: [p('柴桑', 29.7, 115.99), p('夏口', 30.55, 114.28), p('赤壁乌林', 29.89, 113.62), p('华容道', 29.95, 112.9)] }),
    B('evt_0821', '36B', 'jiujiang_zhouyu', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'caoren', from: 'city_wuchang', city: at('city_ying', 'caowei', 'sunwu_d'), route: [p('乌林', 29.89, 113.62), p('夷陵', 30.7, 111.28)] }),
    // ── 第 36C 棒 ──
    B('evt_0822', '36C', 'cao_d_caocao', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'cangsong_machao', from: 'city_xuchang', city: at('city_tongguan', 'xiliangjun', 'caowei'), route: [p('洛阳', 34.62, 112.45), p('潼关', 34.61, 110.29), p('蒲阪津', 34.82, 110.27), p('渭南', 34.52, 109.95)] }),
    B('evt_0823', '36C', 'shu_liubei', 'attacker', 'han_d', 'attacker', { enemyGeneralId: 'baishui_yanghuai', from: 'city_jianmenguan', city: at('city_mianyang', 'han_d', 'shu'), route: [p('葭萌', 32.33, 105.71), p('白水关', 32.51, 105.51)] }),
    B('evt_0825', '36C', 'shu_liubei', 'attacker', 'han_d', 'attacker', { enemyGeneralId: 'han_d_gen_248', from: 'city_mianyang', city: at('city_chengdu', 'han_d', 'shu'), route: [p('绵竹', 31.34, 104.2), p('雒城雁桥', 30.99, 104.28)] }),
    B('evt_0826', '36C', 'cao_d_caocao', 'attacker', 'hanning', 'attacker', { enemyGeneralId: 'hanning_gen_250', from: 'city_changan', city: at('city_lueyang', 'hanning', 'caowei'), route: [p('陈仓', 34.36, 107.24), p('大散关', 34.26, 106.95), p('河池', 33.85, 105.98), p('阳平关', 33.08, 106.28), p('南郑', 33.07, 107.02)] }),
    B('evt_0827', '36C', 'lu_zhangliao', 'defender', 'sunwu_d', 'defender', { enemyGeneralId: 'wuwu_d_lvmeng', from: 'city_hefei', route: [p('濡须坞', 31.52, 117.92)] }),
    B('evt_0831', '36C', 'shu_liubei', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'bfe_zhanghe', from: 'city_jianmenguan', city: at('city_hanzhong', 'caowei', 'shu'), route: [p('葭萌', 32.33, 105.71), p('阳平关', 33.08, 106.28), p('沔阳定军山', 33.06, 106.67), p('南郑', 33.07, 107.02)] }),
    B('evt_0832', '36C', 'chu_guanyu', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'caoren', from: 'city_ying' }),
    B('evt_0834', '36C', 'caowei_gen_254', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'shu_gen_255', from: 'city_xiangyang', city: at('city_shangyong', 'shu', 'caowei'), route: [p('房陵', 32.05, 110.74)] }),
    // ── 第 37A 棒 ──
    B('evt_0836', '37A', 'yidou_luxun', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'shu_liubei', from: 'city_ying', city: at('city_yiling', 'shu', 'sunwu_d'), route: [p('巫县', 31.07, 109.88), p('秭归', 30.83, 110.97), p('夷陵', 30.7, 111.28), p('猇亭', 30.55, 111.42)] }),
    B('evt_0837', '37A', 'caoren', 'attacker', 'sunwu_d', 'defender', { enemyGeneralId: 'sunwu_d_gen_256', from: 'city_nanyang', city: at('city_ying', 'sunwu_d', 'sunwu_d'), route: [p('襄阳', 32.01, 112.12)] }),
    B('evt_0839', '37A', 'huizhou_zhugeliang', 'attacker', 'sou', 'attacker', { enemyGeneralId: 'sou_gaodingyuan', from: 'city_chengdu', city: at('city_tuodongcheng', 'sou', 'shu'), route: [p('安上', 28.8, 104.25), p('越嶲卑水', 27.87, 102.31)] }),
    B('evt_0840', '37A', 'sima_d_simayi', 'defender', 'sunwu_d', 'defender', { enemyGeneralId: 'sunwu_d_sunquan', from: 'city_luoyang', city: at('city_xiangyang', 'caowei', 'caowei'), route: [p('武昌', 30.53, 114.32), p('石阳', 31.25, 113.92)] }),
    B('evt_0841', '37A', 'sima_d_simayi', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'shu_mengda', from: 'city_nanyang', city: at('city_shangyong', 'shu', 'caowei'), route: [p('西城', 32.69, 109.03)] }),
    B('evt_0842', '37A', 'bfe_zhanghe', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'jingmen_zhaoyun', from: 'city_changan', city: at('city_longcheng', 'shu', 'caowei'), route: [p('郿县', 34.27, 107.75), p('番须陇坻', 34.92, 106.32)] }),
    B('evt_0843', '37A', 'yidou_luxun', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'huang_d_sunshuao', from: 'city_wuchang', route: [p('寿春', 32.59, 116.8), p('夹石', 30.92, 116.78)] }),
    B('evt_0844', '37A', 'huizhou_zhugeliang', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'caowei_gen_272', from: 'city_hanzhong', city: at('city_ganquanyi', 'caowei', 'shu'), route: [p('阳平关', 33.09, 106.15), p('建威', 33.58, 105.28)] }),
    B('evt_0845', '37A', 'shu_gen_273', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'caowei_gen_272', from: 'city_hanzhong', route: [p('武都', 33.43, 105.14)] }),
    B('evt_0846', '37A', 'huizhou_zhugeliang', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'sima_d_simayi', from: 'city_hanzhong', city: at('city_tianshui', 'caowei', 'caowei'), route: [p('祁山', 34.25, 105.33), p('上邽', 34.58, 105.73), p('卤城', 34.34, 105.46)] }),
    B('evt_0848', '37A', 'guzhu_tianyu', 'defender', 'xianbei', 'defender', { enemyGeneralId: 'bfe3_74', from: 'city_feiru', city: at('city_macheng', 'caowei', 'caowei'), route: [p('塞北陉北', 40.95, 114.2)] }),
    // ── 第 37B 棒 ──
    B('evt_0850', '37B', 'caowei_gen_18', 'defender', 'gongsun_d', 'attacker', { enemyGeneralId: 'bfe_cb_gongsun_d_1', from: 'city_gubeikou', route: [p('蓟城', 39.9, 116.35), p('右北平', 40.05, 118.85)] }),
    B('evt_0852', '37B', 'sima_d_simayi', 'attacker', 'gongsun_d', 'attacker', { enemyGeneralId: 'bfe_cb_gongsun_d_1', from: 'city_luoyang', city: at('city_liaoyang', 'gongsun_d', 'caowei'), route: [p('孤竹辽西', 39.89, 118.89), p('辽隧', 41.05, 122.65), p('首山', 41.19, 123.08)] }),
    B('evt_0855', '37B', 'sima_d_simayi', 'defender', 'sunwu_d', 'defender', { enemyGeneralId: 'sunwu_d_gen_270', from: 'city_luoyang', city: at('city_shouxian', 'caowei', 'caowei'), route: [p('邓县', 32.15, 112.08), p('樊城', 32.04, 112.14), p('三州口', 31.52, 112.55)] }),
    B('evt_0856', '37B', 'gaogouli_gen_284', 'attacker', 'caowei', 'attacker', { enemyGeneralId: 'caowei_shouling', from: 'city_guoneicheng', city: at('city_longwan', 'caowei', 'caowei') }),
    B('evt_0858', '37B', 'bfe3_76', 'attacker', 'shu', 'defender', { enemyGeneralId: 'yangzhou_wangping', from: 'city_changan', city: at('city_yangxian', 'shu', 'shu'), route: [p('郿县骆谷', 34.12, 107.82)] }),
    B('evt_0859', '37B', 'caowei_gen_18', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'gaogouli_gen_284', from: 'city_liaoyang', route: [p('玄菟', 41.82, 123.55), p('沸流水', 41.35, 125.18)] }),
    B('evt_0860', '37B', 'caowei_gen_18', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'gaogouli_gen_284', from: 'city_liaoyang', city: at('city_guoneicheng', 'gaogouli', 'gaogouli'), route: [p('玄菟', 41.82, 123.55), p('丸都山城', 41.16, 126.16), p('南沃沮', 40.05, 127.55), p('肃慎南界', 42.95, 130.35)] }),
    B('evt_0861', '37B', 'caowei_gen_272', 'defender', 'shu', 'attacker', { enemyGeneralId: 'qingqiang_jiangwei', from: 'city_changan', route: [p('汉中阴平', 32.42, 104.92), p('枹罕', 35.58, 103.21), p('为翅', 35.12, 103.85), p('河关', 35.48, 102.95)] }),
    B('evt_0863', '37B', 'wudu_dengai', 'attacker', 'shu', 'attacker', { enemyGeneralId: 'qingqiang_jiangwei', from: 'city_tianshui', city: at('city_longxi', 'shu', 'caowei'), route: [p('阴平', 32.42, 104.92), p('曲城', 34.45, 104.18)] }),
    // ── 第 38 棒 ──
    B('evt_0854', '38', 'aba_shapuer', 'attacker', 'hatra', 'attacker', { enemyGeneralId: 'hatra_gen_293', from: 'city_bageda', city: at('city_hatra', 'hatra', 'sashan'), route: [p('泰西封', 33.09, 44.58)] }),
    B('evt_0857', '38', 'aba_shapuer', 'defender', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_gen_294', from: 'city_bageda', city: at('city_resaina', 'sashan', 'luoma_diguo'), route: [p('安条克', 36.2, 36.16), p('卡莱', 36.87, 39.03), p('雷萨伊纳', 36.85, 40.07), p('尼西比斯', 37.07, 41.22)] }),
    B('evt_0875', '38', 'aba_shapuer', 'attacker', 'luoma_diguo', 'attacker', { enemyGeneralId: 'bfe3_77', from: 'city_bageda', city: at('city_aidesa', 'luoma_diguo', 'luoma_diguo'), route: [p('安条克', 36.2, 36.16), p('萨莫萨塔', 37.58, 38.48), p('卡莱', 36.87, 39.03)] }),
    B('evt_0876', '38', 'aba_shapuer', 'defender', 'paermila', 'attacker', { enemyGeneralId: 'paermila_gen_296', from: 'city_antiejiya', route: [p('帕尔米拉', 34.55, 38.27)] }),
    // ── 第 39A 棒 ──
    B('evt_0881', '39A', 'luoma_diguo_gen_298', 'defender', 'goths_migration', 'attacker', { enemyGeneralId: 'goths_migration_gen_297', city: at('city_yadian', 'luoma_diguo', 'luoma_diguo') }),
    B('evt_0882', '39A', 'bfe3_79', 'attacker', 'alamanni', 'attacker', { enemyGeneralId: 'alamanni_shouling', from: 'city_milan' }),
    B('evt_0883', '39A', 'bfe3_79', 'attacker', 'goths_migration', 'attacker', { enemyGeneralId: 'goths_migration_shouling', from: 'city_luoma', route: [p('帖撒罗尼迦', 40.64, 22.94), p('多伊兰', 41.18, 22.72)] }),
    B('evt_0885', '39A', 'bfe3_79', 'attacker', 'juthungi', 'attacker', { enemyGeneralId: 'juthungi_shouling', from: 'city_milan', route: [p('普拉森提亚', 45.05, 9.69), p('法诺梅陶罗河', 43.84, 13.02)] }),
    // ── 第 39B 棒 ──
    B('evt_0886', '39B', 'bfe3_79', 'attacker', 'paermila', 'attacker', { enemyGeneralId: 'paermila_gen_301', from: 'city_junshitandingbao', city: at('city_emesa', 'paermila', 'luoma_diguo'), route: [p('安卡拉', 39.93, 32.86), p('安条克伊姆迈', 36.23, 36.48), p('埃梅萨', 34.73, 36.71), p('帕尔米拉', 34.55, 38.27)] }),
    B('evt_0888', '39B', 'bfe3_79', 'attacker', 'paermila', 'attacker', { enemyGeneralId: 'paermila_gen_302', from: 'city_aidiernei', city: at('city_yalishanda', 'paermila', 'luoma_diguo'), route: [p('安条克', 36.2, 36.16), p('帕尔米拉', 34.55, 38.27)] }),
    // ── 第 39C 棒 ──
    B('evt_0889', '39C', 'bfe3_79', 'attacker', 'gallic_empire', 'attacker', { enemyGeneralId: 'bfe_cb_gallic_empire_1', from: 'city_lyon', city: at('city_lansi', 'gallic_empire', 'luoma_diguo'), route: [p('马恩河沙隆', 48.96, 4.36), p('兰斯', 49.26, 4.03)] }),
    B('evt_0891', '39C', 'luoma_diguo_gen_304', 'attacker', 'lugii', 'attacker', { enemyGeneralId: 'lugii_gen_305', from: 'city_lyon', city: at('city_teerier', 'alamanni', 'luoma_diguo'), route: [p('特里尔摩泽尔河', 49.75, 6.64), p('内卡河谷', 49.15, 9.22)] }),
    B('evt_0892', '39C', 'luoma_diguo_gen_304', 'attacker', 'vandali_tribes', 'attacker', { enemyGeneralId: 'vandali_tribes_gen_306', from: 'city_milan' }),
    // ── 第 40A 棒 ──
    B('evt_0884', '40A', 'dongjin_gen_308', 'defender', 'xianbei', 'attacker', { enemyGeneralId: 'xianbei_gen_307', from: 'city_changan', route: [p('泾州高平', 36.0, 106.28)] }),
    B('evt_0890', '40A', 'dongjin_gen_310', 'attacker', 'xianbei', 'attacker', { enemyGeneralId: 'xianbei_gen_307', from: 'city_changan', route: [p('金城允吾', 36.3, 102.9), p('武威塞外', 37.65, 102.8)] }),
    B('evt_0893', '40A', 'dongjin_gen_19', 'attacker', 'xianbei', 'attacker', { enemyGeneralId: 'xianbei_gen_307', from: 'city_luoyang', city: at('city_wuwei', 'xianbei', 'dongjin'), route: [p('长安', 34.27, 108.93), p('温水', 36.75, 103.52)] }),
    B('evt_0894', '40A', 'dongjin_gen_314', 'attacker', 'sunwu_d', 'attacker', { enemyGeneralId: 'sunwu_d_gen_317', from: 'city_chengdu', city: at('city_nanjing', 'sunwu_d', 'dongjin'), route: [p('白帝巫峡', 31.04, 109.57), p('西陵夷陵', 30.7, 111.28), p('武昌', 30.53, 114.32)] }),
    B('evt_0907', '40A', 'dongjin_gen_321', 'defender', 'qiwanyian_jun', 'attacker', { enemyGeneralId: 'qiwanyian_jun_gen_320', from: 'city_changan' }),
    B('evt_0909', '40A', 'dongjin_gen_324', 'attacker', 'qiwanyian_jun', 'attacker', { enemyGeneralId: 'qiwanyian_jun_gen_320', from: 'city_luoyang', city: at('city_qishan', 'qiwanyian_jun', 'dongjin'), route: [p('槐里', 34.29, 108.58)] }),
    B('evt_0911', '40A', 'dongjin_gen_325', 'attacker', 'zhaowang_lun', 'attacker', { enemyGeneralId: 'zhaowang_lun_gen_326', from: 'city_anyang', route: [p('朝歌', 35.6, 114.18), p('温县黄桥', 34.94, 113.08), p('孟津洛阳', 34.62, 112.45)] }),
    B('evt_0914', '40A', 'dongjin_gen_328', 'defender', 'chengdu_ying', 'defender', { enemyGeneralId: 'chengdu_ying_gen_327', city: at('city_luoyang', 'dongjin', 'dongjin') }),
    B('evt_0916', '40A', 'bfe_cb_dongjin_2', 'attacker', 'chengdu_ying', 'defender', { enemyGeneralId: 'chengdu_ying_gen_330', from: 'city_luoyang' }),
    B('evt_0917', '40A', 'dongjin_gen_331', 'attacker', 'han_zhao', 'defender', { enemyGeneralId: 'yao_liuyuan', from: 'city_taiyuan', city: at('city_lishi', 'han_zhao', 'han_zhao'), route: [p('大陵', 37.42, 112.02)] }),
    B('evt_0919', '40A', 'dongjin_gen_332', 'attacker', 'hejian_yong', 'attacker', { enemyGeneralId: 'hejian_yong_gen_333', from: 'city_luoyang', city: at('city_changan', 'dongjin', 'dongjin'), route: [p('函谷关', 34.64, 110.92), p('霸水', 34.28, 109.06)] }),
    // ── 第 40B 棒 ──
    B('evt_0920', '40B', 'cai_lishuo', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_331', from: 'city_wudingzhou', city: at('city_anyang', 'dongjin', 'dongjin'), route: [p('茌平马牧', 36.58, 116.25), p('馆陶', 36.53, 115.28)] }),
    B('evt_0923', '40B', 'cai_lishuo', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_334', from: 'city_linfen', city: at('city_huojia', 'dongjin', 'han_zhao'), route: [p('武德', 35.12, 113.38)] }),
    B('evt_0924', '40B', 'cai_lishuo', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'bfe_wangyan', from: 'city_xuchang', route: [p('项县', 33.26, 114.88)] }),
    B('evt_0925', '40B', 'han_zhao_liuyao', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_simachi', from: 'city_linfen', city: at('city_luoyang', 'dongjin', 'han_zhao'), route: [p('洛水', 34.65, 112.48)] }),
    B('evt_0929', '40B', 'han_zhao_liuyao', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_335', from: 'city_linfen', city: at('city_jinsuoguan', 'dongjin', 'han_zhao'), route: [p('河东蒲坂', 34.88, 110.32), p('冯翊', 34.8, 109.94)] }),
    B('evt_0930', '40B', 'han_zhao_liuyao', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'bfe_cb_dongjin_4', from: 'city_jinsuoguan', city: at('city_changan', 'dongjin', 'han_zhao'), route: [p('北地', 35.03, 108.95), p('泾阳渭北', 34.53, 108.84)] }),
    B('evt_0931', '40B', 'yuzhou_zuti', 'attacker', 'fanya_jun', 'attacker', { enemyGeneralId: 'fanya_jun_gen_337', from: 'city_huaiyin', city: at('city_qiaojun', 'fanya_jun', 'dongjin'), route: [p('京口', 32.2, 119.45), p('淮阴', 33.5, 119.13)] }),
    B('evt_0932', '40B', 'han_zhao_liuyao', 'attacker', 'jinzhun_jun', 'attacker', { enemyGeneralId: 'jinzhun_jun_gen_338', from: 'city_xingtai', city: at('city_linfen', 'jinzhun_jun', 'han_zhao'), route: [p('上党', 36.15, 113.01)] }),
    // ── 第 40C 棒 ──
    B('evt_0933', '40C', 'shizhao_d_shihu', 'defender', 'dongjin', 'defender', { enemyGeneralId: 'yuzhou_zuti', from: 'city_xingtai', city: at('city_bianliang', 'hou_zhao', 'hou_zhao') }),
    B('evt_0934', '40C', 'bfe_taobao', 'defender', 'dongjin', 'attacker', { enemyGeneralId: 'yuzhou_zuti', city: at('city_yongqiu', 'hou_zhao', 'dongjin') }),
    B('evt_0935', '40C', 'shizhao_d_shihu', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_339', from: 'city_xingtai', city: at('city_wudingzhou', 'dongjin', 'hou_zhao') }),
    B('evt_0937', '40C', 'shizhao_d_shihu', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'bfe_cb_dongjin_5', from: 'city_xingtai', city: at('city_linzi', 'dongjin', 'hou_zhao'), route: [p('平原', 37.16, 116.43)] }),
    B('evt_0940', '40C', 'hou_zhao_gen_341', 'attacker', 'dongjin', 'defender', { enemyGeneralId: 'dongjin_gen_342', from: 'city_zhaoge', city: at('city_shouxian', 'dongjin', 'dongjin'), route: [p('寿春', 32.59, 116.8), p('逡遒', 31.88, 117.75)] }),
    B('evt_0943', '40C', 'cai_lishuo', 'attacker', 'han_zhao', 'attacker', { enemyGeneralId: 'han_zhao_liuyao', from: 'city_xingtai', city: at('city_luoyang', 'hou_zhao', 'hou_zhao'), route: [p('成皋孟津', 34.82, 112.78)] }),
    B('evt_0944', '40C', 'shizhao_d_shihu', 'attacker', 'han_zhao', 'attacker', { enemyGeneralId: 'han_zhao_gen_343', from: 'city_xingtai', city: at('city_tianshui', 'han_zhao', 'hou_zhao'), route: [p('潼关长安', 34.27, 108.93), p('义渠', 35.58, 107.85)] }),
    B('evt_0948', '40C', 'shizhao_d_shihu', 'attacker', 'shilang_jun', 'attacker', { enemyGeneralId: 'shilang_jun_gen_344', from: 'city_xingtai', city: at('city_luoyang', 'hou_zhao', 'hou_zhao') }),
    // ── 第 41 棒 ──
    B('evt_0949', '41', 'yingzhou_ying_d_muronghuang', 'defender', 'xianbei', 'defender', { enemyGeneralId: 'xianbei_gen_345', from: 'city_jicheng', city: at('city_chaoyang', 'murong', 'murong'), route: [p('令支', 39.89, 118.89)] }),
    B('evt_0951', '41', 'yingzhou_ying_d_muronghuang', 'attacker', 'murong_ren', 'attacker', { enemyGeneralId: 'murong_ren_gen_346', from: 'city_jicheng', city: at('city_pingguo', 'murong', 'murong'), route: [p('渤海冰道', 40.75, 121.55)] }),
    B('evt_0953', '41', 'yingzhou_ying_d_muronghuang', 'defender', 'hou_zhao', 'defender', { enemyGeneralId: 'shizhao_d_shihu', city: at('city_jicheng', 'murong', 'murong') }),
    B('evt_0957', '41', 'yingzhou_ying_d_muronghuang', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'bfe_cb_gaogouli_1', from: 'city_chaoyang', city: at('city_guoneicheng', 'gaogouli', 'gaogouli'), route: [p('南道木底', 41.32, 124.85)] }),
    B('evt_0967', '41', 'murong_murongke', 'attacker', 'ranwei_d', 'attacker', { enemyGeneralId: 'ranwei_d_ranmin', from: 'city_zhongshan', route: [p('邺城', 36.1, 114.39), p('常山安喜', 38.47, 115.06)] }),
    B('evt_0970', '41', 'murong_murongke', 'attacker', 'duanqi', 'attacker', { enemyGeneralId: 'bfe_cb_xianbei_2', from: 'city_anyang', city: at('city_linzi', 'duanqi', 'duanqi'), route: [p('碻磝济水', 36.52, 116.25)] }),
    // ── 第 42A 棒 ──
    B('evt_0965', '42A', 'bfe_cb_sashan_2', 'attacker', 'luoma_diguo', 'defender', { enemyGeneralId: 'luoma_diguo_gen_349', from: 'city_bageda', city: at('city_nixibisi', 'luoma_diguo', 'luoma_diguo'), route: [p('泰西封', 33.09, 44.58)] }),
    B('evt_0974', '42A', 'bfe_cb_sashan_2', 'attacker', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_gen_350', from: 'city_bageda', city: at('city_amida', 'luoma_diguo', 'sashan'), route: [p('泰西封', 33.09, 44.58), p('尼西比斯外围', 37.07, 41.22)] }),
    B('evt_0975', '42A', 'bfe_cb_sashan_2', 'attacker', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_shouling', from: 'city_bageda', city: at('city_singara', 'luoma_diguo', 'sashan'), route: [p('底格里斯河岸', 36.35, 43.15)] }),
    B('evt_0978', '42A', 'bfe_cb_sashan_2', 'defender', 'luoma_diguo', 'defender', { enemyGeneralId: 'gen_julian_apostate', from: 'city_bageda', route: [p('安条克', 36.2, 36.16), p('卡利尼库姆', 35.95, 39.02), p('泰西封', 33.09, 44.58)] }),
    // ── 第 42B 棒 ──
    B('evt_0992', '42B', 'goths_migration_gen_21', 'defender', 'luoma_diguo', 'draw', { enemyGeneralId: 'luoma_diguo_gen_351', route: [p('马尔基亚诺波利斯', 43.22, 27.58)] }),
    B('evt_0993', '42B', 'goths_migration_gen_21', 'defender', 'luoma_diguo', 'defender', { enemyGeneralId: 'luoma_diguo_gen_352', route: [p('君士坦丁堡', 41.01, 28.97)] }),
    B('evt_0995', '42B', 'goths_migration_gen_21', 'attacker', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_gen_353', from: 'city_aidiernei' }),
    // ── 第 42C 棒 ──
    B('evt_0982', '42C', 'fushi_wangmeng', 'attacker', 'fuliu_jun', 'attacker', { enemyGeneralId: 'fuliu_jun_gen_354', from: 'city_changan', city: at('city_tongguan', 'fushi', 'fushi') }),
    B('evt_0984', '42C', 'dingzhou_d_murongchui', 'defender', 'dongjin', 'defender', { enemyGeneralId: 'danyang_huanwen', from: 'city_anyang', route: [p('姑孰', 31.55, 118.47), p('金乡巨野', 35.07, 116.31), p('枋头', 35.63, 114.52), p('襄邑', 34.43, 115.15)] }),
    B('evt_0985', '42C', 'fushi_wangmeng', 'attacker', 'murong', 'attacker', { enemyGeneralId: 'bfe3_87', from: 'city_changan', city: at('city_shangdang', 'murong', 'fushi'), route: [p('蒲坂', 34.88, 110.32), p('壶关', 36.12, 113.2), p('晋阳', 37.87, 112.55), p('潞川', 36.32, 113.22), p('邺城', 36.1, 114.39)] }),
    B('evt_0988', '42C', 'dongjin_gen_355', 'defender', 'fushi', 'attacker', { enemyGeneralId: 'fushi_shouling', from: 'city_chengdu', city: at('city_jianmenguan', 'dongjin', 'fushi'), route: [p('南郑', 33.07, 107.02), p('青谷剑阁', 32.28, 105.53), p('阴平绵竹', 31.34, 104.2), p('成都', 30.57, 104.07)] }),
    B('evt_0991', '42C', 'fushi_gen_356', 'attacker', 'qianliang', 'attacker', { enemyGeneralId: 'qianliang_gen_357', from: 'city_changan', city: at('city_wuwei', 'qianliang', 'fushi'), route: [p('枹罕石城津', 35.85, 103.32), p('洪池', 37.45, 102.85)] }),
    B('evt_0994', '42C', 'bfe_cb_fushi_2', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_359', from: 'city_luoyang', city: at('city_xiangyang', 'dongjin', 'fushi'), route: [p('洛阳宛城', 32.99, 112.53)] }),
    B('evt_0998', '42C', 'zhong_xiexuan', 'defender', 'fushi', 'defender', { enemyGeneralId: 'bfe3_88', from: 'city_huaiyin', city: at('city_shouxian', 'fushi', 'dongjin'), route: [p('长安', 34.27, 108.93), p('项城', 33.26, 114.88)] }),
    B('evt_0999', '42C', 'dingzhou_d_murongchui', 'attacker', 'fushi', 'attacker', { enemyGeneralId: 'bfe_cb_fushi_2', from: 'city_bianliang', city: at('city_anyang', 'fushi', 'fushi'), route: [p('荥阳', 34.79, 113.39), p('馆陶', 36.53, 115.28)] }),
    B('evt_1000', '42C', 'murong_gen_360', 'attacker', 'fushi', 'attacker', { enemyGeneralId: 'fushi_gen_361', from: 'city_tongguan', city: at('city_changan', 'fushi', 'murong'), route: [p('阿房', 34.26, 108.81), p('长安', 34.27, 108.93), p('五将山', 34.68, 107.98)] }),
    B('evt_1001', '42C', 'xiongding_murongyong', 'attacker', 'fushi', 'attacker', { enemyGeneralId: 'bfe_cb_fushi_2', from: 'city_tongguan', route: [p('闻喜河东', 35.36, 111.22), p('襄陵', 36.01, 111.42), p('长子', 36.15, 113.01)] }),
    B('evt_1004', '42C', 'bfe_cb_fushi_4', 'defender', 'hou_qin', 'attacker', { enemyGeneralId: 'beidi_yaochang', from: 'city_binzhou2', route: [p('安定', 35.54, 107.85)] }),
    B('evt_1007', '42C', 'dingzhou_d_murongchui', 'attacker', 'zhaiwei', 'attacker', { enemyGeneralId: 'zhaiwei_gen_363', from: 'city_zhongshan', city: at('city_zhaoge', 'zhaiwei', 'murong'), route: [p('黎阳津', 35.68, 114.55)] }),
    B('evt_1010', '42C', 'bfe_murongbao', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_tuobagui', from: 'city_zhongshan', route: [p('五原黄河岸', 40.15, 110.95)] }),
    // ── 第 43 棒 ──
    B('evt_1005', '43', 'tuoba_tuobagui', 'attacker', 'gaoche', 'attacker', { enemyGeneralId: 'gaoche_shouling', from: 'city_shengle', route: [p('阴山', 40.8, 109.5)] }),
    B('evt_1006', '43', 'tuoba_tuobagui', 'attacker', 'helian', 'attacker', { enemyGeneralId: 'helian_gen_364', from: 'city_shengle', city: at('city_yunzhongcheng', 'helian', 'tuoba'), route: [p('铁岐山', 40.27, 111.14), p('五原金津', 40.15, 110.95)] }),
    B('evt_1011', '43', 'tuoba_tuobagui', 'attacker', 'murong', 'attacker', { enemyGeneralId: 'murong_gen_365', from: 'city_shengle', city: at('city_taiyuan', 'murong', 'tuoba'), route: [p('平城', 40.08, 113.3), p('雁门', 39.19, 112.87)] }),
    B('evt_1012', '43', 'tuoba_tuobagui', 'defender', 'murong', 'defender', { enemyGeneralId: 'bfe_murongbao', from: 'city_zhending', route: [p('中山', 38.47, 115.06)] }),
    // ── 第 44 棒 ──
    B('evt_1014', '44', 'sunen_jun_gen_366', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_367', from: 'city_zhoushan', city: at('city_kuaiji', 'dongjin', 'sunen_jun'), route: [p('上虞', 30.03, 120.87)] }),
    B('evt_1016', '44', 'wang_d_liuyu', 'defender', 'sunen_jun', 'defender', { enemyGeneralId: 'sunen_jun_gen_366', city: at('city_jiaxing', 'dongjin', 'dongjin') }),
    B('evt_1019', '44', 'wang_d_liuyu', 'attacker', 'huanchu', 'attacker', { enemyGeneralId: 'huanchu_gen_368', from: 'city_yangzhou', city: at('city_nanjing', 'huanchu', 'dongjin'), route: [p('京口', 32.21, 119.45), p('江乘', 32.15, 118.96), p('覆舟山', 32.07, 118.8)] }),
    B('evt_1024', '44', 'wang_d_liuyu', 'attacker', 'murong', 'attacker', { enemyGeneralId: 'bfe3_90', from: 'city_nanjing', city: at('city_mulingguan', 'murong', 'dongjin'), route: [p('下邳', 34.0, 117.95), p('东莞', 35.58, 118.83), p('大岘山', 36.32, 118.59)] }),
    B('evt_1025', '44', 'wang_d_liuyu', 'attacker', 'murong', 'attacker', { enemyGeneralId: 'bfe3_90', from: 'city_mulingguan', city: at('city_linzi', 'murong', 'dongjin'), route: [p('临朐', 36.51, 118.54)] }),
    B('evt_1027', '44', 'wang_d_liuyu', 'attacker', 'sunen_jun', 'attacker', { enemyGeneralId: 'sunen_jun_gen_369', from: 'city_nanjing', route: [p('雷池', 30.4, 116.85), p('寻阳', 29.68, 116.0)] }),
    B('evt_1028', '44', 'wang_d_liuyu', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_370', from: 'city_nanjing', city: at('city_ying', 'dongjin', 'dongjin'), route: [p('寻阳', 29.68, 116.0), p('豫章口', 30.32, 112.22)] }),
    B('evt_1029', '44', 'dongjin_gen_371', 'attacker', 'qiaoshu', 'attacker', { enemyGeneralId: 'qiaoshu_gen_372', from: 'city_ying', city: at('city_chengdu', 'qiaoshu', 'dongjin'), route: [p('白帝', 31.04, 109.57), p('外水岷江平模', 30.15, 103.85)] }),
    B('evt_1031', '44', 'wang_d_liuyu', 'attacker', 'dongjin', 'attacker', { enemyGeneralId: 'dongjin_gen_373', from: 'city_nanjing', city: at('city_ying', 'dongjin', 'dongjin'), route: [p('马头岸赤圻洲', 30.28, 112.15)] }),
    B('evt_1032', '44', 'jinling_tandaoji', 'attacker', 'hou_qin', 'attacker', { enemyGeneralId: 'bfe_cb_hou_qin_1', from: 'city_pengcheng', city: at('city_luoyang', 'hou_qin', 'dongjin'), route: [p('成皋虎牢', 34.81, 113.17), p('柏谷坞', 34.6, 112.75)] }),
    B('evt_1033', '44', 'wang_d_liuyu', 'attacker', 'hou_qin', 'attacker', { enemyGeneralId: 'bfe_yao_shao', from: 'city_luoyang', city: at('city_tongguan', 'hou_qin', 'dongjin'), route: [p('陕城', 34.72, 111.1), p('潼关', 34.54, 110.29), p('渭桥长安', 34.27, 108.93)] }),
    B('evt_1034', '44', 'dongjin_gen_375', 'defender', 'helian', 'attacker', { enemyGeneralId: 'helian_helianbobo', city: at('city_changan', 'dongjin', 'helian') }),
    B('evt_1038', '44', 'liusong_gen_377', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_376', city: at('city_zhaoge', 'liusong', 'tuoba') }),
    B('evt_1039', '44', 'liusong_gen_378', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_376', city: at('city_hulaoguan', 'liusong', 'tuoba') }),
    // ── 第 45 棒 ──
    B('evt_1040', '45', 'tuoba_gen_22', 'defender', 'rouran', 'defender', { enemyGeneralId: 'yujiulu_yujiulv', from: 'city_datong' }),
    B('evt_1043', '45', 'tuoba_gen_22', 'attacker', 'helian', 'attacker', { enemyGeneralId: 'helian_gen_379', from: 'city_datong', city: at('city_tongwancheng', 'helian', 'tuoba'), route: [p('君子津', 40.27, 111.14)] }),
    B('evt_1044', '45', 'tuoba_gen_380', 'attacker', 'helian', 'attacker', { enemyGeneralId: 'helian_gen_379', from: 'city_changan', city: at('city_anding', 'helian', 'tuoba'), route: [p('上邽', 34.58, 105.72), p('平凉', 35.54, 106.67)] }),
    B('evt_1045', '45', 'tuoba_gen_22', 'attacker', 'rouran', 'attacker', { enemyGeneralId: 'yujiulu_yujiulv', from: 'city_datong', route: [p('黑山', 40.85, 111.55), p('栗水', 47.14, 103.04), p('涿邪山', 43.59, 104.66)] }),
    B('evt_1046', '45', 'tuoba_gen_380', 'attacker', 'liusong', 'attacker', { enemyGeneralId: 'liusong_gen_381', from: 'city_anyang', city: at('city_luoyang', 'liusong', 'tuoba'), route: [p('冶坂津', 34.85, 112.58), p('洛阳金墉', 34.62, 112.45), p('虎牢', 34.81, 113.17)] }),
    B('evt_1047', '45', 'bfe_cb_tuoba_1', 'attacker', 'liusong', 'attacker', { enemyGeneralId: 'jinling_tandaoji', from: 'city_zhaoge', route: [p('滑台', 35.57, 114.52), p('碻磝', 36.48, 116.25)] }),
    B('evt_1052', '45', 'tuoba_gen_383', 'attacker', 'beiyan', 'attacker', { enemyGeneralId: 'beiyan_gen_384', from: 'city_datong', city: at('city_chaoyang', 'beiyan', 'tuoba'), route: [p('卢龙塞', 40.15, 118.5)] }),
    B('evt_1055', '45', 'tuoba_gen_22', 'attacker', 'juqu_d', 'attacker', { enemyGeneralId: 'juqu_d_gen_385', from: 'city_datong', city: at('city_wuwei', 'juqu_d', 'tuoba'), route: [p('上郡', 38.02, 109.15), p('灵州', 38.0, 106.3)] }),
    B('evt_1058', '45', 'tuoba_gen_386', 'attacker', 'juqu_d', 'attacker', { enemyGeneralId: 'juqu_d_gen_387', from: 'city_wuwei', city: at('city_jiuquan', 'juqu_d', 'tuoba'), route: [p('张掖', 38.93, 100.45)] }),
    B('evt_1062', '45', 'tuoba_gen_389', 'defender', 'gaiwu_jun', 'attacker', { enemyGeneralId: 'gaiwu_jun_gen_388', from: 'city_changan', city: at('city_jinsuoguan', 'tuoba', 'gaiwu_jun') }),
    B('evt_1066', '45', 'tuoba_gen_22', 'attacker', 'rouran', 'attacker', { enemyGeneralId: 'rouran_gen_390', from: 'city_datong', route: [p('地弗池', 43.8, 104.2)] }),
    B('evt_1067', '45', 'tuoba_gen_22', 'attacker', 'liusong', 'attacker', { enemyGeneralId: 'liusong_gen_391', from: 'city_anyang', city: at('city_nanjing', 'liusong', 'liusong'), route: [p('枋头', 35.65, 114.45), p('滑台', 35.57, 114.52), p('尉武', 33.65, 116.96), p('盱眙', 33.01, 118.54)] }),
    // ── 第 46 棒 ──
    B('evt_1060', '46', 'xiongren_atila', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'baizanting_gen_392', from: 'city_saigede', city: at('city_nis', 'baizanting', 'baizanting'), route: [p('马尔古斯', 44.68, 21.18)] }),
    B('evt_1064', '46', 'xiongren_atila', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'bfe3_92', from: 'city_saigede' }),
    B('evt_1065', '46', 'aitiliusi', 'attacker', 'salian_franks', 'attacker', { enemyGeneralId: 'salian_franks_gen_393', from: 'city_lyon' }),
    B('evt_1070', '46', 'aitiliusi', 'defender', 'xiongren', 'defender', { enemyGeneralId: 'xiongren_atila', from: 'city_lyon', route: [p('奥尔良', 47.9, 1.91), p('特鲁瓦', 48.3, 4.07)] }),
    B('evt_1071', '46', 'xiongren_atila', 'attacker', 'luoma_diguo', 'attacker', { enemyGeneralId: 'luoma_diguo_shouling_2', from: 'city_saigede', city: at('city_aquileia', 'luoma_diguo', 'luoma_diguo'), route: [p('朱利安阿尔卑斯山隘', 45.9, 13.85)] }),
    B('evt_1073', '46', 'xiongren_gen_395', 'defender', 'gepids', 'attacker', { enemyGeneralId: 'gepids_gen_394', from: 'city_saigede' }),
    B('evt_1076', '46', 'mayuelian', 'attacker', 'xigete', 'attacker', { enemyGeneralId: 'xigete_diaoduolike_ii', from: 'city_ravenna', city: at('city_avignon', 'luoma_diguo', 'luoma_diguo'), route: [p('里昂', 45.76, 4.84)] }),
    B('evt_1079', '46', 'mayuelian', 'defender', 'ricimer_jun', 'attacker', { enemyGeneralId: 'ricimer_jun_gen_398', from: 'city_avignon' }),
    B('evt_1081', '46', 'aijidiusi', 'defender', 'xigete', 'defender', { enemyGeneralId: 'xigete_fuleidelike', from: 'city_soissons', route: [p('图卢兹', 43.6, 1.44)] }),
    B('evt_1082', '46', 'alans_gen_401', 'attacker', 'ricimer_jun', 'defender', { enemyGeneralId: 'ricimer_jun_gen_398', from: 'city_clavenna' }),
    // ── 第 47A 棒 ──
    B('evt_1103', '47A', 'sashan_beilusi', 'attacker', 'yada', 'defender', { enemyGeneralId: 'yada_ahexiong', from: 'city_feiluzhabade', route: [p('戈尔甘', 36.84, 54.43), p('木鹿', 37.62, 62.24)] }),
    B('evt_1104', '47A', 'yada_ahexiong', 'attacker', 'sashan', 'defender', { enemyGeneralId: 'kalan_suhela', from: 'city_helate_city' }),
    // ── 第 48 棒 ──
    B('evt_1123', '48', 'nan_liang_gen_402', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_yuanying', city: at('city_wushengguan', 'nan_liang', 'tuoba') }),
    B('evt_1125', '48', 'hao_d_weirui', 'defender', 'tuoba', 'defender', { enemyGeneralId: 'tuoba_yuanying', from: 'city_nanjing', city: at('city_bengbu', 'nan_liang', 'nan_liang'), route: [p('合肥', 31.86, 117.28), p('阴陵', 32.78, 117.15)] }),
    B('evt_1128', '48', 'nan_liang_gen_404', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_403', city: at('city_xuanhu', 'nan_liang', 'tuoba') }),
    B('evt_1130', '48', 'nan_liang_gen_405', 'attacker', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_406', from: 'city_huaiyin', city: at('city_qucheng', 'tuoba', 'nan_liang'), route: [p('淮阴', 33.6, 119.02)] }),
    B('evt_1135', '48', 'nan_liang_gen_408', 'defender', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_407', from: 'city_bengbu', city: at('city_shouxian', 'nan_liang', 'tuoba'), route: [p('寿阳', 32.59, 116.8), p('硖石', 32.65, 116.65)] }),
    B('evt_1139', '48', 'rouran_anagui', 'defender', 'shifa_rouran', 'defender', { enemyGeneralId: 'shifa_rouran_shouling', from: 'city_guyangsai' }),
    B('evt_1143', '48', 'liuzhen_gen_409', 'attacker', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_410', from: 'city_guyangsai', city: at('city_wuchuanzhen', 'tuoba', 'liuzhen'), route: [p('云中', 40.38, 111.82)] }),
    B('evt_1144', '48', 'rouran_anagui', 'attacker', 'liuzhen', 'attacker', { enemyGeneralId: 'liuzhen_gen_409', from: 'city_saierwusu' }),
    B('evt_1145', '48', 'tuoba_gen_411', 'defender', 'liuzhen', 'attacker', { enemyGeneralId: 'zhao_gerong', from: 'city_zhongshan' }),
    B('evt_1146', '48', 'zhengzhou_chenqingzhi', 'attacker', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_412', from: 'city_nanjing', city: at('city_mengcheng', 'tuoba', 'nan_liang'), route: [p('钟离', 32.92, 117.38), p('城父', 33.5, 115.93)] }),
    B('evt_1147', '48', 'erzhu_erzhurong', 'attacker', 'liuzhen', 'attacker', { enemyGeneralId: 'zhao_gerong', from: 'city_xiurongchuan', route: [p('晋阳', 37.87, 112.55), p('上党', 36.19, 113.11), p('滏口', 36.42, 114.28)] }),
    B('evt_1148', '48', 'zhengzhou_chenqingzhi', 'attacker', 'tuoba', 'attacker', { enemyGeneralId: 'bfe_yangyu', from: 'city_nanjing', city: at('city_hulaoguan', 'tuoba', 'tuoba'), route: [p('梁国', 34.38, 115.62), p('考城', 34.82, 114.83), p('荥阳虎牢', 34.81, 113.17), p('洛阳', 34.62, 112.45)] }),
    B('evt_1151', '48', 'gaoqi_d_gaohuan', 'defender', 'erzhu', 'defender', { enemyGeneralId: 'erzhu_erzhuzhao', from: 'city_anyang', route: [p('晋阳', 37.87, 112.55), p('殷州', 37.38, 114.7)] }),
    // ── 第 49 棒 ──
    B('evt_1153', '49', 'yuwen_yuwentai', 'attacker', 'tuoba', 'attacker', { enemyGeneralId: 'tuoba_gen_413', from: 'city_anding', city: at('city_longcheng', 'tuoba', 'yuwen'), route: [p('平凉', 35.54, 106.67), p('秦州上邽', 34.58, 105.72)] }),
    B('evt_1156', '49', 'yuwen_yuwentai', 'defender', 'gaoqi_d', 'defender', { enemyGeneralId: 'gaoqi_d_gen_414', from: 'city_changan', route: [p('渭南', 34.5, 109.51)] }),
    B('evt_1157', '49', 'yuwen_yuwentai', 'defender', 'gaoqi_d', 'defender', { enemyGeneralId: 'gaoqi_d_gaohuan', from: 'city_changan', route: [p('蒲坂', 34.83, 110.3)] }),
    B('evt_1164', '49', 'yuwen_yuwentai', 'attacker', 'gaoqi_d', 'defender', { enemyGeneralId: 'gaoqi_d_gaohuan', from: 'city_changan', city: at('city_luoyang', 'gaoqi_d', 'gaoqi_d'), route: [p('潼关', 34.54, 110.29)] }),
    B('evt_1167', '49', 'gaoqi_d_gaohuan', 'attacker', 'yuwen', 'defender', { enemyGeneralId: 'long2_weixiaokuan', from: 'city_taiyuan', city: at('city_xiayangdu', 'yuwen', 'yuwen') }),
    B('evt_1168', '49', 'gaoqi_d_gen_415', 'attacker', 'nan_liang', 'attacker', { enemyGeneralId: 'nan_liang_gen_416', from: 'city_anyang', route: [p('瑕丘', 35.55, 116.83)] }),
    B('evt_1173', '49', 'tujue_ashinatumen', 'attacker', 'rouran', 'attacker', { enemyGeneralId: 'rouran_anagui', from: 'city_saiyinsanda', route: [p('金山', 47.64, 88.29)] }),
    B('evt_1176', '49', 'xiangzhou_jun_gen_417', 'attacker', 'nan_liang', 'attacker', { enemyGeneralId: 'nan_liang_gen_418', from: 'city_changan', city: at('city_chengdu', 'nan_liang', 'yuwen'), route: [p('散关', 34.27, 106.94), p('剑阁', 32.2, 105.56), p('涪水绵竹', 31.46, 104.2)] }),
    B('evt_1177', '49', 'yuwen_gen_419', 'attacker', 'nan_liang', 'attacker', { enemyGeneralId: 'nan_liang_gen_420', from: 'city_changan', city: at('city_ying', 'nan_liang', 'hou_liang'), route: [p('樊邓', 32.01, 112.12)] }),
    B('evt_1184', '49', 'long2_weixiaokuan', 'attacker', 'gaoqi_d', 'draw', { enemyGeneralId: 'jiyuan_huluguang', from: 'city_xiayangdu', city: at('city_xiayangdu', 'yuwen', 'yuwen') }),
    // ── 第 50A 棒 ──
    B('evt_1186', '50A', 'sashan_khosrow', 'attacker', 'yada', 'attacker', { enemyGeneralId: 'yada_gen_421', from: 'city_suiye', city: at('city_bukhara', 'yada', 'tujue'), route: [p('塔什干', 41.31, 69.28), p('撒马尔罕', 39.65, 66.97)] }),
    // ── 第 50B 棒 ──
    B('evt_1187', '50B', 'yuwen_yuwenxian', 'attacker', 'gaoqi_d', 'defender', { enemyGeneralId: 'jiyuan_huluguang', from: 'city_changan', city: at('city_luoyang', 'gaoqi_d', 'gaoqi_d'), route: [p('晋阳', 37.87, 112.55), p('太行道成皋', 34.81, 113.17)] }),
    B('evt_1193', '50B', 'long2_weixiaokuan', 'attacker', 'gaoqi_d', 'defender', { enemyGeneralId: 'jiyuan_huluguang', from: 'city_xiayangdu', city: at('city_quwo', 'gaoqi_d', 'gaoqi_d'), route: [p('晋阳', 37.87, 112.55), p('临汾', 36.09, 111.52)] }),
    B('evt_1194', '50B', 'yuwen_yuwenxian', 'attacker', 'gaoqi_d', 'defender', { enemyGeneralId: 'jiyuan_huluguang', from: 'city_changan', route: [p('宜阳', 34.51, 112.18), p('定陇', 35.3, 111.15)] }),
    B('evt_1196', '50B', 'chen_gen_422', 'attacker', 'nan_liang', 'attacker', { enemyGeneralId: 'bfe_wang_lin', from: 'city_nanjing', city: at('city_shouxian', 'gaoqi_d', 'chen'), route: [p('秦郡', 32.35, 118.84)] }),
    B('evt_1197', '50B', 'chen_gen_423', 'attacker', 'gaoqi_d', 'attacker', { enemyGeneralId: 'gaoqi_d_shouling', from: 'city_nanjing', city: at('city_yangzhou', 'gaoqi_d', 'chen') }),
    B('evt_1199', '50B', 'yuwen_gen_24', 'attacker', 'gaoqi_d', 'attacker', { enemyGeneralId: 'gaoqi_d_gen_424', from: 'city_changan', city: at('city_linfen', 'gaoqi_d', 'yuwen'), route: [p('龙门渡', 35.55, 110.6), p('平阳', 36.09, 111.52), p('晋阳', 37.87, 112.55)] }),
    B('evt_1200', '50B', 'yuwen_gen_24', 'attacker', 'gaoqi_d', 'attacker', { enemyGeneralId: 'gaoqi_d_gen_425', from: 'city_changan', city: at('city_anyang', 'gaoqi_d', 'yuwen'), route: [p('洛阳', 34.62, 112.45), p('枋头', 35.65, 114.45)] }),
    B('evt_1201', '50B', 'yuwen_gen_426', 'attacker', 'chen', 'attacker', { enemyGeneralId: 'chen_gen_422', from: 'city_luoyang', city: at('city_pengcheng', 'yuwen', 'yuwen'), route: [p('寿阳', 32.59, 116.8), p('清口', 33.6, 118.96)] }),
    B('evt_1202', '50B', 'long2_weixiaokuan', 'attacker', 'chen', 'attacker', { enemyGeneralId: 'chen_gen_427', from: 'city_luoyang', city: at('city_shouxian', 'chen', 'yuwen'), route: [p('汝南悬瓠', 33.01, 114.36)] }),
    B('evt_1203', '50B', 'long2_weixiaokuan', 'attacker', 'xiangzhou_jun', 'attacker', { enemyGeneralId: 'xiangzhou_jun_gen_417', from: 'city_changan', city: at('city_anyang', 'yuwen', 'yuwen'), route: [p('河阳', 34.85, 112.58), p('怀县', 35.1, 112.95)] }),
    B('evt_1206', '50B', 'sui_yangjian', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'tujue_gen_428', from: 'city_wuchuanzhen', route: [p('朔州', 39.32, 112.43)] }),
    B('evt_1211', '50B', 'hongnong_jun_yangsu', 'attacker', 'chen', 'attacker', { enemyGeneralId: 'yidou_qixin', from: 'city_baidicheng2', city: at('city_yiling', 'chen', 'sui'), route: [p('巫峡', 31.07, 109.88)] }),
    B('evt_1212', '50B', 'sui_gen_429', 'attacker', 'chen', 'attacker', { enemyGeneralId: 'chen_gen_431', from: 'city_yangzhou', city: at('city_nanjing', 'chen', 'sui'), route: [p('京口', 32.21, 119.45), p('采石', 31.66, 118.46)] }),
    B('evt_1213', '50B', 'hongnong_jun_yangsu', 'attacker', 'jiangnan_yijun', 'attacker', { enemyGeneralId: 'bfe_gao_zhihui', from: 'city_nanjing', city: at('city_kuaiji', 'jiangnan_yijun', 'sui'), route: [p('京口', 32.21, 119.45), p('余杭', 30.25, 120.16)] }),
    // ── 第 51 棒 ──
    B('evt_1222', '51', 'hongnong_jun_yangsu', 'defender', 'tujue', 'defender', { enemyGeneralId: 'tujue_gen_432', from: 'city_lingzhou' }),
    B('evt_1223', '51', 'sui_gen_433', 'defender', 'tujue', 'defender', { enemyGeneralId: 'tujue_gen_432', from: 'city_shengle', route: [p('马邑', 39.32, 112.43)] }),
    B('evt_1227', '51', 'hongnong_jun_yangsu', 'attacker', 'bingzhou_jun', 'attacker', { enemyGeneralId: 'bingzhou_jun_gen_434', from: 'city_changan', city: at('city_taiyuan', 'sui', 'sui'), route: [p('蒲津', 34.83, 110.3), p('霍山峡谷', 36.57, 111.72), p('介休清源', 37.45, 112.35)] }),
    B('evt_1232', '51', 'sui_yuwenshu', 'attacker', 'xihai_d', 'attacker', { enemyGeneralId: 'xihai_d_fuyun', from: 'city_wuwei', city: at('city_fusicheng', 'xihai_d', 'sui'), route: [p('西平', 36.62, 101.78), p('浩亹水', 37.35, 101.62)] }),
    B('evt_1235', '51', 'sui_gen_435', 'attacker', 'gaogouli', 'defender', { enemyGeneralId: 'gaogouli_shouling', from: 'city_fanyang', city: at('city_liaoyang', 'gaogouli', 'gaogouli'), route: [p('临渝关', 40.01, 119.75), p('辽水浮桥', 41.2, 122.85)] }),
    B('evt_1236', '51', 'sui_yuwenshu', 'attacker', 'gaogouli', 'defender', { enemyGeneralId: 'gaogouli_yizhiwende', from: 'city_fanyang', route: [p('鸭绿水', 40.12, 124.39), p('萨水', 39.62, 125.66), p('平壤外城', 39.02, 125.76)] }),
    B('evt_1237', '51', 'sui_yuwenshu', 'defender', 'yangxuangan_jun', 'defender', { enemyGeneralId: 'yangxuangan_jun_gen_436', city: at('city_luoyang', 'sui', 'sui') }),
    B('evt_1240', '51', 'pinghai_laihuer', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'gaogouli_gen_437', from: 'city_dengzhou', city: at('city_beishacheng', 'gaogouli', 'gaogouli') }),
    B('evt_1241', '51', 'sui_gen_435', 'defender', 'tujue', 'defender', { enemyGeneralId: 'tujue_gen_438', city: at('city_yanmenguan', 'sui', 'sui') }),
    // ── 第 52 棒 ──
    B('evt_1243', '52', 'wagang_gen_439', 'attacker', 'sui', 'attacker', { enemyGeneralId: 'sui_gen_440', from: 'city_puyang', city: at('city_hulaoguan', 'sui', 'wagang'), route: [p('瓦岗', 35.48, 114.72), p('汜水', 34.81, 113.17)] }),
    B('evt_1244', '52', 'tang_gen_441', 'attacker', 'sui', 'attacker', { enemyGeneralId: 'huo_songlaosheng', from: 'city_taiyuan', city: at('city_lingshiguan', 'sui', 'tang'), route: [p('雀鼠谷', 36.95, 111.83), p('贾胡堡', 36.75, 111.75)] }),
    B('evt_1245', '52', 'tang_lishimin', 'attacker', 'xue_qin', 'attacker', { enemyGeneralId: 'xue_qin_gen_442', from: 'city_changan', city: at('city_zhedi', 'xue_qin', 'tang'), route: [p('高墌浅水原', 35.2, 107.79), p('折墌', 35.28, 107.58)] }),
    B('evt_1246', '52', 'yuwen_xu_gen_443', 'defender', 'douxia', 'attacker', { enemyGeneralId: 'bfe_dou_jiande', city: at('city_liaocheng', 'yuwen_xu', 'douxia') }),
    B('evt_1247', '52', 'tang_lishimin', 'attacker', 'dingyang', 'attacker', { enemyGeneralId: 'dingyang_gen_444', from: 'city_changan', route: [p('龙门冰桥', 35.55, 110.6), p('柏壁', 35.63, 111.3), p('雀鼠谷', 36.95, 111.83), p('介休', 37.03, 111.92)] }),
    B('evt_1248', '52', 'tang_lishimin', 'attacker', 'douxia', 'attacker', { enemyGeneralId: 'bfe_dou_jiande', from: 'city_luoyang', city: at('city_hulaoguan', 'tang', 'tang'), route: [p('板渚', 34.88, 113.28)] }),
    B('evt_1249', '52', 'dingxiang_d_lijing', 'attacker', 'liang_shuofang', 'attacker', { enemyGeneralId: 'gen_xiao_xian', from: 'city_baidicheng2', city: at('city_ying', 'liang_shuofang', 'tang'), route: [p('夷陵', 30.7, 111.28), p('清江口', 30.4, 111.45)] }),
    B('evt_1250', '52', 'tang_lishimin', 'attacker', 'handong', 'attacker', { enemyGeneralId: 'handong_liuheita', from: 'city_luoyang', route: [p('黎阳', 35.68, 114.55)] }),
    B('evt_1251', '52', 'tang_gen_445', 'attacker', 'handong', 'attacker', { enemyGeneralId: 'handong_liuheita', from: 'city_changan', route: [p('昌乐', 36.22, 115.28)] }),
    B('evt_1252', '52', 'dingxiang_d_lijing', 'attacker', 'fusong', 'attacker', { enemyGeneralId: 'fusong_gen_446', from: 'city_chaisang', city: at('city_nanjing', 'fusong', 'tang'), route: [p('舒州', 30.51, 117.04), p('芜湖博望山', 31.52, 118.35)] }),
    B('evt_1256', '52', 'tang_gen_447', 'attacker', 'liangshidu', 'attacker', { enemyGeneralId: 'kang_liangshidou', from: 'city_changan', city: at('city_tongwancheng', 'liangshidu', 'tang'), route: [p('泾州', 35.33, 107.36), p('延州', 36.59, 109.49)] }),
    // ── 第 53 棒 ──
    B('evt_1258', '53', 'dingxiang_d_lijing', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'tujue_xielikehan', from: 'city_piantouguan', route: [p('马邑', 39.32, 112.43), p('定襄恶阳岭', 39.91, 111.65), p('白道', 41.27, 111.13), p('阴山铁山', 40.8, 111.4)] }),
    B('evt_1263', '53', 'dingxiang_d_lijing', 'attacker', 'xihai_d', 'attacker', { enemyGeneralId: 'xihai_d_fuyun', from: 'city_ledou', city: at('city_fusicheng', 'xihai_d', 'xihai_d'), route: [p('赤水源', 36.3, 100.8), p('伏俟城', 36.76, 99.74), p('乌海星宿川突沦川', 35.95, 96.8)] }),
    B('evt_1267', '53', 'song2_houjunji', 'defender', 'tubo', 'defender', { enemyGeneralId: 'tubo_songzanganbu', from: 'city_changan', city: at('city_songzhou', 'tang', 'tang'), route: [p('逻些', 29.65, 91.12)] }),
    B('evt_1269', '53', 'song2_houjunji', 'attacker', 'gaochang', 'attacker', { enemyGeneralId: 'bfe_quzhisheng', from: 'city_dunhuang', city: at('city_gaochangcheng', 'gaochang', 'tang'), route: [p('伊吾', 42.83, 93.52), p('碛口田地城', 42.86, 89.85)] }),
    B('evt_1273', '53', 'xingxingxia_guoxiaoke', 'attacker', 'yanqi', 'attacker', { enemyGeneralId: 'yanqi_longtuqizhi', from: 'city_gaochangcheng', city: at('city_yanqi', 'yanqi', 'yanqi'), route: [p('银山道', 42.45, 88.55)] }),
    B('evt_1275', '53', 'tang_lishimin', 'attacker', 'gaogouli', 'defender', { enemyGeneralId: 'gaogouli_yangwanchun', from: 'city_liaoyang', city: at('city_anshicheng', 'gaogouli', 'gaogouli'), route: [p('白岩城', 41.22, 123.45)] }),
    B('evt_1276', '53', 'bing_liji', 'attacker', 'xueyantuo', 'attacker', { enemyGeneralId: 'xueyantuo_gen_448', from: 'city_shengle', route: [p('大漠瀚海', 44.5, 106.0)] }),
    // ── 第 54A 棒 ──
    B('evt_1280', '54A', 'tang_gen_449', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'tujue_gen_450', from: 'city_shengle', route: [p('云中', 40.08, 113.3), p('白道', 41.27, 111.13)] }),
    B('evt_1288', '54A', 'weihaiwei_sudingfang', 'attacker', 'duolu', 'attacker', { enemyGeneralId: 'duolu_ashinahelu', from: 'city_bieshibali', route: [p('金山北麓', 47.64, 88.29), p('双河', 44.85, 82.9)] }),
    B('evt_1293', '54A', 'loufan_xuerengui', 'attacker', 'huihu', 'attacker', { enemyGeneralId: 'huihu_gen_451', from: 'city_bieshibali' }),
    B('evt_1296', '54A', 'keliya_fuduxin', 'defender', 'tubo', 'defender', { enemyGeneralId: 'gar_lunqinling', city: at('city_yutian2', 'yuchi', 'yuchi') }),
    B('evt_1301', '54A', 'loufan_xuerengui', 'defender', 'tubo', 'attacker', { enemyGeneralId: 'gar_lunqinling', from: 'city_ledou', route: [p('河口赤水', 36.3, 100.8), p('乌海', 35.85, 99.3)] }),
    // ── 第 54B 棒 ──
    B('evt_1291', '54B', 'weihaiwei_sudingfang', 'attacker', 'baiji', 'attacker', { enemyGeneralId: 'baiji_jiebo', from: 'city_wendeng', city: at('city_sabi', 'baiji', 'tang'), route: [p('德物岛', 37.05, 126.1), p('伎伐浦', 36.02, 126.7)] }),
    B('evt_1294', '54B', 'tang_gen_452', 'attacker', 'yamato', 'attacker', { enemyGeneralId: 'yamato_gen_453', from: 'city_sabi', route: [p('熊津', 36.46, 127.12)] }),
    B('evt_1298', '54B', 'bing_liji', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'gaogouli_gen_454', from: 'city_chaoyang', city: at('city_salhu', 'gaogouli', 'tang'), route: [p('辽水', 41.3, 122.85)] }),
    B('evt_1299', '54B', 'bing_liji', 'attacker', 'gaogouli', 'attacker', { enemyGeneralId: 'gaogouli_gen_455', from: 'city_salhu', city: at('city_pyongyang', 'gaogouli', 'tang'), route: [p('扶余城', 42.8, 124.5), p('鸭绿栅', 40.12, 124.39), p('大行城', 40.05, 124.55)] }),
    B('evt_1303', '54B', 'tang_gen_449', 'attacker', 'xinluo', 'attacker', { enemyGeneralId: 'xinluo_gen_456', from: 'city_pyongyang' }),
    B('evt_1306', '54B', 'tang_gen_457', 'attacker', 'xinluo', 'defender', { enemyGeneralId: 'xinluo_gen_458', from: 'city_kaesong', city: at('city_kaesong', 'tang', 'xinluo') }),
    B('evt_1307', '54B', 'loufan_xuerengui', 'attacker', 'xinluo', 'defender', { enemyGeneralId: 'xinluo_gen_459', from: 'city_dengzhou' }),
    // ── 第 55 棒 ──
    B('evt_1309', '55', 'heyuan_d_heichichangzhi', 'defender', 'tubo', 'attacker', { enemyGeneralId: 'gar_lunqinling', from: 'city_ledou', route: [p('龙支', 36.18, 102.52)] }),
    B('evt_1311', '55', 'juandu_peixingjian', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'tujue_gen_460', from: 'city_datong', route: [p('定襄', 40.38, 111.82)] }),
    B('evt_1314', '55', 'juandu_peixingjian', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'xijue_ashina_funian', from: 'city_xiurongchuan', route: [p('代州陉口', 39.19, 112.87)] }),
    B('evt_1315', '55', 'loufan_xuerengui', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'pugu_ashinaguduolu', from: 'city_datong' }),
    B('evt_1322', '55', 'tang_gen_461', 'defender', 'tubo', 'attacker', { enemyGeneralId: 'gar_lunqinling', from: 'city_yiluolucheng' }),
    // ── 第 56A 棒 ──
    B('evt_1326', '56A', 'wuzhou_d_gen_463', 'defender', 'tujue', 'defender', { enemyGeneralId: 'tujue_gen_462', from: 'city_lingzhou' }),
    B('evt_1327', '56A', 'wuzhou_d_gen_25', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_464', from: 'city_luoyang', route: [p('鄯州', 36.48, 102.42)] }),
    B('evt_1330', '56A', 'wuzhou_d_gen_25', 'defender', 'qidan_tang', 'attacker', { enemyGeneralId: 'qidan_tang_gen_465', from: 'city_feiru', route: [p('渔阳', 40.04, 117.4)] }),
    B('evt_1331', '56A', 'bfe_likaigu', 'defender', 'bohai', 'attacker', { enemyGeneralId: 'bohai_dazuorong', from: 'city_chaoyang', route: [p('辽水', 41.3, 122.85)] }),
    B('evt_1333', '56A', 'wuzhou_d_gen_26', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_466', from: 'city_wuwei' }),
    B('evt_1339', '56A', 'tang_gen_467', 'defender', 'tujue', 'attacker', { enemyGeneralId: 'tujue_gen_462', from: 'city_lingzhou' }),
    B('evt_1348', '56A', 'tang_gen_468', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_469', from: 'city_lintao' }),
    B('evt_1352', '56A', 'tang_gen_470', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling', from: 'city_ledou' }),
    B('evt_1360', '56A', 'tang_gen_471', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_xinuoluo', from: 'city_zhangye', route: [p('大斗拔谷', 38.25, 100.82), p('青海冰面', 36.85, 100.4)] }),
    // ── 第 56B 棒 ──
    B('evt_1337', '56B', 'womaya_gen_472', 'attacker', 'tirmidh_musa', 'attacker', { enemyGeneralId: 'tirmidh_musa_gen_473', from: 'city_merv', city: at('city_tamid', 'tirmidh_musa', 'womaya'), route: [p('巴尔赫蓝氏城', 36.76, 66.9)] }),
    B('evt_1342', '56B', 'womaya_gen_474', 'attacker', 'bukhara_sogd', 'attacker', { enemyGeneralId: 'bukhara_sogd_gen_475', from: 'city_merv', city: at('city_bukhara', 'sogdian', 'womaya'), route: [p('阿姆河渡', 38.95, 63.6), p('派肯德', 39.58, 64.02)] }),
    B('evt_1343', '56B', 'womaya_gen_474', 'attacker', 'shuman_guo', 'attacker', { enemyGeneralId: 'shuman_guo_shouling', from: 'city_merv', city: at('city_shuman', 'shuman_guo', 'womaya'), route: [p('怛蜜', 37.22, 67.28), p('铁门关', 38.22, 67.02)] }),
    B('evt_1347', '56B', 'tujue_gen_476', 'attacker', 'tang', 'defender', { enemyGeneralId: 'tang_gen_477', from: 'city_otuken', city: at('city_bieshibali', 'tang', 'tang') }),
    B('evt_1349', '56B', 'tang_gen_478', 'attacker', 'fergana_aleda', 'attacker', { enemyGeneralId: 'fergana_aleda_gen_479', from: 'city_yiluolucheng', city: at('city_kokand', 'fergana_aleda', 'fergana_aleda'), route: [p('疏勒', 39.47, 75.99)] }),
    B('evt_1358', '56B', 'tujishi_sulukehan', 'attacker', 'womaya', 'attacker', { enemyGeneralId: 'womaya_muslim', from: 'city_suiye', route: [p('撒马尔罕', 39.65, 66.97)] }),
    // ── 第 57A 棒 ──
    B('evt_1362', '57A', 'guazhou_zhangshougui', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_480', from: 'city_jiuquan' }),
    B('evt_1363', '57A', 'tang_gen_481', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling', from: 'city_ledou', city: at('city_qingtang', 'tubo', 'tang') }),
    B('evt_1367', '57A', 'tang_gen_483', 'defender', 'qidan_tang', 'attacker', { enemyGeneralId: 'qidan_tang_gen_482', from: 'city_beijing', route: [p('平州肥如', 39.88, 118.78)] }),
    B('evt_1372', '57A', 'shanzhou_wangzhongsi', 'attacker', 'qidan_tang', 'attacker', { enemyGeneralId: 'qidan_tang_gen_484', from: 'city_datong' }),
    B('evt_1376', '57A', 'shanzhou_wangzhongsi', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling', from: 'city_lingzhou' }),
    B('evt_1377', '57A', 'tang_gen_485', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling', from: 'city_ledou', city: at('city_ledu', 'tubo', 'tubo') }),
    B('evt_1379', '57A', 'shanzhou_wangzhongsi', 'attacker', 'tujue', 'attacker', { enemyGeneralId: 'tujue_abo_dagan', from: 'city_lingzhou', route: [p('光禄塞', 41.1, 109.2)] }),
    B('evt_1380', '57A', 'shanzhou_wangzhongsi', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling', from: 'city_ledou' }),
    B('evt_1383', '57A', 'gaoliang_geshuhan', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_486', from: 'city_ledou', city: at('city_qingtang', 'tubo', 'tang') }),
    B('evt_1386', '57A', 'tang_gen_487', 'attacker', 'huihu', 'attacker', { enemyGeneralId: 'huihu_gen_488', from: 'city_fanyang' }),
    // ── 第 57B 棒 ──
    B('evt_1365', '57B', 'womaya_gen_489', 'defender', 'tujishi', 'attacker', { enemyGeneralId: 'tujishi_sulukehan', from: 'city_merv', route: [p('铁门山口', 39.3, 66.94), p('撒马尔罕', 39.65, 66.97)] }),
    B('evt_1369', '57B', 'sai_gaijiayun', 'defender', 'tujishi', 'defender', { enemyGeneralId: 'tujishi_sulukehan', city: at('city_bieshibali', 'tang', 'tang') }),
    B('evt_1370', '57B', 'sai_gaijiayun', 'attacker', 'tujishi', 'attacker', { enemyGeneralId: 'tujishi_sulukehan', from: 'city_bieshibali', route: [p('北庭', 44.0, 89.2), p('伊犁河谷', 43.92, 81.32)] }),
    B('evt_1371', '57B', 'womaya_gen_490', 'attacker', 'tujishi', 'attacker', { enemyGeneralId: 'tujishi_sulukehan', from: 'city_lanshi', route: [p('巴尔赫', 36.76, 66.9)] }),
    B('evt_1373', '57B', 'sai_gaijiayun', 'attacker', 'tujishi', 'attacker', { enemyGeneralId: 'tujishi_tuhuoxian', from: 'city_bieshibali', city: at('city_suiye', 'tujishi', 'tang'), route: [p('北庭', 44.0, 89.2), p('真珠河', 42.9, 75.5)] }),
    B('evt_1381', '57B', 'hepan_gaoxianzhi', 'attacker', 'xiaobolu', 'attacker', { enemyGeneralId: 'nandou_sushili', from: 'city_yiluolucheng', city: at('city_lianyun', 'xiaobolu', 'tang'), route: [p('疏勒', 39.47, 75.99), p('葱岭护密', 37.0, 72.6)] }),
    B('evt_1385', '57B', 'hepan_gaoxianzhi', 'attacker', 'abasi', 'defender', { enemyGeneralId: 'abasi_shouling', from: 'city_yiluolucheng', route: [p('碎叶', 42.84, 75.3)] }),
    B('evt_1387', '57B', 'tang_gen_492', 'attacker', 'xiaobolu', 'attacker', { enemyGeneralId: 'xiaobolu_shouling', from: 'city_yiluolucheng', city: at('city_nieduo', 'xiaobolu', 'xiaobolu') }),
    // ── 第 58 棒 ──
    B('evt_1390', '58', 'zhuozhou_shisiming', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'zhongshan_yangaoqing', from: 'city_fanyang', city: at('city_zhending', 'tang', 'da_yan') }),
    B('evt_1391', '58', 'dayan_cuiqianyou', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'gaoliang_geshuhan', from: 'city_luoyang', city: at('city_tongguan', 'tang', 'da_yan'), route: [p('潼关', 34.54, 110.29)] }),
    B('evt_1392', '58', 'liwang_liguangbi', 'defender', 'da_yan', 'defender', { enemyGeneralId: 'zhuozhou_shisiming', city: at('city_taiyuan', 'tang', 'tang') }),
    B('evt_1393', '58', 'lingwu_guoziyi', 'attacker', 'da_yan', 'attacker', { enemyGeneralId: 'zhuozhou_anshouzhong', from: 'city_fengtian', city: at('city_changan', 'da_yan', 'tang'), route: [p('凤翔', 34.52, 107.39), p('长安南沣水香积寺', 34.15, 108.88)] }),
    B('evt_1394', '58', 'bfe_yin_ziqi', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'liang_d_zhangxun', from: 'city_bianliang', city: at('city_shangqiu', 'tang', 'da_yan') }),
    B('evt_1396', '58', 'lingwu_guoziyi', 'defender', 'da_yan', 'attacker', { enemyGeneralId: 'zhuozhou_shisiming', from: 'city_luoyang', city: at('city_anyang', 'da_yan', 'da_yan'), route: [p('范阳', 39.9, 116.41), p('魏州', 36.27, 115.23)] }),
    B('evt_1399', '58', 'pugu_puguhuaien', 'attacker', 'da_yan', 'attacker', { enemyGeneralId: 'gen_shi_chaoyi', from: 'city_xiayangdu', city: at('city_luoyang', 'da_yan', 'tang'), route: [p('陕州', 34.72, 111.1), p('洛阳昭觉寺', 34.62, 112.45), p('孟州横水', 34.9, 112.78)] }),
    // ── 第 59 棒 ──
    B('evt_1402', '59', 'lingwu_guoziyi', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_493', from: 'city_fengtian', route: [p('泾阳', 34.53, 108.84), p('灵台西原', 35.06, 107.62)] }),
    B('evt_1403', '59', 'lingwu_guoziyi', 'defender', 'tubo', 'defender', { enemyGeneralId: 'tubo_gen_494', city: at('city_lingzhou', 'tang', 'tang') }),
    B('evt_1404', '59', 'tang_malin', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_494', from: 'city_binzhou2' }),
    B('evt_1411', '59', 'tang_gen_495', 'defender', 'tianxiong', 'attacker', { enemyGeneralId: 'tianxiong_tianchengsi', city: at('city_anyang', 'tang', 'tianxiong') }),
    B('evt_1413', '59', 'lingwu_guoziyi', 'defender', 'tubo', 'defender', { enemyGeneralId: 'yangtong_chisongdezan', from: 'city_binzhou2' }),
    B('evt_1416', '59', 'tang_xianyushuming', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'yangtong_chisongdezan', from: 'city_zizhou_d', route: [p('剑门关', 32.2, 105.56)] }),
    B('evt_1418', '59', 'tang_gen_496', 'attacker', 'tianxiong', 'attacker', { enemyGeneralId: 'tianxiong_gen_497', from: 'city_shangdang', city: at('city_handan', 'tang', 'tang') }),
    B('evt_1421', '59', 'wei2_hunjian', 'defender', 'da_qin', 'defender', { enemyGeneralId: 'tang_zhuci', city: at('city_fengtian', 'tang', 'tang') }),
    B('evt_1422', '59', 'qianzhou_lisheng', 'attacker', 'da_qin', 'attacker', { enemyGeneralId: 'tang_zhuci', from: 'city_shayuan', city: at('city_changan', 'da_qin', 'tang'), route: [p('东渭桥', 34.45, 109.1)] }),
    B('evt_1423', '59', 'wei2_hunjian', 'attacker', 'lihuaiguang_jun', 'attacker', { enemyGeneralId: 'lihuaiguang_jun_gen_498', from: 'city_taiyuan', city: at('city_tongguan', 'lihuaiguang_jun', 'tang'), route: [p('绛州', 35.63, 111.3), p('陶城长春宫', 34.95, 110.4)] }),
    B('evt_1424', '59', 'qianzhou_lisheng', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_499', from: 'city_qishan' }),
    B('evt_1425', '59', 'tang_gen_501', 'defender', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_500', city: at('city_dunhuang', 'tang', 'tubo') }),
    B('evt_1431', '59', 'nanzhao_gen_502', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_gen_503', from: 'city_dali_city', city: at('city_dayan', 'tubo', 'nanzhao'), route: [p('剑川', 26.53, 99.9)] }),
    // ── 第 60A 棒 ──
    B('evt_1408', '60A', 'gen_charlemagne', 'attacker', 'old_saxons', 'attacker', { enemyGeneralId: 'old_saxons_shouling', from: 'city_meiyinci', city: at('city_eresburg', 'old_saxons', 'falanji'), route: [p('沃尔姆斯', 49.63, 8.36)] }),
    B('evt_1410', '60A', 'gen_charlemagne', 'attacker', 'lunbadi', 'attacker', { enemyGeneralId: 'lunbadi_desiderius', from: 'city_geneva', city: at('city_milan', 'lunbadi', 'falanji'), route: [p('塞尼山口', 45.26, 6.9)] }),
    B('evt_1412', '60A', 'gen_charlemagne', 'attacker', 'friuli', 'attacker', { enemyGeneralId: 'friuli_gen_504', from: 'city_yachen', route: [p('阿尔卑斯山道', 46.5, 13.5)] }),
    B('evt_1420', '60A', 'gen_charlemagne', 'attacker', 'old_saxons', 'attacker', { enemyGeneralId: 'old_saxons_gen_505', from: 'city_meiyinci', route: [p('帕德博恩', 51.72, 8.75), p('代特莫尔德', 51.94, 8.88)] }),
    B('evt_1426', '60A', 'gen_charlemagne', 'attacker', 'veleti', 'attacker', { enemyGeneralId: 'veleti_gen_506', from: 'city_kelong', city: at('city_wolgast', 'meikelunbao', 'meikelunbao'), route: [p('易北河双桥', 52.8, 11.95)] }),
    B('evt_1428', '60A', 'gen_charlemagne', 'attacker', 'awaer', 'attacker', { enemyGeneralId: 'awaer_shouling', from: 'city_leigensibao', city: at('city_kamba', 'awaer', 'falanji'), route: [p('恩斯河', 48.22, 14.48), p('坎普河口', 48.4, 15.7), p('拉布河', 47.68, 17.63)] }),
    B('evt_1432', '60A', 'falanji_shouling', 'attacker', 'awaer', 'attacker', { enemyGeneralId: 'awaer_shouling', from: 'city_verona', city: at('city_saigede', 'awaer', 'falanji'), route: [p('奇维达莱', 46.09, 13.43)] }),
    B('evt_1437', '60A', 'falanji_gen_508', 'attacker', 'hou_womaya', 'attacker', { enemyGeneralId: 'hou_womaya_gen_509', from: 'city_toulouse', city: at('city_barcelona', 'hou_womaya', 'hou_womaya'), route: [p('比利牛斯山道', 42.45, 2.85)] }),
    B('evt_1441', '60A', 'falanji_gen_510', 'attacker', 'bohemia_duchy', 'attacker', { enemyGeneralId: 'bohemia_duchy_gen_511', from: 'city_yachen', city: at('city_canburg', 'boximiya', 'boximiya') }),
    B('evt_1447', '60A', 'falanji_gen_512', 'attacker', 'kelite', 'defender', { enemyGeneralId: 'kelite_gen_513', from: 'city_ravenna', city: at('city_venice', 'kelite', 'kelite'), route: [p('基奥贾', 45.22, 12.28)] }),
    // ── 第 60B 棒 ──
    B('evt_1446', '60B', 'baizanting_nikephoros_i', 'defender', 'baojialiya', 'attacker', { enemyGeneralId: 'gen_krum', city: at('city_sofia', 'baizanting', 'baojialiya') }),
    B('evt_1449', '60B', 'baizanting_nikephoros_i', 'defender', 'baojialiya', 'attacker', { enemyGeneralId: 'gen_krum', from: 'city_junshitandingbao', route: [p('普利斯卡', 43.39, 27.13)] }),
    B('evt_1452', '60B', 'baizanting_gen_514', 'attacker', 'baojialiya', 'attacker', { enemyGeneralId: 'baojialiya_gen_515', from: 'city_junshitandingbao' }),
    // ── 第 61A 棒 ──
    B('evt_1453', '61A', 'tang_gen_516', 'attacker', 'huaixi', 'attacker', { enemyGeneralId: 'bfe_wu_yuanji', from: 'city_xuchang', city: at('city_yancheng2', 'huaixi', 'tang') }),
    B('evt_1455', '61A', 'yuan_cj_d_lishuo', 'attacker', 'huaixi', 'attacker', { enemyGeneralId: 'bfe_wu_yuanji', from: 'city_xiangyang', city: at('city_xuanhu', 'huaixi', 'tang'), route: [p('唐州', 32.69, 112.83), p('文城栅', 33.22, 113.78), p('张柴村', 33.08, 114.22)] }),
    B('evt_1457', '61A', 'tang_gen_517', 'attacker', 'ziqing', 'attacker', { enemyGeneralId: 'ziqing_gen_518', from: 'city_daming', city: at('city_dongping', 'ziqing', 'tang'), route: [p('魏州', 36.27, 115.23), p('阳谷', 36.11, 115.79), p('东阿', 36.18, 116.25)] }),
    B('evt_1460', '61A', 'tang_gen_520', 'defender', 'chengde', 'attacker', { enemyGeneralId: 'chengde_gen_519', city: at('city_luze', 'tang', 'chengde') }),
    B('evt_1467', '61A', 'tang_gen_521', 'attacker', 'henghai', 'attacker', { enemyGeneralId: 'tang_litongjie', from: 'city_liaocheng', city: at('city_qingchi', 'henghai', 'tang') }),
    B('evt_1477', '61A', 'xiajiasi_are', 'attacker', 'huihu', 'attacker', { enemyGeneralId: 'huihu_wusa', from: 'city_wubusabo', city: at('city_woluduocheng', 'huihu', 'keerkezi'), route: [p('剑河上游', 51.7, 94.4)] }),
    B('evt_1480', '61A', 'tang_gen_522', 'attacker', 'wujie_huihu', 'attacker', { enemyGeneralId: 'wujie_huihu_gen_523', from: 'city_datong', route: [p('振武城', 40.25, 111.82)] }),
    B('evt_1481', '61A', 'tang_gen_522', 'attacker', 'zhao_yi', 'attacker', { enemyGeneralId: 'zhao_yi_gen_524', from: 'city_quwo', city: at('city_shangdang', 'zhao_yi', 'tang'), route: [p('晋绛', 35.63, 111.3), p('翼城乌岭', 35.75, 112.05)] }),
    // ── 第 61B 棒 ──
    B('evt_1479', '61B', 'tubo_gen_525', 'defender', 'luomen_tubo', 'defender', { enemyGeneralId: 'duomi_lunkongre', from: 'city_ledou' }),
    B('evt_1485', '61B', 'shazhou_zhangyichao', 'attacker', 'luomen_tubo', 'attacker', { enemyGeneralId: 'luomen_tubo_gen_526', from: 'city_dunhuang', city: at('city_dunhuang', 'tubo', 'guiyi') }),
    B('evt_1486', '61B', 'tang_gen_527', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling_2', from: 'city_binzhou2', city: at('city_xiaoguan', 'tubo', 'tang') }),
    B('evt_1487', '61B', 'shazhou_zhangyichao', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling_2', from: 'city_dunhuang', city: at('city_hamiwei', 'tubo', 'guiyi'), route: [p('莫贺延碛', 41.5, 94.1)] }),
    B('evt_1494', '61B', 'tang_gen_528', 'defender', 'luomen_tubo', 'defender', { enemyGeneralId: 'duomi_lunkongre', from: 'city_longxi' }),
    B('evt_1498', '61B', 'shazhou_zhangyichao', 'attacker', 'tubo', 'attacker', { enemyGeneralId: 'tubo_shouling_2', from: 'city_zhangye', city: at('city_wuwei', 'tubo', 'guiyi'), route: [p('沙州', 40.14, 94.66), p('甘州', 38.93, 100.45), p('番禾昌松', 38.1, 102.1)] }),
    // ── 第 62A 棒 ──
    B('evt_1492', '62A', 'baizanting_peiteluonasi', 'attacker', 'paulicians', 'attacker', { enemyGeneralId: 'paulicians_gen_529', from: 'city_yifusuo', city: at('city_tephrike', 'paulicians', 'paulicians') }),
    B('evt_1500', '62A', 'baizanting_peiteluonasi', 'attacker', 'malatya', 'attacker', { enemyGeneralId: 'malatya_gen_530', from: 'city_amaxiya', route: [p('马拉蒂亚', 38.35, 38.31), p('阿米苏斯海滨', 41.29, 36.33)] }),
    // ── 第 62B 棒 ──
    B('evt_1501', '62B', 'danmai_gen_531', 'attacker', 'east_anglia', 'attacker', { enemyGeneralId: 'east_anglia_gen_532', from: 'city_gebenhagen' }),
    B('evt_1504', '62B', 'danmai_gen_531', 'attacker', 'northumbria', 'attacker', { enemyGeneralId: 'northumbria_gen_533', from: 'city_norwich', city: at('city_york', 'weijing_york', 'weijing_york') }),
    B('evt_1508', '62B', 'gen_alfred_great', 'attacker', 'danmai', 'attacker', { enemyGeneralId: 'danmai_gen_534', from: 'city_winchester', route: [p('雷丁', 51.45, -0.97)] }),
    B('evt_1516', '62B', 'gen_alfred_great', 'attacker', 'danmai', 'attacker', { enemyGeneralId: 'danmai_guthrum', from: 'city_winchester', route: [p('埃格伯特石', 51.12, -2.35), p('埃丁顿', 51.28, -2.11), p('奇彭纳姆', 51.46, -2.12)] }),
    B('evt_1519', '62B', 'danmai_gen_536', 'defender', 'falanji', 'attacker', { enemyGeneralId: 'falanji_shouling_2', from: 'city_bruges' }),
    // ── 第 63A 棒 ──
    B('evt_1518', '63A', 'huangwang_huangchao', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'tang_qikerang', from: 'city_luoyang', city: at('city_tongguan', 'tang', 'huangwang'), route: [p('陕州', 34.72, 111.1), p('潼关禁沟', 34.61, 110.28), p('长安', 34.27, 108.93)] }),
    B('evt_1521', '63A', 'shatuo_likeyong', 'attacker', 'huangwang', 'attacker', { enemyGeneralId: 'huangwang_huangchao', from: 'city_shayuan', route: [p('河中', 34.83, 110.3), p('同州沙苑', 35.0, 109.93), p('渭南梁田陂', 34.5, 109.51), p('长安', 34.27, 108.93)] }),
    B('evt_1522', '63A', 'shatuo_likeyong', 'attacker', 'huangwang', 'attacker', { enemyGeneralId: 'huangwang_huangchao', from: 'city_taiyuan', route: [p('许州', 34.02, 113.85), p('陈州', 33.75, 114.65)] }),
    B('evt_1523', '63A', 'shatuo_likeyong', 'defender', 'hou_liang', 'defender', { enemyGeneralId: 'dang_d_zhuwen', from: 'city_taiyuan', city: at('city_bianliang', 'hou_liang', 'hou_liang') }),
    B('evt_1529', '63A', 'shatuo_likeyong', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'tang_gen_537', from: 'city_taiyuan', city: at('city_lingshiguan', 'tang', 'shatuo'), route: [p('潞州长子', 36.19, 113.11), p('阴地关霍邑', 36.74, 111.76), p('晋州平阳', 36.09, 111.52)] }),
    B('evt_1533', '63A', 'shatuo_likeyong', 'attacker', 'lulong', 'attacker', { enemyGeneralId: 'lulong_gen_538', from: 'city_taiyuan', city: at('city_beijing', 'you', 'you'), route: [p('武州新州', 40.38, 115.61), p('居庸关', 40.29, 116.07)] }),
    B('evt_1536', '63A', 'dang_d_pangshigu', 'defender', 'yangwu', 'attacker', { enemyGeneralId: 'yang_zhou_yangxingmi', from: 'city_bianliang', route: [p('广陵', 32.39, 119.42)] }),
    B('evt_1537', '63A', 'yichang_gen_539', 'defender', 'tang', 'attacker', { enemyGeneralId: 'cangzhou_liurengong', city: at('city_qingchi', 'yichang', 'you') }),
    B('evt_1540', '63A', 'shatuo_likeyong', 'defender', 'hou_liang', 'defender', { enemyGeneralId: 'hou_liang_gen_540', city: at('city_taiyuan', 'shatuo', 'shatuo') }),
    B('evt_1541', '63A', 'dang_d_zhuwen', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'yaozhou_limaozhen', from: 'city_changan', city: at('city_qishan', 'qi_li', 'qi_li'), route: [p('虢县', 34.37, 107.38)] }),
    B('evt_1542', '63A', 'dang_d_zhuwen', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'lai_wangshifan', from: 'city_bianliang', city: at('city_linzi', 'pinglu_wang', 'hou_liang'), route: [p('郓州', 35.92, 116.3)] }),
    // ── 第 63B 棒 ──
    B('evt_1545', '63B', 'dang_d_zhuwen', 'attacker', 'tang', 'defender', { enemyGeneralId: 'cangzhou_liurengong', from: 'city_bianliang', city: at('city_qingchi', 'you', 'you'), route: [p('魏州', 36.27, 115.23)] }),
    B('evt_1548', '63B', 'yingzhou_d2_licunxu', 'attacker', 'hou_liang', 'attacker', { enemyGeneralId: 'hou_liang_gen_541', from: 'city_taiyuan', city: at('city_shangdang', 'shatuo', 'shatuo'), route: [p('铜鞮乱柳', 36.7, 112.88)] }),
    B('evt_1549', '63B', 'hou_liang_liuzhijun', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'yaozhou_limaozhen', from: 'city_shayuan', route: [p('坊州鄜州', 35.99, 109.38)] }),
    B('evt_1551', '63B', 'yingzhou_d2_licunxu', 'attacker', 'hou_liang', 'attacker', { enemyGeneralId: 'liang_d_wangjingren', from: 'city_zhending' }),
    B('evt_1552', '63B', 'dang_d_zhuwen', 'defender', 'shatuo', 'attacker', { enemyGeneralId: 'shatuo_gen_542', from: 'city_bianliang' }),
    B('evt_1553', '63B', 'yingzhou_d2_licunxu', 'attacker', 'tang', 'attacker', { enemyGeneralId: 'cangzhou_liurengong', from: 'city_taiyuan', city: at('city_beijing', 'jieyan', 'shatuo'), route: [p('涿州', 39.49, 115.97)] }),
    B('evt_1556', '63B', 'yingzhou_d2_licunxu', 'attacker', 'hou_liang', 'attacker', { enemyGeneralId: 'hou_liang_gen_543', from: 'city_daming', route: [p('黎阳滑州', 35.57, 114.52)] }),
    B('evt_1558', '63B', 'yingzhou_d2_licunxu', 'attacker', 'hou_liang', 'attacker', { enemyGeneralId: 'hou_liang_gen_544', from: 'city_daming', route: [p('麻家渡', 35.85, 115.2)] }),
    B('evt_1561', '63B', 'yingzhou_d2_licunxu', 'attacker', 'liao_d', 'attacker', { enemyGeneralId: 'liao_d_yelvabaoji', from: 'city_zhending', route: [p('新乐沙河', 38.37, 114.69)] }),
    B('evt_1563', '63B', 'yingzhou_d2_licunxu', 'attacker', 'hou_liang', 'attacker', { enemyGeneralId: 'dizhou_wangyanzhang', from: 'city_daming', city: at('city_qufu', 'hou_liang', 'shatuo'), route: [p('杨刘渡', 36.23, 116.15), p('郓州中都', 35.72, 116.49), p('曹州', 35.24, 115.45), p('大梁开封', 34.8, 114.31)] }),
    // ── 第 64 棒 ──
    B('evt_1564', '64', 'liao_d_yelvabaoji', 'attacker', 'zubu', 'attacker', { enemyGeneralId: 'zubu_shouling', from: 'city_linhuang', route: [p('阴山青冢', 40.75, 111.65)] }),
    B('evt_1566', '64', 'liao_d_yelvabaoji', 'attacker', 'bohai', 'attacker', { enemyGeneralId: 'bohai_dayinzhuan', from: 'city_linhuang', city: at('city_ningan', 'bohai', 'liao_d'), route: [p('扶余府', 45.45, 124.62)] }),
    B('evt_1568', '64', 'liao_d_gen_546', 'defender', 'hou_tang', 'attacker', { enemyGeneralId: 'hou_tang_gen_545', from: 'city_linhuang', route: [p('定州', 38.51, 114.99), p('曲阳嘉山', 38.62, 114.71), p('唐河', 38.58, 114.97)] }),
    B('evt_1569', '64', 'yiwu_jun_gen_547', 'defender', 'hou_tang', 'attacker', { enemyGeneralId: 'hou_tang_gen_545', city: at('city_zhongshan', 'yiwu_jun', 'shatuo') }),
    // ── 第 65A 棒 ──
    B('evt_1573', '65A', 'wende_gen_27', 'attacker', 'mazhaer', 'attacker', { enemyGeneralId: 'bfe_bulcsu', from: 'city_magedebao' }),
    B('evt_1596', '65A', 'gen_otto_great', 'defender', 'mazhaer', 'defender', { enemyGeneralId: 'bfe_bulcsu', from: 'city_magedebao', route: [p('乌尔姆', 48.4, 9.99)] }),
    // ── 第 65B 棒 ──
    B('evt_1576', '65B', 'dai_d_shijingtang', 'attacker', 'hou_tang', 'attacker', { enemyGeneralId: 'hou_tang_gen_548', from: 'city_linhuang', city: at('city_taiyuan', 'hou_jin', 'hou_jin'), route: [p('雁门', 39.19, 112.87), p('忻州', 38.42, 112.73)] }),
    B('evt_1583', '65B', 'hou_jin_gen_549', 'attacker', 'chengde', 'attacker', { enemyGeneralId: 'chengde_gen_550', from: 'city_bianliang', city: at('city_zhending', 'chengde', 'hou_jin'), route: [p('邺都', 36.27, 115.23), p('宗城破家堤', 37.05, 115.32)] }),
    B('evt_1585', '65B', 'liao_d_gen_28', 'attacker', 'hou_jin', 'defender', { enemyGeneralId: 'hou_jin_gen_551', from: 'city_linhuang', route: [p('汴梁', 34.8, 114.31)] }),
    B('evt_1586', '65B', 'liao_d_gen_28', 'attacker', 'hou_jin', 'defender', { enemyGeneralId: 'hou_jin_gen_29', from: 'city_beijing', route: [p('定州', 38.51, 114.99), p('泰州满城', 38.95, 115.32)] }),
    B('evt_1587', '65B', 'liao_d_gen_28', 'attacker', 'hou_jin', 'attacker', { enemyGeneralId: 'hou_jin_gen_549', from: 'city_beijing', route: [p('魏州', 36.27, 115.23)] }),
    // ── 第 66 棒 ──
    B('evt_1590', '66', 'hou_zhou_guowei', 'attacker', 'hou_han', 'attacker', { enemyGeneralId: 'houhan_lishouzhen', from: 'city_bianliang', city: at('city_tongguan', 'lishouzhen_jun', 'hou_han'), route: [p('陕州', 34.72, 111.1)] }),
    B('evt_1591', '66', 'hou_zhou_guowei', 'attacker', 'hou_han', 'attacker', { enemyGeneralId: 'hou_han_gen_552', from: 'city_daming', route: [p('邺都', 36.27, 115.23), p('滑州', 35.57, 114.52)] }),
    B('evt_1593', '66', 'hou_zhou_guowei', 'attacker', 'hou_han', 'attacker', { enemyGeneralId: 'hou_han_gen_553', from: 'city_bianliang', city: at('city_qufu', 'hou_han', 'hou_zhou'), route: [p('曹州', 35.24, 115.45)] }),
    B('evt_1595', '66', 'chanzhou_chairong', 'defender', 'hou_han', 'defender', { enemyGeneralId: 'xin_liuchong', from: 'city_bianliang', route: [p('怀州河阳', 35.1, 112.95)] }),
    B('evt_1597', '66', 'song_zhaokuangyin', 'attacker', 'nantang', 'attacker', { enemyGeneralId: 'chuzhou_d_huangfuhui', from: 'city_shouxian', city: at('city_qingliuguan', 'nantang', 'hou_zhou'), route: [p('正阳浮桥', 32.45, 116.53)] }),
    B('evt_1598', '66', 'chanzhou_chairong', 'attacker', 'nantang', 'attacker', { enemyGeneralId: 'bfe_liurenshan', from: 'city_bianliang', city: at('city_shouxian', 'nantang', 'hou_zhou'), route: [p('陈州颍州', 32.9, 115.81)] }),
    B('evt_1599', '66', 'chanzhou_chairong', 'attacker', 'nantang', 'attacker', { enemyGeneralId: 'nantang_gen_554', from: 'city_bianliang', city: at('city_yangzhou', 'nantang', 'hou_zhou'), route: [p('楚州老鹳河', 33.5, 119.12)] }),
    B('evt_1601', '66', 'song_zhaokuangyin', 'attacker', 'zhao_yi', 'attacker', { enemyGeneralId: 'zhao_yi_gen_555', from: 'city_bianliang', city: at('city_tianjinguan', 'zhao_yi', 'song'), route: [p('太行天井关', 35.35, 112.88), p('泽州', 35.49, 112.85), p('潞州', 36.19, 113.11)] }),
    B('evt_1604', '66', 'song_gen_556', 'attacker', 'wuping', 'attacker', { enemyGeneralId: 'wuping_gen_557', from: 'city_bianliang', city: at('city_wuling', 'machu', 'song'), route: [p('襄州', 32.01, 112.12), p('江陵', 30.35, 112.18), p('三江口岳州', 29.37, 113.09)] }),
    B('evt_1605', '66', 'song_gen_558', 'attacker', 'hou_shu', 'attacker', { enemyGeneralId: 'hou_shu_gen_559', from: 'city_ying', city: at('city_baidicheng2', 'hou_shu', 'song'), route: [p('归州', 30.83, 110.97)] }),
    B('evt_1606', '66', 'song_gen_560', 'attacker', 'hou_shu', 'attacker', { enemyGeneralId: 'hou_shu_gen_561', from: 'city_changan', city: at('city_jianmenguan', 'hou_shu', 'song'), route: [p('凤州', 33.91, 106.52), p('兴州利州', 32.43, 105.82), p('来苏剑门关', 32.2, 105.56), p('魏城成都', 30.57, 104.07)] }),
    B('evt_1608', '66', 'song_gen_562', 'attacker', 'xingguo_jun', 'attacker', { enemyGeneralId: 'xingguo_jun_gen_563', from: 'city_chengdu', city: at('city_chengdu', 'song', 'song'), route: [p('新繁', 30.88, 104.01), p('灌口', 30.99, 103.62)] }),
    // ── 第 67 棒 ──
    B('evt_1613', '67', 'song_gen_564', 'attacker', 'nanhan', 'attacker', { enemyGeneralId: 'nanhan_gen_565', from: 'city_lingqu', city: at('city_panyu', 'nanhan', 'song'), route: [p('贺州', 24.41, 111.55), p('韶州', 24.81, 113.6), p('英州清远', 23.7, 113.03)] }),
    B('evt_1617', '67', 'song_gen_562', 'attacker', 'nantang', 'attacker', { enemyGeneralId: 'nantang_gen_566', from: 'city_ying', route: [p('池州', 30.66, 117.49)] }),
    B('evt_1618', '67', 'song_gen_562', 'attacker', 'nantang', 'attacker', { enemyGeneralId: 'nantang_gen_567', from: 'city_jiuzi', city: at('city_nanjing', 'nantang', 'song'), route: [p('新林港秦淮', 32.0, 118.73)] }),
    B('evt_1622', '67', 'song_zhaoguangyi', 'attacker', 'hou_han', 'attacker', { enemyGeneralId: 'hou_han_gen_568', from: 'city_bianliang', city: at('city_taiyuan', 'hou_han', 'song'), route: [p('怀州泽潞', 36.19, 113.11)] }),
    B('evt_1623', '67', 'song_zhaoguangyi', 'attacker', 'liao_d', 'defender', { enemyGeneralId: 'yel_yelvxiuge', from: 'city_taiyuan', city: at('city_beijing', 'liao_d', 'liao_d'), route: [p('镇州', 38.14, 114.57), p('易州涿州', 39.49, 115.97)] }),
    B('evt_1624', '67', 'heng1_yangye', 'defender', 'liao_d', 'defender', { enemyGeneralId: 'liao_d_xiaoduli', city: at('city_yanmenguan', 'song', 'song') }),
    B('evt_1628', '67', 'song_gen_569', 'attacker', 'dangxiang', 'attacker', { enemyGeneralId: 'xiazhou_lijiqian', from: 'city_tongwancheng' }),
    B('evt_1630', '67', 'song_gen_562', 'attacker', 'liao_d', 'defender', { enemyGeneralId: 'yel_yelvxiuge', from: 'city_baoding', route: [p('雄州', 39.01, 116.12), p('涿州', 39.49, 115.97)] }),
    B('evt_1631', '67', 'heng1_yangye', 'defender', 'liao_d', 'attacker', { enemyGeneralId: 'bfe_xiaotalin', from: 'city_yanmenguan', route: [p('代州', 39.06, 112.96), p('朔州灰河', 39.25, 112.43)] }),
    B('evt_1632', '67', 'song_lijilong', 'defender', 'liao_d', 'defender', { enemyGeneralId: 'yel_yelvxiuge', from: 'city_zhongshan' }),
    // ── 第 68 棒 ──
    B('evt_1637', '68', 'liao_d_gen_570', 'attacker', 'goryeo', 'defender', { enemyGeneralId: 'goryeo_gen_571', from: 'city_liaoyang', city: at('city_xicheng', 'goryeo', 'goryeo'), route: [p('蓬山郡', 40.1, 124.75)] }),
    B('evt_1639', '68', 'liao_d_handewei', 'attacker', 'song', 'defender', { enemyGeneralId: 'zhe_d_zheyuqing', from: 'city_datong' }),
    B('evt_1643', '68', 'bfe_cb_liao_d_1', 'attacker', 'song', 'defender', { enemyGeneralId: 'changshan_yangyanzhao', from: 'city_beijing', city: at('city_baoding', 'song', 'song') }),
    B('evt_1646', '68', 'xiazhou_lijiqian', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_peiji', from: 'city_jingbianbao', city: at('city_lingzhou', 'song', 'dangxiang') }),
    B('evt_1647', '68', 'liugubu_gen_572', 'defender', 'dangxiang', 'defender', { enemyGeneralId: 'xiazhou_lijiqian', city: at('city_wuwei', 'liugubu', 'liugubu') }),
    B('evt_1648', '68', 'bfe_xiaotalin', 'attacker', 'song', 'defender', { enemyGeneralId: 'song_lijilong', from: 'city_beijing', city: at('city_puyang', 'song', 'song'), route: [p('瀛州', 38.57, 116.09), p('天雄大名', 36.27, 115.23)] }),
    B('evt_1654', '68', 'liao_d_gen_31', 'attacker', 'goryeo', 'attacker', { enemyGeneralId: 'goryeo_gen_573', from: 'city_liaoyang', route: [p('义州鸭绿江', 40.12, 124.39), p('兴化镇', 40.12, 124.6)] }),
    B('evt_1662', '68', 'liao_d_xiaopaiya', 'attacker', 'goryeo', 'defender', { enemyGeneralId: 'goryeo_jianghanzan', from: 'city_liaoyang', route: [p('鸭绿江', 40.12, 124.39)] }),
    B('evt_1663', '68', 'liao_d_xiaopaiya', 'attacker', 'goryeo', 'defender', { enemyGeneralId: 'goryeo_jianghanzan', from: 'city_pyongyang', route: [p('开京新恩驿', 38.15, 126.4), p('平壤西京', 39.02, 125.76)] }),
    B('evt_1672', '68', 'ganzhou_huihu_gen_574', 'defender', 'dangxiang', 'attacker', { enemyGeneralId: 'dangxiang_liyuanhao', city: at('city_zhangye', 'ganzhou_huihu', 'dangxiang') }),
    // ── 第 69 棒 ──
    B('evt_1683', '69', 'dangxiang_liyuanhao', 'attacker', 'song', 'defender', { enemyGeneralId: 'zhai_han_diqing', from: 'city_xingqingfu2', city: at('city_baoanjun', 'song', 'song') }),
    B('evt_1684', '69', 'dangxiang_liyuanhao', 'attacker', 'song', 'attacker', { enemyGeneralId: 'bfe_liuping', from: 'city_xingqingfu2', route: [p('金明砦', 36.78, 109.38)] }),
    B('evt_1686', '69', 'yeli_yeliwangrong', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_renfu', from: 'city_keyimen', route: [p('镇戎军', 36.01, 106.28), p('怀远城羊牧隆城', 35.65, 105.98)] }),
    B('evt_1687', '69', 'dangxiang_liyuanhao', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_gen_575', from: 'city_xingqingfu2', route: [p('镇戎军', 36.01, 106.28), p('瓦亭寨', 35.8, 106.22)] }),
    B('evt_1688', '69', 'dangxiang_liyuanhao', 'attacker', 'song', 'defender', { enemyGeneralId: 'song_gen_576', from: 'city_xingqingfu2' }),
    B('evt_1690', '69', 'dangxiang_liyuanhao', 'defender', 'liao_d', 'defender', { enemyGeneralId: 'liao_d_gen_577', from: 'city_xingqingfu2', route: [p('西京大同', 40.08, 113.3)] }),
    B('evt_1695', '69', 'dangxiang_gen_579', 'defender', 'liao_d', 'attacker', { enemyGeneralId: 'liao_d_gen_578', from: 'city_xingqingfu2' }),
    // ── 第 70 棒 ──
    B('evt_1698', '70', 'bfe_chengong', 'defender', 'nongzhigao', 'attacker', { enemyGeneralId: 'nong2_nongzhigao', city: at('city_yongzhou', 'song', 'nongzhigao') }),
    B('evt_1699', '70', 'zhai_han_diqing', 'attacker', 'nongzhigao', 'attacker', { enemyGeneralId: 'nong2_nongzhigao', from: 'city_lingqu', city: at('city_yongzhou', 'nongzhigao', 'song'), route: [p('宾州', 23.22, 108.8), p('昆仑关归仁铺', 22.96, 108.65), p('邕州', 22.82, 108.32)] }),
    // ── 第 71A 棒 ──
    B('evt_1682', '71A', 'wugu_d_tugelile', 'attacker', 'jiazini', 'attacker', { enemyGeneralId: 'jiazini_gen_580', from: 'city_merv', city: at('city_salahesi', 'jiazini', 'seljuq') }),
    B('evt_1685', '71A', 'wugu_d_tugelile', 'attacker', 'jiazini', 'attacker', { enemyGeneralId: 'jiazini_masud', from: 'city_salahesi', route: [p('赫拉特', 34.34, 62.19), p('萨拉赫斯', 36.54, 61.16)] }),
    B('evt_1696', '71A', 'wugu_d_tugelile', 'attacker', 'kakuyids', 'attacker', { enemyGeneralId: 'kakuyids_gen_581', from: 'city_leiyi', city: at('city_yisifahan', 'kakuyids', 'kakuyids') }),
    B('evt_1705', '71A', 'basasiri_jun_gen_582', 'attacker', 'abasi', 'attacker', { enemyGeneralId: 'abasi_gen_583', from: 'city_rahba', city: at('city_bageda', 'abasi', 'basasiri_jun'), route: [p('安巴尔', 33.36, 43.72)] }),
    B('evt_1706', '71A', 'kumisi_aerpu', 'attacker', 'yinaer_jun', 'attacker', { enemyGeneralId: 'yinaer_jun_gen_584', from: 'city_nishabuer', route: [p('哈马丹', 34.8, 48.51)] }),
    // ── 第 71B 棒 ──
    B('evt_1700', '71B', 'gen_robert_guiscard', 'attacker', 'jiaohuangguo', 'attacker', { enemyGeneralId: 'luoma_diguo_leo_ix', from: 'city_meierfei', route: [p('罗马', 41.9, 12.49), p('贝内文托', 41.13, 14.78)] }),
    B('evt_1707', '71B', 'gen_robert_guiscard', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'baizanting_shouling', from: 'city_meierfei', city: at('city_messina', 'baizanting', 'xixiliwangguo'), route: [p('科森扎', 39.3, 16.25)] }),
    B('evt_1708', '71B', 'gen_roger_i', 'attacker', 'kalbids', 'attacker', { enemyGeneralId: 'kalbids_ibnhawwas', from: 'city_messina', city: at('city_messina', 'kalbids', 'xixiliwangguo') }),
    B('evt_1710', '71B', 'gen_roger_i', 'defender', 'zirids', 'defender', { enemyGeneralId: 'zirids_gen_585', from: 'city_messina', route: [p('特罗伊纳', 37.78, 14.6)] }),
    // ── 第 71C 棒 ──
    B('evt_1693', '71C', 'gaolu_conqueror', 'attacker', 'brionne', 'attacker', { enemyGeneralId: 'brionne_shouling', from: 'city_rouen' }),
    B('evt_1703', '71C', 'gwynedd_gen_587', 'attacker', 'yinggelan', 'attacker', { enemyGeneralId: 'yinggelan_gen_588', from: 'city_buyiersi', city: at('city_geluosite', 'yinggelan', 'yinggelan') }),
    B('evt_1709', '71C', 'nuowei_hardrada', 'attacker', 'danmai', 'attacker', { enemyGeneralId: 'danmai_gen_589', from: 'city_boergong' }),
    B('evt_1713', '71C', 'gaolu_conqueror', 'attacker', 'yinggelan', 'attacker', { enemyGeneralId: 'bfe_harold_godwinson', from: 'city_saint_valery', route: [p('佩文西登陆', 50.82, 0.34)] }),
    B('evt_1716', '71C', 'gaolu_conqueror', 'attacker', 'yinggelan', 'attacker', { enemyGeneralId: 'yinggelan_gen_590', from: 'city_lundun', city: at('city_york', 'northumbria', 'yinggelan'), route: [p('林肯', 53.23, -0.54)] }),
    // ── 第 72A 棒 ──
    B('evt_1711', '72A', 'kumisi_aerpu', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'baizanting_shouling', from: 'city_leiyi', city: at('city_ani', 'baizanting', 'seljuq'), route: [p('大不里士', 38.08, 46.29), p('纳希切温', 39.21, 45.41)] }),
    B('evt_1717', '72A', 'seljuq_gen_592', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'baizanting_gen_593', from: 'city_tushpa' }),
    B('evt_1718', '72A', 'kumisi_aerpu', 'defender', 'baizanting', 'defender', { enemyGeneralId: 'baizanting_gen_594', from: 'city_alepo', route: [p('君士坦丁堡', 41.01, 28.97), p('塞巴斯蒂亚', 39.75, 37.02), p('埃尔祖鲁姆', 39.9, 41.27)] }),
    // ── 第 72B 棒 ──
    B('evt_1719', '72B', 'didao_wangshao', 'attacker', 'gusiluo', 'attacker', { enemyGeneralId: 'gusiluo_gen_595', from: 'city_qishan', route: [p('秦州', 34.58, 105.72)] }),
    B('evt_1720', '72B', 'didao_wangshao', 'attacker', 'gusiluo', 'attacker', { enemyGeneralId: 'tubo_muzheng', from: 'city_lintao', city: at('city_fuhan', 'gusiluo', 'song'), route: [p('通远军', 35.01, 104.64), p('熙州狄道', 35.37, 103.84), p('露骨山踏白城', 35.25, 103.6)] }),
    B('evt_1721', '72B', 'didao_wangshao', 'defender', 'gusiluo', 'defender', { enemyGeneralId: 'tubo_muzheng', from: 'city_lintao', route: [p('定羌城', 35.48, 103.57), p('宁河寨河州', 35.6, 103.21)] }),
    // ── 第 73A 棒 ──
    B('evt_1728', '73A', 'song_gen_32', 'attacker', 'dangxiang', 'defender', { enemyGeneralId: 'dangxiang_gen_596', from: 'city_fangqu', city: at('city_lingzhou', 'dangxiang', 'dangxiang'), route: [p('清远军', 37.35, 106.55), p('旱海磨脐隘', 37.78, 106.4)] }),
    B('evt_1730', '73A', 'song_gen_598', 'defender', 'dangxiang', 'attacker', { enemyGeneralId: 'dangxiang_gen_597', from: 'city_fushi', city: at('city_yinzhou', 'song', 'dangxiang'), route: [p('绥德城', 37.5, 110.26)] }),
    B('evt_1752', '73A', 'song_gen_33', 'attacker', 'gusiluo', 'attacker', { enemyGeneralId: 'gusiluo_gen_599', from: 'city_fuhan', city: at('city_ledou', 'gusiluo', 'song'), route: [p('巴金岭', 36.32, 102.6)] }),
    B('evt_1769', '73A', 'song_gen_600', 'attacker', 'dangxiang', 'defender', { enemyGeneralId: 'dangxiang_gen_601', from: 'city_qingtang' }),
    // ── 第 73B 棒 ──
    B('evt_1756', '73B', 'dajin_gen_602', 'defender', 'goryeo', 'attacker', { enemyGeneralId: 'woju_yinguan', from: 'city_huining', city: at('city_hamhung', 'dajin', 'goryeo'), route: [p('定州关', 39.7, 127.42)] }),
    B('evt_1764', '73B', 'dajin_wanyanaguda', 'attacker', 'liao_d', 'attacker', { enemyGeneralId: 'liao_d_gen_603', from: 'city_huining', route: [p('宁江州', 45.35, 125.95)] }),
    B('evt_1765', '73B', 'dajin_wanyanaguda', 'attacker', 'liao_d', 'attacker', { enemyGeneralId: 'liao_d_tianzuodi', from: 'city_huining', route: [p('黄龙府', 44.49, 125.18)] }),
    // ── 第 74 棒 ──
    B('evt_1770', '74', 'song_gen_604', 'defender', 'fangla', 'attacker', { enemyGeneralId: 'fangla_fangla', city: at('city_hangzhou', 'song', 'fangla') }),
    B('evt_1771', '74', 'song_gen_605', 'attacker', 'songjiang_jun', 'attacker', { enemyGeneralId: 'songjiang_jun_gen_606', from: 'city_qucheng' }),
    B('evt_1775', '74', 'yizhou_wanyanloushi', 'attacker', 'liao_d', 'attacker', { enemyGeneralId: 'liao_d_tianzuodi', from: 'city_datong', route: [p('夹山', 40.85, 111.55), p('朔州', 39.32, 112.43)] }),
    B('evt_1776', '74', 'mohe_wanyanzonghan', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_wangbing', from: 'city_datong', city: at('city_taiyuan', 'song', 'dajin'), route: [p('代州忻州', 38.42, 112.73)] }),
    B('evt_1777', '74', 'mohe_wanyanzonghan', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_gen_605', from: 'city_taiyuan', city: at('city_bianliang', 'song', 'song'), route: [p('河阳孟津', 34.85, 112.58)] }),
    // ── 第 75 棒 ──
    B('evt_1780', '75', 'sizhou_hanshizhong', 'attacker', 'dajin', 'draw', { enemyGeneralId: 'jurchen_wanyanzongbi', from: 'city_yangzhou', route: [p('临安', 30.25, 120.16), p('平江常州', 31.78, 119.95)] }),
    B('evt_1781', '75', 'song_zhangjun', 'defender', 'dajin', 'attacker', { enemyGeneralId: 'yizhou_wanyanloushi', from: 'city_binzhou2' }),
    B('evt_1782', '75', 'fengzhou_wujie', 'defender', 'dajin', 'defender', { enemyGeneralId: 'jurchen_wanyanzongbi', city: at('city_dasanguan', 'song', 'song') }),
    B('evt_1784', '75', 'fengzhou_wujie', 'defender', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_607', from: 'city_dasanguan', city: at('city_ziwu', 'song', 'song'), route: [p('商州', 33.87, 109.94), p('金州', 32.69, 109.03)] }),
    B('evt_1785', '75', 'fengzhou_wujie', 'defender', 'dajin', 'defender', { enemyGeneralId: 'jurchen_wanyanzongbi', city: at('city_huixian', 'song', 'song') }),
    B('evt_1786', '75', 'yanchuan_d_yuefei', 'attacker', 'liu_qi', 'attacker', { enemyGeneralId: 'liu_qi_gen_608', from: 'city_wuchang', city: at('city_xiangyang', 'liu_qi', 'song'), route: [p('郢州', 31.19, 112.58)] }),
    B('evt_1787', '75', 'yanchuan_d_yuefei', 'attacker', 'zhongxiang', 'attacker', { enemyGeneralId: 'zhongxiang_gen_609', from: 'city_wuchang', city: at('city_dingkou', 'zhongxiang', 'song'), route: [p('潭州', 28.2, 112.97)] }),
    B('evt_1792', '75', 'yingzhou_d_liuqi', 'defender', 'dajin', 'defender', { enemyGeneralId: 'jurchen_wanyanzongbi', city: at('city_shunchang', 'song', 'song') }),
    B('evt_1793', '75', 'yanchuan_d_yuefei', 'defender', 'dajin', 'defender', { enemyGeneralId: 'jurchen_wanyanzongbi', from: 'city_yancheng2', route: [p('顺昌', 32.9, 115.81), p('汴梁', 34.8, 114.31)] }),
    B('evt_1794', '75', 'song_gen_610', 'defender', 'dajin', 'defender', { enemyGeneralId: 'jurchen_wanyanzongbi', city: at('city_xuchang', 'song', 'song') }),
    // ── 第 76 棒 ──
    B('evt_1814', '76', 'song_gen_611', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_612', from: 'city_gusu', route: [p('平江江阴', 31.91, 120.26), p('石臼岛', 35.42, 119.55)] }),
    B('evt_1815', '76', 'song_gen_35', 'defender', 'dajin', 'defender', { enemyGeneralId: 'dajin_gen_613', from: 'city_jiuzi', route: [p('涡口', 32.92, 117.18), p('和州杨林渡', 31.72, 118.38)] }),
    B('evt_1816', '76', 'changshaguo_xinqiji', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_614', from: 'city_licheng', route: [p('济州灵山', 35.42, 116.59), p('楚州淮安', 33.6, 119.02)] }),
    B('evt_1817', '76', 'song_lixianzhong', 'defender', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_615', city: at('city_xucheng', 'song', 'dajin') }),
    // ── 第 77 棒 ──
    B('evt_1821', '77', 'ayoubu_salaheding', 'defender', 'yelusalengwg', 'draw', { enemyGeneralId: 'yelusalengwg_amalric', city: at('city_yalishanda', 'antiaokegongguo', 'fatimids') }),
    B('evt_1829', '77', 'ayoubu_salaheding', 'defender', 'antiaokegongguo', 'defender', { enemyGeneralId: 'antiaokegongguo_gen_616', from: 'city_damasikusi', route: [p('霍姆斯', 34.73, 36.71)] }),
    // ── 第 78A 棒 ──
    B('evt_1808', '78A', 'shiwaben_barbarossa', 'attacker', 'lombard_league', 'attacker', { enemyGeneralId: 'lombard_league_shouling', from: 'city_aogesibao', city: at('city_tortona', 'lombard_league', 'shiwaben'), route: [p('布伦纳山口', 47.0, 11.51), p('维罗纳', 45.44, 10.99), p('帕维亚', 45.19, 9.16)] }),
    B('evt_1812', '78A', 'shiwaben_barbarossa', 'attacker', 'lombard_league', 'attacker', { enemyGeneralId: 'lombard_league_shouling', from: 'city_aogesibao', city: at('city_milan', 'lombard_league', 'lombard_league') }),
    B('evt_1830', '78A', 'shiwaben_barbarossa', 'attacker', 'lombard_league', 'defender', { enemyGeneralId: 'lombard_league_gen_617', from: 'city_milan', route: [p('科莫', 45.81, 9.08)] }),
    // ── 第 78B 棒 ──
    B('evt_1831', '78B', 'baizanting_gen_36', 'attacker', 'luomu', 'defender', { enemyGeneralId: 'luomu_shouling', from: 'city_junshitandingbao', route: [p('多里莱乌姆', 39.78, 30.52), p('霍奈', 37.76, 29.3)] }),
    // ── 第 79 棒 ──
    B('evt_1832', '79', 'ayoubu_salaheding', 'attacker', 'yelusalengwg', 'defender', { enemyGeneralId: 'gen_baodewen_iv', from: 'city_mengfeisi', route: [p('加沙', 31.5, 34.47), p('阿什凯隆', 31.67, 34.55)] }),
    B('evt_1833', '79', 'ayoubu_gen_619', 'defender', 'yelusalengwg', 'defender', { enemyGeneralId: 'yelusalengwg_shouling', from: 'city_emesa' }),
    B('evt_1834', '79', 'ayoubu_salaheding', 'attacker', 'yelusalengwg', 'attacker', { enemyGeneralId: 'gen_baodewen_iv', from: 'city_damasikusi', route: [p('巴尼亚斯', 33.25, 35.69)] }),
    B('evt_1837', '79', 'ayoubu_salaheding', 'attacker', 'yelusalengwg', 'defender', { enemyGeneralId: 'gen_baodewen_iv', from: 'city_mengfeisi', route: [p('开罗', 30.04, 31.24), p('大马士革南郊', 33.35, 36.25)] }),
    B('evt_1843', '79', 'ayoubu_salaheding', 'attacker', 'saipulusi', 'attacker', { enemyGeneralId: 'saipulusi_juyi', from: 'city_damasikusi', route: [p('萨富里亚泉', 32.75, 35.28)] }),
    B('evt_1844', '79', 'ayoubu_salaheding', 'attacker', 'antioch_principality', 'attacker', { enemyGeneralId: 'antioch_principality_shouling', from: 'city_damasikusi', city: at('city_latajiya', 'antioch_principality', 'ayoubu'), route: [p('霍姆斯', 34.73, 36.71), p('塔尔图斯', 34.89, 35.89), p('杰卜莱', 35.36, 35.93)] }),
    B('evt_1847', '79', 'ayoubu_salaheding', 'attacker', 'yinggelan', 'defender', { enemyGeneralId: 'yinggelan_lionheart', from: 'city_yelusaleng', route: [p('阿卡', 32.92, 35.07), p('海法凯撒利亚', 32.5, 34.89)] }),
    // ── 第 80 棒 ──
    B('evt_1846', '80', 'menggu_d_chengjisihan', 'defender', 'zhadalan', 'attacker', { enemyGeneralId: 'zhadalan_zhamuhe', from: 'city_qudiaoalan', route: [p('不儿罕山桑沽儿河', 48.1, 108.9), p('答兰版朱思', 48.62, 110.45), p('哲列捏狭口', 48.75, 110.65)] }),
    B('evt_1852', '80', 'menggu_d_chengjisihan', 'attacker', 'tatar', 'attacker', { enemyGeneralId: 'tatar_mieguzhen', from: 'city_qudiaoalan', route: [p('怯绿连河', 48.06, 113.52)] }),
    B('evt_1857', '80', 'menggu_d_chengjisihan', 'attacker', 'zhadalan', 'attacker', { enemyGeneralId: 'zhadalan_zhamuhe', from: 'city_qudiaoalan', route: [p('古连勒古山', 48.15, 109.2), p('怯绿连河', 48.12, 114.5)] }),
    B('evt_1859', '80', 'menggu_d_chengjisihan', 'attacker', 'kereyid', 'attacker', { enemyGeneralId: 'kereyid_wanghan', from: 'city_julunbo', route: [p('巴勒渚纳海子', 49.25, 115.2)] }),
    // ── 第 81A 棒 ──
    B('evt_1867', '81A', 'menggu_d_chengjisihan', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_wanyanchengyu', from: 'city_qudiaoalan', route: [p('怯绿连河', 48.06, 113.52), p('抚州乌月营', 41.25, 114.65), p('野狐岭獾儿嘴', 40.91, 114.72), p('浍河堡', 40.48, 115.32)] }),
    B('evt_1871', '81A', 'menggu_d_gen_620', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_621', from: 'city_xinghe', city: at('city_beijing', 'dajin', 'menggu_d') }),
    // ── 第 81B 棒 ──
    B('evt_1875', '81B', 'bfe_chagatai', 'attacker', 'huarazim', 'attacker', { enemyGeneralId: 'dayuzi_yinalechihei', from: 'city_almaliq', city: at('city_turkestan', 'huarazim', 'huarazim'), route: [p('额敏河叶密立', 46.52, 83.62), p('阿力麻里', 44.22, 80.52)] }),
    B('evt_1876', '81B', 'menggu_d_chengjisihan', 'attacker', 'huarazim', 'attacker', { enemyGeneralId: 'huarazim_mohemo', from: 'city_turkestan', city: at('city_bukhara', 'huarazim', 'menggu_d'), route: [p('讹答剌', 42.85, 68.3), p('札儿努黑', 40.65, 65.55), p('努尔堡', 40.56, 65.69)] }),
    B('evt_1878', '81B', 'wuliangha_subutai', 'attacker', 'gelujiya', 'attacker', { enemyGeneralId: 'gelujiya_ivane', from: 'city_dabulishi', route: [p('穆甘草原', 39.65, 48.35)] }),
    B('evt_1879', '81B', 'wuliangha_subutai', 'attacker', 'luosi', 'attacker', { enemyGeneralId: 'bfe_mstislav_kiev', from: 'city_daerban', route: [p('第聂伯河下渡', 47.8, 35.15)] }),
    B('evt_1881', '81B', 'huarazim_jalal', 'attacker', 'gelujiya', 'attacker', { enemyGeneralId: 'gelujiya_ivane', from: 'city_dabulishi', route: [p('德温', 40.0, 44.58)] }),
    // ── 第 81C 棒 ──
    B('evt_1882', '81C', 'menggu_d_chengjisihan', 'attacker', 'dangxiang', 'attacker', { enemyGeneralId: 'weiming_weiminglinggong', from: 'city_zhangye', city: at('city_lingzhou', 'dangxiang', 'menggu_d'), route: [p('应理凉州', 37.93, 102.64)] }),
    B('evt_1883', '81C', 'menggu_d_chengjisihan', 'attacker', 'dangxiang', 'attacker', { enemyGeneralId: 'dangxiang_gen_622', from: 'city_lingzhou', city: at('city_xingqingfu2', 'dangxiang', 'menggu_d') }),
    B('evt_1884', '81C', 'menggu_d_gen_623', 'defender', 'dajin', 'attacker', { enemyGeneralId: 'xiqin_wanyanchenheshang', from: 'city_zhedi' }),
    // ── 第 82 棒 ──
    B('evt_1873', '82', 'yiyang_d_mengzongzheng', 'defender', 'dajin', 'defender', { enemyGeneralId: 'dajin_wanyaneke', city: at('city_zaoyang', 'song', 'song') }),
    B('evt_1888', '82', 'borjigin_tuolei', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_wanyanheda', from: 'city_hanzhong', city: at('city_xuchang', 'dajin', 'menggu_d'), route: [p('唐邓光化', 32.55, 111.75)] }),
    B('evt_1889', '82', 'wuliangha_subutai', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_gen_624', from: 'city_xuchang', city: at('city_bianliang', 'dajin', 'menggu_d') }),
    B('evt_1890', '82', 'zaoyang_d_menggong', 'attacker', 'dajin', 'attacker', { enemyGeneralId: 'dajin_wanyan_zhongde', from: 'city_xiangyang', city: at('city_xuanhu', 'dajin', 'menggu_d'), route: [p('唐州', 32.69, 112.83)] }),
    B('evt_1891', '82', 'menggu_d_gen_625', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_gen_626', from: 'city_zhaoge', city: at('city_luoyang', 'menggu_d', 'menggu_d'), route: [p('泗州汴梁', 34.8, 114.31)] }),
    B('evt_1896', '82', 'zaoyang_d_menggong', 'attacker', 'menggu_d', 'attacker', { enemyGeneralId: 'bfe_youxian', from: 'city_wuchang', city: at('city_xiangyang', 'menggu_d', 'song'), route: [p('光化樊城', 32.04, 112.14)] }),
    // ── 第 83 棒 ──
    B('evt_1902', '83', 'mamuluke_baibaisi', 'attacker', 'yelusalengwg', 'attacker', { enemyGeneralId: 'yelusalengwg_gen_627', from: 'city_mengfeisi', route: [p('阿卡', 32.92, 35.07), p('阿什凯隆', 31.67, 34.55)] }),
    B('evt_1908', '83', 'mamuluke_baibaisi', 'defender', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_gen_628', city: at('city_mansoura', 'mamuluke', 'mamuluke') }),
    B('evt_1910', '83', 'mamuluke_gen_630', 'defender', 'ayoubu', 'defender', { enemyGeneralId: 'ayoubu_gen_629', from: 'city_mengfeisi', route: [p('大马士革', 33.51, 36.31), p('加沙', 31.5, 34.47)] }),
    B('evt_1915', '83', 'asaibaijiang_xuliewu', 'attacker', 'nizari', 'attacker', { enemyGeneralId: 'nizari_gen_631', from: 'city_nishabuer', city: at('city_alamut', 'nizari', 'yilihanguo_d'), route: [p('麦门迪兹堡', 36.48, 50.52)] }),
    B('evt_1917', '83', 'asaibaijiang_xuliewu', 'attacker', 'abasi', 'attacker', { enemyGeneralId: 'abasi_mustasim', from: 'city_hamadan', city: at('city_bageda', 'abasi', 'yilihanguo_d'), route: [p('克尔曼沙赫', 34.31, 47.06)] }),
    B('evt_1920', '83', 'mamuluke_baibaisi', 'attacker', 'yilihanguo_d', 'attacker', { enemyGeneralId: 'yilihanguo_kitbuqa', from: 'city_mengfeisi', route: [p('开罗', 30.04, 31.24), p('加沙阿卡城外', 32.92, 35.07)] }),
    B('evt_1923', '83', 'asaibaijiang_xuliewu', 'attacker', 'jinzhang', 'attacker', { enemyGeneralId: 'jinzhang_nogai', from: 'city_malagai', city: at('city_daerban', 'jinzhang', 'jinzhang'), route: [p('沙马基', 40.63, 48.64), p('打耳班', 42.05, 48.28), p('帖列克河', 43.6, 46.8)] }),
    B('evt_1929', '83', 'mamuluke_baibaisi', 'attacker', 'antioch_principality', 'attacker', { enemyGeneralId: 'antioch_principality_gen_632', from: 'city_damasikusi', city: at('city_antiejiya', 'antioch_principality', 'mamuluke'), route: [p('阿帕梅亚', 35.42, 36.4)] }),
    B('evt_1932', '83', 'mamuluke_baibaisi', 'defender', 'yinggelan', 'draw', { enemyGeneralId: 'gen_edward_longshanks', from: 'city_qaqun', route: [p('阿卡', 32.92, 35.07)] }),
    // ── 第 84 棒 ──
    B('evt_1912', '84', 'yuan_d_hubilie', 'attacker', 'dali', 'attacker', { enemyGeneralId: 'dali_gen_633', from: 'city_lintao', city: at('city_dali_city', 'dali', 'yuan_d'), route: [p('忒剌大渡河', 29.3, 102.2), p('金沙江革囊渡', 26.88, 100.0)] }),
    B('evt_1918', '84', 'menggu_d_mongke', 'attacker', 'song', 'defender', { enemyGeneralId: 'hezhou_wangjian', from: 'city_hanzhong', city: at('city_diaoyucheng', 'song', 'song'), route: [p('六盘山', 35.65, 106.2), p('利州剑门苦竹隘', 32.25, 105.45)] }),
    B('evt_1919', '84', 'yuan_d_hubilie', 'attacker', 'song', 'defender', { enemyGeneralId: 'song_gen_634', from: 'city_shangdu', city: at('city_wuchang', 'song', 'song'), route: [p('大胜关', 31.82, 114.05), p('黄陂阳逻堡', 30.65, 114.58)] }),
    B('evt_1922', '84', 'yuan_d_hubilie', 'attacker', 'helin_hanting', 'attacker', { enemyGeneralId: 'helin_hanting_gen_635', from: 'city_shangdu' }),
    B('evt_1934', '84', 'yuan_d_gen_636', 'attacker', 'song', 'attacker', { enemyGeneralId: 'xiangzhou_lvwenhuan', from: 'city_bianliang', city: at('city_xiangyang', 'song', 'yuan_d') }),
    B('evt_1936', '84', 'merkit_boyan', 'attacker', 'song', 'attacker', { enemyGeneralId: 'song_gen_634', from: 'city_wuchang', route: [p('江州安庆', 30.51, 117.04)] }),
    B('evt_1937', '84', 'yuan_d_gen_637', 'attacker', 'song', 'attacker', { enemyGeneralId: 'luoping_zhangshijie', from: 'city_yangzhou', route: [p('瓜洲', 32.25, 119.39)] }),
    B('evt_1941', '84', 'yuan_d_gen_638', 'attacker', 'song', 'attacker', { enemyGeneralId: 'luoping_zhangshijie', from: 'city_panyu', city: at('city_xinhui', 'song', 'yuan_d'), route: [p('潮州漳州', 23.66, 116.62), p('广州虎头门', 22.8, 113.62)] }),
    B('evt_1949', '84', 'yuan_d_hubilie', 'attacker', 'dongdao_zongwang', 'attacker', { enemyGeneralId: 'dongdao_zongwang_gen_639', from: 'city_shangdu' }),
    // ── 第 85 棒 ──
    B('evt_1964', '85', 'yuan_d_gen_37', 'defender', 'ogedei', 'defender', { enemyGeneralId: 'ogedei_gen_640', from: 'city_karakorum', route: [p('叶密立阿力麻里', 44.22, 80.52), p('阿尔泰山', 47.64, 88.29)] }),
    B('evt_1991', '85', 'chahar_yantiemuer', 'defender', 'shangdu_jun', 'defender', { enemyGeneralId: 'shangdu_wangchan', from: 'city_beijing', city: at('city_juyongguan', 'yuan_d', 'yuan_d'), route: [p('上都', 42.28, 115.76)] }),
    // ── 第 86 棒 ──
    B('evt_2005', '86', 'yinggelan_gen_641', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gaolu_gen_642', from: 'city_lundun', route: [p('奥尔韦尔河口', 51.95, 1.3)] }),
    B('evt_2007', '86', 'yinggelan_gen_644', 'defender', 'bulietani', 'defender', { enemyGeneralId: 'bulietani_gen_643', from: 'city_kanpeier' }),
    B('evt_2010', '86', 'yinggelan_gen_645', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gaolu_gen_646', from: 'city_bordeaux', route: [p('利布尔讷', 44.91, -0.24)] }),
    B('evt_2011', '86', 'gen_black_prince', 'defender', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_gen_647', from: 'city_winchester', route: [p('瑟堡登陆', 49.64, -1.62), p('卡昂', 49.19, -0.36), p('布朗什塔克浅滩', 50.15, 1.76)] }),
    B('evt_2012', '86', 'yinggelan_gen_641', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gaolu_gen_648', from: 'city_winchester', city: at('city_calais', 'gaolu', 'yinggelan'), route: [p('克雷西', 50.26, 1.9)] }),
    B('evt_2014', '86', 'yinggelan_gen_650', 'defender', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_gen_649', from: 'city_bordeaux' }),
    B('evt_2021', '86', 'gen_black_prince', 'defender', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_john_ii', from: 'city_bordeaux', route: [p('布尔日图尔', 47.39, 0.69)] }),
    B('evt_2022', '86', 'yinggelan_gen_645', 'attacker', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_gen_651', from: 'city_lundun', city: at('city_rennes', 'gaolu', 'gaolu') }),
    B('evt_2023', '86', 'jacquerie_gen_652', 'attacker', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_gen_653', from: 'city_beauvais', city: at('city_bali', 'gaolu', 'gaolu') }),
    // ── 第 87 棒 ──
    B('evt_2016', '87', 'yuan_d_gen_655', 'defender', 'hansong', 'attacker', { enemyGeneralId: 'hansong_gen_654', from: 'city_beijing', city: at('city_shunchang', 'yuan_d', 'hansong'), route: [p('颍州白鹿庄', 32.89, 115.82), p('罗山上蔡', 33.26, 114.26), p('汝宁府', 33.01, 114.36)] }),
    B('evt_2017', '87', 'yuan_d_tuotuo', 'attacker', 'xuzhou_hongjin', 'attacker', { enemyGeneralId: 'xuzhou_hongjin_gen_656', from: 'city_beijing', city: at('city_pengcheng', 'hansong', 'yuan_d'), route: [p('济宁', 35.42, 116.59)] }),
    B('evt_2019', '87', 'yuan_d_tuotuo', 'attacker', 'zhangshicheng', 'defender', { enemyGeneralId: 'zhangshicheng_zhangshicheng', from: 'city_beijing', city: at('city_yangzhou', 'zhangshicheng', 'zhangshicheng'), route: [p('扬州', 32.39, 119.42)] }),
    B('evt_2020', '87', 'chizhou_changyuchun', 'attacker', 'yuan_d', 'attacker', { enemyGeneralId: 'yuan_d_manzihaiya', from: 'city_qingliuguan', city: at('city_jiuzi', 'yuan_d', 'ming_d'), route: [p('和州针鱼嘴', 31.72, 118.38), p('牛渚采石矶', 31.66, 118.47)] }),
    B('evt_2025', '87', 'huai_zhuyuanzhang', 'defender', 'xushouhui', 'defender', { enemyGeneralId: 'gen_chen_youliang', city: at('city_nanjing', 'ming_d', 'ming_d') }),
    B('evt_2028', '87', 'hongzhou_zhuwenzheng', 'defender', 'xushouhui', 'defender', { enemyGeneralId: 'gen_chen_youliang', city: at('city_hongzhou', 'ming_d', 'ming_d') }),
    B('evt_2029', '87', 'huai_zhuyuanzhang', 'attacker', 'xushouhui', 'attacker', { enemyGeneralId: 'gen_chen_youliang', from: 'city_nanjing', route: [p('湖口', 29.74, 116.22), p('康郎山', 29.18, 116.1), p('泾江口', 29.75, 116.2)] }),
    B('evt_2033', '87', 'xuan_xuda', 'attacker', 'zhangshicheng', 'attacker', { enemyGeneralId: 'zhangshicheng_zhangshicheng', from: 'city_nanjing', city: at('city_gusu', 'zhangshicheng', 'ming_d'), route: [p('湖州嘉兴', 30.75, 120.75)] }),
    B('evt_2034', '87', 'xuan_xuda', 'attacker', 'yuan_d', 'attacker', { enemyGeneralId: 'yuan_d_gen_657', from: 'city_bianliang', city: at('city_beijing', 'yuan_d', 'ming_d'), route: [p('临清德州', 37.45, 116.3), p('通州', 39.91, 116.66)] }),
    B('evt_2035', '87', 'da_yuan_kuokuotiemuer', 'defender', 'ming_d', 'attacker', { enemyGeneralId: 'chizhou_changyuchun', city: at('city_taiyuan', 'yuan_d', 'ming_d') }),
    // ── 第 88 棒 ──
    B('evt_2039', '88', 'da_yuan_kuokuotiemuer', 'defender', 'ming_d', 'defender', { enemyGeneralId: 'xuan_xuda', from: 'city_karakorum', route: [p('雁门', 39.19, 112.87), p('口温', 42.5, 112.8), p('土剌河', 47.91, 106.88), p('岭北和林北原', 47.3, 102.9)] }),
    // ── 第 89 棒 ──
    B('evt_2045', '89', 'gen_dmitry_donskoy', 'attacker', 'jinzhang', 'attacker', { enemyGeneralId: 'jinzhang_gen_658', from: 'city_mosike', route: [p('科洛姆纳', 55.09, 38.78)] }),
    B('evt_2047', '89', 'gen_dmitry_donskoy', 'attacker', 'jinzhang', 'attacker', { enemyGeneralId: 'gen_mamai', from: 'city_mosike', route: [p('科洛姆纳', 55.09, 38.78)] }),
    B('evt_2049', '89', 'jinzhang_tokhtamysh', 'attacker', 'eluosi_diguo', 'attacker', { enemyGeneralId: 'eluosi_diguo_gen_659', from: 'city_salai', city: at('city_mosike', 'eluosi_diguo', 'eluosi_diguo'), route: [p('保加尔渡伏尔加河', 54.98, 49.05), p('谢尔普霍夫', 54.91, 37.41)] }),
    // ── 第 90 棒 ──
    B('evt_2048', '90', 'pingnan_muying', 'attacker', 'yuan_d', 'attacker', { enemyGeneralId: 'yuan_d_gen_660', from: 'city_nanjing', city: at('city_weixian2', 'yuan_d', 'ming_d'), route: [p('辰沅', 28.45, 110.15), p('普定', 26.32, 105.75), p('曲靖白石江', 25.53, 103.81), p('昆明押赤城', 25.04, 102.71)] }),
    B('evt_2056', '90', 'shanrong_lanyu', 'attacker', 'yuan_d', 'attacker', { enemyGeneralId: 'gen_toghus_temur', from: 'city_beijing', route: [p('大宁', 41.6, 119.3), p('庆州', 44.25, 118.98), p('百眼井', 46.8, 117.5)] }),
    B('evt_2068', '90', 'ming_d_zhudi', 'attacker', 'jianwen', 'attacker', { enemyGeneralId: 'gen_li_jinglong', from: 'city_beijing', route: [p('固安', 39.44, 116.3)] }),
    B('evt_2069', '90', 'ming_d_zhudi', 'attacker', 'jianwen', 'defender', { enemyGeneralId: 'jianwen_gen_661', from: 'city_beijing', city: at('city_liaocheng', 'jianwen', 'jianwen'), route: [p('通州临清', 36.84, 115.7)] }),
    B('evt_2070', '90', 'ming_d_zhudi', 'attacker', 'jianwen', 'attacker', { enemyGeneralId: 'jianwen_gen_662', from: 'city_beijing', route: [p('肥河小河', 33.72, 116.9)] }),
    B('evt_2071', '90', 'ming_d_zhudi', 'attacker', 'jianwen', 'attacker', { enemyGeneralId: 'gen_li_jinglong', from: 'city_yangzhou', city: at('city_nanjing', 'jianwen', 'ming_d'), route: [p('瓜洲渡江镇江', 32.21, 119.45)] }),
    // ── 第 91A 棒 ──
    B('evt_2077', '91A', 'ming_d_gen_663', 'attacker', 'dayu_ho', 'attacker', { enemyGeneralId: 'dayu_ho_gen_664', from: 'city_zhennanguan', city: at('city_shenglong', 'dayu_ho', 'ming_d'), route: [p('富良江北岸', 21.15, 105.6), p('多邦城东都昇龙', 21.03, 105.85)] }),
    B('evt_2079', '91A', 'ming_d_gen_665', 'attacker', 'dada_ming', 'attacker', { enemyGeneralId: 'dada_ming_gen_666', from: 'city_beijing', route: [p('宣府', 40.6, 115.05), p('开平', 42.28, 115.76)] }),
    B('evt_2080', '91A', 'ming_d_zhudi', 'attacker', 'dada_ming', 'attacker', { enemyGeneralId: 'dada_ming_gen_666', from: 'city_beijing', route: [p('宣府兴和', 40.91, 114.72), p('胪胸河饮马河', 48.07, 113.52)] }),
    B('evt_2085', '91A', 'ming_d_zhudi', 'attacker', 'oirat_ming', 'attacker', { enemyGeneralId: 'wala_mahamu', from: 'city_beijing', route: [p('宣府兴和', 40.91, 114.72), p('饮马河', 48.07, 113.52)] }),
    B('evt_2093', '91A', 'ming_d_zhudi', 'attacker', 'dada_ming', 'attacker', { enemyGeneralId: 'bfe_alutai', from: 'city_beijing', route: [p('宣府开平', 42.28, 115.76), p('阔滦海呼伦湖', 49.18, 117.95), p('屈裂儿河', 46.85, 120.5)] }),
    // ── 第 91B 棒 ──
    B('evt_2078', '91B', 'liege_gen_667', 'defender', 'bogendigongguo', 'attacker', { enemyGeneralId: 'gen_john_fearless', from: 'city_yachen', route: [p('里尔', 50.63, 3.06), p('马斯特里赫特', 50.85, 5.69)] }),
    B('evt_2081', '91B', 'gen_jogaila', 'attacker', 'tiaodun_qishi', 'attacker', { enemyGeneralId: 'gen_ulrich_jungingen', from: 'city_huasha', route: [p('切尔温斯克渡维斯瓦河', 52.39, 20.31), p('吉尔根堡', 53.43, 20.0)] }),
    B('evt_2086', '91B', 'gen_henry_v', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gen_boucicaut', from: 'city_harfleur', route: [p('索姆河渡口', 49.82, 2.85), p('阿金库尔', 50.46, 2.14), p('加来', 50.96, 1.85)] }),
    B('evt_2088', '91B', 'gen_henry_v', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gaolu_gen_668', from: 'city_winchester', city: at('city_caen', 'gaolu', 'yinggelan'), route: [p('南安普敦', 50.9, -1.4), p('图克河口登陆', 49.36, 0.08)] }),
    B('evt_2089', '91B', 'gen_henry_v', 'attacker', 'gaolu', 'attacker', { enemyGeneralId: 'gaolu_gen_669', from: 'city_caen', city: at('city_rouen', 'gaolu', 'yinggelan'), route: [p('卢维耶', 49.21, 1.17)] }),
    // ── 第 92 棒 ──
    B('evt_2091', '92', 'gen_jan_zizka', 'defender', 'bafaliya', 'defender', { enemyGeneralId: 'bfe_sigismund', city: at('city_bulage', 'hussites', 'hussites') }),
    B('evt_2092', '92', 'gen_jan_zizka', 'defender', 'bafaliya', 'defender', { enemyGeneralId: 'bfe_sigismund', from: 'city_bulage' }),
    B('evt_2105', '92', 'hussites_gen_38', 'defender', 'boximiya', 'attacker', { enemyGeneralId: 'boximiya_gen_670', from: 'city_tabor' }),
    // ── 第 93A 棒 ──
    B('evt_2112', '93A', 'gen_wang_ji', 'attacker', 'luchuan', 'attacker', { enemyGeneralId: 'luchuan_sirenfa', from: 'city_tuodongcheng', city: at('city_mengmao', 'luchuan', 'ming_d'), route: [p('金齿腾冲', 25.02, 98.49), p('上江寨', 24.8, 98.8)] }),
    B('evt_2121', '93A', 'gen_wang_ji', 'attacker', 'luchuan', 'attacker', { enemyGeneralId: 'luchuan_gen_671', from: 'city_tengyuecheng', city: at('city_guikushan', 'luchuan', 'luchuan'), route: [p('金沙江渡口', 25.1, 97.15)] }),
    B('evt_2122', '93A', 'wala_yexian', 'attacker', 'ming_d', 'attacker', { enemyGeneralId: 'gen_wangzhen', from: 'city_saiyinsanda', route: [p('大同', 40.08, 113.3), p('宣府鸡鸣山', 40.46, 115.29)] }),
    B('evt_2123', '93A', 'wala_yexian', 'attacker', 'ming_d', 'defender', { enemyGeneralId: 'yi_yuqian', from: 'city_saiyinsanda', city: at('city_beijing', 'ming_d', 'ming_d'), route: [p('紫荆关', 39.42, 115.17), p('良乡卢沟桥', 39.85, 116.21)] }),
    // ── 第 93B 棒 ──
    B('evt_2113', '93B', 'xiongyati_yannuoshi', 'defender', 'osman', 'defender', { enemyGeneralId: 'osman_gen_672', from: 'city_huneiduolala' }),
    B('evt_2114', '93B', 'xiongyati_yannuoshi', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'osman_gen_673', from: 'city_belgrade', city: at('city_nis', 'osman', 'osman'), route: [p('克鲁舍瓦茨', 43.58, 21.33), p('尼什', 43.32, 21.9), p('兹拉蒂察山口', 42.72, 24.13)] }),
    B('evt_2116', '93B', 'xiongyati_yannuoshi', 'attacker', 'osman', 'defender', { enemyGeneralId: 'osman_gen_674', from: 'city_belgrade', route: [p('尼科波利斯', 43.7, 24.9)] }),
    B('evt_2120', '93B', 'xiongyati_yannuoshi', 'attacker', 'osman', 'defender', { enemyGeneralId: 'osman_gen_674', from: 'city_belgrade', route: [p('克鲁舍瓦茨', 43.58, 21.33)] }),
    B('evt_2127', '93B', 'osman_mehmed_ii', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'gen_constantine_xi', from: 'city_aidiernei', city: at('city_junshitandingbao', 'baizanting', 'osman'), route: [p('鲁米利堡垒', 41.08, 29.06)] }),
    B('evt_2131', '93B', 'osman_mehmed_ii', 'attacker', 'mazhaer', 'defender', { enemyGeneralId: 'xiongyati_yannuoshi', from: 'city_aidiernei', city: at('city_belgrade', 'mazhaer', 'mazhaer'), route: [p('索非亚', 42.7, 23.32)] }),
    B('evt_2133', '93B', 'osman_mehmed_ii', 'attacker', 'baizanting', 'attacker', { enemyGeneralId: 'baizanting_thomas', from: 'city_junshitandingbao', city: at('city_corinth', 'baizanting', 'osman') }),
    B('evt_2137', '93B', 'osman_mehmed_ii', 'defender', 'walajiyia', 'attacker', { enemyGeneralId: 'gen_vlad_impaler', from: 'city_junshitandingbao', route: [p('尼科波利斯渡多瑙河', 43.7, 24.9)] }),
    B('evt_2138', '93B', 'osman_mehmed_ii', 'attacker', 'bosiniya', 'attacker', { enemyGeneralId: 'bosiniya_gen_675', from: 'city_aidiernei', city: at('city_kljuc', 'bosiniya', 'osman'), route: [p('博博瓦茨', 44.12, 18.25), p('亚伊采', 44.34, 17.27)] }),
    B('evt_2141', '93B', 'osman_mehmed_ii', 'attacker', 'lezhe', 'defender', { enemyGeneralId: 'lezhe_gen_676', from: 'city_junshitandingbao', city: at('city_dyrrachium', 'lezhe', 'lezhe') }),
    B('evt_2145', '93B', 'osman_mehmed_ii', 'attacker', 'kelite', 'attacker', { enemyGeneralId: 'kelite_gen_677', from: 'city_junshitandingbao', city: at('city_thebes', 'kelite', 'osman'), route: [p('加里波利', 40.41, 26.67)] }),
    B('evt_2150', '93B', 'bfe_suleiman_pasha', 'attacker', 'moerdaweiya', 'defender', { enemyGeneralId: 'gen_stephen_great', from: 'city_sofia', route: [p('多瑙河渡口', 43.9, 26.0)] }),
    B('evt_2153', '93B', 'osman_mehmed_ii', 'attacker', 'kelite', 'attacker', { enemyGeneralId: 'kelite_gen_678', from: 'city_junshitandingbao', city: at('city_antiwali', 'kelite', 'kelite') }),
    B('evt_2154', '93B', 'osman_gen_679', 'attacker', 'mazhaer', 'defender', { enemyGeneralId: 'bfe_kinizsi', from: 'city_belgrade' }),
    // ── 第 94A 棒 ──
    B('evt_2144', '94A', 'bfe_cb_aq_qoyunlu_1', 'attacker', 'tiemuer', 'attacker', { enemyGeneralId: 'tiemuer_gen_680', from: 'city_dabulishi', route: [p('赫拉特', 34.34, 62.19), p('米亚内', 37.42, 47.71)] }),
    // ── 第 94B 棒 ──
    B('evt_2140', '94B', 'bogendi_chali', 'attacker', 'gaolu', 'draw', { enemyGeneralId: 'gen_louis_xi', from: 'city_lier' }),
    B('evt_2143', '94B', 'bogendi_chali', 'attacker', 'liege', 'attacker', { enemyGeneralId: 'liege_gen_681', from: 'city_bulusaier', city: at('city_yachen', 'liege', 'bogendigongguo'), route: [p('佩罗讷', 49.93, 2.94), p('那慕尔', 50.47, 4.87)] }),
    B('evt_2147', '94B', 'bogendi_chali', 'attacker', 'gaolu', 'defender', { enemyGeneralId: 'gaolu_jeannehachette', from: 'city_lier', city: at('city_beauvais', 'gaolu', 'gaolu'), route: [p('内勒鲁瓦', 49.7, 2.79)] }),
    B('evt_2149', '94B', 'bogendigongguo_gen_683', 'defender', 'ruishi', 'attacker', { enemyGeneralId: 'ruishi_gen_682', from: 'city_dijon', city: at('city_hericourt', 'bogendigongguo', 'ruishi'), route: [p('伯尔尼巴塞尔', 47.55, 7.58), p('波朗特吕', 47.42, 7.08)] }),
    B('evt_2151', '94B', 'bogendi_chali', 'defender', 'ruishi', 'attacker', { enemyGeneralId: 'ruishi_gen_684', from: 'city_geneva', route: [p('洛桑', 46.52, 6.63)] }),
    B('evt_2152', '94B', 'bogendi_chali', 'defender', 'lorraine', 'attacker', { enemyGeneralId: 'lorraine_gen_685', from: 'city_dijon', city: at('city_nancy', 'lorraine', 'lorraine'), route: [p('巴塞尔', 47.55, 7.58), p('圣尼古拉德波尔', 48.63, 6.3)] }),
    // ── 第 95 棒 ──
    B('evt_2148', '95', 'dongshengwei_wangyue', 'attacker', 'dada_ming', 'attacker', { enemyGeneralId: 'gen_beg_arslan', from: 'city_yulin' }),
    B('evt_2527', '95', 'dada_ming_gen_132', 'attacker', 'yongxiebu', 'attacker', { enemyGeneralId: 'yongxiebu_gen_133', from: 'city_kerulen' }),
    B('evt_2528', '95', 'dada_ming_dayanhan', 'attacker', 'oirat_ming', 'attacker', { enemyGeneralId: 'oirat_ming_gen_686', from: 'city_kerulen' }),
    B('evt_2529', '95', 'dada_ming_dayanhan', 'attacker', 'yongxiebu', 'attacker', { enemyGeneralId: 'bfe_yibula', from: 'city_yingchang' }),
    // ── 第 96 棒 ──
    B('evt_2175', '96', 'yilihanguo_yisimeier', 'attacker', 'aq_qoyunlu', 'attacker', { enemyGeneralId: 'aq_qoyunlu_gen_687', from: 'city_erzurum', route: [p('埃尔津詹', 39.75, 39.5), p('沙鲁尔平原', 39.55, 44.98), p('大不里士', 38.08, 46.29)] }),
    B('evt_2184', '96', 'yilihanguo_yisimeier', 'attacker', 'an', 'attacker', { enemyGeneralId: 'an_xibanni', from: 'city_nishabuer', city: at('city_merv', 'an', 'safawei_d'), route: [p('萨拉赫斯', 36.54, 61.16)] }),
    B('evt_2188', '96', 'yilihanguo_yisimeier', 'defender', 'osman', 'attacker', { enemyGeneralId: 'osman_selim', from: 'city_dabulishi', route: [p('伊斯坦布尔', 41.01, 28.97), p('锡瓦斯', 39.75, 37.02), p('埃尔津詹', 39.75, 39.5)] }),
    // ── 第 97 棒 ──
    B('evt_2190', '97', 'osman_selim', 'attacker', 'mamuluke', 'attacker', { enemyGeneralId: 'mamuluke_gen_688', from: 'city_junshitandingbao', city: at('city_alepo', 'mamuluke', 'osman'), route: [p('科尼亚', 37.87, 32.49), p('马拉什', 37.58, 36.93)] }),
    B('evt_2191', '97', 'osman_selim', 'attacker', 'mamuluke', 'attacker', { enemyGeneralId: 'mamuluke_gen_689', from: 'city_damasikusi', city: at('city_mengfeisi', 'mamuluke', 'osman'), route: [p('加沙西奈沙漠', 31.1, 33.8)] }),
    // ── 第 98 棒 ──
    B('evt_2189', '98', 'gen_francis_i', 'attacker', 'milan_duchy', 'attacker', { enemyGeneralId: 'gen_maximilian_sforza', from: 'city_lyon', city: at('city_milan', 'milan_duchy', 'gaolu'), route: [p('阿尔卑斯阿让蒂耶尔山口', 44.42, 6.9), p('都灵帕维亚', 45.19, 9.16)] }),
    B('evt_2198', '98', 'gaolu_gen_691', 'defender', 'habusibao', 'attacker', { enemyGeneralId: 'habusibao_gen_690', from: 'city_turin', route: [p('米兰诺瓦拉', 45.45, 8.62)] }),
    B('evt_2199', '98', 'gen_francis_i', 'defender', 'habusibao', 'attacker', { enemyGeneralId: 'habusibao_gen_692', city: at('city_milan', 'habusibao', 'habusibao') }),
    // ── 第 99 棒 ──
    B('evt_2196', '99', 'gen_suleiman', 'attacker', 'maerta_qishi', 'attacker', { enemyGeneralId: 'maerta_qishi_gen_693', from: 'city_junshitandingbao', city: at('city_rhodes', 'maerta_qishi', 'osman'), route: [p('马尔马里斯', 36.85, 28.27)] }),
    B('evt_2201', '99', 'gen_suleiman', 'attacker', 'mazhaer', 'attacker', { enemyGeneralId: 'gen_lajos_ii', from: 'city_junshitandingbao', route: [p('贝尔格莱德', 44.78, 20.45), p('奥西耶克德拉瓦河桥', 45.56, 18.7)] }),
    B('evt_2204', '99', 'gen_suleiman', 'attacker', 'habusibao', 'defender', { enemyGeneralId: 'habusibao_shouling', from: 'city_junshitandingbao', city: at('city_weiyeena', 'habusibao', 'habusibao'), route: [p('布达', 47.5, 19.04)] }),
    B('evt_2206', '99', 'moerdaweiya_gen_695', 'attacker', 'bolan', 'defender', { enemyGeneralId: 'bolan_gen_696', from: 'city_suceava' }),
    B('evt_2210', '99', 'gen_barbarossa', 'defender', 'kelimiya', 'attacker', { enemyGeneralId: 'gen_andrea_doria', city: at('city_jiataji', 'osman', 'xibanya') }),
    B('evt_2213', '99', 'gen_barbarossa', 'attacker', 'kelimiya', 'attacker', { enemyGeneralId: 'gen_andrea_doria', from: 'city_junshitandingbao', route: [p('科孚岛', 39.62, 19.92)] }),
    B('evt_2216', '99', 'gen_suleiman', 'attacker', 'habusibao', 'attacker', { enemyGeneralId: 'habusibao_gen_697', from: 'city_aidiernei', city: at('city_budapeisi', 'mazhaer', 'osman'), route: [p('贝尔格莱德', 44.78, 20.45)] }),
    // ── 第 100 棒 ──
    B('evt_2223', '100', 'fang_guozhen_fangguozhen', 'attacker', 'haikou', 'attacker', { enemyGeneralId: 'haikou_gen_698', from: 'city_qingyuan_zj', city: at('city_zhoushan', 'haikou', 'ming_d'), route: [p('宁波定海', 29.95, 121.72)] }),
    B('evt_2230', '100', 'qian_d_yudayou', 'attacker', 'haikou', 'attacker', { enemyGeneralId: 'bfe_xu_hai', from: 'city_jiaxing', route: [p('柘林', 30.84, 121.46)] }),
    B('evt_2237', '100', 'qi_d_qijiguang', 'attacker', 'haikou', 'attacker', { enemyGeneralId: 'haikou_shouling', from: 'city_taizhou_zj', route: [p('台州临海', 28.85, 121.14), p('新河花街', 28.86, 121.35)] }),
    B('evt_2240', '100', 'qi_d_qijiguang', 'attacker', 'haikou', 'attacker', { enemyGeneralId: 'haikou_shouling', from: 'city_fuzhou', city: at('city_pinghaiwei', 'haikou', 'ming_d'), route: [p('福清', 25.72, 119.38)] }),
    // ── 第 101 棒 ──
    B('evt_2231', '101', 'aki_maoliyuanjiu', 'attacker', 'ouchi', 'attacker', { enemyGeneralId: 'bfe_sue_harutaka', from: 'city_yoshida', route: [p('吉田郡山', 34.67, 132.71), p('草津地御前', 34.35, 132.33)] }),
    B('evt_2236', '101', 'owari_zhitianxinchang', 'attacker', 'imagawa', 'attacker', { enemyGeneralId: 'jinchuan_jinchuanyiyuan', from: 'city_atsuta', route: [p('热田神宫善照寺砦', 35.08, 136.96)] }),
    B('evt_2238', '101', 'kai_wutianxinxuan', 'defender', 'uesugi', 'draw', { enemyGeneralId: 'echigo_shangshanqianxin', from: 'city_tsutsujigasaki', route: [p('春日山', 37.16, 138.24), p('妻女山', 36.54, 138.15)] }),
    B('evt_2248', '101', 'owari_zhitianxinchang', 'attacker', 'asai', 'attacker', { enemyGeneralId: 'asai_gen_699', from: 'city_kyoto', route: [p('岐阜', 35.43, 136.78)] }),
    B('evt_2251', '101', 'kai_wutianxinxuan', 'attacker', 'tokugawa', 'attacker', { enemyGeneralId: 'edo_dechuanjiakang', from: 'city_tsutsujigasaki', city: at('city_hamamatsu', 'tokugawa', 'tokugawa'), route: [p('二俣城', 34.86, 137.82)] }),
    B('evt_2253', '101', 'owari_zhitianxinchang', 'defender', 'takeda', 'defender', { enemyGeneralId: 'takeda_gen_700', from: 'city_atsuta', route: [p('岐阜冈崎', 34.96, 137.16)] }),
    B('evt_2255', '101', 'oda_gen_701', 'defender', 'uesugi', 'attacker', { enemyGeneralId: 'echigo_shangshanqianxin', from: 'city_kitanosho', route: [p('七尾城', 37.01, 136.98)] }),
    B('evt_2260', '101', 'owari_zhitianxinchang', 'defender', 'akechi', 'attacker', { enemyGeneralId: 'gen_akechi_mitsuhide', city: at('city_kyoto', 'oda', 'akechi') }),
    B('evt_2261', '101', 'hashiba_fengchenxiuji', 'attacker', 'akechi', 'attacker', { enemyGeneralId: 'gen_akechi_mitsuhide', from: 'city_himeji', city: at('city_kyoto', 'oda', 'toyotomi'), route: [p('备中高松', 34.69, 133.82), p('姬路城', 34.84, 134.69)] }),
    B('evt_2263', '101', 'hashiba_fengchenxiuji', 'attacker', 'tokugawa', 'defender', { enemyGeneralId: 'edo_dechuanjiakang', from: 'city_osaka', route: [p('清洲小牧山', 35.29, 136.91)] }),
    B('evt_2269', '101', 'hashiba_fengchenxiuji', 'attacker', 'hojo', 'attacker', { enemyGeneralId: 'hojo_gen_702', from: 'city_kyoto', city: at('city_hakone', 'hojo', 'tokugawa'), route: [p('骏府', 34.98, 138.38), p('箱根山中城', 35.15, 139.0)] }),
    // ── 第 102 棒 ──
    B('evt_2262', '102', 'manzhou_nuerhachi', 'attacker', 'haixi_nvzhen', 'attacker', { enemyGeneralId: 'haixi_nvzhen_gen_703', from: 'city_hetuala', city: at('city_hetuala', 'nikan_wailan', 'manzhou_d') }),
    B('evt_2271', '102', 'sambyeol_lishunchen', 'attacker', 'toyotomi', 'attacker', { enemyGeneralId: 'toyotomi_gen_704', from: 'city_suncheon_k', route: [p('丽水左水营', 34.74, 127.74), p('见乃梁', 34.89, 128.48)] }),
    B('evt_2272', '102', 'ming_d_gen_39', 'attacker', 'bobai_jun', 'attacker', { enemyGeneralId: 'bobai_jun_gen_705', from: 'city_yulin', city: at('city_xingqingfu2', 'bobai_jun', 'ming_d'), route: [p('榆林灵州', 38.07, 106.3)] }),
    B('evt_2273', '102', 'ming_d_gen_39', 'attacker', 'toyotomi', 'attacker', { enemyGeneralId: 'toyotomi_gen_706', from: 'city_liaoyang', city: at('city_pyongyang', 'toyotomi', 'joseon'), route: [p('义州渡鸭绿江', 40.12, 124.39), p('安州', 39.62, 125.66)] }),
    B('evt_2277', '102', 'sambyeol_lishunchen', 'defender', 'toyotomi', 'defender', { enemyGeneralId: 'bfe_todo_takakage', from: 'city_jindo' }),
    B('evt_2278', '102', 'sambyeol_lishunchen', 'attacker', 'shimazu', 'attacker', { enemyGeneralId: 'shimazu_gen_707', from: 'city_jindo', route: [p('古今岛', 34.42, 126.85)] }),
    // ── 第 103 棒 ──
    B('evt_2281', '103', 'edo_dechuanjiakang', 'attacker', 'toyotomi', 'attacker', { enemyGeneralId: 'gen_ishida_mitsunari', from: 'city_edo', route: [p('清洲赤坂', 35.39, 136.58)] }),
    B('evt_2296', '103', 'edo_dechuanjiakang', 'attacker', 'sanada', 'attacker', { enemyGeneralId: 'sanada_d_zhentianxingcun', from: 'city_kyoto', city: at('city_osaka', 'toyotomi', 'tokugawa'), route: [p('河内茶臼山天王寺', 34.65, 135.52)] }),
    // ── 第 104 棒 ──
    B('evt_2300', '104', 'manzhou_nuerhachi', 'defender', 'ming_d', 'defender', { enemyGeneralId: 'gen_yang_hao', from: 'city_hetuala', route: [p('抚顺关', 41.88, 124.08), p('萨尔浒吉林崖', 41.89, 124.24), p('尚间崖', 42.02, 124.3), p('富察阿布达里冈', 41.65, 124.75)] }),
    B('evt_2307', '104', 'manzhou_nuerhachi', 'attacker', 'ming_d', 'defender', { enemyGeneralId: 'zu_d_yuanchonghuan', from: 'city_shenyang', city: at('city_ningyuan', 'ming_d', 'ming_d'), route: [p('锦州右屯', 41.12, 121.15)] }),
    // ── 第 105 棒 ──
    B('evt_2310', '105', 'aisin_d_huangtaiji', 'attacker', 'ming_d', 'defender', { enemyGeneralId: 'zu_d_yuanchonghuan', from: 'city_shenyang', city: at('city_beijing', 'ming_d', 'ming_d'), route: [p('宁远', 40.62, 120.73), p('山海关蓟州', 40.05, 117.4)] }),
    B('evt_2322', '105', 'aisin_d_huangtaiji', 'attacker', 'ming_d', 'attacker', { enemyGeneralId: 'gen_hong_chengchou', from: 'city_shenyang', route: [p('广宁义州', 41.53, 121.24)] }),
    B('evt_2325', '105', 'dashun_lizicheng', 'attacker', 'ming_d', 'attacker', { enemyGeneralId: 'sunqin_sunchuanting', from: 'city_nanyang', city: at('city_tongguan', 'ming_d', 'dashun'), route: [p('襄城汝州', 34.17, 112.84), p('陕州灵宝', 34.58, 110.68), p('潼关', 34.54, 110.25), p('西安', 34.27, 108.93)] }),
    B('evt_2326', '105', 'dashun_lizicheng', 'attacker', 'ming_d', 'attacker', { enemyGeneralId: 'ming_d_gen_708', from: 'city_changan', city: at('city_beijing', 'ming_d', 'manzhou_d'), route: [p('太原大同宣府', 40.6, 115.05), p('居庸关', 40.29, 116.07)] }),
    B('evt_2327', '105', 'dashun_lizicheng', 'attacker', 'manzhou_d', 'defender', { enemyGeneralId: 'manzhou_d_duoergun', from: 'city_beijing', city: at('city_shanhaiguan', 'manzhou_d', 'manzhou_d'), route: [p('盛京沈阳', 41.8, 123.44), p('宁远连山', 40.75, 120.85)] }),
    B('evt_2329', '105', 'manzhou_d_gen_709', 'attacker', 'ming_d', 'attacker', { enemyGeneralId: 'suzhou_d_shikefa', from: 'city_bianliang', city: at('city_yangzhou', 'ming_d', 'manzhou_d'), route: [p('归德泗州', 33.01, 118.54)] }),
    B('evt_2337', '105', 'manzhou_d_gen_710', 'defender', 'longwu', 'attacker', { enemyGeneralId: 'guizhou_lidingguo', city: at('city_lingqu', 'manzhou_d', 'longwu') }),
    B('evt_2338', '105', 'gen_nikan', 'attacker', 'longwu', 'defender', { enemyGeneralId: 'guizhou_lidingguo', from: 'city_beijing', city: at('city_linzheng', 'longwu', 'longwu'), route: [p('长沙湘潭', 27.83, 112.94)] }),
    B('evt_2348', '105', 'ming_zheng_zhengchenggong', 'attacker', 'nidelan', 'attacker', { enemyGeneralId: 'bfe_coyett', from: 'city_penghu', city: at('city_tainan', 'nidelan', 'ming_zheng'), route: [p('厦门金门料罗湾', 24.42, 118.42), p('澎湖', 23.57, 119.57)] }),
    // ── 第 106 棒 ──
    B('evt_2530', '106', 'gesake_khmelnytsky', 'attacker', 'bolan', 'attacker', { enemyGeneralId: 'bfe_potocki', from: 'city_zhapoluore' }),
    B('evt_2531', '106', 'gesake_khmelnytsky', 'attacker', 'bolan', 'attacker', { enemyGeneralId: 'bolan_gen_135', from: 'city_cherkasy' }),
    B('evt_2532', '106', 'gesake_khmelnytsky', 'attacker', 'bolan', 'attacker', { enemyGeneralId: 'bolan_gen_138', from: 'city_jifu', route: [p('卢布林索卡利', 50.48, 24.28)] }),
    B('evt_2533', '106', 'gesake_khmelnytsky', 'defender', 'bolan', 'attacker', { enemyGeneralId: 'bolan_gen_138', from: 'city_zhapoluore', route: [p('索卡利', 50.48, 24.28)] }),
    // ── 第 107 棒 ──
    B('evt_2340', '107', 'gaolu_gen_40', 'attacker', 'xibanya', 'attacker', { enemyGeneralId: 'xibanya_gen_711', from: 'city_bali', city: at('city_lier', 'gaolu', 'gaolu'), route: [p('佩罗讷', 49.93, 2.94)] }),
    B('evt_2344', '107', 'gaolu_gen_40', 'attacker', 'xibanya', 'attacker', { enemyGeneralId: 'xibanya_gen_712', from: 'city_calais', city: at('city_calais', 'xibanya', 'yinggelan'), route: [p('伊普尔马尔迪克', 51.0, 2.24)] }),
    B('evt_2350', '107', 'habusibao_gen_41', 'defender', 'osman', 'defender', { enemyGeneralId: 'osman_gen_713', from: 'city_weiyeena', route: [p('卡尼扎', 46.45, 16.99)] }),
    // ── 第 108 棒 ──
    B('evt_2359', '108', 'bolan_suobiesiji', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'osman_gen_714', from: 'city_liweifu', city: at('city_khotyn', 'osman', 'bolan') }),
    B('evt_2361', '108', 'asikanani_gen_715', 'attacker', 'ruidian_si', 'attacker', { enemyGeneralId: 'ruidian_si_gen_716', from: 'city_magedebao', route: [p('拉特诺', 52.6, 12.33)] }),
    B('evt_2369', '108', 'bolan_suobiesiji', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'gen_kara_mustafa', from: 'city_kelakefu', city: at('city_weiyeena', 'habusibao', 'habusibao'), route: [p('图尔恩渡多瑙河', 48.33, 16.05)] }),
    B('evt_2373', '108', 'habusibao_gen_718', 'defender', 'osman', 'defender', { enemyGeneralId: 'osman_gen_717', from: 'city_budapeisi', route: [p('奥西耶克', 45.56, 18.7)] }),
    B('evt_2374', '108', 'bafaliya_gen_719', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'osman_gen_720', from: 'city_budapeisi', city: at('city_belgrade', 'osman', 'habusibao'), route: [p('彼得罗瓦拉丁', 45.25, 19.86)] }),
    B('evt_2377', '108', 'habusibao_gen_721', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'osman_gen_722', from: 'city_budapeisi', route: [p('彼得罗瓦拉丁', 45.25, 19.86)] }),
    B('evt_2383', '108', 'habusibao_eugene', 'attacker', 'osman', 'attacker', { enemyGeneralId: 'bfe_mustafa_ii', from: 'city_budapeisi', route: [p('彼得罗瓦拉丁', 45.25, 19.86)] }),
    B('evt_2384', '108', 'bolan_gen_724', 'defender', 'kelimiya_han', 'defender', { enemyGeneralId: 'kelimiya_han_gen_723', from: 'city_liweifu' }),
    // ── 第 109 棒 ──
    B('evt_2372', '109', 'manzhou_d_sabusu', 'attacker', 'eluosi_diguo', 'attacker', { enemyGeneralId: 'eluosi_diguo_gen_725', from: 'city_bukui', city: at('city_yakesa', 'eluosi_diguo', 'eluosi_diguo'), route: [p('瑷珲', 50.25, 127.48)] }),
    B('evt_2376', '109', 'bfe_fuquan', 'attacker', 'zhunge', 'attacker', { enemyGeneralId: 'oirat_ming_gaerdan', from: 'city_beijing', route: [p('古北口', 40.69, 117.16)] }),
    B('evt_2382', '109', 'manzhou_d_gen_726', 'attacker', 'zhunge', 'attacker', { enemyGeneralId: 'oirat_ming_gaerdan', from: 'city_guihua', route: [p('翁金河', 45.8, 104.2)] }),
    // ── 第 110 棒 ──
    B('evt_2406', '110', 'bfe_tsering_dondub', 'attacker', 'khoshut', 'attacker', { enemyGeneralId: 'khoshut_lhasang', from: 'city_yili', city: at('city_luoxie', 'khoshut', 'oirat_ming'), route: [p('和阗', 37.11, 79.92), p('昆仑腾格里海纳木错', 30.72, 90.65)] }),
    B('evt_2408', '110', 'qinghai_yuezhongqi', 'attacker', 'zhunge', 'attacker', { enemyGeneralId: 'bfe_tsering_dondub', from: 'city_chengdu', city: at('city_jiamachikang', 'zhunge', 'manzhou_d'), route: [p('成都打箭炉', 30.05, 101.96), p('里塘察木多', 31.14, 97.17), p('墨竹工卡拉萨', 29.66, 91.12)] }),
    B('evt_2410', '110', 'qinghai_yuezhongqi', 'attacker', 'khoshut', 'attacker', { enemyGeneralId: 'gen_lobsang_danjin', from: 'city_qingtang', route: [p('日月山青海湖', 36.68, 100.85)] }),
    // ── 第 111 棒 ──
    B('evt_2412', '111', 'gen_furdan', 'defender', 'zhunge', 'attacker', { enemyGeneralId: 'dzungar_galedanceling', from: 'city_kobdo' }),
    B('evt_2413', '111', 'wuli_d_celeng', 'defender', 'zhunge', 'defender', { enemyGeneralId: 'bfe_xiaoceling', from: 'city_zhabuhanjuntai', route: [p('塔米尔河', 47.6, 101.8)] }),
    // ── 第 112 棒 ──
    B('evt_2431', '112', 'huite_amuersana', 'attacker', 'zhunge', 'attacker', { enemyGeneralId: 'zhunge_gen_727', from: 'city_kobdo', route: [p('巴里坤乌鲁木齐', 43.82, 87.62), p('博罗塔拉伊犁', 43.92, 81.32)] }),
    B('evt_2437', '112', 'agui', 'attacker', 'khoja', 'attacker', { enemyGeneralId: 'khoja_gen_728', from: 'city_kungang', city: at('city_shache', 'khoja', 'manzhou_d'), route: [p('阿克苏', 41.17, 80.26)] }),
    // ── 第 113 棒 ──
    B('evt_2433', '113', 'konbaung_yongjiya', 'attacker', 'restored_hanthawaddy', 'attacker', { enemyGeneralId: 'gen_binnya_dala', from: 'city_shwebo', city: at('city_bago', 'restored_hanthawaddy', 'konbaung'), route: [p('大光仰光', 16.8, 96.15), p('丁因', 16.77, 96.25)] }),
    B('evt_2443', '113', 'siam_zhengxin', 'attacker', 'konbaung', 'attacker', { enemyGeneralId: 'konbaung_gen_729', from: 'city_chanthaburi', city: at('city_ayutthaya', 'konbaung', 'thonburi'), route: [p('吞武里', 13.68, 100.53)] }),
    B('evt_2444', '113', 'gen_mingrui', 'defender', 'konbaung', 'attacker', { enemyGeneralId: 'gen_maha_thiha_thura', from: 'city_tengyuecheng', route: [p('宛顶木邦', 22.86, 97.75), p('天生桥蛮结', 22.4, 96.8)] }),
    B('evt_2446', '113', 'agui', 'attacker', 'konbaung', 'draw', { enemyGeneralId: 'gen_maha_thiha_thura', from: 'city_tengyuecheng', city: at('city_kaungton', 'konbaung', 'konbaung'), route: [p('腾越野牛坝', 25.05, 97.6), p('新街八莫', 24.25, 97.23)] }),
    // ── 第 114A 棒 ──
    B('evt_2448', '114A', 'tuerhute_wobaxi', 'attacker', 'eluosi_diguo', 'attacker', { enemyGeneralId: 'eluosi_diguo_gen_730', from: 'city_yingsuochuan', route: [p('乌拉尔河东岸', 50.5, 51.8), p('奥尔斯克山口', 51.2, 58.56), p('琴吉斯山巴尔喀什湖', 46.22, 75.42), p('伊犁', 43.92, 81.32)] }),
    // ── 第 114B 棒 ──
    B('evt_2451', '114B', 'agui', 'attacker', 'jinchuan_g', 'attacker', { enemyGeneralId: 'bfe_sonom', from: 'city_chengdu', city: at('city_leweizhai', 'jinchuan_g', 'manzhou_d'), route: [p('成都汶川', 31.48, 103.59), p('美诺勒乌围', 31.65, 102.08)] }),
    B('evt_2456', '114B', 'xingan_hailancha', 'attacker', 'shuntian', 'attacker', { enemyGeneralId: 'shuntian_linshuangwen', from: 'city_fuzhou', city: at('city_zhuluo', 'manzhou_d', 'manzhou_d'), route: [p('泉州崇武鹿仔港', 24.05, 120.43), p('牛稠山诸罗', 23.48, 120.45), p('大里杙集集埔', 23.83, 120.78)] }),
    B('evt_2459', '114B', 'xingan_hailancha', 'attacker', 'gurkha', 'attacker', { enemyGeneralId: 'gurkha_baduersaye', from: 'city_luoxie', city: at('city_kathmandu', 'gurkha', 'gurkha'), route: [p('拉萨日喀则', 29.27, 88.88), p('济咙热索桥', 28.4, 85.32)] }),
    // ── 第 115A 棒 ──
    B('evt_2464', '115A', 'gelujiya_erekle_ii', 'defender', 'qiajia', 'attacker', { enemyGeneralId: 'bfe_agha_mohammad', city: at('city_dibilisi', 'gelujiya', 'gelujiya') }),
    // ── 第 115B 棒 ──
    B('evt_2471', '115B', 'nguyen_guangnan_ruanfuying', 'attacker', 'xishan', 'attacker', { enemyGeneralId: 'yuenan_ruanguangzuan', from: 'city_giadinh', city: at('city_fuchun', 'xishan', 'yuenan'), route: [p('归仁施耐海口', 13.77, 109.24)] }),
    // ── 第 116 棒 ──
    B('evt_2487', '116', 'xike_lanjite', 'attacker', 'dulan_d', 'attacker', { enemyGeneralId: 'dulan_muzaffarkhan', from: 'city_laheer', city: at('city_malisi', 'dulan_d', 'xike') }),
    B('evt_2491', '116', 'pangzha_halixinge', 'attacker', 'dulan_d', 'attacker', { enemyGeneralId: 'dulan_azimuhan', from: 'city_atuoke', city: at('city_baishawa', 'barakzai_afghan', 'xike'), route: [p('拉合尔阿托克', 33.89, 72.24), p('喀布尔河瑙谢拉', 34.02, 72.0), p('白沙瓦', 34.01, 71.58)] }),
    B('evt_2499', '116', 'xike_gen_732', 'defender', 'buliedian', 'attacker', { enemyGeneralId: 'buliedian_gen_731', from: 'city_laheer' }),
    // ── 第 117 棒 ──
    B('evt_2502', '117', 'taiping_yangxiuqing', 'attacker', 'manzhou_d', 'attacker', { enemyGeneralId: 'manzhou_d_gen_733', from: 'city_changsha', city: at('city_wuchang', 'manzhou_d', 'manzhou_d'), route: [p('岳州', 29.37, 113.09), p('汉阳汉口', 30.55, 114.27), p('武昌文昌门', 30.55, 114.31), p('九江安庆江宁', 32.05, 118.77)] }),
    B('evt_2505', '117', 'taiping_shidakai', 'attacker', 'manzhou_d', 'attacker', { enemyGeneralId: 'gen_zengguofan', from: 'city_chaisang', route: [p('田家镇', 29.9, 115.42)] }),
    B('evt_2509', '117', 'taiping_gen_734', 'attacker', 'manzhou_d', 'attacker', { enemyGeneralId: 'manzhou_d_gen_735', from: 'city_wancheng', route: [p('六安庐州', 31.86, 117.28)] }),
    B('evt_2513', '117', 'bfe_zengguoquan', 'attacker', 'taiping', 'attacker', { enemyGeneralId: 'taiping_gen_736', from: 'city_chaisang', city: at('city_wancheng', 'taiping', 'manzhou_d'), route: [p('宿松太湖', 30.45, 116.3)] }),
    B('evt_2517', '117', 'bfe_zengguoquan', 'attacker', 'taiping', 'attacker', { enemyGeneralId: 'gen_li_xiucheng', from: 'city_wancheng', city: at('city_nanjing', 'taiping', 'manzhou_d'), route: [p('芜湖雨花台', 31.99, 118.78)] }),
];
