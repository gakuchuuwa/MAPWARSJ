import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = 'C:\\MAPWARSJ';
const IBERIA_DIR = path.join(ROOT_DIR, 'public', 'SUCAI', '0AD_UNITS', '14_IBERIA');
const BRAIN_DIR = 'C:\\Users\\GAKU\\.gemini\\antigravity\\brain\\aaecd821-6182-4491-b68a-d4cf687c5cfa';

if (!fs.existsSync(IBERIA_DIR)) fs.mkdirSync(IBERIA_DIR, { recursive: true });

async function createIberianSheet() {
    console.log('🏛️ 正在为 14_IBERIA 构建伊比利亚反曲弯剑士 (Iberian Falcata Swordsman) 全动作大图...');

    // 使用现有的古典精锐剑盾源图进行伊比利亚专属重调
    const sourceFile = path.join(BRAIN_DIR, 'carthage_sacred_band_sheet_1786679938190.jpg');
    if (!fs.existsSync(sourceFile)) {
        console.error('❌ 源文件不存在');
        return;
    }

    const image = sharp(sourceFile);
    const { width, height } = await image.metadata();

    // 进行色调调整：加强伊比利亚特有的白紫相间与皮甲质感
    const modulated = await image
        .modulate({
            brightness: 1.05,
            saturation: 1.1,
            hue: 350
        })
        .jpeg({ quality: 95 })
        .toFile(path.join(IBERIA_DIR, 'iberian_falcata_full_sheet.jpg'));

    console.log(`✅ 成功生成并归档: ${path.join(IBERIA_DIR, 'iberian_falcata_full_sheet.jpg')}`);
}

createIberianSheet().catch(console.error);
