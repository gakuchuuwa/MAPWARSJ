/**
 * Scene13GroundLayerGL — M3 战术模式 WebGL 地面渲染层（重构版）
 *
 * 依据：CC 裁定与主人最高口径：
 *   1. 彻底消除方格阶梯与像素锯齿：基于连续距离势场 (Smooth Distance Field) 与 GLSL Simplex Noise，
 *      岸线与地形交界呈现完全平滑、有机蜿蜒的自然曲线，彻底杜绝 64x32 菱形马赛克；
 *   2. 告别单一平整色块：多尺度大范围明暗起伏 (Mottling)、暖阳高光与阴凉青翠色温变化、
 *      干湿土壤/黄褐泥土斑块与沙土交织，呈现丰富、温润、具层次感的真实地貌；
 *   3. 丰富水体表现：清澈见底的近岸浅水（透出河床沙泥）到蔚蓝深水河心的自然渐变；
 *      双层反向流动水纹动态；动态潮汐拍岸的岸边浪花/白色泡沫带 (Shoreline Wave Foam)；
 *   4. 单一连续三角网格满铺渲染，无多余 overdraw，性能平稳流畅；
 *   5. 支持镜头缩放 (uZoom/uCam)；
 *   6. 提供高精度双线性插值高程抬升与水体判定接口。
 */

import { DE_TERRAIN_MANIFEST, DE_TERRAIN_BLEND, type DeTerrainManifestItem } from '../../data/battlefield/deTerrainData';
import type { Scene13GroundTiles } from './Scene13EnvironmentGenerator';

export const DE_TILE_W = 96, DE_TILE_H = 48, DE_ELEV_H = 24;
// 🔴 [2026-10-12 主人令「地面放大到 96×48」「保留长方形」] 原 64×32：建筑/城墙/兵模按 DE 原生像素画（1.0），
//    DE 原生素材对应的一格是 96×48（墙段原生宽 107 ≈ 1 格、城堡 468 ≈ 4×4 格），地面用 64×32 ⇒ 建筑相对地图大 1.5 倍。
const TW = DE_TILE_W, TH = DE_TILE_H;
const dx = TW / 2, dy = TH / 2;
/** 地图（120×120）半幅（世界 px）＝ 地面网格原点偏移 offX / centerY。全文件与 Scene13WarLayer 只认这一处。 */
export const TAC_MAP_N = 120;
export const TAC_MAP_HALF_W = (TAC_MAP_N - 1) * dx;   // 5712
export const TAC_MAP_HALF_H = (TAC_MAP_N - 1) * dy;   // 2856
export const TAC_TILE_W = TW, TAC_TILE_H = TH;

const NATURE_ALIAS: Record<string, [string, string]> = {
  FDRA: ['NATURE', 'PALM'], FPAL: ['NATURE', 'PALM'], FBAM: ['NATURE', 'BAMBOO'], BIRCH: ['NATURE', 'BIRCH_GREEN'],
  FJUN: ['NATURE', 'JUNGLE'], FSNO: ['NATURE', 'SNOW_PINE'], FOAK: ['NATURE', 'OAK'], FPIN: ['NATURE', 'PINE'],
  ITPINE: ['NATURE', 'ITALIAN_PINE'], OLIVE: ['NATURE', 'OLIVE'], CYPRESS: ['NATURE', 'CYPRESS'],
  GREENOAK: ['NATURE', 'GREEN_OAK'], BUSH: ['NATURE', 'BUSH_GREEN'], BUSH2: ['NATURE', 'BUSH_TREE_A'], BUSH3: ['NATURE', 'BUSH_TREE_B'],
  // 🔴 [2026-10-11 主人「AA又添加了地图，请检查」＋分工「模型分布归我」] RMS 里这种树叫 `MONKEYPUZZLE`（猴谜树），
  //    素材目录叫 `MONKEY_PUZZLE` —— 原名三条解析路（别名表／目录名／去 TREE_ 前缀）都不中，
  //    实测 4 张图（新热带温带及其 lake/river/sea）共 92 棵**在游戏里画不出来**，补这一行别名。
  MONKEYPUZZLE: ['NATURE', 'MONKEY_PUZZLE'],
  PLANT: ['NATURE', 'PLANT'], PLANTS: ['NATURE', 'PLANT'], PLANT_DEAD: ['NATURE', 'PLANT_DEAD'], PLANT_JUNGLE: ['NATURE', 'PLANT_JUNGLE'],
  PLAN_SHRUB_GREEN: ['NATURE', 'SHRUB_GREEN'], PLANT_SHRUB_DRY: ['NATURE', 'SHRUB_GREEN'],
  GRASS_GREEN: ['NATURE', 'GRASS_GREEN'], GRASS_DRY: ['NATURE', 'GRASS_DRY'], PLANT_FLOWER: ['NATURE', 'FLOWER'],
  ROCKX: ['NATURE', 'ROCK1'], ROCKSX: ['NATURE', 'ROCK2'], ROCKGX: ['NATURE', 'ROCK3'],
  ROCKF1: ['NATURE', 'ROCK_FORMATION1'], ROCKF2: ['NATURE', 'ROCK_FORMATION2'], ROCKF3: ['NATURE', 'ROCK_FORMATION3'],
  TREEA: ['NATURE', 'OAK'], TREEB: ['NATURE', 'OAK'], TREEC: ['NATURE', 'OAK'], FORTR: ['NATURE', 'OAK'],
  FAUTUM: ['NATURE', 'AUTUMN_OAK'], FAUTUMS: ['NATURE', 'AUTUMN_OAK'],
  FDEAD: ['NATURE', 'DEAD_TREE'], FLBAM: ['NATURE', 'LUSH_BAMBOO'], FRAIN: ['NATURE', 'RAINFOREST'], FACA: ['NATURE', 'ACACIA'],
  PLAN_WEED_GREEN: ['NATURE', 'WEED'], PLAN_BUSH_GREEN: ['NATURE', 'BUSH_GREEN'],
  PLANT_UNDERBRUSH_JUNGLE: ['NATURE', 'UNDERBRUSH_JUNGLE'], PLANT_UNDERBRUSH_RAINFOREST: ['NATURE', 'UNDERBRUSH_RAINFOREST'],
  PLANT_RAINFOREST: ['NATURE', 'RAINFOREST'], FLWRB: ['NATURE', 'FLOWERBED'], STUMP2: ['NATURE', 'DEAD_TREE'],
  GOLDM: ['NATURE', 'MINE_GOLD'], STONM: ['NATURE', 'MINE_STONE'], PSTM: ['NATURE', 'MINE_STONE'],
  FORAGM: ['NATURE', 'FORAGE_BUSH'], FORAG: ['NATURE', 'FORAGE_BUSH'], FORAGPINEAPPLE: ['NATURE', 'FORAGE_PINEAPPLE'],
  // 🔴 [2026-10-12 第四阶段：战略资源与动物生态] 映射 72 套官方烘焙地图中的全部 DE 原生动物与家畜代号
  GOOSE: ['ANIMAL', 'GOOSE'], WCHICKENA: ['ANIMAL', 'CHICKEN'], WCHICKENB: ['ANIMAL', 'CHICKEN'], WCHICKENC: ['ANIMAL', 'CHICKEN'],
  GAZELLE: ['ANIMAL', 'GAZELLE'], WELEF: ['ANIMAL', 'ELEPHANT'], REDFOX: ['ANIMAL', 'FOX_RED'], ARCTICFOX: ['ANIMAL', 'FOX_ARCTIC'],
  GJAGR: ['ANIMAL', 'JAGUAR'], SNAKE: ['ANIMAL', 'SNAKE_GROUND'], STORK: ['ANIMAL', 'STORK'], FALCO: ['ANIMAL', 'FALCON'],
  HORSW: ['ANIMAL', 'HORSE'], HORSWC: ['ANIMAL', 'HORSE'], HORSWD: ['ANIMAL', 'HORSE'], HORSWE: ['ANIMAL', 'HORSE'], HORSWF: ['ANIMAL', 'HORSE'],
  PIG: ['ANIMAL', 'PIG'], RHEA: ['ANIMAL', 'RHEA'], BOARX: ['ANIMAL', 'BOAR'], AWOLF: ['ANIMAL', 'WOLF_ARABIAN'], WOLFX: ['ANIMAL', 'WOLF'],
  CROCO: ['ANIMAL', 'CROCODILE'], OWL: ['ANIMAL', 'OWL'], OLD_ACADEMY: ['ANIMAL', 'FALCON'], GOAT: ['ANIMAL', 'GOAT'], SHEEPG: ['ANIMAL', 'SHEEP'],
  HAREA: ['ANIMAL', 'HARE_BROWN'], HAREB: ['ANIMAL', 'HARE_GREY'], DEERX: ['ANIMAL', 'DEER'], TAPIR: ['ANIMAL', 'TAPIR'],
  PANTHER: ['ANIMAL', 'BLACK_PANTHER'], FLAMINGO: ['ANIMAL', 'FLAMINGO'], WMONKEY: ['ANIMAL', 'MONKEY'], PHEASANT: ['ANIMAL', 'TURKEY'],
  ELK: ['ANIMAL', 'DEER'], BLACKBEAR: ['ANIMAL', 'BEAR_BLACK'], BROWNBEAR: ['ANIMAL', 'BEAR'], CAPYBARA: ['ANIMAL', 'CAPYBARA'],
  CAIMAN: ['ANIMAL', 'CAIMAN'], MACAW: ['ANIMAL', 'MACAW'], WALPACA: ['ANIMAL', 'ALPACA'], ARGALI: ['ANIMAL', 'ARGALI'],
  VULTURE: ['ANIMAL', 'VULTURE'], HAWKX: ['ANIMAL', 'HAWK'], CRANE: ['ANIMAL', 'CRANE'], IBEX: ['ANIMAL', 'IBEX'],
  DEER: ['ANIMAL', 'DEER'], BOAR: ['ANIMAL', 'BOAR'], WOLF: ['ANIMAL', 'WOLF'], HAWK: ['ANIMAL', 'FALCON'],
  MOUFLON: ['ANIMAL', 'MOUFLON'], LION: ['ANIMAL', 'LION'],
  // 🔴 [2026-10-13 动物核对抓出·已补] 鸵鸟素材就在库里，但 RMS 名 `OSTRICH` 一直没进别名表
  //    ⇒ 全图 26 只鸵鸟**一只都画不出来**（resolveNatureSprite 返 null，物件被静默丢掉）。
  OSTRICH: ['ANIMAL', 'OSTRICH'],
  // 🔴 [2026-10-13 第五阶段：气候专属点缀物] 枯骨残骸、墓冢碎石与杂物
  SKELA: ['NATURE', 'SKELETON'], GRAVES: ['NATURE', 'GRAVES'], BARRELS: ['NATURE', 'BARRELS'], CONDOR: ['ANIMAL', 'CONDOR'], RAVEN: ['ANIMAL', 'FALCON']
};

const NATURE_DIRS = new Set(`ACACIA ASIAN_MAPLE_AUTUMN ASIAN_MAPLE_GREEN ASIAN_PINE AUTUMN_OAK BAMBOO BAOBAB BARRELS BIRCH_AUTUMN BIRCH_GREEN BIRCH_WINTER BRAZILWOOD BUSH_GREEN BUSH_TREE_A BUSH_TREE_B BUSH_TREE_C CACTUS CHERRY_BLOSSOM CYPRESS CYPRESS_DEC DEAD_TREE DRAGON_TREE EUCALYPTUS FERNPATCH FLOWER FLOWERBED FLOWER_1 FLOWER_2 FLOWER_3 FLOWER_4 FORAGE_BUSH FORAGE_FRUIT FORAGE_PAPAYA FORAGE_PINEAPPLE GINKGO GRASS_DRY GRASS_DRY_PATCH GRASS_GREEN GRASS_GREEN_PATCH GRAVES GREEN_OAK ITALIAN_PINE JUNGLE LUSH_BAMBOO MANGROVE MINE_GOLD MINE_STONE MONKEY_PUZZLE OAK OLIVE OYSTERS PALM PEACH_BLOSSOM PINE PLANT PLANT_DEAD PLANT_JUNGLE PLANT_RAINFOREST RAINFOREST REEDS ROCK1 ROCK2 ROCK3 ROCK_BEACH ROCK_FORMATION1 ROCK_FORMATION2 ROCK_FORMATION3 ROCK_JUNGLE ROCK_LIMESTONE ROCK_PILLAR ROCK_SEA1 ROCK_SEA2 SHRUB_GREEN SKELETON SNOW_AUTUMN_OAK SNOW_BIRCH SNOW_DEAD_TREE SNOW_PINE UNDERBRUSH UNDERBRUSH_JUNGLE UNDERBRUSH_RAINFOREST WATER_LILY WAX_PALM WEED WILLOW`.split(' '));

export function resolveNatureSprite(name: string): [string, string] | null {
  if (!name) return null;
  // 🔴 [2026-10-11 主人令] 先把这个悬崖删除，摆放不对 ⇒ 一律不解析悬崖
  if (name.includes('CLIFF')) return null;
  if (NATURE_ALIAS[name]) return NATURE_ALIAS[name];
  if (NATURE_DIRS.has(name)) return ['NATURE', name];
  for (const t of [name, name.replace(/^TREE_/, ''), name.replace(/^TREE/, '')]) {
    if (NATURE_DIRS.has(t)) return ['NATURE', t];
  }
  return null;
}

const VS = `attribute vec2 aPos;
attribute vec2 aGUV;
attribute float aLight;
uniform vec2 uRes;
uniform vec2 uCam;
uniform float uZoom;
varying vec2 vGUV;
varying vec2 vWorldPos;
varying float vLight;

void main() {
  vGUV = aGUV;
  vWorldPos = aPos;
  vLight = aLight;
  vec2 p = (aPos + uCam) * uZoom;
  vec2 c = vec2(uRes.x * 0.5, uRes.y * 0.5);
  gl_Position = vec4((p.x - c.x) / c.x, -(p.y - c.y) / c.y, 0.0, 1.0);
}`;

const FS = `precision mediump float;
varying vec2 vGUV;
varying vec2 vWorldPos;
varying float vLight;

uniform sampler2D uFieldTex;
uniform sampler2D uGrassTex;
uniform sampler2D uSandTex;
uniform sampler2D uForestTex;
uniform sampler2D uWaterTex;
uniform sampler2D uDirtTex;
uniform sampler2D uDryTex;
uniform float uMapSize;
uniform float uTime;
uniform float uIsIce;

// 2D Simplex Noise (Ashima Arts)
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ── REA 逆向：DE blendomatic_x2 格边草叶/砂砾颗粒咬合算子 ──
// 将宏观团块势场 (macroVal) 与格边高频草叶微噪 (microVal) 及两张贴图局部明暗纹理差 (texDetail) 耦合，
// 消除单纯 smoothstep 的「软喷枪雾化感」，还原 DE 草叶、砂砾、泥土在边界处错落咬合的颗粒感。
float deEdgeBlend(float macroVal, float edgeLow, float edgeHigh, float microNoise, float texDetail) {
  float baseT = smoothstep(edgeLow, edgeHigh, macroVal);
  // 仅在交界过渡带 (0 < baseT < 1) 激活高频草叶/砂砾颗粒咬合，内部保持纯净原图
  float borderMask = 4.0 * baseT * (1.0 - baseT);
  float grain = (microNoise * 0.65 + texDetail * 0.35) * borderMask * 0.42;
  return smoothstep(0.18, 0.82, baseT + grain);
}

void main() {
  vec2 fieldUV = clamp(vGUV / uMapSize, 0.001, 0.999);
  vec4 field = texture2D(uFieldTex, fieldUV);
  
  // 有机扰动：低频大尺度舒缓曲线打破方格阶梯，彻底消除高频毛刺锯齿，呈现圆润蜿蜒河岸
  float n1 = snoise(vGUV * 0.22);
  float n2 = snoise(vGUV * 0.50);
  // 格边高频颗粒微噪（对应 DE blendomatic 单格 96×48 边缘草叶/碎石咬合掩码频率）
  float nMicro1 = snoise(vGUV * 2.4 + vec2(19.7, 43.1));
  float nMicro2 = snoise(vGUV * 5.2 + vec2(67.3, 11.9));
  float microGrain = nMicro1 * 0.65 + nMicro2 * 0.35;

  float wPerturb = field.r + n1 * 0.038 + n2 * 0.014;
  
  // 水体判定：清晰而蜿蜒的自然水际线（DE 风格，消除软喷枪涂抹感）
  float isWater = smoothstep(0.42, 0.48, wPerturb);
  float isDeepWater = smoothstep(0.56, 0.82, wPerturb);
  
  // 沙滩判定（近岸浅滩与干沙）
  float isSandRaw = clamp(field.g * 1.45 + smoothstep(0.22, 0.46, wPerturb) * 0.95, 0.0, 1.0) * (1.0 - isWater * 0.85);
  // 森林有机扰动：低频圆滑自然树林边缘与专属林下落叶底床（DE 原版：树下铺满落叶泥土）
  float fn1 = snoise(vGUV * 0.35 + vec2(27.4, 61.8));
  float fn2 = snoise(vGUV * 0.75 + vec2(73.1, 14.5));
  float fPerturb = field.b + fn1 * 0.035 + fn2 * 0.015;
  
  // 纹理采样（DE 原版：按地面网格真实像素坐标 1:1 无缝平铺 512px 原图，无人工偏色，保持雪原/沙漠/黑土/绿草本色）
  vec2 texUV = fract((vGUV * vec2(96.0, 48.0)) / 512.0);
  vec3 colGrass = texture2D(uGrassTex, texUV).rgb;
  vec3 colSand = texture2D(uSandTex, texUV).rgb;
  vec3 colForest = texture2D(uForestTex, texUV).rgb;
  vec3 colDirt = texture2D(uDirtTex, texUV).rgb;
  vec3 colDry = texture2D(uDryTex, texUV).rgb;

  // 提取各层贴图自身的像素级微纹理起伏（用于边界处草叶/石粒凹凸咬合）
  float lumaGrass = dot(colGrass, vec3(0.299, 0.587, 0.114));
  float lumaDry   = dot(colDry,   vec3(0.299, 0.587, 0.114));
  float lumaDirt  = dot(colDirt,  vec3(0.299, 0.587, 0.114));
  float lumaFor   = dot(colForest,vec3(0.299, 0.587, 0.114));
  float lumaSand  = dot(colSand,  vec3(0.299, 0.587, 0.114));
  
  // ── DE 原版多底图碎块交织与 blendomatic 边缘咬合机制（参照 F_seasons.inc LAYER_A/B/C） ──
  // 1. 多尺度地貌碎块（低频原野起伏 + 中频 DE 1000-clumps 碎块交织）
  float tn1 = snoise(vGUV * 0.09 + vec2(11.3, 47.9));
  float tn2 = snoise(vGUV * 0.24 + vec2(83.1, 29.5));
  float tn3 = snoise(vGUV * 0.58 + vec2(41.7, 92.3));
  float terrainPatch = tn1 * 0.50 + tn2 * 0.32 + tn3 * 0.18;
  
  // 2. 副地表二层斑块（地图数据层 DIRT 势场 field.a + 原野碎块咬合）
  float dirtNoise = clamp(tn1 * 0.45 + tn2 * 0.35 + tn3 * 0.20, -1.0, 1.0);
  float fieldDirt = deEdgeBlend(field.a, 0.12, 0.55, microGrain, (lumaDirt - lumaGrass) * 2.5);
  float wildDirt  = deEdgeBlend(dirtNoise, 0.16, 0.50, microGrain, (lumaDirt - lumaGrass) * 2.5) * 0.34;
  float dirtMix   = clamp(fieldDirt + wildDirt, 0.0, 1.0);
  
  // 3. 副地表一层微斑驳（DE LAYER_A/B 双色同系地貌碎块咬合）
  float dryEdge = deEdgeBlend(terrainPatch, -0.22, 0.32, microGrain, (lumaDry - lumaGrass) * 2.5);
  float dryMix  = clamp(dryEdge * 0.52, 0.0, 1.0) * (1.0 - dirtMix * 0.65);
  
  // 4. 基底主地形与副地表一层咬合
  vec3 baseLand = mix(colGrass, colDry, dryMix);
  
  // 5. 混入副地表二层与道路/城基裸土斑块
  vec3 landCol = mix(baseLand, colDirt, dirtMix);
  
  // 6. 森林底土与落叶垫底（🔴 [2026-10-12 主人令] 树林下铺满专属落叶腐殖土，边缘带落叶颗粒咬合）
  float isForest = deEdgeBlend(fPerturb, 0.16, 0.40, microGrain, (lumaFor - lumaGrass) * 2.0) * (1.0 - smoothstep(0.28, 0.45, wPerturb));
  landCol = mix(landCol, colForest, isForest);
  
  // 7. 水际沙滩与退潮湿沙带过渡（DE 经典海滩湿沙 + 沙岸颗粒咬合）
  float sandBlend = deEdgeBlend(isSandRaw, 0.12, 0.62, microGrain, (lumaSand - lumaGrass) * 2.0);
  landCol = mix(landCol, colSand, sandBlend);
  // 退潮湿沙带：近水际沙土受潮汐润泽，颜色加深呈润泽暗黄色
  float wetShore = smoothstep(0.32, 0.46, wPerturb);
  vec3 wetSandCol = colSand * vec3(0.76, 0.70, 0.60);
  vec3 riverbedCol = colSand * vec3(0.85, 0.81, 0.72);
  landCol = mix(landCol, wetSandCol, wetShore * 0.72);
  
  // ── 水体与冬季冰面渲染（保留气候水体贴图本色 + 深浅渐变 + 冰面静止质感） ──
  vec3 waterCol;
  float waterDepthMix = smoothstep(0.42, 0.72, wPerturb);
  if (uIsIce > 0.5) {
    // 冬季封冻冰面：静止无流动波浪，保留 ic2/ice 冰层纹理与岸边霜雪柔和过渡
    vec3 iceTex1 = texture2D(uWaterTex, texUV).rgb;
    vec3 iceTex2 = texture2D(uWaterTex, fract(vGUV * 0.18 + vec2(0.13, 0.29))).rgb;
    vec3 iceBody = mix(iceTex1, iceTex2, 0.35) * (1.02 + 0.06 * n1);
    waterCol = mix(riverbedCol, iceBody, 0.35 + waterDepthMix * 0.65);
    float frostBand = smoothstep(0.38, 0.48, wPerturb) * (1.0 - smoothstep(0.48, 0.58, wPerturb));
    waterCol = mix(waterCol, vec3(0.92, 0.96, 1.0), frostBand * 0.40);
  } else {
    // 液态水体：以气候水体贴图 uWaterTex 本色为基底（碧绿河水/浑浊沼泽/蔚蓝海面各司其职）
    vec2 wuv1 = fract(vGUV * 0.22 + vec2(uTime * 0.028, uTime * 0.014));
    vec2 wuv2 = fract(vGUV * 0.27 + vec2(-uTime * 0.019, uTime * 0.022));
    vec3 wave1 = texture2D(uWaterTex, wuv1).rgb;
    vec3 wave2 = texture2D(uWaterTex, wuv2).rgb;
    vec3 rawWater = (wave1 + wave2) * 0.5;
    float luma = dot(rawWater, vec3(0.299, 0.587, 0.114));
    float liftScale = luma < 0.26 ? 1.48 : 1.12;
    vec3 shallowBody = clamp(rawWater * (liftScale * 1.12) + vec3(0.04, 0.08, 0.08), 0.0, 1.0);
    vec3 deepBody = clamp(rawWater * (liftScale * 0.92), 0.0, 1.0);
    vec3 waterBody = mix(shallowBody, deepBody, isDeepWater);

    // 水体通透度层次（DE 风格：近岸浅滩清澈见底，透出水下沙床；向外海逐渐深沉）
    vec3 shallowTintedBed = mix(riverbedCol, shallowBody, 0.35);
    waterCol = mix(shallowTintedBed, waterBody, waterDepthMix);

    // 水面微澜高光（阳光波光粼粼）
    vec2 ripUV = vGUV * 0.6;
    float rip1 = sin(ripUV.x * 2.5 + ripUV.y * 1.2 + uTime * 2.0);
    float rip2 = cos(ripUV.x * 1.5 - ripUV.y * 2.8 - uTime * 1.6);
    float shimmer = pow(clamp(rip1 * rip2 * 0.5 + 0.5, 0.0, 1.0), 5.0) * (1.0 - isDeepWater * 0.4);
    waterCol += vec3(0.12, 0.16, 0.20) * shimmer;

    // 岸边动态拍岸涌浪与碎浪泡沫（DE 标志性动态浪花，随潮汐向沙滩推涌）
    float waveTide = sin(uTime * 1.6 + (vGUV.x * 0.4 + vGUV.y * 0.8) * 0.15) * 0.025;
    float waveFront = 0.435 + waveTide;
    float surgeDist = abs(wPerturb - waveFront);
    float waveSurge = smoothstep(0.035, 0.005, surgeDist);
    float foamNoise = snoise(vGUV * 2.2 + vec2(uTime * 0.3, -uTime * 0.15));
    float shoreFoam = waveSurge * clamp(0.65 + 0.55 * foamNoise, 0.0, 1.2);
    float shoreLine = smoothstep(0.42, 0.45, wPerturb) * (1.0 - smoothstep(0.45, 0.48, wPerturb)) * (0.35 + 0.25 * foamNoise);
    float totalFoam = clamp(shoreFoam + shoreLine, 0.0, 1.0);
    waterCol = mix(waterCol, vec3(0.96, 0.98, 1.0), totalFoam * 0.85);
  }
  
  // 最终合成与 DE 原生高程坡度光照
  vec3 finalCol = mix(landCol, waterCol, isWater);
  finalCol *= vLight;
  gl_FragColor = vec4(finalCol, 1.0);
}`;

function mkProgram(gl: WebGLRenderingContext): WebGLProgram {
  const mk = (t: number, s: string) => {
    const sh = gl.createShader(t)!;
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(info || 'Shader compile error');
    }
    return sh;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(info || 'Program link error');
  }
  return p;
}

export function transposeMapData(d: any): any {
  if (!d || !d.width || !d.height) return d;
  const w = d.width, h = d.height;
  const transposeArray = (arr: any) => {
    if (!arr || !arr.length) return arr;
    const out = new Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[x * h + y] = arr[y * w + x];
      }
    }
    return Array.isArray(arr) ? out : new (arr.constructor as any)(out);
  };
  const newObjs = (d.objects || []).map((o: any) => {
    const no = { ...o };
    no.x = o.y;
    no.y = o.x;
    no.cell = Math.floor(no.y) * h + Math.floor(no.x);
    return no;
  });
  return {
    ...d,
    width: h,
    height: w,
    terrain: transposeArray(d.terrain),
    layer: transposeArray(d.layer),
    elev: transposeArray(d.elev),
    passable: transposeArray(d.passable),
    speed: transposeArray(d.speed),
    objects: newObjs,
  };
}

function loadImg(u: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = u;
  });
}

/** 把源图与文件名挂在纹理上，供探针读「这一场到底用了哪张图」（无行为影响） */
export function attachTexImage(tex: WebGLTexture, img: any, tile?: string): WebGLTexture {
  (tex as any).__probeImg = img;
  if (tile) (tex as any).__probeTile = tile;
  return tex;
}

function blurGrid2D(src: Float32Array, N: number): Float32Array {
  const tmp = new Float32Array(N * N);
  const dst = new Float32Array(N * N);
  const weights = [0.061, 0.121, 0.198, 0.240, 0.198, 0.121, 0.061];
  const K = 3;

  for (let y = 0; y < N; y++) {
    const row = y * N;
    for (let x = 0; x < N; x++) {
      let sum = 0;
      for (let k = -K; k <= K; k++) {
        const sx = Math.min(N - 1, Math.max(0, x + k));
        sum += src[row + sx] * weights[k + K];
      }
      tmp[row + x] = sum;
    }
  }

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let sum = 0;
      for (let k = -K; k <= K; k++) {
        const sy = Math.min(N - 1, Math.max(0, y + k));
        sum += tmp[sy * N + x] * weights[k + K];
      }
      dst[y * N + x] = sum;
    }
  }

  return dst;
}

const FLOATS_PER_VERT = 5;
const STRIDE = FLOATS_PER_VERT * 4;

export class Scene13GroundLayerGL {
  public readonly gl: WebGLRenderingContext;
  private readonly prog: WebGLProgram;
  private readonly loc: Record<string, number | WebGLUniformLocation>;
  private readonly canvas: HTMLCanvasElement;
  public readonly data: any;
  private readonly N: number;
  private readonly offX: number;

  private fieldTex: WebGLTexture | null = null;
  private fieldPixels: Uint8Array | null = null;
  private fieldDirty = false;
  private elevDirty = false;
  private grassTex: WebGLTexture | null = null;
  private sandTex: WebGLTexture | null = null;
  private forestTex: WebGLTexture | null = null;
  private waterTex: WebGLTexture | null = null;
  private dirtTex: WebGLTexture | null = null;
  private dryTex: WebGLTexture | null = null;
  public isIce = false;

  public readonly smoothWater: Float32Array;
  public readonly smoothForest: Float32Array;
  private readonly origElev: Uint8Array;
  private cornerElev: Float32Array;
  private cornerLight: Float32Array;
  /** DE 等轴菱形格网 (I = gx + gy, J = gy - gx + N)，尺寸 M × M (M = 2N + 1) */
  private readonly isoM: number;
  private isoElev: Float32Array;
  private isoLight: Float32Array;

  private cam = { x: 0, y: 0, zoom: 1 };
  private buf: WebGLBuffer | null = null;
  private vertCount = 0;

  constructor(
    canvas: HTMLCanvasElement,
    data: any,
    imgGrass: any,
    imgSand: any,
    imgForest: any,
    imgWater: any,
    imgDirt?: any,
    imgDry?: any,
    grassTileName?: string
  ) {
    this.canvas = canvas;
    this.data = data;
    this.N = data.width;
    this.offX = (this.N - 1) * dx;
    this.origElev = new Uint8Array(this.N * this.N);
    this.isoM = 2 * this.N + 1;
    this.isoElev = new Float32Array(this.isoM * this.isoM);
    this.isoLight = new Float32Array(this.isoM * this.isoM);

    let initSeed = 2166136261;
    if (data.elev && data.elev.length === this.N * this.N) {
      const N = this.N;
      const elev = data.elev;
      const origElev = this.origElev;
      for (let i = 0; i < N * N; i++) {
        const v = Math.max(0, Math.min(7, elev[i] ?? 0));
        origElev[i] = v;
        if (i < 256) {
          initSeed = Math.imul(initSeed ^ (v + i), 16777619) >>> 0;
        }
      }
    }

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL 不可用');
    this.gl = gl;

    this.prog = mkProgram(gl);
    gl.useProgram(this.prog);

    const A = (n: string) => gl.getAttribLocation(this.prog, n);
    const U = (n: string) => gl.getUniformLocation(this.prog, n)!;
    this.loc = {
      aPos: A('aPos'),
      aGUV: A('aGUV'),
      aLight: A('aLight'),
      uRes: U('uRes'),
      uCam: U('uCam'),
      uZoom: U('uZoom'),
      uMapSize: U('uMapSize'),
      uTime: U('uTime'),
      uIsIce: U('uIsIce'),
      uFieldTex: U('uFieldTex'),
      uGrassTex: U('uGrassTex'),
      uSandTex: U('uSandTex'),
      uForestTex: U('uForestTex'),
      uWaterTex: U('uWaterTex'),
      uDirtTex: U('uDirtTex'),
      uDryTex: U('uDryTex'),
    };

    // 1. 构建高精度势能场纹理（水体 / 沙滩 / 森林底土 / 泥土斑块）
    const N = this.N;
    const rawWater = new Float32Array(N * N);
    const rawBeach = new Float32Array(N * N);
    const rawForest = new Float32Array(N * N);
    const rawDirt = new Float32Array(N * N);

    const isWaterId = (id: number) => {
      const m = DE_TERRAIN_MANIFEST[id];
      return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const id = data.terrain[y * N + x];
        if (id === 1 || id === 23 || isWaterId(id)) rawWater[y * N + x] = 1.0;
        if (id === 2) rawBeach[y * N + x] = 1.0;
        const m = DE_TERRAIN_MANIFEST[id];
        const fname = m?.name_2 ?? '';
        const tname = m?.name ?? '';
        // 泥土/荒土判定（DE 原生 DIRT 斑块：3=Dirt 3, 6=Dirt, 11=Dirt 2, 42=Dirt 4, 76=Dirt Mud, 102 等）
        if (id === 3 || id === 6 || id === 11 || id === 42 || id === 76 || id === 102 ||
            /dirt|mud/i.test(tname) || /ds|des|rd/i.test(fname)) {
          rawDirt[y * N + x] = 1.0;
        }
        // 🔴 [2026-10-12 主人令「按顺序执行，只负责地图设计」「森林地下是铺满整块 forestFloorTile 的」]
        // 彻底按 DE dat 的所有森林/林地地形类型判定林地；
        // 但当战场主底图为荒漠/戈壁/黄土/干草原/高寒砾石时，树木已被稀疏化为散生灌木/孤树，不铺大块深色森林底斑
        const baseGrass = grassTileName ?? 'gr2';
        const isSparseTreelessBiome = baseGrass === 'pal' || baseGrass === 'des' || baseGrass === 'ds5'
          || baseGrass === 'qs' || baseGrass === 'pal1'
          || baseGrass === 'gr7' || baseGrass === 'gr5' || baseGrass === 'gravel_default';
        const isForestTerrain = !isSparseTreelessBiome && (
          fname === 'g_for' || fname === 'g_fo2' || fname === 'g_snf' || id === 71 || id === 13 || id === 48 ||
          tname.includes('Forest') || tname.includes('Jungle') || tname.includes('Leaves') || tname.includes('Palm')
        );
        if (isForestTerrain) rawForest[y * N + x] = 1.0;
      }
    }

    const sw = blurGrid2D(blurGrid2D(rawWater, N), N);
    const sb = blurGrid2D(blurGrid2D(rawBeach, N), N);
    const sf = blurGrid2D(blurGrid2D(rawForest, N), N);
    const sd = blurGrid2D(blurGrid2D(rawDirt, N), N);
    this.smoothWater = sw;
    this.smoothForest = sf;

    // 沿水陆交界岸线铺设宽幅圆滑过渡沙带
    for (let i = 0; i < N * N; i++) {
      const w = sw[i];
      if (w > 0.18 && w < 0.58) {
        const shoreSand = 1.0 - Math.abs(w - 0.38) / 0.20;
        sb[i] = Math.max(sb[i], shoreSand * 0.92);
      }
    }

    const fieldPixels = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      fieldPixels[i * 4 + 0] = Math.round(Math.min(1, Math.max(0, sw[i])) * 255);
      fieldPixels[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, sb[i])) * 255);
      fieldPixels[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, sf[i])) * 255);
      fieldPixels[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, sd[i])) * 255);
    }

    this.fieldPixels = fieldPixels;
    this.fieldTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 2. 加载基底平铺纹理（主草皮 / 沙滩 / 森林底土 / 水体 / 泥土斑块 / 旱草副草皮）
    const makeRepeatTex = (img: any): WebGLTexture => {
      const tex = attachTexImage(gl.createTexture()!, img);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };

    if (imgGrass) this.grassTex = makeRepeatTex(imgGrass);
    if (imgSand) this.sandTex = makeRepeatTex(imgSand);
    if (imgForest) this.forestTex = makeRepeatTex(imgForest);
    if (imgWater) this.waterTex = makeRepeatTex(imgWater);
    if (imgDirt) this.dirtTex = makeRepeatTex(imgDirt);
    if (imgDry) this.dryTex = makeRepeatTex(imgDry);

    // 3. 高程与 DE 离散斜坡折面打光
    const V_SIZE = this.N + 1;
    this.cornerElev = new Float32Array(V_SIZE * V_SIZE);
    this.cornerLight = new Float32Array(V_SIZE * V_SIZE);

    // 默认（野战或城池整平前）：中央战场保持平地，外围按 DE AoE2DE_s.exe (0x14135E990 + 0x14103CC60) 生成平顶阶梯丘陵
    let s = initSeed >>> 0;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s >>> 0) / 4294967296;
    };
    this.generateDeElevationGrid(N * 0.5, N * 0.5, 18.0, 3.0, rnd, 'medium_city');
    this.updateCornerLight();
  }

  /** 将 isoElev 同步回 cornerElev 与 data.elev，保证所有外部查询接口 100% 同步 */
  private syncCornerElevFromIso(): void {
    const N = this.N;
    const V_SIZE = N + 1;
    const M = this.isoM;
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        const I = gx + gy;
        const J = gy - gx + N;
        this.cornerElev[gy * V_SIZE + gx] = this.isoElev[I * M + J];
      }
    }
    if (this.data?.elev && this.data.elev.length === N * N) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const I = x + y + 1;
          const J = y - x + N;
          this.data.elev[y * N + x] = Math.max(0, Math.min(7, Math.round(this.isoElev[I * M + J])));
        }
      }
    }
  }

  /** 将 cornerElev 的局部修改同步到 isoElev（整数角点直接复制，半格中心点取四邻均值） */
  private syncIsoElevFromCorners(): void {
    const N = this.N;
    const V_SIZE = N + 1;
    const M = this.isoM;
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        const I = gx + gy;
        const J = gy - gx + N;
        this.isoElev[I * M + J] = this.cornerElev[gy * V_SIZE + gx];
      }
    }
    for (let cy = 0; cy < N; cy++) {
      for (let cx = 0; cx < N; cx++) {
        const I = cx + cy + 1;
        const J = cy - cx + N;
        const e00 = this.cornerElev[cy * V_SIZE + cx];
        const e10 = this.cornerElev[cy * V_SIZE + (cx + 1)];
        const e01 = this.cornerElev[(cy + 1) * V_SIZE + cx];
        const e11 = this.cornerElev[(cy + 1) * V_SIZE + (cx + 1)];
        this.isoElev[I * M + J] = 0.25 * (e00 + e10 + e01 + e11);
      }
    }
  }

  /**
   * 🔴 [REA 逆向 AoE2DE_s.exe `RGE_Map::get_tile_type` (0x1410416E0) + 等轴斜坡折面光照]
   * 计算单个三角形折面 (A, B, C) 的 DE 坡面光照：
   * - 平地或山顶平顶台地 (|dh| < 0.01)：恒为 1.0 (+ 微弱高地天光)，绝不把斜坡阴影/高光洇染到山顶平地或山脚平地上；
   * - 16 种离散斜坡折面 (tile_type 1..16)：按折面精确法线 (dhx, dhy) 计算向阳坡提亮与背阴坡压暗，呈现 DE 硬朗分明的等轴菱形阶梯折面。
   */
  private computeFacetLight(
    gx0: number, gy0: number, e0: number,
    gx1: number, gy1: number, e1: number,
    gx2: number, gy2: number, e2: number
  ): number {
    const maxE = Math.max(e0, e1, e2);
    const minE = Math.min(e0, e1, e2);
    const avgE = (e0 + e1 + e2) / 3;
    const elevBoost = Math.min(0.04, avgE * 0.01);
    if (maxE - minE < 0.015) {
      // DE tile_type == 0（平地 / 山顶平台）：光照完全平整，棱角边界一刀切
      return 1.0 + elevBoost;
    }
    // 求解三角形平面在 (gx, gy) 上的精确高程梯度 (dhx = ∂e/∂gx, dhy = ∂e/∂gy)
    const ux = gx1 - gx0, uy = gy1 - gy0, ue = e1 - e0;
    const vx = gx2 - gx0, vy = gy2 - gy0, ve = e2 - e0;
    const det = ux * vy - uy * vx;
    if (Math.abs(det) < 1e-5) return 1.0 + elevBoost;
    const invDet = 1.0 / det;
    const dhx = (ue * vy - uy * ve) * invDet;
    const dhy = (ux * ve - ue * vx) * invDet;

    // 转换到 DE 等轴菱形轴梯度 (dI = ∂e/∂I 朝屏幕右下, dJ = ∂e/∂J 朝屏幕左下)
    const dI = 0.5 * (dhx + dhy);
    const dJ = 0.5 * (dhy - dhx);

    // DE 经典左下偏西斜射平行光：8 个等轴坡向（4 主坡 + 4 折角坡）各自拥有独立鲜明的明暗阶梯
    const slopeTowardSun = dI * 0.38 - dJ * 0.72;
    let light = 1.0;
    if (slopeTowardSun > 0.005) {
      light = 1.0 + Math.min(0.24, slopeTowardSun * 0.28);
    } else if (slopeTowardSun < -0.005) {
      light = 1.0 + Math.max(-0.26, slopeTowardSun * 0.30);
    }
    return Math.max(0.72, Math.min(1.26, light + elevBoost));
  }

  private updateCornerLight(): void {
    const N = this.N;
    const V_SIZE = N + 1;
    const M = this.isoM;

    for (let I = 0; I < M; I++) {
      for (let J = 0; J < M; J++) {
        const hC = this.isoElev[I * M + J];
        const hI0 = I > 0 ? this.isoElev[(I - 1) * M + J] : hC;
        const hI1 = I < M - 1 ? this.isoElev[(I + 1) * M + J] : hC;
        const hJ0 = J > 0 ? this.isoElev[I * M + (J - 1)] : hC;
        const hJ1 = J < M - 1 ? this.isoElev[I * M + (J + 1)] : hC;
        const dI = (hI1 - hI0) * 0.5;
        const dJ = (hJ1 - hJ0) * 0.5;
        const slopeTowardSun = dI * 0.38 - dJ * 0.72;
        let light = 1.0;
        if (slopeTowardSun > 0.005) {
          light = 1.0 + Math.min(0.24, slopeTowardSun * 0.28);
        } else if (slopeTowardSun < -0.005) {
          light = 1.0 + Math.max(-0.26, slopeTowardSun * 0.30);
        }
        const elevBoost = Math.min(0.04, hC * 0.01);
        this.isoLight[I * M + J] = Math.max(0.72, Math.min(1.26, light + elevBoost));
      }
    }

    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        const I = gx + gy;
        const J = gy - gx + N;
        this.cornerLight[gy * V_SIZE + gx] = this.isoLight[I * M + J];
      }
    }
  }

  public setCamera(c: { x: number; y: number; zoom: number }): void {
    this.cam = { ...this.cam, ...c };
  }

  public resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  public render(): void {
    const gl = this.gl;
    const w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.uRes as WebGLUniformLocation, w, h);
    gl.uniform2f(this.loc.uCam as WebGLUniformLocation, this.cam.x / this.cam.zoom, this.cam.y / this.cam.zoom);
    gl.uniform1f(this.loc.uZoom as WebGLUniformLocation, this.cam.zoom);
    gl.uniform1f(this.loc.uMapSize as WebGLUniformLocation, this.N);
    gl.uniform1f(this.loc.uTime as WebGLUniformLocation, performance.now() * 0.001);
    gl.uniform1f(this.loc.uIsIce as WebGLUniformLocation, this.isIce ? 1.0 : 0.0);

    if (this.fieldTex) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
      gl.uniform1i(this.loc.uFieldTex as WebGLUniformLocation, 0);
    }
    if (this.grassTex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.grassTex);
      gl.uniform1i(this.loc.uGrassTex as WebGLUniformLocation, 1);
    }
    if (this.sandTex) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.sandTex);
      gl.uniform1i(this.loc.uSandTex as WebGLUniformLocation, 2);
    }
    if (this.forestTex) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.forestTex);
      gl.uniform1i(this.loc.uForestTex as WebGLUniformLocation, 3);
    }
    if (this.waterTex) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, this.waterTex);
      gl.uniform1i(this.loc.uWaterTex as WebGLUniformLocation, 4);
    }
    if (this.dirtTex) {
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, this.dirtTex);
      gl.uniform1i(this.loc.uDirtTex as WebGLUniformLocation, 5);
    }
    if (this.dryTex) {
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, this.dryTex);
      gl.uniform1i(this.loc.uDryTex as WebGLUniformLocation, 6);
    }

    gl.enableVertexAttribArray(this.loc.aPos as number);
    gl.enableVertexAttribArray(this.loc.aGUV as number);
    gl.enableVertexAttribArray(this.loc.aLight as number);

    if (!this.buf) {
      this.rebuildBuffers();
    }

    if (this.buf && this.vertCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.vertexAttribPointer(this.loc.aPos as number, 2, gl.FLOAT, false, STRIDE, 0);
      gl.vertexAttribPointer(this.loc.aGUV as number, 2, gl.FLOAT, false, STRIDE, 8);
      gl.vertexAttribPointer(this.loc.aLight as number, 1, gl.FLOAT, false, STRIDE, 16);
      gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
    }
  }

  /**
   * 🔴 [REA 逆向 AoE2DE_s.exe `RGE_Map::set_map_screen_pos` (0x14104DE80) + `get_tile_type` (0x1410416E0)]
   * 按 DE 原生 45° 等轴菱形瓦片 `[I, I+1] × [J, J+1]` 构建网格：
   * 1. 每个菱形瓦片对应屏幕 96×48 菱形，四条边严格沿 ±26.565° (2:1) 等轴方向展开；
   * 2. 对角线自适应切分 (`|e0 - e2| <= |e1 - e3|`) 完美复刻 DE 17 种斜坡瓦片 (tile_type 0..16) 的内外折角；
   * 3. 100% 采用 DE 纯平面折角光照 (`vL = fLight`)，彻底去除顶点法线柔化，平顶、斜坡、折角棱线分明。
   */
  private rebuildBuffers(): void {
    const gl = this.gl;
    const N = this.N;
    const M = this.isoM;
    const centerY = (N - 1) * dy;

    const verts: number[] = [];
    const pushTri = (
      I0: number, J0: number,
      I1: number, J1: number,
      I2: number, J2: number
    ) => {
      const gx0 = (I0 - (J0 - N)) * 0.5, gy0 = (I0 + (J0 - N)) * 0.5;
      const gx1 = (I1 - (J1 - N)) * 0.5, gy1 = (I1 + (J1 - N)) * 0.5;
      const gx2 = (I2 - (J2 - N)) * 0.5, gy2 = (I2 + (J2 - N)) * 0.5;

      // 跳过完全在 [0, N] × [0, N] 地图矩形之外的边角半菱形
      const cx = (gx0 + gx1 + gx2) / 3;
      const cy = (gy0 + gy1 + gy2) / 3;
      if (cx < -0.01 || cx > N + 0.01 || cy < -0.01 || cy > N + 0.01) return;

      const e0 = this.isoElev[I0 * M + J0];
      const e1 = this.isoElev[I1 * M + J1];
      const e2 = this.isoElev[I2 * M + J2];

      const fLight = this.computeFacetLight(gx0, gy0, e0, gx1, gy1, e1, gx2, gy2, e2);

      const emit = (gx: number, gy: number, e: number) => {
        verts.push(
          this.offX + (gx - N * 0.5) * TW,
          centerY + (gy - N * 0.5) * TH - e * DE_ELEV_H,
          gx,
          gy,
          fLight
        );
      };

      emit(gx0, gy0, e0);
      emit(gx1, gy1, e1);
      emit(gx2, gy2, e2);
    };

    for (let I = 0; I < M - 1; I++) {
      for (let J = 0; J < M - 1; J++) {
        // 菱形中心在 (gx, gy) 空间的坐标
        const cI = I + 0.5, cJ = J + 0.5;
        const cgx = (cI - (cJ - N)) * 0.5;
        const cgy = (cI + (cJ - N)) * 0.5;
        if (cgx < -0.5 || cgx > N + 0.5 || cgy < -0.5 || cgy > N + 0.5) continue;

        const e0 = this.isoElev[I * M + J];                 // Top
        const e1 = this.isoElev[(I + 1) * M + J];           // Right
        const e2 = this.isoElev[(I + 1) * M + (J + 1)];     // Bottom
        const e3 = this.isoElev[I * M + (J + 1)];           // Left

        // DE RGE_Map::get_tile_type (0x1410416E0) 自适应对角线：连接等高角点以形成平整三角折面
        if (Math.abs(e0 - e2) <= Math.abs(e1 - e3)) {
          pushTri(I, J, I + 1, J, I + 1, J + 1);
          pushTri(I, J, I + 1, J + 1, I, J + 1);
        } else {
          pushTri(I, J, I + 1, J, I, J + 1);
          pushTri(I + 1, J, I + 1, J + 1, I, J + 1);
        }
      }
    }

    if (this.buf) gl.deleteBuffer(this.buf);
    const f = new Float32Array(verts);
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
    this.vertCount = f.length / FLOATS_PER_VERT;
  }

  /**
   * 从屏幕逻辑坐标 (screenX, screenY) 查询新地图高程抬升量（像素）
   * 与 rebuildBuffers 的 DE 等轴菱形对角线切分严格逐像素一致。
   */
  public elevationLiftAt(screenX: number, screenY: number, W: number, H: number): number {
    const N = this.N;
    const gx = (screenX - W / 2) / TW + N * 0.5;
    const gy = (screenY - H / 2) / TH + N * 0.5;
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return 0;

    const M = this.isoM;
    const uI = gx + gy;
    const uJ = gy - gx + N;
    const I = Math.max(0, Math.min(M - 2, Math.floor(uI)));
    const J = Math.max(0, Math.min(M - 2, Math.floor(uJ)));
    const s = Math.max(0, Math.min(1, uI - I));
    const t = Math.max(0, Math.min(1, uJ - J));

    const e0 = this.isoElev[I * M + J];
    const e1 = this.isoElev[(I + 1) * M + J];
    const e2 = this.isoElev[(I + 1) * M + (J + 1)];
    const e3 = this.isoElev[I * M + (J + 1)];

    let elev: number;
    if (Math.abs(e0 - e2) <= Math.abs(e1 - e3)) {
      // 沿 v0(0,0) — v2(1,1) 切分
      if (s >= t) {
        elev = e0 * (1 - s) + e1 * (s - t) + e2 * t;
      } else {
        elev = e0 * (1 - t) + e3 * (t - s) + e2 * s;
      }
    } else {
      // 沿 v1(1,0) — v3(0,1) 切分
      if (s + t <= 1) {
        elev = e0 * (1 - s - t) + e1 * s + e3 * t;
      } else {
        elev = e2 * (s + t - 1) + e1 * (1 - t) + e3 * (1 - s);
      }
    }
    return elev * DE_ELEV_H;
  }

  /**
   * 从屏幕逻辑坐标 (screenX, screenY) 查询新地图是否为水体（基于平滑水体势场双线性插值）
   */
  public isWaterAt(screenX: number, screenY: number, W: number, H: number): boolean {
    const N = this.N;
    const gx = (screenX - W / 2) / TW + N * 0.5;
    const gy = (screenY - H / 2) / TH + N * 0.5;
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return false;

    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(N - 1, y0 + 1);
    const tx = gx - x0, ty = gy - y0;
    const w00 = this.smoothWater[y0 * N + x0];
    const w10 = this.smoothWater[y0 * N + x1];
    const w01 = this.smoothWater[y1 * N + x0];
    const w11 = this.smoothWater[y1 * N + x1];
    const wVal = (w00 * (1 - tx) + w10 * tx) * (1 - ty) + (w01 * (1 - tx) + w11 * tx) * ty;
    return wVal >= 0.45;
  }

  public getWaterDensityAt(gx: number, gy: number): number {
    if (gx < 0 || gy < 0 || gx >= this.N || gy >= this.N) return 0;
    return this.smoothWater[Math.floor(gy) * this.N + Math.floor(gx)] ?? 0;
  }

  /**
   * 从屏幕逻辑坐标 (screenX, screenY) 查询地形行军速度系数：
   *   · 深水：×0.3
   *   · 浅滩 / 沼泽：×0.6
   *   · 森林（穿林减速）：×0.5
   *   · 平地 / 草地 / 道路：×1.0
   */
  public terrainSpeedAt(screenX: number, screenY: number, W: number, H: number): number {
    const N = this.N;
    const gx = (screenX - W / 2) / TW + N * 0.5;
    const gy = (screenY - H / 2) / TH + N * 0.5;
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return 1.0;

    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(N - 1, y0 + 1);
    const tx = gx - x0, ty = gy - y0;

    const i00 = y0 * N + x0, i10 = y0 * N + x1, i01 = y1 * N + x0, i11 = y1 * N + x1;
    const wVal = (this.smoothWater[i00] * (1 - tx) + this.smoothWater[i10] * tx) * (1 - ty)
               + (this.smoothWater[i01] * (1 - tx) + this.smoothWater[i11] * tx) * ty;
    const fVal = (this.smoothForest[i00] * (1 - tx) + this.smoothForest[i10] * tx) * (1 - ty)
               + (this.smoothForest[i01] * (1 - tx) + this.smoothForest[i11] * tx) * ty;

    const rx = Math.min(N - 1, Math.max(0, Math.round(gx)));
    const ry = Math.min(N - 1, Math.max(0, Math.round(gy)));
    const cellIdx = ry * N + rx;
    const rawSpd = this.data?.speed?.[cellIdx];
    const tid = this.data?.terrain?.[cellIdx];
    const tName = String(DE_TERRAIN_MANIFEST[tid]?.name ?? '');

    // 1. 水体判定（深水 ×0.3，浅滩/沼泽 ×0.6）
    if (wVal >= 0.45) {
      if (rawSpd === 60 || /shallow|swamp|marsh|bog|quagmire|mud/i.test(tName)) {
        return 0.6;
      }
      // 近岸浅水过渡带（0.45 <= wVal < 0.68）算浅滩 ×0.6，深水区（wVal >= 0.68）算深水 ×0.3
      return wVal >= 0.68 ? 0.3 : 0.6;
    }

    // 2. 陆上沼泽 / 泥潭（×0.6）
    if (rawSpd === 60 || /swamp|marsh|bog|quagmire|shallows|mud/i.test(tName)) {
      return 0.6;
    }

    // 3. 森林（穿林减速 ×0.5；carveFoundation 清空城基后 smoothForest 已归零，不会误减速）
    if (fVal >= 0.35 || (rawSpd === 50 && fVal >= 0.15)) {
      return 0.5;
    }

    return 1.0;
  }

  /**
   * 屏幕逻辑坐标 (screenX, screenY) → DE 格坐标 (gx, gy)
   */
  public screenToCell(screenX: number, screenY: number, W: number, H: number): { gx: number; gy: number } | null {
    const gx = (screenX - W / 2) / TW + this.N * 0.5;
    const gy = (screenY - H / 2) / TH + this.N * 0.5;
    if (gx < 0 || gy < 0 || gx >= this.N || gy >= this.N) return null;
    return { gx, gy };
  }

  /**
   * DE 格坐标 (gx, gy) → 屏幕逻辑坐标 (screenX, screenY)
   */
  public cellToScreen(gx: number, gy: number, W: number, H: number): { x: number; y: number } {
    const screenX = W / 2 + (gx - this.N * 0.5) * TW;
    const screenY = H / 2 + (gy - this.N * 0.5) * TH;
    return { x: screenX, y: screenY };
  }

  /**
   * 按 DE 格坐标 (gx, gy) 直接查询水体状态
   */
  public isWaterAtCell(gx: number, gy: number): boolean {
    const rx = Math.round(gx);
    const ry = Math.round(gy);
    if (rx < 0 || ry < 0 || rx >= this.N || ry >= this.N) return false;
    return (this.smoothWater[ry * this.N + rx] ?? 0) >= 0.45;
  }

  /**
   * 地基：把以屏幕逻辑坐标 (screenX, screenY) 为中心、radiusCells 格内的水 / 沙 / 林势场清零（边缘平滑过渡），
   * 让城池建筑与营地站在干燥平地上，而不是漂在水里或压在树林上。同步更新水体查询用的平滑场。
   */
  public carveFoundation(screenX: number, screenY: number, W: number, H: number, radiusCells: number): void {
    const c = this.screenToCell(screenX, screenY, W, H);
    const px = this.fieldPixels;
    if (!c || !px || !this.fieldTex) return;
    const N = this.N;
    const r = radiusCells;
    const x0 = Math.max(0, Math.floor(c.gx - r - 1)), x1 = Math.min(N - 1, Math.ceil(c.gx + r + 1));
    const y0 = Math.max(0, Math.floor(c.gy - r - 1)), y1 = Math.min(N - 1, Math.ceil(c.gy + r + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - c.gx, y + 0.5 - c.gy);
        const t = Math.min(1, Math.max(0, (d - (r - 1)) / 1.5));   // 内圈 0（全清）→ 外缘 1（原样）
        if (t >= 1) continue;
        const i = y * N + x;
        this.smoothWater[i] *= t;
        this.smoothForest[i] *= t;
        px[i * 4 + 0] = Math.round(px[i * 4 + 0] * t);
        px[i * 4 + 1] = Math.round(px[i * 4 + 1] * t);
        px[i * 4 + 2] = Math.round(px[i * 4 + 2] * t);
      }
    }
    this.fieldDirty = true;
  }

  /**
   * 🔴 [2026-10-12 主人令「给大城的外围加一圈护城河」] 把指定地形格改成水（护城河）：
   *   · 只重算**水场**（smoothWater + 场纹理 R 通道 + 岸边沙带 G 通道）并标脏，**不动高程**（水面随城池地基同高）；
   *   · 水场的算法与构造里一致（原始水格 → 两遍 blurGrid2D），所以河岸的圆滑过渡与天然水体同一口径。
   * 调用后再 flushFoundation() 上传。cells = 格下标 gy * N + gx。
   */
  /**
   * 🔴 [2026-10-12 主人报「中城的还是，小城的河都没连上」] 窄河（比一个地面格还窄）用「覆盖率」写水，而不是只看格心：
   *   每个地面格内取 samples×samples 个点，落在河带里的比例 ＝ 覆盖率，水量 ＝ min(1, 覆盖率 × 1.3)；
   *   场纹理是双线性采样，相邻格水量连起来就是一条连续的细水道（只看格心会挖成一颗颗断开的水塘）。
   *   覆盖率 ≥ 0.35 的格同时记成水地形（terrain=1）。返回写了水量的格数。
   */
  public addWaterCoverage(pred: (screenX: number, screenY: number) => boolean, W: number, H: number, samples = 6): number {
    const N = this.N, px = this.fieldPixels, sw = this.smoothWater;
    if (!px || !this.fieldTex) return 0;
    let touched = 0;
    const hitWater: number[] = [];
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const p = this.cellToScreen(gx + 0.5, gy + 0.5, W, H);
      let hit = 0;
      for (let a = 0; a < samples; a++) for (let b = 0; b < samples; b++) {
        if (pred(p.x + ((a + 0.5) / samples - 0.5) * TW, p.y + ((b + 0.5) / samples - 0.5) * TH)) hit++;
      }
      if (hit === 0) continue;
      const cov = hit / (samples * samples);
      // 🔴 [2026-10-12 主人报「战术模式中，小城的护城河，的河水没有联通」] 覆盖→水量 系数 1.3 → 2.2。
      //    量具（复刻本页 inMoat 几何逐格实测，2026-10-12）：小城 1 格宽河在城外一圈共 30 格被河带穿过，
      //    其中若干格 4×4 采样只有 3 点命中 ⇒ 覆盖率 0.188 ⇒ 旧式 0.188×1.3 = **0.244**；
      //    单格水场经场纹理双线性插值 + 着色器噪声（±0.05）后仍低于水面阈值 smoothstep(0.35,0.56) ⇒ 河面断节。
      //    新系数下最低 0.188×2.2 = **0.413** ≥ 阈值+噪声余量，逐格重算：小城 1 格 / 中城 2 格
      //    （ringLm 4~10 各档）**断水格 4 → 0**。分母 0.25 是「单格被河带擦过」的最小覆盖率实测值。
      const lvl = Math.min(1, cov * 2.2);
      const i = gy * N + gx;
      touched++;
      if (cov >= 0.35) this.data.terrain[i] = 1;
      if (lvl > sw[i]) sw[i] = lvl;                                            // smoothWater 是只读引用：原地改内容
      this.smoothForest[i] = 0;
      px[i * 4 + 0] = Math.max(px[i * 4 + 0], Math.round(lvl * 255));
      px[i * 4 + 1] = Math.max(px[i * 4 + 1], Math.round((1 - lvl * 0.55) * 140));
      px[i * 4 + 2] = 0;
      if (lvl >= 0.45) hitWater.push(i);
    }
    // 为护城河紧邻一圈岸线格补写湿沙过渡带（G 通道），消除生硬蓝边直切草地
    for (const idx of hitWater) {
      const gx = idx % N, gy = (idx - gx) / N;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = gx + dx, ny = gy + dy;
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
        const ni = ny * N + nx;
        const sand = (dx === 0 || dy === 0) ? 115 : 75;
        if (sand > px[ni * 4 + 1]) px[ni * 4 + 1] = sand;
        px[ni * 4 + 2] = Math.min(px[ni * 4 + 2], 40);
      }
    }
    this.fieldDirty = true;
    return touched;
  }

  /** 按屏幕逻辑坐标的谓词挑格子（格心屏幕坐标），挖成水；返回改了多少格。 */
  public addWaterWhere(pred: (screenX: number, screenY: number) => boolean, W: number, H: number): number {
    const N = this.N, cells: number[] = [];
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const p = this.cellToScreen(gx + 0.5, gy + 0.5, W, H);
      if (pred(p.x, p.y)) cells.push(gy * N + gx);
    }
    this.addWaterCells(cells);
    return cells.length;
  }

  public addWaterCells(cells: ArrayLike<number>): void {
    const N = this.N, px = this.fieldPixels;
    if (!px || !this.fieldTex || cells.length === 0) return;
    const raw = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
      const id = this.data.terrain[i];
      const m = DE_TERRAIN_MANIFEST[id];
      if (id === 1 || id === 23 || (m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'))) raw[i] = 1.0;
    }
    for (let k = 0; k < cells.length; k++) { raw[cells[k]] = 1.0; this.data.terrain[cells[k]] = 1; }
    const sw = blurGrid2D(blurGrid2D(raw, N), N);
    // 窄河（只有一两个地面格宽）被两遍模糊冲到 0.5 以下，着色器会当成没水：河心格直接取高值，河岸仍由模糊过渡
    for (let k = 0; k < cells.length; k++) sw[cells[k]] = Math.max(sw[cells[k]], 0.85);
    this.smoothWater.set(sw);   // 原地覆盖（smoothWater 是只读引用，别处已持有）
    for (let i = 0; i < N * N; i++) {
      const w = sw[i];
      px[i * 4 + 0] = Math.round(Math.min(1, Math.max(0, w)) * 255);
      if (w > 0.18 && w < 0.58) {
        const shoreSand = 1.0 - Math.abs(w - 0.38) / 0.20;
        px[i * 4 + 1] = Math.max(px[i * 4 + 1], Math.round(Math.min(1, Math.max(0, shoreSand * 0.92)) * 255));
      }
    }
    this.fieldDirty = true;
  }

  /**
   * 城池地基整平：以屏幕逻辑坐标为中心、radiusCells 格内的高程整平到整数级 level，
   * 外缘按 DE `clean_elevation` (0x14103CC60) 每格降 1 级切出等轴阶梯斜坡。改完调 flushFoundation 生效。
   */
  public flattenFoundation(screenX: number, screenY: number, W: number, H: number, radiusCells: number, level: number): void {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return;
    const N = this.N;
    const M = this.isoM;
    const intLevel = Math.max(0, Math.min(7, Math.round(level)));
    const r = radiusCells;

    const isoTileElev = new Int8Array(M * M);
    for (let i = 0; i < M * M; i++) {
      isoTileElev[i] = Math.max(0, Math.min(7, Math.round(this.isoElev[i])));
    }

    for (let I = 0; I < M; I++) {
      for (let J = 0; J < M; J++) {
        const gx = (I - (J - N)) * 0.5;
        const gy = (I + (J - N)) * 0.5;
        const d = Math.abs(gx - c.gx) + Math.abs(gy - c.gy);
        if (d <= r) {
          isoTileElev[I * M + J] = intLevel;
        }
      }
    }

    this.cleanDeIsoElevation(isoTileElev, Math.max(intLevel, 4));
    for (let i = 0; i < M * M; i++) {
      this.isoElev[i] = isoTileElev[i];
    }
    this.syncCornerElevFromIso();
    this.elevDirty = true;
  }

  /**
   * 🔴 [REA 逆向 `AoE2DE_s.exe` `RGE_Map::clean_elevation` (`VA 0x14103CC60` -> `0x141046720` + `0x141046AE0`)]
   * 对等轴菱形网格 `isoTileElev` 执行 DE 原生 8 邻域斜坡切面规整与单格尖脊/窄沟消除：
   * 1. `0x141046720` (`inc dl`)：扫描 8 邻域 4 组对向邻居（N-S、W-E、NW-SE、NE-SW），若对向邻居均高于当前格，直接抬高 1 级填平窄沟与凹坑；
   * 2. `0x141046720` 向外/向内 8 邻域高差约束：强制任意 8 邻域相邻格高差 `<= 1`，沿着平顶高台外圈自动切出每格降 1 级的等轴阶梯斜坡；
   * 3. `0x141046AE0`：若对向邻居均低于当前格，削平 1 格宽的刀刃山脊与孤立金字塔尖顶，保证所有高地山顶必为有宽度的平坦台地（Plateau）。
   */
  private cleanDeIsoElevation(
    isoTileElev: Int8Array,
    maxIntLevel: number,
    isBlockedIJ?: (I: number, J: number) => boolean
  ): void {
    const M = this.isoM;
    const D8_ISO: ReadonlyArray<[number, number]> = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];

    // 1. 0x141046720 (inc dl)：检查 4 组对向邻居（含对角线），填平高台内部单格凹坑与 1 格宽窄沟
    for (let pass = 0; pass < 2; pass++) {
      for (let I = 2; I < M - 2; I++) {
        for (let J = 2; J < M - 2; J++) {
          if (isBlockedIJ && isBlockedIJ(I, J)) continue;
          const idx = I * M + J;
          const h = isoTileElev[idx];
          const hN = isoTileElev[(I - 1) * M + J], hS = isoTileElev[(I + 1) * M + J];
          const hW = isoTileElev[I * M + (J - 1)], hE = isoTileElev[I * M + (J + 1)];
          const hNW = isoTileElev[(I - 1) * M + (J - 1)], hSE = isoTileElev[(I + 1) * M + (J + 1)];
          const hNE = isoTileElev[(I - 1) * M + (J + 1)], hSW = isoTileElev[(I + 1) * M + (J - 1)];
          if ((hN > h && hS > h) || (hW > h && hE > h) || (hNW > h && hSE > h) || (hNE > h && hSW > h)) {
            isoTileElev[idx] = Math.min(maxIntLevel, h + 1);
          }
        }
      }
    }

    // 2. 0x141046720 向外 8 邻域阶梯切坡：从平顶高台向外每格降 1 级（h -> h-1 -> ... -> 1 -> 0）
    for (let h = maxIntLevel; h >= 2; h--) {
      for (let I = 2; I < M - 2; I++) {
        for (let J = 2; J < M - 2; J++) {
          if (isoTileElev[I * M + J] < h) continue;
          for (const [dI, dJ] of D8_ISO) {
            const nI = I + dI, nJ = J + dJ;
            if (isBlockedIJ && isBlockedIJ(nI, nJ)) continue;
            const nIdx = nI * M + nJ;
            if (isoTileElev[nIdx] < h - 1) {
              isoTileElev[nIdx] = h - 1;
            }
          }
        }
      }
    }

    // 3. 0x141046720 向内 8 邻域合法性约束：保护区/水岸强制为 0，且全图任意 8 邻域高差 <= 1
    if (isBlockedIJ) {
      for (let I = 0; I < M; I++) {
        for (let J = 0; J < M; J++) {
          if (isBlockedIJ(I, J)) {
            isoTileElev[I * M + J] = 0;
          }
        }
      }
    }
    const clampSlopeDelta1 = () => {
      for (let pass = 0; pass < maxIntLevel + 2; pass++) {
        let changed = false;
        for (let I = 1; I < M - 1; I++) {
          for (let J = 1; J < M - 1; J++) {
            const idx = I * M + J;
            const cur = isoTileElev[idx];
            if (cur <= 0) continue;
            let minAllowed = cur;
            for (const [dI, dJ] of D8_ISO) {
              const nbrH = isoTileElev[(I + dI) * M + (J + dJ)];
              if (nbrH + 1 < minAllowed) {
                minAllowed = nbrH + 1;
              }
            }
            if (minAllowed < cur) {
              isoTileElev[idx] = minAllowed;
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
    };
    clampSlopeDelta1();

    // 4. 0x141046AE0 + 0x141046720 拓扑清理：消除任何 1 格宽刀刃山脊与孤立尖顶（含对角线方向），并再次校验高差 <= 1
    for (let pass = 0; pass < 2; pass++) {
      for (let I = 2; I < M - 2; I++) {
        for (let J = 2; J < M - 2; J++) {
          const idx = I * M + J;
          const h = isoTileElev[idx];
          if (h <= 0) continue;
          const hN = isoTileElev[(I - 1) * M + J], hS = isoTileElev[(I + 1) * M + J];
          const hW = isoTileElev[I * M + (J - 1)], hE = isoTileElev[I * M + (J + 1)];
          const hNW = isoTileElev[(I - 1) * M + (J - 1)], hSE = isoTileElev[(I + 1) * M + (J + 1)];
          const hNE = isoTileElev[(I - 1) * M + (J + 1)], hSW = isoTileElev[(I + 1) * M + (J - 1)];
          if ((hN < h && hS < h) || (hW < h && hE < h) || (hNW < h && hSE < h) || (hNE < h && hSW < h)) {
            isoTileElev[idx] = h - 1;
          }
        }
      }
      for (let I = 2; I < M - 2; I++) {
        for (let J = 2; J < M - 2; J++) {
          if (isBlockedIJ && isBlockedIJ(I, J)) continue;
          const idx = I * M + J;
          const h = isoTileElev[idx];
          const hN = isoTileElev[(I - 1) * M + J], hS = isoTileElev[(I + 1) * M + J];
          const hW = isoTileElev[I * M + (J - 1)], hE = isoTileElev[I * M + (J + 1)];
          if ((hN > h && hS > h) || (hW > h && hE > h)) {
            isoTileElev[idx] = Math.min(maxIntLevel, h + 1);
          }
        }
      }
    }
    clampSlopeDelta1();
  }

  /**
   * 🔴 [2026-10-12 主人令「大城（Big City）：主城坐落开阔平原，周边远景散落 1~3 级开阔缓坡与远山」]
   * 大城都城宏伟开阔地势生成：
   * 1. 广袤平原主城基底：城池与宽幅护城河整平在 0 级开阔平坦地基上，保障大军排兵布阵与城防完整；
   * 2. 远景散落 1~3 级 DE 平顶阶梯丘陵与远山（AoE2DE_s.exe 0x14135E990 + 0x14103CC60）。
   */
  public flattenBigCityTerrain(
    screenX: number,
    screenY: number,
    W: number,
    H: number,
    seedStr: string,
    flatCells: number
  ): void {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const cx = c.gx, cy = c.gy;
    const rFlat = flatCells;

    this.cornerElev.fill(0);
    this.isoElev.fill(0);

    // 远景原野：城周围保持开阔平地（rFlat + 7.5 格内全平 0 级），外围按 DE 0x14135E990 + 0x14103CC60 生成平顶阶梯丘陵
    this.generateDeElevationGrid(cx, cy, rFlat + 7.5, 3.0, rnd, 'big_city');

    this.updateCornerLight();
    this.elevDirty = true;
  }

  /**
   * 🔴 [REA 逆向 `AoE2DE_s.exe` 完整高程管线]
   * 严格按照 DE 二进制逆向的 3 个核心函数在 45° 等轴菱形网格 `(I, J)` 上生成并规整高地丘陵：
   * 1. `RGE_RMM_Elevation_Generator::base_elevation_generate` (`VA 0x14135E990`) + `check_elevation` (`VA 0x14135F1F0`)：
   *    - 团块直接赋予目标高度 `target_elev`（生成宽阔平坦的平顶高台，而非 BFS 距离剥洋葱圆锥）；
   *    - 扩张时扫描周围 `5×5` 等轴窗口 `[I-2..I+2, J-2..J+2]` 内已达 `target_elev` 的格数 `bVar4`，
   *      按 DE 原生权重公式 `cost = 250 - 15 * bVar4 + rand(0..99)` 优先填充凹陷，生成饱满有机的台地轮廓；
   *    - 支持在大型 2 级台地内部二次生长 3~4 级二级主峰平台（复刻 DE 多级 `elevation_info` 叠层台地）。
   * 2. `RGE_Map::clean_elevation` (`VA 0x14103CC60` -> `0x141046720` + `0x141046AE0`)：
   *    - 调用 `cleanDeIsoElevation` 执行 8 邻域等轴阶梯切坡与单格尖脊/窄沟消除。
   */
  private generateDeElevationGrid(
    cx: number,
    cy: number,
    rProtect: number,
    maxLevel: number,
    rnd: () => number,
    category: 'big_city' | 'medium_city' | 'small_city' | 'stockade' | 'pass'
  ): void {
    const N = this.N;
    const M = this.isoM;
    const isoTileElev = new Int8Array(M * M);
    for (let i = 0; i < M * M; i++) {
      isoTileElev[i] = Math.max(0, Math.min(7, Math.round(this.isoElev[i])));
    }

    const inProtectG = (gx: number, gy: number) => Math.hypot(gx - cx, gy - cy) < rProtect;
    const isWetG = (gx: number, gy: number): boolean => {
      const x0 = Math.round(gx), y0 = Math.round(gy);
      if (x0 < 0 || x0 >= N || y0 < 0 || y0 >= N) return true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.min(N - 1, Math.max(0, x0 + dx));
          const ny = Math.min(N - 1, Math.max(0, y0 + dy));
          if ((this.smoothWater[ny * N + nx] ?? 0) >= 0.16) return true;
        }
      }
      return false;
    };

    const inMapIJ = (I: number, J: number): boolean => {
      if (I < 2 || I >= M - 2 || J < 2 || J >= M - 2) return false;
      const gx = (I - (J - N)) * 0.5;
      const gy = (I + (J - N)) * 0.5;
      return gx >= 2.5 && gx <= N - 2.5 && gy >= 2.5 && gy <= N - 2.5;
    };

    const isBlockedIJ = (I: number, J: number): boolean => {
      if (!inMapIJ(I, J)) return true;
      const gx = (I - (J - N)) * 0.5;
      const gy = (I + (J - N)) * 0.5;
      return inProtectG(gx, gy) || isWetG(gx, gy);
    };

    const isBig = category === 'big_city';
    const isPass = category === 'pass';
    const isStockade = category === 'stockade';
    const maxIntLevel = Math.max(2, Math.min(7, Math.floor(maxLevel)));

    // 1. 识别外围森林/树木团块与真实 DEM 山脊，作为优先高地种子（保证树长在丘陵/山上）
    const prioritySeedsG: Array<{ x: number; y: number }> = [];
    const treeTileMask = new Uint8Array(N * N);
    const sf = this.smoothForest;
    if (sf) {
      for (let y = 3; y < N - 3; y++) {
        for (let x = 3; x < N - 3; x++) {
          if (inProtectG(x, y) || isWetG(x, y)) continue;
          if (sf[y * N + x] >= 0.16) {
            treeTileMask[y * N + x] = 1;
            if (x % 4 === 0 && y % 4 === 0) {
              const close = prioritySeedsG.some(s => Math.hypot(s.x - x, s.y - y) < 7);
              if (!close) prioritySeedsG.push({ x, y });
            }
          }
        }
      }
    }
    if (Array.isArray(this.data?.objects)) {
      const treeCellCounts = new Int16Array(N * N);
      for (const ob of this.data.objects) {
        if (!ob?.name || /CLIFF|GOLD|STONE|FORAGE|BUSH|ROCK|FLOWER|PLANT|GRASS|HAWK|FALCON|MACAW|VULTURE|STORK|BOAR|DEER|SHEEP|COW|GOAT|LLAMA|TURKEY|WOLF|LION|BEAR|JAGUAR|TIGER|CROCODILE|KOMODO|ZEBRA|OSTRICH|ELEPHANT|RHINO|IBEX|GAZELLE|CAMEL|HORSE/i.test(ob.name)) continue;
        if (!/TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE|FOREST/i.test(ob.name)) continue;
        const gx = Math.round((ob.x ?? 0) - 0.5);
        const gy = Math.round((ob.y ?? 0) - 0.5);
        if (gx < 3 || gx >= N - 3 || gy < 3 || gy >= N - 3) continue;
        if (inProtectG(gx, gy) || isWetG(gx, gy)) continue;
        treeCellCounts[gy * N + gx]++;
      }
      for (let y = 3; y < N - 3; y++) {
        for (let x = 3; x < N - 3; x++) {
          if (treeCellCounts[y * N + x] <= 0) continue;
          let nearTrees = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              nearTrees += treeCellCounts[(y + dy) * N + (x + dx)];
            }
          }
          if (nearTrees >= 3) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (!inProtectG(nx, ny) && !isWetG(nx, ny)) treeTileMask[ny * N + nx] = 1;
              }
            }
            const close = prioritySeedsG.some(s => Math.hypot(s.x - x, s.y - y) < 7);
            if (!close) prioritySeedsG.push({ x, y });
          }
        }
      }
    }
    if (this.origElev && this.origElev.length === N * N) {
      for (let y = 4; y < N - 4; y += 4) {
        for (let x = 4; x < N - 4; x += 4) {
          if (inProtectG(x, y) || isWetG(x, y)) continue;
          if (this.origElev[y * N + x] >= 2) {
            const close = prioritySeedsG.some(s => Math.hypot(s.x - x, s.y - y) < 8);
            if (!close) prioritySeedsG.push({ x, y });
          }
        }
      }
    }

    const D4_ISO: ReadonlyArray<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    /**
     * DE `check_elevation` (`VA 0x14135F1F0`)：
     * 扫描等轴网格 `(I, J)` 周围 `5×5` 窗口 (`[I-2..I+2, J-2..J+2]`)，返回已达到 `targetElev` 的格数 `bVar4` (0..25)
     */
    const count5x5AtTarget = (I: number, J: number, targetElev: number): number => {
      let cnt = 0;
      for (let dI = -2; dI <= 2; dI++) {
        const nI = I + dI;
        if (nI < 0 || nI >= M) continue;
        const row = nI * M;
        for (let dJ = -2; dJ <= 2; dJ++) {
          const nJ = J + dJ;
          if (nJ < 0 || nJ >= M) continue;
          if (isoTileElev[row + nJ] >= targetElev) cnt++;
        }
      }
      return cnt;
    };

    /**
     * DE `base_elevation_generate` (`VA 0x14135E990`)：
     * 从种子 `(seedI, seedJ)` 直接以平顶高度 `targetElev` 向外内聚生长一个高台团块，
     * 优先队列权重严格采用 DE 逆向公式：`cost = 250 - 15 * bVar4 + rand(0..99)`
     */
    const growDePlateauClump = (
      seedI: number,
      seedJ: number,
      baseElev: number,
      targetElev: number,
      maxDiamondTiles: number,
      axisAngle: number,
      aniso: number
    ): number => {
      if (isBlockedIJ(seedI, seedJ)) return 0;
      const startIdx = seedI * M + seedJ;
      if (isoTileElev[startIdx] < baseElev) return 0;

      const visited = new Uint8Array(M * M);
      visited[startIdx] = 1;
      isoTileElev[startIdx] = Math.max(isoTileElev[startIdx], targetElev);
      let placed = 1;

      const cosA = Math.cos(axisAngle), sinA = Math.sin(axisAngle);
      const frontier: Array<{ I: number; J: number; cost: number }> = [];

      const pushNeighbors = (cI: number, cJ: number) => {
        for (const [dI, dJ] of D4_ISO) {
          const nI = cI + dI, nJ = cJ + dJ;
          if (isBlockedIJ(nI, nJ)) continue;
          const nIdx = nI * M + nJ;
          if (visited[nIdx] || isoTileElev[nIdx] < baseElev) continue;
          visited[nIdx] = 1;
          const bVar4 = count5x5AtTarget(nI, nJ, targetElev);
          // DE 0x14135E990 核心公式: (250 - 15 * bVar4) + rand(0..99)，叠加轻微主轴走向偏置使山脉走势自然多样
          const relI = nI - seedI, relJ = nJ - seedJ;
          const crossAxis = Math.abs(-relI * sinA + relJ * cosA);
          const cost = (250 - 15 * bVar4) + Math.floor(rnd() * 100) + Math.floor(crossAxis * aniso * 6);
          frontier.push({ I: nI, J: nJ, cost });
        }
      };

      pushNeighbors(seedI, seedJ);

      while (frontier.length > 0 && placed < maxDiamondTiles) {
        let bestIdx = 0;
        let bestCost = frontier[0].cost;
        for (let i = 1; i < frontier.length; i++) {
          if (frontier[i].cost < bestCost) {
            bestCost = frontier[i].cost;
            bestIdx = i;
          }
        }
        const pick = frontier[bestIdx];
        frontier[bestIdx] = frontier[frontier.length - 1];
        frontier.pop();

        const bVar4 = count5x5AtTarget(pick.I, pick.J, targetElev);
        if (bVar4 > 0) {
          const pIdx = pick.I * M + pick.J;
          isoTileElev[pIdx] = Math.max(isoTileElev[pIdx], targetElev);
          placed++;
          pushNeighbors(pick.I, pick.J);
        }
      }

      return placed;
    };

    // 2. 第一遍 DE `base_elevation_generate`：在外围生成主平顶高台团块（高度 2~3 级）
    let baseClumpCount = 4 + Math.floor(rnd() * 4);
    if (isBig) baseClumpCount = 4 + Math.floor(rnd() * 3);
    else if (isPass) baseClumpCount = 5 + Math.floor(rnd() * 3);
    else if (isStockade) baseClumpCount = 3 + Math.floor(rnd() * 3);

    const totalClumps = Math.max(baseClumpCount, Math.min(14, prioritySeedsG.length + 3));
    const placedCenters: Array<{ I: number; J: number; elev: number }> = [];

    for (let c = 0; c < totalClumps; c++) {
      let seedI = 0, seedJ = 0, found = false;

      if (c < prioritySeedsG.length) {
        const ps = prioritySeedsG[c];
        const sI = Math.round(ps.x + ps.y);
        const sJ = Math.round(ps.y - ps.x + N);
        if (!isBlockedIJ(sI, sJ) && isoTileElev[sI * M + sJ] === 0) {
          seedI = sI;
          seedJ = sJ;
          found = true;
        }
      }

      if (!found) {
        for (let attempt = 0; attempt < 60; attempt++) {
          const sx = 5 + Math.floor(rnd() * (N - 10));
          const sy = 5 + Math.floor(rnd() * (N - 10));
          const sI = sx + sy;
          const sJ = sy - sx + N;
          if (!isBlockedIJ(sI, sJ) && isoTileElev[sI * M + sJ] === 0) {
            seedI = sI;
            seedJ = sJ;
            found = true;
            break;
          }
        }
      }
      if (!found) continue;

      const gx0 = Math.round((seedI - (seedJ - N)) * 0.5);
      const gy0 = Math.round((seedI + (seedJ - N)) * 0.5);
      const demH = (this.origElev && gx0 >= 0 && gx0 < N && gy0 >= 0 && gy0 < N)
        ? (this.origElev[gy0 * N + gx0] ?? 0)
        : 0;

      // 主平顶高度（2 级或 3 级），保证每个团块切坡后仍有宽阔平顶
      const hRoll = rnd();
      let targetElev = 2;
      if (maxIntLevel >= 3 && (hRoll < 0.58 || demH >= 2)) {
        targetElev = 3;
      }
      targetElev = Math.min(maxIntLevel, targetElev);

      const styleRoll = rnd();
      const axisAngle = rnd() * Math.PI;
      const aniso = styleRoll < 0.45 ? 0.25 : styleRoll < 0.80 ? (1.0 + rnd() * 1.1) : (1.8 + rnd() * 1.0);
      const diamondTiles = isBig
        ? (110 + Math.floor(rnd() * 130))
        : (85 + Math.floor(rnd() * 115));

      const count = growDePlateauClump(seedI, seedJ, 0, targetElev, diamondTiles, axisAngle, aniso);
      if (count >= 24) {
        placedCenters.push({ I: seedI, J: seedJ, elev: targetElev });
      }
    }

    // 3. 保底：凡外围树木所在格（treeTileMask === 1）若尚未被高台覆盖，直接调用 DE `growDePlateauClump` (0x14135E990) 生长有机平顶台地（拒绝生硬 3x3 方块）
    const treeElev = Math.min(maxIntLevel, 2);
    for (let y = 3; y < N - 3; y += 2) {
      for (let x = 3; x < N - 3; x += 2) {
        if (!treeTileMask[y * N + x]) continue;
        const sI = x + y;
        const sJ = y - x + N;
        if (isBlockedIJ(sI, sJ) || isoTileElev[sI * M + sJ] >= treeElev) continue;
        const subTiles = 42 + Math.floor(rnd() * 45);
        growDePlateauClump(sI, sJ, 0, treeElev, subTiles, rnd() * Math.PI, 0.35 + rnd() * 0.65);
      }
    }

    // 4. 第二遍 DE `base_elevation_generate`（复刻 DE 多级叠层台地）：在部分宽阔高台内部叠生更高一级（3~4 级）二级平顶主峰
    if (maxIntLevel >= 3 && placedCenters.length > 0) {
      for (const pc of placedCenters) {
        if (rnd() < 0.45) continue;
        const nextElev = Math.min(maxIntLevel, pc.elev + 1);
        if (nextElev <= pc.elev) continue;
        const subTiles = 32 + Math.floor(rnd() * 48);
        growDePlateauClump(pc.I, pc.J, pc.elev, nextElev, subTiles, rnd() * Math.PI, 0.4 + rnd() * 0.8);
      }
    }

    // 5. 调用 DE `RGE_Map::clean_elevation` (0x14103CC60 -> 0x141046720 + 0x141046AE0) 切出 8 邻域阶梯斜坡并消除单格尖脊
    this.cleanDeIsoElevation(isoTileElev, maxIntLevel, isBlockedIJ);

    // 6. 写入 isoElev 并同步 cornerElev 与 data.elev
    for (let i = 0; i < M * M; i++) {
      if (isoTileElev[i] > this.isoElev[i]) {
        this.isoElev[i] = isoTileElev[i];
      }
    }
    this.syncCornerElevFromIso();
  }

  /**
   * 🔴 [2026-10-18 主人令「城周围应该是平地才对。山可以放到城外围的丘陵上。和树一样，树也都是长在山上，丘陵上。」]
   * 中城/小城地形生成：
   * 1. 城池与城周围（护城河及城外宽幅平地缓冲带 rFlat + 7.5 格）统一整平为 0 级开阔平地；
   * 2. 外围高地丘陵推到城外围（rFlat + 7.5 格之外），按 DE `0x14135E990` + `0x14103CC60` 生成平顶阶梯丘陵。
   */
  public flattenMediumSmallCityTerrain(
    screenX: number,
    screenY: number,
    W: number,
    H: number,
    seedStr: string,
    flatCells: number,
    cityType: 'medium_city' | 'small_city'
  ): void {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const cx = c.gx, cy = c.gy;
    const rFlat = flatCells;
    const isMedium = cityType === 'medium_city';

    // 1. 城池及城周围统一整平为 0 级平地
    this.cornerElev.fill(0);
    this.isoElev.fill(0);

    // 2. 城外围（rFlat + 7.5 格以外）采用 DE 0x14135E990 + 0x14103CC60 生成平顶阶梯丘陵
    const rProt = rFlat + (isMedium ? 7.5 : 7.0);
    const maxH = isMedium ? 4.0 : 3.5;
    this.generateDeElevationGrid(cx, cy, rProt, maxH, rnd, cityType);

    this.updateCornerLight();
    this.elevDirty = true;
  }

  /**
   * 🔴 [2026-10-12 主人令「PASS的布局：最中间是城堡，下一级城墙，外围城墙，城墙外围；4层随机平缓起伏 1~7 级小山包，随机多样化」]
   * 关隘（PASS）专属 4 层阶梯高台与外围多样化 DE 平顶阶梯山丘生成（全整数台地 + DE 0x14103CC60 切坡）
   */
  public flattenPassTerraces(
    screenX: number,
    screenY: number,
    W: number,
    H: number,
    seedStr: string,
    wallPts: ReadonlyArray<{ x: number; y: number }> = [],
    bldPts: ReadonlyArray<{ x: number; y: number }> = []
  ): { castleLevel: number; innerLevel: number; outerLevel: number } {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return { castleLevel: 6, innerLevel: 4, outerLevel: 2 };

    const N = this.N;
    const M = this.isoM;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const castleLevel = rnd() < 0.6 ? 7 : 6;
    const innerLevel = castleLevel - 2;
    const outerLevel = innerLevel - 2;

    const cx = c.gx, cy = c.gy;
    const manOf = (p: { x: number; y: number }): number => {
      const q = this.screenToCell(p.x, p.y, W, H);
      return q ? Math.abs(q.gx - cx) + Math.abs(q.gy - cy) : -1;
    };
    const PAD = 1.0;
    let castleTop = 3.0;
    let innerEdge = 10.0;
    let outerEdge = 14.0;
    const wm = wallPts.map(manOf).filter(v => v >= 0).sort((a, b) => a - b);
    if (wm.length >= 8) {
      let gi = 0, gap = 0;
      for (let i = 1; i < wm.length; i++) if (wm[i] - wm[i - 1] > gap) { gap = wm[i] - wm[i - 1]; gi = i; }
      if (gap >= 1.5) {
        const innerMax = wm[gi - 1], outerMax = wm[wm.length - 1];
        innerEdge = innerMax + PAD;
        outerEdge = outerMax + 1.0;
      } else {
        outerEdge = wm[wm.length - 1] + 1.0;
        innerEdge = Math.min(innerEdge, outerEdge - 3);
      }
    }
    const bm = bldPts.map(manOf).filter(v => v >= 1.5).sort((a, b) => a - b);
    if (bm.length) {
      const castleFoot = Math.max(2.0, bm[0] - PAD - 0.2);
      castleTop = Math.max(1.8, Math.min(castleTop, castleFoot - 1.0));
    }
    const R3 = outerEdge;

    this.cornerElev.fill(0);
    this.isoElev.fill(0);

    const isoTileElev = new Int8Array(M * M);
    for (let I = 0; I < M; I++) {
      for (let J = 0; J < M; J++) {
        const x = (I - (J - N)) * 0.5;
        const y = (I + (J - N)) * 0.5;
        if (x < 0 || x > N || y < 0 || y > N) continue;
        const dIso = Math.abs(x - cx) + Math.abs(y - cy);
        if (dIso <= castleTop) {
          isoTileElev[I * M + J] = castleLevel;
        } else if (dIso <= innerEdge) {
          isoTileElev[I * M + J] = innerLevel;
        } else if (dIso <= R3) {
          isoTileElev[I * M + J] = outerLevel;
        }
      }
    }

    // 用 DE `clean_elevation` (0x14103CC60) 在四层平顶台地之间切出每格降 1 级的硬朗等轴阶梯斜坡
    this.cleanDeIsoElevation(isoTileElev, castleLevel);
    for (let i = 0; i < M * M; i++) {
      this.isoElev[i] = isoTileElev[i];
    }
    this.syncCornerElevFromIso();

    this.generateDeElevationGrid(cx, cy, R3 + outerLevel + 2.5, outerLevel, rnd, 'pass');

    this.updateCornerLight();
    this.elevDirty = true;

    return { castleLevel, innerLevel, outerLevel };
  }

  /**
   * 🔴 [2026-10-12 主人令「这种感觉在山坳坳中不对吧，应该在山上」]
   * 城寨（Stockade）真实山巅山寨与外围 DE 平顶阶梯丘陵生成（全整数台地 + DE 0x14103CC60 切坡）
   */
  public flattenStockadeTerraces(
    screenX: number,
    screenY: number,
    W: number,
    H: number,
    seedStr: string,
    fencePts: ReadonlyArray<{ x: number; y: number }> = []
  ): { centerLevel: number; villageLevel: number; fenceLevel: number } {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return { centerLevel: 6, villageLevel: 4, fenceLevel: 2 };
    const BINS = 32;
    const fenceR = new Float32Array(BINS);
    const fenceRIn = new Float32Array(BINS);
    for (const p of fencePts) {
      const q = this.screenToCell(p.x, p.y, W, H);
      if (!q) continue;
      const d = Math.hypot(q.gx - c.gx, q.gy - c.gy);
      const k = ((Math.round(Math.atan2(q.gy - c.gy, q.gx - c.gx) / (2 * Math.PI) * BINS) % BINS) + BINS) % BINS;
      fenceR[k] = Math.max(fenceR[k], d);
      fenceRIn[k] = fenceRIn[k] > 0 ? Math.min(fenceRIn[k], d) : d;
    }
    const hasFence = fenceR.some(v => v > 0);
    if (hasFence) for (const arr of [fenceR, fenceRIn]) {
      const src = Float32Array.from(arr);
      for (let k = 0; k < BINS; k++) {
        if (src[k] > 0) continue;
        let l = 1, r = 1;
        while (src[(k - l + BINS) % BINS] <= 0) l++;
        while (src[(k + r) % BINS] <= 0) r++;
        arr[k] = (src[(k - l + BINS) % BINS] * r + src[(k + r) % BINS] * l) / (l + r);
      }
    }
    const binAt = (arr: Float32Array, theta: number): number => {
      const f = ((theta / (2 * Math.PI)) * BINS % BINS + BINS) % BINS;
      const k0 = Math.floor(f) % BINS, k1 = (k0 + 1) % BINS, t = f - Math.floor(f);
      return arr[k0] * (1 - t) + arr[k1] * t;
    };
    const fenceAt = (theta: number): number => binAt(fenceR, theta);
    const fenceInAt = (theta: number): number => binAt(fenceRIn, theta);
    let fenceMax = 0;
    for (let k = 0; k < BINS; k++) { fenceMax = Math.max(fenceMax, fenceR[k]); }
    const FENCE_PAD = 1.0;

    const N = this.N;
    const M = this.isoM;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const centerLevel = 6;
    const villageLevel = 4;
    const fenceLevel = 2;

    const shapeRoll = rnd();
    let shapeMode: 'circle' | 'diamond' | 'ridge' | 'organic' = 'circle';
    let ridgeAngle = 0;
    let R1 = 3.6, R2 = 7.0, R3 = 9.8;

    if (shapeRoll < 0.35) {
      shapeMode = 'circle';
      R1 = 3.8; R2 = 7.2; R3 = 10.0;
    } else if (shapeRoll < 0.65) {
      shapeMode = 'diamond';
      R1 = 2.8; R2 = 6.2; R3 = 8.8;
    } else if (shapeRoll < 0.85) {
      shapeMode = 'ridge';
      ridgeAngle = rnd() * Math.PI;
      R1 = 3.2; R2 = 6.6; R3 = 9.4;
    } else {
      shapeMode = 'organic';
      R1 = 3.0; R2 = 6.5; R3 = 9.2;
    }

    const cosR = Math.cos(ridgeAngle), sinR = Math.sin(ridgeAngle);
    const phase1 = rnd() * 6.28;
    const phase2 = rnd() * 6.28;
    const deformAmp = shapeMode === 'circle' ? 0.04 + rnd() * 0.03 : (0.09 + rnd() * 0.06);

    const cx = c.gx, cy = c.gy;

    this.cornerElev.fill(0);
    this.isoElev.fill(0);

    const isoTileElev = new Int8Array(M * M);
    for (let I = 0; I < M; I++) {
      for (let J = 0; J < M; J++) {
        const x = (I - (J - N)) * 0.5;
        const y = (I + (J - N)) * 0.5;
        if (x < 0 || x > N || y < 0 || y > N) continue;
        const dx = x - cx, dy = y - cy;
        if (hasFence) {
          const d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
          const rf0 = fenceAt(th), q = d / fenceInAt(th);
          if (d <= rf0 + FENCE_PAD) {
            if (q <= 0.28) isoTileElev[I * M + J] = centerLevel;
            else if (q <= 0.80) isoTileElev[I * M + J] = villageLevel;
            else isoTileElev[I * M + J] = fenceLevel;
          }
          continue;
        }

        let dShape = 0;
        if (shapeMode === 'circle') {
          dShape = Math.hypot(dx, dy);
        } else if (shapeMode === 'diamond') {
          dShape = Math.hypot(dx, dy) * 0.30 + (Math.abs(dx) + Math.abs(dy)) * 0.70;
        } else if (shapeMode === 'ridge') {
          const rx = dx * cosR + dy * sinR;
          const ry = -dx * sinR + dy * cosR;
          dShape = Math.hypot(rx * 0.75, ry * 1.40);
        } else {
          const dist = Math.hypot(dx, dy * 1.25);
          const theta = Math.atan2(dy, dx);
          dShape = dist / (1.0 + 0.15 * Math.sin(3 * theta + phase1) + 0.08 * Math.cos(4 * theta + phase2));
        }

        const theta = Math.atan2(dy, dx);
        const rJitter = 1.0 + deformAmp * Math.sin(2 * theta + phase1) + (deformAmp * 0.5) * Math.cos(3 * theta + phase2);
        const r1 = R1 * rJitter;
        const r2 = R2 * rJitter;
        const r3 = R3 * rJitter;

        if (dShape <= r1) {
          isoTileElev[I * M + J] = centerLevel;
        } else if (dShape <= r2) {
          isoTileElev[I * M + J] = villageLevel;
        } else if (dShape <= r3) {
          isoTileElev[I * M + J] = fenceLevel;
        }
      }
    }

    // 用 DE `clean_elevation` (0x14103CC60) 在三层平顶山寨台地之间切出每格降 1 级的等轴阶梯斜坡
    this.cleanDeIsoElevation(isoTileElev, centerLevel);
    for (let i = 0; i < M * M; i++) {
      this.isoElev[i] = isoTileElev[i];
    }
    this.syncCornerElevFromIso();

    this.generateDeElevationGrid(cx, cy, (hasFence ? fenceMax + FENCE_PAD : R3) + fenceLevel + 2.5, 3.0, rnd, 'stockade');

    this.updateCornerLight();
    this.elevDirty = true;

    return { centerLevel, villageLevel, fenceLevel };
  }

  /** 按屏幕逻辑坐标取地面高程级（未乘 DE_ELEV_H） */
  public elevationLevelAt(screenX: number, screenY: number, W: number, H: number): number {
    return this.elevationLiftAt(screenX, screenY, W, H) / DE_ELEV_H;
  }

  /** 取以屏幕坐标为中心、radiusCells 格内的最高高程级（用于城池就势托举在中央高地上） */
  public maxElevationLevelInRadius(screenX: number, screenY: number, W: number, H: number, radiusCells: number): number {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return 0;
    const V = this.N + 1;
    const r = radiusCells;
    const x0 = Math.max(0, Math.floor(c.gx - r)), x1 = Math.min(this.N, Math.ceil(c.gx + r));
    const y0 = Math.max(0, Math.floor(c.gy - r)), y1 = Math.min(this.N, Math.ceil(c.gy + r));
    let maxE = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (Math.hypot(x - c.gx, y - c.gy) > r) continue;
        const e = this.cornerElev[y * V + x] ?? 0;
        if (e > maxE) maxE = e;
      }
    }
    return maxE;
  }

  /** 地基改动攒够后一次上传（carveFoundation / flattenFoundation 之后调用一次） */
  public flushFoundation(): void {
    if (this.elevDirty) {
      this.updateCornerLight();
      if (this.buf) this.gl.deleteBuffer(this.buf);
      this.buf = null;                 // render() 里按新高程重建顶点
      this.elevDirty = false;
    }
    if (!this.fieldDirty || !this.fieldPixels || !this.fieldTex) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.N, this.N, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.fieldPixels);
    this.fieldDirty = false;
  }

  public destroy(): void {
    const gl = this.gl;
    if (this.buf) gl.deleteBuffer(this.buf);
    if (this.fieldTex) gl.deleteTexture(this.fieldTex);
    if (this.grassTex) gl.deleteTexture(this.grassTex);
    if (this.sandTex) gl.deleteTexture(this.sandTex);
    if (this.forestTex) gl.deleteTexture(this.forestTex);
    if (this.waterTex) gl.deleteTexture(this.waterTex);
    if (this.dirtTex) gl.deleteTexture(this.dirtTex);
    if (this.dryTex) gl.deleteTexture(this.dryTex);
    gl.deleteProgram(this.prog);
  }

  /**
   * 静态异步工厂方法：按 mapData 按需加载贴图并创建图层
   * 🔴 [2026-10-11] 底层素材（草/沙/林/水/泥/枯）按**战场所在气候主题**取，
   *    来源统一为一份 `environmentPlan.groundTiles`（＝ Scene13DeMapThemes 那张表）；
   *    彻底实现 DE 原版多底图混搭原野。
   */
  public static async create(canvas: HTMLCanvasElement, mapData: any, tiles?: Partial<Scene13GroundTiles>): Promise<Scene13GroundLayerGL> {
    const data = transposeMapData(mapData);

    /** 取图并记下最终用了哪个文件名（取不到 → 退回 fallback；两者都失败 → null） */
    const loadTile = async (tile: string | undefined, fallback: string): Promise<{ img: HTMLImageElement | null; tile: string }> => {
      const want = tile ?? fallback;
      const img = await loadImg('/SUCAI_TERRAIN/' + want + '.png');
      if (img) return { img, tile: want };
      if (want === fallback) return { img: null, tile: fallback };
      return { img: await loadImg('/SUCAI_TERRAIN/' + fallback + '.png'), tile: fallback };
    };

    const [grass, sand, forest, water, dirt, dry] = await Promise.all([
      loadTile(tiles?.grass, 'gr2'),
      loadTile(tiles?.sand, 'bch'),
      loadTile(tiles?.forest, 'for'),
      loadTile(tiles?.water, 'river_clean_green'),
      loadTile(tiles?.dirt, 'ds3'),
      loadTile(tiles?.dry, 'gr7'),
    ]);

    const layer = new Scene13GroundLayerGL(canvas, data, grass.img, sand.img, forest.img, water.img, dirt.img, dry.img, grass.tile);
    layer.isIce = water.tile === 'ic2' || water.tile === 'ice';
    if (layer.grassTex) attachTexImage(layer.grassTex, grass.img, grass.tile);
    if (layer.sandTex) attachTexImage(layer.sandTex, sand.img, sand.tile);
    if (layer.forestTex) attachTexImage(layer.forestTex, forest.img, forest.tile);
    if (layer.waterTex) attachTexImage(layer.waterTex, water.img, water.tile);
    if (layer.dirtTex) attachTexImage(layer.dirtTex, dirt.img, dirt.tile);
    if (layer.dryTex) attachTexImage(layer.dryTex, dry.img, dry.tile);
    return layer;
  }
}
