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

    // 🔴 [2026-10-12 REA逆向 + 真实地理 DEM 耦合：DE 原版有机山丘扩散算法 (_base_elevation_generate_14135e990)]
    // 保留战略地图 z13 真实 DEM 山脉/河谷方位骨架，将 DE 多团波前并发扩散山丘锚定在真实高地走势上，
    // 实现「平原开阔、山地循脉、背山面水」的真实历史地理放大效果，同时兼具 DE 原版平顶斜坡美感。
    if (data.elev && data.elev.length === this.N * this.N) {
      const N = this.N;
      const elev = data.elev;
      const origElev = this.origElev;
      let seed = 2166136261;
      for (let i = 0; i < N * N; i++) {
        const v = Math.max(0, Math.min(7, elev[i] ?? 0));
        origElev[i] = v;
        if (i < 256) {
          seed = Math.imul(seed ^ (v + i), 16777619) >>> 0;
        }
      }
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      const isWetCell = (x: number, y: number): boolean => {
        if (!data.terrain) return false;
        const tid = data.terrain[y * N + x];
        if (tid === 1 || tid === 2 || tid === 23) return true;
        const m = DE_TERRAIN_MANIFEST[tid];
        return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
      };

      const cx = Math.floor(N / 2), cy = Math.floor(N / 2);

      // 统计战略地图 z13 真实 DEM 的山脊种子点与起伏度（区分大平原 vs 丘陵/关隘）
      const ridgeSeeds: Array<[number, number]> = [];
      let elevatedCells = 0;
      for (let y = 8; y < N - 8; y += 2) {
        for (let x = 8; x < N - 8; x += 2) {
          if (isWetCell(x, y)) continue;
          const oe = origElev[y * N + x];
          if (oe >= 1) elevatedCells++;
          if (oe >= 2 && Math.hypot(x - cx, y - cy) >= 22) {
            ridgeSeeds.push([x, y]);
          }
        }
      }
      const sampledTotal = Math.max(1, Math.floor((N - 16) / 2) * Math.floor((N - 16) / 2));
      const reliefRatio = elevatedCells / sampledTotal;

      // 1. 中央城址平顶台地（城郭安坐于平展台基之上，避开河道水体，无切糕感）
      const plateauTiles = Math.floor(N * N * 0.16);
      const qPlateau: Array<[number, number]> = [[cx, cy]];
      const inPlateau = new Uint8Array(N * N);
      inPlateau[cy * N + cx] = 1;
      let countP = 0;
      while (qPlateau.length > 0 && countP < plateauTiles) {
        const idx = Math.floor(rnd() * qPlateau.length);
        const [x, y] = qPlateau.splice(idx, 1)[0];
        countP++;
        if (!isWetCell(x, y)) {
          const distCenter = Math.hypot(x - cx, y - cy);
          const h = distCenter < 26 ? 2 : 1;
          elev[y * N + x] = Math.max(elev[y * N + x] ?? 0, h);
        }

        const neighbors: Array<[number, number]> = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 2 && nx < N - 2 && ny >= 2 && ny < N - 2 && !inPlateau[ny * N + nx]) {
            const dIso = Math.hypot(nx - cx, (ny - cy) * 1.25);
            if (dIso < 42) {
              inPlateau[ny * N + nx] = 1;
              qPlateau.push([nx, ny]);
            }
          }
        }
      }

      // 2. 真实地理导向的 DE 原野有机山丘（平原少丘缓坡，山地沿真实 DEM 山脊波前扩散）
      const clumps = ridgeSeeds.length > 24
        ? 22
        : ridgeSeeds.length > 6
          ? 14
          : reliefRatio < 0.08
            ? 6
            : 10;
      const qClumps: Array<Array<[number, number]>> = [];
      const clumpTargetH: number[] = [];
      const clumpMaxTiles: number[] = [];
      for (let c = 0; c < clumps; c++) {
        let sx: number, sy: number;
        if (ridgeSeeds.length > 0 && rnd() < 0.82) {
          // 优先锚定在战略地图真实 DEM 山脊/高地坐标上
          const pick = ridgeSeeds[Math.floor(rnd() * ridgeSeeds.length)];
          sx = pick[0];
          sy = pick[1];
        } else {
          sx = 8 + Math.floor(rnd() * (N - 16));
          sy = 8 + Math.floor(rnd() * (N - 16));
        }
        if (Math.hypot(sx - cx, sy - cy) < 22 || isWetCell(sx, sy)) continue;
        const baseOe = origElev[sy * N + sx];
        // 平原低地仅起 1 级微丘；真实山地/丘陵按原 DEM 高度延伸 1~3 级 DE 平顶山脊
        const maxAdd = baseOe >= 3 ? 3 : baseOe >= 1 ? 2 : 1;
        const targetH = 1 + Math.floor(rnd() * maxAdd);
        const maxT = (baseOe >= 2 ? 75 : 40) + Math.floor(rnd() * 85);
        qClumps.push([[sx, sy]]);
        clumpTargetH.push(targetH);
        clumpMaxTiles.push(maxT);
      }

      for (let c = 0; c < qClumps.length; c++) {
        const q = qClumps[c];
        const hAdd = clumpTargetH[c];
        const maxT = clumpMaxTiles[c];
        let placed = 0;
        const visitedClump = new Uint8Array(N * N);
        if (q.length > 0) visitedClump[q[0][1] * N + q[0][0]] = 1;

        while (q.length > 0 && placed < maxT) {
          const idx = Math.floor(rnd() * q.length);
          const [x, y] = q.splice(idx, 1)[0];
          if (isWetCell(x, y)) continue;
          placed++;
          const capH = origElev[y * N + x] >= 3 ? 6 : origElev[y * N + x] >= 1 ? 5 : 3;
          elev[y * N + x] = Math.min(capH, Math.max(elev[y * N + x] ?? 0, origElev[y * N + x] + hAdd));

          const neighbors: Array<[number, number]> = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 2 && nx < N - 2 && ny >= 2 && ny < N - 2 && !visitedClump[ny * N + nx] && !isWetCell(nx, ny)) {
              // 顺应真实 DEM 走势扩散：真实高地方向满概率延伸，低平方向适度收敛
              if (origElev[ny * N + nx] >= origElev[y * N + x] || rnd() < 0.68) {
                visitedClump[ny * N + nx] = 1;
                q.push([nx, ny]);
              }
            }
          }
        }
      }

      // 3. DE 原版平滑梯级约束：强制保证全图相邻格落差 ≤ 1（消除任何悬空或垂直阶梯破面）
      for (let pass = 0; pass < 4; pass++) {
        for (let y = 1; y < N - 1; y++) {
          for (let x = 1; x < N - 1; x++) {
            const cur = elev[y * N + x];
            const maxNbr = Math.max(elev[y * N + (x - 1)], elev[y * N + (x + 1)], elev[(y - 1) * N + x], elev[(y + 1) * N + x]);
            if (cur < maxNbr - 1) {
              elev[y * N + x] = maxNbr - 1;
            }
          }
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

    // 3. 高程与法线打光
    const V_SIZE = this.N + 1;
    this.cornerElev = new Float32Array(V_SIZE * V_SIZE);
    this.cornerLight = new Float32Array(V_SIZE * V_SIZE);
    this.computeCornerElev();
  }

  private computeCornerElev(): void {
    const N = this.N;
    const V_SIZE = N + 1;
    const elev = this.data.elev;
    const elevAt = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N || !elev ? 0 : (elev[y * N + x] ?? 0));
    const waterAt = (x: number, y: number) => {
      const cx = Math.min(N - 1, Math.max(0, Math.floor(x)));
      const cy = Math.min(N - 1, Math.max(0, Math.floor(y)));
      return this.smoothWater ? (this.smoothWater[cy * N + cx] ?? 0) : 0;
    };

    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        let sum = 0, count = 0;
        if (gx > 0 && gy > 0) { sum += elevAt(gx - 1, gy - 1); count++; }
        if (gx < N && gy > 0) { sum += elevAt(gx, gy - 1); count++; }
        if (gx > 0 && gy < N) { sum += elevAt(gx - 1, gy); count++; }
        if (gx < N && gy < N) { sum += elevAt(gx, gy); count++; }
        const baseE = count > 0 ? sum / count : 0;

        // 水体及近岸湿滩自动压平高程，杜绝河面/湖面悬空
        const w = Math.max(
          waterAt(gx, gy),
          waterAt(gx - 1, gy),
          waterAt(gx + 1, gy),
          waterAt(gx, gy - 1),
          waterAt(gx, gy + 1)
        );
        const dryMask = 1.0 - Math.min(1.0, Math.max(0.0, (w - 0.12) / 0.26));
        this.cornerElev[gy * V_SIZE + gx] = baseE * dryMask;
      }
    }
    this.updateCornerLight();
  }

  private updateCornerLight(): void {
    const N = this.N;
    const V_SIZE = N + 1;
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        const hC = this.cornerElev[gy * V_SIZE + gx];
        const hL = gx > 0 ? this.cornerElev[gy * V_SIZE + (gx - 1)] : hC;
        const hR = gx < N ? this.cornerElev[gy * V_SIZE + (gx + 1)] : hC;
        const hU = gy > 0 ? this.cornerElev[(gy - 1) * V_SIZE + gx] : hC;
        const hD = gy < N ? this.cornerElev[(gy + 1) * V_SIZE + gx] : hC;
        const dhx = (hR - hL) / (gx > 0 && gx < N ? 2 : 1);
        const dhy = (hD - hU) / (gy > 0 && gy < N ? 2 : 1);

        // 🔴 [REA逆向 + climate-regions.md §5.6.14 校准：DE 真实等轴坡面光照]
        // 等轴投影下 (dhx - dhy) 为屏幕横向坡度，(dhx + dhy) 为屏幕纵向坡度；
        // 以横向斜光为主、纵向分量为辅（纵横比 ≤0.28），消除贯穿屏幕的纵向明暗条带，同时保留山脊清晰立体感。
        const slopeTowardSun = (dhx - dhy) * 0.68 + (dhx + dhy) * 0.22;
        let light = 1.0;
        if (slopeTowardSun > 0.01) {
          // 向阳受光坡面：DE 原生 ~+18% 提亮
          light = 1.0 + Math.min(0.20, slopeTowardSun * 0.45);
        } else if (slopeTowardSun < -0.01) {
          // 背阳阴影坡面：DE 原生 ~-24% 压暗
          light = 1.0 + Math.max(-0.24, slopeTowardSun * 0.52);
        }
        // 高地微弱天光增益
        const elevBoost = Math.min(0.06, hC * 0.015);
        this.cornerLight[gy * V_SIZE + gx] = Math.max(0.76, Math.min(1.22, light + elevBoost));
      }
    }

    // 🔴 [2026-10-12 REA逆向：3x3 空间柔和高斯平滑滤波]
    // 彻底消除网格整数差分产生的阶梯台阶与硬边锯齿，使山体阴影如 DE 原版般自然柔和、蜿蜒有机
    const rawLight = new Float32Array(this.cornerLight);
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        let sum = 0, totalW = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = gy + dy;
          if (ny < 0 || ny > N) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx;
            if (nx < 0 || nx > N) continue;
            const w = (dx === 0 && dy === 0) ? 4 : ((dx === 0 || dy === 0) ? 2 : 1);
            sum += rawLight[ny * V_SIZE + nx] * w;
            totalW += w;
          }
        }
        this.cornerLight[gy * V_SIZE + gx] = sum / totalW;
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

  private rebuildBuffers(): void {
    const gl = this.gl;
    const N = this.N;
    const V_SIZE = N + 1;
    const TRI = [0, 1, 2, 0, 2, 3];
    const centerY = (N - 1) * dy;

    const verts: number[] = [];

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i0 = y * V_SIZE + x;
        const i1 = y * V_SIZE + (x + 1);
        const i2 = (y + 1) * V_SIZE + (x + 1);
        const i3 = (y + 1) * V_SIZE + x;

        const cElev = [this.cornerElev[i0], this.cornerElev[i1], this.cornerElev[i2], this.cornerElev[i3]];
        const cLight = [this.cornerLight[i0], this.cornerLight[i1], this.cornerLight[i2], this.cornerLight[i3]];
        const guv = [
          [x, y],
          [x + 1, y],
          [x + 1, y + 1],
          [x, y + 1]
        ];

        for (const t of TRI) {
          const gx = guv[t][0], gy = guv[t][1];
          verts.push(
            this.offX + (gx - N * 0.5) * TW,
            centerY + (gy - N * 0.5) * TH - (cElev[t] * DE_ELEV_H),
            gx,
            gy,
            cLight[t]
          );
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
   * 采用四角双线性插值，每级高程对应 16 像素抬升。
   */
  public elevationLiftAt(screenX: number, screenY: number, W: number, H: number): number {
    const N = this.N;
    const gx = (screenX - W / 2) / TW + N * 0.5;
    const gy = (screenY - H / 2) / TH + N * 0.5;
    const V_SIZE = N + 1;
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return 0;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const x1 = Math.min(N, x0 + 1), y1 = Math.min(N, y0 + 1);
    const tx = gx - x0, ty = gy - y0;
    const e00 = this.cornerElev[y0 * V_SIZE + x0];
    const e10 = this.cornerElev[y0 * V_SIZE + x1];
    const e01 = this.cornerElev[y1 * V_SIZE + x0];
    const e11 = this.cornerElev[y1 * V_SIZE + x1];
    const elev = (e00 * (1 - tx) + e10 * tx) * (1 - ty) + (e01 * (1 - tx) + e11 * tx) * ty;
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
   * 城池地基整平：以屏幕逻辑坐标为中心、radiusCells 格内的高程拉平到 level（外缘 4.5 格 S 曲线缓坡过渡），
   * 让整座城（建筑 / 城墙 / 地基层）站在同一高度的高台/平地上。改完调 flushFoundation 生效。
   */
  public flattenFoundation(screenX: number, screenY: number, W: number, H: number, radiusCells: number, level: number): void {
    const c = this.screenToCell(screenX, screenY, W, H);
    if (!c) return;
    const V = this.N + 1;
    const r = radiusCells;
    const slopeW = 1.5;
    const x0 = Math.max(0, Math.floor(c.gx - r - slopeW - 1)), x1 = Math.min(this.N, Math.ceil(c.gx + r + slopeW + 1));
    const y0 = Math.max(0, Math.floor(c.gy - r - slopeW - 1)), y1 = Math.min(this.N, Math.ceil(c.gy + r + slopeW + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.abs(x - c.gx) + Math.abs(y - c.gy);
        const s = Math.min(1, Math.max(0, (d - r) / slopeW));
        if (s >= 1) continue;
        const t = s * s * (3 - 2 * s); // Smoothstep 缓坡过渡：圈内 0（整平）→ 外缘 1（原样）
        const i = y * V + x;
        this.cornerElev[i] = level + (this.cornerElev[i] - level) * t;
      }
    }
    this.elevDirty = true;
  }

  /**
   * 🔴 [2026-10-12 主人令「大城（Big City）：主城坐落开阔平原，周边远景散落 1~3 级开阔缓坡与远山」]
   * 大城都城宏伟开阔地势生成：
   * 1. 广袤平原主城基底：城池与宽幅护城河整平在 0 级开阔平坦地基上，保障大军排兵布阵与城防完整；
   * 2. 远景散落 1~3 级开阔缓坡与远山：在城防外围（28~48格）舒缓展开 4 组大范围平缓远山丘陵（半径 14~20 格宽），
   *    采用 C1 连续四次多项式平滑衰减，无锯齿、波澜壮阔，呈现帝国都城“一望无际、远山如黛”的壮美地理气象。
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
    const N = this.N, V = N + 1;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const cx = c.gx, cy = c.gy;
    const rFlat = flatCells;

    // 🔴 [彻底根除固定底图残留] 大城坐落开阔平原，全图基底高程统一重置为 0 级！
    // 杜绝构造函数中默认写死种子生成的中央高台边缘残留，确保平原纯净开阔
    this.cornerElev.fill(0);

    // 2. 远景原野：DE 真实团块元胞生长（中心高四周低，全随机分布）
    this.generateDeElevationGrid(cx, cy, rFlat + 4.5, 3.0, rnd, 'big_city');

    this.updateCornerLight();
    this.elevDirty = true;
  }

  /**
   * 🔴 [2026-10-12 主人令「所有的高地丘陵分布，请随机，千万不要一致，都一样的话太单调了，还不如不弄呢」]
   * 全据点外围高地丘陵宏观格局与微观形态真正全随机生成系统：
   * 包含 6 大宏观地势格局（Macro Layout Patterns）：
   *  0. crescent (新月环抱)：3~6 座群山呈马蹄弧形环抱城池一侧，朝向与弧度全随机；
   *  1. single_massif (单侧崇山屏障)：1~2 座巨型主峰连绵，余脉延展，另一侧完全平坦；
   *  2. ridge_corridor (峡谷走廊通道)：两侧山梁夹峙，通道轴向全随机；
   *  3. scattered_cluster (错落起伏群丘)：3~7 处大小不一山丘散落，距离、方位、尺寸参差错落；
   *  4. isolated_peaks (广袤平原孤峰/双峰)：仅 1~2 座孤耸拔地而起，四周空旷一马平川；
   *  5. chain_range (斜贯山脊余脉)：整条斜向山梁切过原野；
   * 每座山包的半径、高度、等轴椭圆长宽比、主轴旋转角、谐波轮廓扰动均全面随机，彻底杜绝任何固定象限或千篇一律！
   */
  /**
   * 🔴 [2026-10-12 主人令「所有地图的丘陵分布要中心高，周围低，分布随机」]
   * 彻底废除数学公式圆包，采用纯正 DE（帝国时代2 Genie 引擎 RMS）分层内聚元胞团块蔓延算法：
   * 1. 纯整数瓦片高程（0~7 级）；
   * 2. 城池保护区避让（`rProtect` 内强制保持基础平坦或专属台地高度）；
   * 3. 团块元胞邻域随机蔓延（Cellular Growth）：
   *    - 第 1 级基础山基：在地图空闲区域随机撒种子，向四周邻域随机生长出大面积平缓 1 级台地；
   *    - 第 2 级山腰台地：严格在 1 级核心区域内部撒种子，缩小面积向外蔓延出 2 级；
   *    - 第 3~N 级主峰：逐级向核心收敛生长，天然呈现「中心最高，向四周层层台阶跌落，山脊走向有机随机」的真实山貌！
   * 4. 坡度落差约束（Slope Clamping）：相邻两格整数落差绝对不能大于 1 级（形成标准 45° 阶梯斜坡）；
   * 5. 角点网格双线性转换并赋予西北光照。
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
    const V = N + 1;
    const tileElev = new Int8Array(N * N);

    // 1. 识别保护区（城池或据点地基）与水体禁区（山丘不长进河湖海面）
    const inProtect = (gx: number, gy: number) => Math.hypot(gx - cx, (gy - cy) * 1.35) < rProtect;
    const isWet = (gx: number, gy: number) =>
      gx >= 0 && gx < N && gy >= 0 && gy < N && (this.smoothWater[gy * N + gx] ?? 0) >= 0.18;

    // 2. 根据场景类型，决定野外山体群（Hill Clusters）的数量与规格
    // 大城周围远山平缓开阔；关隘与山寨崇山峻岭巍峨；中城小城参差起伏
    const isBig = category === 'big_city';
    const isPass = category === 'pass';
    const isStockade = category === 'stockade';

    let clumpCount = 3 + Math.floor(rnd() * 4); // 3 ~ 6 组独立山丘群
    if (isBig) clumpCount = 3 + Math.floor(rnd() * 3);
    else if (isPass) clumpCount = 4 + Math.floor(rnd() * 3);
    else if (isStockade) clumpCount = 2 + Math.floor(rnd() * 3);

    // 3. 仿 DE 原版 <ELEVATION_GENERATION>：
    // 每个山头团块（Clump）先生长出一片连续多边形区域，然后通过 BFS 边界距离场计算高度：
    // 到团块外边缘的距离 = 抬升高度（最大封顶到 peakH）
    // 这正是 DE Genie 引擎（及 tools/rms/rmsEngine.mjs:642）纯正的原生算法！
    const D4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // 随机生长一个自然多边形团块
    const growClumpRegion = (seedX: number, seedY: number, targetTiles: number): Set<number> => {
      const clump = new Set<number>();
      const frontier: number[] = [];
      const startIdx = seedY * N + seedX;

      if (seedX < 2 || seedX >= N - 2 || seedY < 2 || seedY >= N - 2) return clump;
      if (inProtect(seedX, seedY) || isWet(seedX, seedY) || tileElev[startIdx] > 0) return clump;

      clump.add(startIdx);
      frontier.push(startIdx);

      while (frontier.length > 0 && clump.size < targetTiles) {
        const pickIdx = Math.floor(rnd() * frontier.length);
        const cur = frontier[pickIdx];
        const cx0 = cur % N, cy0 = Math.floor(cur / N);

        let expanded = false;
        const shuffled = [...D4].sort(() => rnd() - 0.5);
        for (const [dx, dy] of shuffled) {
          const nx = cx0 + dx, ny = cy0 + dy;
          if (nx < 2 || nx >= N - 2 || ny < 2 || ny >= N - 2) continue;
          if (inProtect(nx, ny) || isWet(nx, ny)) continue;
          const nbr = ny * N + nx;
          if (clump.has(nbr) || tileElev[nbr] > 0) continue;

          clump.add(nbr);
          frontier.push(nbr);
          expanded = true;
          if (clump.size >= targetTiles) break;
        }

        if (!expanded) {
          frontier[pickIdx] = frontier[frontier.length - 1];
          frontier.pop();
        }
      }

      return clump;
    };

    // 🔴 [2026-10-12 主人令「我觉得有树的地方该有丘陵」「森林地下是铺满整块 forestFloorTile 的」]
    // 找出地图中所有森林/树木聚集的密集区核心，以及战略地图 z13 真实 DEM 高地山脊（origElev >= 2），
    // 共同作为优先山头种子：有树林的地方脚下必然升起丘陵，外围山体走势也与战略地图真实地形一脉相承！
    const prioritySeeds: Array<{ x: number; y: number }> = [];
    const sf = this.smoothForest;
    if (sf) {
      for (let y = 3; y < N - 3; y += 3) {
        for (let x = 3; x < N - 3; x += 3) {
          if (inProtect(x, y) || isWet(x, y)) continue;
          if (sf[y * N + x] >= 0.18) {
            // 间距 5 格：足够密集覆盖全图大大小小所有林块与林缘
            const close = prioritySeeds.some(s => Math.hypot(s.x - x, s.y - y) < 5);
            if (!close) prioritySeeds.push({ x, y });
          }
        }
      }
    }
    if (this.origElev && this.origElev.length === N * N) {
      for (let y = 4; y < N - 4; y += 4) {
        for (let x = 4; x < N - 4; x += 4) {
          if (inProtect(x, y) || isWet(x, y)) continue;
          if (this.origElev[y * N + x] >= 2) {
            const close = prioritySeeds.some(s => Math.hypot(s.x - x, s.y - y) < 6);
            if (!close) prioritySeeds.push({ x, y });
          }
        }
      }
    }

    // 4. 逐个团块生成并计算 DE 原版「边缘距离场」
    // DE 原版规则：离团边缘越近，高度越低（1级）；越向内部深入，高度递增（直到 peakH）。
    // 总团数 = 森林/真实山脊所在山丘数 + 原野自然开阔山丘数
    const totalClumps = Math.max(clumpCount, prioritySeeds.length + (isBig ? 3 : 2));
    for (let c = 0; c < totalClumps; c++) {
      let seedX = 0, seedY = 0, found = false;

      // 优先从森林核心点与真实 DEM 山脊点取种子
      if (c < prioritySeeds.length) {
        const ps = prioritySeeds[c];
        if (!inProtect(ps.x, ps.y) && !isWet(ps.x, ps.y) && tileElev[ps.y * N + ps.x] === 0) {
          seedX = ps.x;
          seedY = ps.y;
          found = true;
        }
      }

      if (!found) {
        for (let attempt = 0; attempt < 60; attempt++) {
          const sx = 4 + Math.floor(rnd() * (N - 8));
          const sy = 4 + Math.floor(rnd() * (N - 8));
          if (!inProtect(sx, sy) && !isWet(sx, sy) && tileElev[sy * N + sx] === 0) {
            seedX = sx;
            seedY = sy;
            found = true;
            break;
          }
        }
      }
      if (!found) continue;

      // 主峰高度：大城 2~3 级；中城 3~4 级；关隘/山寨 4~6 级（结合真实 DEM 抬升）
      const demH = this.origElev ? (this.origElev[seedY * N + seedX] ?? 0) : 0;
      let peakH = 2;
      if (isBig) peakH = 2 + ((rnd() < 0.4 || demH >= 3) ? 1 : 0);
      else if (isPass) peakH = 3 + Math.floor(rnd() * (maxLevel - 2));
      else if (isStockade) peakH = 3 + Math.floor(rnd() * (maxLevel - 2));
      else peakH = Math.max(demH >= 3 ? 3 : 2, 2 + Math.floor(rnd() * (maxLevel - 1)));
      peakH = Math.max(1, Math.min(maxLevel, peakH));

      // 团块瓦片数：DE 规模，足够形成宽阔起伏山体（大城 120~260 格，中小城 90~180 格）
      const clumpTiles = isBig ? (120 + Math.floor(rnd() * 140)) : (90 + Math.floor(rnd() * 100));
      const region = growClumpRegion(seedX, seedY, clumpTiles);
      if (region.size < 16) continue;

      // ── DE 原生距离场算法（BFS 边缘向心剥洋葱）──
      // 找出所有紧邻外部边界的格子，标记为 1 级（边缘坡脚），入队列
      const dist = new Map<number, number>();
      let q: number[] = [];

      for (const idx of region) {
        const x = idx % N, y = Math.floor(idx / N);
        let isEdge = false;
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= N || ny < 0 || ny >= N || !region.has(ny * N + nx)) {
            isEdge = true;
            break;
          }
        }
        if (isEdge) {
          dist.set(idx, 1);
          q.push(idx);
        }
      }

      // 逐层向内扩散，每向里走一步，高度 +1
      while (q.length > 0) {
        const nextQ: number[] = [];
        for (const idx of q) {
          const curD = dist.get(idx)!;
          const x = idx % N, y = Math.floor(idx / N);
          for (const [dx, dy] of D4) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
            const nbr = ny * N + nx;
            if (region.has(nbr) && !dist.has(nbr)) {
              dist.set(nbr, curD + 1);
              nextQ.push(nbr);
            }
          }
        }
        q = nextQ;
      }

      // 将计算出的高度写入 tileElev，最高封顶至 peakH
      for (const idx of region) {
        const d = dist.get(idx) ?? 1;
        const h = Math.min(peakH, d);
        tileElev[idx] = Math.max(tileElev[idx], h);
      }
    }

    // 5. 坡度阶梯扫描限制（Slope Clamping）
    // 保证相邻两格落差绝对不能大于 1 级，形成标准 45° 台阶斜坡
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          if (inProtect(x, y)) continue;
          const cur = tileElev[y * N + x];
          for (const [dx, dy] of D4) {
            const nbrH = tileElev[(y + dy) * N + (x + dx)];
            if (cur - nbrH > 1) {
              tileElev[y * N + x] = nbrH + 1;
              changed = true;
              break;
            }
          }
        }
      }
      if (!changed) break;
    }

    // 6. 将整数瓦片高程叠加/融合至 cornerElev 角点网格中
    // 角点 (gx, gy) 的高度由相邻 4 个整数格子的均值决定，形成标准等轴斜坡与台地；水域角点保持 0 平面
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        if (inProtect(gx, gy)) continue; // 保护区保留原有城址整平值
        if (
          (gx > 0 && gy > 0 && isWet(gx - 1, gy - 1)) ||
          (gx < N && gy > 0 && isWet(gx, gy - 1)) ||
          (gx > 0 && gy < N && isWet(gx - 1, gy)) ||
          (gx < N && gy < N && isWet(gx, gy))
        ) {
          continue;
        }

        let sum = 0, count = 0;
        if (gx > 0 && gy > 0) { sum += tileElev[(gy - 1) * N + (gx - 1)]; count++; }
        if (gx < N && gy > 0) { sum += tileElev[(gy - 1) * N + gx]; count++; }
        if (gx > 0 && gy < N) { sum += tileElev[gy * N + (gx - 1)]; count++; }
        if (gx < N && gy < N) { sum += tileElev[gy * N + gx]; count++; }

        const h = count > 0 ? sum / count : 0;
        if (h > 0) {
          const idx = gy * V + gx;
          this.cornerElev[idx] = Math.max(this.cornerElev[idx], h);
        }
      }
    }
  }

  /**
   * 🔴 [2026-10-12 主人令「中城/小城（Medium/Small City）：城址依据地理环境（如临河高坡、背山面水）生成半岛或台地，多样化起伏」]
   * 中城/小城地理环境与半岛/台地多样化生成：
   * 原型 1 (bluff): 临河高坡/半岛台地（城址在 2~3 级高坡台地，一侧临水临谷缓降，城门居高临下）；
   * 原型 2 (mountain_spur): 背山面水/依山面野（城后方升起 3~5 级连绵高耸靠山，城前为 0 级开阔平地/水际）；
   * 原型 3 (rolling_hills): 丘陵台地（城址在 1~2 级圆缓台地，外围环抱 3~4 组 1~4 级高低错落小丘）。
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
    const N = this.N, V = N + 1;

    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    const cx = c.gx, cy = c.gy;
    const rFlat = flatCells;
    const isMedium = cityType === 'medium_city';

    // 🔴 [彻底根除固定底图残留] 全图基底高程重置为 0 级，确保城池与丘陵纯粹由本地原型驱动
    this.cornerElev.fill(0);
    const archeRoll = rnd();
    let archeMode: 'bluff' | 'mountain_spur' | 'rolling_hills' = 'bluff';
    if (archeRoll < 0.35) {
      archeMode = 'bluff';            // 临河高坡/半岛台地
    } else if (archeRoll < 0.70) {
      archeMode = 'mountain_spur';    // 背山面水/依山面野
    } else {
      archeMode = 'rolling_hills';    // 丘陵台地
    }

    if (archeMode === 'bluff') {
      // ── 原型 1：【临河高坡 / 半岛台地】 ──
      // 城址整平在 2~3 级高台（中城 2.5 级，小城 2.0 级），外缘以平滑斜坡向原野跌落
      const baseElev = isMedium ? 2.5 : 2.0;
      for (let y = 0; y <= N; y++) {
        for (let x = 0; x <= N; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= rFlat) {
            this.cornerElev[y * V + x] = baseElev;
          } else if (dist <= rFlat + 3.0) {
            const s = (dist - rFlat) / 3.0;
            const t = s * s * (3 - 2 * s);
            this.cornerElev[y * V + x] = baseElev * (1.0 - t);
          }
        }
      }
    } else if (archeMode === 'mountain_spur') {
      // ── 原型 2：【背山面水 / 依山面野】 ──
      // 城址整平在 1 级山脚平缓地基
      for (let y = 0; y <= N; y++) {
        for (let x = 0; x <= N; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= rFlat) {
            this.cornerElev[y * V + x] = 1.0;
          } else if (dist <= rFlat + 2.0) {
            const s = (dist - rFlat) / 2.0;
            const t = s * s * (3 - 2 * s);
            this.cornerElev[y * V + x] = 1.0 * (1.0 - t);
          }
        }
      }
    } else {
      // ── 原型 3：【起伏丘陵台地】 ──
      // 城址在 1.5 级圆缓台地上
      const hillBase = isMedium ? 1.8 : 1.2;
      for (let y = 0; y <= N; y++) {
        for (let x = 0; x <= N; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= rFlat) {
            this.cornerElev[y * V + x] = hillBase;
          } else if (dist <= rFlat + 2.5) {
            const s = (dist - rFlat) / 2.5;
            const t = s * s * (3 - 2 * s);
            this.cornerElev[y * V + x] = hillBase * (1.0 - t);
          }
        }
      }
    }

    // 🔴 [2026-10-12 主人令「所有地图的丘陵分布要中心高，周围低，分布随机」]
    // 外围高地丘陵采用 DE 真实团块元胞生长（中心高四周低，全随机分布）
    const rProt = rFlat + (isMedium ? 3.0 : 2.5);
    const maxH = isMedium ? 4.0 : 3.0;
    this.generateDeElevationGrid(cx, cy, rProt, maxH, rnd, cityType);

    this.updateCornerLight();
    this.elevDirty = true;
  }

  /**
   * 🔴 [2026-10-12 主人令「PASS的布局：最中间是城堡，下一级城墙，外围城墙，城墙外围；4层随机平缓起伏 1~7 级小山包，随机多样化」]
   * 关隘（PASS）专属 4 层阶梯高台与外围多样化小山包生成：
   * 1. 第 1 层（核心顶台）：城堡（H_castle 4~7 级）；
   * 2. 第 2 层（内城平台）：内圈石墙与 8 座箭塔（H_inner = H_castle - 1~2 级）；
   * 3. 第 3 层（外城平台）：外圈石墙与四门（H_outer = H_inner - 1~2 级）；
   * 4. 第 4 层（城墙外围）：外围原野基底（0~1 级）＋ 4 组完全随机形态与高度（1~7 级）的平缓起伏小山丘。
   * 全程基于关隘 ID 和种子 PRNG 驱动，确保每座关隘形态、高程落差与山包分布千姿百态、绝不重样。
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
    if (!c) return { castleLevel: 5, innerLevel: 3, outerLevel: 2 };

    const N = this.N;
    const V = N + 1;

    // 1. 种子 PRNG 伪随机数流
    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    // 2. 居高临下且保留微幅随机性：严格保证 城堡(6.5~7) > 内城(4.5~5) > 外墙(3~3.5) > 外围丘陵(<=2.8)
    const castleLevel = 6.5 + (rnd() < 0.6 ? 0.5 : 0); // 6.5 或 7.0 级
    const innerLevel = 4.5 + (rnd() < 0.6 ? 0.5 : 0);  // 4.5 或 5.0 级
    const outerLevel = 3.0 + (rnd() < 0.5 ? 0.5 : 0);  // 3.0 或 3.5 级

    // 3. 台地边缘按实际墙件 / 建筑位置定（曼哈顿距离 |dx|+|dy|：两圈城墙在地面格里都是菱形）
    // 🔴 [2026-10-15 主人令「险要的内墙、箭塔不平你来修」] 原写死 R1=4.0（+1.8 坡）/ R2=8.6 / R3=14.2，实测独松关：
    //    箭塔在 5~6 格、坡到 5.8 才完 ⇒ 箭塔 5.01~6.15 级；内墙在 8~9 格、R2=8.6 切在墙上 ⇒ 内墙 3.81~5.00 级。
    //    改为：墙件按最大间隔分内/外两圈，箭塔取城堡以外的建筑；每道坡都放进两圈之间的空当，离墙件留 PAD 给地面双线性插值。
    const cx = c.gx, cy = c.gy;
    const manOf = (p: { x: number; y: number }): number => {
      const q = this.screenToCell(p.x, p.y, W, H);
      return q ? Math.abs(q.gx - cx) + Math.abs(q.gy - cy) : -1;
    };
    const PAD = 1.0;
    let castleTop = 2.6, castleFoot = 4.1;     // 城堡平顶 / 降到内城的坡脚
    let innerEdge = 9.8, innerFoot = 11.1;     // 内城平台外缘 / 降到外城的坡脚
    let outerEdge = 14.0;                      // 外城平台外缘（往外是攻方仰攻坡）
    const wm = wallPts.map(manOf).filter(v => v >= 0).sort((a, b) => a - b);
    if (wm.length >= 8) {
      let gi = 0, gap = 0;
      for (let i = 1; i < wm.length; i++) if (wm[i] - wm[i - 1] > gap) { gap = wm[i] - wm[i - 1]; gi = i; }
      if (gap >= 1.5) {
        const innerMax = wm[gi - 1], outerMin = wm[gi], outerMax = wm[wm.length - 1];
        innerEdge = innerMax + PAD;
        innerFoot = Math.max(innerEdge + 0.8, outerMin - PAD);
        outerEdge = outerMax + 1.0;
      } else {
        outerEdge = wm[wm.length - 1] + 1.0;   // 只有一圈墙：整圈放外城平台
        innerEdge = Math.min(innerEdge, outerEdge - 3);
        innerFoot = Math.min(innerFoot, outerEdge - 1.5);
      }
    }
    const bm = bldPts.map(manOf).filter(v => v >= 1.5).sort((a, b) => a - b);   // 城堡在城心（< 1.5），其余是箭塔
    if (bm.length) {
      castleFoot = Math.max(2.0, bm[0] - PAD - 0.2);
      castleTop = Math.max(1.6, Math.min(castleTop, castleFoot - 1.2));
    }
    const R3 = outerEdge;

    const phase1 = rnd() * 6.28;
    const phase2 = rnd() * 6.28;
    const deformAmp = 0.06 + rnd() * 0.05; // 外坡坡脚的起伏幅度（只作用在外城平台以外）

    const maxCheckDist = R3 * 1.25 + 4.5; // 防止 rJitter 放大后坡脚被提前 continue 截断

    // 🔴 [彻底根除固定底图残留] 全图基底高程重置为 0 级，确保关隘台地与外围峡谷崇山由算法纯粹驱动
    this.cornerElev.fill(0);

    for (let y = 0; y <= N; y++) {
      for (let x = 0; x <= N; x++) {
        const dx = x - cx, dy = y - cy;
        const dIso = Math.abs(dx) + Math.abs(dy); // 等轴菱形曼哈顿距离
        if (dIso > maxCheckDist) continue; // 超出外圈台地缓坡范围由外围地形接管

        const theta = Math.atan2(dy, dx);
        const rJitter = 1.0 + deformAmp * Math.sin(2 * theta + phase1) + (deformAmp * 0.65) * Math.cos(3 * theta + phase2);

        let targetH = 0;
        if (dIso <= castleTop) {
          // 1) 顶峰城堡平顶台地 (6.5~7级)
          targetH = castleLevel;
        } else if (dIso <= innerEdge) {
          // 2) castleTop→castleFoot 从城堡降到内城；之后到 innerEdge 全平（箭塔、内墙都在这一层）
          const s = Math.min(1, Math.max(0, (dIso - castleTop) / (castleFoot - castleTop)));
          const t = s * s * (3 - 2 * s);
          targetH = castleLevel + (innerLevel - castleLevel) * t;
        } else if (dIso <= R3) {
          // 3) innerEdge→innerFoot 从内城降到外城；之后到 R3 全平（外墙与四门）
          const s = Math.min(1, Math.max(0, (dIso - innerEdge) / (innerFoot - innerEdge)));
          const t = s * s * (3 - 2 * s);
          targetH = innerLevel + (outerLevel - innerLevel) * t;
        } else {
          // 4) 外城墙脚下在有机缓坡内顺畅滑落回 0 级谷底（攻方仰攻大斜坡，坡脚带有自然扰动）
          const slopeW = 3.5 * rJitter;
          const s = Math.min(1, Math.max(0, (dIso - R3) / slopeW));
          const t = s * s * (3 - 2 * s);
          targetH = outerLevel * (1.0 - t);
        }

        const i = y * V + x;
        if (targetH > this.cornerElev[i]) {
          this.cornerElev[i] = targetH;
        }
      }
    }

    // 4. 外围城墙外围：外围丘陵推远到 R3 + 5.5 之外生成，且最高不超过 outerLevel - 0.5（彻底杜绝堵门与高程倒挂）
    this.generateDeElevationGrid(cx, cy, R3 + 5.5, outerLevel - 0.5, rnd, 'pass');

    // 6. 重新计算等轴浮雕坡面光照并标记脏标记
    this.updateCornerLight();
    this.elevDirty = true;

    return { castleLevel, innerLevel, outerLevel };
  }

  /**
   * 🔴 [2026-10-12 主人令「这种感觉在山坳坳中不对吧，应该在山上」]
   * 城寨（Stockade）真实山巅山寨生成：
   * 1. 彻底根除凹陷山坳/盆地：城寨自身就是整座大山的主峰制高点（Mountain Summit）；
   * 2. 寨内自顶向外层层高耸：中心大屋/首领营（5~6 级主峰顶台）-> 聚落平台（4~5 级）-> 木栅围栏（3~4 级山巅台地）；
   * 3. 整座大山从木栅栏边缘向四周 360 度以 14~20 格宽幅缓坡向山脚平原顺畅倾斜滑落（跌落至 0 级）；
   * 4. 外围原野仅散落 1~2 级低矮草坡小丘，绝不允许超越主峰，呈现出真正的「居高临下、雄峙山巅」古代山寨质感。
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
    if (!c) return { centerLevel: 5, villageLevel: 4, fenceLevel: 3 };
    // 🔴 [2026-10-15 主人报「这个地形也是中间椭圆菱形」] 实测布尔根：木栅 56 件在 |dx|+|dy|=8~9 的菱形上，
    //    台地却是写死半径（R3≈9）且山脊/多瓣两型纵向压扁 ⇒ 同一圈木栅脚下 0~5.19 级。
    //    改为按木栅实际位置定台地：每个方位取木栅半径 rf(θ)，木栅平台铺到 rf+1 格；寨内两层高台整体缩进木栅以内。
    const BINS = 32;
    const fenceR = new Float32Array(BINS);      // 每方位最远的木栅件（外坡从这里起）
    const fenceRIn = new Float32Array(BINS);    // 每方位最近的木栅件（寨内台地按这里收）
    for (const p of fencePts) {
      const q = this.screenToCell(p.x, p.y, W, H);
      if (!q) continue;
      const d = Math.hypot(q.gx - c.gx, q.gy - c.gy);
      const k = ((Math.round(Math.atan2(q.gy - c.gy, q.gx - c.gx) / (2 * Math.PI) * BINS) % BINS) + BINS) % BINS;
      fenceR[k] = Math.max(fenceR[k], d);
      fenceRIn[k] = fenceRIn[k] > 0 ? Math.min(fenceRIn[k], d) : d;
    }
    const hasFence = fenceR.some(v => v > 0);
    if (hasFence) for (const arr of [fenceR, fenceRIn]) {   // 空方位取两侧最近有值方位的线性插值
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
    let fenceMin = Infinity, fenceMax = 0;
    for (let k = 0; k < BINS; k++) { fenceMin = Math.min(fenceMin, fenceR[k]); fenceMax = Math.max(fenceMax, fenceR[k]); }
    const FENCE_PAD = 1.0;    // 木栅件本身的厚度 + 余量（格）
    const FENCE_SLOPE = 2.5;  // 木栅外坡宽（格）

    const N = this.N;
    const V = N + 1;

    // 1. PRNG 伪随机数流
    let seed = 2166136261;
    for (let i = 0; i < seedStr.length; i++) seed = Math.imul(seed ^ seedStr.charCodeAt(i), 16777619);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    };

    // 2. 居高临下：城寨主峰绝对制高点（7级主峰傲视全图，3层立体高台：7级 -> 5级 -> 3级）
    const centerLevel = 7;
    const villageLevel = 5;
    const fenceLevel = 3;

    // 🔴 [2026-10-12 主人令「可以设计圆形的高地呀，所有的据点都是一样的不合适吧」]
    // 随机抽选 4 大高台形态原型（Terrace Shape Archetypes），保证据点千姿百态、绝不千篇一律：
    // 1. circle: 浑圆大气的正圆形穹顶圆岗高地（主人指定）
    // 2. diamond: 贴合木栅走向的规整等轴菱台
    // 3. ridge: 顺应地势绵延伸展的山脊长台
    // 4. organic: 鬼斧神工的多瓣天然岩石峰台
    const shapeRoll = rnd();
    let shapeMode: 'circle' | 'diamond' | 'ridge' | 'organic' = 'circle';
    let ridgeAngle = 0;
    let R1 = 3.6, R2 = 7.0, R3 = 9.8, stepW = 1.4;

    if (shapeRoll < 0.35) {
      shapeMode = 'circle'; // 🔴 圆形高地：浑圆壮美的正圆形山岗平台
      R1 = 3.8; R2 = 7.2; R3 = 10.0; stepW = 1.5;
    } else if (shapeRoll < 0.65) {
      shapeMode = 'diamond'; // 等轴菱台：与四方木栅寨门和谐呼应
      R1 = 2.8; R2 = 6.2; R3 = 8.8; stepW = 1.3;
    } else if (shapeRoll < 0.85) {
      shapeMode = 'ridge'; // 山脊长台：沿山梁主轴舒展
      ridgeAngle = rnd() * Math.PI;
      R1 = 3.2; R2 = 6.6; R3 = 9.4; stepW = 1.4;
    } else {
      shapeMode = 'organic'; // 有机多瓣山台
      R1 = 3.0; R2 = 6.5; R3 = 9.2; stepW = 1.4;
    }

    const cosR = Math.cos(ridgeAngle), sinR = Math.sin(ridgeAngle);
    const phase1 = rnd() * 6.28;
    const phase2 = rnd() * 6.28;
    const deformAmp = shapeMode === 'circle' ? 0.04 + rnd() * 0.03 : (0.09 + rnd() * 0.06);

    const cx = c.gx, cy = c.gy;

    // 🔴 [彻底根除固定底图残留] 全图基底高程重置为 0 级，确保山寨高台与外围丘陵由算法纯粹驱动
    this.cornerElev.fill(0);

    for (let y = 0; y <= N; y++) {
      for (let x = 0; x <= N; x++) {
        const dx = x - cx, dy = y - cy;
        if (hasFence) {
          // 三层台地都跟木栅形状走：q = 到城心距离 ÷ 该方位木栅半径（实测院内：中心大屋 q≈0、一圈房屋 q 0.48~0.67、木栅 q=1）
          //   q ≤ 0.18 中心 7 级 → 0.34 降到 5 级 → 聚落平台到 0.74 → 0.87 降到木栅 3 级 → 木栅外 FENCE_PAD 格起外坡
          //   （q 以该方位最近的木栅件为 1；坡离木栅留 0.13，免得地面双线性插值把木栅中段带高）
          const d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
          const rf0 = fenceAt(th), q = d / fenceInAt(th);
          const step = (a: number, b: number, h0: number, h1: number): number => { const s = (q - a) / (b - a); return h0 + (h1 - h0) * s * s * (3 - 2 * s); };
          let h: number;
          if (d > rf0 + FENCE_PAD) { const s = Math.min(1, (d - rf0 - FENCE_PAD) / FENCE_SLOPE); h = fenceLevel * (1 - s * s * (3 - 2 * s)); }
          else if (q >= 0.87) h = fenceLevel;
          else if (q > 0.74) h = step(0.74, 0.87, villageLevel, fenceLevel);
          else if (q >= 0.34) h = villageLevel;
          else if (q > 0.18) h = step(0.18, 0.34, centerLevel, villageLevel);
          else h = centerLevel;
          this.cornerElev[y * V + x] = h;
          continue;
        }
        let dShape = 0;

        if (shapeMode === 'circle') {
          // 正圆形高台：平滑等径欧式圆
          dShape = Math.hypot(dx, dy);
        } else if (shapeMode === 'diamond') {
          // 微圆角等轴菱形台地
          dShape = Math.hypot(dx, dy) * 0.30 + (Math.abs(dx) + Math.abs(dy)) * 0.70;
        } else if (shapeMode === 'ridge') {
          // 沿山脊主轴旋转的长圆形
          const rx = dx * cosR + dy * sinR;
          const ry = -dx * sinR + dy * cosR;
          dShape = Math.hypot(rx * 0.75, ry * 1.40);
        } else {
          // 有机多瓣形态
          const dist = Math.hypot(dx, dy * 1.25);
          const theta = Math.atan2(dy, dx);
          dShape = dist / (1.0 + 0.15 * Math.sin(3 * theta + phase1) + 0.08 * Math.cos(4 * theta + phase2));
        }

        if (dShape > R3 + 4.5) continue;

        const theta = Math.atan2(dy, dx);
        const rJitter = 1.0 + deformAmp * Math.sin(2 * theta + phase1) + (deformAmp * 0.5) * Math.cos(3 * theta + phase2);

        const r1 = R1 * rJitter;
        const r2 = R2 * rJitter;
        const r3 = R3 * rJitter;

        let targetH = 0;
        if (dShape <= r1) {
          // 顶峰平台：核心首领大屋稳坐 7 级平顶
          targetH = centerLevel;
        } else if (dShape <= r1 + stepW) {
          // 第 1 阶梯坡面：7 级陡峭滑落到 5 级
          const s = (dShape - r1) / stepW;
          const t = s * s * (3 - 2 * s);
          targetH = centerLevel + (villageLevel - centerLevel) * t;
        } else if (dShape <= r2) {
          // 聚落平台：棚屋稳坐 5 级平顶
          targetH = villageLevel;
        } else if (dShape <= r2 + stepW) {
          // 第 2 阶梯坡面：5 级陡峭滑落到 3 级
          const s = (dShape - r2) / stepW;
          const t = s * s * (3 - 2 * s);
          targetH = villageLevel + (fenceLevel - villageLevel) * t;
        } else if (dShape <= r3) {
          // 木栅围栏台地：木栅坐落在 3 级平顶
          targetH = fenceLevel;
        } else {
          // 木栅外沿险峻山坡：3 级在 2.5 格内顺畅跌落山脚 0 级平原！
          const s = Math.min(1, Math.max(0, (dShape - r3) / 2.5));
          const t = s * s * (3 - 2 * s);
          targetH = fenceLevel * (1.0 - t);
        }

        const i = y * V + x;
        this.cornerElev[i] = targetH;
      }
    }

    // 4. 外围原野：DE 真实团块元胞生长（中心高四周低，全随机分布）
    this.generateDeElevationGrid(cx, cy, hasFence ? fenceMax + FENCE_PAD + FENCE_SLOPE + 0.5 : R3 + 3.0, 4.0, rnd, 'stockade');

    // 5. 重新计算等轴浮雕坡面光照并标记脏标记
    this.updateCornerLight();
    this.elevDirty = true;

    return { centerLevel, villageLevel, fenceLevel };
  }

  /** 按屏幕逻辑坐标取地面高程级（未乘 16） */
  public elevationLevelAt(screenX: number, screenY: number, W: number, H: number): number {
    return this.elevationLiftAt(screenX, screenY, W, H) / 16;
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
