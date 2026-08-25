/**
 * 装饰素材搭配核对：有没有把素材撒到它不该出现的地方。
 *
 * 🔴 起因（2026-08-24 主人截图）：
 *    ① 干草原上一片**白色云朵斑块** = `DECAL_ICE`（一块冰），撒在非冬季的地上。
 *       根因：`BIOME_GROUND_DECOR` 那张表**不看季节**，寒带/苔原的夏天照撒。
 *    ② `GRAVES` 是**西式墓碑**（6 帧：石雕十字架 ×2 + 圆顶/方形石碑 ×4），
 *       却分布在中东、蒙古、青藏、东非、西域——**全是非基督教区**，
 *       而欧洲三个主题一个都没有，完全搞反。
 *       中原用碑碣、蒙古是敖包、伊斯兰是简朴石板，形制都不同，这套素材只配基督教区。
 *    ③ `RUGS`（卷起的红地毯）、`BARRELS`（木桶）是**人类聚落物件**，
 *       撒在无人荒野不合理——和「野战不出农田牧场」同一条逻辑。
 *
 * 三条硬检查，跑法：npx tsx tools/audit-decor-fit.mts
 */
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';
import { decorFitTables } from '../src/ui/scene13/DecorFit';

// 🔴 判据从引擎取，工具不另抄一份——两边各写一张表，改了一处另一处就成了假绿灯。
const { winterOnly: WINTER_ONLY, settlementOnly: SETTLEMENT_ONLY, cultureOnly: CHRISTIAN_ONLY } = decorFitTables();

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    const winterViolations = new Map<string, string[]>();
    const cultureViolations = new Map<string, string[]>();
    const settlementViolations = new Map<string, string[]>();
    let figs = 0;

    for (const c of CITIES_V2.filter((_, i) => i % 5 === 0)) {
        for (const isSiege of [true, false]) {
            for (const season of [0, 1, 2] as const) {
                const plan = generateEnvironment({
                    width: 2000, height: 1080, lat: c.lat, lng: c.lng,
                    seed: `${c.id}-decor${season}`, isSiege, getCalendarSeason: () => season,
                });
                figs++;
                for (const o of plan.objects) {
                    const a = o.asset;
                    // ① 冰只能在冬季
                    if (WINTER_ONLY.has(a) && season !== 2) {
                        const arr = winterViolations.get(a) ?? [];
                        if (arr.length < 5) arr.push(`${c.name}(季${season})`);
                        winterViolations.set(a, arr);
                    }
                    // ② 文化专属
                    const boxes = CHRISTIAN_ONLY[a];
                    if (boxes && !boxes.some(([s, n, w, e]) =>
                        c.lat >= s && c.lat <= n && c.lng >= w && c.lng <= e)) {
                        const arr = cultureViolations.get(a) ?? [];
                        if (arr.length < 5) arr.push(`${c.name}(${c.lat.toFixed(0)},${c.lng.toFixed(0)})`);
                        cultureViolations.set(a, arr);
                    }
                    // ③ 人烟物件不进野战
                    if (SETTLEMENT_ONLY.has(a) && !isSiege) {
                        const arr = settlementViolations.get(a) ?? [];
                        if (arr.length < 5) arr.push(c.name);
                        settlementViolations.set(a, arr);
                    }
                }
            }
        }
    }

    console.log(`核对 ${figs} 张战场图\n`);
    let fail = 0;
    const report = (
        title: string, m: Map<string, string[]>, okMsg: string, badMsg: string,
    ): void => {
        if (m.size === 0) { console.log(`✅ ${okMsg}`); return; }
        fail++;
        console.log(`🔴 ${badMsg}`);
        for (const [a, cities] of m) console.log(`     ${a.padEnd(18)} ${cities.join(' ')}`);
    };
    report('季节', winterViolations, '冰只在冬季出现', '非冬季出现了冬季专属素材：');
    report('文化', cultureViolations, '西式墓碑只在基督教文化区', '文化专属素材出现在错误的文化区：');
    report('人烟', settlementViolations, '野战荒野没有人烟物件', '野战出现了人类聚落物件（地毯/木桶）：');

    if (fail) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
