/**
 * 🔴 [2026-10-20 主人令「按功能模块拆分 Scene13WarLayer.ts，保证原有功能完全正常」]
 * 战术模式（Scene13）**WebGL 地面层接入**：requestGroundLayerGL()（载入战场地图、地形、树木大山等自然物件）＋ spawnBattlefieldRelics()（两翼古战场遗存）。
 * 从 Scene13WarLayer.ts 原样搬出（逻辑一行未改）。写法同 Scene13CityLayout.ts：
 * 函数以 `this: Scene13WarLayer` 调用（类里用 `fn.call(this, …)`），函数体与原方法逐字一致。
 */
// 值导入（用到静态常量 Scene13WarLayer.GL_GROUND_WAIT_MS）；循环引用只在函数调用时取值，模块加载期不读
import { Scene13WarLayer } from '../Scene13WarLayer';
import type { AnimalAction, DecorSprite } from './Scene13Types';
import { DEFAULT_TERRAIN_TILE } from '../Scene13Biome';
import { FALLBACK_MAPDATA_URL, MAPDATA_DIR } from './Scene13CombatMath';
import { Scene13GroundLayerGL, resolveNatureSprite, transposeMapData, TAC_TILE_W, TAC_TILE_H } from './Scene13GroundLayerGL';
import type { TreeSeason } from './TreeAssignment';
import { bareSandRejectsTree, seasonalDeTree } from './Scene13DeTrees';
import { deriveDeGroundTiles } from './Scene13DeGround';
import { animalNativeAt, animalDeOf } from './Scene13Animals';
import { applyDeCityToGround } from './Scene13CityLayout';
import { groundDecorFor, decorFits } from './DecorFit';
import { setCachedViennaMapData } from './Scene13SpriteCache';

/**
 * M3 WebGL 地面层接入：在 realGeography 开关开启时初始化底层 WebGL 视口，
 * 并加载新地图物件，替换旧 13 随机树木与岩石。
 */
export function requestGroundLayerGL(this: Scene13WarLayer): void {
    if (!this.glCanvas) return;
    // 世界大小（开战时定死的世界中心 ×2）：地面格子与屏幕像素的换算口径，与窗口大小无关
    const VW = this.worldCX * 2, VH = this.worldCY * 2;
    const gen = this.assetGen;
    const cv = this.glCanvas;
    // 🔴 [2026-10-14 删除旧 13 的 2D 地面后] 开战前等 GL 地面就绪（占 1 个 pending，与兵种贴图同一道素材闸），
    //    最多等 GL_GROUND_WAIT_MS，超时照常开打，绝不卡住战斗。实测本机 GL 地面 0.86~1.17s 就绪，比其余素材还早约 50ms。
    this.pending++;
    let held = true;
    const releaseGround = () => { if (!held) return; held = false; if (gen === this.assetGen) this.pending--; };
    window.setTimeout(releaseGround, Scene13WarLayer.GL_GROUND_WAIT_MS);

    // 🔴 [2026-10-11「整合各场景素材」] 地图数据按**真实地理**取，三级退让：
    //    ① 探针注入 window.__M3_TEST_MAPDATA__（真机验收用，保留最高优先）；
    //    ② public/battlefields/site_<据点id>.json —— 由 scratch/_bake_site_maps.mjs 用**真实高程 + WorldCover 水体**
    //       做成骨架喂给引擎（脚本的造水/造陆段跳过）⇒ 战场就是那个地方的地形（维也纳＝多瑙河）；
    //    ③ 没有该据点 → theme_<环境计划的 deMapTheme>.json（B 批：按气候主题烘焙的通用地貌）；
    //    ④ 都没有 → 维也纳测试图兜底，保证战斗照样能开。
    const calcWaterRatio = (md: any): number => {
        if (!md?.terrain?.length) return 0;
        let w = 0;
        for (let i = 0; i < md.terrain.length; i++) {
            const t = md.terrain[i];
            if (t === 1 || t === 15 || t === 22 || t === 23 || t === 4 || t === 58 || t === 95 || t === 96) w++;
        }
        return w / md.terrain.length;
    };
    const getMapData = async () => {
        if ((window as any).__M3_TEST_MAPDATA__) return (window as any).__M3_TEST_MAPDATA__;
        const load = async (file: string) => {
            try {
                const res = await fetch(MAPDATA_DIR + file);
                if (res.ok) return await res.json();
            } catch {}
            return null;
        };
        const siteId = this.defenderCityId;
        if (siteId) {
            const site = await load('site_' + siteId + '.json');
            if (site) {
                const wRatio = calcWaterRatio(site);
                const skelHmin = site?.header?.skeleton?.hmin ?? (this.environmentPlan?.elevationM ?? 0);
                const skelHmax = site?.header?.skeleton?.hmax ?? skelHmin;
                if (this.environmentPlan && this.environmentPlan.elevationM === null && site?.header?.skeleton?.hmin !== undefined) {
                    this.environmentPlan.elevationM = Math.round((skelHmin + skelHmax) * 0.5);
                }
                // 若烘焙图存在明显水体但环境计划尚未检出水体（如瓦片尚未异步加载完），按海拔补齐 river / sea
                if (wRatio > 0.02 && this.environmentPlan && (!this.environmentPlan.waterKind || this.environmentPlan.waterKind === 'none')) {
                    this.environmentPlan.waterKind = skelHmin > 10 ? 'river' : 'sea';
                }
                // 🔴 修复大非川（龙羊峡水库 100% 水）、萨尔克尔（齐姆良斯克水库 100% 水）、郧阳（丹江口水库 65% 水）等
                //    因现代水库蓄水或海湾裁剪导致全图 >55% 变成汪洋大海、丧失陆地与林木的问题：
                //    此类淹没图退回当前气候带的 _river / _sea 主题模板，并按真实河道/海岸方向生成城侧水体
                if (wRatio <= 0.55) {
                    return site;
                }
                console.info(`[Scene13WarLayer] 🏞 据点图 site_${siteId}.json 水面占比过高 (${(wRatio * 100).toFixed(1)}%，现代水库/海湾淹没)，切换为当地气候水体模板`);
            }
        }
        const theme = this.environmentPlan?.deMapTheme;
        if (theme) {
            const THEME_MAP_FILES: Record<string, string> = {
                afrotropical_tropical: 'theme_afrotropical_tropical.json',
                neotropical_temperate: 'theme_neotropical_temperate.json',
                neotropical_tropical: 'theme_neotropical_tropical.json',
                nearctic_temperate: 'theme_nearctic_temperate.json',
                indomalayan_tropical: 'theme_indomalayan_tropical.json',
                palaearctic_asia_temperate: 'theme_palaearctic_asia_temperate.json',
                palaearctic_middle_east_desert: 'theme_palaearctic_middle_east_desert.json',
                palaearctic_europe_taiga: 'theme_palaearctic_europe_taiga.json',
                palaearctic_europe_temperate: 'theme_palaearctic_europe_temperate.json',
                palaearctic_europe_mediterranean: 'theme_palaearctic_europe_mediterranean.json',
                australasian_temperate: 'theme_australasian_temperate.json',
                palaearctic_asia_desert: 'theme_palaearctic_asia_desert.json',
                palaearctic_salt_desert: 'theme_palaearctic_salt_desert.json',
                palaearctic_asia_steppe: 'theme_palaearctic_asia_steppe.json',
                palaearctic_tibetan_plateau: 'theme_palaearctic_tibetan_plateau.json',
                palaearctic_middle_east_highland: 'theme_palaearctic_middle_east_highland.json',
                serengeti: 'theme_serengeti.json',
                palustrine_swamp: 'theme_palustrine_swamp.json',
            };
            const waterKind = this.environmentPlan?.waterKind;
            if (waterKind && waterKind !== 'none') {
                const waterVariant = await load(`theme_${theme}_${waterKind}.json`);
                if (waterVariant) return waterVariant;
            }
            const targetFile = THEME_MAP_FILES[theme] ?? ('theme_' + theme + '.json');
            const themed = await load(targetFile);
            if (themed) return themed;
        }
        try {
            const res = await fetch(FALLBACK_MAPDATA_URL);
            if (res.ok) {
                console.warn(`[Scene13WarLayer] 无据点/主题地图（site=${siteId ?? '无'} theme=${theme ?? '无'}），地面退回维也纳测试图`);
                return await res.json();
            }
        } catch {}
        return null;
    };

    void getMapData().then(async (rawMapData) => {
        if (gen !== this.assetGen || !rawMapData) {
            this.useGroundGL = false;
            cv.style.display = 'none';
            releaseGround();
            return;
        }
        // 🔴 [2026-10-13 / 2026-10-19] 据点真实图（header.skeleton）通常保留真实水体；
        //    但 DE 标准河流占比仅约 3.5%（海面占比约 23.5%），若内陆据点（海拔 > 10m 或 waterKind === 'river'）
        //    因现代水库蓄水或大漫滩导致水面占比 > 12%，则将其像海一样的宽阔水面重塑为城侧 3.5 格标准自然河道（relocateTemplateWater）。
        // 🔴 [2026-10-23 主人令「把 DE 剧情地图提取一个，在 _siege_preview 里预览」]
        //    header.verbatim＝原样 DE 地图（tools/de-campaign-to-site.mjs 导出的战役关卡）：不校正海向、不搬水，一格不改。
        const verbatim = !!rawMapData?.header?.verbatim;
        const oriented = verbatim ? rawMapData : await this.adaptMapDataSeaOrientation(rawMapData);
        const skelHmin = rawMapData?.header?.skeleton?.hmin ?? (this.environmentPlan?.elevationM ?? 0);
        const isInlandReservoirFlood = !!(rawMapData?.header?.skeleton)
            && (skelHmin > 10 || this.environmentPlan?.waterKind === 'river')
            && calcWaterRatio(oriented) > 0.12;
        if (isInlandReservoirFlood && this.environmentPlan && (!this.environmentPlan.waterKind || this.environmentPlan.waterKind === 'none')) {
            this.environmentPlan.waterKind = 'river';
        }
        const mapData = (verbatim || (rawMapData?.header?.skeleton && !isInlandReservoirFlood))
            ? oriented
            : this.relocateTemplateWater(oriented);
        // 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
        //    地面 6 张贴图改由 **DE 烘焙地形直方图** 决定（见 Scene13DeGround.ts）：
        //    `14 Desert→pal`、`12 Grass2→gr2`、`100 Dry Grass→gr7`、`2 Beach→bch`、`10 Forest→for`、`3 Dirt3→ds3`…
        //    旧做法只看据点建筑风格/气候主题，会让沙漠图铺成黄土、温带图铺成夯土，与 DE 原版观感不符。
        //    雪地/冬季例外：仍按季节贴图（不能把雪原铺成草地）。
        const groundBaseTerrain = this.environmentPlan?.baseTerrain ?? DEFAULT_TERRAIN_TILE;
        const isSnowGround = /^(sno|sn2|snf|snd|snr|ic3|ice)/.test(groundBaseTerrain) || this.sceneSeason === 2;
        const deGroundTiles = isSnowGround
            ? null
            : deriveDeGroundTiles(mapData?.terrain, this.environmentPlan?.groundTiles);
        const groundTiles = deGroundTiles ?? this.environmentPlan?.groundTiles;
        if (deGroundTiles && this.environmentPlan) this.environmentPlan.groundTiles = deGroundTiles;
        try {
            if (this.groundLayerGL) this.groundLayerGL.destroy();
            // 🔴 [2026-10-11] 底面四张素材（草/沙/林/水）按战场所在气候主题取，来源＝一份 environmentPlan.groundTiles（沙漠＝沙地、雪原＝雪林等），不再恒为 gr2 绿草 + bch 沙 + for 林 + 绿河
            const glLayer = await Scene13GroundLayerGL.create(cv, mapData, groundTiles);
            if (gen !== this.assetGen) {
                glLayer.destroy();
                releaseGround();
                return;
            }
            this.groundLayerGL = glLayer;
            setCachedViennaMapData(glLayer.data);
            this.useGroundGL = true;
            // 🔴 [2026-10-11 主人令「这个菱形的周边黑色很丑，可以换成底图吗」]
            // WebGL 画布底层平铺当前气候主题的自然底图，任何缩放与平移下满屏铺满，彻底消除菱形周边黑边
            // 🔴 [2026-10-21 请全部和DE保持一致] 底图与地面层用同一张「DE 地形主导贴图」（derived ground.grass），
            //    避免「地里是 DE 沙地、菱形外圈却还是黄土」的接缝。
            const baseTerrain = groundTiles?.grass ?? this.environmentPlan?.baseTerrain ?? DEFAULT_TERRAIN_TILE;
            cv.style.backgroundImage = `url(/SUCAI_TERRAIN/${baseTerrain}.png)`;
            cv.style.backgroundRepeat = 'repeat';
            cv.style.backgroundPosition = 'center center';
            if (this.entryFadePending) this.applyInitialEntryStyle(cv);
            cv.style.display = 'block';

            // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 删去「保障所有出兵口与初始士兵不落入水体」
            const data = transposeMapData(mapData);
            if (data && data.objects) {
                // 🔴 [2026-10-11 主人「让植被，建筑等固定在地基上」] 给每栋建筑 / 城门 / 塔 / 墙脚下清出一块干燥平地（地基），
                //    并拿掉落在地基上的树木与建筑冲突物。
                const foundations: Array<{ x: number; y: number; r: number }> = [];
                const siegeBuildings = this.decorSprites.filter((s) => s.asset === '' || s.asset.startsWith('BUILDING:') || s.asset.startsWith('BUILDINGANIM:') || s.asset.includes('GATE') || s.asset.includes('TOWER') || s.asset.includes('WALL'));
                for (const sp of this.spawns) if (sp.f === 1 && !sp.commander) foundations.push({ x: sp.x, y: sp.y, r: 4 });
                for (const sp of siegeBuildings) foundations.push({ x: sp.x, y: sp.y, r: 2.5 });
                for (const fd of foundations) glLayer.carveFoundation(fd.x, fd.y, VW, VH, fd.r);
                glLayer.flushFoundation();
                const onFoundation = (x: number, y: number): boolean => {
                    const c = glLayer.screenToCell(x, y, VW, VH);
                    if (!c) return false;
                    return foundations.some((fd) => {
                        const f = glLayer.screenToCell(fd.x, fd.y, VW, VH);
                        return !!f && Math.hypot(c.gx - f.gx, c.gy - f.gy) < fd.r;
                    });
                };

                // 🔴 [2026-10-10 主人「这里光秃秃的，啥元素也没有呀」]
                //    保留未落入建筑地基（!onFoundation）的自然植被与草花碎石，绝不一刀切清空整场生态
                // 🔴 [2026-10-12 任务1] 地图数据自带完整树林时，剔除旧环境方案遗留的混杂树木，树种严格统一由地图数据决定
                const TREE_RE = /^(?!PLANT|UNDERBRUSH|ROCK|FORAGE|FALLEN_LEAVES|FELLED|STUMP|FLOWER|GRASS|WEED|SHRUB|BUSH_GREEN).*(TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE)/i;
                this.decorSprites = this.decorSprites.filter((s) => {
                    const isBuilding = s.asset === '' || s.asset.startsWith('BUILDING:') || s.asset.startsWith('BUILDINGANIM:') || s.asset.startsWith('BATTLEFIELD:') || s.asset.includes('GATE') || s.asset.includes('TOWER') || s.asset.includes('WALL');
                    const isWaterPlant = s.asset === 'WATER_LILY' || s.asset === 'REEDS' || s.asset === 'SEA_ROCKS' || s.asset === 'SHIPWRECK';
                    const isOldTree = TREE_RE.test(s.asset);
                    const c = glLayer.screenToCell(s.x, s.y, VW, VH);
                    const inWater = !!c && glLayer.getWaterDensityAt(Math.round(c.gx), Math.round(c.gy)) > 0.42;
                    return isBuilding || (!onFoundation(s.x, s.y) && !isOldTree && (isWaterPlant ? inWater : !inWater));
                });

                // 🔴 [2026-10-21 主人令「沙子里面长树，这对吗，看看DE是如何设计的」]
                //    DE 的树由「脚下地形」决定，不由建筑风格决定（全表见 Scene13DeTrees.ts）：
                //    烘焙图 site_*.json 里的对象名就是 DE 引擎按地形长出来的树（FPAL 棕榈 / BIRCH 桦 / FDRA 龙血树…），
                //    13 Palm Desert 长棕榈、110 Birch 长桦、14 Desert 一根自动树都没有（沙漠上的棕榈是脚本散树）。
                //    ⇒ 这里**不再**按建筑风格/底图把树种整体替换掉（旧逻辑 regionalTree 把 DE 的棕榈全换成了 PINE，
                //      于是「沙子里长出一片松树」）。每棵树只做三件事，见下方对象循环：
                //      ① 纯沙地（DE 14 Desert / 2 Beach）上出现非沙漠树种 → 剔除；
                //      ② 水格上的树 → 剔除；
                //      ③ 季节换装（只换同族形态：橡→秋橡/雪橡、松→雪松），绝不跨族换树种。
                const defCityRec = this.defenderCityRecord();
                const mapLat = defCityRec?.lat ?? this.centerLat ?? 30;
                const mapLng = defCityRec?.lng ?? this.centerLng ?? 110;
                const rawCalSeason = (window as any).game?.timeSystem?.getSeason?.();
                const calSeason: TreeSeason = (rawCalSeason === 0 || rawCalSeason === 1 || rawCalSeason === 2 || rawCalSeason === 3)
                    ? rawCalSeason
                    : (this.sceneSeason === 2 ? 3 : this.sceneSeason === 1 ? 2 : 1);
                const decorSet = groundDecorFor(baseTerrain);
                const isSnowBase = baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snf'
                    || baseTerrain === 'snd' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice';
                const decorCtx = {
                    lat: mapLat,
                    lng: mapLng,
                    season: this.sceneSeason,
                    winterSnow: isSnowBase,
                    isSiege: this.battleType === 'siege',
                };
                const isBarrenBase = baseTerrain === 'pal1' || baseTerrain === 'qs' || baseTerrain === 'ds5' || baseTerrain === 'gravel_default' || baseTerrain === 'rck';
                const isSparseTreelessBiome = baseTerrain === 'pal' || baseTerrain === 'des' || baseTerrain === 'ds5'
                    || baseTerrain === 'qs' || baseTerrain === 'pal1'
                    || baseTerrain === 'gr7' || baseTerrain === 'gr5' || baseTerrain === 'gravel_default';
                /** 水体 DE 地形 id（与 calcWaterRatio 同一份口径）：水上不长树 */
                const WATER_TERRAINS = new Set([1, 4, 15, 22, 23, 58, 95, 96]);
                const N_TILES = data.width ?? 120;
                /** 对象脚下的 DE 地形 id（transposeMapData 已把对象坐标/terrain 对调成同一套） */
                const terrainUnder = (ob: any): number => {
                    if (!data.terrain) return -1;
                    const cell = ob.cell >= 0 && ob.cell < data.terrain.length
                        ? ob.cell
                        : Math.floor(ob.y) * N_TILES + Math.floor(ob.x);
                    return data.terrain[cell] ?? -1;
                };

                // 🔴 [2026-10-21] 旧「空间聚类纯化 / regionalTree 融合」整段已删：
                //    那段按建筑风格把整团树替换成 regionalTree（SASANIAN→PINE），
                //    DE 烘焙图里的棕榈林/桦林因此全变成松林（菲鲁扎巴德 1224/1278 棵是 PINE）。
                //    现在树种以脚下 DE 地形为准（见 Scene13DeTrees.ts），循环里逐棵保留 DE 树种、只做季节换装。

                // 🔴 [2026-10-13 主人令「动物逻辑和DE不一样，请核对清楚」＋「尽量真实，游戏合理」]
                //    分类 / 速度 / 视野 / 血量 / 攻击一律照 DE 本体（表 ANIMAL_DE，见文件上方），不再手写三张 Set。
                //    旧版自造的三条已废：① 城池/营帐内动物一律删（DE 的牲畜本来就出生在 TC 旁，删了就没牲畜）
                //    ② 猛兽离图心 1400px 删（DE 用 min_distance_to_players，从不看图心；实测白删 31% 猛兽）
                //    ③ 猎物复制 3 只（DE 的群是 RMS 一只只摆好的，复制＝平白多三倍）。

                const inCityZone = (x: number, y: number): boolean => {
                    if (this.insideRing(x, y)) return true;
                    if (this.deCity) {
                        const cx = this.deCityCenter ? this.deCityCenter.x : VW / 2;
                        const cy = this.deCityCenter ? this.deCityCenter.y : VH / 2;
                        const rx = this.deCity.width / 2 + 500;   // 🔴 [2026-10-13 主人令] 野生动物离城墙外 500px（原 180/120）
                        const ry = this.deCity.height / 2 + 500;
                        if (((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1) return true;
                    }
                    return false;
                };
                const inCampZone = (x: number, y: number): boolean => {
                    for (const sp of this.spawns) {
                        if (sp.f === 0 && Math.hypot(x - sp.x, y - sp.y) < 220) return true;
                    }
                    return false;
                };

                for (let obIdx = 0; obIdx < data.objects.length; obIdx++) {
                    const ob = data.objects[obIdx];
                    if (ob.name && ob.name.includes('CLIFF')) continue;
                    const r = resolveNatureSprite(ob.name);
                    if (r && (r[0] === 'NATURE' || r[0] === 'ANIMAL')) {
                        const isAnimal = r[0] === 'ANIMAL';
                        const ox = ob.x - 0.5, oy = ob.y - 0.5;
                        const hash = Math.abs(Math.round(ob.x * 7 + ob.y * 13)) % 100;
                        let sx = (ox - 60) * TAC_TILE_W + VW / 2;
                        let sy = (oy - 60) * TAC_TILE_H + VH / 2;

                        if (isAnimal) {
                            const species = r[1];
                            const de = animalDeOf(species);
                            if (!animalNativeAt(species, mapLat, mapLng, baseTerrain)) continue;   // 非当地或非当前地表气候物种不放

                            // ① 建筑地基上不放；野生动物不进城内 / 攻方营帐，**家畜可以留在城里**
                            //    （DE 每名玩家出生点旁就有 4 只牲畜 + 近旁 4 只，全在自家聚落里）
                            if (onFoundation(sx, sy)) continue;
                            if (de.kind !== 'livestock' && (inCityZone(sx, sy) || inCampZone(sx, sy))) continue;

                            // ② 一个 DE 物件 = 一只动物（DE 的群由 RMS 一只只摆好，不再复制成群）
                            const dir = hash % 8;
                            const isBird = de.kind === 'bird';
                            const startAct: AnimalAction = isBird ? 'fly' : (de.acts.includes('idle') ? 'idle' : de.acts[0]);
                            const animSprite: DecorSprite = {
                                asset: `ANIMAL:${species}/${startAct}_${isBird ? 0 : dir}`,
                                frame: hash,
                                x: sx,
                                y: sy,
                                flip: false,
                                layer: 'world',
                                z: 0,
                                lift: isBird ? 180 : glLayer.elevationLiftAt(sx, sy, VW, VH),
                                densityHash: hash,
                                obstructionContactSec: 0,
                                obstructionTouched: false,
                                obstructionDisabled: true,
                            };
                            this.ensureNatureAsset(animSprite.asset);
                            this.decorSprites.push(animSprite);
                            this.tacticalAnimals.push({
                                sprite: animSprite,
                                species,
                                kind: de.kind,
                                action: startAct,
                                dir: isBird ? 0 : dir,
                                homeX: sx,
                                homeY: sy,
                                x: sx,
                                y: sy,
                                vx: 0,
                                vy: 0,
                                fleeTimer: 0,
                                fleeDX: 0,          // 🔴 [2026-10-13 主人令「只冒着一个方向跑」] 首次受惊时锁定
                                fleeDY: 0,
                                idleTimer: Math.random() * 3,
                                wanderX: sx,
                                wanderY: sy,
                                animPhase: hash,
                                hp: de.hp,
                                atkNext: 0,
                                flyX: sx + Math.cos(hash * 0.1) * 800,
                                flyY: sy + Math.sin(hash * 0.1) * 800,
                                hovering: false,
                            });
                            continue;
                        }

                        // 静态自然植被与矿石资源
                        // 🔴 [2026-10-21] 树种以**脚下 DE 地形**为准（见 Scene13DeTrees.ts）：
                        //    DE 烘焙图里 FPAL 长在 13 Palm Desert、BIRCH 长在 110 Birch…，直接照用，不再按建筑风格替换。
                        let asset = r[1];
                        const isTree = TREE_RE.test(asset);
                        if (isTree) {
                            const tid = terrainUnder(ob);
                            // ① 水格不长树
                            if (WATER_TERRAINS.has(tid)) continue;
                            // ② 纯沙地（DE 14 Desert / 2 Beach）只准长沙漠树种（棕榈/龙血树/金合欢…）；
                            //    松、桦、橡、枫这些温带/寒带树种长到沙地上就是「沙子里面长树」
                            if (bareSandRejectsTree(tid, asset)) continue;
                            // ③ 季节换装：只换同族形态（橡→秋橡/雪橡、桦→秋桦/冬桦、松→雪松），绝不跨族换树种
                            asset = seasonalDeTree(asset, calSeason, isSnowBase);
                            // ④ 高山砾石底图（青藏/帕米尔）不长成片针叶林（旧口径保留）
                            if (baseTerrain === 'gravel_default' && /^(SNOW_PINE|PINE|ASIAN_PINE)$/.test(asset)) continue;
                        } else if (asset.startsWith('FORAGE_')) {
                            // 非湿润热带区域（如雪地、荒漠、温带/寒带），将烘培模板中的热带菠萝/木瓜浆果丛统一转为通用浆果丛
                            if (asset !== 'FORAGE_BUSH') {
                                const isHumidTropical = !isSnowBase
                                    && !isSparseTreelessBiome
                                    && Math.abs(mapLat) <= 23.5
                                    && !/^(des|pal|pal1|qs|ds2|ds5|gr5|gr7|gravel_default|rck)$/i.test(baseTerrain);
                                if (!isHumidTropical) asset = 'FORAGE_BUSH';
                            }
                        } else if (asset === 'MINE_GOLD') {
                            continue;
                        } else if (asset !== 'MINE_STONE') {
                            // 按 DecorFit 将底图不匹配的通用岩石/花草映射为当前底图同色系装饰
                            if (/^ROCK/.test(asset)) {
                                if (decorSet.solid.length === 0) continue;
                                if (!decorSet.solid.includes(asset)) {
                                    asset = decorSet.solid[hash % decorSet.solid.length];
                                }
                            } else if (/^(FLOWER|PLANT|WEED|SHRUB|BUSH_GREEN|UNDERBRUSH|FERNPATCH)/.test(asset)) {
                                if (decorSet.flat.length === 0) continue;
                                if (!decorSet.flat.includes(asset)) {
                                    asset = decorSet.flat[hash % decorSet.flat.length];
                                }
                            } else if (/^GRASS_/.test(asset)) {
                                if (decorSet.scatter.length === 0) continue;
                                if (!decorSet.scatter.includes(asset)) {
                                    asset = decorSet.scatter[hash % decorSet.scatter.length];
                                }
                            }
                            if (!decorFits(asset, decorCtx)) continue;
                        }
                        const jx = isTree ? (((hash * 17) % 23) / 22 - 0.5) * TAC_TILE_W * 0.46 : 0;
                        const jy = isTree ? (((hash * 31) % 29) / 28 - 0.5) * TAC_TILE_H * 0.46 : 0;
                        sx += jx;
                        sy += jy;
                        if (onFoundation(sx, sy)) continue;
                        this.ensureNatureAsset(asset);
                        const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
                        this.decorSprites.push({
                            asset,
                            frame: ob.rot !== undefined ? Math.round(ob.rot) : hash,
                            x: sx,
                            y: sy,
                            flip: (hash % 2 === 0),
                            layer: 'world',
                            z: 0,
                            lift,
                            densityHash: hash,
                            obstruction: undefined,
                            obstructionContactSec: 0,
                            obstructionTouched: false,
                            obstructionDisabled: true,
                        });
                    }
                }

                // 自然水岸生态：沿水岸线点缀芦苇与睡莲（按气候/季节/海陆水体自适应：冬季冰面不长，荒漠与海岸仅生芦苇不生睡莲）
                const isFrozenWater = glLayer.isIce || baseTerrain === 'sn2' || baseTerrain === 'snf' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice';
                const allowWaterLily = !isFrozenWater && !isBarrenBase && this.sceneSeason === 0 && this.environmentPlan?.waterKind !== 'sea' && !/^(ds|drt|sav|sa2|zn)/.test(baseTerrain);
                if (!isFrozenWater) {
                    for (let gy = 2; gy < 118; gy += 2) {
                        for (let gx = 2; gx < 118; gx += 2) {
                            const dens = glLayer.getWaterDensityAt(gx, gy);
                            if (dens >= 0.41 && dens <= 0.48 && ((gx * 31 + gy * 19) % 5 === 0)) {
                                const ox = gx - 0.5, oy = gy - 0.5;
                                const sx = (ox - 60) * TAC_TILE_W + VW / 2;
                                const sy = (oy - 60) * TAC_TILE_H + VH / 2;
                                const isLily = allowWaterLily && dens > 0.44 && ((gx + gy) % 3 === 0);
                                const asset = isLily ? 'WATER_LILY' : 'REEDS';
                                if (!decorFits(asset, decorCtx)) continue;
                                const hash = (gx * 11 + gy * 7) % 100;
                                const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
                                this.ensureNatureAsset(asset);
                                this.decorSprites.push({
                                    asset,
                                    frame: hash,
                                    x: sx,
                                    y: sy,
                                    flip: (gx % 2 === 0),
                                    layer: 'world',
                                    z: 0,
                                    lift,
                                    densityHash: hash,
                                    obstruction: undefined,
                                    obstructionContactSec: 0,
                                    obstructionTouched: false,
                                    obstructionDisabled: true,
                                });
                            }
                        }
                    }
                }
            }
            applyDeCityToGround.call(this);
            spawnBattlefieldRelics.call(this, glLayer, VW, VH);
            // 🔴 [2026-10-21 主人报「拒马立在河里」] 兜底清扫：不管拒马/木栅残骸是哪条支路摆进来的
            //    （营地拒马圈 / 攻城残骸），只要脚下是水（密度 ≥0.18 的湿岸也算）就一律移除。
            //    放在最后一步做，是因为前面 carveFoundation 会改水体势场，就地判断可能漏掉。
            pruneWetBarricades.call(this, glLayer, VW, VH);
            releaseGround();
        } catch (err) {
            console.warn('[Scene13WarLayer] ⚠️ WebGL 地面层初始化失败（已无旧 2D 地面兜底，本场没有地面）:', err);
            this.useGroundGL = false;
            cv.style.display = 'none';
            releaseGround();
        }
    });
}

/**
 * 在战术战场南北两翼安全区（避开城墙、护城河、四门大道、水体、营地出生点与中央主交战走廊）
 * 点缀 DE 古战场军事遗存（SUCAI_BATTLEFIELD）：
 *   · 攻城战：倒毁攻城器械残骸（投石机/石炮/冲车/弩炮）、破损拒马木栅残骸、战地火把
 *   · 野战：古战场骸骨、断车、破损拒马木栅残骸
 */
export function spawnBattlefieldRelics(this: Scene13WarLayer, glLayer: Scene13GroundLayerGL, VW: number, VH: number): void {
    const seedStr = `${this.defenderCityId || 'field'}_${Math.round((this.centerLat ?? 30) * 100)}_${Math.round((this.centerLng ?? 110) * 100)}_${this.battleType}`;
    let rSeed = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
        rSeed = Math.imul(rSeed ^ seedStr.charCodeAt(i), 16777619) >>> 0;
    }
    const rnd = (): number => {
        rSeed = Math.imul(rSeed ^ (rSeed >>> 15), 0x85ebca6b) >>> 0;
        rSeed = Math.imul(rSeed ^ (rSeed >>> 13), 0xc2b2ae35) >>> 0;
        return ((rSeed ^ (rSeed >>> 16)) >>> 0) / 4294967296;
    };

    const { x: cx, y: cy } = this.deCity ? this.deCityCenter : { x: VW * 0.5, y: VH * 0.5 };
    const rx = this.deCity ? this.deCity.width / 2 : 0;
    const ry = this.deCity ? this.deCity.height / 2 : 0;
    const ringLm = this.deCity ? Math.max(0, (rx - 200) / (TAC_TILE_W / 2)) : 0;
    const roadMaxU = ringLm / 2 + 7.5;
    const roadMaxV = 3.2;

    const placedPts: Array<{ x: number; y: number }> = [];
    const isSafeSpot = (sx: number, sy: number): boolean => {
        if (sx < 360 || sx > VW - 360 || sy < 180 || sy > VH - 180) return false;
        // 避开中央部队冲锋与交战主走廊
        if (Math.abs(sy - cy) < 360) return false;
        // 攻城战避开城池、护城河及四门大道
        if (this.deCity) {
            if (((sx - cx) / (rx + 180)) ** 2 + ((sy - cy) / (ry + 110)) ** 2 < 1.0) return false;
            if (ringLm > 0) {
                const u = (sx - cx) / (TAC_TILE_W / 2), v = (sy - cy) / (TAC_TILE_H / 2);
                const di = Math.abs((u + v) / 2 - 0.5), dj = Math.abs((v - u) / 2 - 0.5);
                if ((di <= roadMaxU && dj <= roadMaxV) || (dj <= roadMaxU && di <= roadMaxV)) return false;
            }
        }
        // 🔴 [2026-10-21 主人报「拒马/残骸立在河里」] 水面与湿岸都不放：原来只用 isWaterAt（密度≥0.45，只挡深水），
        //    浅水/湿岸（0.18~0.45）照放，看上去仍在河里 → 改按水体密度 ≥0.18 一刀切。
        const wc = glLayer.screenToCell(sx, sy, VW, VH);
        if (!wc || glLayer.getWaterDensityAt(wc.gx, wc.gy) >= 0.18) return false;
        for (const sp of this.spawns) {
            if (Math.hypot(sx - sp.x, (sy - sp.y) * 1.4) < 340) return false;
        }
        for (const p of placedPts) {
            if (Math.hypot(sx - p.x, (sy - p.y) * 1.4) < 260) return false;
        }
        return true;
    };

    const pushRelic = (asset: string, sx: number, sy: number, flip: boolean): void => {
        placedPts.push({ x: sx, y: sy });
        const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
        this.ensureNatureAsset(asset);
        this.decorSprites.push({
            asset,
            frame: 0,
            x: sx,
            y: sy,
            flip,
            layer: 'world',
            z: 0,
            lift,
            obstruction: undefined,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        });
    };

    const pickSafeFlankSpot = (xMinFrac: number, xMaxFrac: number, preferSouth: boolean): { x: number; y: number } | null => {
        for (let attempt = 0; attempt < 24; attempt++) {
            const south = (attempt % 2 === 0) ? preferSouth : !preferSouth;
            const sx = VW * (xMinFrac + rnd() * (xMaxFrac - xMinFrac));
            const sy = south
                ? VH * (0.70 + rnd() * 0.16)
                : VH * (0.14 + rnd() * 0.16);
            if (isSafeSpot(sx, sy)) return { x: sx, y: sy };
        }
        return null;
    };

    if (this.battleType === 'siege') {
        const siegeWrecks = [
            'BATTLEFIELD:DECAY_TREBUCHET',
            'BATTLEFIELD:DECAY_MANGONEL',
            'BATTLEFIELD:DECAY_ONAGER',
            'BATTLEFIELD:DECAY_BATTERING_RAM',
            'BATTLEFIELD:DECAY_SCORPION',
        ];
        const barricadeWrecks = [
            'BATTLEFIELD:BARRICADE_RUBBLE_A',
            'BATTLEFIELD:BARRICADE_RUBBLE_B',
            'BATTLEFIELD:BARRICADE_RUBBLE_C',
            'BATTLEFIELD:BARRICADE_RUBBLE_D',
            'BATTLEFIELD:STAKE_BARRICADE',
        ];
        const torches = ['BATTLEFIELD:TORCH_A', 'BATTLEFIELD:TORCH_B'];

        const wreckCount = 2;
        for (let i = 0; i < wreckCount; i++) {
            const pt = pickSafeFlankSpot(0.24, 0.72, i % 2 === 0);
            if (!pt) continue;
            const asset = siegeWrecks[Math.floor(rnd() * siegeWrecks.length)];
            pushRelic(asset, pt.x, pt.y, rnd() < 0.5);
        }
        const rubbleCount = 2 + Math.floor(rnd() * 2);
        for (let i = 0; i < rubbleCount; i++) {
            const pt = pickSafeFlankSpot(0.20, 0.78, i % 2 === 1);
            if (!pt) continue;
            const asset = barricadeWrecks[Math.floor(rnd() * barricadeWrecks.length)];
            pushRelic(asset, pt.x, pt.y, rnd() < 0.5);
        }
        const torchCount = 2;
        for (let i = 0; i < torchCount; i++) {
            const pt = pickSafeFlankSpot(0.26, 0.74, i % 2 === 0);
            if (!pt) continue;
            const asset = torches[Math.floor(rnd() * torches.length)];
            pushRelic(asset, pt.x, pt.y, rnd() < 0.5);
        }
    } else {
        const fieldRelics = [
            'BATTLEFIELD:SKELETON_BATTLEFIELD',
            'BATTLEFIELD:SKELETON_SOLDIER',
            'BATTLEFIELD:IMPALED_CORPSE',
            'BATTLEFIELD:BARRICADE_RUBBLE_A',
            'BATTLEFIELD:BARRICADE_RUBBLE_B',
            'BATTLEFIELD:BARRICADE_RUBBLE_C',
            'BATTLEFIELD:CART_BROKEN',
        ];
        const relicCount = 3 + Math.floor(rnd() * 2);
        for (let i = 0; i < relicCount; i++) {
            const pt = pickSafeFlankSpot(0.22, 0.78, i % 2 === 0);
            if (!pt) continue;
            const asset = fieldRelics[Math.floor(rnd() * fieldRelics.length)];
            pushRelic(asset, pt.x, pt.y, rnd() < 0.5);
        }
    }
}

/**
 * 🔴 [2026-10-21 主人报「拒马立在河里」] 兜底清扫：把落在水里 / 湿岸上的拒马、木栅残骸从装饰列表移除。
 * 理由：这些道具来自多条支路（营地拒马圈、攻城残骸、险要城内道具），就地判断容易被
 * `carveFoundation` 的水体势场改写绕过；统一在场地生成完之后按**最终**水体密度清一遍。
 * 阈值 0.18 = 湿岸也算水（0.18~0.45 是浅水泥岸，拒马插在那里同样违和）。
 */
export function pruneWetBarricades(this: Scene13WarLayer, glLayer: Scene13GroundLayerGL, VW: number, VH: number): void {
    const before = this.decorSprites.length;
    this.decorSprites = this.decorSprites.filter((sp) => {
        if (!/STAKE_BARRICADE|BARRICADE_RUBBLE/.test(String(sp.asset))) return true;
        const c = glLayer.screenToCell(sp.x, sp.y, VW, VH);
        if (!c) return false;
        const gx = Math.round(c.gx), gy = Math.round(c.gy);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (glLayer.getWaterDensityAt(gx + dx, gy + dy) >= 0.18) return false;
            }
        }
        return true;
    });
    const removed = before - this.decorSprites.length;
    if (removed > 0) console.info(`[Scene13] 拒马/木栅残骸清了 ${removed} 件（在水里或湿岸上）`);
}
