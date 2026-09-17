/**
 * 闸门：战术模式双方编队数**永远 9**。  npm run scene13:nine-lanes
 *
 * 🔴 [2026-09-15 主人原话]「任何时候双方都必须是 9 支军队，永远是 9」。
 * 查三件结构性前提，任一不成立，运行期就不可能恒为 9：
 *   ① 七种阵型的 LAYOUT 表每种正好 9 口；
 *   ② 编制展开的闸门仍然只放行 9（slotsOf 里的 `types.length === 9`），兜底集也是 9 口；
 *   ③ setupPlayerUnits 里玩家**既不顶替也不新增**：玩家永远不能改变军团兵种（2026-09-18 主人纠正）。
 * 运行期还有一道：start() 里按 SIDE_LANES 校验两方口数，不是 9 会在控制台点名并落诊断。
 */
import fs from 'fs';
const P = 'src/ui/Scene13WarLayer.ts';
const src = fs.readFileSync(P, 'utf-8');
let fail = 0;
const ok = (m) => console.log('  \u2705 ' + m);
const bad = (m) => { fail++; console.log('  \u2717 ' + m); };

// ① LAYOUT 每种阵型 9 口
const li = src.indexOf('const LAYOUT');
const lj = src.indexOf(String.fromCharCode(10) + '};', li);
const layout = src.slice(li, lj);
console.log('① 阵型 LAYOUT 表每种 9 口');
const modes = [...layout.matchAll(/(\w+):\s*\[([\s\S]*?)\],[\r\n]/g)];
if (!modes.length) bad('没解析到 LAYOUT 表');
for (const m of modes) {
  const n = (m[2].match(/\{\s*col/g) || []).length;
  if (n === 9) ok(`${m[1]} = 9 口`); else bad(`${m[1]} = ${n} 口，应为 9`);
}

// ② 编制展开闸门
console.log('\n② 编制展开只放行 9 口');
if (/types\.length\s*===\s*9/.test(src)) ok('slotsOf 仍以 types.length === 9 为闸');
else bad('slotsOf 的「展开必须是 9 口」闸门不见了');
const fb = src.slice(src.indexOf('编制槽位派生失败'), src.indexOf('编制槽位派生失败') + 900);
const fbN = (fb.match(/\{\s*key:/g) || []).length;
if (fbN === 9) ok('兜底集 = 9 口'); else bad(`兜底集 = ${fbN} 口，应为 9`);

/* ③ 🔴 [2026-09-18 主人纠正] 本项判据整个反了，已改写。
 *    原判据要求代码里**存在**「玩家精锐顶替编制一口」的路径（takeOver.playerElite = true），
 *    可那条规则是 AI 从 12e「必须 9 支」反推出来的，主人原话从没允许过。
 *    主人原话：「玩家自带精锐顶替编制里的一口，胡说八道，**玩家永远不能改变军团的兵种**。」
 *    现在的正确判据：玩家**既不顶替也不新增**，13 里的 9 口就是军团自己的 9 口。 */
console.log('\n③ 玩家不得改变军团编制：既不顶替也不新增');
const si = src.indexOf('private setupPlayerUnits');
const sj = src.indexOf('\n    }', src.indexOf('playerSetup', si + 200));
const setup = src.slice(si, sj > si ? sj : si + 4000);
if (/takeOver\.playerElite\s*=\s*true/.test(setup)) bad('又出现「精锐顶替编制一口」——玩家永远不能改变军团兵种');
else ok('没有顶替路径（军团兵种不被玩家改写）');
const pushes = (setup.match(/this\.spawns\.push\(/g) || []).length;
if (pushes === 0) ok('没有任何 spawns.push（不新增第 10 口）');
else bad(`setupPlayerUnits 里有 ${pushes} 处 spawns.push，会给玩家额外增口`);
if (/setup\.eliteLane/.test(setup)) bad('仍在读 setup.eliteLane 参与编制构建');
else ok('编制构建不再读 eliteLane');

// 运行期闸门还在不在
console.log('\n④ 运行期校验');
if (/const SIDE_LANES = 9;/.test(src) && /编队数铁律被破坏/.test(src)) ok('start() 里按 SIDE_LANES 校验两方口数');
else bad('运行期的「永远是 9」校验不见了');

console.log(fail ? `\n\u2717 ${fail} 处不满足「双方永远 9 支军队」` : '\n\u2705 双方编队数恒为 9 的结构前提全部成立');
process.exit(fail ? 1 : 0);
