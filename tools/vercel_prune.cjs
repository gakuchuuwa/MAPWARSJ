/**
 * Vercel 旧部署清理 —— auto_backup.cjs 与 tools/deploy.cjs 共用。
 *
 * 2026-09-08 事故背景：auto_backup 给 CLI 设的超时（8 分钟）比实际部署时长（8~9 分钟）短，
 * 每次都被超时杀掉、不写状态文件，于是每 30 分钟重发一次，6 天堆出 379 个生产部署，
 * 把 Vercel 免费版 10GB Deployment Storage 撑爆。单次部署实测 6158MB / 44217 文件。
 * 保留数封顶后，存储占用就不再随时间无限涨。
 */
const { exec } = require('child_process');

/** 生产部署保留几个（含刚发布的那个）。 */
const KEEP_DEPLOYMENTS = 2;

/**
 * 保留最新 keep 个生产部署，其余逐个删除。
 * 逐个删而不是批量传参 —— 批量时一个失效会让整批连坐失败（2026-09-08 实测 60 个连坐）。
 * @param {number} keep 保留数量
 * @param {(summary: {ok: number, ng: number, total: number}) => void} [onDone]
 */
function pruneOldDeployments(keep = KEEP_DEPLOYMENTS, onDone) {
    exec('npx vercel ls --yes', { timeout: 3 * 60 * 1000, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
            console.error(`[Vercel-Prune] 拉取部署列表失败，本次跳过清理: ${err.message}`);
            if (onDone) onDone({ ok: 0, ng: 0, total: 0 });
            return;
        }
        const seen = new Set();
        const ordered = (stdout || '').split('\n')
            .map((l) => (l.match(/https:\/\/[a-z0-9-]+\.vercel\.app/) || [])[0])
            .filter(Boolean)
            .filter((u) => (seen.has(u) ? false : seen.add(u)));   // 保序去重，最新在前
        const doomed = ordered.slice(keep);
        if (!doomed.length) {
            console.log(`[Vercel-Prune] 部署数 ${ordered.length} 个，未超过保留上限 ${keep}，无需清理。`);
            if (onDone) onDone({ ok: 0, ng: 0, total: 0 });
            return;
        }
        console.log(`[Vercel-Prune] 保留最新 ${keep} 个，待删 ${doomed.length} 个...`);
        let i = 0, ok = 0, ng = 0;
        const next = () => {
            if (i >= doomed.length) {
                console.log(`[Vercel-Prune] 清理完成：删除 ${ok} 个，失败 ${ng} 个。`);
                if (onDone) onDone({ ok, ng, total: doomed.length });
                return;
            }
            const url = doomed[i++];
            exec(`npx vercel remove ${url} --yes`, { timeout: 2 * 60 * 1000 }, (rmErr) => {
                if (rmErr) ng++; else ok++;
                next();
            });
        };
        next();
    });
}

module.exports = { pruneOldDeployments, KEEP_DEPLOYMENTS };
