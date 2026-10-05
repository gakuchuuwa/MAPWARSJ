/**
 * 攻城武器配兵验收。
 *
 * 🔴 [2026-08-24 主人两次指出：「西域的攻城战中竟然出现了大象？」
 *     「大象作为攻城武器在西域登场。是不对的。」]
 *
 *    根因是两处都开着战象：
 *      ① `SIEGE_ELEPHANT_BY_CULTURE` 挂了 `WESTERN: 'war_elephant'`，注释写「波斯战象」
 *         —— **挂错区了**。实测 WESTERN 的 43 座城全是塔里木盆地 + 河中的绿洲城邦
 *         （高昌、于阗、精绝、怛罗斯、浩罕、柘折城…），太干旱、无象源，兵力主体是骑射。
 *         波斯（波斯波利斯、苏萨、伊斯法罕）在 `CENTRAL_ASIA` 区，根本不在这儿。
 *      ② 科技树门控表 `SIEGE_TECH_BY_CULTURE` 里 WESTERN 也开着 `war_elephant: true`。
 *
 *    也没有把战象补给 CENTRAL_ASIA：那区 52 座城里波斯本土只有几座，
 *    主体是中亚（木鹿、布哈拉、撒马尔罕——粟特人不用象）。
 *    判据是「这地方**什么最多**」，不是「有没有用过」。
 *
 * 跑法：npx tsx tools/audit-siege-weapons.mts
 */
import { readFileSync, existsSync } from 'node:fs';

const SRC = readFileSync('src/ui/Scene13WarLayer.ts', 'utf8');

/**
 * 🔴 [2026-10-05 修尺子] 原名单只有 4 个区（INDIA/DIANQIAN/LINGNAN/MALAY）→ **太窄，属尺子错**，
 *    实测把 14 个史实上用象的区全判成「不该有战象」（血训 23：报红先问是数据的错还是尺子的错）。
 *    本名单的作用仍是**防跨洲乱炖**（例如绝不许给西域绿洲、东欧、西欧配象），所以照旧是白名单，
 *    只是按史实与游戏真表（`src/data/SiegeWeaponsByCulture.ts` 的 `ballista_elephant` 用途）补全。
 *    史实依据（逐条）：
 *      · 南亚：INDIA(印度斯坦/德里/莫卧儿)、BENGALIS(孟加拉)、GURJARAS(古吉拉特/拉杰普特)、PURU(孔雀/朱罗，走 PURU 线)；
 *        孟加拉与古吉拉特是印度史上著名的产象与用象区（《政事论》Arthaśāstra 设「象部」专管）。
 *      · 东南亚：MALAY(马来/室利佛逝/满剌加)、KHMER(高棉，战象最盛)、BURMESE(缅甸)、VIETNAMESE(越南/占婆)、
 *        SEASIA_* 各代变体 —— 中南半岛与群岛诸国普遍以战象为核心兵种。
 *      · 中国西南：DIANQIAN(滇黔/南诏大理)、LINGNAN(岭南/南越) —— 南诏与岭南确有战象。
 *      · 波斯：PERSIAN/PERSIAN_CASTLE —— 阿契美尼德与萨珊都用战象（高加米拉即有 15 头）。
 *      · 北非：CARTHAGE(迦太基) —— 汉尼拔的非洲森林象，古典地中海最著名的战象。
 *      · KUSHAN(贵霜)：印度-斯基泰/贵霜统治北印度，有象源与用象记载 —— 保留（不判红）。
 */
const ELEPHANT_OK = new Set([
    'INDIA', 'INDIA_FEUDAL', 'INDIA_CASTLE', 'INDIA_IMPERIAL',
    'BENGALIS', 'BENGALIS_ANTIQUITY', 'GURJARAS', 'PURU',
    'MALAY', 'KHMER', 'BURMESE', 'VIETNAMESE',
    'SEASIA_ANTIQUITY', 'SEASIA_FEUDAL', 'SEASIA_CASTLE', 'SEASIA_IMPERIAL',
    'DIANQIAN', 'LINGNAN',
    // NANZHAO（南诏）与 DIANQIAN（滇黔）在本项目是**两个不同的文化区键**，同属中国西南；
    // 南诏是西南第一军国，滇西—缅北一线有象源与用象记载（项目自己的 DALI 注释即写「西南大理象兵」）。
    'NANZHAO',
    // SRIVIJAYA（室利佛逝/三佛齐）与已放行的 MALAY 属**同一海区**（马六甲—苏门答腊—马来半岛），
    // 该区诸国（三佛齐、满剌加、亚齐）都用战象。
    'SRIVIJAYA',
    'PERSIAN', 'PERSIAN_CASTLE',
    'CARTHAGE', 'KUSHAN',
]);

function main(): void {
  let fail = 0;

  // ── 真源解析：战术攻城发武器走的是 `getSiegeWeaponsForCulture()`，
  //    其数据在 `src/data/SiegeWeaponsByCulture.ts` 的 `LEGION_78_SIEGE_MAP`。
  //    🔴 [2026-10-05] 本脚本的 ①② 原来查的是 `Scene13WarLayer.ts` 里的
  //    `SIEGE_ELEPHANT_BY_CULTURE` / `SIEGE_TECH_BY_CULTURE` —— 那两张是**死表**（全库无代码读取，
  //    且是旧 key 体系），已删；判据全部改查下面这份真表。
  const REAL_SRC = readFileSync('src/data/SiegeWeaponsByCulture.ts', 'utf8');
  type LegionRow = { age: string; weapons: string[] };
  const LEGIONS = new Map<string, LegionRow>();
  for (const m of REAL_SRC.matchAll(/^\s*'([^']+)':\s*\{\s*\n\s*age:\s*'(\w+)',(?:[\s\S]*?)weapons:\s*\[([^\]]*)\]/gm)) {
    LEGIONS.set(m[1], { age: m[2], weapons: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]) });
  }
  // 文化区键 → 母体军团名（用于把「军团名」折回「文化区」判象）
  const LEGION_TO_REGION: Record<string, string> = {
    东亚军团: 'CENTRAL', 中亚军团: 'STEPPE', 印度军团: 'INDIA', 西欧军团: 'GERMANIC',
    普鲁军团: 'PURU', 中东军团: 'ORIE', 地中海军团: 'LATIN', 东北欧军团: 'SLAVIC',
    东南欧军团: 'EAST', 波斯军团: 'PERSIAN', 东南亚军团: 'MALAY', 希腊军团: 'GREEK',
    色雷斯军团: 'THRACIAN', 安第斯军团: 'ANDE', 中美军团: 'AMERICA', 非洲军团: 'AFRICA',
  };

  // ① 战象：真表里凡用到象（ballista_elephant / elite_ballista_elephant 等）的编成，
  //    其文化区/军团必须落在白名单内 —— 防「跨洲乱炖」（西域绿洲、东欧、西欧绝不许有象）。
  //    ⚠️ 真表的键有两种形态：母体 `东南亚军团_castle` 与二级 `封建时代高棉军团` → 都要能折回文化区。
  const REGION_BY_KEYWORD: Array<[RegExp, string]> = [
    [/高棉/, 'KHMER'], [/缅甸/, 'BURMESE'], [/越南|占婆/, 'VIETNAMESE'], [/马来|三佛齐|室利佛逝|满剌加|亚齐/, 'MALAY'],
    [/印度|德里|莫卧儿|印度斯坦/, 'INDIA'], [/孟加拉/, 'BENGALIS'], [/古吉拉特|拉杰普特|朱罗|注辇|孔雀/, 'GURJARAS'],
    [/大理|南诏|滇/, 'NANZHAO'], [/岭南|南越/, 'LINGNAN'], [/波斯|阿契美尼德|萨珊/, 'PERSIAN'],
    [/迦太基/, 'CARTHAGE'], [/贵霜/, 'KUSHAN'],
  ];
  const regionOf = (legion: string): string => {
    const stripped = legion.replace(/_(antiquity|feudal|castle|imperial)$/, '');
    if (LEGION_TO_REGION[stripped]) return LEGION_TO_REGION[stripped];
    for (const [re, reg] of REGION_BY_KEYWORD) if (re.test(stripped)) return reg;
    return stripped;
  };
  console.log('真表里用象的编成（查 LEGION_78_SIEGE_MAP）：');
  let eleChecked = 0;
  for (const [legion, row] of LEGIONS) {
    const elephants = row.weapons.filter((w) => /elephant/.test(w));
    if (!elephants.length) continue;
    eleChecked++;
    const region = regionOf(legion);
    const ok = ELEPHANT_OK.has(region);
    if (!ok) { console.log(`  🔴 ${legion}：[${row.age}] 用了 ${[...new Set(elephants)].join(',')} —— 该文化区（${region}）史实不该有战象`); fail++; }
    else console.log(`  ✅ ${legion}：[${row.age}] ${[...new Set(elephants)].join(',')}（${region}）`);
  }
  if (!eleChecked) console.log('  （真表里没有任何用象的编成）');

  // ② 象的时代不可早产：**古典档（–400）不许有象**（那时没有把象当攻城器械的用法）。
  //    ⚠️ [2026-10-05 自校修正] 我第一版写成「象只许城堡/帝国档」——错的：
  //      真表把 `ballista_elephant` 定位在 **feudal（400–1050）**，而东南亚/南亚用战象是**贯穿封建到帝国**的
  //      （高棉、蒲甘、占婆、朱罗皆然），故封建档有象**合法**；只有古典档才算早产。
  console.log('\n象的时代档位（古典档不许早产）：');
  const early = [...LEGIONS].filter(([, r]) => r.weapons.some((w) => /elephant/.test(w)) && r.age === 'antiquity');
  if (early.length) {
    for (const [k, r] of early) { console.log(`  🔴 ${k}：[${r.age}] 有象 —— 古典档不该把象当攻城器械`); fail++; }
  } else console.log('  ✅ 没有任何古典档编成使用战象（封建/城堡/帝国档允许）');

  // ③ 音效接线
  //   🔴 [2026-08-24] 两条硬标准：
  //     a) 撞击声必须挂在**命中相位**（ph>=3 + 本轮一次），不得每帧调用——
  //        写在 `if (m.lock <= 0)` 块外会让攻城武器**走向城墙的路上**就一直响（第一版就是这么错的）。
  //     b) siege_impact 必须是 DE 原声文件（主人 2026-08-24「必须和 DE 一样」）。
  console.log('\n攻城武器音效：');
  const AM = readFileSync('src/audio/AudioManager.ts', 'utf8');
  if (!/siege_impact/.test(AM) || !/siege_launch/.test(AM)) {
    console.log('  🔴 AudioManager 里没有 siege_impact / siege_launch'); fail++;
  } else console.log('  ✅ AudioManager 已定义 siege_impact / siege_launch');

  const deSrc = /siege_impact:\s*sound\('battle',\s*'(\w+)'/.exec(AM)?.[1] ?? null;
  if (deSrc !== 'siege_impact_de') {
    console.log(`  🔴 siege_impact 不是 DE 原声（当前 ${deSrc ?? '多源/借用'}）`); fail++;
  } else {
    const f = 'public/sfx/siege_impact_de.aud';
    if (!existsSync(f)) { console.log(`  🔴 ${f} 不存在`); fail++; }
    else {
      const head = readFileSync(f).subarray(0, 4).toString('latin1');
      if (head !== 'OggS') { console.log(`  🔴 ${f} 不是 ogg（头部 ${head}）`); fail++; }
      else console.log(`  ✅ siege_impact = DE 原声 ${f}（ogg, ${readFileSync(f).length} 字节）`);
    }
  }

  // 撞击：重械（冲车/攻城锤/装甲象）在命中相位出声
  if (!/m\.siegeW && isHeavyNonBlade && !m\.slashed && m\.ph >= 3[\s\S]{0,160}?audioManager\.play\('siege_impact'\)/.test(SRC)) {
    console.log('  🔴 撞击声没挂在命中相位（应为 m.siegeW && isHeavyNonBlade && !m.slashed && m.ph >= 3）'); fail++;
  } else console.log('  ✅ 冲车/攻城锤/装甲象：撞击声在命中相位（与刀光同相 ph>=3，本轮一次）');

  // 发射：远程攻城器械与弹丸同相位
  if (!/m\.shot = true;[\s\S]{0,400}?if \(m\.siegeW\) audioManager\.play\('siege_launch'\)/.test(SRC)) {
    console.log('  🔴 发射声没挂在弹丸相位（应紧跟 m.shot = true）'); fail++;
  } else console.log('  ✅ 投石车/弩炮/火箭车：发射声与弹丸同相位射出');

  // 防回归：不得回到每帧调用
  if (/m\.atkSt = m\.st;[^;]*?if \(m\.siegeW\)/.test(SRC)) {
    console.log('  🔴 音效又写回了 m.atkSt = m.st 后面（块外每帧调用）'); fail++;
  } else console.log('  ✅ 没有每帧调用（走向城墙的路上不会响）');

  // ④ 中国系攻城投石槽 = 牵引抛石机（主人 2026-08-26 定「中国的文化要加上牵引抛石机」）
  //   依据：砲（牵引抛石机）是中国战国到宋元的攻城主力；火箭车是明代的东西，且 rng 280、对建筑仅 +5，砸不动墙。
  //   非中国区不得被误改（高丽的火箭车线是史实，别顺手一起换了）。
  //
  // 🔴 [2026-10-05 修尺子] 原判据查的是 `Scene13WarLayer.ts` 里的 `SIEGE_TECH_BY_CULTURE` +
  //    `SIEGE_MANGONEL_LINE` —— 实测那两张表**全库只有本脚本读它们，游戏一行都不读**（死表），
  //    而且里面写的是 `battering_ram / mangonel` 这种旧 key，与真表 key 体系不同；
  //    于是「中国系没落地」这个红，指的是两张死表，而**真正在跑的** `src/data/SiegeWeaponsByCulture.ts`
  //    里中国系早就用上牵引抛石机了（如「古典时代华夏巴蜀军团」＝牵引投石机×4）。
  //    现改为**直接查真表**：真源 = `getSiegeWeaponsForCulture` 用的 `LEGION_78_SIEGE_MAP`（main 顶部已解析）。
  console.log('\n中国系攻城投石槽（查真表 SiegeWeaponsByCulture.ts）：');
  const weaponsOf = new Map<string, string[]>([...LEGIONS].map(([k, v]) => [k, v.weapons]));
  // 中国系军团 = 真表里所有名字含这些字样的编成（母体「东亚军团」＋各二级/三级中国系军团）
  const CN_NAME_RE = /东亚|华夏|中原|北方|江南|岭南|巴蜀|河西|东北|大理|南诏|宋|明|清|唐|汉|魏|吴|蜀|辽|金|高丽|朝鲜/;
  let cnBad = 0, cnChecked = 0;
  const cnBadList: string[] = [];
  for (const [key, ws] of weaponsOf) {
    if (!CN_NAME_RE.test(key)) continue;
    // ⚠️ 误伤排除（自校抓到）：`东北欧军团` 是**东北欧＝斯拉夫**，不是中国东北 ——
    //    名字里含「东北」二字会被上一条命中。凡带「欧」字的一律不算中国系（东北欧/东南欧/中欧…）。
    if (/欧/.test(key)) continue;
    if (/高丽|朝鲜/.test(key)) continue;   // 高丽/朝鲜走火箭车线（신기전 火车），另判
    cnChecked++;
    // 中国系投石槽必须全是牵引抛石机：列表里**不许**出现通用投石车（mangonel/onager/siege_onager）
    const bad = ws.filter((w) => ['mangonel', 'onager', 'siege_onager'].includes(w));
    if (bad.length) { cnBadList.push(`${key}（混入 ${[...new Set(bad)].join(',')}）`); cnBad++; fail++; }
  }
  if (cnBad === 0) console.log(`  ✅ 中国系 ${cnChecked} 条编成全部用牵引抛石机（砲），无通用投石车混入`);
  else console.log(`  🔴 这些中国系编成混进了通用投石车：${cnBadList.join('；')}`);
  // 高丽的火箭车线是史实（신기전 火车），不许被顺手一起换
  const koreaKeys = [...weaponsOf.keys()].filter((k) => k.startsWith('高丽') || k.startsWith('朝鲜'));
  const koreaRocket = koreaKeys.filter((k) => (weaponsOf.get(k) ?? []).some((w) => w.includes('rocket_cart')));
  if (koreaKeys.length && !koreaRocket.length) {
    console.log(`  🔴 高丽/朝鲜系（${koreaKeys.join('、')}）已无火箭车 —— 高丽火箭车线（신기전 火车）是史实，别跟着中国一起换`);
    fail++;
  } else if (koreaKeys.length) {
    console.log(`  ✅ 高丽/朝鲜系仍保留火箭车线（신기전 火车，史实）：${koreaRocket.slice(0, 3).join('、')}${koreaRocket.length > 3 ? ' 等' : ''}`);
  }

  // ⑤ 尺子自校（血训 23：凡 includes/正则判据，先拿正反例各一条自校再判数据）
  //   本脚本第 ④ 段用「名字族」认中国系，实测**咬过自己两次**：
  //     · `东北欧军团`（东北欧＝斯拉夫）被「东北」命中；
  //     · `西北`/`东北` 之类的地区名天然带方位词。
  //   下面这组正反例每次运行都跑一遍 —— 判据一旦被改坏，这里立刻报红，不会静默误判数据。
  console.log('\n尺子自校（中国系判据）：');
  const CN_SHOULD_HIT = ['东亚军团_castle', '古典时代华夏巴蜀军团', '城堡时代宋禁军团', '大理军团', '南诏军团', '大明神机箭军团', '东北军团'];
  const CN_SHOULD_NOT = ['东北欧军团_castle', '东南欧军团_castle', '西欧军团_castle', '高丽禁卫军团', '帝国时代朝鲜军团'];
  let selfBad = 0;
  for (const k of CN_SHOULD_HIT) if (!CN_NAME_RE.test(k) || /欧/.test(k)) { console.log(`  🔴 正例「${k}」没被判为中国系`); selfBad++; }
  for (const k of CN_SHOULD_NOT) {
    const isCn = CN_NAME_RE.test(k) && !/欧/.test(k) && !/高丽|朝鲜/.test(k);
    if (isCn) { console.log(`  🔴 反例「${k}」被误判成中国系`); selfBad++; }
  }
  if (selfBad) fail++;
  else console.log(`  ✅ 正例 ${CN_SHOULD_HIT.length} 条全命中（含真中国东北「东北军团」）、反例 ${CN_SHOULD_NOT.length} 条全放行（含东北欧/东南欧）`);

  if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
  console.log('\n✅ 全部符合');
}
main();
