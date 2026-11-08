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
import { pickTree, type TreeSeason } from './TreeAssignment';
import { bareSandRejectsTree, deTerrainIsForest, deTerrainRollTreeAsset, seasonalDeTree, snowToPlainTree } from './Scene13DeTrees';
import { deriveDeGroundTiles } from './Scene13DeGround';
import { animalNativeAt, animalDeOf, syncTradeCartAnimals } from './Scene13Animals';
import { animalHerdSize } from '../../world/environment/animalCatalog';
import { tacticalTreeKeepRatio } from '../../world/environment/forestModel';
import { localSeasonAtLat } from '../../world/environment/seasonalGround';
import { plantRegionalizeTree } from '../../world/environment/plantCatalog';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { canSpawnDeepSeaWhaleOrNessie } from '../../map/MarineLifeLayer';
import { applyDeCityToGround, decloneBattlefieldRocks, getClimateMountainPool } from './Scene13CityLayout';
import { groundDecorFor, decorFits } from './DecorFit';
import { queryWinterSnow } from './WorldBaseMap';
import { setCachedViennaMapData } from './Scene13SpriteCache';
import { loadDeCampaignMapForGround, populateDeCampaignObjects } from './Scene13DeCampaignLoader';
import { clampMapWaterRatio, enrichDeBattlefieldMidfield } from './Scene13MapWaterAdapter';

/** 未改造的据点／主题地图数据与在途请求。后续转置、海向校正和城基改造都会另建数组，不回写这里。 */
const GROUND_MAP_DATA_CACHE = new Map<string, Promise<any | null>>();
const GROUND_MAP_DATA_CACHE_MAX = 24;

/**
 * 🔴 [2026-10-31 主人令「战术模式中的鸟不成群，请和战略地图动物成群保持一致」]
 * 战术飞鸟群队形间距（px）：战略动物层用 0.04°（zoom 9 一屏约 15px），战术战场同一视觉尺度取 14px。
 */
const BIRD_FLOCK_SPACING_PX = 14;
/** 同种飞鸟相距这么近（px，约 5 格）就算同一簇，并进同一群（对应动物总表「同种 4 格内算一群」的 DE 实测口径） */
const BIRD_FLOCK_MERGE_PX = 320;

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
        if (this.deCampaignMapId) {
            try {
                return await loadDeCampaignMapForGround(this.deCampaignMapId);
            } catch (err) {
                console.warn('[Scene13WarLayer] DE 战役地图加载失败:', err);
            }
        }
        const load = async (file: string) => {
            const hit = GROUND_MAP_DATA_CACHE.get(file);
            if (hit) {
                GROUND_MAP_DATA_CACHE.delete(file);
                GROUND_MAP_DATA_CACHE.set(file, hit);   // LRU：最近使用的据点图保留
                return hit;
            }
            const job = (async () => {
                try {
                    const res = await fetch(MAPDATA_DIR + file);
                    if (res.ok) return await res.json();
                } catch {}
                return null;
            })();
            GROUND_MAP_DATA_CACHE.set(file, job);
            const data = await job;
            if (!data) GROUND_MAP_DATA_CACHE.delete(file);   // 缺图／失败不缓存，下一场仍可重试
            while (GROUND_MAP_DATA_CACHE.size > GROUND_MAP_DATA_CACHE_MAX) {
                const oldest = GROUND_MAP_DATA_CACHE.keys().next().value;
                if (oldest === undefined) break;
                GROUND_MAP_DATA_CACHE.delete(oldest);
            }
            return data;
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
                // 🔴 修复大非川（龙羊峡水库 100% 水）、萨尔克尔（齐姆良斯克水库 100% 水）等极端水体（水面 > 80% 几乎无陆地），
                //    此类淹没图退回当前气候带的 _river / _sea 主题模板；一般港口/水系（≤ 80%）则保留并在后续由 clampMapWaterRatio 收拢至 ≤ 40%
                if (wRatio <= 0.80) {
                    return site;
                }
                console.info(`[Scene13WarLayer] 🏞 据点图 site_${siteId}.json 水面占比过高 (${(wRatio * 100).toFixed(1)}%，缺乏陆地)，切换为当地气候水体模板`);
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
        const oriented = rawMapData?.isDeCampaign ? rawMapData : await this.adaptMapDataSeaOrientation(rawMapData);
        const skelHmin = rawMapData?.header?.skeleton?.hmin ?? (this.environmentPlan?.elevationM ?? 0);
        const isInlandReservoirFlood = !!(rawMapData?.header?.skeleton)
            && (skelHmin > 10 || this.environmentPlan?.waterKind === 'river')
            && calcWaterRatio(oriented) > 0.12;
        if (isInlandReservoirFlood && this.environmentPlan && (!this.environmentPlan.waterKind || this.environmentPlan.waterKind === 'none')) {
            this.environmentPlan.waterKind = 'river';
        }
        const mapDataRaw = (rawMapData?.isDeCampaign || (rawMapData?.header?.skeleton && !isInlandReservoirFlood))
            ? oriented
            : this.relocateTemplateWater(oriented);
        // 🔴 [2026-10-27 主人令「战术模式中的地图……有的因为在港口附近，导致水域太多，我觉得一张地图水域不应该超过40%」]
        const mapDataClamped = clampMapWaterRatio(mapDataRaw, 0.40);
        const groundBaseTerrain = this.environmentPlan?.baseTerrain ?? DEFAULT_TERRAIN_TILE;
        const preCityRec = this.defenderCityRecord();
        const preLat = preCityRec?.lat ?? this.centerLat ?? 30;
        const preLng = preCityRec?.lng ?? this.centerLng ?? 110;
        const preYear = (window as any).game?.timeSystem?.getYear?.();
        const preTreeKeep = tacticalTreeKeepRatio(
            preLat, preLng,
            typeof preYear === 'number' && Number.isFinite(preYear) ? preYear : 0,
            LandSeaSystem.getSampler().getElevationSync(preLat, preLng),
        );
        const mapData = enrichDeBattlefieldMidfield(
            mapDataClamped,
            this.deCity?.width,
            String(this.defenderCityId ?? this.environmentPlan?.seed ?? 'field'),
            groundBaseTerrain,
            this.environmentPlan?.deMapTheme,
            preTreeKeep,
        );
        // 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
        //    地面 6 张贴图改由 **DE 烘焙地形直方图** 决定（见 Scene13DeGround.ts）：
        //    `14 Desert→pal`、`12 Grass2→gr2`、`100 Dry Grass→gr7`、`2 Beach→bch`、`10 Forest→for`、`3 Dirt3→ds3`…
        //    旧做法只看据点建筑风格/气候主题，会让沙漠图铺成黄土、温带图铺成夯土，与 DE 原版观感不符。
        //    雪地例外：地面本身为积雪/冰原贴图时保留季节雪地贴图（不能把雪原铺成草地）。
        const isSnowGround = /^(sno|sn2|snf|snd|snr|ic3|ice)/.test(groundBaseTerrain);
        const hasPlannedGround = !!(this.environmentPlan?.groundTiles?.grass) && !rawMapData?.isDeCampaign;
        const deGroundTiles = (isSnowGround || hasPlannedGround)
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
            glLayer.setSeasonalGroundProfile(preLat, preLng, isSnowGround);
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
            if (this.entryFadePending) {
                this.applyInitialEntryStyle(cv);
            } else {
                cv.style.transition = '';
                cv.style.opacity = '1';
                cv.style.transform = 'scale(1)';
                cv.style.filter = 'brightness(1) blur(0px)';
            }
            cv.style.display = 'block';

            // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 删去「保障所有出兵口与初始士兵不落入水体」
            const data = transposeMapData(mapData);
            if (data && data.isDeCampaign) {
                try {
                    populateDeCampaignObjects(this, data.rawDeObjects || [], data.width, glLayer, VW, VH);
                } catch (deObjErr) {
                    console.error('[Scene13WarLayer] DE 战役物件落盘异常:', deObjErr);
                }
                releaseGround();
                return;
            }
            // 🔴 [2026-10-31 主人问「高昌的冬天，植被上有雪吗？」]
            //    挂雪树不能只看「底图是不是雪地」，还要看当地冬季**是不是真积雪**：
            //    WorldClim 冬季标志 1/2/3＝积雪/深雪/雪林，**4＝零星残雪（不覆连片白雪）**、0＝不积雪。
            //    高昌／吐鲁番—哈密盆地全年降水约十几毫米，标志是 4 —— 盆地里不积雪，植被上不该挂雪；
            //    只有天山坡地、雪线以上的真积雪区才出 SNOW_*。数据查不到（null）时按底图判，维持原状。
            const snowRec = this.defenderCityRecord();
            const winterSnowFlag = queryWinterSnow(snowRec?.lat ?? this.centerLat ?? 30, snowRec?.lng ?? this.centerLng ?? 110);
            const winterSnowArea = winterSnowFlag === null ? true : (winterSnowFlag > 0 && winterSnowFlag !== 4);
            let runMicroDecor: (() => void) | null = null;
            if (data && data.objects) {
                // 🔴 [2026-10-11 主人「让植被，建筑等固定在地基上」] 给每栋建筑 / 城门 / 塔 / 墙脚下清出一块干燥平地（地基），
                //    并拿掉落在地基上的树木与建筑冲突物。
                const foundations: Array<{ x: number; y: number; r: number }> = [];
                const siegeBuildings = this.decorSprites.filter((s) => s.asset === '' || s.asset.startsWith('BUILDING:') || s.asset.startsWith('BUILDINGANIM:') || s.asset.includes('GATE') || s.asset.includes('TOWER') || s.asset.includes('WALL'));
                for (const sp of this.spawns) if (sp.f === 1 && !sp.commander) foundations.push({ x: sp.x, y: sp.y, r: 4 });
                for (const sp of siegeBuildings) foundations.push({ x: sp.x, y: sp.y, r: 2.5 });
                for (const fd of foundations) glLayer.carveFoundation(fd.x, fd.y, VW, VH, fd.r);
                if (!this.deCity) {
                    const fieldProtect = [...foundations];
                    for (const sp of this.spawns) {
                        if (!sp.commander) fieldProtect.push({ x: sp.x, y: sp.y, r: 2.8 });
                    }
                    const seedStr = `${this.environmentPlan?.seed || 'field'}_${Math.round((this.centerLat ?? 30) * 100)}_${Math.round((this.centerLng ?? 110) * 100)}`;
                    const elevM = this.environmentPlan?.elevationM ?? 0;
                    const slopeDeg = this.environmentPlan?.slopeDeg ?? 0;
                    const elevBand = this.environmentPlan?.elevationBand;
                    const isHighland = elevBand === 'mountain' || elevBand === 'alpine' || elevBand === 'high_alpine' || elevBand === 'snow' || elevM >= 450 || slopeDeg >= 2.0;
                    glLayer.generateFieldBattleTerrain(VW, VH, seedStr, fieldProtect, isHighland);
                }
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
                const TREE_RE = /^(?!PLANT|UNDERBRUSH|ROCK|FORAGE|FALLEN_LEAVES|FELLED|STUMP|FLOWER|GRASS|WEED|SHRUB|BUSH_GREEN).*(TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE|SPRUCE)/i;
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
                const rawSeason4: TreeSeason = (rawCalSeason === 0 || rawCalSeason === 1 || rawCalSeason === 2 || rawCalSeason === 3)
                    ? rawCalSeason
                    : (this.sceneSeason === 2 ? 3 : this.sceneSeason === 1 ? 2 : 1);
                const calSeason: TreeSeason = localSeasonAtLat(rawSeason4, mapLat);
                // 🔴 2026-10-31 主人定森林口径 C：DE 模板的树按战场所在地「本该长的林 × 史实开垦」疏伐，
                //    与战略植被层同查 forestModel（城边农耕区约留四成，深山老林全留；天然无林处不动）。
                const gameYear = (window as any).game?.timeSystem?.getYear?.();
                const treeKeep = tacticalTreeKeepRatio(
                    mapLat, mapLng,
                    typeof gameYear === 'number' && Number.isFinite(gameYear) ? gameYear : 0,
                    LandSeaSystem.getSampler().getElevationSync(mapLat, mapLng),
                );
                const decorSet = groundDecorFor(baseTerrain);
                // 冬雪判定已在上面（外层）算好：winterSnowArea＝当地冬季真积雪（1/2/3），4／0 一律按无雪
                const isSnowBase = winterSnowArea && (baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snf'
                    || baseTerrain === 'snd' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice');
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

                /** 🔴 [2026-10-31 主人令「战术模式中的鸟不成群」] 待成群的飞鸟：先收集，出循环后按「同种 + 邻近」并群再下发 */
                const pendingBirds: Array<{ species: string; sx: number; sy: number; hash: number }> = [];
                const placedTreePts: Array<{ x: number; y: number }> = [];
                const minTreeGap = 136 + Math.round((1 - Math.min(1, treeKeep)) * 42);

                for (let obIdx = 0; obIdx < data.objects.length; obIdx++) {
                    const ob = data.objects[obIdx];
                    if (ob.name && ob.name.includes('CLIFF')) continue;
                    const r = resolveNatureSprite(ob.name);
                    // 🔴 [2026-10-30] 水生资源（DE FISHS 近岸鱼群 / TURTLES 海龟群）：只放天然水面，冰面不放；海龟只在暖海（|纬度|<42°）
                    if (r && r[0] === 'RESOURCE') {
                        const rsx = (ob.x - 0.5 - 60) * TAC_TILE_W + VW / 2;
                        const rsy = (ob.y - 0.5 - 60) * TAC_TILE_H + VH / 2;
                        if (glLayer.isIce || isSnowBase || isSnowGround || !glLayer.isWaterAt(rsx, rsy, VW, VH)) continue;
                        if (r[1] === 'BOX_TURTLES' && Math.abs(mapLat) >= 42) continue;
                        const rh = Math.abs(Math.round(ob.x * 7 + ob.y * 13)) % 100;
                        this.ensureNatureAsset('RESOURCE:' + r[1]);
                        this.decorSprites.push({
                            asset: 'RESOURCE:' + r[1],
                            frame: rh,
                            x: rsx,
                            y: rsy,
                            flip: rh % 2 === 0,
                            layer: 'world',
                            z: 0,
                            lift: 0,
                            densityHash: rh,
                            obstruction: undefined,
                            obstructionContactSec: 0,
                            obstructionTouched: false,
                            obstructionDisabled: true,
                        });
                        continue;
                    }
                    if (r && (r[0] === 'NATURE' || r[0] === 'ANIMAL')) {
                        const isAnimal = r[0] === 'ANIMAL';
                        const ox = ob.x - 0.5, oy = ob.y - 0.5;
                        const hash = Math.abs(Math.round(ob.x * 7 + ob.y * 13)) % 100;
                        let sx = (ox - 60) * TAC_TILE_W + VW / 2;
                        let sy = (oy - 60) * TAC_TILE_H + VH / 2;

                        if (isAnimal) {
                            const species = r[1];
                            const de = animalDeOf(species);
                            if (!animalNativeAt(species, mapLat, mapLng, baseTerrain, calSeason === 3)) continue;   // 非当地或非当前地表气候物种不放（冬季放冬毛物种）

                            // ① 建筑地基上不放；野生动物不进城内 / 攻方营帐，**家畜可以留在城里**
                            //    （DE 每名玩家出生点旁就有 4 只牲畜 + 近旁 4 只，全在自家聚落里）
                            if (onFoundation(sx, sy)) continue;
                            if (de.kind !== 'livestock' && (inCityZone(sx, sy) || inCampZone(sx, sy))) continue;

                            // ② 一个 DE 物件 = 一只动物（DE 的群由 RMS 一只只摆好，不再复制成群）
                            const dir = hash % 8;
                            const isBird = de.kind === 'bird';
                            const startAct: AnimalAction = isBird ? 'fly' : (de.acts.includes('idle') ? 'idle' : de.acts[0]);

                            // 🔴 [2026-10-31 主人令「战术模式中的鸟不成群，请和战略地图动物成群保持一致」]
                            //   飞鸟不在这里逐只单飞，先收集起来，出循环后按「同种 + 邻近」并成群再下发（见循环后的成群下发）。
                            if (isBird) {
                                pendingBirds.push({ species, sx, sy, hash });
                                continue;
                            }

                            const animSprite: DecorSprite = {
                                asset: `ANIMAL:${species}/${startAct}_${dir}`,
                                frame: hash,
                                x: sx,
                                y: sy,
                                flip: false,
                                layer: 'world',
                                z: 0,
                                lift: glLayer.elevationLiftAt(sx, sy, VW, VH),
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
                                dir,
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
                                flyX: sx,
                                flyY: sy,
                                hovering: false,
                            });
                            continue;
                        }

                        // 静态自然植被与矿石资源
                        // 🔴 [2026-10-21 / 2026-10-27] 树种与分布完全以 **DE 烘焙图（Arabia.rms + dat terrain_units）** 为准：
                        //    - 森林格（deTerrainIsForest(tid)）：直接按脚下 DE 森林地形 id 的 dat 千分比取树种
                        //      （还原 BASE_FOREST + BASE_FOREST_VARIATION_A/B 多林种并存，及 88 地中海柏/橄榄/意松 1:4:5 混交）；
                        //    - 散树格（非森林地形上的 STRAGGLER_SPAWN）：保留 DE 脚本生成的散树单位；
                        //    - DE 1350 芦苇（内部代号同为 FBAM，长在 2 沙滩 / 4 浅滩 / 90~92 芦苇滩）：归位为 REEDS，绝不当成竹子。
                        const tid = terrainUnder(ob);
                        let asset = r[1];
                        if (ob.name === 'FBAM' && (tid === 2 || tid === 4 || tid === 90 || tid === 91 || tid === 92 || WATER_TERRAINS.has(tid))) {
                            asset = 'REEDS';
                        }
                        const isTree = TREE_RE.test(asset);
                        if (isTree) {
                            // ⓪ 疏化战术树林密度，避免林团每格一棵树（96×48 格塞 180px 树冠）叠成密不透风的树墙遮挡军队交战：
                            //    · 出生营地周边（260px）与野战中央主交锋区（380px）不留树，保证主战场视野开阔；
                            //    · 森林格按 treeKeep 疏伐，并统一施加树间最小等轴间距（minTreeGap），使林间留出透气空隙、能清楚看到林中作战部队。
                            if (!this.deCity && Math.hypot(sx - VW / 2, (sy - VH / 2) * 1.45) < 380) {
                                glLayer.clearForestAt(sx, sy, VW, VH, 1.8);
                                continue;
                            }
                            if (this.spawns.some((sp) => Math.hypot(sx - sp.x, (sy - sp.y) * 1.45) < 260)) {
                                glLayer.clearForestAt(sx, sy, VW, VH, 1.8);
                                continue;
                            }
                            const treeHash01 = (Math.abs(Math.round(ob.x * 31 + ob.y * 57)) % 1000) / 1000;
                            const keepProb = deTerrainIsForest(tid)
                                ? (0.45 * Math.max(0.55, treeKeep))
                                : Math.max(0.55, treeKeep);
                            if (!ob.riparian && treeHash01 >= keepProb) continue;
                            // ① 水格不长树（含 DE 水地形与水密度场 > 0.38 的水面）
                            if (WATER_TERRAINS.has(tid) || glLayer.isWaterAt(sx, sy, VW, VH)) continue;
                            // ② 森林格直接由脚下 DE 森林地形 id 按 dat 密度表决定树种（避免旧烘焙 BFS 跨地形吞并变体林）
                            if (deTerrainIsForest(tid)) {
                                const roll = Math.abs(Math.round(ob.x * 73 + ob.y * 151)) % 1000;
                                asset = deTerrainRollTreeAsset(tid, roll) ?? asset;
                            }
                            // ②-b 植物总表：不合本区的树（阿斯旺的桦、开普敦的意大利松…）换成本区主树种，与战略图同一组树种
                            asset = plantRegionalizeTree(mapLat, mapLng, asset, (Math.abs(Math.round(ob.x * 89 + ob.y * 127)) % 1000) / 1000);
                            // ③ 纯沙地（DE 14 Desert / 2 Beach）只准长沙漠树种（棕榈/龙血树/金合欢…）；
                            //    松、桦、橡、枫这些温带/寒带树种长到沙地上就是「沙子里面长树」
                            if (bareSandRejectsTree(tid, asset)) continue;
                            // ④ 季节换装：只换同族形态（橡→秋橡/雪橡、桦→秋桦/冬桦、松→雪松），绝不跨族换树种
                            asset = seasonalDeTree(asset, calSeason, isSnowBase);
                            // ⑤ 高山砾石底图（青藏/帕米尔）不长成片针叶林（旧口径保留）
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
                        if (isTree) {
                            const jx = (((hash * 17) % 23) / 22 - 0.5) * TAC_TILE_W * 0.42;
                            const jy = (((hash * 31) % 29) / 28 - 0.5) * TAC_TILE_H * 0.42;
                            const candX = sx + jx;
                            const candY = sy + jy;
                            const candGx = Math.floor((candX - VW / 2) / TAC_TILE_W + 60.5);
                            const candGy = Math.floor((candY - VH / 2) / TAC_TILE_H + 60.5);
                            const candTid = (data.terrain && candGx >= 0 && candGx < N_TILES && candGy >= 0 && candGy < N_TILES)
                                ? (data.terrain[candGy * N_TILES + candGx] ?? tid)
                                : tid;
                            if (!WATER_TERRAINS.has(candTid) && !bareSandRejectsTree(candTid, asset) && !glLayer.isWaterAt(candX, candY, VW, VH)) {
                                sx = candX;
                                sy = candY;
                            }
                            if (placedTreePts.some((p) => Math.hypot(sx - p.x, (sy - p.y) * 1.45) < minTreeGap)) continue;
                            placedTreePts.push({ x: sx, y: sy });
                        }
                        if (onFoundation(sx, sy)) continue;
                        this.ensureNatureAsset(asset);
                        const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
                        // 解耦岩石/草木的 frame 与 flip 空间哈希（修复原 hash % 6 与 hash % 2 奇偶同相导致特定石形永远固定单侧朝向，以及烘焙 ob.rot=0 锁死第 0 帧的问题）
                        const isNaturalDecor = /^(ROCK|MINE_STONE|FORAGE|BUSH|SHRUB|FLOWER|GRASS|WEED|PLANT|UNDERBRUSH|FERNPATCH|CACTUS|HEATHER|REEDS|WATER_LILY)/.test(asset);
                        const frameHash = Math.abs(Math.round(ob.x * 19 + ob.y * 29 + 7));
                        const flipHash = Math.abs(Math.round(ob.x * 37 + ob.y * 53 + 11));
                        const spr: DecorSprite = {
                            asset,
                            frame: (!isNaturalDecor && ob.rot !== undefined) ? Math.round(ob.rot) : frameHash,
                            x: sx,
                            y: sy,
                            flip: (flipHash % 2 === 0),
                            layer: 'world',
                            z: 0,
                            lift,
                            densityHash: hash,
                            obstruction: undefined,
                            obstructionContactSec: 0,
                            obstructionTouched: false,
                            obstructionDisabled: true,
                        };
                        if (ob.riparian) (spr as any).riparian = true;
                        this.decorSprites.push(spr);
                    }
                }

                // ── 飞鸟成群下发（与战略野生层 AnimalAmbientLayer 同一套群形）──────────────
                // 🔴 [2026-10-31 主人令「战术模式中的鸟不成群，请和战略地图动物成群保持一致」]
                //   ① 按物种归堆：DE 原图本来就是把同种鸟一只只摆在一起当一群（同种 4 格内算一群），
                //      这里按动物总表的 herd 上限分群 —— **不额外加只数**，DE 摆了几只就几只；
                //   ② 只有该物种在图上比 herd 下限还少（例如整张图只有 1 只鹤）才按表补够下限，让它们真的成群；
                //   ③ 群形与战略图一致：头鸟带队，群员在头鸟身后「人」字左右交替张开，目标同向平移、振翅/滑翔同步。
                {
                    const bySpecies = new Map<string, Array<{ species: string; sx: number; sy: number; hash: number }>>();
                    for (const b of pendingBirds) {
                        const arr = bySpecies.get(b.species);
                        if (arr) arr.push(b); else bySpecies.set(b.species, [b]);
                    }
                    for (const [speciesKey, birds] of bySpecies) {
                        const deBird = animalDeOf(speciesKey);
                        if (!deBird.acts.includes('fly')) continue;
                        const herdMax = animalHerdSize(speciesKey, 1);   // 一群上限（表里没写 herd = 1，鹰隼等独行）
                        const herdMin = animalHerdSize(speciesKey, 0);   // 一群下限
                        const taken = new Set<number>();
                        for (let bi = 0; bi < birds.length; bi++) {
                            if (taken.has(bi)) continue;
                            taken.add(bi);
                            const head = birds[bi];
                            const members: Array<{ species: string; sx: number; sy: number; hash: number }> = [head];
                            // 第一遍先收挨在一起的同种鸟，第二遍再按顺序补满这一群
                            for (let pass = 0; pass < 2 && members.length < herdMax; pass++) {
                                for (let bj = bi + 1; bj < birds.length && members.length < herdMax; bj++) {
                                    if (taken.has(bj)) continue;
                                    if (pass === 0 && Math.hypot(birds[bj].sx - head.sx, birds[bj].sy - head.sy) > BIRD_FLOCK_MERGE_PX) continue;
                                    taken.add(bj);
                                    members.push(birds[bj]);
                                }
                            }
                            // DE 摆的只数够 herd 下限就照原数成群；不够才按表补几只一起飞
                            const total = members.length < herdMin
                                ? Math.min(8, herdMin + Math.floor(Math.random() * (herdMax - herdMin + 1)))
                                : members.length;
                            const flockId = ++this.birdFlockSeq;
                            const headAng = head.hash * 0.1;          // 头鸟起飞方向（与原 flyX/flyY 的取角一致）
                            const headCOS = Math.cos(headAng), headSIN = Math.sin(headAng);
                            for (let k = 0; k < total; k++) {
                                // 「人」字队形：第 k 只（k = 0 是头鸟）排在第 row 排，左右交替张开
                                const row = Math.ceil(k / 2);
                                const side = k % 2 === 1 ? 1 : -1;
                                const back = row * BIRD_FLOCK_SPACING_PX;
                                const across = k === 0 ? 0 : side * row * BIRD_FLOCK_SPACING_PX * 0.8;
                                const offX = -back * headCOS - across * headSIN;
                                const offY = -back * headSIN + across * headCOS;
                                const ax = head.sx + offX, ay = head.sy + offY;
                                const birdSprite: DecorSprite = {
                                    asset: `ANIMAL:${speciesKey}/fly_0`,
                                    frame: head.hash,
                                    x: ax,
                                    y: ay,
                                    flip: false,
                                    layer: 'world',
                                    z: 0,
                                    lift: 180,
                                    densityHash: head.hash,
                                    obstructionContactSec: 0,
                                    obstructionTouched: false,
                                    obstructionDisabled: true,
                                };
                                this.ensureNatureAsset(birdSprite.asset);
                                this.decorSprites.push(birdSprite);
                                this.tacticalAnimals.push({
                                    sprite: birdSprite,
                                    species: speciesKey,
                                    kind: deBird.kind,
                                    action: 'fly',
                                    dir: 0,
                                    homeX: head.sx,
                                    homeY: head.sy,
                                    x: ax,
                                    y: ay,
                                    vx: 0,
                                    vy: 0,
                                    fleeTimer: 0,
                                    fleeDX: 0,
                                    fleeDY: 0,
                                    idleTimer: Math.random() * 3,
                                    wanderX: ax,
                                    wanderY: ay,
                                    animPhase: head.hash,
                                    hp: deBird.hp,
                                    atkNext: 0,
                                    flyX: head.sx + headCOS * 800 + offX,
                                    flyY: head.sy + headSIN * 800 + offY,
                                    hovering: false,
                                    flockId,
                                    flockDX: offX,
                                    flockDY: offY,
                                });
                            }
                        }
                    }
                }

                runMicroDecor = () => populateBattlefieldMicroDecor.call(this, glLayer, VW, VH, baseTerrain, decorSet, decorCtx, onFoundation);
                // 🔴 [2026-10-30] 浅海海带（DE n_plant_kelp_seaweeds）：只在海边图的浅海带（水体密度 0.5~0.72）稀疏点缀，冰海不长
                if (this.environmentPlan?.waterKind === 'sea' && !glLayer.isIce && !isSnowBase) {
                    this.ensureNatureAsset('KELP_SEAWEEDS');
                    for (let gy = 5; gy < 115; gy += 3) {
                        for (let gx = 5; gx < 115; gx += 3) {
                            const dens = glLayer.getWaterDensityAt(gx, gy);
                            if (dens < 0.5 || dens > 0.72 || ((gx * 17 + gy * 29) % 11) !== 0) continue;
                            const kx = (gx - 0.5 - 60) * TAC_TILE_W + VW / 2;
                            const ky = (gy - 0.5 - 60) * TAC_TILE_H + VH / 2;
                            const kh = (gx * 13 + gy * 7) % 100;
                            this.decorSprites.push({
                                asset: 'KELP_SEAWEEDS',
                                frame: kh,
                                x: kx,
                                y: ky,
                                flip: kh % 2 === 0,
                                layer: 'world',
                                z: -1,
                                lift: 0,
                                densityHash: kh,
                                obstruction: undefined,
                                obstructionContactSec: 0,
                                obstructionTouched: false,
                                obstructionDisabled: true,
                            });
                        }
                    }
                }

                // 自然水岸生态：沿浅滩边缘稀疏点缀芦苇与睡莲（按气候/季节/海陆水体自适应：冬季冰面不长，荒漠与海岸仅生芦苇不生睡莲）
                const isFrozenWater = glLayer.isIce || baseTerrain === 'sn2' || baseTerrain === 'snf' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice';
                const allowWaterLily = !isFrozenWater && !isBarrenBase && this.sceneSeason === 0 && this.environmentPlan?.waterKind !== 'sea' && !/^(ds|drt|sav|sa2|zn)/.test(baseTerrain);
                if (!isFrozenWater) {
                    for (let gy = 4; gy < 116; gy += 4) {
                        for (let gx = 4; gx < 116; gx += 4) {
                            const dens = glLayer.getWaterDensityAt(gx, gy);
                            if (dens >= 0.42 && dens <= 0.48 && ((gx * 31 + gy * 19) % 9 === 0)) {
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
            runMicroDecor?.();
            decloneBattlefieldRocks.call(this);
            spawnTacticalNessie.call(this, glLayer, VW, VH);
            if (!this.deCity) {
                for (const sp of this.decorSprites) {
                    if (!sp.asset.startsWith('BUILDING') && sp.asset !== '' && !sp.asset.startsWith('ANIMAL:')) {
                        sp.lift = glLayer.elevationLiftAt(sp.x, sp.y, VW, VH);
                    }
                }
            }
            spawnBattlefieldRelics.call(this, glLayer, VW, VH);
            // 🔴 [2026-10-31 主人问「高昌的冬天，植被上有雪吗？」] 非真积雪区兜底：高昌这类极旱区（冬季标志 4＝零星残雪）
            //    场景里不许出现任何挂雪树 —— 不管这棵树是 DE 烘焙物件、气候主题主树还是城郊庭院树走哪条支路带进来的，
            //    收尾时统一把 SNOW_* 剥回同族无雪树（真积雪区 1/2/3 不动，数据查不到也不动）。
            if (winterSnowFlag !== null && !winterSnowArea) {
                for (const sp of this.decorSprites) {
                    const plain = snowToPlainTree(sp.asset);
                    if (plain === sp.asset) continue;
                    sp.asset = plain;
                    this.ensureNatureAsset(plain);
                }
            }
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
 * 点缀 DE 古战场军事遗存与野战专属五大类场景元素：
 *   · 攻城战：倒毁攻城器械残骸（投石机/石炮/冲车/弩炮）、破损拒马木栅残骸、战地火把
 *   · 野战（五大类丰富元素）：
 *       1) 地域文明古迹、祭坛与英雄雕像（按文化匹配：秦汉唐断垣/佛像、古罗马废墟/凯旋门/剧场/亚历山大雕像、两河遗址/拜火教圣火坛、桑奇大塔/印度古迹、安第斯古迹/美洲聚落、多神教祭坛、城堡/教堂废墟）
 *       2) 古道驿迹与受阻商旅辎重车队（古道贴花 + 地域空商车/骡车 + 破车 + 拒马木障 + 火把）
 *       3) 荒野斥候前哨、猎人茅屋 / 美洲聚落 / 游牧毡帐与林边伐木点（哨站 + 茅屋/聚落 + 树桩/倒木 + 野果丛）
 *       4) 江河海滩沉船、荒野渡口栈桥船坞与浅滩礁石鱼群（战船/商船沉船残骸、海岸搁浅巨鲸、渡口船坞+停泊小舟、水中礁石与鱼群）
 *       5) 远翼大山、特种地质奇观与惨烈古战场遗骸（高地远山、野生金矿/石矿/采石坑、地表裂隙/弹坑/盐壳/硫磺口、战车与攻城器残骸、战场白骨与荒冢）
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
    const placedRelicItems: Array<{ x: number; y: number; r: number; isBld: boolean; isFarm: boolean }> = [];
    const usedUniqueAssets = new Set<string>();

    const relicRadiusOf = (asset: string): { r: number; isBld: boolean; isFarm: boolean } => {
        if (/^(?:DECAL_|RESOURCE:SALT_|RESOURCE:SULFUR_CRATER)/.test(asset)) return { r: 0, isBld: false, isFarm: false };
        if (/CASTLE|SIEGE_WORKSHOP|MARKET|MONASTERY|SETTLEMENT|FOLWARK|WOODEN_FORT|CATHEDRAL|COLOSSEUM|AMPHITHEATRE|GREAT_PYRAMID|DOME_OF_THE_ROCK|SANCHI_STUPA|GOL_GUMBAZ|DOCK|SHIPYARD|POENARI_CASTLE/.test(asset)) {
            return { r: 128, isBld: true, isFarm: false };
        }
        if (/MILL|BLACKSMITH|HOUSE|HUT|YURT|LUMBER_CAMP|MINING_CAMP|CAMP_BARRACKS|GREEK_WAR_TENT|PAGODA|SHRINE|RUINS|TORII_GATE|OUTPOST|MADRASAH|MINARET|THOLOS|ARCH_OF_CONSTANTINE|SPHINX|PYRAMIDS|STONEHENGE|HALL_OF_HEROES|PASTURE|BARRACKS|ARCHERY_RANGE|STABLE|TOWER/.test(asset) && asset.startsWith('BUILDING:')) {
            return { r: 98, isBld: true, isFarm: false };
        }
        if (/^RESOURCE:(?:FARM|RFARM|PASTURE)/.test(asset)) {
            return { r: 76, isBld: true, isFarm: true };
        }
        if (/^RESOURCE:(?:VINEYARD|QUARRY)/.test(asset)) {
            return { r: 84, isBld: true, isFarm: false };
        }
        if (/^MINE_/.test(asset)) {
            return { r: 20, isBld: false, isFarm: false };
        }
        return { r: 34, isBld: false, isFarm: false };
    };
    const MIN_RELIC_BLD_GAP = 48;
    const MIN_RELIC_PROP_GAP = 20;

    // 校验聚落中心或独立点位的基础地形与禁区（不含同聚落内部子建筑的自斥）
    const isTerrainAndCorridorSafe = (sx: number, sy: number, centerRx = 460, centerRy = 310, edgePadX = 250, edgePadY = 115): boolean => {
        if (sx < edgePadX || sx > VW - edgePadX || sy < edgePadY || sy > VH - edgePadY) return false;
        // 避开中央核心交战区（用椭圆代替整条横贯全图的水平禁带，允许左右远翼与四角在不同高度自由散布，打破水平排队）
        if (((sx - cx) / centerRx) ** 2 + ((sy - cy) / centerRy) ** 2 < 1.0) return false;
        // 攻城战避开城池、护城河及四门大道
        if (this.deCity) {
            if (((sx - cx) / (rx + 220)) ** 2 + ((sy - cy) / (ry + 140)) ** 2 < 1.0) return false;
            if (ringLm > 0) {
                const u = (sx - cx) / (TAC_TILE_W / 2), v = (sy - cy) / (TAC_TILE_H / 2);
                const di = Math.abs((u + v) / 2 - 0.5), dj = Math.abs((v - u) / 2 - 0.5);
                if ((di <= roadMaxU && dj <= roadMaxV) || (dj <= roadMaxU && di <= roadMaxV)) return false;
            }
        }
        // 🔴 [2026-10-21 主人报「拒马/残骸立在河里」] 水面与湿岸都不放（密度 ≥0.18 一刀切）
        const wc = glLayer.screenToCell(sx, sy, VW, VH);
        if (!wc || glLayer.getWaterDensityAt(wc.gx, wc.gy) >= 0.18) return false;
        // 严禁落在任何部队出生列阵区及行军进场走廊上（防止军队踩在古塔/佛像/建筑上）
        for (const sp of this.spawns) {
            if (Math.abs(sx - sp.x) < 420 && Math.abs(sy - sp.y) < 440) return false;
            const mdx = cx - sp.x, mdy = cy - sp.y;
            const mLen = Math.hypot(mdx, mdy) || 1;
            const mux = mdx / mLen, muy = mdy / mLen;
            const rx0 = sx - sp.x, ry0 = sy - sp.y;
            const along = rx0 * mux + ry0 * muy;
            const perp = Math.abs(-rx0 * muy + ry0 * mux);
            if (along > -100 && along < mLen + 100 && perp < 350) return false;
        }
        return true;
    };

    // 聚落主中心选点校验：不仅检查地形与走廊，还要求与其它聚落中心保持大间距且不排成呆板直线
    const isSafeSpot = (sx: number, sy: number, minGap = 440, centerRx = 460, centerRy = 310): boolean => {
        if (!isTerrainAndCorridorSafe(sx, sy, centerRx, centerRy, 300, 130)) return false;
        for (const p of placedPts) {
            if (Math.hypot(sx - p.x, (sy - p.y) * 1.3) < minGap) return false;
            // 防呆板对齐：禁止不同聚落中心在相近的水平高度 y 或相近的垂直列 x 上排成一排
            if (Math.abs(sy - p.y) < 85 && Math.abs(sx - p.x) < minGap * 1.6) return false;
            if (Math.abs(sx - p.x) < 95 && Math.abs(sy - p.y) < minGap * 1.4) return false;
        }
        return true;
    };

    // 聚落内部配套建筑/道具选点校验：不被本聚落中心 placedPts 的水平/垂直防对齐规则自斥，而是按真实建筑包围盒保持合理配套间距
    const canPlaceRelicItemAt = (
        asset: string,
        sx: number,
        sy: number,
        centerRx = 430,
        centerRy = 285,
        parentAnchor?: { x: number; y: number; minIsoDist?: number },
    ): boolean => {
        if (!isTerrainAndCorridorSafe(sx, sy, centerRx, centerRy, 220, 105)) return false;
        const { r, isBld, isFarm } = relicRadiusOf(asset);
        if (r <= 0) return true;
        const isOre = /^MINE_/.test(asset);
        for (const item of placedRelicItems) {
            if (isOre && !item.isBld && item.r <= 22) continue;
            // 🔴 [2026-11-07 主人令「田地之间要挨着，是不是更现实？」]
            //    同一农庄的农田/水田/牧草场地块按 2×2 等距菱形网格紧挨成片（田连阡陌，中心距 ≈ 142px），
            //    因此田块与田块之间允许贴边相接（仅防同格重叠 < 115px），但田块与磨坊/民居等实体建筑仍严格保持净距。
            if (isFarm && item.isFarm) {
                if (Math.hypot(sx - item.x, sy - item.y) < 115) return false;
                continue;
            }
            const isoDist = Math.hypot(sx - item.x, (sy - item.y) * 1.55);
            if (
                !isBld
                && parentAnchor
                && Math.hypot(item.x - parentAnchor.x, item.y - parentAnchor.y) < 4
            ) {
                if (isoDist < (parentAnchor.minIsoDist ?? 92)) return false;
                continue;
            }
            const minGap = (isBld && item.isBld) ? MIN_RELIC_BLD_GAP : MIN_RELIC_PROP_GAP;
            if (isoDist < r + item.r + minGap) return false;
            // 🔴 [2026-11-09 主人令「野战战场上的建筑摆放都是平行的，这不对吧，哪有野外摆放这么规整的？」]
            //    禁止邻近两座实体建筑（非农田）在屏幕同一水平高度（平行横向一排）或同一垂直列上规整对齐：
            //    凡 620px 邻域内的两栋建筑，纵向高差 |Δy| 必须 ≥ 78px，横向间距 |Δx| 必须 ≥ 82px，强制呈高低错落的斜向自然分布。
            if (isBld && !isFarm && item.isBld && !item.isFarm && Math.hypot(sx - item.x, sy - item.y) < 620) {
                if (Math.abs(sy - item.y) < 78) return false;
                if (Math.abs(sx - item.x) < 82) return false;
            }
        }
        return true;
    };

    const shuffleOffsets = <T>(arr: readonly T[]): T[] => {
        const out = [...arr];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    };

    const findCompanionSpot = (
        baseX: number,
        baseY: number,
        asset: string,
        offsets: ReadonlyArray<readonly [number, number]>,
        centerRx = 430,
        centerRy = 285,
        parentAnchor?: { x: number; y: number; minIsoDist?: number },
    ): { x: number; y: number } | null => {
        const { isBld, isFarm } = relicRadiusOf(asset);
        const isSolidBld = isBld && !isFarm;
        const iterOffsets = isSolidBld ? shuffleOffsets(offsets) : offsets;
        for (const [dx, dy] of iterOffsets) {
            const jx = isSolidBld ? Math.round((rnd() - 0.5) * 38) : 0;
            const jy = isSolidBld ? Math.round((rnd() - 0.5) * 28) : 0;
            const px = baseX + dx + jx, py = baseY + dy + jy;
            if (canPlaceRelicItemAt(asset, px, py, centerRx, centerRy, parentAnchor)) {
                return { x: px, y: py };
            }
        }
        return null;
    };

    const pushRelic = (
        asset: string,
        sx: number,
        sy: number,
        flip: boolean,
        scale = 1.0,
        z = 0,
        frame = 0,
        recordPt = true,
    ): void => {
        if (recordPt) placedPts.push({ x: sx, y: sy });
        const { r, isBld, isFarm } = relicRadiusOf(asset);
        if (r > 0) placedRelicItems.push({ x: sx, y: sy, r, isBld, isFarm });
        const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
        this.ensureNatureAsset(asset);
        this.decorSprites.push({
            asset,
            frame,
            x: sx,
            y: sy,
            flip,
            scale,
            layer: 'world',
            z,
            lift,
            indestructible: true,
            obstruction: undefined,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        });
    };

    // 全图自由随机散落采样：不在固定高度排成两行，而是在全图安全区内随机撒点
    const pickRandomScatterSpot = (
        minGap = 460,
        centerRx = 480,
        centerRy = 320,
    ): { x: number; y: number } | null => {
        for (let attempt = 0; attempt < 60; attempt++) {
            const sx = VW * (0.10 + rnd() * 0.80);
            const sy = VH * (0.08 + rnd() * 0.84);
            if (isSafeSpot(sx, sy, minGap, centerRx, centerRy)) return { x: sx, y: sy };
        }
        return null;
    };

    // 从池中随机抽取一个尚未在本局使用过的素材（确保佛像、特定古塔、雕像等绝不重复出现）
    const pickUniqueFromPool = (pool: readonly string[]): string => {
        const unused = pool.filter((a) => !usedUniqueAssets.has(a));
        const src = unused.length > 0 ? unused : pool;
        const chosen = src[Math.floor(rnd() * src.length)];
        usedUniqueAssets.add(chosen);
        return chosen;
    };

    // 清理聚落用地范围内的散树（DE 建筑地基与农田上绝不长树穿模）
    const FIELD_TREE_RE = /^(?!PLANT|UNDERBRUSH|ROCK|FORAGE|FALLEN_LEAVES|FELLED|STUMP|FLOWER|GRASS|WEED|SHRUB|BUSH_GREEN|RESOURCE:OLIVE_TREE).*(TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE|SPRUCE)/i;
    const clearTreesInRadius = (cx0: number, cy0: number, rad: number): void => {
        for (let i = this.decorSprites.length - 1; i >= 0; i--) {
            const sp = this.decorSprites[i];
            if (!FIELD_TREE_RE.test(sp.asset)) continue;
            if (Math.hypot(sp.x - cx0, (sp.y - cy0) * 1.45) < rad) {
                this.decorSprites.splice(i, 1);
            }
        }
    };

    const defRec: any = this.defenderCityRecord();
    const mapLat = defRec?.lat ?? this.centerLat ?? 30;
    const mapLng = defRec?.lng ?? this.centerLng ?? 110;
    const deStyle = this.buildingStyleFor(1);
    const cultStyle = String(defRec?.buildingStyle ?? this.environmentPlan?.buildingStyle ?? this.sideCulture?.[1] ?? this.sideCulture?.[0] ?? '');
    const baseTerrain = String(this.environmentPlan?.baseTerrain ?? 'gr2');
    const isSnow = glLayer.isIce || /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(baseTerrain);
    const isArid = /^(des|pal|qs|ds5|pal1)/i.test(baseTerrain);
    const elevM = this.environmentPlan?.elevationM ?? 0;
    const elevBand = this.environmentPlan?.elevationBand;
    const calSeason = this.sceneSeason ?? 1;
    const seasonTag = isSnow
        ? 'WINTER'
        : (calSeason === 0 ? 'SPRING' : calSeason === 2 ? 'AUTUMN' : 'SUMMER');

    // 文化圈归类（严格遵守「美洲是聚落」与世界各地 DE 文明史实风貌，绝不跨文明混放）
    const isAmericas = deStyle === 'ANDE' || deStyle === 'MESO'
        || /^(AMERICA|ANDE|MAYANS|INCA|MUISCA|TUPI|MAPUCHE|CHIMU|TARASCAN|TAIRONA|TEHUELCHE|IROQUOIS|NORTHAM_IMPERIAL|SOUTHAM_IMPERIAL)$/.test(cultStyle);
    const isTibet = /^(TIBET|TIBET_CASTLE|TIBET_IMPERIAL|YARLUNG)$/.test(cultStyle)
        || /^(TIBET|TIBET_CASTLE|TIBET_IMPERIAL|YARLUNG)$/.test(String(this.sideCulture?.[1] ?? ''));
    const isNomad = !isAmericas && (deStyle === 'YURT'
        || isTibet
        || /^(MONGOL|MOBEI_MONGOL|XIANBEI|HUNS|CUMAN|TURKS|HEXI|TIBET)$/.test(cultStyle));
    const isEastAsia = !isAmericas && !isNomad && (deStyle === 'ASIA'
        || /^(CENTRAL|WEI|JIANGNAN|HUGUANG|BASHU|NORTHEAST|KOREA|JAPAN)$/.test(cultStyle));
    const isJapan = cultStyle === 'JAPAN';
    // 🔴 [2026-11-08 主人问「西藏的战场放这个建筑，可以吗」] 西藏文化借用 PURU 粗石墙/民居代理，
    //    绝不可归入印度/南亚文化圈（isIndosphere），严禁在西藏出现印度伊斯兰陵墓 GOL_GUMBAZ 或波罗的海异教神树祠 PAGAN_SHRINE
    const isIndosphere = !isAmericas && !isNomad && !isTibet && (deStyle === 'INDI' || deStyle === 'PURU' || deStyle === 'SEAS'
        || /^(INDIA|PURU|BENGALIS|GURJARAS|BURMESE|KHMER|VIETNAMESE|MALAY|CHAMPA|JAVANESE|SIAMESE|MON|DIANQIAN)$/.test(cultStyle));
    const isGrecoRoman = !isAmericas && (deStyle === 'GREEK' || deStyle === 'THRACIAN' || deStyle === 'MEDI'
        || /^(ROMA|BYZANTINE|GREECE|GREEK|ATHENIANS|SPARTANS|MACEDONIAN|THRACIAN|SICILIANS|ITALIANS)$/.test(cultStyle));
    const isMiddleEast = !isAmericas && (deStyle === 'ORIE' || deStyle === 'PERSIAN'
        || /^(ORIE|WEST_ASIA|PERSIAN|SASANIAN|CENTRAL_ASIA|WESTERN|BERBER|MUGHAL|ARMENIANS|GEORGIANS)$/.test(cultStyle));
    const isEgyptNile = !isAmericas && (
        /^(EGYPT|NUBIA|AXUM|ETHIOPIA)$/.test(cultStyle)
        || (mapLat >= 10 && mapLat <= 32 && mapLng >= 24 && mapLng <= 43)
    );
    const isPaganNorth = !isAmericas && /^(CELTS|VIKINGS|DANES|VARANGIANS|GOTHS|GERMANIC|SLAVIC|LITHUANIANS)$/.test(cultStyle);
    const isEurope = !isAmericas && (deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV' || isGrecoRoman || isPaganNorth);

    // 按文明圈严格过滤攻城器械残骸（美洲无旧大陆攻城车与火器；高丽火箭车仅限东亚；胡斯战车/风琴炮仅限欧洲；希腊火喷射器仅限东地中海/中东）
    const siegeWrecks = isAmericas
        ? [
            'BATTLEFIELD:DECAY_BATTERING_RAM',
            'BATTLEFIELD:DECAY_CAPPED_RAM',
            'BATTLEFIELD:DECAY_SCORPION',
            'BATTLEFIELD:CART_BROKEN',
        ]
        : [
            'BATTLEFIELD:DECAY_TREBUCHET',
            'BATTLEFIELD:DECAY_TREBUCHET_PACKED',
            'BATTLEFIELD:DECAY_MANGONEL',
            'BATTLEFIELD:DECAY_ONAGER',
            'BATTLEFIELD:DECAY_SIEGE_ONAGER',
            'BATTLEFIELD:DECAY_BATTERING_RAM',
            'BATTLEFIELD:DECAY_CAPPED_RAM',
            'BATTLEFIELD:DECAY_SIEGE_RAM',
            'BATTLEFIELD:DECAY_SCORPION',
            'BATTLEFIELD:DECAY_HEAVY_SCORPION',
            'BATTLEFIELD:DECAY_SIEGE_BALLISTA',
            'BATTLEFIELD:DECAY_SIEGE_TOWER',
            ...(isEastAsia ? ['BATTLEFIELD:DECAY_ROCKET_CART', 'BATTLEFIELD:DECAY_WAR_CHARIOT', 'BATTLEFIELD:DECAY_BOMBARD_CANNON'] : []),
            ...(isEurope ? ['BATTLEFIELD:DECAY_BOMBARD_CANNON', 'BATTLEFIELD:DECAY_ORGAN_GUN', 'BATTLEFIELD:DECAY_HUSSITE_WAGON'] : []),
            ...(isGrecoRoman || isMiddleEast ? ['BATTLEFIELD:DECAY_FLAMETHROWER', 'BATTLEFIELD:DECAY_WAR_CHARIOT', 'BATTLEFIELD:DECAY_BOMBARD_CANNON'] : []),
            ...(isIndosphere ? ['BATTLEFIELD:DECAY_WAR_CHARIOT', 'BATTLEFIELD:DECAY_BOMBARD_CANNON'] : []),
        ];

    if (this.battleType === 'siege') {
        const barricadePool = [
            'BATTLEFIELD:BARRICADE_A',
            'BATTLEFIELD:BARRICADE_B',
            'BATTLEFIELD:BARRICADE_C',
            'BATTLEFIELD:BARRICADE_D',
            'BATTLEFIELD:BARRICADE_RUBBLE_A',
            'BATTLEFIELD:BARRICADE_RUBBLE_B',
            'BATTLEFIELD:BARRICADE_RUBBLE_C',
            'BATTLEFIELD:BARRICADE_RUBBLE_D',
            'BATTLEFIELD:FENCE_BROKEN_A',
            'BATTLEFIELD:FENCE_BROKEN_B',
            'BATTLEFIELD:STAKE_BARRICADE',
        ];
        const corpsePool = [
            'BATTLEFIELD:SKELETON_BATTLEFIELD',
            'BATTLEFIELD:SKELETON_SOLDIER',
            'BATTLEFIELD:SKELETON_CIVILIAN',
            'BATTLEFIELD:ANIMAL_SKELETON',
            'BATTLEFIELD:IMPALED_CORPSE',
            ...(isGrecoRoman ? ['BATTLEFIELD:IMPALED_CORPSE_ANT'] : []),
            'BATTLEFIELD:GRAVES',
        ];

        // DE 攻城战损现场：在城墙外围交战带成簇布置「损毁攻城器 + 弹坑焦土 + 破损拒马 + 阵亡白骨」
        const wreckClusterCount = 3 + Math.floor(rnd() * 2);
        for (let i = 0; i < wreckClusterCount; i++) {
            const pt = pickRandomScatterSpot(460, 520, 340);
            if (!pt) continue;
            const wreckAsset = pickUniqueFromPool(siegeWrecks);
            const anchor = { x: pt.x, y: pt.y, minIsoDist: 56 };
            pushRelic(rnd() < 0.55 ? 'DECAL_CRATER' : 'DECAL_CRACK', pt.x, pt.y + 6, rnd() < 0.5, 0.92, -6, 0, false);
            pushRelic(wreckAsset, pt.x, pt.y, rnd() < 0.5, 0.92, 0, 0, true);
            const bSpot = findCompanionSpot(pt.x, pt.y, 'BATTLEFIELD:BARRICADE_A', [[54, 22], [-54, 22], [48, -22], [-48, -22]], 480, 320, anchor);
            if (bSpot) {
                pushRelic(pickUniqueFromPool(barricadePool), bSpot.x, bSpot.y, rnd() < 0.5, 0.88, 0, 0, false);
            }
            const cSpot = findCompanionSpot(pt.x, pt.y, 'BATTLEFIELD:SKELETON_SOLDIER', [[-52, 20], [52, -20], [0, 38], [0, -38]], 480, 320, anchor);
            if (cSpot) {
                pushRelic(pickUniqueFromPool(corpsePool), cSpot.x, cSpot.y, rnd() < 0.5, 0.86, 0, 0, false);
            }
        }
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 野战地图（battleType !== 'siege'）：严格按 AoE2:DE RMS 与战役造景法则生成
    // 🔴 [2026-11-04 主人令「请按DE的摆法来设计地图。」「好的，世界各地文化的摆放也请注意。一律按DE的方式来。」]
    // 🔴 [2026-11-07 主人令「战场上，就一个座城堡孤零零的在这里，不合适吧？还有市场也是。不要单独摆放，要组合摆放，要配套。」]
    //   1. 资源采集建筑严格依附自然资源（绝不悬空单摆）：
    //      · 伐木场（Lumber Camp / 美洲聚落 / 游牧骡车）必须紧贴真实树林簇边缘，林口配树桩与原木；无林则不放。
    //      · 采矿场（Mining Camp / 美洲聚落 / 游牧骡车）必须紧挨 4~5 格紧密拼合的金矿/石矿脉簇（Tile Clump）与采石坑。
    //      · 船坞（Dock / Shipyard）必须跨在水陆交界岸线上，水面停泊本文化舟船、近岸成簇生成鱼群与水生植物。
    //   2. 建筑严禁单独孤零零摆放，一律按「DE 功能聚落（Functional Compound）」成组配套布局（零跨文化混搭，选点不满足配套空间则换点）：
    //      · 农庄村落（Farming Village）：1 座磨坊/聚落/庄园 + 3~4 块等距农田 + 2~3 间本文化民居 + 成簇浆果/果树 + 农车 + 泥径。
    //      · 路边商贸集镇（Market Trade Compound）：集市 + 铁匠铺 + 1~2 间本文化商铺民居 + 古道贴花 + 地毯/货桶 + 满载与空商车 + 行进货郎。
    //      · 要塞/城堡军营（Fortress / Castle Garrison Compound）：城堡/木堡/要塞 + 本文化兵营/军帐 + 哨塔/军械铺 + 弧形木栅拒马防线 + 军需木桶/辎重车 + 战旗与火把。
    //      · 宗教圣地院落（Sacred Shrine Compound）：修道院/古塔/大佛/遗迹主建筑 + 配套僧舍/偏殿/祭坛 + 石径 + 对称花坛 + 牌坊/雕像。
    //   3. 古战场战损遗迹簇（本文明攻城器械残骸 + 焦土弹坑 + 破损拒马 + 白骨）集中在交战区外沿，不混入和平村落。
    // ══════════════════════════════════════════════════════════════════════════
    const isRiceRegion = !isNomad && !isTibet && !isAmericas && !isArid && !isSnow
        && (/^(JIANGNAN|HUGUANG|BASHU|KOREA|VIETNAMESE|BENGALIS|BURMESE|KHMER|PURU|INDIA|MUGHAL|DIANQIAN|JAPAN|MALAY|CHAMPA|JAVANESE|SIAMESE|MON)$/.test(cultStyle)
            || deStyle === 'SEAS' || deStyle === 'PURU' || deStyle === 'INDI');
    const foragePool = isAmericas || isIndosphere || deStyle === 'AFRI'
        ? ['FORAGE_PAPAYA', 'FORAGE_PINEAPPLE', 'FORAGE_FRUIT', 'FORAGE_BUSH']
        : ['FORAGE_FRUIT', 'FORAGE_BUSH'];
    const flagPool = isEastAsia
        ? ['BUILDING:SCEN_FLAG_N']
        : isGrecoRoman
            ? ['BUILDING:SCEN_FLAG_MACEDONIAN', 'BUILDING:SCEN_FLAG_R']
            : isAmericas || isNomad || isPaganNorth
                ? ['BUILDING:SCEN_FLAG_RITUAL_A']
                : (isMiddleEast || isIndosphere || deStyle === 'AFRI' || deStyle === 'CEAS')
                    ? ['BUILDING:SCEN_FLAG_R']
                    : ['BUILDING:SCEN_FLAG_D', 'BUILDING:SCEN_FLAG_E', 'BUILDING:SCEN_FLAG_S', 'BUILDING:SCEN_FLAG_U'];
    const culturalHousePool = isAmericas
        ? [`BUILDING:${deStyle}_HOUSE_AGE2`, `BUILDING:${deStyle}_HOUSE_AGE3`, 'BUILDING:HUT_A', 'BUILDING:HUT_B', 'BUILDING:HUT_C']
        : isTibet
            ? ['BUILDING:PURU_HOUSE_AGE2', 'BUILDING:PURU_HOUSE_AGE3']
            : isNomad
                ? ['BUILDING:YURT_B', 'BUILDING:YURT_C', 'BUILDING:YURT_D', 'BUILDING:YURT_E', 'BUILDING:YURT_F', 'BUILDING:YURT_G']
                : [`BUILDING:${deStyle}_HOUSE_AGE2`, `BUILDING:${deStyle}_HOUSE_AGE3`];

    // ── 0. 野战远翼大山（高地/山地在远翼高台摆 1 座 DE 大山，避开中央交战区） ──
    if (elevM >= 350 || elevBand === 'mountain' || elevBand === 'alpine' || elevBand === 'high_alpine') {
        const mountainPool = getClimateMountainPool.call(this, isSnow);
        const N = glLayer.data?.width ?? 120;
        const hillCands: Array<{ x: number; y: number; elev: number }> = [];
        for (let gy = 5; gy <= N - 5; gy += 3) {
            for (let gx = 5; gx <= N - 5; gx += 3) {
                const pt = glLayer.cellToScreen(gx + 0.5, gy + 0.5, VW, VH);
                if (Math.abs(pt.y - cy) < 500) continue;
                if (!isSafeSpot(pt.x, pt.y, 680, 560, 480)) continue;
                const el = glLayer.elevationLevelAt(pt.x, pt.y, VW, VH);
                if (el >= 1.2) hillCands.push({ x: pt.x, y: pt.y, elev: el });
            }
        }
        if (hillCands.length > 0) {
            hillCands.sort((a, b) => b.elev - a.elev || (rnd() - 0.5));
            const hc = hillCands[0];
            const mAsset = mountainPool[Math.floor(rnd() * mountainPool.length)];
            pushRelic(mAsset, hc.x, hc.y, rnd() < 0.5, 1.85, 0, 0, true);
        }
    }

    // ── 1. DE 林缘伐木场（必须紧贴地图上真实存在的成片树林边缘，绝不在空地上凭空单放） ──
    {
        const useBambooStump = !isSnow && (isEastAsia || isIndosphere);
        const useBaobabStump = !isSnow && deStyle === 'AFRI';
        const stumpPool = useBambooStump
            ? ['STUMP_GENERIC', 'STUMP_BAMBOO', 'STUMP_LUSH_BAMBOO']
            : useBaobabStump
                ? ['STUMP_GENERIC', 'STUMP_BAOBAB']
                : ['STUMP_GENERIC'];
        const felledPool = useBambooStump
            ? ['FELLED_GENERIC', 'FELLED_BAMBOO', 'FELLED_LUSH_BAMBOO']
            : useBaobabStump
                ? ['FELLED_GENERIC', 'FELLED_BAOBAB']
                : ['FELLED_GENERIC'];
        const lumCampAsset = isAmericas
            ? 'BUILDING:SETTLEMENT'
            : isNomad
                ? 'TRADE:MULE_CART/move_2'
                : (deStyle === 'GREEK' || deStyle === 'MEDI' || deStyle === 'WEST' || deStyle === 'ORIE' || deStyle === 'PERSIAN')
                    ? 'BUILDING:GREEK_LUMBER_CAMP_AGE2'
                    : 'BUILDING:THRACIAN_LUMBER_CAMP_AGE2';

        const forestTrees: Array<{ x: number; y: number }> = [];
        for (const sp of this.decorSprites) {
            if (FIELD_TREE_RE.test(sp.asset)) forestTrees.push({ x: sp.x, y: sp.y });
        }
        if (forestTrees.length >= 4) {
            const shuffledTrees = [...forestTrees];
            for (let i = shuffledTrees.length - 1; i > 0; i--) {
                const j = Math.floor(rnd() * (i + 1));
                [shuffledTrees[i], shuffledTrees[j]] = [shuffledTrees[j], shuffledTrees[i]];
            }
            const edgeOffsets: ReadonlyArray<readonly [number, number]> = [
                [135, 48], [-135, 48], [135, -48], [-135, -48], [0, 96], [0, -96],
            ];
            lumberSearch: for (const tr of shuffledTrees) {
                // 确认该树属于成片树林簇（半径 220px 内至少有 3 棵树），不在孤立单棵散树旁建伐木场
                let clusterCount = 0;
                for (const other of forestTrees) {
                    if (Math.hypot(other.x - tr.x, (other.y - tr.y) * 1.45) < 220) {
                        clusterCount++;
                        if (clusterCount >= 3) break;
                    }
                }
                if (clusterCount < 3) continue;

                for (const [ox, oy] of edgeOffsets) {
                    const lx = tr.x + ox, ly = tr.y + oy;
                    if (!isSafeSpot(lx, ly, 520, 480, 320)) continue;
                    if (!canPlaceRelicItemAt(lumCampAsset, lx, ly, 480, 320)) continue;
                    // 伐木场自身位置不能压在树林内部（距离最近树木 ≥ 76px，恰在林缘外 1.5 格）
                    if (forestTrees.some((ft) => Math.hypot(ft.x - lx, (ft.y - ly) * 1.45) < 76)) continue;

                    glLayer.carveFoundation(lx, ly, VW, VH, 1.8);
                    pushRelic(lumCampAsset, lx, ly, ox < 0, 0.78, 0, 0, true);
                    const lumAnchor = { x: lx, y: ly, minIsoDist: 92 };
                    // 在伐木场周围配套 1 间伐木工屋/木桶 + 林口树桩与原木堆（斜向高低错落，不平行并排）
                    const hutSpot = findCompanionSpot(lx, ly, culturalHousePool[0], [
                        [ox >= 0 ? 205 : -205, -118],
                        [ox >= 0 ? 185 : -185, 124],
                        [ox >= 0 ? 115 : -115, oy >= 0 ? 158 : -158],
                        [ox >= 0 ? -165 : 165, oy >= 0 ? 132 : -132],
                    ], 450, 300);
                    if (hutSpot) {
                        glLayer.carveFoundation(hutSpot.x, hutSpot.y, VW, VH, 1.4);
                        pushRelic(culturalHousePool[Math.floor(rnd() * culturalHousePool.length)], hutSpot.x, hutSpot.y, rnd() < 0.5, 0.74, 0, 0, false);
                    }
                    const cutOffsets: ReadonlyArray<readonly [number, number, boolean]> = [
                        [ox >= 0 ? -96 : 96, 26, true],
                        [ox >= 0 ? -84 : 84, -32, false],
                        [ox >= 0 ? 105 : -105, 38, true],
                    ];
                    for (const [cxOff, cyOff, isStump] of cutOffsets) {
                        const sx0 = lx + cxOff, sy0 = ly + cyOff;
                        const pool = isStump ? stumpPool : felledPool;
                        const cAsset = pool[Math.floor(rnd() * pool.length)];
                        if (canPlaceRelicItemAt(cAsset, sx0, sy0, 440, 290, lumAnchor)) {
                            pushRelic(cAsset, sx0, sy0, rnd() < 0.5, 0.82, 0, 0, false);
                        }
                    }
                    break lumberSearch;
                }
            }
        }
    }

    // ── 2. DE 矿脉簇与采矿营地（4~5 格紧密相连的金矿/石矿簇 Tile Clump + 采石坑 + 紧邻矿脉的采矿场 + 矿工营房/木桶） ──
    {
        const campAsset = isAmericas
            ? 'BUILDING:DARK_SETTLEMENT_AGE1'
            : isNomad
                ? 'TRADE:MULE_CART/move_6'
                : (deStyle === 'GREEK' || deStyle === 'MEDI' || deStyle === 'WEST' || deStyle === 'ORIE' || deStyle === 'PERSIAN')
                    ? 'BUILDING:GREEK_MINING_CAMP_AGE2'
                    : 'BUILDING:THRACIAN_MINING_CAMP_AGE2';
        const quarryAsset = rnd() < 0.5 ? 'RESOURCE:QUARRY' : 'RESOURCE:QUARRY_B';
        for (let attempt = 0; attempt < 10; attempt++) {
            const mineSpot = pickRandomScatterSpot(560, 500, 340);
            if (!mineSpot) continue;
            const mx = mineSpot.x, my = mineSpot.y;
            const campSide = mx >= cx ? -1 : 1;
            const campSpot = findCompanionSpot(mx, my, campAsset, [
                [campSide * 175, -108],
                [campSide * 165, 114],
                [-campSide * 175, 108],
                [-campSide * 165, -114],
            ], 440, 300);
            if (!campSpot) continue;

            clearTreesInRadius(mx, my, 210);
            clearTreesInRadius(campSpot.x, campSpot.y, 140);
            glLayer.carveFoundation(mx, my, VW, VH, 2.0);
            glLayer.carveFoundation(campSpot.x, campSpot.y, VW, VH, 1.6);
            const oreAsset = rnd() < 0.55 ? 'MINE_GOLD' : 'MINE_STONE';

            // DE 标准等距紧凑矿脉簇（4~5 块矿石紧挨成团，绝不单颗散放）
            const clumpOffsets: ReadonlyArray<readonly [number, number]> = [
                [0, 0],
                [34, 17],
                [-34, 17],
                [0, 34],
                [34, -17],
            ];
            const tileCount = 4 + (rnd() < 0.5 ? 1 : 0);
            for (let ti = 0; ti < tileCount; ti++) {
                const ox = mx + clumpOffsets[ti][0];
                const oy = my + clumpOffsets[ti][1];
                pushRelic(oreAsset, ox, oy, (ti % 2 === 0), 0.90, 0, ti % 6, ti === 0);
            }
            // 采矿营地（美洲为聚落，游牧为骡车）紧贴矿脉一侧
            pushRelic(campAsset, campSpot.x, campSpot.y, campSpot.x < mx, 0.78, 0, 0, false);
            // 伴生采石坑紧贴矿脉另一侧（与采矿场高低斜向错开，不水平并排）
            const qSpot = findCompanionSpot(mx, my, quarryAsset, [
                [-campSide * 172, -112],
                [-campSide * 158, 118],
                [campSide * 112, -138],
                [-campSide * 108, 142],
            ], 440, 300);
            if (qSpot) {
                pushRelic(quarryAsset, qSpot.x, qSpot.y, rnd() < 0.5, 0.84, -1, 0, false);
            }
            const campAnchor = { x: campSpot.x, y: campSpot.y, minIsoDist: 88 };
            const barrelSpot = findCompanionSpot(campSpot.x, campSpot.y, 'BARRELS', [
                [campSide * 105, 28],
                [-campSide * 105, 28],
                [0, 68],
            ], 440, 300, campAnchor);
            if (barrelSpot) {
                pushRelic('BARRELS', barrelSpot.x, barrelSpot.y, rnd() < 0.5, 0.78, 0, 0, false);
            }
            break;
        }
    }

    // ── 3. DE 农庄村落聚落（1 座磨坊/聚落/庄园 + 紧贴的 3~4 块等距网格农田 + 2~3 间错落民居 + 成簇浆果丛/果树 + 农车） ──
    {
        const plotAsset = isNomad
            ? `RESOURCE:PASTURE_${seasonTag}`
            : (isRiceRegion ? `RESOURCE:RFARM_${seasonTag}` : `RESOURCE:FARM_${seasonTag}`);
        const millPool = isAmericas
            ? ['BUILDING:SETTLEMENT', 'BUILDING:DARK_SETTLEMENT_AGE1']
            : isTibet
                ? ['BUILDING:PURU_MILL_AGE2', 'BUILDING:PURU_MILL_AGE3']
                : isNomad
                    ? ['BUILDING:DARK_PASTURE', 'BUILDING:YURT_A']
                    : deStyle === 'SLAV'
                        ? ['BUILDING:FOLWARK', `BUILDING:${deStyle}_MILL_AGE2`, `BUILDING:${deStyle}_MILL_AGE3`]
                        : [`BUILDING:${deStyle}_MILL_AGE2`, `BUILDING:${deStyle}_MILL_AGE3`];

        for (let attempt = 0; attempt < 12; attempt++) {
            const villageSpot = pickRandomScatterSpot(620, 520, 350);
            if (!villageSpot) continue;
            const vx = villageSpot.x, vy = villageSpot.y;
            const fieldSide = rnd() < 0.5 ? 1 : -1;

            // 先校验该选点能否同时放下至少 2 间配套民居与成片相连的农田块，确保磨坊绝不单摆、田块紧挨成片、民居高低错落不平行
            const houseCandOffsets: ReadonlyArray<readonly [number, number]> = shuffleOffsets([
                [-fieldSide * 228, -112],
                [-fieldSide * 196, 134],
                [-fieldSide * 92, -172],
                [-fieldSide * 288, 96],
                [-fieldSide * 138, 168],
            ]);
            // 🔴 [2026-11-07 主人令「田地之间要挨着，是不是更现实？」]
            //    FARM / RFARM 贴图为 256×192 等距菱形（PASTURE 384×288 缩放到 0.66 后同尺寸），
            //    沿菱形四边紧挨拼接的步进向量为 (Δx = ±114, Δy = ±86)，4 块田即可拼成严丝合缝的 2×2 连片农田。
            const farmCandOffsets: ReadonlyArray<readonly [number, number]> = [
                [fieldSide * 195, 16],
                [fieldSide * 309, 102],
                [fieldSide * 309, -70],
                [fieldSide * 423, 16],
                [fieldSide * 195, 188],
                [fieldSide * 195, -156],
            ];
            let validHousesPreview = 0;
            for (const [dx, dy] of houseCandOffsets) {
                if (isTerrainAndCorridorSafe(vx + dx, vy + dy, 440, 290, 220, 105)) validHousesPreview++;
            }
            let validFarmsPreview = 0;
            for (const [dx, dy] of farmCandOffsets) {
                if (isTerrainAndCorridorSafe(vx + dx, vy + dy, 440, 290, 220, 105)) validFarmsPreview++;
            }
            if (validHousesPreview < 2 || validFarmsPreview < 3) continue;

            clearTreesInRadius(vx, vy, 280);
            glLayer.carveFoundation(vx, vy, VW, VH, 2.6);

            // 村心泥径贴花 + 磨坊/聚落居中
            pushRelic('DECAL_PATH_1', vx, vy + 10, rnd() < 0.5, 0.95, -6, 0, false);
            const millAsset = pickUniqueFromPool(millPool);
            pushRelic(millAsset, vx, vy, rnd() < 0.5, 0.78, 0, 0, true);
            const millAnchor = { x: vx, y: vy, minIsoDist: 96 };

            // 一侧按 DE 2×2 等距菱形网格紧密拼接 3~4 块连片农田 / 水田 / 牧草场（田连阡陌，田块挨着不留空隙）
            const targetPlots = 4;
            const plotScale = isNomad ? 0.66 : 0.98;
            let plotsPlaced = 0;
            for (const [dx, dy] of farmCandOffsets) {
                if (plotsPlaced >= targetPlots) break;
                const px = vx + dx, py = vy + dy;
                if (!canPlaceRelicItemAt(plotAsset, px, py, 440, 290)) continue;
                clearTreesInRadius(px, py, 120);
                glLayer.carveFoundation(px, py, VW, VH, 1.4);
                pushRelic(plotAsset, px, py, false, plotScale, -6, 0, false);
                plotsPlaced++;
            }

            // 另一侧围以 2~3 间同文化民居/茅屋/毡帐，组成高低错落、有生活气息的自然村落
            const targetHouses = 2 + (rnd() < 0.5 ? 1 : 0);
            let housesPlaced = 0;
            for (let hi = 0; hi < houseCandOffsets.length && housesPlaced < targetHouses; hi++) {
                const hx = vx + houseCandOffsets[hi][0] + Math.round((rnd() - 0.5) * 34);
                const hy = vy + houseCandOffsets[hi][1] + Math.round((rnd() - 0.5) * 26);
                const hAsset = culturalHousePool[(hi + Math.floor(rnd() * culturalHousePool.length)) % culturalHousePool.length];
                if (!canPlaceRelicItemAt(hAsset, hx, hy, 440, 290)) continue;
                clearTreesInRadius(hx, hy, 125);
                glLayer.carveFoundation(hx, hy, VW, VH, 1.4);
                pushRelic(hAsset, hx, hy, rnd() < 0.5, 0.76, 0, 0, false);
                housesPlaced++;
            }

            // 村口外缘伴生果树/浆果与农车
            if (!isSnow) {
                const bushSpot = findCompanionSpot(vx, vy, foragePool[0], [
                    [-fieldSide * 135, 92],
                    [fieldSide * 135, -92],
                    [0, 125],
                ], 430, 285, millAnchor);
                if (bushSpot) {
                    const bushBase = foragePool[Math.floor(rnd() * foragePool.length)];
                    if ((isGrecoRoman || isMiddleEast) && rnd() < 0.5) {
                        pushRelic('RESOURCE:OLIVE_TREE', bushSpot.x, bushSpot.y, rnd() < 0.5, 0.82, 0, Math.floor(rnd() * 12), false);
                    } else {
                        pushRelic(bushBase, bushSpot.x, bushSpot.y, rnd() < 0.5, 0.84, -6, 0, false);
                    }
                }
            }
            break;
        }
    }

    // ── 4. DE 功能院落池（从「路边商贸集镇」「要塞/城堡军营」「宗教圣地院落」三类完整配套聚落中选 2 处分置不同侧翼，严禁单栋孤立摆放） ──
    {
        const loadedCartAsset = isAmericas
            ? 'TRADE:TRADE_CART_MESO/move_2'
            : (isMiddleEast || isNomad)
                ? 'TRADE:TRADE_CART_ORIE/move_2'
                : (isGrecoRoman || deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV')
                    ? 'TRADE:TRADE_CART_WEST/move_2'
                    : (isIndosphere || deStyle === 'AFRI')
                        ? 'TRADE:TRADE_CART_AFRI/move_2'
                        : 'TRADE:TRADE_CART_ASIA/move_2';
        const emptyCartAsset = isAmericas
            ? 'TRADE:TRADE_CART_MESO_EMPTY/move_2'
            : (isMiddleEast || isNomad)
                ? 'TRADE:TRADE_CART_ORIE_EMPTY/move_2'
                : (isGrecoRoman || deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV')
                    ? 'TRADE:TRADE_CART_WEST_EMPTY/move_2'
                    : (isIndosphere || deStyle === 'AFRI')
                        ? 'TRADE:TRADE_CART_AFRI_EMPTY/move_2'
                        : 'TRADE:TRADE_CART_ASIA_EMPTY/move_2';
        const merchantAsset = isAmericas
            ? 'TRADE:MERCHANT_MESO/move_4'
            : isGrecoRoman
                ? 'TRADE:MERCHANT_ANT/move_4'
                : (isMiddleEast || isNomad)
                    ? 'TRADE:MERCHANT_ORIE/move_4'
                    : (deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV')
                        ? 'TRADE:MERCHANT_WEST/move_4'
                        : (isIndosphere || deStyle === 'AFRI')
                            ? 'TRADE:MERCHANT_AFRI/move_4'
                            : 'TRADE:MERCHANT_ASIA/move_4';

        // 严格按世界各文明划分宗教/遗迹地标池（城堡 POENARI_CASTLE 归入军事要塞军营配套，不进宗教地标池单摆）
        const monumentPool: string[] = isAmericas
            ? (deStyle === 'ANDE'
                ? ['BUILDING:SCEN_ANDEAN_RUINS', 'BATTLEFIELD:ANDEAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`, 'BUILDING:PAGAN_SHRINE']
                : [`BUILDING:${deStyle}_MONASTERY_AGE3`, 'BUILDING:PAGAN_SHRINE', 'BUILDING:SCEN_ANCIENT_RUINS'])
            : isTibet
                ? [
                    'BUILDING:SCEN_BUDDHA_STATUE',
                    'BUILDING:SCEN_PAGODA_A', 'BUILDING:SCEN_PAGODA_B', 'BUILDING:SCEN_PAGODA_C',
                    'BUILDING:SCEN_PAGODA_D', 'BUILDING:SCEN_PAGODA_E',
                ]
            : isEastAsia
                ? [
                    'BUILDING:SCEN_BUDDHA_STATUE',
                    'BUILDING:SCEN_PAGODA_A', 'BUILDING:SCEN_PAGODA_B', 'BUILDING:SCEN_PAGODA_C',
                    'BUILDING:SCEN_PAGODA_D', 'BUILDING:SCEN_PAGODA_E',
                    ...(isJapan ? [] : ['BUILDING:SCEN_CHINESE_RUINS', 'BATTLEFIELD:CHINESE_RUINS']),
                    `BUILDING:${deStyle}_MONASTERY_AGE3`,
                ]
                : isIndosphere
                    ? (deStyle === 'SEAS'
                        ? [
                            'BUILDING:SCEN_BUDDHA_STATUE', 'BUILDING:SANCHI_STUPA', 'BUILDING:SCEN_REKHADEUL_TEMPLE',
                            `BUILDING:${deStyle}_MONASTERY_AGE3`,
                        ]
                        : [
                            'BUILDING:SCEN_BUDDHA_STATUE', 'BUILDING:SANCHI_STUPA', 'BUILDING:SCEN_REKHADEUL_TEMPLE',
                            'BUILDING:GOL_GUMBAZ', 'BUILDING:SCEN_INDIAN_RUINS', 'BUILDING:SCEN_PURU_RUINS',
                            'BATTLEFIELD:INDIAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                        ])
                    : isGrecoRoman
                        ? [
                            'BUILDING:SCEN_ROMAN_RUINS', 'BUILDING:ARCH_OF_CONSTANTINE', 'BUILDING:AMPHITHEATRE',
                            'BUILDING:SCEN_COLOSSEUM', 'BUILDING:SCEN_ARCHAIC_THOLOS',
                            'BUILDING:SCEN_HERO_SHRINE', 'BATTLEFIELD:ROMAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                        ]
                        : isEgyptNile
                            ? [
                                'BUILDING:GREAT_PYRAMID', 'BUILDING:SCEN_SPHINX', 'BUILDING:SCEN_CUSHITE_PYRAMIDS',
                                `BUILDING:${deStyle}_MONASTERY_AGE3`,
                            ]
                            : deStyle === 'AFRI'
                                ? [
                                    'BUILDING:SCEN_SANKORE_MADRASAH', 'BUILDING:SCEN_CUSHITE_PYRAMIDS',
                                    'BUILDING:AFRI_MONASTERY_AGE3',
                                ]
                                : deStyle === 'PERSIAN'
                                    ? [
                                        'BUILDING:SCEN_FIRE_SHRINE', 'BUILDING:MINARET_OF_JAM',
                                        'BUILDING:SCEN_MESOPOTAMIAN_RUINS', 'BUILDING:SCEN_MESOPOTAMIAN_TOMB',
                                        'BATTLEFIELD:MESOPOTAMIAN_TOMB', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                    ]
                                    : isMiddleEast
                                        ? [
                                            'BUILDING:SCEN_DOME_OF_THE_ROCK', 'BUILDING:MINARET_OF_JAM',
                                            'BUILDING:SCEN_MESOPOTAMIAN_RUINS', 'BUILDING:SCEN_MESOPOTAMIAN_TOMB',
                                            'BATTLEFIELD:MESOPOTAMIAN_TOMB', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                        ]
                                        : (isNomad || isPaganNorth)
                                            ? [
                                                'BUILDING:SCEN_STONEHENGE', 'BUILDING:SCEN_HALL_OF_HEROES',
                                                'BUILDING:PAGAN_SHRINE', 'BUILDING:SCEN_ANCIENT_RUINS',
                                                'BATTLEFIELD:ANCIENT_RUINS', 'BUILDING:SCEN_HERO_SHRINE',
                                            ]
                                            : (deStyle === 'SLAV' || deStyle === 'EAST')
                                                ? [
                                                    'BUILDING:SCEN_CASTLE_RUINS',
                                                    'BUILDING:SCEN_CHURCH_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                                ]
                                                : [
                                                    'BUILDING:SCEN_AACHEN_CATHEDRAL', 'BUILDING:QUIMPER_CATHEDRAL',
                                                    'BUILDING:SCEN_CASTLE_RUINS', 'BUILDING:SCEN_CHURCH_RUINS', 'BUILDING:SCEN_MEDI_RUINS',
                                                    `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                                ];

        // 🔴 [2026-11-09 主人令「野战战场上的建筑摆放都是平行的，这不对吧，哪有野外摆放这么规整的？」]
        //    院落配套建筑偏移全部采用非对称斜向错落坐标（|Δy| ≥ 96~172px，且左右两侧深度互不镜像），
        //    配合 findCompanionSpot 的随机洗牌与微扰，彻底杜绝两栋建筑在同一水平线上平行并列。
        const companionWingOffsets: ReadonlyArray<readonly [number, number]> = [
            [218, -118],
            [-208, 128],
            [188, 142],
            [-232, -104],
            [268, 98],
            [-172, -158],
            [148, -168],
            [-264, 108],
            [136, 172],
            [-144, 164],
        ];

        type CompoundKind = 'trade_post_compound' | 'military_outpost_compound' | 'sacred_shrine_compound';
        const compoundKinds: CompoundKind[] = ['trade_post_compound', 'military_outpost_compound', 'sacred_shrine_compound'];
        for (let i = compoundKinds.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [compoundKinds[i], compoundKinds[j]] = [compoundKinds[j], compoundKinds[i]];
        }

        let compoundsPlaced = 0;
        for (const cKind of compoundKinds) {
            if (compoundsPlaced >= 2) break;

            for (let attempt = 0; attempt < 14; attempt++) {
                const pt = pickRandomScatterSpot(640, 520, 350);
                if (!pt) continue;
                const sx = pt.x, sy = pt.y;
                // 预验该中心点周围至少有 2 个可放置配套建筑的侧翼方向（保证城堡/要塞、市场、圣地绝不单独出现）
                let validWingCount = 0;
                for (const [dx, dy] of companionWingOffsets) {
                    if (isTerrainAndCorridorSafe(sx + dx, sy + dy, 430, 285, 220, 105)) {
                        validWingCount++;
                        if (validWingCount >= 2) break;
                    }
                }
                if (validWingCount < 2) continue;

                clearTreesInRadius(sx, sy, 270);
                glLayer.carveFoundation(sx, sy, VW, VH, 2.4);
                const mainAnchor = { x: sx, y: sy, minIsoDist: 96 };

                if (cKind === 'trade_post_compound') {
                    // DE 路边商贸集镇配套组合：市场 + 铁匠铺 + 1~2 间商铺民居 + 古道贴花 + 地毯/货桶 + 满载与空商车 + 行进货郎
                    const useAge3 = rnd() < 0.5;
                    const marketBld = isAmericas
                        ? 'BUILDING:SETTLEMENT'
                        : isNomad
                            ? 'BUILDING:YURT_A'
                            : `BUILDING:${deStyle}_MARKET_${useAge3 ? 'AGE3' : 'AGE2'}`;
                    const smithBld = isAmericas
                        ? 'BUILDING:DARK_SETTLEMENT_AGE1'
                        : isNomad
                            ? 'BUILDING:YURT_B'
                            : `BUILDING:${deStyle}_BLACKSMITH_${useAge3 ? 'AGE3' : 'AGE2'}`;
                    pushRelic('DECAL_PATH_2', sx - 28, sy + 22, false, 0.96, -6, 0, false);
                    pushRelic('DECAL_PATH_3', sx + 125, sy + 38, false, 0.94, -6, 0, false);
                    pushRelic(pickUniqueFromPool([marketBld]), sx, sy, rnd() < 0.5, 0.76, 0, 0, true);

                    // 必配 1：铁匠铺/工坊
                    const smithSpot = findCompanionSpot(sx, sy, smithBld, companionWingOffsets, 430, 285);
                    if (smithSpot) {
                        clearTreesInRadius(smithSpot.x, smithSpot.y, 135);
                        glLayer.carveFoundation(smithSpot.x, smithSpot.y, VW, VH, 1.6);
                        pushRelic(pickUniqueFromPool([smithBld]), smithSpot.x, smithSpot.y, rnd() < 0.5, 0.74, 0, 0, false);
                    }
                    // 必配 2：1~2 间本文化商铺民居，斜向错落围合成自然集市聚落
                    let shopHousesPlaced = 0;
                    for (const [dx, dy] of shuffleOffsets(companionWingOffsets)) {
                        if (shopHousesPlaced >= 2) break;
                        const hx = sx + dx + Math.round((rnd() - 0.5) * 34);
                        const hy = sy + dy + Math.round((rnd() - 0.5) * 26);
                        const hAsset = culturalHousePool[(shopHousesPlaced + Math.floor(rnd() * culturalHousePool.length)) % culturalHousePool.length];
                        if (!canPlaceRelicItemAt(hAsset, hx, hy, 430, 285)) continue;
                        clearTreesInRadius(hx, hy, 125);
                        glLayer.carveFoundation(hx, hy, VW, VH, 1.4);
                        pushRelic(hAsset, hx, hy, rnd() < 0.5, 0.75, 0, 0, false);
                        shopHousesPlaced++;
                    }
                    // 配套陈设：集市门口波斯地毯 + 铁匠铺旁货桶 + 满载商车 + 空商车/行商货郎
                    const rugSpot = findCompanionSpot(sx, sy, 'RUGS', [[88, 56], [-88, 56], [0, 88]], 430, 285, mainAnchor);
                    if (rugSpot) {
                        pushRelic('RUGS', rugSpot.x, rugSpot.y, rnd() < 0.5, 0.84, -6, Math.floor(rnd() * 4), false);
                    }
                    const barrelSpot = findCompanionSpot(sx, sy, 'BARRELS', [[115, -24], [-115, -24], [128, 32], [-128, 32]], 430, 285, mainAnchor);
                    if (barrelSpot) {
                        pushRelic('BARRELS', barrelSpot.x, barrelSpot.y, rnd() < 0.5, 0.78, 0, 0, false);
                    }
                    const cartSpot = findCompanionSpot(sx, sy, loadedCartAsset, [[-145, 58], [145, 58], [-155, -28], [155, -28]], 430, 285, mainAnchor);
                    if (cartSpot) {
                        pushRelic(rnd() < 0.65 ? loadedCartAsset : emptyCartAsset, cartSpot.x, cartSpot.y, rnd() < 0.5, 0.82, 0, 0, false);
                    }
                    const merchAsset = isNomad ? 'TRADE:MULE_CART/move_2' : merchantAsset;
                    const merchSpot = findCompanionSpot(sx, sy, merchAsset, [[115, 78], [-115, 78], [0, 112], [165, 22]], 430, 285, mainAnchor);
                    if (merchSpot) {
                        pushRelic(merchAsset, merchSpot.x, merchSpot.y, rnd() < 0.5, 0.84, 0, 0, false);
                    }
                } else if (cKind === 'military_outpost_compound') {
                    // DE 要塞/城堡军营配套组合：主堡（本文明专属城堡/塔楼/攻城器厂；木堡 WOODEN_FORT 严格仅限斯拉夫/东欧/北欧林地）+ 本文化驻军兵营/靶场 + 军械铁匠铺/箭塔 + 弧形木栅拒马防线 + 军需木桶/辎重车 + 战旗与火把
                    const civCastleAsset = `BUILDING:${this.castleAssetFor(deStyle, defRec?.id ?? null)}`;
                    const fortPool = isTibet
                        ? ['BUILDING:TIBET_CASTLE_AGE3', 'BUILDING:PURU_TOWER_AGE3', 'BUILDING:PURU_SIEGE_WORKSHOP_AGE3']
                        : isNomad
                            ? ['BUILDING:YURT_A', 'BUILDING:YURT_E', 'BUILDING:OUTPOST']
                            : isAmericas
                                ? [civCastleAsset, `BUILDING:${deStyle}_TOWER_AGE3`, `BUILDING:${deStyle}_SIEGE_WORKSHOP_AGE3`, 'BUILDING:SETTLEMENT']
                                : (deStyle === 'SLAV' || deStyle === 'EAST' || isPaganNorth)
                                    ? [civCastleAsset, 'BUILDING:POENARI_CASTLE', 'BUILDING:WOODEN_FORT', 'BUILDING:FORTIFIED_OUTPOST', `BUILDING:${deStyle}_TOWER_AGE3`]
                                    : [civCastleAsset, `BUILDING:${deStyle}_TOWER_AGE3`, `BUILDING:${deStyle}_SIEGE_WORKSHOP_AGE3`, `BUILDING:${deStyle}_BARRACKS_AGE3`];
                    const garrisonBarracksAsset = isTibet
                        ? (rnd() < 0.5 ? 'BUILDING:PURU_BARRACKS_AGE2' : 'BUILDING:PURU_ARCHERY_RANGE_AGE2')
                        : isNomad
                            ? 'BUILDING:YURT_B'
                            : isAmericas
                                ? (rnd() < 0.5 ? `BUILDING:${deStyle}_BARRACKS_AGE2` : `BUILDING:${deStyle}_ARCHERY_RANGE_AGE2`)
                                : (isGrecoRoman && rnd() < 0.4)
                                    ? 'BUILDING:GREEK_WAR_TENT'
                                    : (rnd() < 0.5 ? `BUILDING:${deStyle}_BARRACKS_AGE2` : `BUILDING:${deStyle}_ARCHERY_RANGE_AGE2`);
                    const garrisonAuxAsset = isTibet
                        ? (rnd() < 0.5 ? 'BUILDING:PURU_BLACKSMITH_AGE2' : 'BUILDING:PURU_TOWER_AGE2')
                        : isNomad
                            ? 'BUILDING:YURT_C'
                            : isAmericas
                                ? (rnd() < 0.5 ? `BUILDING:${deStyle}_BLACKSMITH_AGE2` : `BUILDING:${deStyle}_TOWER_AGE2`)
                                : (rnd() < 0.5 ? `BUILDING:${deStyle}_BLACKSMITH_AGE2` : (rnd() < 0.5 ? `BUILDING:${deStyle}_TOWER_AGE2` : `BUILDING:${deStyle}_STABLE_AGE2`));
                    const mainFort = pickUniqueFromPool(fortPool);
                    const mainScale = mainFort.includes('CASTLE') ? 0.72 : 0.78;
                    pushRelic('DECAL_PATH_2', sx, sy + 24, false, 0.95, -6, 0, false);
                    pushRelic(mainFort, sx, sy, rnd() < 0.5, mainScale, 0, 0, true);

                    // 必配 1：驻军营房 / 军帐
                    const barracksSpot = findCompanionSpot(sx, sy, garrisonBarracksAsset, companionWingOffsets, 430, 285);
                    if (barracksSpot) {
                        clearTreesInRadius(barracksSpot.x, barracksSpot.y, 135);
                        glLayer.carveFoundation(barracksSpot.x, barracksSpot.y, VW, VH, 1.6);
                        pushRelic(garrisonBarracksAsset, barracksSpot.x, barracksSpot.y, rnd() < 0.5, 0.76, 0, 0, false);
                    }
                    // 必配 2：附属哨塔 / 军械铁匠铺 / 副帐（拱卫主城堡/要塞，绝不让城堡孤立）
                    const auxSpot = findCompanionSpot(sx, sy, garrisonAuxAsset, companionWingOffsets, 430, 285);
                    if (auxSpot) {
                        clearTreesInRadius(auxSpot.x, auxSpot.y, 125);
                        glLayer.carveFoundation(auxSpot.x, auxSpot.y, VW, VH, 1.5);
                        pushRelic(garrisonAuxAsset, auxSpot.x, auxSpot.y, rnd() < 0.5, 0.75, 0, 0, false);
                    }
                    // 朝向战场中心一侧布置 3 段相连的木栅拒马工事
                    const toCenterX = cx >= sx ? 1 : -1;
                    const toCenterY = cy >= sy ? 1 : -1;
                    const palisadeOffsets: ReadonlyArray<readonly [number, number]> = [
                        [toCenterX * 135, toCenterY * 54],
                        [toCenterX * 62, toCenterY * 92],
                        [toCenterX * 175, toCenterY * 14],
                    ];
                    for (let pi = 0; pi < palisadeOffsets.length; pi++) {
                        const px = sx + palisadeOffsets[pi][0], py = sy + palisadeOffsets[pi][1];
                        const pAsset = pi === 1 ? 'BATTLEFIELD:BARRICADE_A' : 'BATTLEFIELD:STAKE_BARRICADE';
                        if (canPlaceRelicItemAt(pAsset, px, py, 420, 280, mainAnchor)) {
                            pushRelic(pAsset, px, py, toCenterX < 0, 0.84, 0, 0, false);
                        }
                    }
                    // 军需木桶、辎重车、战旗与火把
                    const barrelSpot = findCompanionSpot(sx, sy, 'BARRELS', [[-toCenterX * 115, 28], [toCenterX * 115, -36], [0, -98]], 430, 285, mainAnchor);
                    if (barrelSpot) {
                        pushRelic('BARRELS', barrelSpot.x, barrelSpot.y, rnd() < 0.5, 0.78, 0, 0, false);
                    }
                    const cartSpot = findCompanionSpot(sx, sy, emptyCartAsset, [[-toCenterX * 148, -32], [-toCenterX * 138, 56]], 430, 285, mainAnchor);
                    if (cartSpot) {
                        pushRelic(emptyCartAsset, cartSpot.x, cartSpot.y, rnd() < 0.5, 0.80, 0, 0, false);
                    }
                    const flagAsset = flagPool[Math.floor(rnd() * flagPool.length)];
                    const flagSpot = findCompanionSpot(sx, sy, flagAsset, [[toCenterX * 108, -34], [-toCenterX * 108, -34], [0, 96]], 430, 285, mainAnchor);
                    if (flagSpot) {
                        pushRelic(flagAsset, flagSpot.x, flagSpot.y, rnd() < 0.5, 0.82, 0, 0, false);
                    }
                    const torchSpot = findCompanionSpot(sx, sy, 'BATTLEFIELD:TORCH_A', [[toCenterX * 96, 46], [-toCenterX * 96, 46]], 430, 285, mainAnchor);
                    if (torchSpot) {
                        pushRelic('BATTLEFIELD:TORCH_A', torchSpot.x, torchSpot.y, rnd() < 0.5, 0.84, 0, 0, false);
                    }
                } else {
                    // DE 宗教圣地院落配套组合：修道院/古塔/大佛/遗迹主建筑 + 配套僧舍/偏殿/祭坛 + 石径 + 对称花坛 + 鸟居/雕像/幡旗
                    const mAsset = pickUniqueFromPool(monumentPool);
                    const mScale = /AMPHITHEATRE|COLOSSEUM|ARCH_OF_CONSTANTINE|SANCHI_STUPA|CATHEDRAL|GREAT_PYRAMID|DOME_OF_THE_ROCK|GOL_GUMBAZ/.test(mAsset)
                        ? 0.68
                        : 0.80;
                    pushRelic('DECAL_PATH_4', sx, sy + 28, false, 0.92, -6, 0, false);
                    pushRelic(mAsset, sx, sy, rnd() < 0.5, mScale, 0, 0, true);

                    // 必配附属建筑：配套僧舍/偏殿/祭坛（使宗教圣地形成完整院落，不孤零零单立）
                    const shrineWingAsset = isTibet
                        ? (mAsset === 'BUILDING:SCEN_PAGODA_C' ? 'BUILDING:SCEN_BUDDHA_STATUE' : 'BUILDING:SCEN_PAGODA_C')
                        : isNomad
                            ? 'BUILDING:PAGAN_SHRINE'
                            : isGrecoRoman
                                ? 'BUILDING:SCEN_HERO_SHRINE'
                                : (!mAsset.includes('MONASTERY') && !isNomad)
                                    ? `BUILDING:${deStyle}_MONASTERY_AGE3`
                                    : culturalHousePool[0];
                    const wingSpot = findCompanionSpot(sx, sy, shrineWingAsset, companionWingOffsets, 430, 285);
                    if (wingSpot) {
                        clearTreesInRadius(wingSpot.x, wingSpot.y, 130);
                        glLayer.carveFoundation(wingSpot.x, wingSpot.y, VW, VH, 1.5);
                        pushRelic(shrineWingAsset, wingSpot.x, wingSpot.y, rnd() < 0.5, 0.74, 0, 0, false);
                    }
                    if (!isSnow) {
                        const fbLeft = findCompanionSpot(sx, sy, 'FLOWERBED', [[-105, 48], [-125, 36], [-92, 64]], 430, 285, mainAnchor);
                        if (fbLeft) {
                            pushRelic('FLOWERBED', fbLeft.x, fbLeft.y, false, 0.84, -6, 0, false);
                        }
                        const fbRight = findCompanionSpot(sx, sy, 'FLOWERBED', [[105, 48], [125, 36], [92, 64]], 430, 285, mainAnchor);
                        if (fbRight) {
                            pushRelic('FLOWERBED', fbRight.x, fbRight.y, true, 0.84, -6, 1, false);
                        }
                    }
                    // 神道鸟居（SCEN_TORII_GATE）严格仅限日本文化；希罗神庙前院配 1 尊古希腊英雄雕像；其余配祭祀幡旗
                    if (isJapan && mAsset !== 'BUILDING:SCEN_BUDDHA_STATUE') {
                        const toriiSpot = findCompanionSpot(sx, sy, 'BUILDING:SCEN_TORII_GATE', [[0, 145], [145, 72], [-145, 72]], 430, 285, mainAnchor);
                        if (toriiSpot) {
                            pushRelic('BUILDING:SCEN_TORII_GATE', toriiSpot.x, toriiSpot.y, false, 0.76, 0, 0, false);
                        }
                    } else if (isGrecoRoman) {
                        const greekStatues = [
                            'BUILDING:SCEN_STATUE_ALEXANDER',
                            'BUILDING:SCEN_STATUE_HEPHAISTION',
                            'BUILDING:SCEN_STATUE_GREEK_HERO',
                            'BUILDING:SCEN_STATUE_ARES_MARBLE',
                            'BUILDING:SCEN_STATUE_ARES_PAINTED',
                        ];
                        const stAsset = pickUniqueFromPool(greekStatues);
                        const stSpot = findCompanionSpot(sx, sy, stAsset, [[0, 118], [125, 58], [-125, 58]], 430, 285, mainAnchor);
                        if (stSpot) {
                            pushRelic(stAsset, stSpot.x, stSpot.y, rnd() < 0.5, 0.78, 0, 0, false);
                        }
                    } else {
                        const fAsset = flagPool[Math.floor(rnd() * flagPool.length)];
                        const fSpot = findCompanionSpot(sx, sy, fAsset, [[0, 112], [118, 52], [-118, 52]], 430, 285, mainAnchor);
                        if (fSpot) {
                            pushRelic(fAsset, fSpot.x, fSpot.y, rnd() < 0.5, 0.80, 0, 0, false);
                        }
                    }
                }
                compoundsPlaced++;
                break;
            }
        }
    }

    // ── 5. DE 岸线渡口船坞、近岸鱼群簇与远岸浅滩沉船礁石（仅在有河流/海洋的地图依水生成） ──
    {
        const N = glLayer.data?.width ?? 120;
        const isSeaBattle = this.environmentPlan?.waterKind === 'sea';
        const cosMapLat = Math.max(0.25, Math.cos(mapLat * Math.PI / 180));
        const WHALE_OFFSHORE_DIRS: ReadonlyArray<readonly [number, number]> = [
            [0, 0], [1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707],
            [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707],
        ];
        // 🔴 [2026-11-08 主人令「河边放一个搁浅的海鲸鱼不合适吧，看看DE是如何摆放的。请照着摆放。请组合摆放。」]
        //    1) 严禁在江河/内湖岸边摆放搁浅海鲸鱼（BEACHED_WHALE）或活鲸（RESOURCE:WHALE）：
        //       两者仅在濒临远岸深海（canSpawnDeepSeaWhaleOrNessie 为真）的海洋战场（waterKind === 'sea'）才允许出现；
        //    2) 严禁孤零零单摆一个搁浅物/船坞：一律按 DE 战役海岸/河滩组合造景成套摆放。
        const isFrozenWater = glLayer.isIce || isSnow || /^(ic2|ic3|ice)/i.test(String(this.environmentPlan?.groundTiles?.water ?? ''));
        const allowOceanWhale = !isFrozenWater && isSeaBattle && WHALE_OFFSHORE_DIRS.some(([dy, dx]) =>
            canSpawnDeepSeaWhaleOrNessie(mapLat + dy * 0.65, mapLng + (dx * 0.65) / cosMapLat),
        );

        const shoreSpots: Array<{ x: number; y: number; waterX: number; waterY: number; landX: number; landY: number }> = [];
        for (let gy = 6; gy <= N - 6; gy += 3) {
            for (let gx = 6; gx <= N - 6; gx += 3) {
                const wDens = glLayer.getWaterDensityAt(gx, gy);
                if (wDens < 0.22 || wDens > 0.68) continue;
                const pt = glLayer.cellToScreen(gx + 0.5, gy + 0.5, VW, VH);
                if (Math.abs(pt.y - cy) < 280) continue;
                if (this.spawns.some((sp) => Math.hypot(pt.x - sp.x, (pt.y - sp.y) * 1.4) < 420)) continue;
                let wPt: { x: number; y: number } | null = null;
                let lPt: { x: number; y: number } | null = null;
                for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]] as const) {
                    const nd = glLayer.getWaterDensityAt(gx + dx, gy + dy);
                    if (nd >= 0.52 && !wPt) wPt = glLayer.cellToScreen(gx + 0.5 + dx, gy + 0.5 + dy, VW, VH);
                    if (nd <= 0.12 && !lPt) lPt = glLayer.cellToScreen(gx + 0.5 + dx, gy + 0.5 + dy, VW, VH);
                }
                if (wPt && lPt) {
                    shoreSpots.push({ x: pt.x, y: pt.y, waterX: wPt.x, waterY: wPt.y, landX: lPt.x, landY: lPt.y });
                }
            }
        }
        if (shoreSpots.length > 0) {
            shoreSpots.sort(() => rnd() - 0.5);
            const aquaticPool = isSeaBattle
                ? [
                    'RESOURCE:DORADO_FISH', 'RESOURCE:MARLIN_FISH', 'RESOURCE:TUNA_FISH',
                    'RESOURCE:SNAPPER_FISH', 'RESOURCE:SHORE_FISH', 'RESOURCE:BOX_TURTLES',
                    'RESOURCE:DOLPHIN', 'RESOURCE:OYSTERS',
                    ...(allowOceanWhale ? ['RESOURCE:WHALE'] : []),
                ]
                : ['RESOURCE:SALMON_FISH', 'RESOURCE:PERCH_FISH', 'RESOURCE:SHORE_FISH', 'RESOURCE:BOX_TURTLES', 'RESOURCE:WATER_LILY'];

            // (5a) DE 渡口船坞码头聚落组合：船坞/造船厂 + 岸上渔夫小屋 + 码头货桶 + 停泊本文化舟船 + 近岸芦苇/海藻 + 双鱼群簇
            if (!isNomad) {
                const ferrySpot = shoreSpots[0];
                clearTreesInRadius(ferrySpot.x, ferrySpot.y, 130);
                clearTreesInRadius(ferrySpot.landX, ferrySpot.landY, 110);
                const dockPool = deStyle === 'YURT'
                    ? ['BUILDING:ASIA_DOCK_AGE2']
                    : isGrecoRoman
                        ? [`BUILDING:${deStyle}_DOCK_AGE2`, 'BUILDING:GREEK_SHIPYARD_AGE2', 'BUILDING:THRACIAN_SHIPYARD_AGE2']
                        : [`BUILDING:${deStyle}_DOCK_AGE2`];
                const boatPool = (isAmericas || deStyle === 'AFRI')
                    ? ['TRADE:CANOE/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                    : (isEastAsia || deStyle === 'SEAS')
                        ? ['TRADE:JUNK/idle_2', 'TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                        : (deStyle === 'WEST' || deStyle === 'CEAS' || deStyle === 'EAST' || deStyle === 'SLAV')
                            ? ['TRADE:TRADE_COG/idle_2', 'TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                            : ['TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2', 'TRADE:CANOE/idle_2'];
                pushRelic(pickUniqueFromPool(dockPool), ferrySpot.x, ferrySpot.y, rnd() < 0.5, 0.78, 0, 0, true);
                // 停泊舟船
                pushRelic(
                    pickUniqueFromPool(boatPool),
                    (ferrySpot.x + ferrySpot.waterX) * 0.5,
                    (ferrySpot.y + ferrySpot.waterY) * 0.5,
                    rnd() < 0.5,
                    0.75,
                    0,
                    0,
                    false,
                );
                // 岸上配套：码头货桶 + 渔夫民居（斜向高低错开，不与船坞平行并列）
                pushRelic('BARRELS', (ferrySpot.x + ferrySpot.landX) * 0.5 + 24, (ferrySpot.y + ferrySpot.landY) * 0.5 + 10, rnd() < 0.5, 0.76, 0, 0, false);
                let fisherX = ferrySpot.landX + Math.round((rnd() - 0.5) * 32);
                let fisherY = ferrySpot.landY + Math.round((rnd() - 0.5) * 24);
                if (Math.abs(fisherY - ferrySpot.y) < 82) {
                    fisherY = ferrySpot.y + (fisherY >= ferrySpot.y ? 96 : -96);
                }
                if (Math.abs(fisherX - ferrySpot.x) < 86) {
                    fisherX = ferrySpot.x + (fisherX >= ferrySpot.x ? 104 : -104);
                }
                if (canPlaceRelicItemAt(culturalHousePool[0], fisherX, fisherY, 420, 280)) {
                    glLayer.carveFoundation(fisherX, fisherY, VW, VH, 1.3);
                    pushRelic(culturalHousePool[Math.floor(rnd() * culturalHousePool.length)], fisherX, fisherY, rnd() < 0.5, 0.74, 0, 0, false);
                }
                // 浅水岸线植被（河岸芦苇 REEDS / 海岸海带 KELP_SEAWEEDS）+ 成簇鱼群（封冻冰面绝不放跃水鱼群与水草）
                if (!isFrozenWater) {
                    pushRelic(
                        isSeaBattle ? 'KELP_SEAWEEDS' : 'REEDS',
                        (ferrySpot.x + ferrySpot.waterX) * 0.5 - 38,
                        (ferrySpot.y + ferrySpot.waterY) * 0.5 + 18,
                        rnd() < 0.5,
                        0.84,
                        -1,
                        Math.floor(rnd() * 8),
                        false,
                    );
                    const fish1 = pickUniqueFromPool(aquaticPool);
                    pushRelic(fish1, ferrySpot.waterX, ferrySpot.waterY, false, fish1 === 'RESOURCE:WHALE' ? 0.72 : 0.85, fish1 === 'RESOURCE:WATER_LILY' || fish1 === 'RESOURCE:OYSTERS' ? -6 : -1, Math.floor(rnd() * 12), false);
                    const fish2 = pickUniqueFromPool(aquaticPool);
                    pushRelic(fish2, ferrySpot.waterX - 42, ferrySpot.waterY + 20, false, fish2 === 'RESOURCE:WHALE' ? 0.72 : 0.82, fish2 === 'RESOURCE:WATER_LILY' || fish2 === 'RESOURCE:OYSTERS' ? -6 : -1, Math.floor(rnd() * 12), false);
                }
            }

            // (5b) DE 海岸/河滩浅滩组合造景（严格区分海洋与内陆江河，且成组配套摆放，绝不单摆一只鲸鱼或一截残骸）
            const wreckPool = isSeaBattle
                ? (isAmericas
                    ? [
                        'BATTLEFIELD:SHIPWRECK_A',
                        'BATTLEFIELD:SHIPWRECK_B',
                        ...(allowOceanWhale ? ['BATTLEFIELD:BEACHED_WHALE'] : []),
                    ]
                    : [
                        'BATTLEFIELD:GALLEY_WRECK',
                        'BATTLEFIELD:CATAPULT_SHIP_WRECK',
                        'BATTLEFIELD:TRADE_SHIP_WRECK',
                        'BATTLEFIELD:SHIPWRECK_A',
                        'BATTLEFIELD:SHIPWRECK_B',
                        'BATTLEFIELD:LEVIATHAN_WRECK',
                        ...(allowOceanWhale ? ['BATTLEFIELD:BEACHED_WHALE'] : []),
                    ])
                : (isAmericas
                    ? ['BATTLEFIELD:SHIPWRECK_A', 'BATTLEFIELD:SHIPWRECK_B']
                    : ['BATTLEFIELD:SHIPWRECK_A', 'BATTLEFIELD:SHIPWRECK_B', 'BATTLEFIELD:TRADE_SHIP_WRECK', 'BATTLEFIELD:GALLEY_WRECK']);

            let wrecksPlaced = 0;
            for (let si = 1; si < shoreSpots.length && wrecksPlaced < 1; si++) {
                const ws = shoreSpots[si];
                if (placedPts.some((p) => Math.hypot(p.x - ws.x, (p.y - ws.y) * 1.4) < 520)) continue;
                const wAsset = pickUniqueFromPool(wreckPool);
                const alongX = ws.waterY - ws.y;
                const alongY = -(ws.waterX - ws.x) * 0.5;
                const aLen = Math.hypot(alongX, alongY) || 1;
                const tx = alongX / aLen;
                const ty = alongY / aLen;

                if (wAsset === 'BATTLEFIELD:BEACHED_WHALE') {
                    // DE 远洋海滩搁浅鲸群组合：主搁浅巨鲸 + 伴生幼鲸 + 巨兽白骨 + 岸际礁石 + 海藻/牡蛎礁 + 伴生鱼群
                    const mainDir = Math.floor(rnd() * 8);
                    pushRelic('BATTLEFIELD:BEACHED_WHALE', ws.x, ws.y, false, 0.86, 0, mainDir, true);
                    const subDir = (mainDir + (rnd() < 0.5 ? 1 : 7)) % 8;
                    pushRelic(
                        'BATTLEFIELD:BEACHED_WHALE',
                        ws.x + tx * 88 + (ws.x - ws.waterX) * 0.18,
                        ws.y + ty * 44 + (ws.y - ws.waterY) * 0.18,
                        false,
                        0.68,
                        0,
                        subDir,
                        false,
                    );
                    pushRelic(
                        'BATTLEFIELD:ANIMAL_SKELETON',
                        ws.x - tx * 76 + (ws.landX - ws.x) * 0.35,
                        ws.y - ty * 38 + (ws.landY - ws.y) * 0.35,
                        rnd() < 0.5,
                        0.84,
                        0,
                        0,
                        false,
                    );
                    // 岸际礁石与海带/牡蛎礁
                    pushRelic(
                        rnd() < 0.5 ? 'RESOURCE:SEA_ROCK1' : 'RESOURCE:SEA_ROCK2',
                        (ws.x + ws.waterX) * 0.5 - tx * 52,
                        (ws.y + ws.waterY) * 0.5 - ty * 26,
                        rnd() < 0.5,
                        0.82,
                        0,
                        Math.floor(rnd() * 4),
                        false,
                    );
                    pushRelic(
                        'RESOURCE:OYSTERS',
                        (ws.x + ws.waterX) * 0.5 + tx * 46,
                        (ws.y + ws.waterY) * 0.5 + ty * 24,
                        rnd() < 0.5,
                        0.82,
                        -6,
                        0,
                        false,
                    );
                    pushRelic(
                        'KELP_SEAWEEDS',
                        ws.waterX - tx * 34,
                        ws.waterY - ty * 18,
                        rnd() < 0.5,
                        0.85,
                        -1,
                        Math.floor(rnd() * 16),
                        false,
                    );
                } else {
                    // DE 沉船浅滩组合：主沉船残骸 + 伴生次级破船壳/折断木排 + 散落木桶物资 + 撞击暗礁 + 芦苇/水草 + 伴生鱼群
                    pushRelic(wAsset, ws.x, ws.y, rnd() < 0.5, 0.85, 0, 0, true);
                    const subWreck = wAsset === 'BATTLEFIELD:SHIPWRECK_A' ? 'BATTLEFIELD:SHIPWRECK_B' : 'BATTLEFIELD:SHIPWRECK_A';
                    pushRelic(
                        subWreck,
                        (ws.x + ws.waterX) * 0.5 + tx * 76,
                        (ws.y + ws.waterY) * 0.5 + ty * 38,
                        rnd() < 0.5,
                        0.74,
                        0,
                        0,
                        false,
                    );
                    // 冲上浅滩的散落货桶与破碎木料
                    pushRelic(
                        'BARRELS',
                        (ws.x + ws.landX) * 0.5 - tx * 44,
                        (ws.y + ws.landY) * 0.5 - ty * 22,
                        rnd() < 0.5,
                        0.76,
                        0,
                        0,
                        false,
                    );
                    pushRelic(
                        'BATTLEFIELD:FENCE_RUBBLE',
                        (ws.x + ws.landX) * 0.5 + tx * 48,
                        (ws.y + ws.landY) * 0.5 + ty * 24,
                        rnd() < 0.5,
                        0.80,
                        0,
                        Math.floor(rnd() * 5),
                        false,
                    );
                    // 肇事浅滩暗礁 + 岸边芦苇/海藻（封冻冰面不长水草）
                    pushRelic(
                        rnd() < 0.5 ? 'RESOURCE:SEA_ROCK1' : 'RESOURCE:SEA_ROCK2',
                        ws.waterX,
                        ws.waterY,
                        rnd() < 0.5,
                        0.82,
                        0,
                        Math.floor(rnd() * 4),
                        false,
                    );
                    if (!isFrozenWater) {
                        pushRelic(
                            isSeaBattle ? 'KELP_SEAWEEDS' : 'REEDS',
                            (ws.x + ws.waterX) * 0.5 - tx * 58,
                            (ws.y + ws.waterY) * 0.5 - ty * 28,
                            rnd() < 0.5,
                            0.84,
                            -1,
                            Math.floor(rnd() * 8),
                            false,
                        );
                    }
                }

                if (!isFrozenWater) {
                    const aqAsset = pickUniqueFromPool(aquaticPool);
                    pushRelic(
                        aqAsset,
                        ws.waterX + 36,
                        ws.waterY + 16,
                        false,
                        aqAsset === 'RESOURCE:WHALE' ? 0.72 : 0.84,
                        aqAsset === 'RESOURCE:WATER_LILY' || aqAsset === 'RESOURCE:OYSTERS' ? -6 : -1,
                        Math.floor(rnd() * 12),
                        false,
                    );
                }
                wrecksPlaced++;
            }
        }
    }

    // ── 6. DE 古战场战损遗迹簇（在交锋区外沿成组布置「本文明损毁攻城器械 + 地面弹坑裂隙 + 破损拒马/白骨」，绝不混进村落） ──
    {
        const debrisCompanionPool = [
            'BATTLEFIELD:BARRICADE_RUBBLE_A',
            'BATTLEFIELD:BARRICADE_RUBBLE_B',
            'BATTLEFIELD:BARRICADE_RUBBLE_C',
            'BATTLEFIELD:BARRICADE_RUBBLE_D',
            'BATTLEFIELD:FENCE_BROKEN_A',
            'BATTLEFIELD:FENCE_BROKEN_B',
            ...(isAmericas ? [] : ['BATTLEFIELD:CART_BROKEN']),
            'BATTLEFIELD:SKELETON_BATTLEFIELD',
            'BATTLEFIELD:SKELETON_SOLDIER',
            'BATTLEFIELD:ANIMAL_SKELETON',
            'BATTLEFIELD:IMPALED_CORPSE',
            ...(isGrecoRoman ? ['BATTLEFIELD:IMPALED_CORPSE_ANT'] : []),
            'BATTLEFIELD:GRAVES',
            'BUILDING:SCEN_GRAVES',
        ];
        const geoPool = isSnow
            ? ['DECAL_ICE', 'RESOURCE:SALT_ICE_DECAL', 'DECAL_CRACK']
            : isArid
                ? ['RESOURCE:SALT_CRACK', 'RESOURCE:SULFUR_CRATER', 'DECAL_CRACK', 'DECAL_CRATER']
                : ['DECAL_CRATER', 'DECAL_CRACK', 'RESOURCE:SULFUR_CRATER', 'RESOURCE:SALT_CRACK'];

        const wreckClusters = 2 + (rnd() < 0.5 ? 1 : 0);
        for (let i = 0; i < wreckClusters; i++) {
            const pt = pickRandomScatterSpot(480, 470, 315);
            if (!pt) continue;
            const decalAsset = pickUniqueFromPool(geoPool);
            const mainWreck = pickUniqueFromPool(siegeWrecks);
            const wAnchor = { x: pt.x, y: pt.y, minIsoDist: 56 };
            pushRelic(decalAsset, pt.x, pt.y + 6, rnd() < 0.5, 0.90, -6, 0, false);
            pushRelic(mainWreck, pt.x, pt.y, rnd() < 0.5, 0.88, 0, 0, true);
            const compSpot = findCompanionSpot(pt.x, pt.y, 'BATTLEFIELD:BARRICADE_RUBBLE_A', [[54, 22], [-54, 22], [48, -20], [-48, -20]], 450, 300, wAnchor);
            if (compSpot) {
                pushRelic(pickUniqueFromPool(debrisCompanionPool), compSpot.x, compSpot.y, rnd() < 0.5, 0.86, 0, 0, false);
            }
        }
    }

    glLayer.flushFoundation();
    this.tacticalAnimals = syncTradeCartAnimals(
        this.decorSprites,
        this.tacticalAnimals,
        (a) => this.ensureNatureAsset(a),
    );
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
        if (!/STAKE_BARRICADE|BARRICADE_RUBBLE|BARRICADE_|FENCE_BROKEN/.test(String(sp.asset))) return true;
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


/**
 * 补齐野战与攻城战首屏及近翼的 DE 三层微景观体系（Arabia.rms SOLID_OBJECT + AESTHETIC_FLAT + AESTHETIC_SCATTER）：
 *   · 解决此前 applyDeCityToGround 仅在有城池（this.deCity）时执行、导致所有野战（如伊普苏斯之战）跳过微景观生成的问题；
 *   · 在高地斜坡与山梁边缘优先布置伴生岩石与灌木（④ 高地斜坡伴生石块）；
 *   · 在 100% 首屏视野及近翼均匀补齐成簇花草灌木与散生草丛（③ 首屏补齐低矮花草碎石微装饰）。
 */
function populateBattlefieldMicroDecor(
    this: Scene13WarLayer,
    glLayer: Scene13GroundLayerGL,
    VW: number,
    VH: number,
    baseTerrain: string,
    decorSet: { scatter: readonly string[]; flat: readonly string[]; solid: readonly string[] },
    decorCtx: { lat: number; lng: number; season: 0 | 1 | 2; winterSnow: boolean; isSiege: boolean },
    onFoundation: (x: number, y: number) => boolean,
): void {
    const validFlat = decorSet.flat.filter((a) => decorFits(a, decorCtx));
    const validSolid = decorSet.solid.filter((a) => decorFits(a, decorCtx));
    const validScatter = decorSet.scatter.filter((a) => decorFits(a, decorCtx));
    if (validFlat.length === 0 && validSolid.length === 0 && validScatter.length === 0) return;

    const seedStr = `${this.defenderCityId || 'field'}_${Math.round(decorCtx.lat * 100)}_${Math.round(decorCtx.lng * 100)}_micro`;
    let mSeed = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
        mSeed = Math.imul(mSeed ^ seedStr.charCodeAt(i), 16777619) >>> 0;
    }
    const mRnd = (): number => {
        mSeed = Math.imul(mSeed ^ (mSeed >>> 15), 0x85ebca6b) >>> 0;
        mSeed = Math.imul(mSeed ^ (mSeed >>> 13), 0xc2b2ae35) >>> 0;
        return ((mSeed ^ (mSeed >>> 16)) >>> 0) / 4294967296;
    };

    const isField = !this.deCity;
    const cx = this.deCity ? this.deCityCenter.x : VW * 0.5;
    const cy = this.deCity ? this.deCityCenter.y : VH * 0.5;
    const cityRx = this.deCity ? this.deCity.width / 2 + 160 : 0;
    const cityRy = this.deCity ? this.deCity.height / 2 + 100 : 0;

    const isSafeMicroSpot = (sx: number, sy: number): boolean => {
        if (onFoundation(sx, sy)) return false;
        if (this.deCity && (((sx - cx) / cityRx) ** 2 + ((sy - cy) / cityRy) ** 2 <= 1.0)) return false;
        const wc = glLayer.screenToCell(sx, sy, VW, VH);
        if (!wc || glLayer.getWaterDensityAt(wc.gx, wc.gy) >= 0.18) return false;
        for (const sp of this.spawns) {
            if (Math.hypot(sx - sp.x, (sy - sp.y) * 1.4) < 160) return false;
        }
        return true;
    };

    const pushMicro = (asset: string, sx: number, sy: number, scale: number, extraZ = -1): boolean => {
        if (!isSafeMicroSpot(sx, sy)) return false;
        this.ensureNatureAsset(asset);
        const frame = Math.floor(mRnd() * 6);
        const flip = mRnd() < 0.5;
        const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
        this.decorSprites.push({
            asset,
            frame,
            x: sx,
            y: sy,
            flip,
            scale,
            layer: 'world',
            z: extraZ,
            lift,
            indestructible: true,
            obstruction: undefined,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        });
        return true;
    };

    const shuffle = <T>(arr: T[]): T[] => {
        const out = [...arr];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(mRnd() * (i + 1));
            const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
        }
        return out;
    };

    // 将全战场 [8, 112]×[8, 112] 划分为 4×4 共 16 个屏幕级空间分块（每块 26×26 格 ≈ 1 屏）+ 中心首屏桶：
    // 采用跨分块轮询交错（Round-Robin Interleave），杜绝配额在中心 14 格内被一次性耗尽，保证无论镜头在中央、西南营、东北营或侧翼行军走廊，每一屏都有均衡的岩石+灌木簇与散生花草。
    type Spot = { x: number; y: number; dist: number; sec: number; isSlope: boolean };
    const sectorSlopes: Spot[][] = Array.from({ length: 16 }, () => []);
    const sectorPlains: Spot[][] = Array.from({ length: 16 }, () => []);
    const centerSlopes: Spot[] = [];
    const centerPlains: Spot[] = [];

    for (let gy = 8; gy <= 112; gy += 2) {
        for (let gx = 8; gx <= 112; gx += 2) {
            const dCells = Math.hypot(gx - 60, gy - 60);
            if (dCells > 50) continue;
            const pt = glLayer.cellToScreen(gx + 0.5, gy + 0.5, VW, VH);
            if (!isSafeMicroSpot(pt.x, pt.y)) continue;

            const eC = glLayer.elevationLevelAt(pt.x, pt.y, VW, VH);
            const eR = glLayer.elevationLevelAt(pt.x + TAC_TILE_W, pt.y, VW, VH);
            const eD = glLayer.elevationLevelAt(pt.x, pt.y + TAC_TILE_H, VW, VH);
            const slope = Math.hypot(eR - eC, eD - eC);
            const isSlope = slope >= 0.30 || eC >= 0.85;
            const sec = Math.min(3, Math.floor((gy - 8) / 26)) * 4 + Math.min(3, Math.floor((gx - 8) / 26));
            const spot: Spot = { x: pt.x, y: pt.y, dist: dCells, sec, isSlope };

            if (dCells <= 15.0) {
                if (isSlope) centerSlopes.push(spot);
                else centerPlains.push(spot);
            } else {
                if (isSlope) sectorSlopes[sec].push(spot);
                else sectorPlains[sec].push(spot);
            }
        }
    }

    const interleaveBuckets = (buckets: Spot[][]): Spot[] => {
        const shuffledBuckets = buckets.map((b) => shuffle(b)).filter((b) => b.length > 0);
        const out: Spot[] = [];
        let maxLen = 0;
        for (const b of shuffledBuckets) {
            if (b.length > maxLen) maxLen = b.length;
        }
        for (let i = 0; i < maxLen; i++) {
            for (const b of shuffledBuckets) {
                if (i < b.length) out.push(b[i]);
            }
        }
        return out;
    };

    const secOrder = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    const rockBuckets: Spot[][] = [
        [...shuffle(centerSlopes), ...shuffle(centerPlains)],
        ...secOrder.map((s) => [...shuffle(sectorSlopes[s]), ...shuffle(sectorPlains[s])]),
    ];
    const flatBuckets: Spot[][] = [
        [...shuffle(centerPlains), ...shuffle(centerSlopes)],
        ...secOrder.map((s) => [...shuffle(sectorPlains[s]), ...shuffle(sectorSlopes[s])]),
    ];

    const rockCands = interleaveBuckets(rockBuckets);
    const flatCands = interleaveBuckets(flatBuckets);

    // 1. 高地斜坡与原野伴生岩石+灌木簇（④ 高地斜坡透出土石肌理与伴生石块，全图 16 分块均衡覆盖）
    //    先把底图烘焙与 applyDeCityToGround 已放的岩石纳入间距表，杜绝贴着既有石头再塞一块
    const placedRocks: Array<{ x: number; y: number }> = [];
    for (const sp of this.decorSprites) {
        if (/^(ROCK|MINE_STONE)/.test(sp.asset)) {
            placedRocks.push({ x: sp.x, y: sp.y });
        }
    }
    const targetRocks = isField ? 36 : 26;
    const minRockGap = isField ? 350 : 380;
    const rockPool = validSolid.length > 0 ? validSolid : ['ROCK1', 'ROCK2'];
    const isArid = /^(des|pal|qs|ds5|pal1)/i.test(baseTerrain);

    let microRocksAdded = 0;
    for (const rs of rockCands) {
        if (microRocksAdded >= targetRocks) break;
        if (placedRocks.some((p) => Math.hypot(p.x - rs.x, (p.y - rs.y) * 1.5) < minRockGap)) continue;
        const rockAsset = rockPool[Math.floor(mRnd() * rockPool.length)];
        if (pushMicro(rockAsset, rs.x, rs.y, 0.86 + mRnd() * 0.16, 0)) {
            placedRocks.push({ x: rs.x, y: rs.y });
            microRocksAdded++;
            const compPool = validFlat.length > 0 ? validFlat : (isArid ? ['GRASS_DRY'] : ['SHRUB_GREEN', 'GRASS_GREEN']);
            const comp1 = compPool[Math.floor(mRnd() * compPool.length)];
            pushMicro(comp1, rs.x + (mRnd() < 0.5 ? -24 : 24), rs.y + 10, 0.78, -1);
            if (validScatter.length > 0 && mRnd() < 0.75) {
                const sc = validScatter[Math.floor(mRnd() * validScatter.length)];
                pushMicro(sc, rs.x + (mRnd() < 0.5 ? 26 : -26), rs.y - 8, 0.80, -1);
            }
        }
    }

    // 2. 全战场成簇花草灌木微景（③ 首屏与各方向行军视野均补齐低矮花草碎石微装饰，group_placement_radius 2~3）
    if (validFlat.length > 0) {
        const placedFlats: Array<{ x: number; y: number }> = [];
        const targetFlats = isField ? 56 : 40;
        const minFlatGap = isField ? 230 : 250;
        for (const fs of flatCands) {
            if (placedFlats.length >= targetFlats) break;
            if (placedFlats.some((p) => Math.hypot(p.x - fs.x, (p.y - fs.y) * 1.5) < minFlatGap)) continue;
            const leadFlat = validFlat[Math.floor(mRnd() * validFlat.length)];
            if (pushMicro(leadFlat, fs.x, fs.y, 0.84 + mRnd() * 0.14, -1)) {
                placedFlats.push({ x: fs.x, y: fs.y });
                const subCount = 1 + Math.floor(mRnd() * 2);
                for (let s = 0; s < subCount; s++) {
                    const subAsset = validFlat[Math.floor(mRnd() * validFlat.length)];
                    const ang = mRnd() * Math.PI * 2;
                    const distPx = 22 + mRnd() * 28;
                    pushMicro(
                        subAsset,
                        fs.x + Math.cos(ang) * distPx,
                        fs.y + Math.sin(ang) * distPx * 0.5,
                        0.74 + mRnd() * 0.14,
                        -1,
                    );
                }
            }
        }
    }

    // 3. 全战场散生草丛（DE AESTHETIC_SCATTER，16 分块轮询铺开）
    if (validScatter.length > 0) {
        const targetScatter = isField ? 88 : 60;
        const placedScatters: Array<{ x: number; y: number }> = [];
        let scatterPlaced = 0;
        for (const sp of flatCands) {
            if (scatterPlaced >= targetScatter) break;
            if (placedScatters.some((p) => Math.hypot(p.x - sp.x, (p.y - sp.y) * 1.5) < 150)) continue;
            const scAsset = validScatter[scatterPlaced % validScatter.length];
            const jx = (mRnd() - 0.5) * 42;
            const jy = (mRnd() - 0.5) * 22;
            if (pushMicro(scAsset, sp.x + jx, sp.y + jy, 0.78 + mRnd() * 0.14, -1)) {
                placedScatters.push({ x: sp.x, y: sp.y });
                scatterPlaced++;
            }
        }
    }
}

/**
 * 战术地图尼斯湖水怪（DE a_nessie）：只放在宽阔的天然水面（海、湖、大河），不放护城河 / 引水渠。
 *   · 候选格：自身水体密度 ≥0.6，四周 2 格内全是水（窄河、护城河自然排除），3 格内没有护城河格；
 *   · 离双方出兵点 ≥ 700px（开局不被立刻惊走）；
 *   · 宽阔水面 1 只，特大水面（≥300 个候选格）2 只，彼此相隔 ≥ 1500px；
 *   · 行为与陆地动物同一套（stepTacticalAnimals）：见兵就潜游远离，aquatic 约束保证不上岸、不进护城河。
 */
function spawnTacticalNessie(this: Scene13WarLayer, glLayer: Scene13GroundLayerGL, VW: number, VH: number): void {
    // 🔴 [2026-11-01 主人令「这里有鲸鱼吗，如果没有的话，也不能有海怪」]
    //    海怪与战略图鲸鱼同源：仅在濒临远岸深海（有鲸鱼分布）的海域战场才允许生成；
    //    内陆河湖、爱琴海等群岛浅海（无鲸鱼）一概不出海怪。
    if (this.environmentPlan?.waterKind !== 'sea' || glLayer.isIce || /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(String(this.environmentPlan?.baseTerrain ?? ''))) return;
    const defRec = this.defenderCityRecord();
    const lat = defRec?.lat ?? this.centerLat ?? 30;
    const lng = defRec?.lng ?? this.centerLng ?? 110;
    const cosLat = Math.max(0.25, Math.cos(lat * Math.PI / 180));
    const OFFSHORE_DIRS: ReadonlyArray<readonly [number, number]> = [
        [0, 0], [1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707],
        [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707],
    ];
    const hasAdjacentDeepWhaleSea = OFFSHORE_DIRS.some(([dy, dx]) =>
        canSpawnDeepSeaWhaleOrNessie(lat + dy * 0.65, lng + (dx * 0.65) / cosLat)
    );
    if (!hasAdjacentDeepWhaleSea) return;

    const N = 120;
    const isNatural = (x: number, y: number): boolean => glLayer.isWaterAt(x, y, VW, VH) && !glLayer.isMoatAt(x, y, VW, VH);
    const cands: Array<{ x: number; y: number }> = [];
    for (let gy = 6; gy < N - 6; gy += 2) {
        for (let gx = 6; gx < N - 6; gx += 2) {
            if (glLayer.getWaterDensityAt(gx, gy) < 0.6) continue;
            let ok = true;
            for (let dy = -2; dy <= 2 && ok; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (glLayer.getWaterDensityAt(gx + dx, gy + dy) < 0.5) { ok = false; break; }
                }
            }
            if (!ok) continue;
            const pt = glLayer.cellToScreen(gx + 0.5, gy + 0.5, VW, VH);
            let nearMoat = false;
            for (let dy = -3; dy <= 3 && !nearMoat; dy += 3) {
                for (let dx = -3; dx <= 3; dx += 3) {
                    if (glLayer.isMoatAt(pt.x + dx * TAC_TILE_W, pt.y + dy * TAC_TILE_H, VW, VH)) { nearMoat = true; break; }
                }
            }
            if (nearMoat || !isNatural(pt.x, pt.y)) continue;
            if (this.spawns.some((sp) => Math.hypot(pt.x - sp.x, pt.y - sp.y) < 700)) continue;
            cands.push(pt);
        }
    }
    if (cands.length < 30) return;
    const want = cands.length >= 300 ? 2 : 1;
    let h = 2166136261 >>> 0;
    const seedStr = String(this.defenderCityId ?? this.environmentPlan?.seed ?? 'field') + '|nessie';
    for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619) >>> 0;
    const rnd = (): number => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    const placed: Array<{ x: number; y: number }> = [];
    for (let tries = 0; tries < 40 && placed.length < want; tries++) {
        const c = cands[Math.floor(rnd() * cands.length)];
        if (placed.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < 1500)) continue;
        placed.push(c);
        const dir = Math.floor(rnd() * 8);
        const phase = Math.floor(rnd() * 45);
        const sprite: DecorSprite = {
            asset: `ANIMAL:NESSIE/idle_${dir}`,
            frame: phase,
            x: c.x,
            y: c.y,
            flip: false,
            layer: 'world',
            z: 0,
            lift: 0,
            densityHash: phase,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        };
        this.ensureNatureAsset(sprite.asset);
        this.decorSprites.push(sprite);
        this.tacticalAnimals.push({
            sprite,
            species: 'NESSIE',
            kind: 'prey',
            action: 'idle',
            dir,
            homeX: c.x,
            homeY: c.y,
            x: c.x,
            y: c.y,
            vx: 0,
            vy: 0,
            fleeTimer: 0,
            fleeDX: 0,
            fleeDY: 0,
            idleTimer: 2 + rnd() * 3,
            wanderX: c.x,
            wanderY: c.y,
            animPhase: phase,
            hp: 50,
            atkNext: 0,
            flyX: c.x,
            flyY: c.y,
            hovering: false,
            aquatic: true,
        });
    }
}
