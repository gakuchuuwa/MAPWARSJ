/**
 * 【据点贴图 DE 化 · 合成原型】2026-08-26
 *
 * 目的：把战略地图上「一座城 = 一张手绘贴图」换成「DE 建筑素材多件随机混搭」，
 *       让 800+ 座共用通用图的据点各不相同。
 *
 * 现状（改之前）：
 *   · 960 座据点里只有约 135 座有专属手绘图（public/cities/0*.png + zhiding/）
 *   · 其余全部共用 23 文化区 × 4 城型 ≈ 72 张通用图 → 同区同档的城长得一模一样
 *
 * 本脚本只做**离线合成原型**，不接线进游戏：先出图看效果，认可了再谈接线。
 *
 * 关键设计：
 *   ① 稳定随机：种子 = cityId 的哈希。同一座城每次合成结果必须完全一致，
 *      否则每次刷新/重进城池长相都变，观众会觉得画面在闪。
 *   ② 风格集沿用 13 的 REGION_BUILDING_STYLE（文化区 → AFRI/ASIA/CEAS/MEDI/MESO/
 *      ORIE/SEAS/SLAV/WEST/INDI 十套），不另起炉灶，保证战略地图与战场同源。
 *   ③ 等距摆放 + 按脚点 y 排序绘制（后排先画），这是 DE 的画法，随机也不会穿插错位。
 *   ④ 建筑构成按城型分档，大城才给城堡/市镇中心这类地标。
 *
 * 用法：node tools/compose_city_from_de.mjs [输出目录]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const BUILD_DIR = path.join(ROOT, 'public', 'SUCAI_BUILDING');
const OUT_DIR = process.argv[2] || path.join(ROOT, 'scratch', 'city_de_preview');

/** 画布：与现有据点贴图同尺寸（实测 public/cities/*.png 均为 1024×768） */
const CW = 1024, CH = 768;

/** 等距格子（DE 标准 2:1） */
const TILE_W = 96, TILE_H = 48;

/** 城型 → 建筑构成。数字 = 摆几个；地标类只在高档城出现。 */
const COMPOSITION = {
    small_city: { filler: 6, landmark: null, tower: 1, age: 'AGE2' },
    pass: { filler: 4, landmark: null, tower: 2, age: 'AGE2' },
    medium_city: { filler: 9, landmark: 'TOWN_CENTER', tower: 1, age: 'AGE3' },
    big_city: { filler: 12, landmark: 'CASTLE', tower: 2, age: 'AGE3' },
};

/** 填充建筑池（民用为主，混少量军事），按 age 后缀取 */
const FILLER = ['HOUSE', 'HOUSE', 'HOUSE', 'MILL', 'MARKET', 'BARRACKS', 'BLACKSMITH', 'STABLE', 'ARCHERY_RANGE', 'MONASTERY'];

/** 文化区 → DE 风格集：与 Scene13WarLayer.REGION_BUILDING_STYLE 保持一致 */
const REGION_BUILDING_STYLE = {
    SLAVIC: 'SLAV', GERMANIC: 'WEST', LATIN: 'MEDI', CENTRAL: 'ASIA', NORTH: 'ASIA',
    JIANGNAN: 'ASIA', LINGNAN: 'ASIA', BASHU: 'ASIA', DIANQIAN: 'SEAS', HEXI: 'ASIA',
    WESTERN: 'CEAS', TIBET: 'INDI', STEPPE: 'CEAS', NORTHEAST: 'ASIA', KOREA: 'ASIA',
    JAPAN: 'ASIA', CENTRAL_ASIA: 'CEAS', WEST_ASIA: 'ORIE', INDIA: 'INDI', BERBER: 'AFRI',
    AMERICA: 'MESO', AFRICA: 'AFRI', MALAY: 'SEAS',
};

/** 稳定随机：同一 cityId 永远得到同一串数 —— 城的长相不能每次刷新都变 */
function makeRng(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
        h ^= seedStr.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return () => {
        h ^= h << 13; h >>>= 0;
        h ^= h >> 17;
        h ^= h << 5; h >>>= 0;
        return h / 4294967296;
    };
}

function readMeta(dir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(BUILD_DIR, dir, '_meta.json'), 'utf-8'));
    } catch { return null; }
}

function pickDir(style, base, age) {
    // 优先取指定时代，没有就退到 AGE2，再没有就取任何同名的
    for (const suffix of [age, 'AGE2', 'AGE3', 'AGE4']) {
        const d = `${style}_${base}_${suffix}`;
        if (fs.existsSync(path.join(BUILD_DIR, d, 'frames.png'))) return d;
    }
    return null;
}

/**
 * 合成一座城。
 * 摆位：菱形地块内随机取格，按脚点 y 升序绘制（远的先画，近的后画压住），与 DE 一致。
 */
async function composeCity({ cityId, type, region }) {
    const style = REGION_BUILDING_STYLE[region] ?? 'WEST';
    const cfg = COMPOSITION[type] ?? COMPOSITION.small_city;
    const rng = makeRng(cityId);

    // 1) 选建筑：地标 1 个（居中偏后）+ 塔 + 填充建筑
    const picks = [];
    if (cfg.landmark) {
        const d = pickDir(style, cfg.landmark, cfg.age);
        if (d) picks.push({ dir: d, gx: 0, gy: -1, key: 'landmark' });
    }
    const pool = [...FILLER].sort(() => rng() - 0.5);
    // 菱形排布的可用格位（gx+gy 决定等距坐标），中心留给地标
    const slots = [];
    for (let gx = -2; gx <= 2; gx++) {
        for (let gy = -2; gy <= 2; gy++) {
            if (Math.abs(gx) + Math.abs(gy) > 3) continue;   // 裁成菱形，四角不摆
            if (gx === 0 && gy === -1 && cfg.landmark) continue;
            slots.push({ gx, gy });
        }
    }
    slots.sort(() => rng() - 0.5);

    let si = 0;
    for (let i = 0; i < cfg.filler && si < slots.length; i++) {
        const base = pool[i % pool.length];
        const d = pickDir(style, base, cfg.age);
        if (!d) continue;
        picks.push({ ...slots[si++], dir: d, key: base });
    }
    for (let i = 0; i < cfg.tower && si < slots.length; i++) {
        const d = pickDir(style, 'TOWER', cfg.age);
        if (d) picks.push({ ...slots[si++], dir: d, key: 'TOWER' });
    }

    // 2) 等距坐标 + 脚点排序（y 小的先画）
    const placed = [];
    for (const p of picks) {
        const meta = readMeta(p.dir);
        if (!meta) continue;
        const sx = CW / 2 + (p.gx - p.gy) * TILE_W / 2;
        const sy = CH / 2 + 60 + (p.gx + p.gy) * TILE_H / 2;
        placed.push({ ...p, meta, sx, sy });
    }
    placed.sort((a, b) => a.sy - b.sy);

    // 3) 合成：锚点对齐（anchor 是脚点在帧内的位置）
    const layers = [];
    for (const p of placed) {
        const file = path.join(BUILD_DIR, p.dir, 'frames.png');
        if (!fs.existsSync(file)) continue;
        const m = p.meta;
        // frames.png 是横向逐帧拼接；建筑普遍 frames=1，取第 0 帧
        const fw = m.box_w, fh = m.box_h;
        let buf;
        try {
            buf = await sharp(file).extract({ left: 0, top: 0, width: fw, height: fh }).toBuffer();
        } catch { continue; }
        const left = Math.round(p.sx - m.anchor_x);
        const top = Math.round(p.sy - m.anchor_y);
        // 越界的整块丢掉（sharp 不接受负偏移）
        if (left < 0 || top < 0 || left + fw > CW || top + fh > CH) continue;
        layers.push({ input: buf, left, top });
    }

    const out = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(layers).png().toBuffer();
    return { buf: out, count: layers.length, style };
}

const SAMPLES = [
    { cityId: 'city_demo_asia_big', type: 'big_city', region: 'CENTRAL' },
    { cityId: 'city_demo_asia_small', type: 'small_city', region: 'CENTRAL' },
    { cityId: 'city_demo_asia_small2', type: 'small_city', region: 'JIANGNAN' },
    { cityId: 'city_demo_medi_big', type: 'big_city', region: 'LATIN' },
    { cityId: 'city_demo_west_med', type: 'medium_city', region: 'GERMANIC' },
    { cityId: 'city_demo_orie_med', type: 'medium_city', region: 'WEST_ASIA' },
    { cityId: 'city_demo_indi_small', type: 'small_city', region: 'INDIA' },
    { cityId: 'city_demo_meso_med', type: 'medium_city', region: 'AMERICA' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const s of SAMPLES) {
    const r = await composeCity(s);
    const f = path.join(OUT_DIR, `${s.cityId}.png`);
    fs.writeFileSync(f, r.buf);
    console.log(`  ${s.region.padEnd(12)} ${s.type.padEnd(12)} style=${r.style.padEnd(5)} 建筑 ${String(r.count).padStart(2)} 件 → ${path.basename(f)}`);
}
console.log(`\n输出目录: ${OUT_DIR}`);
