import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import { pinyin } from 'pinyin-pro';

/** 中文名 → 立绘ID用拼音（与 batch-manager 的 toPinyinId 完全一致） */
function serverToPinyinId(chinese: string): string {
    return pinyin(chinese, { toneType: 'none', type: 'array' })
        .map((s) => s.replace(/\s+/g, ''))
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

// F2 立绘写盘后短暂拦截 Vite 整页 full-reload（Esc 保存不打断对局）
let portraitDevSuppressReloadUntil = 0;
function markPortraitDevWrite(): void {
    portraitDevSuppressReloadUntil = Date.now() + 8000;
}

// batch-manager 连续写盘（batch-import → save-general → save-elite）
// 期间抑制 Vite full-reload，防止后续 API 调用被页面刷新打断
let batchSaveSuppressReloadUntil = 0;
function markBatchSaveWrite(): void {
    batchSaveSuppressReloadUntil = Date.now() + 5000;
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
        // 所有文件均由 Vite 监听；F2 写盘期间由 suppress-portrait-dev-hmr 插件短暂拦截全页刷新
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
                        && (Date.now() < portraitDevSuppressReloadUntil || Date.now() < batchSaveSuppressReloadUntil)
                    ) {
                        console.log('[HMR-Suppress] 已拦截写盘触发的整页刷新');
                        return;
                    }
                    origSend(payload);
                };
            },
            handleHotUpdate({ file }) {
                // F2 写盘期间（8 秒窗口）由 configureServer 的 ws.send 拦截器处理
                // 其余时刻所有文件变更正常触发 HMR / 全页刷新
            },
        },
        {
            name: 'save-roads-api',
            configureServer(server) {
                // [AutoBackup] vite 启动时立即检查 1 次, 之后每小时再检查
                // 实际只在距离上次 commit >= 23 小时时才真正 commit
                dailyBackupCheck();
                setInterval(dailyBackupCheck, 60 * 60 * 1000); // 每小时

                // 每次启动 dev server 自动重建 canonical 映射，防止改名/换图后旧映射残留
                try {
                    require('child_process').execSync('node scratch/build_portrait_canonical.mjs', {
                        cwd: __dirname,
                        stdio: 'pipe',
                        timeout: 30000,
                    });
                } catch (_) { /* 静默：png 未变时可能无输出，不影响启动 */ }

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
                // [NEW 2026-07-01] /api/repair-missing-sc
                //   势力已有 city (cities_v2.factionId==factionId) 但 SC 里没映射,
                //   一键把这条 SC 补上
                //   body: { factionId: string, cityId: string }
                // ========================================================
                server.middlewares.use('/api/repair-missing-sc', (req, res) => {
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
                            const fId = data.factionId;
                            const cId = data.cityId;
                            if (!fId || !cId) {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ ok: false, error: 'factionId and cityId required' }));
                                return;
                            }
                            const scPath = path.resolve(__dirname, 'src/data/StartingCapitals.ts');
                            let scText = fs.readFileSync(scPath, 'utf-8');
                            if (scText.includes(`'${fId}':`)) {
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ ok: true, operation: 'skip', reason: 'already present' }));
                                return;
                            }
                            const line = `'${fId}': '${cId}',`;
                            scText = serverInsertIntoStructure(scText, 'STARTING_CAPITALS', line, '    ');
                            markBatchSaveWrite();
                            fs.writeFileSync(scPath, scText, 'utf-8');
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, operation: 'insert', line }));
                            console.log(`[RepairSC] ${fId} → ${cId} inserted`);
                        } catch (err: any) {
                            console.error(`❌ [RepairSC] Failed:`, err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-06-29] /api/entity-data
                //   读取所有实体数据 (势力/据点/旗号/武将/精锐) 并合并返回
                // ========================================================
                server.middlewares.use('/api/entity-data', (req, res) => {
                    if (req.method !== 'GET') { res.statusCode = 405; res.end('{}'); return; }
                    try {
                        const data = serverReadAllEntityData();
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });

                // ========================================================
                // [NEW 2026-06-29] /api/save-general
                //   写 FactionGenerals.ts + GeneralSkills.ts
                // ========================================================
                server.middlewares.use('/api/save-general', (req, res) => {
                    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
                    let body = '';
                    req.on('data', (chunk: string) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const results = serverSaveGeneral(data);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, results }));
                        } catch (err: any) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-06-29] /api/save-elite
                //   写入精锐番号到对应区域的 ExpeditionLegions 文件
                // ========================================================
                server.middlewares.use('/api/save-elite', (req, res) => {
                    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
                    let body = '';
                    req.on('data', (chunk: string) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const result = serverSaveEliteLegion(data);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, ...result }));
                        } catch (err: any) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // [NEW 2026-06-29] /api/validate-entities
                //   运行所有校验规则并返回问题列表
                // ========================================================
                server.middlewares.use('/api/validate-entities', (req, res) => {
                    if (req.method !== 'GET') { res.statusCode = 405; res.end('{}'); return; }
                    try {
                        const validation = serverValidateEntities();
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, ...validation }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                // ========================================================
                // /api/check-skill-coverage
                //   当前攻防六槽 + 可分配战略技：每个技能都必须至少有一名武将佩戴
                // ========================================================
                server.middlewares.use('/api/check-skill-coverage', (req, res) => {
                    if (req.method !== 'GET') { res.statusCode = 405; res.end('{}'); return; }
                    try {
                        const report = serverCheckGeneralSkillCoverage();
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: report.unusedTactical.length === 0 && report.unusedStrategic.length === 0, ...report }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });

                // ========================================================
                // /api/skill-editor/* — 武将技编辑器（/skill-editor.html）
                // ========================================================
                server.middlewares.use('/api/skill-editor/list', (req, res) => {
                    if (req.method !== 'GET') { res.statusCode = 405; res.end('{}'); return; }
                    try {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true, ...serverSkillEditorList() }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });
                server.middlewares.use('/api/skill-editor/save', (req, res) => {
                    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
                    let body = '';
                    req.on('data', (chunk: string) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const result = serverSkillEditorSave(JSON.parse(body));
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, ...result }));
                        } catch (err: any) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });
                server.middlewares.use('/api/skill-editor/create', (req, res) => {
                    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
                    let body = '';
                    req.on('data', (chunk: string) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const result = serverSkillEditorCreate(JSON.parse(body));
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: true, ...result }));
                        } catch (err: any) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: false, error: err.message }));
                        }
                    });
                });

                // ========================================================
                // /api/check-proximity
                //   检查坐标与所有已有据点的50km间距
                // ========================================================
                server.middlewares.use('/api/check-proximity', (req, res) => {
                    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
                    let body = '';
                    req.on('data', (chunk: string) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const { lat, lng, excludeCityId } = JSON.parse(body);
                            const citiesPath = path.resolve(__dirname, 'src/data/cities_v2.ts');
                            const citiesText = fs.readFileSync(citiesPath, 'utf-8');
                            const issues = serverCheckProximity(citiesText, lat, lng, excludeCityId || '');
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ ok: issues.length === 0, issues }));
                        } catch (err: any) {
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
                            // backup 标志已废弃（兼容旧客户端仍剥离）：现在每次保存都滚动备份
                            const { backup: _legacyBackupFlag, ...data } = payload as { backup?: boolean; [k: string]: unknown };
                            const content = serverFormatPortraitAdjustFile(data);

                            // [2026-07-06 全量滚动备份] 写盘前先备份旧文件（防坏 payload 整份覆盖后无可回滚）；
                            // 同一分钟只存首份（保留该分钟起点状态）；只保留最近 30 份，旧的自动清理。
                            let backupFile: string | undefined;
                            const backupDir = path.resolve(__dirname, 'src/data/portrait_adjust_backups');
                            if (fs.existsSync(portraitAdjustPath)) {
                                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                                const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHmm
                                backupFile = path.join(backupDir, `portrait_adjust_${ts}.ts`);
                                if (!fs.existsSync(backupFile)) {
                                    fs.copyFileSync(portraitAdjustPath, backupFile);
                                    console.log(`📦 [PortraitAdjust] Backup → ${backupFile}`);
                                    const stale = fs.readdirSync(backupDir)
                                        .filter((f: string) => /^portrait_adjust_\d{12}\.ts$/.test(f))
                                        .sort()
                                        .reverse()
                                        .slice(30);
                                    for (const f of stale) fs.unlinkSync(path.join(backupDir, f));
                                }
                            }

                            fs.writeFileSync(portraitAdjustPath, content, 'utf-8');
                            markPortraitDevWrite();
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

/**
 * 写盘前防线：拦截「对象闭合 } 后紧跟两个逗号」`},,` 这类会让整个 build 崩溃的畸形序列化。
 * [2026-07-13] 曾有一次性批量写入在 profiles.ts 留下 21 处 `},,`，导致 vite/tsx 全量解析失败。
 * 当前保存路径本身不产此错，但作为最后一道闸门，凡经此函数落盘的数据文件一律自愈 + 告警，
 * 避免任何来源（批量脚本 / 手工粘贴 / 未来改动）的双逗号畸形悄悄进入源文件。
 */
function guardSerializedDataText(text: string, label: string): string {
    // 匹配：} 后可含空白 + 逗号 + 空白 + 再一个逗号 → 收敛为单逗号；循环到稳定以吃掉 3+ 连逗号
    const re = /\}(\s*),(\s*),/g;
    let count = 0;
    let out = text;
    for (;;) {
        let hit = 0;
        const next = out.replace(re, (_m, s1, _s2) => { hit++; return `}${s1},`; });
        count += hit;
        if (hit === 0) break;
        out = next;
    }
    if (count > 0) {
        console.warn(`⚠ [写盘防线] ${label}: 检测并修复 ${count} 处畸形双逗号 "},," → "},"（畸形源非本保存路径，请排查最近的批量写入）`);
    }
    return out;
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
    region?: string;
    /** 据点类型（表单选择）：small_city/medium_city/big_city/pass；未传则按名字自动判 */
    cityType?: string;
    /** 若需先删冲突据点再新建，传其 city_id */
    deleteExistingCityId?: string;
    /** 若为 true，强制添加（跳过50km邻近检查，新旧城都保留） */
    forceProximity?: boolean;
    /** 据点立绘镜像翻转 */
    mirror?: boolean;
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

        // cities_v2.ts — 类型优先用表单选择(entry.cityType)，未传则按名字自动判(默认小城)。
        //   兵力统一 20000：所有据点开局默认兵力都是 20000（用户定，不按类型区分）。
        const detected = detectCityType(entry.cityName);
        const cityType = entry.cityType || detected.type;
        const troops = 20000;
        const regionPart = entry.region ? `, region: '${entry.region}'` : '';
        const mirrorPart = entry.mirror ? `, mirror: true` : '';
        const cityLine = `{ id: '${cId}', name: '${entry.cityName}', factionId: '${fId}', lat: ${entry.lat}, lng: ${entry.lng}, type: '${cityType}', troops: ${troops}${regionPart}${mirrorPart} },`;
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
        if (findObjectKeyIdx(sdnText, 0, fId) === -1) {
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
            markBatchSaveWrite();
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
/** 定位对象 key 在文本中的起始下标, 支持两种写法:
 *   带引号 'key':  (StartingCapitals / SandboxDisplayNames)
 *   不带引号 key:  (FactionGenerals / GeneralSkills / *ExpeditionLegions)
 *  返回 key 字符本身的下标; 找不到返回 -1。 */
function findObjectKeyIdx(text: string, fromIdx: number, targetKey: string): number {
    const quoted = text.indexOf(`'${targetKey}':`, fromIdx);
    if (quoted !== -1) return quoted;
    // 不带引号: 必须是真正的 key (前面是换行/空白/{/逗号, 后面是可选空白+冒号)
    let from = fromIdx;
    while (true) {
        const idx = text.indexOf(targetKey, from);
        if (idx === -1) return -1;
        const before = text[idx - 1];
        const after = text.slice(idx + targetKey.length).match(/^\s*:/);
        if ((before === '\n' || before === '\r' || before === ' ' || before === '\t' || before === '{' || before === ',') && after) {
            return idx;
        }
        from = idx + targetKey.length;
    }
}

/** 给定 key 起始下标, 返回该条目（含值, 可能是多行 { ... } 对象, 含尾随逗号与换行）末尾的下标。
 *  [BUGFIX 2026-06-29] 旧逻辑只取 key 所在那一行, 替换/删除多行对象条目时会留下孤儿 } 导致语法崩溃。 */
function findObjectEntryEnd(text: string, keyIdx: number): number {
    // 跳到 key 后的冒号
    let i = keyIdx;
    while (i < text.length && text[i] !== ':') i++;
    i++; // 越过冒号
    // 跳过冒号后的空白（值与 key 同行）
    while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
    // 若值是对象 { ... }, 做花括号配对跳到匹配的 }
    if (text[i] === '{') {
        let balance = 0;
        for (; i < text.length; i++) {
            if (text[i] === '{') balance++;
            else if (text[i] === '}') { balance--; if (balance === 0) { i++; break; } }
        }
    }
    // 走到当前行尾（覆盖尾随逗号、注释; 单行原始值也走到这里）
    while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++;
    if (text[i] === '\r') i++;
    if (text[i] === '\n') i++;
    return i;
}

function serverReplaceObjectLine(text: string, keyword: string, targetKey: string, newLine: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`文件中找不到关键字 "${keyword}"`);

    const keyIdx = findObjectKeyIdx(text, kwIdx, targetKey);
    if (keyIdx === -1) throw new Error(`在 ${keyword} 中找不到 key '${targetKey}':`);

    // 找到行首
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

    // 找到条目末尾（正确跨越多行对象）
    const lineEnd = findObjectEntryEnd(text, keyIdx);

    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, lineStart) + newLine + lineEnding + text.slice(lineEnd);
}

/** 从对象结构中删除指定 key 的整条记录（含缩进与换行）；key 不存在则原样返回。 */
function serverRemoveObjectKey(text: string, keyword: string, targetKey: string): string {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`文件中找不到关键字 "${keyword}"`);
    const keyIdx = findObjectKeyIdx(text, kwIdx, targetKey);
    if (keyIdx === -1) return text;
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
    const lineEnd = findObjectEntryEnd(text, keyIdx);
    return text.slice(0, lineStart) + text.slice(lineEnd);
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
    const keyIdx = findObjectKeyIdx(text, kwIdx, targetKey);
    if (keyIdx === -1) throw new Error(`在 ${keyword} 中找不到 key '${targetKey}':`);
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
    // 正确跨越多行对象条目
    const lineEnd = findObjectEntryEnd(text, keyIdx);
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
    // [FIX 2026-07-01] 删势力须同步删武将记录/档案/精锐, 否则成孤儿, 校验仍报错
    const factionGeneralsPath = path.resolve(__dirname, 'src/data/FactionGenerals.ts');
    // [2026-07-13 拆分] GENERAL_PROFILES 已拆到 general-skills/profiles.ts（GeneralSkills.ts 只是转发壳）
    const generalSkillsPath = path.resolve(__dirname, 'src/data/general-skills/profiles.ts');

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let citiesText = fs.readFileSync(citiesPath, 'utf-8');
    let startingCapitalsText = fs.readFileSync(startingCapitalsPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');
    let roadsText = fs.readFileSync(roadsPath, 'utf-8');
    let factionGeneralsText = fs.readFileSync(factionGeneralsPath, 'utf-8');
    let generalSkillsText = fs.readFileSync(generalSkillsPath, 'utf-8');
    // 精锐区文件按需读取/累积修改: file 绝对路径 → 最新文本
    const eliteEdits = new Map<string, string>();

    const results: DeleteResult[] = [];

    for (const t of targets) {
        const fId = t.factionId;
        const cId = t.cityId;
        const tag = fId || cId || '?';

        if (fId) {
            // factions.ts (数组块) — [FIX 2026-07-01] 势力已不在则跳过(视为已删), 不算错,
            //   以便对「已删势力但残留孤儿」的情况补清武将/档案/精锐
            if (factionText.includes(`id: '${fId}'`)) {
                try { factionText = serverDeleteArrayBlock(factionText, 'FACTIONS', 'id', fId); results.push({ target: tag, file: 'factions.ts', ok: true }); }
                catch (e: any) { results.push({ target: tag, file: 'factions.ts', ok: false, error: e.message }); }
            }
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

            // [FIX 2026-07-01] FactionGenerals.ts (武将记录, key=factionId)
            //   先取出 generalId, 再删本记录 + GeneralSkills 档案 (档案 key=generalId, 非 factionId)
            const fgKwIdx = factionGeneralsText.indexOf('FACTION_GENERALS');
            if (fgKwIdx !== -1 && findObjectKeyIdx(factionGeneralsText, fgKwIdx, fId) !== -1) {
                const gMatch = factionGeneralsText.match(new RegExp(`${fId}:\\s*\\{[^}]*generalId:\\s*'([^']+)'`));
                const generalId = gMatch ? gMatch[1] : null;
                try {
                    factionGeneralsText = serverDeleteObjectLine(factionGeneralsText, 'FACTION_GENERALS', fId);
                    results.push({ target: tag, file: 'FactionGenerals.ts', ok: true });
                } catch (e: any) { results.push({ target: tag, file: 'FactionGenerals.ts', ok: false, error: e.message }); }
                // GeneralSkills.ts (GENERAL_PROFILES, key=generalId)
                const gsKwIdx = generalSkillsText.indexOf('GENERAL_PROFILES');
                if (generalId && gsKwIdx !== -1 && findObjectKeyIdx(generalSkillsText, gsKwIdx, generalId) !== -1) {
                    try {
                        generalSkillsText = serverDeleteObjectLine(generalSkillsText, 'GENERAL_PROFILES', generalId);
                        results.push({ target: tag, file: 'general-skills/profiles.ts', ok: true });
                    } catch (e: any) { results.push({ target: tag, file: 'general-skills/profiles.ts', ok: false, error: e.message }); }
                }
            }

            // [FIX 2026-07-01] 精锐区文件 (key=factionId), 14 区逐个查删, 累积到 eliteEdits
            for (const [, rinfo] of Object.entries(REGION_TO_ELITE_FILE)) {
                const efp = path.resolve(__dirname, 'src/data', rinfo.file);
                let etext = eliteEdits.get(efp) ?? (fs.existsSync(efp) ? fs.readFileSync(efp, 'utf-8') : null);
                if (etext == null) continue;
                const ekw = etext.indexOf(rinfo.varName);
                if (ekw === -1 || findObjectKeyIdx(etext, ekw, fId) === -1) continue; // 未命中: 不缓存(只写改过的)
                try {
                    etext = serverRemoveObjectKey(etext, rinfo.varName, fId);
                    eliteEdits.set(efp, etext);
                    results.push({ target: tag, file: rinfo.file, ok: true });
                } catch (e: any) { results.push({ target: tag, file: rinfo.file, ok: false, error: e.message }); }
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
            markBatchSaveWrite();
            fs.writeFileSync(factionPath, factionText, 'utf-8');
            fs.writeFileSync(citiesPath, citiesText, 'utf-8');
            fs.writeFileSync(startingCapitalsPath, startingCapitalsText, 'utf-8');
            fs.writeFileSync(camPath, camText, 'utf-8');
            fs.writeFileSync(sdnPath, sdnText, 'utf-8');
            fs.writeFileSync(roadsPath, roadsText, 'utf-8'); // [2026-05-30]
            // [FIX 2026-07-01] 武将记录 / 档案 / 精锐 同步落盘
            fs.writeFileSync(factionGeneralsPath, factionGeneralsText, 'utf-8');
            fs.writeFileSync(generalSkillsPath, generalSkillsText, 'utf-8');
            for (const [efp, etext] of eliteEdits) fs.writeFileSync(efp, etext, 'utf-8');
            console.log(`[BatchDelete] ✅ 写入完成 (含 FactionGenerals/GeneralSkills + ${eliteEdits.size} 精锐文件)`);
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

function getBigrams(s: string): string[] {
    const result: string[] = [];
    for (let i = 0; i < s.length - 1; i++) result.push(s[i] + s[i + 1]);
    return result;
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
                hash = crypto.createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
            } catch (_) { /* ignore */ }
            images.push({ path: `${folderKey}${file}`, hash });
        }

        if (images.length > 0) {
            images.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
            byFolder.set(folderKey, images);
        }
    }

    return Array.from(byFolder.entries())
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

/** 取某夹下一个空闲的 __闲置__{token}_{NN}.png 名（token 沿用夹内已有闲置图，否则用夹名） */
function serverNextIdleName(dirAbs: string): string {
    let maxNum = 0;
    let token = path.basename(dirAbs);
    let tokenFromMax = '';
    for (const f of fs.readdirSync(dirAbs)) {
        const m = f.match(/^__闲置__(.+)_(\d+)\.png$/i);
        if (m) {
            const n = parseInt(m[2], 10);
            if (n > maxNum) { maxNum = n; tokenFromMax = m[1]; }
        }
    }
    if (tokenFromMax) token = tokenFromMax;
    let n = maxNum;
    let name: string;
    do {
        n++;
        name = `__闲置__${token}_${String(n).padStart(2, '0')}.png`;
    } while (fs.existsSync(path.join(dirAbs, name)));
    return name;
}

/** 读 portrait_canonical.ts，把某路径解析成它的内容代表键（无映射则返回自身） */
function serverResolveCanonicalPath(canonicalPath: string, webPath: string): string {
    try {
        if (!fs.existsSync(canonicalPath)) return webPath;
        const text = fs.readFileSync(canonicalPath, 'utf-8');
        const m = text.match(new RegExp(`"${serverEscapeRegExp(webPath)}"\\s*:\\s*"([^"]+)"`));
        return m?.[1] ?? webPath;
    } catch {
        return webPath;
    }
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
    // 源路径归一化：反斜杠/Windows 路径 → /assets/...（防其它入口传入非法路径）
    sourceWebPath = serverNormalizePortraitPath(sourceWebPath);
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

    // 文件名 = 「势力key_名字拼音」：正常武将等同 generalId；耿况这类 ID 错位者自动得到正确名。
    const keyNameMatch = generalsTextPre.match(
        new RegExp(`(\\w+)\\s*:\\s*\\{\\s*generalId\\s*:\\s*'${serverEscapeRegExp(generalId)}'\\s*,\\s*generalName\\s*:\\s*'([^']*)'`),
    );
    const factionKey = keyNameMatch?.[1] ?? generalId.split('_')[0];
    const generalNameForFile = keyNameMatch?.[2] ?? '';
    const baseName = generalNameForFile
        ? `${factionKey}_${serverToPinyinId(generalNameForFile)}`
        : generalId;
    const destAbs = path.join(folderAbs, `${baseName}.png`);
    const destWeb = `${folderWeb}${baseName}.png`;

    // 文件改名清单：调校记录（portrait_adjust images 键）随文件新名字迁移，不留孤儿
    const adjustMoves: Array<{ from: string; to: string }> = [];
    if (path.resolve(srcAbs) !== path.resolve(destAbs)) {
        // ① 旧绑定文件（可能在其他文件夹）→ 转为闲置命名 __闲置__，并入随机池（不删不丢）
        const oldPortraitWeb = serverGetCurrentPortraitPath(factionGeneralsPath, generalId);
        if (oldPortraitWeb && oldPortraitWeb.startsWith('/assets/')) {
            const oldAbs = serverWebPathToAbs(publicAssetsRoot, oldPortraitWeb);
            if (
                fs.existsSync(oldAbs) &&
                path.resolve(oldAbs) !== path.resolve(destAbs) &&
                path.resolve(oldAbs) !== path.resolve(srcAbs)
            ) {
                const oldDir = path.dirname(oldAbs);
                const backupName = serverNextIdleName(oldDir);
                fs.renameSync(oldAbs, path.join(oldDir, backupName));
                adjustMoves.push({ from: oldPortraitWeb, to: oldPortraitWeb.replace(/\/[^/]+$/, '/') + backupName });
                console.log(`  🗂️  [BindPortrait] 旧立绘转闲置 → ${backupName}`);
            }
        }
        // ② 目标位置已有文件（同文件夹覆盖场景）→ 转为闲置命名（旧图不丢，进随机池）
        if (fs.existsSync(destAbs)) {
            const backupName = serverNextIdleName(folderAbs);
            fs.renameSync(destAbs, path.join(folderAbs, backupName));
            adjustMoves.push({ from: destWeb, to: `${folderWeb}${backupName}` });
            console.log(`  🗂️  [BindPortrait] 目标位置旧立绘转闲置 → ${backupName}`);
        }
        // ③ 源图 → 目标（始终在源图自己的文件夹内，不跨文化区）：
        //    闲置图(__闲置__) 直接改名「认领」，不留重复；其它图复制（可能被他人共用，不夺走源图）。
        if (path.basename(srcAbs).startsWith('__闲置__')) {
            fs.renameSync(srcAbs, destAbs);
            adjustMoves.push({ from: sourceWebPath, to: destWeb });
        } else {
            fs.copyFileSync(srcAbs, destAbs);
        }
    }

    // 绑定后同步 portrait_adjust 调校数据：改名跟随迁移 + 源图调校 → 目标路径（防位置/缩放丢失）
    try {
        const portraitAdjustPath = path.resolve(__dirname, 'src/data/portrait_adjust.ts');
        if (fs.existsSync(portraitAdjustPath)) {
            const adjText = fs.readFileSync(portraitAdjustPath, 'utf-8');
            const adjData = serverParsePortraitAdjustExport(adjText);
            adjData.images = adjData.images ?? {};
            let changed = false;
            // 文件改名（旧图转闲置 / 闲置图认领改名）→ 调校记录跟着新名字走：
            // 以前只复制源图调校，被顶掉的旧图调校留在死路径下成孤儿，下次选用该闲置图时位置丢失
            const migrated = new Set<string>();
            for (const mv of adjustMoves) {
                const v = adjData.images[mv.from];
                if (v === undefined) continue;
                adjData.images[mv.to] = v;
                delete adjData.images[mv.from];
                migrated.add(mv.from);
                changed = true;
                console.log(`  📐 [BindPortrait] 调校随改名迁移: ${mv.from} → ${mv.to}`);
            }
            // 源图自身路径优先；没有则回退到内容代表键 canonical（兼容仅 F2 调过、源非代表的情况）。
            // 源图若已随改名迁移到 destWeb（闲置认领场景），自身值即最优，不再用 canonical 覆盖。
            if (!migrated.has(sourceWebPath)) {
                const srcCanonical = serverResolveCanonicalPath(portraitCanonicalPath, sourceWebPath);
                const srcAdj = adjData.images[sourceWebPath] ?? adjData.images[srcCanonical];
                if (srcAdj !== undefined) {
                    adjData.images[destWeb] = { ...(srcAdj as object) };
                    changed = true;
                    console.log(`  📐 [BindPortrait] 已同步调校数据: ${sourceWebPath} → ${destWeb}`);
                }
            }
            if (changed) {
                const content = serverFormatPortraitAdjustFile(adjData);
                fs.writeFileSync(portraitAdjustPath, content, 'utf-8');
            }
        }
    } catch (e) {
        console.warn(`  ⚠ [BindPortrait] 无法同步调校数据:`, e);
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

// ============================================================
// [NEW 2026-06-29] 实体批量管理 — 读/写/校验
// ============================================================

const REGION_TO_ELITE_FILE: Record<string, { file: string; varName: string }> = {
    JAPAN: { file: 'JapanExpeditionLegions.ts', varName: 'JAPAN_EXPEDITION_ELITE_LEGIONS' },
    KOREA: { file: 'KoreaExpeditionLegions.ts', varName: 'KOREA_EXPEDITION_ELITE_LEGIONS' },
    NORTHEAST: { file: 'NortheastExpeditionLegions.ts', varName: 'NORTHEAST_EXPEDITION_ELITE_LEGIONS' },
    STEPPE: { file: 'SteppeExpeditionLegions.ts', varName: 'STEPPE_EXPEDITION_ELITE_LEGIONS' },
    WESTERN: { file: 'WesternExpeditionLegions.ts', varName: 'WESTERN_EXPEDITION_ELITE_LEGIONS' },
    CENTRAL_ASIA: { file: 'CentralAsiaExpeditionLegions.ts', varName: 'CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS' },
    TIBET: { file: 'TibetExpeditionLegions.ts', varName: 'TIBET_EXPEDITION_ELITE_LEGIONS' },
    DIANQIAN: { file: 'DianQianExpeditionLegions.ts', varName: 'DIANQIAN_EXPEDITION_ELITE_LEGIONS' },
    LINGNAN: { file: 'LingnanExpeditionLegions.ts', varName: 'LINGNAN_EXPEDITION_ELITE_LEGIONS' },
    JIANGNAN: { file: 'JiangnanExpeditionLegions.ts', varName: 'JIANGNAN_EXPEDITION_ELITE_LEGIONS' },
    NORTH: { file: 'NorthExpeditionLegions.ts', varName: 'NORTH_EXPEDITION_ELITE_LEGIONS' },
    CENTRAL: { file: 'CentralExpeditionLegions.ts', varName: 'CENTRAL_EXPEDITION_ELITE_LEGIONS' },
    BASHU: { file: 'BashuExpeditionLegions.ts', varName: 'BASHU_EXPEDITION_ELITE_LEGIONS' },
    HEXI: { file: 'HexiExpeditionLegions.ts', varName: 'HEXI_EXPEDITION_ELITE_LEGIONS' },
};

function serverReadAllEntityData() {
    const factionText = fs.readFileSync(path.resolve(__dirname, 'src/data/factions.ts'), 'utf-8');
    const citiesText = fs.readFileSync(path.resolve(__dirname, 'src/data/cities_v2.ts'), 'utf-8');
    const sdnText = fs.readFileSync(path.resolve(__dirname, 'src/data/SandboxDisplayNames.ts'), 'utf-8');
    const scText = fs.readFileSync(path.resolve(__dirname, 'src/data/StartingCapitals.ts'), 'utf-8');
    const fgText = fs.readFileSync(path.resolve(__dirname, 'src/data/FactionGenerals.ts'), 'utf-8');
    // [2026-07-13 拆分] 档案在 general-skills/profiles.ts；战略技目录在 general-skills/catalogs.ts
    const gsText = fs.readFileSync(path.resolve(__dirname, 'src/data/general-skills/profiles.ts'), 'utf-8');
    const gsCatText = fs.readFileSync(path.resolve(__dirname, 'src/data/general-skills/catalogs.ts'), 'utf-8');
    const tscText = fs.readFileSync(path.resolve(__dirname, 'src/data/TacticalSkillCatalog.ts'), 'utf-8');

    // factions: { id, name }[]
    const factions = [...factionText.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)]
        .map(m => ({ id: m[1], name: m[2] }));

    // cities: parse block by block
    const cities: Array<{ id: string; name: string; factionId: string; lat: number; lng: number; type: string; troops: number; region?: string; mirror?: boolean }> = [];
    for (const m of citiesText.matchAll(/\{[^{}]*id:\s*'([^']+)'[^{}]*\}/g)) {
        const block = m[0];
        const id = m[1];
        const name = block.match(/name:\s*'([^']+)'/)?.[1] ?? '';
        const fId = block.match(/factionId:\s*'([^']+)'/)?.[1] ?? '';
        const lat = parseFloat(block.match(/lat:\s*([-\d.]+)/)?.[1] ?? '0');
        const lng = parseFloat(block.match(/lng:\s*([-\d.]+)/)?.[1] ?? '0');
        const type = block.match(/type:\s*'([^']+)'/)?.[1] ?? 'small_city';
        const troops = parseInt(block.match(/troops:\s*(\d+)/)?.[1] ?? '5000');
        const region = block.match(/region:\s*'([^']+)'/)?.[1];
        const mirror = /mirror:\s*true/.test(block) || undefined;
        if (name && fId) cities.push({ id, name, factionId: fId, lat, lng, type, troops, region, mirror });
    }

    // flags: { [factionId]: flagText } — keys may or may not be quoted
    const flags: Record<string, string> = {};
    for (const m of sdnText.matchAll(/(?:'([^']+)'|(\w+)):\s*'([^']*)'/g)) {
        const key = m[1] || m[2];
        if (key) flags[key] = m[3];
    }

    // startingCapitals: { [factionId]: cityId } — keys may or may not be quoted
    const capitals: Record<string, string> = {};
    for (const m of scText.matchAll(/(?:'([^']+)'|(\w+)):\s*'([^']+)'/g)) {
        const key = m[1] || m[2];
        if (key) capitals[key] = m[3];
    }

    // generals: { [factionId]: { generalId, generalName, portrait } }
    const generals: Record<string, { generalId: string; generalName: string; portrait: string }> = {};
    for (const m of fgText.matchAll(/(\w+):\s*\{\s*generalId:\s*'([^']+)',\s*generalName:\s*'([^']+)',\s*portrait:\s*'([^']*)'/g)) {
        generals[m[1]] = { generalId: m[2], generalName: m[3], portrait: m[4] };
    }

    // generalProfiles: { [generalId]: { tier, tacticalSkillId, strategicSkillId? } }
    // [FIX 2026-07-08] 档案解析不再依赖字段顺序/单行格式：
    //   旧正则要求 strategicSkillId 紧跟 tacticalSkillId，三格(advantage/balance/disadvantage)插在中间
    //   或多行写法都会把战略技读丢 → 10 个名将被误报"缺战略技"。现按条目块逐字段提取。
    //   且只认 GENERAL_PROFILES 块内的条目——粘贴到别的对象里的档案运行时不生效，单独收集报错。
    const profileEntryField = (body: string, name: string): string | undefined =>
        body.match(new RegExp(`(?:^|[,{\\s])${name}:\\s*'([^']*)'`))?.[1] || undefined;
    const profilesBlockRange = (() => {
        const kwIdx = gsText.indexOf('GENERAL_PROFILES');
        if (kwIdx === -1) return null;
        const openIdx = gsText.indexOf('= {', kwIdx);
        if (openIdx === -1) return null;
        let depth = 0;
        for (let i = openIdx + 2; i < gsText.length; i++) {
            if (gsText[i] === '{') depth++;
            else if (gsText[i] === '}') { depth--; if (depth === 0) return { start: openIdx + 2, end: i }; }
        }
        return null;
    })();
    const profiles: Record<string, {
        tier: string; tacticalSkillId: string; strategicSkillId?: string;
        advantageSkillId?: string; balanceSkillId?: string; disadvantageSkillId?: string; aptitude?: string;
        atkAdvantageSkillId?: string; atkBalanceSkillId?: string; atkDisadvantageSkillId?: string;
        defAdvantageSkillId?: string; defBalanceSkillId?: string; defDisadvantageSkillId?: string;
        attackStyle?: string;
    }> = {};
    const misplacedProfiles: string[] = [];
    /** GENERAL_PROFILES 块内有条目但缺 tacticalSkillId → 运行时无武将技 */
    const malformedProfiles: string[] = [];
    /** 档案键 ≠ generalId 字段（批量脚本截断事故检出）：{ 键: 错误的generalId } */
    const profileIdMismatches: Record<string, string> = {};
    for (const m of gsText.matchAll(/(\w+):\s*\{([^{}]*)\}/g)) {
        const body = m[2];
        if (!body.includes('generalId:')) continue;
        const tier = profileEntryField(body, 'tier');
        const tacticalSkillId = profileEntryField(body, 'tacticalSkillId');
        const inBlock = profilesBlockRange && m.index! >= profilesBlockRange.start && m.index! < profilesBlockRange.end;
        if (!inBlock) {
            if (tier) misplacedProfiles.push(m[1]);
            continue;
        }
        if (!tier || !tacticalSkillId) {
            if (tier && !tacticalSkillId) malformedProfiles.push(m[1]);
            continue;
        }
        const gidField = profileEntryField(body, 'generalId');
        if (gidField && gidField !== m[1]) profileIdMismatches[m[1]] = gidField;
        profiles[m[1]] = {
            tier, tacticalSkillId,
            strategicSkillId: profileEntryField(body, 'strategicSkillId'),
            advantageSkillId: profileEntryField(body, 'advantageSkillId'),
            balanceSkillId: profileEntryField(body, 'balanceSkillId'),
            disadvantageSkillId: profileEntryField(body, 'disadvantageSkillId'),
            atkAdvantageSkillId: profileEntryField(body, 'atkAdvantageSkillId'),
            atkBalanceSkillId: profileEntryField(body, 'atkBalanceSkillId'),
            atkDisadvantageSkillId: profileEntryField(body, 'atkDisadvantageSkillId'),
            defAdvantageSkillId: profileEntryField(body, 'defAdvantageSkillId'),
            defBalanceSkillId: profileEntryField(body, 'defBalanceSkillId'),
            defDisadvantageSkillId: profileEntryField(body, 'defDisadvantageSkillId'),
            aptitude: profileEntryField(body, 'aptitude'),
            attackStyle: profileEntryField(body, 'attackStyle'),
        };
    }

    // elites: merged from 14 files
    const elites: Record<string, { name: string; tier: number; region: string }> = {};
    for (const [region, info] of Object.entries(REGION_TO_ELITE_FILE)) {
        const fp = path.resolve(__dirname, 'src/data', info.file);
        if (!fs.existsSync(fp)) continue;
        const txt = fs.readFileSync(fp, 'utf-8');
        for (const m of txt.matchAll(/(\w+):\s*\{\s*name:\s*'([^']+)',\s*tier:\s*(\d)/g)) {
            elites[m[1]] = { name: m[2], tier: parseInt(m[3]), region };
        }
    }

    // tactical/strategic skill catalogs for UI dropdowns
    // 战术技：ts_xxx 定义在 TacticalSkillCatalog.ts（非 GeneralSkills.ts）。
    // 名将 profile.tacticalSkillId 已全迁移为 ts_xxx；旧 tac_01–10 仅作兼容映射，不再展示。
    // grid 用 index 生成圈码字（①..㊿），仅作目录序号展示。
    const circledNum = (n: number): string => {
        if (n >= 1 && n <= 20) return String.fromCodePoint(0x2460 + n - 1);
        if (n >= 21 && n <= 35) return String.fromCodePoint(0x3251 + n - 21);
        if (n >= 36 && n <= 50) return String.fromCodePoint(0x32B1 + n - 36);
        return String(n);
        };
        // 分配层（TACTICAL_ASSIGN_TIER）：随机分配技能时只允许 common 档
    const assignTierById = new Map<string, string>();
    for (const m of tscText.matchAll(/(ts_\d+):\s*'(common|limited|ai_defensive|underdog|gamble|star_survival)'/g)) {
        assignTierById.set(m[1], m[2]);
    }
    // 三类（优势/均势/劣势）：判据与 TacticalSkillCatalog.getTacticalTriClass 完全一致。
    //   此处用正则+内联映射而不 import 目录模块：vite 会 watch 配置文件的依赖，
    //   一旦 import 目录，每次改技能数据都会整个重启 dev server。两处若改必须同步改。
    const EFFECT_TO_TRI: Record<string, string> = {
        ally_power_mult: 'advantage', first_sortie_power_mult: 'advantage',
        ally_add_troops_opening: 'balance',
        enemy_sub_troops_opening: 'advantage', dual_sub_troops_opening: 'advantage',
        luck_variance_self: 'disadvantage', luck_variance_enemy: 'balance', luck_lock_self: 'disadvantage',
        steal_enemy_skill: 'balance', negate_enemy_skill: 'balance', partial_negate_enemy_skill: 'balance',
        reflect_enemy_opening_cut: 'balance', nullify_enemy_opening_cut: 'balance',
        cancel_enemy_terrain_buff: 'balance', halve_enemy_terrain_buff: 'balance',
        win_casualty_reduction: 'disadvantage', elite_casualty_reduction: 'disadvantage', post_recovery_rate: 'disadvantage',
        lose_enemy_casualty_boost: 'disadvantage', recompute_comeback: 'disadvantage',
        lose_zero_enemy_recovery: 'disadvantage', ally_add_troops_comeback: 'disadvantage',
    };
    const UNDERDOG_CONDS = new Set(['ratio_underdog', 'self_troops_below_enemy_pct', 'side_comeback', 'lose_as_underdog']);
    const VARIANCE_EFFECTS = new Set(['luck_variance_self', 'luck_lock_self', 'recompute_comeback']);
    const triClassById = new Map<string, string>();
    for (const m of tscText.matchAll(/id:\s*'(ts_\d+)'[\s\S]*?baseEffect:\s*'(\w+)',\s*condition:\s*'(\w+)'/g)) {
        const tri = UNDERDOG_CONDS.has(m[3]) || VARIANCE_EFFECTS.has(m[2]) ? 'disadvantage' : EFFECT_TO_TRI[m[2]];
        if (tri && !triClassById.has(m[1])) triClassById.set(m[1], tri);
    }
    const tacticalSkills: Array<{ id: string; grid: string; displayName: string; assignTier?: string; triClass?: string }> = [];
    for (const m of tscText.matchAll(/id:\s*'(ts_\d+)',\s*layer:\s*'[^']*',\s*series:\s*'[^']*',\s*index:\s*(\d+),\s*displayName:\s*'([^']+)'/g)) {
        tacticalSkills.push({
            id: m[1], grid: circledNum(parseInt(m[2])), displayName: m[3],
            assignTier: assignTierById.get(m[1]), triClass: triClassById.get(m[1]),
        });
    }
    const strategicSkills: Array<{ id: string; grid: string; displayName: string; effect: string; magnitude: number }> = [];
    // [2026-07-13 拆分] 战略技目录已在 general-skills/catalogs.ts（profiles.ts 里没有 str_ 条目）
    for (const m of gsCatText.matchAll(/(\w+):\s*\{\s*id:\s*'([^']+)',\s*grid:\s*'([^']+)',\s*displayName:\s*'([^']+)',\s*effect:\s*'([^']+)',\s*magnitude:\s*([\d.]+)/g)) {
        if (m[2].startsWith('str_')) strategicSkills.push({ id: m[2], grid: m[3], displayName: m[4], effect: m[5], magnitude: parseFloat(m[6]) });
    }

    return { factions, cities, flags, capitals, generals, profiles, elites, tacticalSkills, strategicSkills, misplacedProfiles, malformedProfiles, profileIdMismatches, regions: Object.keys(REGION_TO_ELITE_FILE) };
}

/** 归一化立绘路径：反斜杠→正斜杠、去盘符/public 前缀、补前导斜杠 → 统一 /assets/.../x.png。
 *  兼容直接粘贴 Windows 路径（C:\...\public\assets\X\y.png、assets\X\y.png 等），防写坏 TS 文件。 */
function serverNormalizePortraitPath(p: string): string {
    if (!p) return p;
    const s = p.replace(/\\/g, '/');
    const i = s.toLowerCase().indexOf('/assets/');
    if (i >= 0) return s.slice(i);
    const j = s.toLowerCase().indexOf('assets/');
    if (j >= 0) return '/' + s.slice(j);
    return s;
}

function serverSaveGeneral(data: {
    oldGeneralId?: string;
    factionId: string;
    generalId: string;
    generalName: string;
    portrait: string;
    tier: string;
    tacticalSkillId: string;
    strategicSkillId?: string;
    advantageSkillId?: string;
    balanceSkillId?: string;
    disadvantageSkillId?: string;
    atkAdvantageSkillId?: string;
    atkBalanceSkillId?: string;
    atkDisadvantageSkillId?: string;
    defAdvantageSkillId?: string;
    defBalanceSkillId?: string;
    defDisadvantageSkillId?: string;
    aptitude?: string;
    attackStyle?: 'attack' | 'defense' | 'balanced' | '';
}) {
    if (data.attackStyle !== undefined && data.attackStyle !== ''
        && !['attack', 'defense', 'balanced'].includes(data.attackStyle)) {
        throw new Error(`无效 attackStyle：${data.attackStyle}`);
    }
    // 立绘路径先归一化：反斜杠/Windows 路径 → /assets/.../x.png（根治粘贴 Windows 路径写坏 TS 文件）
    if (data.portrait) data.portrait = serverNormalizePortraitPath(data.portrait);
    // 立绘只允许 PNG（服务端强制，防客户端校验被绕过）；非 PNG 直接拒绝，不写任何盘
    if (data.portrait && !data.portrait.toLowerCase().endsWith('.png')) {
        throw new Error(`立绘路径必须是 .png，不支持 .jpg 等格式：${data.portrait}`);
    }

    const fgPath = path.resolve(__dirname, 'src/data/FactionGenerals.ts');
    // [2026-07-13 拆分] 档案写入目标 = general-skills/profiles.ts（GeneralSkills.ts 只是转发壳，勿写）
    const gsPath = path.resolve(__dirname, 'src/data/general-skills/profiles.ts');
    let fgText = fs.readFileSync(fgPath, 'utf-8');
    let gsText = fs.readFileSync(gsPath, 'utf-8');
    const results: string[] = [];

    // FactionGenerals.ts
    const fgLine = `${data.factionId}: { generalId: '${data.generalId}', generalName: '${data.generalName}', portrait: '${data.portrait}' },`;
    if (fgText.includes(`${data.factionId}:`)) {
        fgText = serverReplaceObjectLine(fgText, 'FACTION_GENERALS', data.factionId, `    ${fgLine}`);
        results.push('FactionGenerals.ts: replaced');
    } else {
        fgText = serverInsertIntoStructure(fgText, 'FACTION_GENERALS', fgLine, '    ');
        results.push('FactionGenerals.ts: inserted');
    }

    // GeneralSkills.ts
    // [FIX 2026-07-08] 重写档案前先读出原条目里的三格/aptitude/行尾注释：
    //   旧实现整行重写只留 4 个字段，编辑面板保存一次就会把 advantage/balance/disadvantage/aptitude 静默抹掉。
    //   合并规则：编辑器传了新值用新值，没传保留旧值。
    const existingEntry = (() => {
        const mm = gsText.match(new RegExp(`(?:^|\\n)\\s*${data.generalId}:\\s*\\{([^{}]*)\\}(\\s*,?[ \\t]*(//[^\\n]*)?)`));
        if (!mm) return { comment: '' };
        const body = mm[1];
        const field = (name: string): string | undefined =>
            body.match(new RegExp(`(?:^|[,{\\s])${name}:\\s*'([^']*)'`))?.[1] || undefined;
        return {
            strategicSkillId: field('strategicSkillId'),
            advantageSkillId: field('advantageSkillId'),
            balanceSkillId: field('balanceSkillId'),
            disadvantageSkillId: field('disadvantageSkillId'),
            atkAdvantageSkillId: field('atkAdvantageSkillId'),
            atkBalanceSkillId: field('atkBalanceSkillId'),
            atkDisadvantageSkillId: field('atkDisadvantageSkillId'),
            defAdvantageSkillId: field('defAdvantageSkillId'),
            defBalanceSkillId: field('defBalanceSkillId'),
            defDisadvantageSkillId: field('defDisadvantageSkillId'),
            aptitude: field('aptitude'),
            attackStyle: field('attackStyle'),
            comment: mm[3] ?? '',
        };
    })();
    // 合并语义：字段未传(undefined)=保留旧值；传空串=显式清除；传值=覆盖
    const mergeField = (incoming: string | undefined, old: string | undefined): string | undefined =>
        incoming === undefined ? old : (incoming || undefined);
    const merged = {
        strategicSkillId: mergeField(data.strategicSkillId, existingEntry.strategicSkillId),
        advantageSkillId: mergeField(data.advantageSkillId, existingEntry.advantageSkillId),
        balanceSkillId: mergeField(data.balanceSkillId, existingEntry.balanceSkillId),
        disadvantageSkillId: mergeField(data.disadvantageSkillId, existingEntry.disadvantageSkillId),
        atkAdvantageSkillId: mergeField(data.atkAdvantageSkillId, existingEntry.atkAdvantageSkillId),
        atkBalanceSkillId: mergeField(data.atkBalanceSkillId, existingEntry.atkBalanceSkillId),
        atkDisadvantageSkillId: mergeField(data.atkDisadvantageSkillId, existingEntry.atkDisadvantageSkillId),
        defAdvantageSkillId: mergeField(data.defAdvantageSkillId, existingEntry.defAdvantageSkillId),
        defBalanceSkillId: mergeField(data.defBalanceSkillId, existingEntry.defBalanceSkillId),
        defDisadvantageSkillId: mergeField(data.defDisadvantageSkillId, existingEntry.defDisadvantageSkillId),
        aptitude: mergeField(data.aptitude, existingEntry.aptitude),
        attackStyle: mergeField(data.attackStyle, existingEntry.attackStyle),
    };
    const parts = [
        `generalId: '${data.generalId}'`,
        `tier: '${data.tier}'`,
        `tacticalSkillId: '${data.tacticalSkillId}'`,
    ];
    if (merged.advantageSkillId) parts.push(`advantageSkillId: '${merged.advantageSkillId}'`);
    if (merged.balanceSkillId) parts.push(`balanceSkillId: '${merged.balanceSkillId}'`);
    if (merged.disadvantageSkillId) parts.push(`disadvantageSkillId: '${merged.disadvantageSkillId}'`);
    if (merged.atkAdvantageSkillId) parts.push(`atkAdvantageSkillId: '${merged.atkAdvantageSkillId}'`);
    if (merged.atkBalanceSkillId) parts.push(`atkBalanceSkillId: '${merged.atkBalanceSkillId}'`);
    if (merged.atkDisadvantageSkillId) parts.push(`atkDisadvantageSkillId: '${merged.atkDisadvantageSkillId}'`);
    if (merged.defAdvantageSkillId) parts.push(`defAdvantageSkillId: '${merged.defAdvantageSkillId}'`);
    if (merged.defBalanceSkillId) parts.push(`defBalanceSkillId: '${merged.defBalanceSkillId}'`);
    if (merged.defDisadvantageSkillId) parts.push(`defDisadvantageSkillId: '${merged.defDisadvantageSkillId}'`);
    if (merged.strategicSkillId) parts.push(`strategicSkillId: '${merged.strategicSkillId}'`);
    if (merged.aptitude) parts.push(`aptitude: '${merged.aptitude}'`);
    if (merged.attackStyle) parts.push(`attackStyle: '${merged.attackStyle}'`);
    const gsLine = `${data.generalId}: { ${parts.join(', ')} },${existingEntry.comment ? ' ' + existingEntry.comment.trim().replace(/^,\s*/, '') : ''}`;
    if (gsText.includes(`${data.generalId}:`)) {
        gsText = serverReplaceObjectLine(gsText, 'GENERAL_PROFILES', data.generalId, `    ${gsLine}`);
        results.push('general-skills/profiles.ts: replaced');
    } else {
        gsText = serverInsertIntoStructure(gsText, 'GENERAL_PROFILES', gsLine, '    ');
        results.push('general-skills/profiles.ts: inserted');
    }

    // [换将清理] generalId 变了 → 删旧 generalId 的孤儿技能档，防 profile 残留
    if (data.oldGeneralId && data.oldGeneralId !== data.generalId) {
        try {
            gsText = serverDeleteObjectLine(gsText, 'GENERAL_PROFILES', data.oldGeneralId);
            results.push(`general-skills/profiles.ts: 清理旧档 ${data.oldGeneralId}`);
        } catch { /* 旧档不存在，忽略 */ }
    }

    // 检查立绘文件是否存在
    const portraitAbsPath = path.resolve(__dirname, 'public', data.portrait.replace(/^\//, ''));
    if (!fs.existsSync(portraitAbsPath)) {
        results.push(`⚠ 立绘文件不存在: ${data.portrait}`);
    }

    markBatchSaveWrite();
    fs.writeFileSync(fgPath, guardSerializedDataText(fgText, 'FactionGenerals.ts'), 'utf-8');
    fs.writeFileSync(gsPath, guardSerializedDataText(gsText, 'general-skills/profiles.ts'), 'utf-8');
    return results;
}

function serverSaveEliteLegion(data: {
    factionId: string;
    eliteName: string;
    eliteTier: number;
    region: string;
}) {
    const info = REGION_TO_ELITE_FILE[data.region];
    if (!info) throw new Error(`未知区域: ${data.region}`);

    // [FIX 2026-07-01] 精锐唯一性：先把该番号从「所有其它区文件」清掉。
    //   根因——elites 在 entity-data 里按 14 区文件固定顺序合并、相同 factionId「后者覆盖前者」。
    //   若一个番号同时存在于多个区文件（如 chen 同在 LINGNAN+JIANGNAN），保存到 cityRegion 后，
    //   排在更后面的旧区文件仍会覆盖新值 → 表现为「保存成功却回退」。清掉其它区即可根治。
    const cleanedFrom: string[] = [];
    for (const [region, rinfo] of Object.entries(REGION_TO_ELITE_FILE)) {
        if (region === data.region) continue;
        const ofp = path.resolve(__dirname, 'src/data', rinfo.file);
        if (!fs.existsSync(ofp)) continue;
        let otext = fs.readFileSync(ofp, 'utf-8');
        const okwIdx = otext.indexOf(rinfo.varName);
        if (okwIdx === -1) continue;
        if (findObjectKeyIdx(otext, okwIdx, data.factionId) === -1) continue;
        otext = serverRemoveObjectKey(otext, rinfo.varName, data.factionId);
        markBatchSaveWrite();
        fs.writeFileSync(ofp, otext, 'utf-8');
        cleanedFrom.push(rinfo.file);
    }

    const fp = path.resolve(__dirname, 'src/data', info.file);
    let text = fs.readFileSync(fp, 'utf-8');

    // 存在性判断用 findObjectKeyIdx（带词边界），避免 text.includes 把 `monong:` 误判成 `nong:` 等子串。
    const kwIdx = text.indexOf(info.varName);
    const exists = kwIdx !== -1 && findObjectKeyIdx(text, kwIdx, data.factionId) !== -1;
    const line = `${data.factionId}: { name: '${data.eliteName}', tier: ${data.eliteTier} },`;
    if (exists) {
        text = serverReplaceObjectLine(text, info.varName, data.factionId, `    ${line}`);
    } else {
        text = serverInsertIntoStructure(text, info.varName, line, '    ');
    }

    markBatchSaveWrite();
    fs.writeFileSync(fp, text, 'utf-8');
    return { file: info.file, operation: exists ? 'replace' : 'insert', cleanedFrom };
}

/**
 * batch-manager 中允许武将佩戴、且必须至少有一名武将佩戴的战略技。
 * str_11 长驱深入是远征默认能力；据险而守与守土继绝分别是关隘、文化中心系统技。
 * 三者均不纳入武将技能覆盖检查。
 */
const REQUIRED_STRATEGIC_SKILL_IDS = [
    'str_01', 'str_10', 'str_12',            // 加速
    'str_06', 'str_07', 'str_13', 'str_28',  // 续航
    'str_16', 'str_17', 'str_18',            // 视野
    'str_19', 'str_20', 'str_21',            // 威慑
    'str_22', 'str_23', 'str_24',            // 纵横
    'str_05', 'str_25', 'str_26', 'str_27',  // 防务
] as const;

function serverCheckGeneralSkillCoverage(data = serverReadAllEntityData()) {
    const tacticalWearers = new Map<string, number>();
    const strategicWearers = new Map<string, number>();

    for (const prof of Object.values(data.profiles)) {
        // 只认现行攻防六槽。tacticalSkillId 与旧三槽仅是兼容回退，不算实际覆盖。
        for (const id of [
            prof.atkAdvantageSkillId, prof.atkBalanceSkillId, prof.atkDisadvantageSkillId,
            prof.defAdvantageSkillId, prof.defBalanceSkillId, prof.defDisadvantageSkillId,
        ]) {
            if (id) tacticalWearers.set(id, (tacticalWearers.get(id) ?? 0) + 1);
        }
        if (prof.strategicSkillId) {
            strategicWearers.set(
                prof.strategicSkillId,
                (strategicWearers.get(prof.strategicSkillId) ?? 0) + 1,
            );
        }
    }

    const strategicNames = new Map(data.strategicSkills.map(s => [s.id, s.displayName]));
    const unusedTactical = data.tacticalSkills
        .filter(s => (tacticalWearers.get(s.id) ?? 0) === 0)
        .map(s => ({ id: s.id, displayName: s.displayName }));
    const unusedStrategic = REQUIRED_STRATEGIC_SKILL_IDS
        .filter(id => (strategicWearers.get(id) ?? 0) === 0)
        .map(id => ({ id, displayName: strategicNames.get(id) ?? id }));

    return {
        tactical: {
            total: data.tacticalSkills.length,
            used: data.tacticalSkills.length - unusedTactical.length,
        },
        strategic: {
            total: REQUIRED_STRATEGIC_SKILL_IDS.length,
            used: REQUIRED_STRATEGIC_SKILL_IDS.length - unusedStrategic.length,
        },
        unusedTactical,
        unusedStrategic,
    };
}

// ============================================================
// [NEW 2026-07-14] 武将技编辑器（/skill-editor.html）服务端
//   原则与 serverReadAllEntityData 相同：纯文本解析，不 import 目录模块
//   （import 会让 vite watch 数据文件，改一次技能就重启一次 dev server）。
//   写盘统一走 guardSerializedDataText 防线。
//   数值治理：magnitude 不接受自由数字，只接受"档位"，服务端查表写标准值
//   （四币平衡定稿唯一数值来源，见 docs/02-design/武将技-四币平衡定稿.md）。
// ============================================================

const SE_TSC_PATH = 'src/data/TacticalSkillCatalog.ts';
/** 定稿锁定值（百折不挠/兵不血刃），编辑器禁改档位 */
const SE_LOCKED_MAGNITUDE = new Set(['ts_026', 'ts_032']);

/** baseEffect → 货币家族（决定档位下拉；不在表内 = 档位不可编辑，只能改元数据） */
const SE_FAMILY: Record<string, string> = {
    ally_power_mult: 'power', first_sortie_power_mult: 'power', first_sortie_comeback_mult: 'power',
    enemy_sub_troops_opening: 'pct', ally_add_troops_opening: 'pct', dual_sub_troops_opening: 'pct',
    negate_enemy_skill: 'negate', partial_negate_enemy_skill: 'negate',
    steal_enemy_skill: 'steal',
    luck_variance_self: 'luck', luck_variance_enemy: 'luck',
    win_casualty_reduction: 'casualty', elite_casualty_reduction: 'casualty',
    lose_enemy_casualty_boost: 'bite', post_recovery_rate: 'recovery',
    battle_duration_mult: 'duration',
};
/** 家族 → 档位（luck 家族写 [luckMin, luckMax]，其余写 magnitude） */
const SE_TIERS: Record<string, Record<string, number | [number, number]>> = {
    power: { '通用 ×1.05': 1.05, '条件/专属 ×1.10': 1.1, '绝品 ×1.15': 1.15 },
    pct: { '通用 5%': 0.05, '条件/专属 9%': 0.09, '绝品 13%': 0.13 },
    negate: { '通用 25%': 0.25, '专属 70%': 0.7, '绝品 100%': 1 },
    steal: { '通用 15%': 0.15, '专属 50%': 0.5 },
    luck: { '通用 [0.7,1.3]': [0.7, 1.3], '守城条件 [0.6,1.4]': [0.6, 1.4], '专属 [0.5,1.5]': [0.5, 1.5] },
    casualty: { '通用 0.3': 0.3, '专属 0.5': 0.5 },
    bite: { '通用 1.25': 1.25, '专属 1.5': 1.5 },
    recovery: { '标准 0.5': 0.5 },
    duration: { '速战 ×0.7': 0.7, '拖延 ×1.4': 1.4 },
};
const SE_CONDITIONS = [
    'always', 'terrain_mountain', 'terrain_plain', 'terrain_sea',
    'battle_siege_attacker', 'battle_siege_defender', 'battle_field',
    'ratio_underdog', 'self_troops_reach_ten_thousand', 'enemy_different_culture',
    'enemy_famous_general', 'side_comeback', 'enemy_troops_below_pct',
    'self_troops_below_enemy_pct', 'lose_as_underdog', 'has_elite_legion',
    'first_sortie', 'siege_attacker_on_water',
];

function seReadTagTable(text: string, tableName: string): Record<string, string> {
    const out: Record<string, string> = {};
    const kw = text.indexOf(`const ${tableName}`);
    if (kw === -1) return out;
    const end = text.indexOf('\n};', kw);
    if (end === -1) return out;
    for (const m of text.slice(kw, end).matchAll(/(ts_\d+):\s*'([^']*)'/g)) out[m[1]] = m[2];
    return out;
}

function seEntryField(block: string, name: string): string | undefined {
    return block.match(new RegExp(`(?:^|[,{\\s])${name}:\\s*'([^']*)'`))?.[1] || undefined;
}
function seEntryNum(block: string, name: string): number | undefined {
    const m = block.match(new RegExp(`(?:^|[,{\\s])${name}:\\s*([\\d.]+)`));
    return m ? parseFloat(m[1]) : undefined;
}

function seFindEntryBlock(text: string, id: string): { start: number; end: number } {
    const idIdx = text.indexOf(`id: '${id}'`);
    if (idIdx === -1) throw new Error(`目录中找不到 ${id}`);
    let start = idIdx;
    while (start > 0 && text[start] !== '{') start--;
    let depth = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end === -1) throw new Error(`${id} 条目括号不闭合`);
    return { start, end };
}

/** 字符串字段 upsert（value=null 删除字段）；新字段插在 id 之后保持可读 */
function seUpsertStr(block: string, field: string, value: string | null): string {
    const re = new RegExp(`\\s*${field}:\\s*'[^']*',?`);
    if (value === null) return re.test(block) ? block.replace(re, '') : block;
    if (/['\n\r]/.test(value)) throw new Error(`${field} 含非法字符（单引号/换行）`);
    if (re.test(block)) return block.replace(re, ` ${field}: '${value}',`);
    return block.replace(/(id:\s*'ts_\d+',)/, `$1 ${field}: '${value}',`);
}
/** 数值字段 upsert；新字段插在 magnitude 之后 */
function seUpsertNum(block: string, field: string, value: number): string {
    const re = new RegExp(`(${field}:\\s*)[\\d.]+`);
    if (re.test(block)) return block.replace(re, `$1${value}`);
    return block.replace(/(magnitude:\s*[\d.]+\s*,?)/, `$1 ${field}: ${value},`);
}
/** 从四张散表中移除 id（增量迁移：内联字段写入后散表条目退役） */
function seRemoveFromTagTables(text: string, id: string): string {
    let out = text;
    for (const table of ['SKILL_SITUATION_TAG', 'SKILL_USAGE_TAG', 'SKILL_EXCLUSIVE_TAG', 'SKILL_CHARACTER']) {
        const kw = out.indexOf(`const ${table}`);
        if (kw === -1) continue;
        const end = out.indexOf('\n};', kw);
        if (end === -1) continue;
        const seg = out.slice(kw, end).replace(new RegExp(`${id}:\\s*'[^']*',?\\s*`, 'g'), '');
        out = out.slice(0, kw) + seg + out.slice(end);
    }
    return out;
}

/** 全目录合并视图 + 佩戴实况 + 在册名录 */
function serverSkillEditorList() {
    const text = fs.readFileSync(path.resolve(__dirname, SE_TSC_PATH), 'utf-8');
    const data = serverReadAllEntityData();
    const wearers = new Map<string, string[]>();
    for (const [gid, prof] of Object.entries(data.profiles)) {
        for (const sid of [
            prof.atkAdvantageSkillId, prof.atkBalanceSkillId, prof.atkDisadvantageSkillId,
            prof.defAdvantageSkillId, prof.defBalanceSkillId, prof.defDisadvantageSkillId,
        ]) {
            if (!sid) continue;
            if (!wearers.has(sid)) wearers.set(sid, []);
            wearers.get(sid)!.push(gid);
        }
    }
    const gidInfo = new Map<string, { name: string; tier: string }>();
    for (const g of Object.values(data.generals)) {
        gidInfo.set(g.generalId, { name: g.generalName, tier: data.profiles[g.generalId]?.tier ?? '?' });
    }
    const sitTable = seReadTagTable(text, 'SKILL_SITUATION_TAG');
    const useTable = seReadTagTable(text, 'SKILL_USAGE_TAG');
    const exTable = seReadTagTable(text, 'SKILL_EXCLUSIVE_TAG');
    const chTable = seReadTagTable(text, 'SKILL_CHARACTER');
    const triById = new Map(data.tacticalSkills.map(s => [s.id, s.triClass]));
    const TRI_CN: Record<string, string> = { advantage: '优势', balance: '均势', disadvantage: '劣势' };

    const skills: any[] = [];
    const seen = new Set<string>();
    for (const m of text.matchAll(/id:\s*'(ts_\d+)'/g)) {
        const id = m[1];
        if (seen.has(id)) continue;
        seen.add(id);
        const { start, end } = seFindEntryBlock(text, id);
        const block = text.slice(start, end);
        const inlineSit = seEntryField(block, 'situationTag');
        const inlineUse = seEntryField(block, 'usageTag');
        const ownerGeneralId = seEntryField(block, 'ownerGeneralId');
        const ownerName = seEntryField(block, 'ownerName') ?? (ownerGeneralId ? gidInfo.get(ownerGeneralId)?.name : undefined) ?? chTable[id];
        const baseEffect = seEntryField(block, 'baseEffect') ?? '';
        const wearerGids = wearers.get(id) ?? [];
        skills.push({
            id,
            displayName: seEntryField(block, 'displayName') ?? '',
            sourceQuote: seEntryField(block, 'sourceQuote') ?? '',
            baseEffect,
            condition: seEntryField(block, 'condition') ?? '',
            phase: seEntryField(block, 'phase') ?? '',
            magnitude: seEntryNum(block, 'magnitude'),
            luckMin: seEntryNum(block, 'luckMin'),
            luckMax: seEntryNum(block, 'luckMax'),
            engineStatus: seEntryField(block, 'engineStatus') ?? '',
            note: seEntryField(block, 'note') ?? '',
            family: SE_FAMILY[baseEffect] ?? null,
            locked: SE_LOCKED_MAGNITUDE.has(id),
            situationTag: inlineSit ?? sitTable[id] ?? TRI_CN[triById.get(id) ?? ''] ?? '优势',
            situationSource: inlineSit ? 'inline' : sitTable[id] ? 'table' : 'derived',
            usageTag: inlineUse ?? useTable[id] ?? '通用',
            usageSource: inlineUse ? 'inline' : useTable[id] ? 'table' : 'default',
            ownerGeneralId: ownerGeneralId ?? null,
            ownerName: ownerName ?? null,
            ownerSource: ownerGeneralId ? 'inline' : chTable[id] ? 'table' : null,
            exclusive: ownerGeneralId ? '专用' : (exTable[id] ?? '通行'),
            status: seEntryField(block, 'status') ?? 'active',
            wearers: wearerGids.map(g => ({ gid: g, name: gidInfo.get(g)?.name ?? g, tier: gidInfo.get(g)?.tier ?? '?' })),
        });
    }
    const generals = [...gidInfo.entries()].map(([gid, v]) => ({ generalId: gid, name: v.name, tier: v.tier }));
    return { skills, generals, tiers: SE_TIERS, conditions: SE_CONDITIONS };
}

/** 保存一条：元数据内联写入 + 档位查表写数值 + 散表迁移退役 */
function serverSkillEditorSave(body: {
    id: string; situationTag?: string; usageTag?: string;
    ownerGeneralId?: string | null; ownerName?: string | null;
    status?: string; tierLabel?: string;
}): { warnings: string[] } {
    const warnings: string[] = [];
    if (!/^ts_\d+$/.test(body.id)) throw new Error('非法 id');
    if (body.situationTag && !['优势', '均势', '劣势'].includes(body.situationTag)) throw new Error('非法三势标签');
    if (body.usageTag && !['通用', '攻击', '防御'].includes(body.usageTag)) throw new Error('非法攻防标签');
    if (body.status && !['active', 'retired'].includes(body.status)) throw new Error('非法状态');
    const data = serverReadAllEntityData();
    if (body.ownerGeneralId) {
        if (!data.profiles[body.ownerGeneralId]) throw new Error(`典故主 ${body.ownerGeneralId} 不在册（须为在册武将 generalId）`);
        if (!body.ownerName) throw new Error('指定典故主时须同时给 ownerName');
    }
    const fp = path.resolve(__dirname, SE_TSC_PATH);
    let text = fs.readFileSync(fp, 'utf-8');
    const { start, end } = seFindEntryBlock(text, body.id);
    let block = text.slice(start, end);

    if (body.situationTag) block = seUpsertStr(block, 'situationTag', body.situationTag);
    if (body.usageTag) block = seUpsertStr(block, 'usageTag', body.usageTag);
    if (body.status) block = seUpsertStr(block, 'status', body.status);
    if (body.ownerGeneralId !== undefined) {
        block = seUpsertStr(block, 'ownerGeneralId', body.ownerGeneralId);
        block = seUpsertStr(block, 'ownerName', body.ownerGeneralId ? (body.ownerName ?? null) : null);
    }
    if (body.tierLabel) {
        if (SE_LOCKED_MAGNITUDE.has(body.id)) throw new Error(`${body.id} 为定稿锁定值，禁改档位`);
        const baseEffect = seEntryField(block, 'baseEffect') ?? '';
        const family = SE_FAMILY[baseEffect];
        if (!family) throw new Error(`效果 ${baseEffect} 不在可调档家族内`);
        const v = SE_TIERS[family]?.[body.tierLabel];
        if (v === undefined) throw new Error(`家族 ${family} 无档位「${body.tierLabel}」`);
        if (Array.isArray(v)) {
            block = seUpsertNum(block, 'luckMin', v[0]);
            block = seUpsertNum(block, 'luckMax', v[1]);
        } else {
            block = block.replace(/(magnitude:\s*)[\d.]+/, `$1${v}`);
        }
    }
    text = text.slice(0, start) + block + text.slice(end);
    text = seRemoveFromTagTables(text, body.id);
    markBatchSaveWrite();
    fs.writeFileSync(fp, guardSerializedDataText(text, SE_TSC_PATH), 'utf-8');

    // 保存后即时体检（进门安检的"出门提示"）
    const quote = seEntryField(block, 'sourceQuote') ?? '';
    if (body.ownerGeneralId && body.ownerName && !quote.includes(body.ownerName)) {
        warnings.push(`出处未提到典故主「${body.ownerName}」，请人工核对史料`);
    }
    return { warnings };
}

/** 新增一条：四字技名 + 全局查重 + 自动 id + 档位写标准值 + 元数据必填 */
function serverSkillEditorCreate(body: {
    displayName: string; sourceQuote: string; baseEffect: string; condition: string;
    situationTag: string; usageTag: string; tierLabel: string;
    ownerGeneralId?: string | null; ownerName?: string | null; note?: string;
}): { id: string } {
    if (!/^[一-龥]{4}$/.test(body.displayName)) throw new Error('技名必须是四字汉语（定稿：技能名一律四字成语）');
    const family = SE_FAMILY[body.baseEffect];
    if (!family) throw new Error(`baseEffect ${body.baseEffect} 不在可新增家族内`);
    if (!SE_CONDITIONS.includes(body.condition)) throw new Error(`非法条件 ${body.condition}`);
    if (!['优势', '均势', '劣势'].includes(body.situationTag)) throw new Error('三势标签必填（优势/均势/劣势）');
    if (!['通用', '攻击', '防御'].includes(body.usageTag)) throw new Error('攻防标签必填');
    const v = SE_TIERS[family]?.[body.tierLabel];
    if (v === undefined) throw new Error(`档位必填且须属于家族 ${family}`);
    const data = serverReadAllEntityData();
    if (data.tacticalSkills.some(s => s.displayName === body.displayName)) throw new Error(`技名「${body.displayName}」已存在，禁止同名`);
    if (body.ownerGeneralId && !data.profiles[body.ownerGeneralId]) throw new Error(`典故主 ${body.ownerGeneralId} 不在册`);
    if (body.ownerGeneralId && !body.ownerName) throw new Error('指定典故主时须同时给 ownerName');
    for (const s of [body.sourceQuote, body.note ?? '', body.ownerName ?? '']) {
        if (/['\n\r]/.test(s)) throw new Error('文本字段不得含 ASCII 单引号/换行（引号请用“”）');
    }
    const fp = path.resolve(__dirname, SE_TSC_PATH);
    let text = fs.readFileSync(fp, 'utf-8');
    let maxIdx = 0;
    for (const m of text.matchAll(/id:\s*'ts_(\d+)'/g)) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
    const nextId = `ts_${maxIdx + 1}`;
    const series = family === 'power' ? 'enhance' : family === 'luck' ? 'fate'
        : (family === 'negate' || family === 'steal') ? 'counter'
        : (family === 'casualty' || family === 'bite' || family === 'recovery') ? 'casualty' : 'troop';
    const phase = family === 'pct' ? 'pre_opening_troops'
        : (family === 'casualty' || family === 'bite') ? 'mid_battle_passive'
        : family === 'recovery' ? 'post_battle' : 'opening_roll';
    const magnitude = Array.isArray(v) ? 1 : v;
    const luckPart = Array.isArray(v) ? ` luckMin: ${v[0]}, luckMax: ${v[1]},` : '';
    const ownerPart = body.ownerGeneralId ? ` ownerGeneralId: '${body.ownerGeneralId}', ownerName: '${body.ownerName}',` : '';
    const notePart = body.note ? ` note: '${body.note}',` : '';
    const line = `    { id: '${nextId}', layer: 'tactical', series: '${series}', index: ${maxIdx + 1}, displayName: '${body.displayName}', sourceQuote: '${body.sourceQuote}', baseEffect: '${body.baseEffect}', condition: '${body.condition}', phase: '${phase}', magnitude: ${magnitude},${luckPart} engineStatus: 'ready', situationTag: '${body.situationTag}', usageTag: '${body.usageTag}',${ownerPart} status: 'active',${notePart} },\n`;
    const anchor = /\n\];\n\nexport const TACTICAL_SKILL_ENTRIES_V1/;
    if (!anchor.test(text)) throw new Error('找不到目录尾部插入锚点');
    text = text.replace(anchor, `\n${line}];\n\nexport const TACTICAL_SKILL_ENTRIES_V1`);
    markBatchSaveWrite();
    fs.writeFileSync(fp, guardSerializedDataText(text, SE_TSC_PATH), 'utf-8');
    return { id: nextId };
}

function serverValidateEntities(): {
    issues: Array<{ level: string; msg: string; factionId?: string }>;
    stats: {
        attackStyle: {
            registered: { covered: number; total: number };
            famous: { covered: number; total: number };
        };
    };
} {
    const data = serverReadAllEntityData();
    const issues: Array<{ level: string; msg: string; factionId?: string }> = [];

    const cityById = new Map(data.cities.map(c => [c.id, c]));
    const factionSet = new Set(data.factions.map(f => f.id));
    const skipFactions = new Set(['panjun']);
    const validAttackStyles = new Set(['attack', 'defense', 'balanced']);

    // P-01 影子字段审计：只按 FactionGenerals 在册名册检查，孤儿 profile 不参与。
    let attackStyleCovered = 0;
    let famousTotal = 0;
    let famousAttackStyleCovered = 0;
    for (const [fId, g] of Object.entries(data.generals)) {
        const prof = data.profiles[g.generalId];
        const style = prof?.attackStyle;
        const isFamous = prof?.tier === 'famous';
        if (isFamous) famousTotal++;
        if (style && validAttackStyles.has(style)) {
            attackStyleCovered++;
            if (isFamous) famousAttackStyleCovered++;
        } else if (!style) {
            issues.push({
                level: 'warn',
                msg: `武将 "${g.generalName}"(${g.generalId}) 缺 attackStyle 攻守风格`,
                factionId: fId,
            });
        } else {
            issues.push({
                level: 'error',
                msg: `武将 "${g.generalName}"(${g.generalId}) attackStyle 值无效：${style}`,
                factionId: fId,
            });
        }
    }

    // 1. 据点间距 < 50km
    for (let i = 0; i < data.cities.length; i++) {
        for (let j = i + 1; j < data.cities.length; j++) {
            const a = data.cities[i], b = data.cities[j];
            const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
            if (km < 50) {
                issues.push({ level: 'error', msg: `据点 "${a.name}" 与 "${b.name}" 间距仅 ${km.toFixed(1)}km (< 50km)` });
            }
        }
    }

    // 2. 重复据点 ID
    const cityIdCount = new Map<string, number>();
    for (const c of data.cities) cityIdCount.set(c.id, (cityIdCount.get(c.id) ?? 0) + 1);
    cityIdCount.forEach((count, id) => {
        if (count > 1) issues.push({ level: 'error', msg: `据点 ID "${id}" 重复 ${count} 次` });
    });

    // 3. 重复势力 ID
    const fIdCount = new Map<string, number>();
    for (const f of data.factions) fIdCount.set(f.id, (fIdCount.get(f.id) ?? 0) + 1);
    fIdCount.forEach((count, id) => {
        if (count > 1) issues.push({ level: 'error', msg: `势力 ID "${id}" 重复 ${count} 次` });
    });

    // 4. 势力缺旗号
    for (const f of data.factions) {
        if (skipFactions.has(f.id)) continue;
        if (!data.flags[f.id]) issues.push({ level: 'warn', msg: `势力 "${f.name}" (${f.id}) 缺旗号`, factionId: f.id });
    }

    // 5. 势力缺 StartingCapitals
    for (const f of data.factions) {
        if (skipFactions.has(f.id)) continue;
        if (!data.capitals[f.id]) issues.push({ level: 'warn', msg: `势力 "${f.name}" (${f.id}) 缺 StartingCapitals`, factionId: f.id });
    }

    // 6. StartingCapitals 引用不存在的据点
    for (const [fId, cId] of Object.entries(data.capitals)) {
        if (!cityById.has(cId)) issues.push({ level: 'error', msg: `StartingCapitals: ${fId} → ${cId} (据点不存在)`, factionId: fId });
    }

    // 7. StartingCapitals 引用不存在的势力
    for (const fId of Object.keys(data.capitals)) {
        if (!factionSet.has(fId)) issues.push({ level: 'error', msg: `StartingCapitals 中势力 "${fId}" 不在 factions.ts`, factionId: fId });
    }

    // 8. 缺武将
    for (const f of data.factions) {
        if (skipFactions.has(f.id)) continue;
        if (!data.generals[f.id]) issues.push({ level: 'info', msg: `势力 "${f.name}" (${f.id}) 无武将`, factionId: f.id });
    }

    // 9. 武将有记录但无有效武将技档案（缺 GENERAL_PROFILES 或缺战术技）
    const malformedSet = new Set(data.malformedProfiles ?? []);
    for (const [fId, g] of Object.entries(data.generals)) {
        if (malformedSet.has(g.generalId)) continue; // 9.1 已报「块内缺战术技」
        if (!data.profiles[g.generalId]) {
            issues.push({
                level: 'error',
                msg: `武将 "${g.generalName}" (${g.generalId}) 无武将技（缺 GENERAL_PROFILES 档案或缺 tacticalSkillId）`,
                factionId: fId,
            });
        }
    }

    // 9.1 GENERAL_PROFILES 块内条目有品阶但无战术技（解析器会跳过，等同无武将技）
    const generalIdToFaction = new Map(
        Object.entries(data.generals).map(([fId, g]) => [g.generalId, fId]),
    );
    for (const gid of data.malformedProfiles ?? []) {
        issues.push({
            level: 'error',
            msg: `武将档案 "${gid}" 在 GENERAL_PROFILES 内缺战术技（条目无效，战斗不触发武将技）`,
            factionId: generalIdToFaction.get(gid),
        });
    }

    // 10. 缺精锐
    for (const f of data.factions) {
        if (skipFactions.has(f.id)) continue;
        if (!data.elites[f.id]) issues.push({ level: 'info', msg: `势力 "${f.name}" (${f.id}) 无精锐番号`, factionId: f.id });
    }

    // 11. 立绘缺失/文件不存在
    //   注意空路径必须单判：path.resolve('public', '') = public 目录本身，existsSync 恒 true 会漏检
    for (const [fId, g] of Object.entries(data.generals)) {
        if (!g.portrait || !g.portrait.trim()) {
            issues.push({ level: 'error', msg: `武将 "${g.generalName}" (${g.generalId}) 立绘路径为空`, factionId: fId });
            continue;
        }
        const absPath = path.resolve(__dirname, 'public', g.portrait.replace(/^\//, ''));
        if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
            issues.push({ level: 'error', msg: `武将 "${g.generalName}" 立绘不存在: ${g.portrait}`, factionId: fId });
        }
        // 立绘路径必须以 .png 结尾
        if (!g.portrait.toLowerCase().endsWith('.png')) {
            issues.push({ level: 'error', msg: `武将 "${g.generalName}" 立绘路径不是 PNG: ${g.portrait}`, factionId: fId });
        }
    }

    // 11.5. 武将品阶与战略技匹配校验
    //   战术技不按品阶限制；名将与普将都按攻防六槽配置。
    //   此处仅额外校验名将必须具有战略技。
    for (const [fId, g] of Object.entries(data.generals)) {
        const prof = data.profiles[g.generalId];
        if (!prof) continue;
        if (!prof.tacticalSkillId?.trim()) {
            issues.push({ level: 'error', msg: `武将 "${g.generalName}"(${g.generalId}) 缺战术技`, factionId: fId });
        }
        if (prof.tier === 'famous' && !prof.strategicSkillId) {
            issues.push({ level: 'error', msg: `名将 "${g.generalName}"(${g.generalId}) 缺战略技（名将应为战略技+战术技）`, factionId: fId });
        }
        if (prof.tier === 'ordinary' && prof.strategicSkillId) {
            issues.push({ level: 'warn', msg: `普将 "${g.generalName}"(${g.generalId}) 不应有战略技（普将仅战术技）`, factionId: fId });
        }
    }

    // 11.55. [NEW 2026-07-08] 武将档案粘贴错对象：条目在 GENERAL_PROFILES 块之外，运行时不生效
    for (const key of data.misplacedProfiles) {
        issues.push({
            level: 'error',
            msg: `武将档案 "${key}" 写在了 GENERAL_PROFILES 之外（疑似粘贴进 TACTICAL_SKILL_CATALOG 等其他对象），运行时不生效，请移入 GENERAL_PROFILES`,
        });
    }

    // 合法战略武将技白名单。str_11 是远征系统默认能力，不占武将战略格；
    // str_02/03/04/08/09 为已退役战斗乘区，不属于可分配战略技。
    const CANONICAL_STRATEGIC_IDS = new Set<string>(REQUIRED_STRATEGIC_SKILL_IDS);

    // 【主人定 2026-07-13】战略技允许跨势佩戴（武将 aptitude ≠ 技三势，符合历史即可），
    //   原「STRATEGIC_APTITUDE 三势对照表 + 跨势 warn」已删，勿再加此类校验。

    // 11.6. [NEW 2026-07-08] 武将技配置深检：全部技能格的悬空引用 + aptitude 缺失
    //   （原「三格类别错配」检查已按主人 2026-07-13 决定删除，见下方注释）
    {
        const tacIdSet = new Set(data.tacticalSkills.map(s => s.id));
        // 战略技合法性统一交规则 11.7 白名单校验，此处只查战术格悬空引用
        for (const [fId, g] of Object.entries(data.generals)) {
            const prof = data.profiles[g.generalId];
            if (!prof) continue;
            // 引用了技能目录中不存在的 ID（会导致战斗时查不到技）
            const refs: Array<[string, string | undefined, Set<string>]> = [
                ['战术技(通用)', prof.tacticalSkillId, tacIdSet],
                ['优势格', prof.advantageSkillId, tacIdSet],
                ['均势格', prof.balanceSkillId, tacIdSet],
                ['劣势格', prof.disadvantageSkillId, tacIdSet],
                ['攻·优势格', prof.atkAdvantageSkillId, tacIdSet],
                ['攻·均势格', prof.atkBalanceSkillId, tacIdSet],
                ['攻·劣势格', prof.atkDisadvantageSkillId, tacIdSet],
                ['守·优势格', prof.defAdvantageSkillId, tacIdSet],
                ['守·均势格', prof.defBalanceSkillId, tacIdSet],
                ['守·劣势格', prof.defDisadvantageSkillId, tacIdSet],
            ];
            for (const [label, id, set] of refs) {
                if (id && !set.has(id)) {
                    issues.push({ level: 'error', msg: `武将 "${g.generalName}"(${g.generalId}) ${label} ${id} 在技能目录中不存在`, factionId: fId });
                }
            }
            // 三势天赋缺失（技能格缺失已由规则 11.9 六技配齐统一报 error，此处不重复）
            if (!prof.aptitude) {
                issues.push({ level: 'warn', msg: `武将 "${g.generalName}"(${g.generalId}) 缺 aptitude三势`, factionId: fId });
            }
            // 【主人定 2026-07-13】格位与技能三类（优/均/劣）不要求匹配，符合历史即可：
            //   格位只决定"何时放"（攻守×兵力局），技能类别只是播报分类。实测六格约 40% 跨类，
            //   属正常配置。原「类别不符」warn 已删，勿再加格位×技类的匹配校验。
        }
    }

    // 11.7. 战略技白名单校验：名将佩戴的战略技必须在白名单内。
    // 技能是否至少有人使用统一交给规则 11.8，避免重复报错。
    {
        const strNameById = new Map(data.strategicSkills.map(s => [s.id, s.displayName]));
        const nameOf = (id: string) => strNameById.get(id) ?? id;

        // str_11 长驱深入（远征技）主人定：佩戴放行、不报错，也不参与覆盖检查。
        //   【主人定 2026-07-13】战略技允许跨势佩戴（武将 aptitude ≠ 技三势，只要符合历史即可）：
        //   不校验、不报 warn。勿再加"三势不符/跨势"类检查。
        const WEAR_EXEMPT_IDS = new Set(['str_11']);
        for (const [fId, g] of Object.entries(data.generals)) {
            const prof = data.profiles[g.generalId];
            if (!prof || prof.tier !== 'famous') continue;
            const sid = prof.strategicSkillId;
            if (!sid) continue; // 「名将缺战略技」已由规则 11.5 报，不重复
            if (WEAR_EXEMPT_IDS.has(sid)) continue; // 长驱深入除外：不报非法
            if (!CANONICAL_STRATEGIC_IDS.has(sid)) {
                issues.push({ level: 'error', msg: `名将 "${g.generalName}"(${g.generalId}) 佩戴的 ${sid}（${nameOf(sid)}）不是合法战略技，请改配白名单内的战略技`, factionId: fId });
            }
        }
    }

    // 11.8. 技能覆盖：当前攻防六槽中的每个 ts_*，以及 20 个可分配战略技，都必须有人佩戴。
    // 排除：长驱深入（远征）、据险而守（关隘）、守土继绝（文化中心）。
    // tacticalSkillId 与旧三槽只是兼容回退，不计作“有人使用”，避免废弃字段造成假通过。
    {
        const coverage = serverCheckGeneralSkillCoverage(data);
        for (const s of coverage.unusedTactical) {
            issues.push({ level: 'error', msg: `战术技 "${s.displayName}"(${s.id}) 未出现在任何武将的攻防六槽（所有战术技都必须有人使用）` });
        }
        for (const s of coverage.unusedStrategic) {
            issues.push({ level: 'error', msg: `战略技 "${s.displayName}"(${s.id}) 无任何武将佩戴（所有可分配战略技都必须有人使用）` });
        }
    }

    // 11.9. [NEW] 六技配齐：一人六个武将技 = 攻击(攻三格)/通用/防御(守三格)/优势/均势/劣势
    //   普将 = 六技全配；名将 = 六技 + 1 战略技（战略技缺失已由规则 11.5 报，此处只查战术六技）。
    {
        for (const [fId, g] of Object.entries(data.generals)) {
            const prof = data.profiles[g.generalId];
            if (!prof) continue;
            const missing: string[] = [];
            if (!prof.tacticalSkillId) missing.push('通用');
            if (!prof.advantageSkillId) missing.push('优势');
            if (!prof.balanceSkillId) missing.push('均势');
            if (!prof.disadvantageSkillId) missing.push('劣势');
            if (!prof.atkAdvantageSkillId || !prof.atkBalanceSkillId || !prof.atkDisadvantageSkillId) missing.push('攻击');
            if (!prof.defAdvantageSkillId || !prof.defBalanceSkillId || !prof.defDisadvantageSkillId) missing.push('防御');
            if (missing.length > 0) {
                issues.push({ level: 'error', msg: `武将 "${g.generalName}"(${g.generalId}) 六技不全，缺：${missing.join('/')}（${prof.tier === 'famous' ? '名将=六技+1战略技' : '普将=六技'}）`, factionId: fId });
            }
        }
    }

    // 11.10. [NEW 2026-07-13] 档案键 ≠ generalId 字段（批量修复脚本截断事故的检出）
    //   GENERAL_PROFILES 的键与条目内 generalId 必须一致；不一致时读 profile.generalId 的逻辑全部错乱。
    for (const [key, gid] of Object.entries(data.profileIdMismatches ?? {})) {
        issues.push({ level: 'error', msg: `武将档案 "${key}" 的 generalId 字段是 '${gid}'，与键不一致（疑似批量脚本截断），请改回 '${key}'` });
    }

    // 11.11. [NEW 2026-07-14] sourceQuote 【武将名】标注 vs 六槽归属：技能目录里注明了典故主角，
    //   该武将的攻防六槽必须包含此技（防批量脚本覆盖后典故技丢失）。
    {
        // 建 武将名 → generalId 映射
        const nameToGid = new Map<string, string>();
        for (const [, g] of Object.entries(data.generals)) {
            nameToGid.set(g.generalName, g.generalId);
        }
        // 扫描 TacticalSkillCatalog 中 sourceQuote 含【武将名】的技能
        const tscText = fs.readFileSync(
            path.resolve(__dirname, 'src/data/TacticalSkillCatalog.ts'), 'utf-8',
        );
        for (const m of tscText.matchAll(/id:\s*'(ts_\d+)'[^}]*sourceQuote:\s*'【([^】]+)】/g)) {
            const skillId = m[1];
            const namesStr = m[2]; // 可能是 "谢玄" 或 "苻坚/谢玄"
            const names = namesStr.split('/').map(n => n.trim());
            const nameMatch = names.find(n => nameToGid.has(n));
            if (!nameMatch) continue;
            const gid = nameToGid.get(nameMatch)!;
            const prof = data.profiles[gid];
            if (!prof) continue;
            const six = [
                prof.atkAdvantageSkillId, prof.atkBalanceSkillId, prof.atkDisadvantageSkillId,
                prof.defAdvantageSkillId, prof.defBalanceSkillId, prof.defDisadvantageSkillId,
            ];
            if (!six.includes(skillId)) {
                const dispMatch = tscText.slice(m.index, m.index + 300).match(/displayName:\s*'([^']+)'/);
                const dispName = dispMatch?.[1] ?? skillId;
                const genEntry = Object.entries(data.generals).find(([, g]) => g.generalId === gid);
                issues.push({
                    level: 'error',
                    msg: `技能 "${dispName}"(${skillId}) 典故主角【${nameMatch}】(${gid})，但该武将攻防六槽中无此技（疑似批量脚本覆盖丢失）`,
                    factionId: genEntry?.[0],
                });
            }
        }
    }

    // 12. 据点名重复（完全同名 或 一方完整包含另一方）
    for (let i = 0; i < data.cities.length; i++) {
        for (let j = i + 1; j < data.cities.length; j++) {
            const ci = data.cities[i], cj = data.cities[j];
            if (ci.name.length < 2 || cj.name.length < 2) continue;
            if (ci.name === cj.name) {
                issues.push({ level: 'error', msg: `据点 "${ci.name}"(${ci.id}) 与 "${cj.name}"(${cj.id}) 完全同名`, factionId: ci.factionId });
            } else if (ci.name.includes(cj.name) || cj.name.includes(ci.name)) {
                issues.push({ level: 'warn', msg: `据点 "${ci.name}"(${ci.factionId}) 与 "${cj.name}"(${cj.factionId}) 名字包含关系`, factionId: ci.factionId });
            }
        }
    }

    // 13. 精锐名重复（完全同名 或 一方完整包含另一方）
    const eliteEntries = Object.entries(data.elites) as [string, { name: string }][];
    for (let i = 0; i < eliteEntries.length; i++) {
        for (let j = i + 1; j < eliteEntries.length; j++) {
            const [idA, eA] = eliteEntries[i], [idB, eB] = eliteEntries[j];
            if (eA.name.length < 2 || eB.name.length < 2) continue;
            if (eA.name === eB.name) {
                issues.push({ level: 'error', msg: `精锐 "${eA.name}"(${idA}) 与 "${eB.name}"(${idB}) 完全同名` });
            } else if (eA.name.includes(eB.name) || eB.name.includes(eA.name)) {
                issues.push({ level: 'warn', msg: `精锐 "${eA.name}"(${idA}) 与 "${eB.name}"(${idB}) 名字包含关系` });
            }
        }
    }

    // 14. 势力名重复（势力名之间互相比较）
    for (let i = 0; i < data.factions.length; i++) {
        for (let j = i + 1; j < data.factions.length; j++) {
            const fi = data.factions[i], fj = data.factions[j];
            if (fi.name.length < 2 || fj.name.length < 2) continue;
            if (fi.name === fj.name) {
                issues.push({ level: 'error', msg: `势力 "${fi.name}"(${fi.id}) 与 "${fj.name}"(${fj.id}) 势力名完全相同`, factionId: fi.id });
            } else if (fi.name.includes(fj.name) || fj.name.includes(fi.name)) {
                issues.push({ level: 'warn', msg: `势力 "${fi.name}"(${fi.id}) 与 "${fj.name}"(${fj.id}) 势力名包含关系`, factionId: fi.id });
            }
        }
    }

    // 15. 势力名 vs 据点名（跨类型撞名）
    const cityNameMap = new Map(data.cities.map(c => [c.name, c]));
    for (const f of data.factions) {
        if (f.name.length < 2) continue;
        const clash = cityNameMap.get(f.name);
        if (clash && clash.factionId !== f.id) {
            issues.push({ level: 'warn', msg: `势力 "${f.name}"(${f.id}) 与据点 "${clash.name}"(${clash.id}/${clash.factionId}) 同名`, factionId: f.id });
        }
    }

    // 16. 武将名重复（仅完全同名；子串包含如「帖木儿」⊂「扩廓帖木儿」不算重复）
    const generalEntries = Object.entries(data.generals) as [string, { generalId: string; generalName: string }][];
    for (let i = 0; i < generalEntries.length; i++) {
        for (let j = i + 1; j < generalEntries.length; j++) {
            const [idA, gA] = generalEntries[i], [idB, gB] = generalEntries[j];
            if (skipFactions.has(idA) || skipFactions.has(idB)) continue;
            if (gA.generalName.length < 2 || gB.generalName.length < 2) continue;
            if (gA.generalName === gB.generalName) {
                issues.push({
                    level: 'error',
                    msg: `武将 "${gA.generalName}" 重复: 势力 ${idA}(${gA.generalId}) 与 ${idB}(${gB.generalId})`,
                    factionId: idA,
                });
            }
        }
    }

    // 17. 武将 generalId 被多势力共用
    const generalIdOwners = new Map<string, string[]>();
    for (const [fId, g] of Object.entries(data.generals)) {
        if (skipFactions.has(fId)) continue;
        if (!generalIdOwners.has(g.generalId)) generalIdOwners.set(g.generalId, []);
        generalIdOwners.get(g.generalId)!.push(fId);
    }
    generalIdOwners.forEach((fIds, genId) => {
        if (fIds.length > 1) {
            issues.push({ level: 'error', msg: `武将 ID "${genId}" 被多势力共用: ${fIds.join(', ')}`, factionId: fIds[0] });
        }
    });

    // 18. [NEW 2026-07-13] 精锐 tier vs 武将品阶 匹配审计
    //    T0/T1 精锐 → 必须是名将；名将 → 精锐不能是 T4
    for (const [fId, elite] of Object.entries(data.elites)) {
        const gen = data.generals[fId];
        if (!gen) continue;
        const prof = data.profiles[gen.generalId];
        if (!prof) continue;

        const eliteTier = elite.tier;
        const isFamous = prof.tier === 'famous';

        // T0/T1 精锐 + 普将 = 报错
        if ((eliteTier === 0 || eliteTier === 1) && !isFamous) {
            issues.push({
                level: 'error',
                msg: `精锐 "${elite.name}" 为 T${eliteTier}，但武将 "${gen.generalName}"(${gen.generalId}) 是普将（T0/T1 精锐必须配名将）`,
                factionId: fId,
            });
        }

        // 名将 + T4 精锐 = 报错
        if (isFamous && eliteTier === 4) {
            issues.push({
                level: 'error',
                msg: `武将 "${gen.generalName}"(${gen.generalId}) 是名将，但精锐 "${elite.name}" 仅为 T4（名将至少配 T3 以上精锐）`,
                factionId: fId,
            });
        }
    }

    return {
        issues,
        stats: {
            attackStyle: {
                registered: { covered: attackStyleCovered, total: Object.keys(data.generals).length },
                famous: { covered: famousAttackStyleCovered, total: famousTotal },
            },
        },
    };
}
