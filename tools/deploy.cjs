/**
 * 手动发布到 Vercel 生产环境：`npm run deploy`
 *
 * 2026-09-08 起每日自动部署已关（auto_backup.cjs 的 AUTO_DEPLOY_ENABLED=false），
 * 发布改为手动触发。部署成功后自动清理旧部署，存储占用封顶。
 * 超时给 25 分钟 —— 本项目部署实测 8~9 分钟，设 8 分钟会在临门一脚被杀掉。
 */
const { exec } = require('child_process');
const { pruneOldDeployments } = require('./vercel_prune.cjs');

console.log('[Deploy] 开始发布生产版本（实测约 8~9 分钟，请耐心等待）...');
const started = Date.now();

exec('npx vercel deploy --prod --yes --archive=tgz', { timeout: 25 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    if (err) {
        console.error(`[Deploy] ❌ 发布失败（耗时 ${mins} 分钟）: ${err.message}`);
        process.exitCode = 1;
        return;
    }
    const urlLine = (stdout || '').split('\n').reverse().find((l) => l.includes('vercel.app')) || '';
    console.log(`[Deploy] ✅ 发布完成（耗时 ${mins} 分钟）。${urlLine.trim()}`);
    pruneOldDeployments();
});
