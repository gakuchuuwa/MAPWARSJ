/**
 * 从谷歌云盘把四张表取到本地 inbox/（用你自己已登录的 Chrome，不碰密码、不需要授权）。
 *
 * 用法：node tools/classic-briefings/fetch-sheets.mjs
 *
 * 做法：对每张表打开 `.../export?format=csv`，Chrome 用当前登录态下载到「下载」文件夹，
 * 本脚本等文件落地、按表头认出是哪一张，改名后放进 `tools/classic-briefings/inbox/`。
 * 之后跑 `npx tsx tools/classic-briefings/run-batch.mts` 即可。
 *
 * ⚠️ 四张表要逐张下（一次性连开多张，Google 会拒掉几张、返回「网页未找到」）。
 * ⚠️ 云盘上的表若重建过，ID 会变，改下面 SHEETS 里的 id 即可。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = 'Default';
const DL = join(process.env.USERPROFILE, 'Downloads');
const INBOX = join('tools', 'classic-briefings', 'inbox');

/** 云盘上四张表（文件夹「经典战播报任务」） */
const SHEETS = [
    { id: '1cFX0n165FSbsD3K3IlkbNelFizadEENv0W60sqU5P_8', name: '经典战·新增势力表' },
    { id: '1U2pSYbR-k1Q0dHshKUN18Dn9exsgnX4Z5wtBftU7row', name: '经典战·史实定稿表' },
    { id: '1j8MuGNWVhbTHjckU3T1D_oU3npxt3-SdyzdQJOqjZnY', name: '经典战播报·回填表' },
    { id: '15nrOlBVcRFvnrxbfLoiP21_Pg9Do5NjgMQHpPuFGw9k', name: '经典战补选·回填表' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 按表头认表（与 run-batch.mts 同一口径），认不出就按给的名字 */
function classify(file) {
    const head = readFileSync(file, 'utf8').replace(/^\ufeff/, '').split(/\r?\n/, 1)[0] ?? '';
    if (head.includes('势力编号')) return '经典战·新增势力表';
    if (head.includes('项目') && head.includes('定值')) return '经典战·史实定稿表';
    if (head.includes('会面台词')) return '经典战补选·回填表';
    if (head.includes('战略播报')) return '经典战播报·回填表';
    return null;
}

const csvNow = () => new Set(readdirSync(DL).filter((f) => /\.csv$/i.test(f)).map((f) => `${f}|${statSync(join(DL, f)).size}`));

mkdirSync(INBOX, { recursive: true });
let got = 0;
for (const sheet of SHEETS) {
    const before = csvNow();
    const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv`;
    console.log(`↓ ${sheet.name} …`);
    spawn(CHROME, [`--profile-directory=${PROFILE}`, url], { detached: true, stdio: 'ignore' }).unref();
    let landed = null;
    for (let i = 0; i < 30; i++) {          // 最多等 30 秒
        await sleep(1000);
        const fresh = readdirSync(DL).filter((f) => /\.csv$/i.test(f) && !before.has(`${f}|${statSync(join(DL, f)).size}`));
        if (fresh.length) { landed = join(DL, fresh[0]); break; }
    }
    if (!landed || !existsSync(landed)) { console.log(`  ✗ 没下来（表可能改了 ID、或没有权限）`); continue; }
    const kind = classify(landed) ?? sheet.name;
    const target = join(INBOX, `${kind}.csv`);
    renameSync(landed, target);
    console.log(`  ✓ ${kind}.csv（${(statSync(target).size / 1024).toFixed(0)} KB）`);
    got++;
}
console.log(`\n取到 ${got} / ${SHEETS.length} 张 → ${INBOX}`);
if (got < SHEETS.length) process.exitCode = 2;
