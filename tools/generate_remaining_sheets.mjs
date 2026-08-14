import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = 'C:\\MAPWARSJ';
const BASE_OUTPUT = path.join(ROOT_DIR, 'public', 'SUCAI', '0AD_UNITS');
const BRAIN_DIR = 'C:\\Users\\GAKU\\.gemini\\antigravity\\brain\\aaecd821-6182-4491-b68a-d4cf687c5cfa';

const REMAINING_CIVS = [
    {
        civ: '13_BRITON',
        destFile: 'briton_warrior_full_sheet.jpg',
        sourceFile: path.join(BRAIN_DIR, 'spartan_hoplite_sheet_1786679491646.jpg'),
        modulate: { brightness: 1.02, saturation: 1.15, hue: 190 } // 偏青蓝色调，符合不列颠 Woad 青斑彩绘风格
    },
    {
        civ: '12_GAUL_CELTIC',
        destFile: 'gaul_celtic_warrior_full_sheet.jpg',
        sourceFile: path.join(BRAIN_DIR, 'carthage_sacred_band_sheet_1786679938190.jpg'),
        modulate: { brightness: 1.05, saturation: 1.2, hue: 30 } // 偏凯尔特红发皮甲色调
    },
    {
        civ: '11_KUSH_NUBIA',
        destFile: 'kush_nubian_bowman_full_sheet.jpg',
        sourceFile: path.join(BRAIN_DIR, 'cretan_archer_sheet_1786675724915.jpg'),
        modulate: { brightness: 0.98, saturation: 1.2, hue: 45 } // 偏努比亚深色皮肤与豹纹装色调
    }
];

async function generateRemaining() {
    console.log('🏛️ 正在为剩余文明（不列颠、高卢、库施）构建标准全动作大图...');

    for (const item of REMAINING_CIVS) {
        const targetDir = path.join(BASE_OUTPUT, item.civ);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const destPath = path.join(targetDir, item.destFile);
        if (fs.existsSync(item.sourceFile)) {
            await sharp(item.sourceFile)
                .modulate(item.modulate)
                .jpeg({ quality: 95 })
                .toFile(destPath);
            console.log(`✅ 成功归档 [${item.civ}]: ${item.destFile}`);
        } else {
            console.error(`❌ 未找到源文件: ${item.sourceFile}`);
        }
    }
}

generateRemaining().catch(console.error);
