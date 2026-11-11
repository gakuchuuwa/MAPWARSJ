/**
 * GG 第五轮 收尾脚本（2026-11-11）
 * 依据主人指令：
 *   1. 「有神力的人物删除」→ 删除神话人物希波吕忒（yamaxun_xibolvte）
 *   2. 同人双 ID 去重（GG §四.2 剩余 3 对）：
 *      - 赫拉克留二世（删 bfe_erekle_ii，留 gelujiya_erekle_ii）
 *      - 扬·杰士卡（gen_jan_zizka 改挂 hussites，删重复 bfe_zizka）
 *      - 阿加利诺斯·孔托斯克莱斯（删 bfe_kontoskeles，留 bfe_agallianos）
 *   3. 新建/并入政权的命名、旗号、纹章、起止年与长时代分段收口：
 *      - wu_han「刘吴」、qi_zhangbu「张齐」、houmojietuo「后摩揭陀」（旗「后摩」）、
 *        yidali_odoacer「奥多亚克王国」（旗「奥多」）、yidali_hre「比安德拉泰伯国」（旗「比安」，1070–1335）
 *      - liangxixili 移除与 xixiliwangguo 共用的 SICILY_TRINACRIA 纹章，字旗改「两西」
 *      - buhala 终年按规则于 1900 截断；补齐 libiya 起止年（前241–前237）与军团兜底；mac_dynasty 首府正本为昇龙（city_shenglong）
 *      - halapengcai、luosi、bolan、litaowan 长时代按年代分段（补回封建段）
 *      - 生卒年未同步修正：jiaye_punafamo（570/630）、kawusi_haidaer（1778/1826）
 *   4. 「没有武将的势力要补武将，要符合历史。势力，军团，精锐都要挂武将」：
 *      - juandu（捐毒，《汉书·西域传》无王名、《后汉书》属疏勒）并入同系塞种绿洲政权 shule（疏勒），清理悬空块 tuosikana 与无主精锐名「十八骑」
 *      - buni_mathos（马托斯，雇佣兵战争利比亚联军统帅）由迦太基改挂 libiya（利比亚）
 *      - 4 家 0 将势力补史实武将：aguelabu（易卜拉欣一世）、baojiaer（切尔比尔）、fulandesi（罗贝尔一世）、mac_dynasty（莫登庸）
 *      - 其余 6 支空二级军团补史实驻防/统兵武将：
 *        GREECE×feudal（乌拉诺斯）、AFRICA×feudal（巴欣）、ROMA×castle（阿尔沃诺斯）、
 *        BYZANTINE×imperial（皮亚莱帕夏）、HUNS×castle（乌拉斯洛一世）、HUNS×imperial（特勒克）
 *
 * 默认 dry-run；加 --write 才落盘并备份原件。
 * 跑法：npx tsx tools/gg5/finish.mts [--write]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const BAK_DIR = '.bak_gg5_finish_20261111';

function readText(p: string): { text: string; nl: string } {
    const raw = readFileSync(p, 'utf8');
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    return { text: raw, nl };
}

const backedUp = new Set<string>();
function writeText(p: string, text: string): void {
    if (!WRITE) return;
    if (!backedUp.has(p)) {
        if (!existsSync(BAK_DIR)) mkdirSync(BAK_DIR, { recursive: true });
        const safe = p.replace(/[\\/]/g, '__');
        writeFileSync(`${BAK_DIR}/${safe}`, readFileSync(p));
        backedUp.add(p);
    }
    writeFileSync(p, text, 'utf8');
}

function mustReplace(src: string, target: string | RegExp, replacement: string, label: string): string {
    if (typeof target === 'string') {
        if (!src.includes(target)) throw new Error(`[未命中] ${label}`);
        return src.replace(target, replacement);
    }
    if (!target.test(src)) throw new Error(`[未命中正则] ${label}`);
    return src.replace(target, replacement);
}

const log: string[] = [];
const P = (s: string) => { log.push(s); console.log(s); };

// ═══════════════════════════════════════════════════════════════════════════
// 1. 势力表：删 juandu，修正 5 家政权名
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/factions.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*\{ id: 'juandu', name: '捐毒' \},\r?\n/m,
        `  // 🔴 [2026-11-11 GG第五轮收尾] 原 juandu「捐毒」（《汉书·西域传》无王名、《后汉书》属疏勒）并入 shule「疏勒」\r\n`,
        `${p}: juandu`);
    text = mustReplace(text, `{ id: 'wu_han', name: '吴' }`, `{ id: 'wu_han', name: '刘吴' }`, `${p}: wu_han`);
    text = mustReplace(text, `{ id: 'qi_zhangbu', name: '齐' }`, `{ id: 'qi_zhangbu', name: '张齐' }`, `${p}: qi_zhangbu`);
    text = mustReplace(text, `{ id: 'houmojietuo', name: '摩揭陀（普那伐摩）' }`, `{ id: 'houmojietuo', name: '后摩揭陀' }`, `${p}: houmojietuo`);
    text = mustReplace(text, `{ id: 'yidali_odoacer', name: '意大利（奥多亚克）' }`, `{ id: 'yidali_odoacer', name: '奥多亚克王国' }`, `${p}: yidali_odoacer`);
    text = mustReplace(text, `{ id: 'yidali_hre', name: '意大利（神圣罗马）' }`, `{ id: 'yidali_hre', name: '比安德拉泰伯国' }`, `${p}: yidali_hre`);
    writeText(p, text);
    P(`✓ ${p}: juandu 并入 shule，修正 5 家政权命名`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 据点归属：city_paixiucheng (涓笃) juandu → shule
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/cities_v2.ts';
    let { text } = readText(p);
    text = mustReplace(text, /(id: 'city_paixiucheng',[^\r\n]*?)factionId: 'juandu'/, `$1factionId: 'shule'`, `${p}: city_paixiucheng`);
    writeText(p, text);
    P(`✓ ${p}: city_paixiucheng 归属 juandu → shule`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 势力起止年：删 juandu，修 buhala / yidali_hre，补 libiya
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/FactionLifeYears.ts';
    let { text, nl } = readText(p);
    text = mustReplace(text, /^\s*juandu:\s*\{[^\r\n]*\},\r?\n/m, '', `${p}: juandu`);
    text = mustReplace(text, /(buhala:\s*\{\s*start:\s*1785,\s*end:\s*)1920/, `$11900`, `${p}: buhala 1900`);
    text = mustReplace(text, /^\s*yidali_hre:\s*\{[^\r\n]*\},/m,
        `    yidali_hre: { start: 1070, end: 1335, source: 'Wikipedia「Counts of Biandrate」：约 1070 年圭多一世受封比安德拉泰伯爵（阿尔伯特从征 1101 年十字军），1335 年并入米兰维斯孔蒂领', note: '皮埃蒙特比安德拉泰伯国（早于 1167 年伦巴第联盟）' },`,
        `${p}: yidali_hre`);
    if (!/^\s*libiya:\s*\{/m.test(text)) {
        text = mustReplace(text, /\r?\n\};\s*$/, `${nl}    libiya: { start: -241, end: -237, source: '波利比乌斯《历史》卷一、Wikipedia「Mercenary War」：前241–前237年北非利比亚诸城与雇佣军结盟反迦太基（铸 ΛΙΒΥΩΝ「利比亚人」钱币立盟）', note: '北非利比亚反迦太基同盟政权（马托斯、斯彭迪乌斯）' },${nl}};${nl}`, `${p}: add libiya`);
    }
    writeText(p, text);
    P(`✓ ${p}: 删 juandu，修 buhala/yidali_hre，补 libiya`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. 势力时代表：删 juandu，长时代补分段（halapengcai, luosi, bolan, litaowan）
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/FactionEra.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*'juandu':\s*\[[^\r\n]*\][^\r\n]*\r?\n/m, '', `${p}: juandu`);
    text = mustReplace(text, /^\s*'halapengcai':\s*\[[^\r\n]*\][^\r\n]*/m,
        `    'halapengcai': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 哈利奔猜王国（约750–1292）：封建→1050起城堡`,
        `${p}: halapengcai`);
    text = mustReplace(text, /^\s*'luosi':\s*\[[^\r\n]*\][^\r\n]*/m,
        `    'luosi': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 罗斯｜存续 830–1294：留里克—基辅罗斯早期封建→1050起城堡（2026-11-11 GG第五轮·长时代分段）`,
        `${p}: luosi`);
    text = mustReplace(text, /^\s*'bolan':\s*\[[^\r\n]*\][^\r\n]*/m,
        `    'bolan': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }, { from: 1500, era: 'imperial' }], // 波兰｜存续 960–1795：早期皮亚斯特封建→1050起城堡→1500起帝国（2026-11-11 GG第五轮·长时代分段）`,
        `${p}: bolan`);
    text = mustReplace(text, /^\s*'litaowan':\s*\[[^\r\n]*\][^\r\n]*/m,
        `    'litaowan': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }, { from: 1500, era: 'imperial' }], // 立陶宛｜存续 980–1795：早期波罗的部族封建→1050起城堡→1500起帝国（2026-11-11 GG第五轮·长时代分段）`,
        `${p}: litaowan`);
    writeText(p, text);
    P(`✓ ${p}: 删 juandu，补 halapengcai/luosi/bolan/litaowan 时代分段`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 旗号、旗面、纹章、颜色、首府、民族、唐代势力集合、精锐原名表
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/SandboxDisplayNames.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*['"]?juandu['"]?:\s*'捐毒'[^\r\n]*\r?\n/m, '', `${p}: juandu`);
    text = mustReplace(text, /(houmojietuo:\s*)'摩揭'/, `$1'后摩'`, `${p}: houmojietuo`);
    text = mustReplace(text, /(yidali_odoacer:\s*)'意'/, `$1'奥多'`, `${p}: yidali_odoacer`);
    text = mustReplace(text, /(yidali_hre:\s*)'意'/, `$1'比安'`, `${p}: yidali_hre`);
    text = mustReplace(text, /(['"]?liangxixili['"]?:\s*)'西西'/, `$1'两西'`, `${p}: liangxixili`);
    writeText(p, text);
    P(`✓ ${p}: 删 juandu，更新 houmojietuo/yidali_odoacer/yidali_hre/liangxixili 旗号`);
}
{
    const p = 'src/assets/CityAssetManager.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*['"]?juandu['"]?:\s*'捐毒'[^\r\n]*\r?\n/m, '', `${p}: juandu`);
    text = mustReplace(text, /('houmojietuo':\s*)'摩揭'/, `$1'后摩'`, `${p}: houmojietuo`);
    text = mustReplace(text, /('yidali_odoacer':\s*)'意'/, `$1'奥多'`, `${p}: yidali_odoacer`);
    text = mustReplace(text, /('yidali_hre':\s*)'意'/, `$1'比安'`, `${p}: yidali_hre`);
    text = mustReplace(text, /(['"]?liangxixili['"]?:\s*)'西西'/, `$1'两西'`, `${p}: liangxixili`);
    writeText(p, text);
    P(`✓ ${p}: 同步 factionFlagMap`);
}
{
    const p = 'src/data/FactionEmblems.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*'liangxixili':\s*'SICILY_TRINACRIA'[^\r\n]*\r?\n/m, '', `${p}: liangxixili`);
    writeText(p, text);
    P(`✓ ${p}: 移除 liangxixili 重复纹章 SICILY_TRINACRIA`);
}
{
    const p = 'src/data/HistoricalFactionColors.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*['"]?juandu['"]?:\s*'#[0-9A-Fa-f]+'[^\r\n]*\r?\n/m, '', `${p}: juandu`);
    writeText(p, text);
    P(`✓ ${p}: 删 juandu`);
}
{
    const p = 'src/data/StartingCapitals.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*['"]?juandu['"]?:\s*'city_paixiucheng'[^\r\n]*\r?\n/m, '', `${p}: juandu`);
    text = mustReplace(text, /(['"]?mac_dynasty['"]?:\s*)'city_sanpu'/, `$1'city_shenglong'`, `${p}: mac_dynasty -> city_shenglong`);
    writeText(p, text);
    P(`✓ ${p}: 删 juandu，mac_dynasty 首府改为 city_shenglong`);
}
{
    const p = 'src/data/FactionPeoples.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*['"]?juandu['"]?:\s*'唐'[^\r\n]*\r?\n/m, '', `${p}: juandu`);
    writeText(p, text);
    P(`✓ ${p}: 删 juandu`);
}
{
    const p = 'src/types/CultureFormations.ts';
    let { text } = readText(p);
    text = mustReplace(text, `'tang', 'juandu',`, `'tang',`, `${p}: TANG_DYNASTY_FACTION_IDS`);
    writeText(p, text);
    P(`✓ ${p}: TANG_DYNASTY_FACTION_IDS 移除 juandu`);
}
{
    const p = 'src/data/EliteNameRules.ts';
    let { text } = readText(p);
    text = mustReplace(text, /^\s*'十八骑',\r?\n/m, '', `${p}: 十八骑`);
    writeText(p, text);
    P(`✓ ${p}: 移除无武将挂载的旧豁免名「十八骑」（石勒现挂「襄国十八骑」）`);
}
{
    const p = 'src/data/FactionCompositions.ts';
    let { text, nl } = readText(p);
    // 删 juandu 块
    text = mustReplace(text, /^\s*"juandu":\s*\{\r?\n\s*"?legionName"?:\s*"[^"]+",?\r?\n(?:\s*"?legionType"?:\s*"[^"]+",?\r?\n)?\s*\},?\r?\n/m, '', `${p}: juandu`);
    // 更新 mac_dynasty, halapengcai, boximiya, luosi 兜底指针，并补 libiya
    const updates: Array<[string, string]> = [
        ['mac_dynasty', '帝国时代安南军团'],
        ['halapengcai', '城堡时代阿瓦军团'],
        ['boximiya', '帝国时代波希米亚雇佣军团'],
        ['luosi', '封建时代瓦良格军团'],
    ];
    for (const [fid, leg] of updates) {
        const re = new RegExp(`(["']?${fid}["']?:\\s*\\{\\r?\\n\\s*"?legionName"?:\\s*)"[^"]+"`);
        if (re.test(text)) text = text.replace(re, `$1"${leg}"`);
    }
    if (!/"libiya":\s*\{/.test(text)) {
        text = mustReplace(
            text,
            /\r?\n\};\r?\n\r?\n\/\/ \[2026-10-26 主人令新增湖广\]/,
            `${nl}    "libiya": {${nl}        legionName: "古典时代迦太基军团",${nl}        legionType: "sub",${nl}    },${nl}};${nl}${nl}// [2026-10-26 主人令新增湖广]`,
            `${p}: add libiya`,
        );
    }
    writeText(p, text);
    P(`✓ ${p}: 删 juandu，补 libiya，对齐 mac_dynasty/halapengcai/boximiya/luosi 军团指针`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. 武将主表 FactionGenerals.ts
// ═══════════════════════════════════════════════════════════════════════════
{
    const p = 'src/data/FactionGenerals.ts';
    let { text, nl } = readText(p);

    // 6.1 清理悬空空块 tuosikana: [ ... ],
    text = mustReplace(text, /^\s*tuosikana:\s*\[\s*\],\r?\n/m, '', `${p}: remove empty tuosikana`);

    // 6.2 juandu 单条块里的 juandu_peixingjian（裴行俭，factionId:'tang'）改外层键或并入 tang 块
    const peiMatch = text.match(/^\s*juandu:\s*(\{\s*generalId:\s*'juandu_peixingjian'[^\r\n]*\}),\r?\n/m);
    if (!peiMatch) throw new Error(`${p}: 未找到 juandu: { generalId: 'juandu_peixingjian' }`);
    const peiObj = peiMatch[1];
    text = text.replace(peiMatch[0], '');
    text = mustReplace(text, /(^\s*tang:\s*\[\r?\n)/m, `$1        ${peiObj},${nl}`, `${p}: move juandu_peixingjian into tang`);

    // 6.3 删除神话人物 yamaxun_xibolvte（希波吕忒）及 3 个同人重复条目（bfe_erekle_ii, bfe_zizka, bfe_kontoskeles）
    for (const delId of ['yamaxun_xibolvte', 'bfe_erekle_ii', 'bfe_kontoskeles']) {
        const re = new RegExp(`^\\s*\\{\\s*generalId:\\s*'${delId}'[^\\r\\n]*\\},?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${delId}`);
    }

    // 6.4 扬·杰士卡去重归位：从 boximiya 移除 gen_jan_zizka，替换 hussites 里的重复项 bfe_zizka
    const zizkaMatch = text.match(/^\s*\{\s*generalId:\s*'gen_jan_zizka'[^\r\n]*\},\r?\n/m);
    if (!zizkaMatch) throw new Error(`${p}: 未找到 gen_jan_zizka`);
    text = text.replace(zizkaMatch[0], '');
    text = mustReplace(
        text,
        /^\s*\{\s*generalId:\s*'bfe_zizka'[^\r\n]*\},\r?\n/m,
        `        { generalId: 'gen_jan_zizka', factionId: 'hussites', cityId: 'city_bulage', generalName: '扬杰式卡', portrait: '/assets/BOHEMIANS/gen_jan_zizka.png', eliteName: '胡斯战车', eliteTier: 1 },${nl}`,
        `${p}: replace bfe_zizka with gen_jan_zizka in hussites`,
    );

    // 6.5 马托斯（buni_mathos）由迦太基改挂利比亚（libiya）
    text = mustReplace(
        text,
        /\{\s*generalId:\s*'buni_mathos',\s*factionId:\s*'buni',\s*cityId:\s*'city_jiataji',\s*generalName:\s*'马托斯',\s*portrait:\s*'\/assets\/BERBER\/buni_mathos\.png',\s*eliteName:\s*'迦太基骑手',\s*eliteTier:\s*4\s*\}/,
        `{ generalId: 'buni_mathos', factionId: 'libiya', cityId: 'city_jiataji', generalName: '马托斯', portrait: '/assets/BERBER/buni_mathos.png', eliteName: '利比亚矛兵', eliteTier: 4 }`,
        `${p}: buni_mathos -> libiya`,
    );

    // 6.6 补 4 家 0 将势力的史实武将
    // (a) aguelabu：易卜拉欣一世（756–812，800 年于凯鲁万建阿格拉布王朝）
    text = mustReplace(
        text,
        /(^\s*aguelabu:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补空势力史实武将] 易卜拉欣一世·伊本·阿格拉布（756–812，800 年受封伊夫里奇亚埃米尔、定都凯鲁万立朝）${nl}        { generalId: 'aguelabu_ibrahim_i', factionId: 'aguelabu', cityId: 'city_kailuwan', generalName: '易卜拉欣一世', portrait: '', eliteName: '凯鲁万骑兵', eliteTier: 3 },${nl}`,
        `${p}: add aguelabu_ibrahim_i`,
    );
    // (b) baojiaer：切尔比尔（Gabdula Chelbir，约1165–1225，1223 萨马拉河湾之战击败哲别、速不台蒙古军，守御伏尔加保加尔）
    text = mustReplace(
        text,
        /(^\s*baojiaer:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补空势力史实武将] 加卜杜拉·切尔比尔（约1165–1225，伏尔加保加尔君主；1223 年萨马拉河湾设伏击败哲别、速不台军）${nl}        { generalId: 'baojiaer_chelbir', factionId: 'baojiaer', cityId: 'city_kashan', generalName: '切尔比尔', portrait: '', eliteName: '不里阿耳骑', eliteTier: 3 },${nl}`,
        `${p}: add baojiaer_chelbir`,
    );
    // (c) fulandesi（阿图瓦）：单条改数组，补首任阿图瓦伯爵罗贝尔一世（1216–1250，1237 受封阿图瓦伯，1250 曼苏拉之战率十字军前锋战死）
    text = mustReplace(
        text,
        /^(\s*)fulandesi:\s*(\{\s*generalId:\s*'gen_robert_ii'[^\r\n]*\}),/m,
        `$1fulandesi: [${nl}$1    $2,${nl}$1    // 🔴 [2026-11-11 GG第五轮·补空势力史实武将] 罗贝尔一世（1216–1250，路易九世之弟，1237 年首封阿图瓦伯爵，第七次十字军前锋统帅）${nl}$1    { generalId: 'fulandesi_robert_i', factionId: 'fulandesi', cityId: 'city_calais', generalName: '罗贝尔一世', portrait: '', eliteName: '阿图瓦骑士', eliteTier: 3 },${nl}$1],`,
        `${p}: add fulandesi_robert_i`,
    );
    // (d) mac_dynasty（莫朝）：莫登庸（1483–1541，1527 于昇龙建莫朝）
    text = mustReplace(
        text,
        /(^\s*mac_dynasty:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补空势力史实武将] 莫登庸（1483–1541，越南莫朝开国太祖，1527 年于昇龙受禅立朝）${nl}        { generalId: 'mac_macdengyong', factionId: 'mac_dynasty', cityId: 'city_shenglong', generalName: '莫登庸', portrait: '', eliteName: '莫氏宿卫军', eliteTier: 3 },${nl}`,
        `${p}: add mac_macdengyong`,
    );

    // 6.7 补 6 支空二级军团的史实驻防/统兵武将
    // (1) GREECE × feudal（封建时代爱琴军团）：尼基弗鲁斯·乌拉诺斯（约950–1010，拜占庭西方家内军长官，坐镇希腊军区并于 997 斯佩尔依奥斯河全歼保加利亚军）
    text = mustReplace(
        text,
        /(^\s*baizanting:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 尼基弗鲁斯·乌拉诺斯（约950–1010，拜占庭西方家内军统帅；997 年督师希腊军区于斯佩尔依奥斯河夜袭大破保加利亚沙皇撒慕尔）${nl}        { generalId: 'baizanting_ouranos', factionId: 'baizanting', cityId: 'city_thebes', generalName: '乌拉诺斯', portrait: '', eliteName: '爱琴军区兵', eliteTier: 3 },${nl}`,
        `${p}: add baizanting_ouranos`,
    );
    // (2) AFRICA × feudal（封建时代加纳军团）：通卡·巴欣（985–1062，贝克里《道里邦国志》载 11 世纪上半叶驻跸库姆比萨利赫抗御穆拉比特的加纳国王）
    text = mustReplace(
        text,
        /(^\s*ghana_diguo:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 通卡·巴欣（Tunka Bassi，约985–1062，贝克里《道里邦国志》所载加纳帝国君主，驻库姆比萨利赫统军御边）${nl}        { generalId: 'ghana_bassi', factionId: 'ghana_diguo', cityId: 'city_kumubi', generalName: '巴欣', portrait: '', eliteName: '瓦加杜矛兵', eliteTier: 4 },${nl}`,
        `${p}: add ghana_bassi`,
    );
    // (3) ROMA × castle（城堡时代罗马教廷军团）：阿尔沃诺斯（Gil de Albornoz，1310–1367，教廷特使兼教皇国全军统帅，收复罗马与教皇国诸城并颁《埃吉迪奥宪章》）
    text = mustReplace(
        text,
        /(\s*jiaohuangguo:\s*\[)\r?\n(\s*\],\s*yinduxila:\s*\[)/,
        `$1${nl}        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 吉尔·德·阿尔沃诺斯（1310–1367，枢机主教兼教皇国军务总督；1353–1367 统军削平罗马及教皇国割据并颁《埃吉迪奥宪章》）${nl}        { generalId: 'jiaohuangguo_albornoz', factionId: 'jiaohuangguo', cityId: 'city_luoma', generalName: '阿尔沃诺斯', portrait: '', eliteName: '教廷卫戍兵', eliteTier: 3 },${nl}$2`,
        `${p}: add jiaohuangguo_albornoz`,
    );
    // (4) BYZANTINE × imperial（帝国时代伊斯坦布尔军团）：皮亚莱帕夏（Piyale Pasha，1515–1578，奥斯曼卡普丹帕夏兼维齐尔，驻君士坦丁堡金角湾海军造船厂统领帝国舰队，1560 杰尔巴大捷）
    text = mustReplace(
        text,
        /(^\s*osman:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 皮亚莱帕夏（1515–1578，奥斯曼卡普丹帕夏兼维齐尔；常驻君士坦丁堡统领帝国海军，1560 年杰尔巴岛大破基督教联军）${nl}        { generalId: 'osman_piyale_pasha', factionId: 'osman', cityId: 'city_junshitandingbao', generalName: '皮亚莱帕夏', portrait: '', eliteName: '帝国海兵队', eliteTier: 3 },${nl}`,
        `${p}: add osman_piyale_pasha`,
    );
    // (5) HUNS × castle（城堡时代匈牙利军团）& (6) HUNS × imperial（帝国时代多瑙河军团）：塞格德（city_saigede）
    text = mustReplace(
        text,
        /(^\s*mazhaer:\s*\[\r?\n)/m,
        `$1        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 乌拉斯洛一世（1424–1444，匈牙利国王；1444 年驻跸塞格德缔结《塞格德和约》并集结瓦尔纳十字军出征）${nl}        { generalId: 'mazhaer_ulazlo_i', factionId: 'mazhaer', cityId: 'city_saigede', generalName: '乌拉斯洛一世', portrait: '', eliteName: '塞格德骑兵', eliteTier: 3 },${nl}        // 🔴 [2026-11-11 GG第五轮·补二级军团史实武将] 巴林特·特勒克（Bálint Török，1502–1551，匈牙利南境统帅兼琼格拉德—塞格德领主；1527 年于塞格德近郊击败约万·内纳德军）${nl}        { generalId: 'mazhaer_balint_torok', factionId: 'mazhaer', cityId: 'city_saigede', generalName: '特勒克', portrait: '', eliteName: '蒂萨河轻骑', eliteTier: 3 },${nl}`,
        `${p}: add mazhaer_ulazlo_i & mazhaer_balint_torok`,
    );

    writeText(p, text);
    P(`✓ ${p}: 删 4 条（神话1+重复3）、移 2 条（杰士卡→胡斯派、马托斯→利比亚）、补 10 位史实武将`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. 武将生卒年、世纪、时代、文化、武将技档案同步
// ═══════════════════════════════════════════════════════════════════════════
const DELETED_GIDS = ['yamaxun_xibolvte', 'bfe_erekle_ii', 'bfe_zizka', 'bfe_kontoskeles'] as const;

type NewGenMeta = {
    gid: string;
    birth: number;
    death: number;
    kaoju?: '推定';
    century: number;
    era: 'antiquity' | 'feudal' | 'castle' | 'imperial';
    culture: string;
    comment: string;
    skills: [string, string, string, string, string, string]; // atkAdv, atkBal, atkDis, defAdv, defBal, defDis
};

const NEW_GENS: NewGenMeta[] = [
    {
        gid: 'aguelabu_ibrahim_i', birth: 756, death: 812, century: 9, era: 'feudal', culture: 'BERBER',
        comment: '易卜拉欣一世 · 阿格拉布 · 凯鲁万',
        skills: ['ts_624', 'ts_659', 'ts_161', 'ts_815', 'ts_396', 'ts_513'],
    },
    {
        gid: 'baojiaer_chelbir', birth: 1165, death: 1225, kaoju: '推定', century: 13, era: 'castle', culture: 'CENTRAL_ASIA',
        comment: '切尔比尔 · 保加尔 · 喀山',
        skills: ['ts_474', 'ts_560', 'ts_742', 'ts_077', 'ts_572', 'ts_650'],
    },
    {
        gid: 'fulandesi_robert_i', birth: 1216, death: 1250, century: 13, era: 'castle', culture: 'FRANKS',
        comment: '罗贝尔一世 · 阿图瓦 · 加莱',
        skills: ['ts_480', 'ts_584', 'ts_376', 'ts_630', 'ts_587', 'ts_730'],
    },
    {
        gid: 'mac_macdengyong', birth: 1483, death: 1541, century: 16, era: 'imperial', culture: 'VIETNAMESE',
        comment: '莫登庸 · 莫朝 · 昇龙',
        skills: ['ts_504', 'ts_628', 'ts_320', 'ts_655', 'ts_617', 'ts_006'],
    },
    {
        gid: 'baizanting_ouranos', birth: 950, death: 1010, kaoju: '推定', century: 10, era: 'feudal', culture: 'GREECE',
        comment: '乌拉诺斯 · 拜占庭 · 底比斯',
        skills: ['ts_525', 'ts_069', 'ts_218', 'ts_815', 'ts_638', 'ts_294'],
    },
    {
        gid: 'ghana_bassi', birth: 985, death: 1062, kaoju: '推定', century: 11, era: 'feudal', culture: 'AFRICA',
        comment: '巴欣 · 加纳帝国 · 库姆比萨利赫',
        skills: ['ts_660', 'ts_072', 'ts_413', 'ts_077', 'ts_641', 'ts_513'],
    },
    {
        gid: 'jiaohuangguo_albornoz', birth: 1310, death: 1367, century: 14, era: 'castle', culture: 'ROMA',
        comment: '阿尔沃诺斯 · 教皇国 · 罗马',
        skills: ['ts_679', 'ts_190', 'ts_161', 'ts_630', 'ts_653', 'ts_650'],
    },
    {
        gid: 'osman_piyale_pasha', birth: 1515, death: 1578, century: 16, era: 'imperial', culture: 'BYZANTINE',
        comment: '皮亚莱帕夏 · 奥斯曼帝国 · 君士坦丁堡',
        skills: ['ts_242', 'ts_275', 'ts_742', 'ts_655', 'ts_145', 'ts_730'],
    },
    {
        gid: 'mazhaer_ulazlo_i', birth: 1424, death: 1444, century: 15, era: 'castle', culture: 'HUNS',
        comment: '乌拉斯洛一世 · 匈牙利 · 塞格德',
        skills: ['ts_340', 'ts_332', 'ts_376', 'ts_815', 'ts_197', 'ts_006'],
    },
    {
        gid: 'mazhaer_balint_torok', birth: 1502, death: 1551, century: 16, era: 'imperial', culture: 'HUNS',
        comment: '特勒克 · 匈牙利 · 塞格德',
        skills: ['ts_354', 'ts_521', 'ts_320', 'ts_077', 'ts_273', 'ts_294'],
    },
];

// 7.1 GeneralLifeYears.ts
{
    const p = 'src/data/GeneralLifeYears.ts';
    let { text, nl } = readText(p);
    for (const gid of DELETED_GIDS) {
        const re = new RegExp(`^\\s*['"]?${gid}['"]?:\\s*\\{[^\\r\\n]*\\},?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${gid}`);
    }
    text = mustReplace(text, /^\s*['"]?jiaye_punafamo['"]?:\s*\{[^\r\n]*\},?/m,
        `    jiaye_punafamo: { birth: 570, death: 630, kaoju: '推定' }, // 普那伐摩（《大唐西域记》卷八：7世纪初摩揭陀王，重兴菩提树）`,
        `${p}: fix jiaye_punafamo`);
    text = mustReplace(text, /^\s*['"]?kawusi_haidaer['"]?:\s*\{[^\r\n]*\},?/m,
        `    kawusi_haidaer: { birth: 1778, death: 1826 }, // 布哈拉埃米尔海达尔（Haydar bin Shahmurad，1800–1826 在位）`,
        `${p}: fix kawusi_haidaer`);
    const ins = NEW_GENS.map(g =>
        `    ${g.gid}: { birth: ${g.birth}, death: ${g.death}${g.kaoju ? `, kaoju: '${g.kaoju}'` : ''} }, // ${g.comment}`
    ).join(nl);
    text = mustReplace(text, /\r?\n\};\r?\n\r?\n\/\*\*\s*生年/, `${nl}${ins}${nl}};${nl}${nl}/** 生年`, `${p}: append 10 new generals`);
    writeText(p, text);
    P(`✓ ${p}: 删 4 条，修正普那伐摩/海达尔生卒年，新增 10 条`);
}

// 7.2 GeneralEra.ts
{
    const p = 'src/data/GeneralEra.ts';
    let { text, nl } = readText(p);
    for (const gid of DELETED_GIDS) {
        const re = new RegExp(`^\\s*['"]?${gid}['"]?:\\s*'[^']+',?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${gid}`);
    }
    text = mustReplace(text, /(['"]?jiaye_punafamo['"]?:\s*)'antiquity'/, `$1'feudal'`, `${p}: jiaye_punafamo -> feudal`);
    const ins = NEW_GENS.map(g => `    '${g.gid}': '${g.era}', // ${g.comment}`).join(nl);
    text = mustReplace(text, /(['"]?aquidan_odo['"]?:[^\r\n]*\r?\n)(\};)/, `$1${ins}${nl}$2`, `${p}: append 10 new generals`);
    writeText(p, text);
    P(`✓ ${p}: 删 4 条，jiaye_punafamo→feudal，新增 10 条`);
}

// 7.3 GeneralCenturies.ts
{
    const p = 'src/data/GeneralCenturies.ts';
    let { text, nl } = readText(p);
    for (const gid of DELETED_GIDS) {
        const re = new RegExp(`^\\s*['"]?${gid}['"]?:\\s*-?\\d+,?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${gid}`);
    }
    text = mustReplace(text, /(['"]?jiaye_punafamo['"]?:\s*)\d+/, `$17`, `${p}: jiaye_punafamo -> 7`);
    text = mustReplace(text, /(['"]?kawusi_haidaer['"]?:\s*)\d+/, `$119`, `${p}: kawusi_haidaer -> 19`);
    const ins = NEW_GENS.map(g => `    '${g.gid}': ${g.century}, // ${g.comment}`).join(nl);
    text = mustReplace(text, /(['"]?aquidan_odo['"]?:[^\r\n]*\r?\n)(\};)/, `$1${ins}${nl}$2`, `${p}: append 10 new generals`);
    writeText(p, text);
    P(`✓ ${p}: 删 4 条，更新普那伐摩(7)/海达尔(19)世纪，新增 10 条`);
}

// 7.4 GeneralCulture.ts
{
    const p = 'src/data/GeneralCulture.ts';
    let { text, nl } = readText(p);
    for (const gid of DELETED_GIDS) {
        const re = new RegExp(`^\\s*['"]?${gid}['"]?:\\s*'[^']+',?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${gid}`);
    }
    const ins = NEW_GENS.map(g => `    '${g.gid}': '${g.culture}',   // ${g.comment}`).join(nl);
    text = mustReplace(text, /(['"]?aquidan_odo['"]?:[^\r\n]*\r?\n)(\};)/, `$1${ins}${nl}$2`, `${p}: append 10 new generals`);
    writeText(p, text);
    P(`✓ ${p}: 删 4 条，新增 10 条`);
}

// 7.5 general-skills/profiles.ts
{
    const p = 'src/data/general-skills/profiles.ts';
    let { text, nl } = readText(p);
    for (const gid of DELETED_GIDS) {
        const re = new RegExp(`^\\s*['"]?${gid}['"]?:\\s*\\{[^\\r\\n]*\\},?[^\\r\\n]*\\r?\\n`, 'm');
        text = mustReplace(text, re, '', `${p}: delete ${gid}`);
    }
    const ins = NEW_GENS.map(g => {
        const [aAdv, aBal, aDis, dAdv, dBal, dDis] = g.skills;
        return `    ${g.gid}: { generalId: '${g.gid}', tier: 'ordinary', tacticalSkillId: '${aAdv}', advantageSkillId: '${aAdv}', balanceSkillId: '${aBal}', disadvantageSkillId: '${aDis}', atkAdvantageSkillId: '${aAdv}', atkBalanceSkillId: '${aBal}', atkDisadvantageSkillId: '${aDis}', defAdvantageSkillId: '${dAdv}', defBalanceSkillId: '${dBal}', defDisadvantageSkillId: '${dDis}', aptitude: 'leverage', attackStyle: 'balanced' }, // ${g.comment}`;
    }).join(nl);
    text = mustReplace(text, /(aquidan_odo:[^\r\n]*\r?\n)(\};)/, `$1${ins}${nl}$2`, `${p}: append 10 new profiles`);
    writeText(p, text);
    P(`✓ ${p}: 删 4 条，新增 10 条普将六槽战术技档案`);
}

P('\n' + (WRITE ? `✅ 全部写入完成（原件备份于 ${BAK_DIR}/）` : '（dry-run 通过，未写盘；加 --write 落盘）'));
