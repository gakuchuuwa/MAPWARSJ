import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';

// F2 立绘写盘后短暂拦截 Vite 整页 full-reload（Esc 保存不打断对局）
let portraitDevSuppressReloadUntil = 0;
function markPortraitDevWrite(): void {
    portraitDevSuppressReloadUntil = Date.now() + 8000;
}

// ============================================================
// [NEW 2026-05-29] 自动 git 备份: 一天 1 次
//   策略:
//     - vite 启动时立即检查 (你每天至少开一次 vite, 就能保证每天 1 commit)
//     - 持续运行时每小时再检查一次 (vite 不重启也安全)
//     - 距离上次 commit < 23 小时 → 静默跳过
//     - >= 23 小时 → git add -A + git commit
//   失败不影响 vite (git 没装/锁/无变化 等情况静默忽略)
// ============================================================
function dailyBackupCheck(): void {
    execFile('git', ['log', '-1', '--format=%ct'], { cwd: __dirname }, (err, stdout) => {
        if (err) {
            console.warn('[AutoBackup] git log 失败, 可能仓库未初始化:', err.message);
            return;
        }
        const lastCommitSec = parseInt(stdout.trim()) || 0;
        const nowSec = Math.floor(Date.now() / 1000);
        const hoursSince = (nowSec - lastCommitSec) / 3600;
        if (hoursSince < 23) {
            console.log(`[AutoBackup] 上次 commit ${hoursSince.toFixed(1)} 小时前, 跳过 (< 23 小时)`);
            return;
        }
        // 距离上次 commit >= 23 小时, 做一次
        const msg = `auto-daily: ${new Date().toISOString().slice(0, 10)}`;
        execFile('git', ['add', '-A'], { cwd: __dirname }, (addErr) => {
            if (addErr) { console.warn('[AutoBackup] git add failed:', addErr.message); return; }
            execFile('git', ['commit', '-m', msg, '--no-verify'], { cwd: __dirname }, (commitErr, out) => {
                if (commitErr) {
                    if (!commitErr.message.includes('nothing to commit')) {
                        console.warn('[AutoBackup] git commit failed:', commitErr.message);
                    } else {
                        console.log('[AutoBackup] 距上次 commit > 23h 但文件无变化, 跳过');
                    }
                } else {
                    console.log(`✅ [AutoBackup] 每日备份完成: ${msg}\n   ${out.split('\n')[0]}`);
                }
            });
        });
    });
}

export default defineConfig({
    // [PERF] Pre-bundle heavy deps eagerly so first page request isn't blocked
    // by on-demand prebundling of leaflet + pinyin-pro.
    optimizeDeps: {
        include: ['leaflet', 'pinyin-pro'],
    },
    server: {
        // F2 写盘数据文件 + 城市/势力数据：不触发 HMR 整页刷新，改完后手动 F5
        watch: {
            ignored: [
                '**/src/data/portrait_adjust.ts',
                '**/src/data/FactionGenerals.ts',
                '**/src/data/factions.ts',
                '**/src/data/SandboxDisplayNames.ts',
                '**/src/app/GameApp.ts',
                '**/src/assets/CityAssetManager.ts',
                '**/public/assets/**',
            ],
        },
        // [PERF] Warm up the most expensive modules on dev server start
        // so the browser's first request hits a ready cache.
        warmup: {
            clientFiles: [
                './src/main.ts',
                './src/app/GameApp.ts',
                './src/world/CityManager.ts',
                './src/roads/RoadRegistry.ts',
                './src/data/VectorRoadData.ts',
                './src/data/cities_v2.ts',
                './src/data/factions.ts',
            ],
        },
    },
    plugins: [
        {
            // 立绘清单虚拟模块：扫描 public/assets 生成「纯路径数组」供 portrait_defaults 用。
            // 取代旧的 import.meta.glob('?url')——后者会把每张图字节也打包一遍（dist 多出 700 张
            // hash 重复图 / +718MB 废重量），而代码只需文件名列表，运行时仍走 /assets/.. 原图。
            name: 'portrait-manifest',
            resolveId(id) {
                if (id === 'virtual:portrait-manifest') return '\0virtual:portrait-manifest';
                return null;
            },
            load(id) {
                if (id !== '\0virtual:portrait-manifest') return null;
                const root = path.resolve(__dirname, 'public/assets');
                const walk = (dir: string): string[] => {
                    const out: string[] = [];
                    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                        const fp = path.join(dir, ent.name);
                        if (ent.isDirectory()) out.push(...walk(fp));
                        else if (ent.isFile() && ent.name.toLowerCase().endsWith('.png')) {
                            out.push('/assets/' + path.relative(root, fp).split(path.sep).join('/'));
                        }
                    }
                    return out;
                };
                const paths = fs.existsSync(root) ? walk(root) : [];
                return `export default ${JSON.stringify(paths)};`;
            },
        },
        {
            // 给音频/OGG 文件设置正确 MIME，防止 IDM 等下载器拦截
            name: 'audio-mime-fix',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url && (req.url.endsWith('.ogg') || req.url.includes('.ogg?'))) {
                        res.setHeader('Content-Type', 'audio/ogg');
                        res.setHeader('X-Content-Type-Options', 'nosniff');
                    }
                    next();
                });
            },
        },
        {
            name: 'suppress-portrait-dev-hmr',
            configureServer(server) {
                const origSend = server.ws.send.bind(server.ws);
                server.ws.send = (payload: unknown) => {
                    if (
                        typeof payload === 'object'
                        && payload !== null
                        && (payload as { type?: string }).type === 'full-reload'
                        && Date.now() < portraitDevSuppressReloadUntil
                    ) {
                        console.log('[PortraitDev] 已拦截 F2 写盘触发的整页刷新');
                        return;
                    }
                    origSend(payload);
                };
            },
            handleHotUpdate({ file }) {
                const norm = file.replace(/\\/g, '/');
                if (
                    norm.includes('portrait_adjust.ts')
                    || norm.includes('FactionGenerals.ts')
                    || norm.includes('cities_v2.ts')
                    || (norm.includes('/public/assets/') && norm.endsWith('.png'))
                ) {
                    return [];
                }
            },
        },
        {
            name: 'save-roads-api',
            configureServer(server) {
                // [AutoBackup] vite 启动时立即检查 1 次, 之后每小时再检查
                // 实际只在距离上次 commit >= 23 小时时才真正 commit
                dailyBackupCheck();
                setInterval(dailyBackupCheck, 60 * 60 * 1000); // 每小时

                server.middlewares.use('/api/save-roads', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }

                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const filePath = path.resolve(__dirname, 'src/data/VectorRoadData.ts');
                            fs.writeFileSync(filePath, body, 'utf-8');
                            const bytes = Buffer.byteLength(body, 'utf-8');
                            console.log(`✅ [SaveRoads] Saved ${bytes} bytes to ${filePath}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, bytes }));
                        } catch (err: any) {
                            console.error(`❌ [SaveRoads] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // Also handle save-events API
                server.middlewares.use('/api/save-events', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }

                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const filePath = path.resolve(__dirname, 'src/data/events.ts');
                            fs.writeFileSync(filePath, body, 'utf-8');
                            const bytes = Buffer.byteLength(body, 'utf-8');
                            console.log(`✅ [SaveEvents] Saved ${bytes} bytes to ${filePath}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, bytes }));
                        } catch (err: any) {
                            console.error(`❌ [SaveEvents] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // [REMOVED 2026-05-29] /api/save-faction (单条保存) 废弃, 用 /api/batch-import 即可
                // ========================================================
                // [NEW 2026] /api/batch-import
                //   批量导入：粘贴文本 → 自动识别新建/修改 → 写5个文件
                //   每行格式: 势力，XXX，据点：XXX，坐标：XX, XX
                // ========================================================
                server.middlewares.use('/api/batch-import', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }

                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const results = batchImportFiles(data.entries);
                            const errCount = results.filter((r: any) => !r.ok).length;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: errCount === 0, results }));
                            console.log(`[BatchImport] ${data.entries.length} entries: ${results.length - errCount}/${results.length} OK`);
                        } catch (err: any) {
                            console.error(`❌ [BatchImport] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-05-29] /api/batch-delete
                //   批量删除: 把指定 factionId 从 4 个注册表全删, cityId 从 cities_v2 删
                //   body: { targets: [{ factionId?: string, cityId?: string }, ...] }
                // ========================================================
                server.middlewares.use('/api/batch-delete', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const results = batchDeleteFiles(data.targets || []);
                            const errCount = results.filter((r: any) => !r.ok).length;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: errCount === 0, results }));
                            console.log(`[BatchDelete] ${data.targets.length} targets: ${results.length - errCount}/${results.length} OK`);
                        } catch (err: any) {
                            console.error(`❌ [BatchDelete] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-06-01] /api/save-culture-formations
                //   保存某个文化的兵种阵型配置
                //   body: { culture: string, slots: any[] }
                // ========================================================
                server.middlewares.use('/api/save-culture-formations', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const filePath = path.resolve(__dirname, 'src/types/CultureFormations.ts');
                            let text = fs.readFileSync(filePath, 'utf-8');
                            text = serverReplaceTierBlock(text, data.culture, data.slots);
                            if (data.formationMode) {
                                text = serverReplaceFormationMode(text, data.culture, data.formationMode);
                            }
                            fs.writeFileSync(filePath, text, 'utf-8');
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true }));
                            console.log(`[SaveCulture] ✅ ${data.culture} saved to CultureFormations.ts`);
                        } catch (err: any) {
                            console.error(`❌ [SaveCulture] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-06-13] 立绘显示调校 portrait_adjust.ts
                // ========================================================
                const portraitAdjustPath = path.resolve(__dirname, 'src/data/portrait_adjust.ts');

                server.middlewares.use('/api/portrait-adjust', (req, res) => {
                    if (req.method !== 'GET') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    try {
                        const text = fs.readFileSync(portraitAdjustPath, 'utf-8');
                        const data = serverParsePortraitAdjustExport(text);
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                server.middlewares.use('/api/portrait-catalog', (req, res) => {
                    if (req.method !== 'GET') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    try {
                        const catalog = serverBuildPortraitCatalog(path.resolve(__dirname, 'public/assets'));
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(catalog));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                server.middlewares.use('/api/save-portrait-adjust', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const payload = JSON.parse(body);
                            // backup:true 由前端自动写盘（每 10 张）时附带
                            const { backup: makeBackup, ...data } = payload as { backup?: boolean; [k: string]: unknown };
                            const content = serverFormatPortraitAdjustFile(data);
                            fs.writeFileSync(portraitAdjustPath, content, 'utf-8');
                            markPortraitDevWrite();
                            let backupFile: string | undefined;
                            if (makeBackup) {
                                const backupDir = path.resolve(__dirname, 'src/data/portrait_adjust_backups');
                                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                                const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHmm
                                backupFile = path.join(backupDir, `portrait_adjust_${ts}.ts`);
                                fs.copyFileSync(portraitAdjustPath, backupFile);
                                console.log(`📦 [PortraitAdjust] Backup → ${backupFile}`);
                            }
                            console.log(`✅ [PortraitAdjust] Saved to ${portraitAdjustPath}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, backupFile }));
                        } catch (err: any) {
                            console.error(`❌ [PortraitAdjust] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                const publicAssetsRoot = path.resolve(__dirname, 'public/assets');
                const factionGeneralsPath = path.resolve(__dirname, 'src/data/FactionGenerals.ts');
                const portraitCanonicalPath = path.resolve(__dirname, 'src/config/portrait_canonical.ts');

                server.middlewares.use('/api/portrait-inbox', (req, res) => {
                    if (req.method !== 'GET') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    try {
                        const images = serverListPortraitInbox(publicAssetsRoot);
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, images }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                server.middlewares.use('/api/portrait-picker-catalog', (req, res) => {
                    if (req.method !== 'GET') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    try {
                        const catalog = serverBuildPortraitPickerCatalog(publicAssetsRoot);
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, catalog }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                server.middlewares.use('/api/bind-general-portrait', (req, res) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
                        return;
                    }
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const payload = JSON.parse(body) as {
                                generalId?: string;
                                sourcePath?: string;
                                targetFolder?: string;
                            };
                            const generalId = payload.generalId?.trim();
                            const sourcePath = payload.sourcePath?.trim();
                            const targetFolder = payload.targetFolder?.trim();
                            if (!generalId || !sourcePath) {
                                throw new Error('缺少 generalId 或 sourcePath');
                            }
                            const result = serverBindGeneralPortrait(
                                publicAssetsRoot,
                                factionGeneralsPath,
                                portraitCanonicalPath,
                                generalId,
                                sourcePath,
                                targetFolder,
                            );
                            markPortraitDevWrite();
                            console.log(`✅ [BindPortrait] ${generalId} ← ${sourcePath} → ${result.portraitPath}`);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, ...result }));
                        } catch (err: any) {
                            console.error(`❌ [BindPortrait] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });
            }
        }
    ]
});

// ============================================================
// [NEW 2026] 服务端文件写入辅助 (Node.js)
// [REMOVED 2026-05-29] saveFactionFiles / FactionData / InsertResult 已废弃
//                      单条流程整体迁移到 /api/batch-import (1 条也能用批量)
// ============================================================

/** 在文件中找 keyword 后的 = [ 或 = {，在其匹配的闭合括号前插入新行。
 *  自动匹配 CRLF / LF。同 FactionEditor.insertIntoStructure，但服务端版本。 */
function serverInsertIntoStructure(text: string, keyword: string, line: string, indent: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`文件中找不到关键字 "${keyword}"`);

    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    const eqArr = text.indexOf('= [', kwIdx);
    const eqObj = text.indexOf('= {', kwIdx);

    let openIdx: number, openCh: string, closeCh: string;
    if (eqArr !== -1 && (eqObj === -1 || eqArr < eqObj)) {
        openIdx = eqArr + 2; openCh = '['; closeCh = ']';
    } else if (eqObj !== -1) {
        openIdx = eqObj + 2; openCh = '{'; closeCh = '}';
    } else {
        throw new Error(`关键字 "${keyword}" 后找不到 '= [' 或 '= {'`);
    }

    let depth = 0, closeIdx = -1;
    for (let i = openIdx; i < text.length; i++) {
        if (text[i] === openCh) depth++;
        else if (text[i] === closeCh) {
            depth--;
            if (depth === 0) { closeIdx = i; break; }
        }
    }
    if (closeIdx === -1) throw new Error(`找不到匹配的 ${closeCh}`);

    let scan = closeIdx - 1;
    while (scan > 0 && /\s/.test(text[scan])) scan--;
    const lastCh = text[scan];
    const needsComma = lastCh !== ',' && lastCh !== openCh;
    const newSegment = `${needsComma ? ',' : ''}${lineEnding}${indent}${line}`;
    return text.slice(0, scan + 1) + newSegment + text.slice(scan + 1);
}

// ============================================================
// [NEW] 批量导入辅助 (供 /api/batch-import 使用)
// ============================================================

interface BatchEntry {
    factionName: string;
    flagText: string;
    cityName: string;
    lat: number;
    lng: number;
    factionId: string;
    cityId: string;
    /** 若需先删冲突据点再新建，传其 city_id */
    deleteExistingCityId?: string;
    /** 若为 true，强制添加（跳过50km邻近检查，新旧城都保留） */
    forceProximity?: boolean;
}

/** [2026-05-29] 据点名后缀 → type + troops 自动检测 (3 大类)
 *
 *  ┌─ 关隘 pass (10000 兵) ───────────────────────────────────────────┐
 *  │  关 (山海关/玉门关)、口 (古北口/居庸口)、塞 (萧关/鸡鹿塞)、         │
 *  │  陉 (井陉)、径 (子午径)、隘、堡 (公主堡/赤金堡)                    │
 *  ├─ 中城 medium_city (10000 兵) ───────────────────────────────────┤
 *  │  府 (太宰府/黄龙府)、京 (北京/平安京)、都 (大都/上都/京都)         │
 *  ├─ 小城/要塞 small_city (5000 兵, 默认) ─────────────────────────┤
 *  │  城/寨/卫/戍/镇/屯/站 等其他后缀, 以及无明确后缀的               │
 *  └────────────────────────────────────────────────────────────────┘
 */
function detectCityType(name: string): { type: string; troops: number } {
    // 关隘 (要塞通道)
    const passSuffixes = ['关', '口', '塞', '陉', '径', '隘', '堡'];
    if (passSuffixes.some(s => name.endsWith(s))) {
        return { type: 'pass', troops: 10000 };
    }
    // 中城 (国都/府治/大都市)
    const mediumSuffixes = ['府', '京', '都'];
    if (mediumSuffixes.some(s => name.endsWith(s))) {
        return { type: 'medium_city', troops: 10000 };
    }
    // 小城/要塞 (默认)
    return { type: 'small_city', troops: 5000 };
}

interface BatchFileResult {
    file: string;
    ok: boolean;
    operation: 'insert' | 'replace' | 'skip' | 'delete-existing' | 'insert-after-delete';
    error?: string;
}

/** 批量导入入口：处理所有条目，逐文件执行 insert 或 replace */
function batchImportFiles(entries: BatchEntry[]): BatchFileResult[] {
    const lineEnding = '\n'; // writeFileSync 会统一
    const results: BatchFileResult[] = [];
    const filesToWrite: Array<{ file: string; text: string }> = [];

    console.log(`[BatchImport] __dirname = ${__dirname}`);
    console.log(`[BatchImport] Received ${entries.length} entries:`, JSON.stringify(entries, null, 2));

    // 读取所有5个文件的当前内容
    const factionPath = path.resolve(__dirname, 'src/data/factions.ts');
    const citiesPath = path.resolve(__dirname, 'src/data/cities_v2.ts');
    const startingCapitalsPath = path.resolve(__dirname, 'src/data/StartingCapitals.ts');
    const camPath = path.resolve(__dirname, 'src/assets/CityAssetManager.ts');
    const sdnPath = path.resolve(__dirname, 'src/data/SandboxDisplayNames.ts');

    console.log(`[BatchImport] factionPath = ${factionPath}`);
    console.log(`[BatchImport] citiesPath = ${citiesPath}`);

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let citiesText = fs.readFileSync(citiesPath, 'utf-8');
    let startingCapitalsText = fs.readFileSync(startingCapitalsPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');

    // [2026-05-29 智能重排] REPLACE 先, NEW 后.
    //   现有城被 REPLACE (搬到新坐标) 必须先处理, 否则 NEW 条目 50km 检查会撞上 REPLACE 前的旧位置.
    //   例: "贵山城 搬走 + 忽毡 在原贵山城位置新加" - 必须先搬走贵山城, 忽毡 才不冲突.
    const initCitiesText = citiesText;
    const replaceEntries = entries.filter(e => initCitiesText.includes(`id: '${e.cityId}'`));
    const newEntries = entries.filter(e => !initCitiesText.includes(`id: '${e.cityId}'`));
    const orderedEntries = [...replaceEntries, ...newEntries];
    console.log(`[BatchImport] 智能重排: ${replaceEntries.length} REPLACE → ${newEntries.length} NEW (输入顺序 ${entries.length})`);

    for (const entry of orderedEntries) {
        const fId = entry.factionId;
        const cId = entry.cityId;
        const isNewCity = !citiesText.includes(`id: '${cId}'`);
        console.log(`[BatchImport] Entry ${entry.factionName}/${entry.cityName}: fId=${fId}, cId=${cId}, isNewCity=${isNewCity}, deleteExistingCityId=${entry.deleteExistingCityId}`);

        // ---- 先检查城操作是否能通过 ----
        // 如果城操作为新建且邻近检测不通过，跳过整个条目（不修改任何文本）
        if (isNewCity) {
            if (entry.deleteExistingCityId) {
                // 删除原城模式：验证目标城是否存在
                if (!citiesText.includes(`id: '${entry.deleteExistingCityId}'`)) {
                    results.push({ file: 'src/data/cities_v2.ts', ok: false, operation: 'skip',
                        error: `找不到要删除的据点: ${entry.deleteExistingCityId}` });
                    continue;
                }
            } else if (entry.forceProximity) {
                // 强制添加模式：跳过50km邻近检查，新旧城都保留
                console.log(`[BatchImport] 💪 Force add ${entry.cityName}, skipping proximity check`);
            } else {
                // 50km 邻近检查（在修改任何文件之前）
                const proximityIssues = serverCheckProximity(citiesText, entry.lat, entry.lng, cId);
                console.log(`[BatchImport] Proximity check for ${entry.cityName} (${entry.lat},${entry.lng}): ${proximityIssues.length} issues`, JSON.stringify(proximityIssues));
                if (proximityIssues.length > 0) {
                    results.push({ file: 'src/data/cities_v2.ts', ok: false, operation: 'skip',
                        error: `距 "${proximityIssues[0].name}" 仅 ${proximityIssues[0].km.toFixed(1)}km (< 50km)` });
                    console.log(`[BatchImport] ❌ SKIP ${entry.cityName}: proximity issue`);
                    continue; // 跳过整个条目，不修改任何文本
                }
            }
        }

        // ---- 所有检查通过，开始修改文件 ----
        const isNewFaction = !factionText.includes(`id: '${fId}'`);

        // factions.ts
        const factionLine = `{ id: '${fId}', name: '${entry.factionName}' },`;
        if (isNewFaction) {
            factionText = serverInsertIntoStructure(factionText, 'FACTIONS', factionLine, '    ');
            results.push({ file: 'src/data/factions.ts', ok: true, operation: 'insert' });
        } else {
            factionText = serverReplaceArrayBlock(factionText, 'FACTIONS', 'id', fId, factionLine);
            results.push({ file: 'src/data/factions.ts', ok: true, operation: 'replace' });
        }

        // cities_v2.ts
        const { type: cityType, troops } = detectCityType(entry.cityName);
        const cityLine = `{ id: '${cId}', name: '${entry.cityName}', factionId: '${fId}', lat: ${entry.lat}, lng: ${entry.lng}, type: '${cityType}', troops: ${troops} },`;
        if (isNewCity) {
            if (entry.deleteExistingCityId) {
                try {
                    citiesText = serverDeleteCityBlock(citiesText, entry.deleteExistingCityId);
                    results.push({ file: 'src/data/cities_v2.ts', ok: true, operation: 'delete-existing' });
                } catch (e: any) {
                    results.push({ file: 'src/data/cities_v2.ts', ok: false, operation: 'skip',
                        error: `删除原据点失败: ${e.message}` });
                    continue;
                }
                citiesText = serverInsertIntoStructure(citiesText, 'CITIES_V2', cityLine, '    ');
                results.push({ file: 'src/data/cities_v2.ts', ok: true, operation: 'insert-after-delete' });
            } else {
                citiesText = serverInsertIntoStructure(citiesText, 'CITIES_V2', cityLine, '    ');
                results.push({ file: 'src/data/cities_v2.ts', ok: true, operation: 'insert' });
            }
        } else {
            citiesText = serverReplaceArrayBlock(citiesText, 'CITIES_V2', 'id', cId, cityLine);
            results.push({ file: 'src/data/cities_v2.ts', ok: true, operation: 'replace' });
        }

        // StartingCapitals.ts (STARTING_CAPITALS) — [FIX 2026-06-05] 不再写 GameApp.ts
        const capitalLine = `'${fId}': '${cId}',`;
        if (!startingCapitalsText.includes(`'${fId}':`)) {
            startingCapitalsText = serverInsertIntoStructure(startingCapitalsText, 'STARTING_CAPITALS', capitalLine, '    ');
        } else {
            startingCapitalsText = serverReplaceObjectLine(startingCapitalsText, 'STARTING_CAPITALS', fId, capitalLine);
        }
        results.push({ file: 'src/data/StartingCapitals.ts', ok: true, operation: startingCapitalsText.includes(`'${fId}':`) ? 'replace' : 'insert' });

        // CityAssetManager.ts (factionFlagMap) — 与 SandboxDisplayNames 同用旗号汉字，勿写 RANDOM
        const flagHan = entry.flagText.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const flagLine = `'${fId}': '${flagHan}',`;
        if (!camText.includes(`'${fId}':`)) {
            camText = serverInsertIntoStructure(camText, 'factionFlagMap', flagLine, '        ');
            results.push({ file: 'src/assets/CityAssetManager.ts', ok: true, operation: 'insert' });
        } else {
            camText = serverReplaceObjectLine(camText, 'factionFlagMap', fId, flagLine);
            results.push({ file: 'src/assets/CityAssetManager.ts', ok: true, operation: 'replace' });
        }

        // SandboxDisplayNames.ts
        const sdnLine = `'${fId}': '${entry.flagText}',`;
        if (!sdnText.includes(`'${fId}':`)) {
            sdnText = serverInsertIntoStructure(sdnText, 'SANDBOX_DISPLAY_NAMES', sdnLine, '    ');
            results.push({ file: 'src/data/SandboxDisplayNames.ts', ok: true, operation: 'insert' });
        } else {
            sdnText = serverReplaceObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', fId, sdnLine);
            results.push({ file: 'src/data/SandboxDisplayNames.ts', ok: true, operation: 'replace' });
        }
    }

    // 检查是否有任何失败；若有失败则跳过写文件（防止 Vite HMR 刷新页面导致用户数据丢失）
    const anyFailure = results.some(r => !r.ok);
    console.log(`[BatchImport] anyFailure=${anyFailure}, results:`, JSON.stringify(results));
    if (!anyFailure) {
        try {
            console.log(`[BatchImport] ✍️ Writing 5 files...`);
            fs.writeFileSync(factionPath, factionText, 'utf-8');
            console.log(`[BatchImport] ✅ factions.ts written`);
            fs.writeFileSync(citiesPath, citiesText, 'utf-8');
            console.log(`[BatchImport] ✅ cities_v2.ts written`);
            fs.writeFileSync(startingCapitalsPath, startingCapitalsText, 'utf-8');
            console.log(`[BatchImport] ✅ StartingCapitals.ts written`);
            fs.writeFileSync(camPath, camText, 'utf-8');
            console.log(`[BatchImport] ✅ CityAssetManager.ts written`);
            fs.writeFileSync(sdnPath, sdnText, 'utf-8');
            console.log(`[BatchImport] ✅ SandboxDisplayNames.ts written`);
        } catch (err: any) {
            console.log(`[BatchImport] ❌ Write failed: ${err.message}`);
            // 如果写入失败，标记所有已成功的操作为错误
            for (const r of results) r.ok = false;
            results.push({ file: 'WRITE_FAIL', ok: false, operation: 'skip', error: err.message });
        }
    } else {
        console.log(`[BatchImport] ❌ anyFailure=true, skipping all writes`);
        // 有跳过/失败的条目，丢弃所有内存中修改，不写入任何文件
        results.push({ file: '(skip write)', ok: true, operation: 'skip',
            error: '存在失败的条目，已跳过所有文件写入。请修正后重试。' });
    }

    return results;
}

/** 在数组格式中查找并替换指定 key=value 的块
 *  适用: factions.ts, cities_v2.ts (格式: { id: 'xxx', ... })
 *  [FIX 2026-05-29] cities_v2.ts 的 CITIES_V2 用 spread 拼接 T0/T1/T2/PERIPHERY/RESTORED,
 *  city_id 可能在 keyword 位置之前. 故先在 keyword 之后查; 找不到则全文回退查. */
function serverReplaceArrayBlock(text: string, keyword: string, keyName: string, targetValue: string, newLine: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`文件中找不到关键字 "${keyword}"`);

    const eqArr = text.indexOf('= [', kwIdx);
    if (eqArr === -1) throw new Error(`关键字 "${keyword}" 后找不到 '= ['`);

    const searchStr = `${keyName}: '${targetValue}'`;
    let idIdx = text.indexOf(searchStr, eqArr);
    if (idIdx === -1) {
        // [FIX] 回退: 在全文找 (cities_v2.ts 因 spread, id 块可能在 CITIES_V2 之前)
        idIdx = text.indexOf(searchStr);
    }
    if (idIdx === -1) throw new Error(`在 ${keyword} 中找不到 ${searchStr}`);

    // 向前找到块起始 {
    let start = idIdx;
    while (start > 0 && text[start] !== '{') start--;

    // 向后找到匹配的 }
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') {
            balance--;
            if (balance === 0) { end = i + 1; break; }
        }
    }
    if (end === -1) throw new Error(`找不到匹配的 }`);

    // 吃掉后续的逗号和空白
    let realEnd = end;
    while (realEnd < text.length && /[ \t]/.test(text[realEnd])) realEnd++;
    if (text[realEnd] === ',') realEnd++;
    if (text[realEnd] === '\n') realEnd++;
    if (text[realEnd] === '\r') realEnd++;

    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, start) + newLine + lineEnding + text.slice(realEnd);
}

/** 在对象字面量格式中查找并替换指定 key 的行
 *  适用: GameApp.ts, CityAssetManager.ts, SandboxDisplayNames.ts (格式: 'key': 'value',)
 *  [BUGFIX 2026-05-29] 必须用 "'key':" 严格匹配 (带冒号), 否则像 'panjun' 这种
 *  字符串出现在 STARTING_CAPITALS 之后的代码里 (如 fallback 等), 会被误命中,
 *  导致改错位置. 案例: GameApp.ts 把 activeFactions.push('panjun') 改成了
 *  'panjun': 'city_xxx', 整文件语法崩. 加冒号能严格限定为对象 key. */
function serverReplaceObjectLine(text: string, keyword: string, targetKey: string, newLine: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`文件中找不到关键字 "${keyword}"`);

    const searchStr = `'${targetKey}':`;
    const keyIdx = text.indexOf(searchStr, kwIdx);
    if (keyIdx === -1) throw new Error(`在 ${keyword} 中找不到 key '${targetKey}':`);

    // 找到行首
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

    // 找到行尾（包含换行符）
    let lineEnd = keyIdx;
    while (lineEnd < text.length && text[lineEnd] !== '\n' && text[lineEnd] !== '\r') lineEnd++;
    if (text[lineEnd] === '\r') lineEnd++;
    if (text[lineEnd] === '\n') lineEnd++;

    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, lineStart) + newLine + lineEnding + text.slice(lineEnd);
}

/** 从 cities_v2.ts 中删除指定 city_id 的数据块 */
function serverDeleteCityBlock(text: string, targetId: string): string {
    const searchStr = `id: '${targetId}'`;
    const idx = text.indexOf(searchStr);
    if (idx === -1) throw new Error(`找不到 city_id: ${targetId}`);

    // 向前找块起始 {
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;

    // 向后找匹配的 }
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') {
            balance--;
            if (balance === 0) { end = i + 1; break; }
        }
    }
    if (end === -1) throw new Error('找不到匹配的 }');

    // 吃掉后续逗号、空白和换行
    let realEnd = end;
    while (realEnd < text.length && /[ ,\t\r\n]/.test(text[realEnd])) realEnd++;

    return text.slice(0, start) + text.slice(realEnd);
}

/** 删除对象字面量里指定 key 的整行: 'key': 'value',
 *  [BUGFIX 2026-05-29] 同 serverReplaceObjectLine, 必须带冒号严格匹配 */
function serverDeleteObjectLine(text: string, keyword: string, targetKey: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到关键字 "${keyword}"`);
    const searchStr = `'${targetKey}':`;
    const keyIdx = text.indexOf(searchStr, kwIdx);
    if (keyIdx === -1) throw new Error(`在 ${keyword} 中找不到 key '${targetKey}':`);
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
    let lineEnd = keyIdx;
    while (lineEnd < text.length && text[lineEnd] !== '\n' && text[lineEnd] !== '\r') lineEnd++;
    if (text[lineEnd] === '\r') lineEnd++;
    if (text[lineEnd] === '\n') lineEnd++;
    return text.slice(0, lineStart) + text.slice(lineEnd);
}

/** 删除数组里指定 id 的 { ... } 块 (用于 factions.ts).
 *  跟 serverDeleteCityBlock 类似但限定在 keyword 范围内 (避免误删别处). */
function serverDeleteArrayBlock(text: string, keyword: string, keyName: string, targetValue: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到关键字 "${keyword}"`);
    const searchStr = `${keyName}: '${targetValue}'`;
    let idx = text.indexOf(searchStr, kwIdx);
    if (idx === -1) idx = text.indexOf(searchStr);  // 回退: 全文搜
    if (idx === -1) throw new Error(`在 ${keyword} 中找不到 ${searchStr}`);
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') { balance--; if (balance === 0) { end = i + 1; break; } }
    }
    if (end === -1) throw new Error('找不到匹配的 }');
    let realEnd = end;
    while (realEnd < text.length && /[ ,\t\r\n]/.test(text[realEnd])) realEnd++;
    return text.slice(0, start) + text.slice(realEnd);
}

interface DeleteTarget { factionId: string | null; cityId: string | null; }
interface DeleteResult { target: string; file: string; ok: boolean; error?: string; }

/** 批量删除入口. 全部成功才写文件 (跟 batchImportFiles 一样的原子性) */
function batchDeleteFiles(targets: DeleteTarget[]): DeleteResult[] {
    const factionPath = path.resolve(__dirname, 'src/data/factions.ts');
    const citiesPath = path.resolve(__dirname, 'src/data/cities_v2.ts');
    const startingCapitalsPath = path.resolve(__dirname, 'src/data/StartingCapitals.ts');
    const camPath = path.resolve(__dirname, 'src/assets/CityAssetManager.ts');
    const sdnPath = path.resolve(__dirname, 'src/data/SandboxDisplayNames.ts');
    // [2026-05-30 用户公理] 删城同时删引用该城的道路
    const roadsPath = path.resolve(__dirname, 'src/data/VectorRoadData.ts');

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let citiesText = fs.readFileSync(citiesPath, 'utf-8');
    let startingCapitalsText = fs.readFileSync(startingCapitalsPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');
    let roadsText = fs.readFileSync(roadsPath, 'utf-8');

    const results: DeleteResult[] = [];

    for (const t of targets) {
        const fId = t.factionId;
        const cId = t.cityId;
        const tag = fId || cId || '?';

        if (fId) {
            // factions.ts (数组块)
            try { factionText = serverDeleteArrayBlock(factionText, 'FACTIONS', 'id', fId); results.push({ target: tag, file: 'factions.ts', ok: true }); }
            catch (e: any) { results.push({ target: tag, file: 'factions.ts', ok: false, error: e.message }); }
            // StartingCapitals.ts (可能 factionId 没在 SC 注册, 不算错)
            if (startingCapitalsText.includes(`'${fId}':`)) {
                try { startingCapitalsText = serverDeleteObjectLine(startingCapitalsText, 'STARTING_CAPITALS', fId); results.push({ target: tag, file: 'StartingCapitals.ts', ok: true }); }
                catch (e: any) { results.push({ target: tag, file: 'StartingCapitals.ts', ok: false, error: e.message }); }
            }
            // CityAssetManager.ts factionFlagMap
            if (camText.includes(`'${fId}':`)) {
                try { camText = serverDeleteObjectLine(camText, 'factionFlagMap', fId); results.push({ target: tag, file: 'CityAssetManager.ts', ok: true }); }
                catch (e: any) { results.push({ target: tag, file: 'CityAssetManager.ts', ok: false, error: e.message }); }
            }
            // SandboxDisplayNames.ts
            if (sdnText.includes(`'${fId}':`)) {
                try { sdnText = serverDeleteObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', fId); results.push({ target: tag, file: 'SandboxDisplayNames.ts', ok: true }); }
                catch (e: any) { results.push({ target: tag, file: 'SandboxDisplayNames.ts', ok: false, error: e.message }); }
            }
        }

        if (cId) {
            try { citiesText = serverDeleteCityBlock(citiesText, cId); results.push({ target: tag, file: 'cities_v2.ts', ok: true }); }
            catch (e: any) { results.push({ target: tag, file: 'cities_v2.ts', ok: false, error: e.message }); }

            // [2026-05-30] 同步删该城涉及的所有道路
            try {
                const before = roadsText.length;
                const { newText, deletedCount } = serverDeleteRoadsByCity(roadsText, cId);
                roadsText = newText;
                if (deletedCount > 0) {
                    results.push({ target: tag, file: `VectorRoadData.ts (${deletedCount} roads)`, ok: true });
                }
            } catch (e: any) {
                results.push({ target: tag, file: 'VectorRoadData.ts', ok: false, error: e.message });
            }
        }
    }

    const anyFailure = results.some(r => !r.ok);
    console.log(`[BatchDelete] anyFailure=${anyFailure}, ${results.length} ops`);
    if (!anyFailure) {
        try {
            fs.writeFileSync(factionPath, factionText, 'utf-8');
            fs.writeFileSync(citiesPath, citiesText, 'utf-8');
            fs.writeFileSync(startingCapitalsPath, startingCapitalsText, 'utf-8');
            fs.writeFileSync(camPath, camText, 'utf-8');
            fs.writeFileSync(sdnPath, sdnText, 'utf-8');
            fs.writeFileSync(roadsPath, roadsText, 'utf-8'); // [2026-05-30]
            console.log('[BatchDelete] ✅ 6 文件已写入 (含 VectorRoadData.ts)');
        } catch (err: any) {
            console.log(`[BatchDelete] ❌ 写入失败: ${err.message}`);
            for (const r of results) r.ok = false;
            results.push({ target: 'WRITE_FAIL', file: '?', ok: false, error: err.message });
        }
    } else {
        console.log('[BatchDelete] ❌ 有失败操作, 跳过所有写入');
        results.push({ target: '(skip write)', file: 'all', ok: false, error: '存在失败操作, 已跳过所有写入' });
    }
    return results;
}

/**
 * [2026-05-30] 删 VectorRoadData.ts 中引用指定城 ID 的所有道路
 * 逐 feature block 扫描, 检测 startConnection / endConnection 是否引用
 * 返回 { newText, deletedCount }
 */
function serverDeleteRoadsByCity(text: string, cityId: string): { newText: string; deletedCount: number } {
    if (!cityId) return { newText: text, deletedCount: 0 };

    const lines = text.split('\n');
    const outLines: string[] = [];
    let deletedCount = 0;

    // 状态机: 跟踪是否在 feature block 内
    let inBlock = false;
    let blockLines: string[] = [];
    let blockBraceDepth = 0;

    const refStart = `startConnection: "${cityId}"`;
    const refStart2 = `startConnection: '${cityId}'`;
    const refEnd = `endConnection: "${cityId}"`;
    const refEnd2 = `endConnection: '${cityId}'`;

    for (const line of lines) {
        if (!inBlock) {
            // feature block 开始: 行匹配 `^\s*\{$` (单独的 { 行)
            if (/^\s*\{\s*$/.test(line)) {
                inBlock = true;
                blockLines = [line];
                blockBraceDepth = 1;
            } else {
                outLines.push(line);
            }
        } else {
            blockLines.push(line);
            // 统计该行的 { 和 } 净变化
            for (const c of line) {
                if (c === '{') blockBraceDepth++;
                else if (c === '}') blockBraceDepth--;
            }
            if (blockBraceDepth === 0) {
                // block 结束 → 检查是否引用待删城
                const blockText = blockLines.join('\n');
                const referenced =
                    blockText.includes(refStart) || blockText.includes(refStart2) ||
                    blockText.includes(refEnd) || blockText.includes(refEnd2);
                if (referenced) {
                    deletedCount++;
                    // 不加入 outLines (跳过整块, 含末尾 `}` 和 `},`)
                } else {
                    outLines.push(...blockLines);
                }
                inBlock = false;
                blockLines = [];
            }
        }
    }

    return { newText: outLines.join('\n'), deletedCount };
}

interface ProximityCity {
    name: string;
    km: number;
}

/** 检查新据点是否与已有据点间距 >= 50km */
function serverCheckProximity(citiesText: string, lat: number, lng: number, excludeId: string): ProximityCity[] {
    const issues: ProximityCity[] = [];
    const lines = citiesText.split('\n');

    // 简易解析：逐行找 { id: 'xxx', 并提取坐标
    let currentBlock = '';
    for (const line of lines) {
        currentBlock += line + '\n';
        if (line.includes('id:')) {
            // 开始新的块
            currentBlock = line + '\n';
        }
        if (line.includes('},') || line.includes('}\n')) {
            // 块结束，解析
            const idMatch = currentBlock.match(/id:\s*'([^']+)'/);
            const nameMatch = currentBlock.match(/name:\s*'([^']+)'/);
            const latMatch = currentBlock.match(/lat:\s*([-\d.]+)/);
            const lngMatch = currentBlock.match(/lng:\s*([-\d.]+)/);

            if (idMatch && nameMatch && latMatch && lngMatch) {
                const id = idMatch[1];
                if (id === excludeId) continue;
                const name = nameMatch[1];
                const cLat = parseFloat(latMatch[1]);
                const cLng = parseFloat(lngMatch[1]);
                const km = haversineKm(lat, lng, cLat, cLng);
                if (km < 50) {
                    issues.push({ name, km });
                }
            }
            currentBlock = '';
        }
    }
    return issues.sort((a, b) => a.km - b.km);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 
 * [NEW] Replace a tier block in CultureFormations.ts 
 */
function serverReplaceTierBlock(text: string, culture: string, newSlots: any[]): string {
    const keyword = `export const ${culture}_TIERS: CompositionTier[] = [`;
    const startIdx = text.indexOf(keyword);
    if (startIdx === -1) throw new Error(`Cannot find ${keyword}`);
    
    // Find matching ]
    let balance = 0, endIdx = -1;
    for (let i = startIdx + keyword.length - 1; i < text.length; i++) {
        if (text[i] === '[') balance++;
        else if (text[i] === ']') {
            balance--;
            if (balance === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }
    if (endIdx === -1) throw new Error('Cannot find matching ]');
    
    // Eat trailing semicolon and whitespace
    let realEnd = endIdx;
    while (realEnd < text.length && /[ ;\n\r]/.test(text[realEnd])) realEnd++;
    
    // Generate new block
    const slotsStr = newSlots.map(s => {
        const scalePart = s.scale != null && s.scale !== '' ? `, scale: ${s.scale}` : '';
        return `            { type: '${s.type}', count: ${s.count}${scalePart} }`;
    }).join(',\n');
    const newBlock = `${keyword}
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
${slotsStr}
        ]
    }
];\n`;

    return text.slice(0, startIdx) + newBlock + text.slice(realEnd);
}

/** 更新 CULTURE_FORMATION_MODE 中某文化的阵型类型 */
function serverReplaceFormationMode(text: string, culture: string, mode: string): string {
    const pattern = new RegExp(`(\\s+${culture}:\\s*)'(triangle|square)'`);
    if (!pattern.test(text)) {
        throw new Error(`Cannot find formation mode entry for ${culture}`);
    }
    return text.replace(pattern, `$1'${mode}'`);
}

/** 从 portrait_adjust.ts 解析 DEFAULT_PORTRAIT_ADJUST 对象 */
function serverParsePortraitAdjustExport(text: string): {
    folders?: Record<string, unknown>;
    images?: Record<string, unknown>;
    folderGuides?: Record<string, unknown>;
} {
    const marker = 'export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ';
    const start = text.indexOf(marker);
    if (start === -1) throw new Error('DEFAULT_PORTRAIT_ADJUST not found');

    const open = text.indexOf('{', start);
    if (open === -1) throw new Error('DEFAULT_PORTRAIT_ADJUST object not found');

    let depth = 0;
    let end = -1;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i + 1;
                break;
            }
        }
    }
    if (end === -1) throw new Error('Unclosed DEFAULT_PORTRAIT_ADJUST object');

    const objText = text.slice(open, end);
    return new Function(`return (${objText});`)() as {
        folders?: Record<string, unknown>;
        images?: Record<string, unknown>;
        folderGuides?: Record<string, unknown>;
    };
}

/** 将调校数据写回 portrait_adjust.ts（保留文件头注释与类型导出；F2 脸椭圆常量在 PortraitAdjust.ts） */
function serverFormatPortraitAdjustFile(data: {
    folders?: Record<string, unknown>;
    images?: Record<string, unknown>;
    folderGuides?: Record<string, unknown>;
}): string {
    const normalized = {
        folders: data.folders ?? {},
        images: data.images ?? {},
        folderGuides: data.folderGuides ?? {},
    };

    const body = JSON.stringify(normalized, null, 4);

    return `/**
 * 立绘显示调校：文件夹默认 + 单张覆盖 + 调校尺（样片/标线）
 * 由 PortraitTuner（/portrait-tuner.html）与游戏内 F2 校正器共同维护（均按立绘自身路径存单张覆盖）。
 * 读取见 PortraitAdjust.ts#resolvePortraitAdjust：自身路径 → canonical 兜底 → 文件夹默认。
 *
 * folders 键示例："/assets/daming/"
 * images 键示例："/assets/daming/daming (1).png"
 */
export interface PortraitAdjustValues {
    /** 相对缩放，默认 1 */
    scale?: number;
    /** 水平偏移（设计 px，CombatUI 会乘 COMBAT_UI_SCALE） */
    offsetX?: number;
    /** 垂直偏移（设计 px，正值向下） */
    offsetY?: number;
}

/** 全局默认：胸线水平位置（画布归一化 0–1，左→右） */
export const PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X = 0.5;
/** 全局默认：眼线垂直位置（画布归一化 0–1，顶→底） */
export const PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y = 0.24;

/** 调校工具专用：样片 + 眼线/胸线（CombatUI 不读取） */
export interface PortraitFolderGuide {
    /** 样片路径 */
    samplePath: string;
    /** 眼线 Y：768×1024 画布归一化 0–1（顶→底） */
    eyeLineY: number;
    /** 胸线 X：画布归一化 0–1（左→右） */
    chestLineX: number;
}

/** 文件夹未配置 guide 时的默认值 */
export const PORTRAIT_GUIDE_DEFAULT: PortraitFolderGuide = {
    samplePath: '',
    eyeLineY: PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    chestLineX: PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
};

export interface PortraitAdjustData {
    folders?: Record<string, PortraitAdjustValues>;
    images?: Record<string, PortraitAdjustValues>;
    folderGuides?: Record<string, PortraitFolderGuide>;
}

export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ${body};
`;
}

/** 扫描 public/assets 生成立绘调校目录（开发服务器专用） */
function serverBuildPortraitCatalog(assetsRoot: string): { folder: string; label: string; images: { path: string; hash: string }[] }[] {
    const EXCLUDED = new Set(['UI', 'avg', 'inbox']);
    const byFolder = new Map<string, { path: string; hash: string }[]>();

    if (!fs.existsSync(assetsRoot)) return [];

    for (const entry of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || EXCLUDED.has(entry.name)) continue;
        const dirPath = path.join(assetsRoot, entry.name);
        const folderKey = `/assets/${entry.name}/`;
        const images: { path: string; hash: string }[] = [];

        for (const file of fs.readdirSync(dirPath)) {
            if (!file.toLowerCase().endsWith('.png')) continue;
            const fullPath = path.join(dirPath, file);
            let hash = '';
            try {
                hash = require('crypto').createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
            } catch (e) {
            }
            images.push({ path: `${folderKey}${file}`, hash });
        }

        if (images.length > 0) {
            images.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
            byFolder.set(folderKey, images);
        }
    }

    return [...byFolder.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
        .map(([folder, images]) => ({
            folder,
            label: folder.replace('/assets/', '').replace(/\/$/, ''),
            images,
        }));
}

/** F2 选图器：含 inbox 在内的全部立绘夹（开发服；Tuner 仍用 serverBuildPortraitCatalog） */
function serverBuildPortraitPickerCatalog(
    assetsRoot: string,
): { folder: string; label: string; images: string[] }[] {
    const EXCLUDED = new Set(['UI', 'avg']);
    const entries: { folder: string; label: string; images: string[] }[] = [];

    if (!fs.existsSync(assetsRoot)) return [];

    for (const entry of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || EXCLUDED.has(entry.name)) continue;
        const dirPath = path.join(assetsRoot, entry.name);
        const folderKey = `/assets/${entry.name}/`;
        const images: string[] = [];

        if (fs.existsSync(dirPath)) {
            for (const file of fs.readdirSync(dirPath)) {
                if (!file.toLowerCase().endsWith('.png')) continue;
                images.push(`${folderKey}${file}`);
            }
            images.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        }

        entries.push({
            folder: folderKey,
            label: entry.name,
            images,
        });
    }

    entries.sort((a, b) => {
        if (a.folder === '/assets/inbox/') return -1;
        if (b.folder === '/assets/inbox/') return 1;
        return a.label.localeCompare(b.label, 'zh-CN');
    });
    return entries;
}

/** F2 收件箱：待绑定立绘（仅 dev 服，兼容旧 API） */
function serverListPortraitInbox(assetsRoot: string): string[] {
    const row = serverBuildPortraitPickerCatalog(assetsRoot).find((c) => c.folder === '/assets/inbox/');
    return row?.images ?? [];
}

function serverNormalizeAssetFolderWeb(folder: string): string {
    let f = folder.replace(/\\/g, '/').trim();
    if (!f.startsWith('/assets/')) throw new Error(`非法文件夹：${folder}`);
    if (!f.endsWith('/')) f += '/';
    if (!/^\/assets\/[a-z0-9_-]+\/$/i.test(f)) throw new Error(`非法文件夹：${folder}`);
    return f;
}

function serverWebFolderToAbs(publicAssetsRoot: string, folderWeb: string): string {
    const rel = folderWeb.slice('/assets/'.length);
    const abs = path.resolve(publicAssetsRoot, rel);
    if (!abs.startsWith(publicAssetsRoot)) throw new Error('路径越界');
    return abs;
}

function serverWebPathToAbs(publicAssetsRoot: string, webPath: string): string {
    const normalized = webPath.replace(/\\/g, '/').trim();
    if (!normalized.startsWith('/assets/')) {
        throw new Error(`非法立绘路径：${webPath}`);
    }
    const rel = normalized.slice('/assets/'.length);
    const abs = path.resolve(publicAssetsRoot, rel);
    if (!abs.startsWith(publicAssetsRoot)) {
        throw new Error('路径越界');
    }
    return abs;
}

function serverEscapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 在 FactionGenerals.ts 中按 generalId 更新 portrait 字段 */
function serverUpdateFactionGeneralPortraitFile(
    filePath: string,
    generalId: string,
    portraitPath: string,
): void {
    let text = fs.readFileSync(filePath, 'utf-8');
    const gid = serverEscapeRegExp(generalId);
    const blockRe = new RegExp(
        `(generalId\\s*:\\s*'${gid}'[\\s\\S]*?portrait\\s*:\\s*)'[^']*'`,
        'm',
    );
    if (!blockRe.test(text)) {
        throw new Error(`FactionGenerals.ts 中未找到 generalId: ${generalId}`);
    }
    text = text.replace(blockRe, `$1'${portraitPath}'`);
    fs.writeFileSync(filePath, text, 'utf-8');
}

/** 读取 FactionGenerals.ts 中当前绑定的 portrait 路径 */
function serverGetCurrentPortraitPath(filePath: string, generalId: string): string | null {
    const text = fs.readFileSync(filePath, 'utf-8');
    const gid = serverEscapeRegExp(generalId);
    const re = new RegExp(
        `generalId\\s*:\\s*'${gid}'[\\s\\S]*?portrait\\s*:\\s*'([^']*)'`,
        'm',
    );
    const m = text.match(re);
    return m?.[1] ?? null;
}

/** 绑定：在目标文件夹内写入 {generalId}.png，并写 FactionGenerals.ts */
function serverBindGeneralPortrait(
    publicAssetsRoot: string,
    factionGeneralsPath: string,
    portraitCanonicalPath: string,
    generalId: string,
    sourceWebPath: string,
    targetFolderWeb?: string,
): { portraitPath: string; generalName: string; targetFolder: string } {
    if (!/^[a-z0-9_]+$/i.test(generalId)) {
        throw new Error(`非法 generalId：${generalId}`);
    }
    // 写文件前先验证 generalId 存在于 FactionGenerals.ts，防止 generalId 截断时写出错误文件名
    const generalsTextPre = fs.readFileSync(factionGeneralsPath, 'utf-8');
    if (!new RegExp(`generalId\\s*:\\s*'${serverEscapeRegExp(generalId)}'`).test(generalsTextPre)) {
        throw new Error(`FactionGenerals.ts 中未找到 generalId: "${generalId}"，拒绝写盘`);
    }
    const srcAbs = serverWebPathToAbs(publicAssetsRoot, sourceWebPath);
    if (!fs.existsSync(srcAbs)) {
        throw new Error(`源文件不存在：${sourceWebPath}`);
    }

    const folderWeb = serverNormalizeAssetFolderWeb(
        targetFolderWeb || sourceWebPath.replace(/\/[^/]+$/i, '/'),
    );
    const folderAbs = serverWebFolderToAbs(publicAssetsRoot, folderWeb);
    fs.mkdirSync(folderAbs, { recursive: true });

    const destAbs = path.join(folderAbs, `${generalId}.png`);
    const destWeb = `${folderWeb}${generalId}.png`;

    if (path.resolve(srcAbs) !== path.resolve(destAbs)) {
        // ① 旧绑定文件（可能在其他文件夹）→ 改名备份
        const ts = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
        const oldPortraitWeb = serverGetCurrentPortraitPath(factionGeneralsPath, generalId);
        if (oldPortraitWeb && oldPortraitWeb.startsWith('/assets/')) {
            const oldAbs = serverWebPathToAbs(publicAssetsRoot, oldPortraitWeb);
            if (
                fs.existsSync(oldAbs) &&
                path.resolve(oldAbs) !== path.resolve(destAbs) &&
                path.resolve(oldAbs) !== path.resolve(srcAbs)
            ) {
                const oldDir = path.dirname(oldAbs);
                const oldName = path.basename(oldAbs, '.png');
                const backupName = `${oldName}_prev_${ts}.png`;
                const backupAbs = path.join(oldDir, backupName);
                fs.renameSync(oldAbs, backupAbs);
                console.log(`  🗂️  [BindPortrait] 旧绑定备份 → ${backupName}`);
            }
        }
        // ② 目标位置已有文件（同文件夹覆盖场景）→ 改名备份
        if (fs.existsSync(destAbs)) {
            const destName = path.basename(destAbs, '.png');
            const backupName = `${destName}_prev_${ts}.png`;
            const backupAbs = path.join(folderAbs, backupName);
            fs.renameSync(destAbs, backupAbs);
            console.log(`  🗂️  [BindPortrait] 目标位置旧文件备份 → ${backupName}`);
        }
        // ③ 源图复制到目标（copyFileSync = 不移动、不删除源文件；源图留在原文件夹）
        fs.copyFileSync(srcAbs, destAbs);
    }

    serverUpdateFactionGeneralPortraitFile(factionGeneralsPath, generalId, destWeb);

    // 绑定后清理 canonical 中指向目标文件的旧映射（防旧映射覆盖新绑定）
    serverCleanCanonicalForPortrait(portraitCanonicalPath, destWeb);

    const generalsText = fs.readFileSync(factionGeneralsPath, 'utf-8');
    const nameMatch = generalsText.match(
        new RegExp(`generalId\\s*:\\s*'${serverEscapeRegExp(generalId)}'[\\s\\S]*?generalName\\s*:\\s*'([^']*)'`),
    );
    const generalName = nameMatch?.[1] ?? generalId;

    return { portraitPath: destWeb, generalName, targetFolder: folderWeb };
}

/** 清理 portrait_canonical.ts 中 destWeb 作为源键的条目（新绑定后旧映射应失效） */
function serverCleanCanonicalForPortrait(canonicalPath: string, destWeb: string): void {
    if (!fs.existsSync(canonicalPath)) return;
    let text = fs.readFileSync(canonicalPath, 'utf-8');
    const escaped = serverEscapeRegExp(destWeb);
    // 匹配以 destWeb 为源键的 canonical 行并移除
    const re = new RegExp(`\\s*"${escaped}":\\s*"[^"]*",?\\r?\\n`, 'g');
    const before = text.length;
    text = text.replace(re, '');
    if (text.length !== before) {
        fs.writeFileSync(canonicalPath, text, 'utf-8');
        console.log(`  🧹 [BindPortrait] canonical 已清理旧映射: ${destWeb}`);
    }
}
