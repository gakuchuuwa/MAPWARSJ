/**
 * 立绘调校数据「只增不删」的验收（防回归）。
 *
 * 🔴 [2026-08-26 主人拍板]
 *    「立绘调整好缩放大小和位置以后，如果取消立绘的话，就会复原，导致下次再用还要重调，
 *      我调一次不容易，而且都是手动调整的，请改为调整好后，**除非删除了这张图，再也没有了，
 *      不然不要乱改**。」「以前就说过这个问题，记住了，不要总让我跳来跳去的。」
 *
 *    根因：PortraitTuner 每次打开都跑 `cleanOrphanAdjustKeys()`，把「不在 catalog 快照里」
 *    的调校键删掉并**写盘**。判据是「图片当前在不在目录快照里」而不是「这张图是不是真没了」——
 *    改名场景一堆（F2 换图、tuner 绑图、dev 启动三层分类、旧立绘转闲置），
 *    任何一条迁移没跟上、或 catalog 有一丝不全，手调就被永久抹掉。
 *
 *    现在改成 `reportOrphanAdjustKeys()`：只在控制台列出，**绝不写盘、绝不 delete**。
 *    图哪天改名回来或从备份恢复，调校自动重新生效。
 *
 * 跑法：npx tsx tools/audit-portrait-adjust-never-deleted.mts
 */
import { readFileSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const TUNER = readFileSync('src/portrait-tuner/main.ts', 'utf8');

console.log('PortraitTuner 的孤儿处理：');

// ① 旧的清理函数不许回来
if (/cleanOrphanAdjustKeys/.test(TUNER)) {
    bad('cleanOrphanAdjustKeys 又出现了 —— 那个函数会把手调永久写盘删掉');
} else ok('没有 cleanOrphanAdjustKeys');

// ② 必须有只报告的版本
if (!/async function reportOrphanAdjustKeys/.test(TUNER)) {
    bad('缺 reportOrphanAdjustKeys —— 孤儿至少要在控制台留痕');
} else ok('有 reportOrphanAdjustKeys（只报告）');

// ③ 报告函数体内不得有任何删除或写盘
const body = /async function reportOrphanAdjustKeys\(\)[\s\S]*?\n\}/.exec(TUNER)?.[0] ?? '';
if (!body) {
    bad('找不到 reportOrphanAdjustKeys 函数体');
} else {
    if (/delete\s+adjustData\.images|delete\s+payload\.images/.test(body)) {
        bad('报告函数里又开始 delete 调校键了');
    } else ok('函数体内没有任何 delete');
    if (/save-portrait-adjust/.test(body)) {
        bad('报告函数里又开始写盘了（save-portrait-adjust）');
    } else ok('函数体内不写盘');
}

// ④ 全文件不得再有「按 catalog 判定后批量删键」的模式
const wholeFileDeletes = TUNER.match(/delete\s+adjustData\.images\[[^\]]+\]/g) ?? [];
if (wholeFileDeletes.length > 0) {
    bad(`main.ts 里还有 ${wholeFileDeletes.length} 处删调校键：${wholeFileDeletes.join(', ')}`);
} else ok('main.ts 全文件没有删调校键的代码');

// ⑤ 数据本身还在（防止哪次误操作把表清空）
const DATA = readFileSync('src/data/portrait_adjust.ts', 'utf8');
const imgKeys = (DATA.match(/"\/assets\/[^"]+\.png"\s*:/g) ?? []).length;
const folderKeys = (DATA.match(/"\/assets\/[^"]+\/"\s*:/g) ?? []).length;
console.log('\n调校数据现状：');
// 🔴 下限是护栏不是目标：2026-08-26 实测 1323 张单张 + 28 个文件夹默认。
//    真要批量删图导致大幅下降，应该是主人明确要求的操作，那时改这个数；
//    平白无故掉到 1000 以下 = 又有什么东西在偷偷清表。
if (imgKeys < 1000) {
    bad(`单张调校只剩 ${imgKeys} 条（2026-08-26 基线 1323）—— 有东西在清表`);
} else ok(`单张调校 ${imgKeys} 条 / 文件夹默认 ${folderKeys} 条（基线 1323 / 28）`);

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合 —— 手调只增不删');
