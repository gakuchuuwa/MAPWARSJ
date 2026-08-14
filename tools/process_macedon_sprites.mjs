import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MACEDON_DIR = path.join(ROOT_DIR, 'public', 'SUCAI', 'MACEDON');
const RAW_DIR = path.join(MACEDON_DIR, 'raw');

if (!fs.existsSync(MACEDON_DIR)) fs.mkdirSync(MACEDON_DIR, { recursive: true });
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

// 拷贝生成的精美原图到 raw 目录
const generatedSource = 'C:\\Users\\GAKU\\.gemini\\antigravity\\brain\\aaecd821-6182-4491-b68a-d4cf687c5cfa\\macedon_phalanx_sheet_1786675253388.jpg';
const rawPath = path.join(RAW_DIR, 'macedon_sheet.png');

async function run() {
    console.log('🏛️ 正在处理马其顿方阵精灵图...');
    
    // 1. 读取原图
    const sourceBuffer = fs.existsSync(generatedSource) 
        ? fs.readFileSync(generatedSource) 
        : (fs.existsSync(rawPath) ? fs.readFileSync(rawPath) : null);

    if (!sourceBuffer) {
        console.error('❌ 未找到源图片！');
        return;
    }

    const image = sharp(sourceBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    console.log(`📐 原始尺寸: ${width}x${height}`);

    // 2. 抠绿幕并生成带有 Alpha 通道的 RGBA Buffer
    const rawPixels = await image.ensureAlpha().raw().toBuffer();
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = rawPixels[offset];
        const g = rawPixels[offset + 1];
        const b = rawPixels[offset + 2];

        // 绿幕判定：纯绿色背景
        if (g > 150 && g > r * 1.3 && g > b * 1.3) {
            rawPixels[offset + 3] = 0; // 完全透明
        } else if (g > 120 && g > r + 30 && g > b + 30) {
            // 边缘平滑抗锯齿
            const factor = Math.max(0, 1 - (g - Math.max(r, b)) / 60);
            rawPixels[offset + 3] = Math.round(rawPixels[offset + 3] * factor);
        }
    }

    const transparentImage = sharp(rawPixels, {
        raw: {
            width,
            height,
            channels: 4
        }
    });

    // 保存透明总图到 raw 目录
    await transparentImage.png().toFile(rawPath);
    console.log(`✅ 已保存透明总图到: ${rawPath}`);

    // 3. 按行与方向切分切片 (网格结构大约为 6 行 x 8 列)
    const rows = 6;
    const cols = 8;
    const cellW = Math.floor(width / cols);
    const cellH = Math.floor(height / rows);

    console.log(`✂️ 正在切分 ${rows}x${cols} 网格单元 (单格: ${cellW}x${cellH})...`);

    // 8个方向: 0:S, 1:SE, 2:E, 3:NE, 4:N, 5:NW, 6:W, 7:SW
    // 将不同行的姿势映射到游戏动作
    for (let dir = 0; dir < 8; dir++) {
        // 从行军行(Row 1 / Row 3)提取对应角度
        const colIdx = dir;
        const moveRow = 3; // 行军行
        const attackRow = 4; // 刺击行
        const idleRow = 5; // 竖矛待命行

        // 提取 Move 帧
        const moveExtract = await sharp(rawPixels, {
            raw: { width, height, channels: 4 }
        })
        .extract({
            left: Math.min(width - cellW, colIdx * cellW),
            top: Math.min(height - cellH, moveRow * cellH),
            width: cellW,
            height: cellH
        })
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(MACEDON_DIR, `move_${dir}.png`));

        // 提取 Attack 帧
        await sharp(rawPixels, {
            raw: { width, height, channels: 4 }
        })
        .extract({
            left: Math.min(width - cellW, colIdx * cellW),
            top: Math.min(height - cellH, attackRow * cellH),
            width: cellW,
            height: cellH
        })
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(MACEDON_DIR, `attack_${dir}.png`));

        // 提取 Idle 帧
        await sharp(rawPixels, {
            raw: { width, height, channels: 4 }
        })
        .extract({
            left: Math.min(width - cellW, (colIdx % 4) * cellW),
            top: Math.min(height - cellH, idleRow * cellH),
            width: cellW,
            height: cellH
        })
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(MACEDON_DIR, `idle_${dir}.png`));

        // 提取 Damage / Death 帧
        await sharp(rawPixels, {
            raw: { width, height, channels: 4 }
        })
        .extract({
            left: Math.min(width - cellW, (colIdx % 4) * cellW),
            top: Math.min(height - cellH, 0 * cellH),
            width: cellW,
            height: cellH
        })
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(MACEDON_DIR, `damage_${dir}.png`));

        await sharp(rawPixels, {
            raw: { width, height, channels: 4 }
        })
        .extract({
            left: Math.min(width - cellW, (colIdx % 4) * cellW),
            top: Math.min(height - cellH, 0 * cellH),
            width: cellW,
            height: cellH
        })
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(MACEDON_DIR, `death_${dir}.png`));
    }

    console.log('🎉 马其顿方阵 8 方向全套精灵图切片全部生成成功！');
    console.log(`📁 存放在: ${MACEDON_DIR}`);
}

run().catch(console.error);
