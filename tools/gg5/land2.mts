/**
 * GG 第五轮 第二批落地（2026-11-11）—— 补 CC 未完成部分：
 *   A. 删除 GG 判「不合格」的 kawusi（卡乌斯）势力，海达尔改挂新建「布哈拉」
 *   B. 为 21 位库内无政权的武将新建历史上公认的政权（含古蜀、夏威夷王国）
 *   C. 改挂这些武将 + 精锐番号跟着政权改
 *
 * 只做数据，不动据点文化。默认 dry-run；加 --write 才落盘。
 * 跑法：npx tsx tools/gg5/land2.mts [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const NL = '\r\n';

function load(p: string): string[] { return readFileSync(p, 'utf8').split(NL); }
function save(p: string, lines: string[]) { if (WRITE) writeFileSync(p, lines.join(NL), 'utf8'); }
function idxOf(lines: string[], re: RegExp, from = 0): number {
    for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
    return -1;
}
const log: string[] = [];
const P = (s: string) => { log.push(s); console.log(s); };

// ─────────── 新政权表 ───────────
type NewFaction = {
    id: string; name: string; flag: string; color: string; capital: string;
    start: number; end: number; source: string; note: string;
    era: string; comment: string;
};

const NEW: NewFaction[] = [
    {
        id: 'wu_han', name: '吴', flag: '吴', color: '#7A4B2A', capital: 'city_yangzhou',
        start: -195, end: -154,
        source: '《史记·吴王濞列传》：高祖十二年（前195）刘濞封吴王，都广陵；景帝三年（前154）吴楚七国之乱败，濞死国除',
        note: '汉初同姓诸侯国吴国（荆王刘贾故地），与前 585 年寿梦之吴不同一国；刘濞据广陵（今扬州）',
        era: 'antiquity', comment: '汉初吴国（刘濞，前195–前154，都广陵）',
    },
    {
        id: 'qi_zhangbu', name: '齐', flag: '齐', color: '#4E6E58', capital: 'city_linzi',
        start: 23, end: 29,
        source: '《后汉书·张步传》：更始二年（24）张步据临淄自立为齐王，建武五年（29）为耿弇所破，降而复叛被斩',
        note: '新末东汉初临淄割据政权（齐王张步），与先秦姜齐、田齐不同一国；起讫取 GG 核定 23–29',
        era: 'antiquity', comment: '张步齐（临淄割据，23–29）',
    },
    {
        id: 'wangdaer', name: '汪达尔王国', flag: '汪达', color: '#3F6E8C', capital: 'city_jiataji',
        start: 439, end: 534,
        source: 'Wikipedia「Vandal Kingdom」：439 年盖萨里克取迦太基立国，534 年贝利撒留灭之（汪达尔战争）',
        note: '日耳曼汪达尔—阿兰王国，都迦太基；与古典腓尼基迦太基（buni）不同政权',
        era: 'feudal', comment: '汪达尔—阿兰王国（439 迦太基–534 拜占庭灭）',
    },
    {
        id: 'kesaiya', name: '科塞亚', flag: '科塞', color: '#6E5B3F', capital: 'city_hamadan',
        start: -360, end: -300,
        source: '阿里安《亚历山大远征记》卷七、Wikipedia「Kissia」：科塞亚人（Kossaîoi）居扎格罗斯山，前 324/323 年反抗马其顿',
        note: '扎格罗斯山科塞亚部族（民族势力），非前 550 已亡之米底王国；起讫按部族活动期估定',
        era: 'antiquity', comment: '科塞亚部族（扎格罗斯山，前4世纪抗亚历山大）',
    },
    {
        id: 'muxikani', name: '穆西卡尼', flag: '穆西', color: '#8C6A2F', capital: 'city_aluoer',
        start: -350, end: -300,
        source: '阿里安《亚历山大远征记》卷六：印度河下游穆西卡尼人（Mousikanoí）王穆西卡诺斯，前 325 年抗亚历山大',
        note: '印度河下游部族（民族势力），早于前 322 年孔雀建国；起讫按部族活动期估定',
        era: 'antiquity', comment: '穆西卡尼部族（印度河下游，前4世纪）',
    },
    {
        id: 'houmojietuo', name: '摩揭陀（普那伐摩）', flag: '摩揭', color: '#9C5B2E', capital: 'city_putijiaye',
        start: 590, end: 640,
        source: '《大唐西域记》卷八、Wikipedia「Pūrṇavarman」：7 世纪初摩揭陀王普那伐摩（Pūrṇavarman），玄奘游印时其国已衰',
        note: '孔雀（前322–前185）之后七百年的摩揭陀政权，同国号另立一家；起讫按普那伐摩在位估定',
        era: 'feudal', comment: '摩揭陀·普那伐摩（7世纪初）',
    },
    {
        id: 'sumo', name: '苏摩国', flag: '苏摩', color: '#5F7A2F', capital: 'city_danmoledi',
        start: -600, end: -400,
        source: 'Wikipedia「Suhma kingdom」、《摩诃婆罗多》与往世书：孟加拉 Suhma 国，前 6 世纪苏摩王',
        note: '孟加拉古国，早于前 185 年巽伽王朝；起讫按史源系年估定',
        era: 'antiquity', comment: '苏摩国（孟加拉 Suhma，前6世纪）',
    },
    {
        id: 'gushu', name: '古蜀', flag: '蜀', color: '#2F6B6B', capital: 'city_chengdu',
        start: -400, end: -316,
        source: '《华阳国志·蜀志》：开明王朝十二世，前 316 年秦惠文王遣张仪、司马错灭蜀（末王芦子，即开明氏末主）',
        note: '开明王朝古蜀国，都成都；与三国蜀汉（184–263）不同政权，同国号另立一家',
        era: 'antiquity', comment: '古蜀·开明王朝（前4世纪–前316 秦灭）',
    },
    {
        id: 'yidali_odoacer', name: '意大利（奥多亚克）', flag: '意', color: '#7A2F2F', capital: 'city_ravenna',
        start: 476, end: 493,
        source: 'Wikipedia「Odoacer」：476 年奥多亚克废罗慕路斯·奥古斯都，据意大利以拉文纳为治；493 年为狄奥多里克所杀',
        note: '奥多亚克意大利王国（476–493），都拉文纳；与 1861 年意大利王国不同一国',
        era: 'feudal', comment: '奥多亚克意大利王国（476–493，都拉文纳）',
    },
    {
        id: 'gaoda', name: '高达王国', flag: '高达', color: '#8C4A6E', capital: 'city_gaodacheng',
        start: 590, end: 626,
        source: '《大唐西域记》、Wikipedia「Gauḍa kingdom」「Shashanka」：设赏迦（Śaśāṅka）约 590–626 王孟加拉高达',
        note: '孟加拉高达王国，早于 750 年瞿波罗所建波罗王朝',
        era: 'feudal', comment: '高达王国（设赏迦，约590–626）',
    },
    {
        id: 'kelite_amier', name: '克里特埃米尔国', flag: '克特', color: '#3F5E7A', capital: 'city_kailuwan',
        start: 824, end: 961,
        source: 'Wikipedia「Emirate of Crete」：约 824 年安达卢斯流亡者据克里特立国，961 年尼基弗鲁斯·福卡斯收复',
        note: '地中海克里特埃米尔国；库内无干地亚独立据点（干地亚属威尼斯），首都仅登记用',
        era: 'feudal', comment: '克里特埃米尔国（约824–961）',
    },
    {
        id: 'kelimiya', name: '克里米亚汗国', flag: '克米', color: '#5B4E7A', capital: 'city_oleshky',
        start: 1441, end: 1783,
        source: 'Wikipedia「Crimean Khanate」：1441 年哈吉·格莱立国（巴赫奇萨赖为都），1783 年为俄国兼并',
        note: '克里米亚鞑靼汗国；库内无巴赫奇萨赖据点，首都取最近同文化据点奥列什基',
        era: 'imperial', comment: '克里米亚汗国（1441–1783）',
    },
    {
        id: 'guzigan', name: '古兹甘', flag: '古兹', color: '#4A6E4A', capital: 'city_fariyab',
        start: 800, end: 1010,
        source: 'Wikipedia「Farighunids」「Guzgan」：9–11 世纪初阿富汗北部古兹甘法里贡王朝（法里亚布），后为伽色尼所并',
        note: '古兹甘法里贡王朝，非 962 年始之伽色尼王朝；起讫按王朝世系估定',
        era: 'feudal', comment: '古兹甘·法里贡王朝（9–11世纪初）',
    },
    {
        id: 'bahemani', name: '巴赫曼尼苏丹国', flag: '巴赫', color: '#7A5F2F', capital: 'city_taibade',
        start: 1347, end: 1527,
        source: 'Wikipedia「Bahmani Sultanate」：1347 年哈桑·甘古（阿拉乌丁·巴赫曼沙）据德干立国，1527 年为五国分裂所终',
        note: '德干巴赫曼尼苏丹国，都古尔伯加后迁比达尔；马哈茂德·加万为其首相',
        era: 'castle', comment: '巴赫曼尼苏丹国（德干，1347–1527）',
    },
    {
        id: 'halapengcai', name: '哈利奔猜王国', flag: '哈利', color: '#6E3F5E', capital: 'city_thaton',
        start: 750, end: 1292,
        source: 'Wikipedia「Hariphunchai」：约 750 年占玛黛维立孟族女王国（今南奔），1292 年为兰纳孟莱王所并',
        note: '泰北孟族哈利奔猜王国；库内无南奔据点，首都取同文化孟族据点直通',
        era: 'feudal', comment: '哈利奔猜王国（泰北孟族，约750–1292）',
    },
    {
        id: 'dongchahatai', name: '东察合台汗国', flag: '察合', color: '#2F5F8C', capital: 'city_ahexikesi',
        start: 1347, end: 1680,
        source: 'Wikipedia「Moghulistan」：1347 年秃黑鲁帖木儿复立察合台汗国于伊犁—喀什（东察合台），1680 年为准噶尔所并',
        note: '东察合台汗国（蒙兀儿斯坦），与莫卧儿帝国（1469–1857）不同政权',
        era: 'imperial', comment: '东察合台汗国（蒙兀儿斯坦，1347–1680）',
    },
    {
        id: 'buhala', name: '布哈拉', flag: '布哈', color: '#8C5F4A', capital: 'city_jizhake',
        start: 1785, end: 1920,
        source: 'Wikipedia「Emirate of Bukhara」：1785 年曼吉特部沙赫穆拉德取布哈拉立埃米尔国，1920 年为苏俄所灭',
        note: '曼吉特王朝布哈拉埃米尔国；吉扎克为其东境重镇（原 kawusi 据点归此）',
        era: 'imperial', comment: '布哈拉埃米尔国（曼吉特，1785–1920）',
    },
    {
        id: 'biluzhi', name: '俾路支', flag: '俾路', color: '#4A5F2F', capital: 'city_kuida',
        start: 1480, end: 1533,
        source: 'Wikipedia「Chakar Rind」「Baloch people」：林德（Rind）部落联盟米尔·恰卡尔 1480–1533 据俾路支—信德',
        note: '俾路支林德部落联盟（民族势力），早于 1747 年杜兰尼帝国；起讫按恰卡尔生卒与在位估定',
        era: 'imperial', comment: '俾路支·林德部落联盟（1480–1533）',
    },
    {
        id: 'bonape', name: '波纳佩', flag: '波纳', color: '#2F7A5F', capital: 'city_nanmadol',
        start: 1200, end: 1628,
        source: 'Wikipedia「Nan Madol」「Saudelor」：约 1200 年绍德勒王朝筑南马都尔（波纳佩岛），1628 年前后终',
        note: '密克罗尼西亚波纳佩绍德勒王朝，与大溪地波马雷王朝（bolinixiya）不同政权',
        era: 'castle', comment: '波纳佩·绍德勒王朝（南马都尔，约1200–1628）',
    },
    {
        id: 'xiaweiyi', name: '夏威夷王国', flag: '夏威', color: '#6A5F8C', capital: 'city_honolulu',
        start: 1795, end: 1893,
        source: 'Wikipedia「Kingdom of Hawaii」：1795 年卡美哈梅哈一世统一群岛建王国，1893 年王政被推翻',
        note: '夏威夷王国，都檀香山；与大溪地波马雷王朝不同政权',
        era: 'imperial', comment: '夏威夷王国（1795–1893）',
    },
    {
        id: 'yidali_hre', name: '意大利（神圣罗马）', flag: '意', color: '#8C7A2F', capital: 'city_milan',
        start: 962, end: 1801,
        source: 'Wikipedia「Kingdom of Italy (Holy Roman Empire)」：962 年奥托一世加冕后意大利王国为帝国附庸，1801 年《吕内维尔和约》后废止',
        note: '神圣罗马帝国治下的意大利王国（regnum Italiae），比安德拉泰伯爵等帝国封臣归此；与 1861 年意大利王国不同一国',
        era: 'castle', comment: '意大利王国（神圣罗马，962–1801）',
    },
];

// ─────────── 武将改挂表（generalId → 新势力 / 新精锐番号）───────────
const REMAP: { gid: string; to: string; elite?: string }[] = [
    { gid: 'bfe3_28', to: 'wu_han' },
    { gid: 'bfe3_58', to: 'qi_zhangbu' },
    { gid: 'wangdaer_gaisalike', to: 'wangdaer' },
    { gid: 'kesaiya_kashtiliash', to: 'kesaiya' },
    { gid: 'bfe2_enlil_nadin_ahi', to: 'jiaxite', elite: '加喜特步兵' },
    { gid: 'muxikani_muxikanuosi', to: 'muxikani', elite: '穆西卡尼战团' },
    { gid: 'jiaye_punafamo', to: 'houmojietuo', elite: '摩揭陀象兵' },
    { gid: 'sumo_sumowang', to: 'sumo', elite: '苏摩国象兵' },
    { gid: 'bfe3_2', to: 'gushu', elite: '开明王朝武士' },
    { gid: 'rierman_odoacer', to: 'yidali_odoacer' },
    { gid: 'gen_shashanka', to: 'gaoda' },
    { gid: 'bfe_abdulaziz_crete', to: 'kelite_amier' },
    { gid: 'gen_haci_giray', to: 'kelimiya', elite: '克里米亚骑兵' },
    { gid: 'guzgan_abuhalisi', to: 'guzigan', elite: '古兹甘步兵' },
    { gid: 'baha_gaiwamu', to: 'bahemani', elite: '巴赫曼尼卫队' },
    { gid: 'bfe_albert_lombard', to: 'yidali_hre', elite: '铁王冠卫' },
    { gid: 'halapeng_yiba', to: 'halapengcai', elite: '哈利奔猜象兵' },
    { gid: 'gen_qutlugh', to: 'dongchahatai', elite: '察合台骑兵' },
    { gid: 'kawusi_haidaer', to: 'buhala', elite: '布哈拉骑兵' },
    { gid: 'kuida_chakar', to: 'biluzhi', elite: '林德部落战士' },
    { gid: 'bolinixiya_isokelekel', to: 'bonape' },
    { gid: 'bolinixiya_kameihameiha', to: 'xiaweiyi' },
];

// ─────────── A. 删 kawusi ───────────
P('## A. 删除 kawusi（GG 判不合格：以人名命名 + 年代错配）');
{
    const p = 'src/data/factions.ts';
    const L = load(p); const i = idxOf(L, /^\s*\{ id: 'kawusi', name: '卡乌斯' \},/);
    if (i < 0) P(`  [skip] ${p} 未找到 kawusi`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/FactionEra.ts';
    const L = load(p); const i = idxOf(L, /^\s*'kawusi': \[/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/FactionLifeYears.ts';
    const L = load(p); const i = idxOf(L, /^\s*kawusi: \{ start: 1700, end: 1800/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/HistoricalFactionColors.ts';
    const L = load(p); const i = idxOf(L, /^\s*'?kawusi'?:/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/SandboxDisplayNames.ts';
    const L = load(p); const i = idxOf(L, /^\s*'?kawusi'?:/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/assets/CityAssetManager.ts';
    const L = load(p); const i = idxOf(L, /^\s*'kawusi':/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/StartingCapitals.ts';
    const L = load(p); const i = idxOf(L, /^\s*'kawusi':/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/config/portrait_defaults.ts';
    const L = load(p); const i = idxOf(L, /^\s*'kawusi': _zhongyaPortraitPool,/);
    if (i < 0) P(`  [skip] ${p}`); else { L.splice(i, 1); save(p, L); P(`  - ${p}: 删 1 行（${i + 1}）`); }
}
{
    const p = 'src/data/FactionCompositions.ts';
    const L = load(p); const i = idxOf(L, /^\s*"kawusi": \{/);
    if (i < 0) P(`  [skip] ${p}`);
    else {
        let j = i + 1; while (j < L.length && !/^\s*\},?\s*$/.test(L[j])) j++;
        L.splice(i, j - i + 1); save(p, L); P(`  - ${p}: 删 ${j - i + 1} 行（${i + 1}–${j + 1}）`);
    }
}
{
    const p = 'src/data/cities_v2.ts';
    const L = load(p); const i = idxOf(L, /id: 'city_jizhake'.*factionId: 'kawusi'/);
    if (i < 0) P(`  [skip] ${p}`);
    else { L[i] = L[i].replace("factionId: 'kawusi'", "factionId: 'buhala'"); save(p, L); P(`  - ${p}: 吉扎克城归属 kawusi → buhala（${i + 1}）`); }
}

// ─────────── B. 注册新政权 ───────────
P('\n## B. 注册新政权（' + NEW.length + ' 家）');
{
    const p = 'src/data/factions.ts';
    const L = load(p);
    const anchor = idxOf(L, /^\];\s*$/, L.findIndex(l => /wagadu/.test(l)));
    if (anchor < 0) throw new Error('factions.ts 未找到 FACTIONS 结束行');
    const ins = NEW.map(f => `  { id: '${f.id}', name: '${f.name}' },   // 🔴 [2026-11-11 GG第五轮·武将缺政权新建公认政权] ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行（插在 ${anchor + 1} 行前）`);
}
{
    const p = 'src/data/FactionLifeYears.ts';
    const L = load(p);
    const anchor = idxOf(L, /^\};\s*$/);
    if (anchor < 0) throw new Error('FactionLifeYears 未找到结束');
    const ins = NEW.map(f => `    ${f.id}: { start: ${f.start}, end: ${f.end}, source: '${f.source}', note: '${f.note}' },`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行`);
}
{
    const p = 'src/data/FactionEra.ts';
    const L = load(p);
    const anchor = idxOf(L, /二、单时代势力/);
    if (anchor < 0) throw new Error('FactionEra 未找到分区注释');
    const ins = NEW.map(f => `    '${f.id}': [{ from: -9999, era: '${f.era}' }], // ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行（插在 ${anchor + 1} 行前）`);
}
{
    const p = 'src/data/SandboxDisplayNames.ts';
    const L = load(p);
    const anchor = idxOf(L, /^\};\s*$/);
    if (anchor < 0) throw new Error('SandboxDisplayNames 未找到结束');
    const ins = NEW.map(f => `  ${f.id}: '${f.flag}',  // ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行`);
}
{
    const p = 'src/assets/CityAssetManager.ts';
    const L = load(p);
    const start = idxOf(L, /factionFlagMap/);
    const anchor = idxOf(L, /^\s*\};\s*$/, start);
    if (anchor < 0) throw new Error('CityAssetManager 未找到 factionFlagMap 结束');
    const ins = NEW.map(f => `        '${f.id}': '${f.flag}',   // ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行（插在 ${anchor + 1} 行前）`);
}
{
    const p = 'src/data/HistoricalFactionColors.ts';
    const L = load(p);
    const anchor = idxOf(L, /^\};\s*$/);
    if (anchor < 0) throw new Error('HistoricalFactionColors 未找到结束');
    const ins = NEW.map(f => `    ${f.id}: '${f.color}', // ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行`);
}
{
    const p = 'src/data/StartingCapitals.ts';
    const L = load(p);
    const anchor = idxOf(L, /^\};\s*$/);
    if (anchor < 0) throw new Error('StartingCapitals 未找到结束');
    const ins = NEW.map(f => `  '${f.id}': '${f.capital}',   // ${f.comment}`);
    L.splice(anchor, 0, ...ins); save(p, L); P(`  - ${p}: +${ins.length} 行`);
}

// ─────────── C. 武将改挂 ───────────
P('\n## C. 武将改挂 + 精锐番号（' + REMAP.length + ' 位）');
{
    const p = 'src/data/FactionGenerals.ts';
    const L = load(p);
    const done: string[] = []; const miss: string[] = [];
    for (const r of REMAP) {
        const re = new RegExp(`^(\\s*)\\{ generalId: '${r.gid}',`);
        let i = L.findIndex(l => re.test(l));
        if (i < 0) {
            // 单条格式：块键就是势力 id（kawusi: { generalId: ... }）
            const re2 = new RegExp(`^(\\s*)([a-z0-9_]+): \\{ generalId: '${r.gid}',`);
            i = L.findIndex(l => re2.test(l));
            if (i >= 0) {
                const ind = L[i].match(re2)![1];
                let line = L[i].replace(re2, `$1{ generalId: '${r.gid}', factionId: '${r.to}',`);
                if (r.elite) line = line.replace(/eliteName: '[^']*'/, `eliteName: '${r.elite}'`);
                L.splice(i, 1, `${ind}${r.to}: [`, `${ind}    ${line.trim()}`, `${ind}],`);
                done.push(r.gid);
                continue;
            }
            // 多行格式：generalId 单独一行，factionId 在其后另一行
            const re3 = new RegExp(`^\\s*generalId: '${r.gid}',\\s*$`);
            const j = L.findIndex(l => re3.test(l));
            if (j >= 0) {
                const k = L.findIndex((l, x) => x > j && /^\s*factionId: '[a-z0-9_]+',\s*$/.test(l));
                if (k >= 0 && k - j < 8) {
                    L[k] = L[k].replace(/factionId: '[a-z0-9_]+'/, `factionId: '${r.to}'`);
                    if (r.elite) {
                        const e = L.findIndex((l, x) => x > j && x < k + 12 && /^\s*eliteName: '[^']*',\s*$/.test(l));
                        if (e >= 0) L[e] = L[e].replace(/eliteName: '[^']*'/, `eliteName: '${r.elite}'`);
                    }
                    done.push(r.gid);
                    continue;
                }
            }
            miss.push(r.gid);
            continue;
        }
        let line = L[i];
        // 已有 factionId → 直接替换；否则插在 generalId 之后
        if (/factionId: '[a-z0-9_]+'/.test(line)) line = line.replace(/factionId: '[a-z0-9_]+'/, `factionId: '${r.to}'`);
        else line = line.replace(re, `$1{ generalId: '${r.gid}', factionId: '${r.to}',`);
        if (r.elite && /eliteName: '[^']*'/.test(line)) line = line.replace(/eliteName: '[^']*'/, `eliteName: '${r.elite}'`);
        L[i] = line; done.push(r.gid);
    }
    save(p, L);
    P(`  - ${p}: 改 ${done.length} 条` + (miss.length ? `｜未找到 ${miss.length}：${miss.join(', ')}` : ''));
}

P('\n' + (WRITE ? '✅ 已写入。' : '（dry-run，未写盘；加 --write 落盘）'));
