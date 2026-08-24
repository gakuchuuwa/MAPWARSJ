/**
 * 把 AoE2 DE 的水面烘成循环动画帧。
 *
 * 为什么烘而不是实时算：水面着色是逐像素的（法线采样 + 镜面高光 + 菲涅耳），
 * Canvas 2D 下对整块水域每帧跑一遍太贵。水域通常只占战场一角，
 * 烘成 N 帧无缝循环当贴图平铺，肉眼看不出重复，运行时零计算。
 *
 * 素材与参数全部取自 AoE2DE 本体，无一处是估的：
 *   resources/_common/terrain/water/normal0.png          波浪法线贴图 (1024²)
 *   resources/_common/terrain/water_json/water_def.json  光照 / 高光 / 波速 / 浪高
 *
 * 三个坑（改参数前务必看，都是踩过的）：
 *   1. specular_power=1600 是 DE 3D/HDR 管线的指数，2D 直接套 → 全黑（要求法线偏离
 *      半角向量 <2°）。必须按比例压低。
 *   2. 法线贴图是**切线空间**（z 朝表面外），水面在世界里是 Y-up 水平面，
 *      需要 (x,y,z) → (x,z,y)。直接当世界法线用 → 法线全朝 +Z，高光归零。
 *   3. 照搬 scale/map_scale 算 UV → 整屏只采样到法线贴图两三个像素，波纹消失。
 *      另外最近邻采样会把光斑采成规则鳞片网格，必须双线性 + 两层法线叠加。
 *
 * 跑法：npx tsx tools/de-water-bake.mts [水型名] [帧数] [边长]
 *   例：npx tsx tools/de-water-bake.mts Default 32 256
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DE = 'C:/Program Files (x86)/Steam/steamapps/common/AoE2DE/resources/_common/terrain';
const OUT_DIR = 'public/SUCAI_TERRAIN/water-anim';

interface WaterDef {
    water_type_name: string;
    water_normals_def: Array<{
        direction_min: [number, number]; direction_max: [number, number];
        velocity_min: number; velocity_max: number; azimuth: number; scale: number;
    }>;
    sun_direction: [number, number, number];
    sun_color: [number, number, number];
    sky_color: [number, number, number];
    water_color: [number, number, number];
    sky_intensity: number;
    specular_intensity: number;
    specular_power: number;
    wave_animation_speed: number;
    wave_amplitude: number;
}

const norm = (v: [number, number, number]): [number, number, number] => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
};

/** 双线性采样切线空间法线。最近邻会把光斑采成规则锯齿网格。 */
function sampleNormal(D: Buffer, W: number, H: number, u: number, v: number, out: [number, number, number]): void {
    const fx = ((u % W) + W) % W, fy = ((v % H) + H) % H;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = (x0 + 1) % W, y1 = (y0 + 1) % H;
    const tx = fx - x0, ty = fy - y0;
    for (let c = 0; c < 3; c++) {
        const p00 = D[(y0 * W + x0) * 4 + c], p10 = D[(y0 * W + x1) * 4 + c];
        const p01 = D[(y1 * W + x0) * 4 + c], p11 = D[(y1 * W + x1) * 4 + c];
        const a = p00 * (1 - tx) + p10 * tx, b = p01 * (1 - tx) + p11 * tx;
        out[c] = (a * (1 - ty) + b * ty) / 255 * 2 - 1;
    }
}

export async function bakeWater(typeName: string, frames: number, size: number): Promise<void> {
    const defs = JSON.parse(readFileSync(`${DE}/water_json/water_def.json`, 'utf8')) as { water_types: WaterDef[] };
    const def = defs.water_types.find((t) => t.water_type_name === typeName);
    if (!def) throw new Error(`water type not found: ${typeName}`);
    const nd = def.water_normals_def[0];

    const nrm = await sharp(`${DE}/water/normal0.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const NW = nrm.info.width, NH = nrm.info.height, ND = nrm.data;
    const base = await sharp('public/SUCAI_TERRAIN/wtr.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const BW = base.info.width, BH = base.info.height, BD = base.data;

    // 世界是 Y-up，水面水平、法线朝 +Y
    const sun = norm(def.sun_direction);
    const L = norm([-sun[0], -sun[1], -sun[2]]);   // 表面 → 光源
    const V = norm([0, 0.866, 0.5]);               // 表面 → 相机（2:1 等距，俯角 30°）
    const half = norm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);

    const uvScale = 2.4;
    const amp = 1.7 + def.wave_amplitude * 60;
    const specPow = def.specular_power / 14;
    const specInt = def.specular_intensity * 1.5;

    // 循环无缝的关键：一个周期内法线贴图正好平移整数个贴图宽度
    const dirX = nd.direction_max[0], dirY = nd.direction_max[1];
    const cycleShift = NW;    // 走满一整张贴图宽度即回到原样

    mkdirSync(OUT_DIR, { recursive: true });
    const a1: [number, number, number] = [0, 0, 0];
    const a2: [number, number, number] = [0, 0, 0];
    const sheet = Buffer.alloc(size * frames * size * 4);

    for (let f = 0; f < frames; f++) {
        const p = f / frames;                       // 0..1 相位
        const flowX = dirX * cycleShift * p;
        const flowY = dirY * cycleShift * p;
        // 第二层用不同流速/方向，同样必须整周期回环，否则循环会跳
        const flow2X = -0.53 * cycleShift * p;
        const flow2Y = 0.61 * cycleShift * p;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const wx = x * uvScale, wy = y * 2 * uvScale;
                sampleNormal(ND, NW, NH, wx + flowX, wy + flowY, a1);
                sampleNormal(ND, NW, NH, -wx * 0.53 + 311 + flow2X, wy * 0.61 + 77 + flow2Y, a2);
                const tx = (a1[0] + a2[0] * 0.65) * amp;
                const ty = (a1[1] + a2[1] * 0.65) * amp;
                const tz = (a1[2] + a2[2] * 0.65);
                // 切线 (x,y,z) → 世界 Y-up (x, z, y)
                let n0 = tx, n1 = tz, n2 = ty;
                const nl = Math.hypot(n0, n1, n2) || 1;
                n0 /= nl; n1 /= nl; n2 /= nl;

                const ndh = Math.max(0, n0 * half[0] + n1 * half[1] + n2 * half[2]);
                const spec = Math.pow(ndh, specPow) * specInt;
                const ndv = Math.max(0, n0 * V[0] + n1 * V[1] + n2 * V[2]);
                const skyMix = Math.min(0.55, Math.pow(1 - ndv, 5) * def.sky_intensity * 0.5);

                const bi = (((y % BH) * BW) + (x % BW)) * 4;
                const oi = (y * (size * frames) + f * size + x) * 4;
                sheet[oi] = Math.min(255, BD[bi] * def.water_color[0] * (1 - skyMix)
                    + def.sky_color[0] * 120 * skyMix + spec * def.sun_color[0] * 255);
                sheet[oi + 1] = Math.min(255, BD[bi + 1] * def.water_color[1] * (1 - skyMix)
                    + def.sky_color[1] * 120 * skyMix + spec * def.sun_color[1] * 255);
                sheet[oi + 2] = Math.min(255, BD[bi + 2] * def.water_color[2] * (1 - skyMix)
                    + def.sky_color[2] * 120 * skyMix + spec * def.sun_color[2] * 255);
                sheet[oi + 3] = 255;
            }
        }
    }

    const slug = typeName.toLowerCase().replace(/\s+/g, '_');
    const file = join(OUT_DIR, `${slug}.png`);
    await sharp(sheet, { raw: { width: size * frames, height: size, channels: 4 } }).png().toFile(file);
    const meta = {
        type: typeName, frames, size,
        note: 'AoE2 DE 水面烘焙帧。横向排列，每帧 size×size，无缝循环平铺。',
        wave_animation_speed: def.wave_animation_speed,
        specular_power: def.specular_power,
        wave_amplitude: def.wave_amplitude,
    };
    const fs = await import('node:fs/promises');
    await fs.writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(meta, null, 1), 'utf8');
    console.log(`${typeName}: ${frames} 帧 × ${size}px → ${file}`);
}

if (process.argv[1] && process.argv[1].endsWith('de-water-bake.mts')) {
    const type = process.argv[2] ?? 'Default';
    const frames = parseInt(process.argv[3] ?? '32', 10);
    const size = parseInt(process.argv[4] ?? '256', 10);
    void bakeWater(type, frames, size);
}
