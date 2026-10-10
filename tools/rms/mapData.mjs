/**
 * 格子数据模型（任务书第二步）：把引擎生成结果转成「每格数据 + 物件清单」。
 *
 * 字段（**待 CC 确认后再定稿**）：
 *   size        边长（默认 120，按任务书）
 *   terrain[]   逻辑地形 id（引擎的 terrain：物件/森林/通行看它）
 *   layer[]     视觉图层 id（terrain_mask 的图层，-1 = 无）
 *   elev[]      高度
 *   passable[]  能否通行（1/0）—— 默认「除悬崖外全部可通行」；`passableAll: true` ⇒ 全 1（见下）
 *   speed[]     速度系数 ×100 的整数（100 / 50 / 60 / 30），避免浮点误差
 *   objects[]   物件清单（**只含白名单内的自然物件**），每个带 dat 的占地尺寸与覆盖格
 *
 * 通行与速度：
 *   · 默认（`passableAll: false`）：悬崖物件占据的格子 → 不可通行（CC 第 47 轮）
 *   · **新战术模式陆战口径（`passableAll: true`）**：🔴 主人 2026-10-11 令
 *     「新战术模式，先只设计陆战，**不要设计无法通行的任何区域**，包括水，树林，建筑，都是可以通行的。」
 *     ⇒ 水、树林、建筑、悬崖一律可通行，`passable` 全 1（只有地图边界外不可走）
 *   · 速度系数两口径相同：森林 0.5 ｜ 浅滩/沼泽 0.6 ｜ 深水 0.3 ｜ 其余 1.0（设计值，待主人实看后调）
 *   · 丘陵可走；上下坡是否减速 —— **未证实**，先按 1.0
 *
 * 占地（CC：从 dat 读，不要估）：`scratch/de_unit_size.json` 的 `clearance_size` (x, y)，单位＝格。
 *   覆盖格 = 中心落在「以物件坐标为中心、边长 clearance 的方形」内的格子；clearance 为 0（如草）时该集合为空，
 *   另有 `cell` 字段给出物件所在的那一格，便于定位。
 */
import fs from 'node:fs';
import { loadUnitClassTable, isNaturalObject } from './naturalObjects.mjs';

/** dat 占地表（clearance_size 等）。缺表则报错，不静默退回估算。 */
export function loadUnitSizeTable(file = 'scratch/de_unit_size.json') {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))).map(([k, v]) => [Number(k), v]));
}

/** (class,type) → 物件种类名（与审阅单 §20.2 的白名单同一套分类） */
export const KIND_OF = {
    '15/10': '树/灌木', '14/10': '地面装饰', '7/10': '浆果丛', '8/10': '石矿', '32/10': '金矿',
    '48/10': '矿', '34/10': '悬崖', '9/70': '猎物', '10/70': '猛兽', '58/70': '家畜',
    '65/70': '狐狸', '11/70': '鸟', '5/30': '鱼', '33/30': '岸边鱼', '63/30': '鲸', '63/10': '牡蛎',
};

/** 速度系数（×100）：森林 50 ｜ 浅滩·沼泽 60 ｜ 深水 30 ｜ 其余 100 */
export function speedOf(terrainId, tInfo, forestTerrains) {
    const t = tInfo?.get(terrainId);
    if (!t) return 100;
    const n = String(t.name ?? '');
    if (t.blend_type === 3) return /shallow|azure|green|brown|yellow shallow|weeds|old/i.test(n) ? 60 : 30;
    if (/swamp|marsh|bog|quagmire|shallows|mud/i.test(n)) return 60;
    if (forestTerrains?.has(terrainId)) return 50;
    return 100;
}

/**
 * 生成格子数据模型。
 * @param {object} eng     MapEngine 跑完的结果
 * @param {object} opt     { passableAll, size, source, tInfo, classTable, sizeTable, keepObject }
 *                         passableAll = true ⇒ 陆战口径（水/树林/建筑/悬崖一律可通行，passable 全 1）
 */
export function buildMapData(eng, { passableAll = false, size, source = '', tInfo, classTable, sizeTable, keepObject = null } = {}) {
    const N = size ?? eng.N;
    const cls = classTable ?? loadUnitClassTable();
    const sizes = sizeTable ?? loadUnitSizeTable();
    const cells = N * N;
    const terrain = new Uint16Array(cells);
    const layer = new Int16Array(cells);
    const elev = new Int8Array(cells);
    const passable = new Uint8Array(cells).fill(1);
    const speed = new Uint8Array(cells);

    for (let i = 0; i < cells; i++) {
        terrain[i] = eng.terrain[i];
        layer[i] = eng.layer[i];
        elev[i] = eng.elev[i];
        speed[i] = speedOf(eng.terrain[i], tInfo, eng.forestTerrains);
    }

    // 物件清单（只白名单内的自然物件）＋ 占地格
    const objects = [];
    for (const o of eng.objects) {
        if (!isNaturalObject(o.id, cls)) continue;
        if (keepObject && !keepObject(o)) continue;
        const c = cls.get(o.id), sz = sizes.get(o.id);
        const w = sz?.clearance?.[0] ?? 0, h = sz?.clearance?.[1] ?? 0;
        const cx = Math.floor(o.x), cy = Math.floor(o.y);
        const covered = [];
        if (w > 0 && h > 0) {
            const x0 = Math.ceil(o.x - w / 2 - 0.5), x1 = Math.floor(o.x + w / 2 - 0.5);
            const y0 = Math.ceil(o.y - h / 2 - 0.5), y1 = Math.floor(o.y + h / 2 - 0.5);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
                if (x < 0 || y < 0 || x >= N || y >= N) continue;
                covered.push(y * N + x);
            }
        }
        const kind = KIND_OF[`${c.cls}/${c.type}`] ?? '其他';
        const objItem = {
            id: o.id, name: sz?.name ?? c.name, kind,
            x: +o.x.toFixed(3), y: +o.y.toFixed(3), cell: (cy >= 0 && cy < N && cx >= 0 && cx < N) ? cy * N + cx : -1,
            clearW: w, clearH: h, cells: covered,
        };
        if (o.rot !== undefined) objItem.rot = o.rot;
        objects.push(objItem);
        // 悬崖物件 → 覆盖格不可通行（陆战口径下不置 0：悬崖也可通行）
        if (!passableAll && c.cls === 34) for (const i of covered) passable[i] = 0;
    }

    return { size: N, source, terrain, layer, elev, passable, speed, objects };
}

/** 转成可直接写文件的普通对象（TypedArray → 普通数组）
 *  【第 48 轮定稿 · CC 裁定】字段全部定死：
 *    · `width` / `height` 显式写出（一维行优先，`index = y * width + x`）
 *    · `layer` / `elev` 保留；`speed` ×100 整数；`clearance=0` 的物件 `cells` 为空数组、另留 `cell`
 *    · 物件不按类别拆，用 `kind` 筛；不加悬崖反查表
 *    · 文件头 `header`：格式版本、脚本、种子、主题、边长、是否用外部骨架、DE dat 版本指纹、生成时间
 */
export const FORMAT_VERSION = 1;

export function toJson(md, header = {}) {
    const side = md.size;
    return {
        header: {
            formatVersion: FORMAT_VERSION,
            script: header.script ?? null,             // 脚本名（如 Arabia.rms）
            seed: header.seed ?? null,                 // 种子
            theme: header.theme ?? null,               // 强制/选中的主题（可为 null）
            size: side,                                // 地图边长（格）
            usedSkeleton: !!header.usedSkeleton,       // 是否用了外部地理骨架（跳过 LAND/ELEVATION）
            datFingerprint: header.datFingerprint ?? null,   // DE dat 指纹：{ path, bytes, mtime }
            generatedAt: header.generatedAt ?? new Date().toISOString(),
        },
        source: md.source,
        width: side, height: side,
        terrain: [...md.terrain], layer: [...md.layer], elev: [...md.elev],
        passable: [...md.passable], speed: [...md.speed],
        objects: md.objects,
    };
}

/** DE dat 的版本指纹（大小 + 修改时间）—— 写进文件头，便于判断数据是哪版 dat 生成的 */
export function datFingerprint(file = 'C:/Program Files (x86)/Steam/steamapps/common/AoE2DE/resources/_common/dat/empires2_x2_p1.dat') {
    try {
        const st = fs.statSync(file);
        return { path: file, bytes: st.size, mtime: st.mtime.toISOString() };
    } catch {
        return null;
    }
}

/** 自检：地形/图层/高度必须与引擎结果逐格一致；物件数 = 白名单物件数 */
export function verifyAgainstEngine(md, eng, classTable) {
    const cls = classTable ?? loadUnitClassTable();
    const cells = md.size * md.size;
    const bad = [];
    for (let i = 0; i < cells; i++) {
        if (md.terrain[i] !== eng.terrain[i]) bad.push(`terrain@${i}`);
        if (md.layer[i] !== eng.layer[i]) bad.push(`layer@${i}`);
        if (md.elev[i] !== eng.elev[i]) bad.push(`elev@${i}`);
        if (bad.length > 5) break;
    }
    const wantObj = eng.objects.filter((o) => isNaturalObject(o.id, cls)).length;
    return { ok: bad.length === 0 && md.objects.length === wantObj, bad, objCount: md.objects.length, wantObj };
}
