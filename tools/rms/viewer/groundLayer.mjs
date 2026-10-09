/**
 * 地面层（WebGL）—— 第三步的独立模块（**只有地面层是 WebGL**，士兵/特效/界面继续 Canvas 2D）。
 *
 * ⚠️ **CC 第 57 轮代修的两处，不许改回**：
 *   · `uCam = +cam.x/zoom`（不是 `-`）；
 *   · 视野剔除 / 物件剔除的右·下界 = `(w - cam.x)/zoom`（不是 `w/zoom - cam.x`）。
 *
 * ── 贴图与遮罩的 UV（CC 第 58 轮）──
 *   格 (x,y) 在地面覆盖 **[x−0.5, x+0.5]²**；菱形四角 上/右/下/左 = 地面
 *   (x−.5,y−.5)/(x+.5,y−.5)/(x+.5,y+.5)/(x−.5,y+.5)。
 *   贴图坐标 = `fract(地面坐标 / dim)`，**片元里** fract 后映射到图集子块 ⇒ 相邻格接得上、同地形连成片。
 *   遮罩用**同一套地面坐标**（真正连续平铺，不再每格整张 + 镜像）。
 *   **空遮罩兜底**：dat 里 `overlay_mask_name` 为空的地形（森林 88 / 松林 19 / 萨凡纳 41 / 棕榈沙漠 13…）
 *   改用一个兜底遮罩（默认 `default_weak`，**推断**）。
 *
 * ── 格子像素 / 精灵比例（权威）──
 *   DE 一格 = 96×48 px（dat `terrain_block.tile_width/tile_height`，`tile_sizes` 全是 (96,48)），高度步长 24；
 *   精灵是 x1（`aoe2de_nature_extract.py:38` 取 `{prefix}_x1.sld`）；地形贴图来自 `terrain/textures/2x`
 *   （DE 只有 2x）⇒ 页面加载时缩半统一 x1 ⇒ **精灵缩放 2/3**。
 *
 * ── 过渡（CC 第 56 轮定稿）──
 *   `d` = 到共享边/角的距离（格）；`s = clamp(1 − d/0.367, 0, 1)`（0.367 = 47/128，实测，推断）；
 *   `alpha = smoothstep(mask − 0.15, mask + 0.15, s)`；多层按优先级从低到高逐层叠；角邻居只在两条相邻边
 *   都不是该地形时才算。调试：`?debug=shape|mask|dir`。
 */
export const GROUND_VERSION = 'step3-item2-r3';

export const DE_TILE_W = 96, DE_TILE_H = 48, DE_ELEV_H = 24;
const TW = 64, TH = 32;
const dx = TW / 2, dy = TH / 2;
const SPRITE_SCALE_DEFAULT = TW / DE_TILE_W;      // 2/3
const isoX = (x, y, offX) => (x - y) * dx + offX;
const isoY = (x, y) => (x + y) * dy;
const SHAPE_W = 0.367;                            // 到共享边的渐变带宽（格）——实测 landland 外框 47/128
const MASK_W = 0.15;                              // smoothstep 的 w（CC 指定）

const VS = `attribute vec2 aPos; attribute vec4 aSub; attribute vec2 aGUV; attribute vec2 aLocal;
attribute vec4 aMaskRect; attribute vec2 aDir; attribute float aUse;
uniform vec2 uRes; uniform vec2 uCam; uniform float uZoom;
varying vec4 vSub; varying vec2 vGUV; varying vec2 vLocal; varying vec4 vMaskRect; varying vec2 vDir; varying float vUse;
void main(){ vSub=aSub; vGUV=aGUV; vLocal=aLocal; vMaskRect=aMaskRect; vDir=aDir; vUse=aUse;
  vec2 p=(aPos+uCam)*uZoom; vec2 c=vec2(uRes.x*0.5,uRes.y*0.5);
  gl_Position=vec4((p.x-c.x)/c.x, -(p.y-c.y)/c.y, 0.0, 1.0); }`;

const FS = `precision mediump float;
varying vec4 vSub; varying vec2 vGUV; varying vec2 vLocal; varying vec4 vMaskRect; varying vec2 vDir; varying float vUse;
uniform sampler2D uTex; uniform float uDebug;
vec2 subUV(vec4 r, vec2 g){ return r.xy + g * (r.zw - r.xy); }
void main(){
  vec2 g = clamp(fract(vGUV), 0.5 / 256.0, 1.0 - 0.5 / 256.0);   // 钳制，避免采到图集邻块
  if (vUse > 1.5) {                                   // 2 = 精灵：UV 直接用
    vec4 c = texture2D(uTex, subUV(vSub, vGUV));
    if (c.a < 0.02) discard; gl_FragColor = c; return;
  }
  if (vUse < 0.5) {                                   // 0 = 基础地形：连续平铺
    vec4 c = texture2D(uTex, subUV(vSub, g));
    if (c.a < 0.02) discard; gl_FragColor = c; return;
  }
  // 1 = 过渡层
  float ex = vDir.x > 0.0 ? (0.5 - vLocal.x) : (vLocal.x + 0.5);
  float ey = vDir.y > 0.0 ? (0.5 - vLocal.y) : (vLocal.y + 0.5);
  float d;
  if (vDir.x != 0.0 && vDir.y != 0.0) d = length(vec2(ex, ey));   // 角：四分之一圆
  else if (vDir.x != 0.0) d = ex;
  else d = ey;
  float s = clamp(1.0 - d / ${SHAPE_W.toFixed(3)}, 0.0, 1.0);
  if (uDebug > 2.5) {                                              // ?debug=dir
    vec3 col = vec3(0.5);
    if (vDir.x > 0.0 && vDir.y == 0.0) col = vec3(1.0, 0.2, 0.2);
    else if (vDir.x < 0.0 && vDir.y == 0.0) col = vec3(0.2, 1.0, 0.2);
    else if (vDir.y > 0.0 && vDir.x == 0.0) col = vec3(0.2, 0.4, 1.0);
    else if (vDir.y < 0.0 && vDir.x == 0.0) col = vec3(1.0, 1.0, 0.2);
    else if (vDir.x > 0.0 && vDir.y > 0.0) col = vec3(1.0, 0.5, 0.0);
    else if (vDir.x < 0.0 && vDir.y > 0.0) col = vec3(0.6, 0.2, 1.0);
    else if (vDir.x > 0.0 && vDir.y < 0.0) col = vec3(0.2, 1.0, 1.0);
    else col = vec3(1.0, 0.2, 1.0);
    gl_FragColor = vec4(col, 1.0); return;
  }
  if (uDebug > 1.5) { float m0 = texture2D(uTex, subUV(vMaskRect, g)).r; gl_FragColor = vec4(m0, m0, m0, 1.0); return; }
  if (uDebug > 0.5) { gl_FragColor = vec4(s, s, s, 1.0); return; }
  if (s <= 0.0) discard;
  float m = texture2D(uTex, subUV(vMaskRect, g)).r;
  float a = smoothstep(m - ${MASK_W.toFixed(2)}, m + ${MASK_W.toFixed(2)}, s);
  if (a < 0.02) discard;
  vec4 c = texture2D(uTex, subUV(vSub, g));
  gl_FragColor = vec4(c.rgb, c.a * a);
}`;

function mkProgram(gl) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
}

/** 把所有要用的贴图/精灵/遮罩打进一张图集 */
export function buildAtlas(gl, entries) {
    const maxSide = entries.reduce((m, e) => Math.max(m, e.img.width, e.img.height), 128);
    const glMax = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, 2048);
    const n = Math.max(1, entries.length);
    let CELL = Math.max(64, 1 << Math.ceil(Math.log2(maxSide)));
    const colsOf = () => Math.max(1, Math.ceil(Math.sqrt(n)));
    while (CELL > 32 && colsOf() * CELL > glMax) CELL >>= 1;
    const COLS = colsOf(), ROWS = Math.max(1, Math.ceil(entries.length / COLS));
    const cv = document.createElement('canvas'); cv.width = COLS * CELL; cv.height = ROWS * CELL;
    const c = cv.getContext('2d');
    const uv = new Map();
    entries.forEach((e, i) => {
        const cx = (i % COLS) * CELL, cy = Math.floor(i / COLS) * CELL;
        const P = 2;                                   // 四周留 2 像素边（修"每 10 格一条细黑线"）
        const inner = CELL - 2 * P;
        const r = Math.min(inner / e.img.width, inner / e.img.height);
        const w = e.img.width * r, h = e.img.height * r;
        const ix = cx + P + (inner - w) / 2, iy = cy + P + (inner - h) / 2;
        c.drawImage(e.img, ix, iy, w, h);
        // 边里填**对边**的像素（让这一块能无缝重复；线性取色就不会采到隔壁块）
        c.drawImage(cv, ix + w - P, iy, P, h, ix - P, iy, P, h);                    // 左边 ← 右
        c.drawImage(cv, ix, iy + h - P, w, P, ix, iy - P, w, P);                    // 上边 ← 下
        c.drawImage(cv, ix, iy, w, P, ix, iy + h, w, P);                            // 下边 ← 上
        c.drawImage(cv, ix + w - P, iy, P, P, ix - P, iy + h, P, P);                // 左下角
        c.drawImage(cv, ix, iy + h - P, P, P, ix + w, iy + h - P, P, P);            // 右下角
        // 该块在图集里的**内容矩形**（不含留边）
        uv.set(e.key, [ix / cv.width, iy / cv.height, (ix + w) / cv.width, (iy + h) / cv.height]);
        uv.set(e.key + '#pad', P / CELL);
    });
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex, uv, cell: CELL, size: { w: cv.width, h: cv.height } };
}

const FLOATS = 17;                                 // pos2 sub4 guv2 local2 maskRect4 dir2 use1
const STRIDE = FLOATS * 4;

export function createGroundLayer(canvas, o) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL 不可用');
    const prog = mkProgram(gl); gl.useProgram(prog);
    const A = (n) => gl.getAttribLocation(prog, n), U = (n) => gl.getUniformLocation(prog, n);
    const loc = { aPos: A('aPos'), aSub: A('aSub'), aGUV: A('aGUV'), aLocal: A('aLocal'), aMaskRect: A('aMaskRect'), aDir: A('aDir'), aUse: A('aUse'),
        uRes: U('uRes'), uCam: U('uCam'), uZoom: U('uZoom'), uTex: U('uTex'), uDebug: U('uDebug') };
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const data = o.data, N = data.width;
    const SPRITE_SCALE = o.spriteScale ?? SPRITE_SCALE_DEFAULT;
    let texMode = o.texMode ?? 'world';
    let debug = o.debug ?? 0;
    let cull = true, blendOn = o.blendEnabled !== false;
    const MASK_FALLBACK = o.maskFallback ?? 'default_weak';
    const blendOf = (id) => o.blend?.[id] ?? o.blend?.[String(id)] ?? null;
    const dimOf = (id) => { const d = blendOf(id)?.dim; return d && d[0] > 0 ? d : null; };
    const prioOf = (id) => blendOf(id)?.prio ?? 0;
    const maskOf = (id) => { const m = blendOf(id)?.mask; return m ? String(m).replace(/\.png$/i, '') : MASK_FALLBACK; };
    const offX = (N - 1) * dx;
    const texCode = (id) => { const m = o.manifest[id]; return m?.name_2 ? String(m.name_2).replace(/^g_/, '') : null; };

    const entries = [];
    const terKey = new Map();
    for (const id of new Set([...data.terrain, ...data.layer.filter((v) => v >= 0)])) { const c = texCode(id); const im = c && o.textures.get(c); if (im) { terKey.set(id, 'T' + id); entries.push({ key: 'T' + id, img: im }); } }
    for (const ob of data.objects) { const sp = o.sprites.get(ob.name); const k = 'S' + ob.name; if (sp && !entries.some((e) => e.key === k)) entries.push({ key: k, img: sp.img }); }
    const maskKey = new Map();
    for (const id of new Set([...data.terrain, ...data.layer.filter((v) => v >= 0)])) {
        const mn = maskOf(id); if (!mn || maskKey.has(mn)) continue;
        const im = o.masks?.get(mn); if (!im) continue;
        maskKey.set(mn, 'M' + mn); entries.push({ key: 'M' + mn, img: im });
    }
    const atlas = buildAtlas(gl, entries);
    const uvOfTer = (id) => atlas.uv.get(terKey.get(id));
    const uvOfMask = (id) => { const mn = maskOf(id); return mn ? atlas.uv.get(maskKey.get(mn)) : null; };

    const objs = data.objects.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
    let cam = { x: 0, y: 0, zoom: 1 };
    let last = { tiles: 0, objs: 0, cpuMs: 0 };
    let builtKey = null, cnt = [0, 0, 0], bufs = [null, null, null];
    const keyOf = (w, h) => `${cam.x}|${cam.y}|${cam.zoom}|${w}|${h}|${cull}|${blendOn}|${texMode}|${debug}`;

    const PTS = [[0, -TH / 2], [TW / 2, 0], [0, TH / 2], [-TW / 2, 0]];
    const TRI = [0, 1, 2, 0, 2, 3];
    /** 菱形四角 [上,右,下,左] 的**格内偏移**（格 (x,y) 覆盖 [x−.5,x+.5]²） */
    const LOCAL = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

    const push = (arr, cx, cy, sub, guv, maskRect, dir, use) => {
        for (const t of TRI) {
            arr.push(cx + PTS[t][0], cy + PTS[t][1],
                sub[0], sub[1], sub[2], sub[3],
                guv[t][0], guv[t][1],
                LOCAL[t][0], LOCAL[t][1],
                maskRect[0], maskRect[1], maskRect[2], maskRect[3],
                dir[0], dir[1], use);
        }
    };
    /** 某一格的贴图地面 UV（未 fract）：`地面坐标 / dim`；无 dim 时用格内 0~1（每格一整张） */
    const guvOf = (x, y) => {
        const dim = dimOf(terrAt(x, y));
        return LOCAL.map(([lx, ly]) => dim ? [(x + lx) / dim[0], (y + ly) / dim[1]] : [lx + 0.5, ly + 0.5]);
    };
    const terrAt = (x, y) => { const i = y * N + x; return data.layer[i] >= 0 ? data.layer[i] : data.terrain[i]; };

    function visibleRange(w, h) {
        if (!cull) return { x0: 0, x1: N - 1, y0: 0, y1: N - 1 };
        // ⚠️ CC 第 57 轮代修：右/下界是 (w - cam.x)/zoom，不是 w/zoom - cam.x
        const wx0 = -cam.x / cam.zoom - TW, wx1 = (w - cam.x) / cam.zoom + TW;
        const wy0 = -cam.y / cam.zoom - TH, wy1 = (h - cam.y) / cam.zoom + TH;
        const inv = (wx, wy) => { const a = (wx - offX) / dx, b = wy / dy; return [(a + b) / 2, (b - a) / 2]; };
        const cs = [inv(wx0, wy0), inv(wx1, wy0), inv(wx0, wy1), inv(wx1, wy1)];
        const gx = cs.map((c) => c[0]), gy = cs.map((c) => c[1]);
        return {
            x0: Math.max(0, Math.floor(Math.min(...gx)) - 1), x1: Math.min(N - 1, Math.ceil(Math.max(...gx)) + 1),
            y0: Math.max(0, Math.floor(Math.min(...gy)) - 1), y1: Math.min(N - 1, Math.ceil(Math.max(...gy)) + 1),
        };
    }

    function render() {
        const t0 = performance.now();
        const w = canvas.width, h = canvas.height;
        gl.viewport(0, 0, w, h);
        gl.clearColor(0.05, 0.05, 0.05, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(prog);
        gl.uniform2f(loc.uRes, w, h);
        gl.uniform2f(loc.uCam, cam.x / cam.zoom, cam.y / cam.zoom);   // ⚠️ CC 代修：正号，不许改回
        gl.uniform1f(loc.uZoom, cam.zoom);
        gl.uniform1f(loc.uDebug, debug);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas.tex); gl.uniform1i(loc.uTex, 0);
        for (const n of ['aPos', 'aSub', 'aGUV', 'aLocal', 'aMaskRect', 'aDir', 'aUse']) gl.enableVertexAttribArray(loc[n]);

        const key = keyOf(w, h);
        if (key !== builtKey) {
            const r = visibleRange(w, h);
            const tv = [], bv = [], ov = [];
            let candSeen = 0;
            for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
                const id = terrAt(x, y);
                const cx = isoX(x, y, offX), cy = isoY(x, y);
                const sub = uvOfTer(id) ?? [0, 0, 1, 1];
                push(tv, cx, cy, sub, guvOf(x, y), [0, 0, 0, 0], [0, 0], 0);
                if (!blendOn) continue;
                const mine = prioOf(id);
                const cand = [];
                for (const [dxi, dyi] of NB8) {
                    const nx = x + dxi, ny = y + dyi;
                    if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
                    const nid = terrAt(nx, ny);
                    if (nid === id) continue;
                    if (prioOf(nid) <= mine) continue;
                    if (!uvOfTer(nid) || !uvOfMask(nid)) continue;
                    if (dxi !== 0 && dyi !== 0 && (terrAt(x + dxi, y) === nid || terrAt(x, y + dyi) === nid)) continue;
                    cand.push({ nid, p: prioOf(nid), dxi, dyi });
                }
                cand.sort((a, b) => a.p - b.p);
                candSeen += cand.length;
                const g = guvOf(x, y);
                for (const cb of cand) {
                    push(bv, cx, cy, uvOfTer(cb.nid), g, uvOfMask(cb.nid), [cb.dxi, cb.dyi], 1);
                }
            }
            const wx0 = -cam.x / cam.zoom - 128, wx1 = (w - cam.x) / cam.zoom + 128;
            const wy0 = -cam.y / cam.zoom - 256, wy1 = (h - cam.y) / cam.zoom + 256;
            let nObj = 0;
            for (const ob of objs) {
                const px = isoX(ob.x, ob.y, offX), py = isoY(ob.x, ob.y);
                if (px < wx0 || px > wx1 || py < wy0 || py > wy1) continue;
                const sp = o.sprites.get(ob.name);
                const sub = atlas.uv.get('S' + ob.name) ?? [0, 0, 0, 0];
                let ww = 40, hh = 40, ax = 20, ay = 40;
                if (sp) { ww = sp.img.width * SPRITE_SCALE; hh = sp.img.height * SPRITE_SCALE; ax = sp.ax * SPRITE_SCALE; ay = sp.ay * SPRITE_SCALE; }
                const x0 = px - ax, y0 = py - ay + TH / 2;
                const pts = [[x0, y0], [x0 + ww, y0], [x0 + ww, y0 + hh], [x0, y0 + hh]];
                const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
                for (const t of TRI) {
                    ov.push(pts[t][0], pts[t][1], sub[0], sub[1], sub[2], sub[3], uvs[t][0], uvs[t][1], 0, 0, 0, 0, 0, 0, 0, 0, 2);
                }
                nObj++;
            }
            const mkb = (arr) => { const f = new Float32Array(arr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, f, gl.DYNAMIC_DRAW); return [b, f.length / FLOATS]; };
            for (const b of bufs) if (b) gl.deleteBuffer(b);
            [bufs[0], cnt[0]] = mkb(tv); [bufs[1], cnt[1]] = mkb(bv); [bufs[2], cnt[2]] = mkb(ov);
            builtKey = key;
            last = { ...last, tiles: (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1), objs: nObj, blends: cnt[1] / 6, candSeen, rebuilt: true };
        } else last = { ...last, rebuilt: false };

        const draw = (b, n) => {
            if (!b || !n) return;
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, STRIDE, 0);
            gl.vertexAttribPointer(loc.aSub, 4, gl.FLOAT, false, STRIDE, 8);
            gl.vertexAttribPointer(loc.aGUV, 2, gl.FLOAT, false, STRIDE, 24);
            gl.vertexAttribPointer(loc.aLocal, 2, gl.FLOAT, false, STRIDE, 32);
            gl.vertexAttribPointer(loc.aMaskRect, 4, gl.FLOAT, false, STRIDE, 40);
            gl.vertexAttribPointer(loc.aDir, 2, gl.FLOAT, false, STRIDE, 56);
            gl.vertexAttribPointer(loc.aUse, 1, gl.FLOAT, false, STRIDE, 64);
            gl.drawArrays(gl.TRIANGLES, 0, n);
        };
        if (debug > 0) draw(bufs[1], cnt[1]);
        else { draw(bufs[0], cnt[0]); draw(bufs[1], cnt[1]); draw(bufs[2], cnt[2]); }
        last = { ...last, cpuMs: performance.now() - t0 };
        return last.cpuMs;
    }

    return {
        render,
        setCamera(c) { cam = { ...cam, ...c }; },
        setCull(v) { cull = !!v; },
        setBlend(v) { blendOn = !!v; builtKey = null; },
        setTexMode(m) { texMode = m; builtKey = null; },
        setDebug(d) { debug = d | 0; builtKey = null; },
        resize(w, h) { canvas.width = w; canvas.height = h; },
        stats() { return { ...last, atlas: entries.length, masks: maskKey.size, maskNames: [...maskKey.keys()], totalTiles: N * N, totalObjs: objs.length, atlasSize: atlas.size }; },
        gl,
    };
}
