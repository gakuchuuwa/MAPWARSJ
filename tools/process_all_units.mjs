import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BRAIN_DIR = 'C:\\Users\\GAKU\\.gemini\\antigravity\\brain\\aaecd821-6182-4491-b68a-d4cf687c5cfa';

const UNITS_TO_PROCESS = [
    {
        name: 'COMPANION_CAVALRY',
        sourceFile: path.join(BRAIN_DIR, 'companion_cavalry_sheet_1786675511333.jpg'),
        rows: 6,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 3,
        damageRow: 4,
        deathRow: 5,
    },
    {
        name: 'CRETAN_ARCHER',
        sourceFile: path.join(BRAIN_DIR, 'cretan_archer_sheet_1786675724915.jpg'),
        rows: 8,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 2,
        damageRow: 3,
        deathRow: 7,
    },
    {
        name: 'ROMAN_LEGION',
        sourceFile: path.join(BRAIN_DIR, 'roman_legionary_sheet_1786675744520.jpg'),
        rows: 5,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 2,
        damageRow: 3,
        deathRow: 4,
    },
    {
        name: 'HUAXIA_IRON_CAVALRY',
        sourceFile: path.join(BRAIN_DIR, 'huaxia_iron_cavalry_sheet_1786675923421.jpg'),
        rows: 8,
        cols: 8,
        idleRow: 0,
        moveRow: 2,
        attackRow: 3,
        damageRow: 4,
        deathRow: 7,
    },
    {
        name: 'STEPPE_HORSE_ARCHER',
        sourceFile: path.join(BRAIN_DIR, 'steppe_horse_archer_sheet_1786676039257.jpg'),
        rows: 6,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 2,
        damageRow: 4,
        deathRow: 5,
    },
    {
        name: 'HUAXIA_CROSSBOW',
        sourceFile: path.join(BRAIN_DIR, 'huaxia_crossbow_sheet_1786676262784.jpg'),
        rows: 7,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 2,
        damageRow: 4,
        deathRow: 6,
    },
    {
        name: 'WAR_ELEPHANT',
        sourceFile: path.join(BRAIN_DIR, 'war_elephant_sheet_1786676380331.jpg'),
        rows: 6,
        cols: 8,
        idleRow: 0,
        moveRow: 1,
        attackRow: 2,
        damageRow: 3,
        deathRow: 5,
    }
];

async function processUnit(unit) {
    const outputDir = path.join(ROOT_DIR, 'public', 'SUCAI', unit.name);
    const rawDir = path.join(outputDir, 'raw');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

    console.log(`\n⚔️ 正在处理兵种: ${unit.name}...`);
    if (!fs.existsSync(unit.sourceFile)) {
        console.error(`❌ 源文件不存在: ${unit.sourceFile}`);
        return;
    }

    const image = sharp(unit.sourceFile);
    const { width, height } = await image.metadata();
    console.log(`📐 原始分辨率: ${width}x${height}`);

    const rawPixels = await image.ensureAlpha().raw().toBuffer();
    const totalPixels = width * height;

    // 智能绿幕抠图
    for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = rawPixels[offset];
        const g = rawPixels[offset + 1];
        const b = rawPixels[offset + 2];

        if (g > 150 && g > r * 1.3 && g > b * 1.3) {
            rawPixels[offset + 3] = 0;
        } else if (g > 120 && g > r + 30 && g > b + 30) {
            const factor = Math.max(0, 1 - (g - Math.max(r, b)) / 60);
            rawPixels[offset + 3] = Math.round(rawPixels[offset + 3] * factor);
        }
    }

    const transparentImage = sharp(rawPixels, {
        raw: { width, height, channels: 4 }
    });
    await transparentImage.png().toFile(path.join(rawDir, 'sheet.png'));

    const cellW = Math.floor(width / unit.cols);
    const cellH = Math.floor(height / unit.rows);

    for (let dir = 0; dir < 8; dir++) {
        const colIdx = dir;

        // Move
        await sharp(rawPixels, { raw: { width, height, channels: 4 } })
            .extract({
                left: Math.min(width - cellW, colIdx * cellW),
                top: Math.min(height - cellH, unit.moveRow * cellH),
                width: cellW,
                height: cellH
            })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `move_${dir}.png`));

        // Attack
        await sharp(rawPixels, { raw: { width, height, channels: 4 } })
            .extract({
                left: Math.min(width - cellW, colIdx * cellW),
                top: Math.min(height - cellH, unit.attackRow * cellH),
                width: cellW,
                height: cellH
            })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `attack_${dir}.png`));

        // Idle
        await sharp(rawPixels, { raw: { width, height, channels: 4 } })
            .extract({
                left: Math.min(width - cellW, colIdx * cellW),
                top: Math.min(height - cellH, unit.idleRow * cellH),
                width: cellW,
                height: cellH
            })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `idle_${dir}.png`));

        // Damage
        await sharp(rawPixels, { raw: { width, height, channels: 4 } })
            .extract({
                left: Math.min(width - cellW, colIdx * cellW),
                top: Math.min(height - cellH, unit.damageRow * cellH),
                width: cellW,
                height: cellH
            })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `damage_${dir}.png`));

        // Death
        await sharp(rawPixels, { raw: { width, height, channels: 4 } })
            .extract({
                left: Math.min(width - cellW, colIdx * cellW),
                top: Math.min(height - cellH, unit.deathRow * cellH),
                width: cellW,
                height: cellH
            })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `death_${dir}.png`));
    }

    console.log(`✅ ${unit.name} 8 方向动作切片全部生成完成！`);
}

async function runAll() {
    console.log('==============================================');
    console.log('🏛️  全欧亚大陆古文明核心兵种精灵图流水线');
    console.log('==============================================');
    for (const unit of UNITS_TO_PROCESS) {
        await processUnit(unit);
    }
    console.log('\n🎉 所有欧亚大陆核心兵种全套精灵图生成并入库完毕！');
}

runAll().catch(console.error);
