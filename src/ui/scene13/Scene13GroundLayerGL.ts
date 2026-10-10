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
 *   5. 严格支持 flipSides 左右镜像同向翻转 (uFlip) 与镜头缩放 (uZoom/uCam)；
 *   6. 提供高精度双线性插值高程抬升与水体判定接口。
 */

import { DE_TERRAIN_MANIFEST, DE_TERRAIN_BLEND, type DeTerrainManifestItem } from '../../data/battlefield/deTerrainData';
import type { Scene13GroundTiles } from './Scene13EnvironmentGenerator';

export const DE_TILE_W = 96, DE_TILE_H = 48, DE_ELEV_H = 24;
const TW = 64, TH = 32;
const dx = TW / 2, dy = TH / 2;

const NATURE_ALIAS: Record<string, [string, string]> = {
  FDRA: ['NATURE', 'PALM'], FPAL: ['NATURE', 'PALM'], FBAM: ['NATURE', 'BAMBOO'], BIRCH: ['NATURE', 'BIRCH_GREEN'],
  FJUN: ['NATURE', 'JUNGLE'], FSNO: ['NATURE', 'SNOW_PINE'], FOAK: ['NATURE', 'OAK'], FPIN: ['NATURE', 'PINE'],
  ITPINE: ['NATURE', 'ITALIAN_PINE'], OLIVE: ['NATURE', 'OLIVE'], CYPRESS: ['NATURE', 'CYPRESS'],
  GREENOAK: ['NATURE', 'GREEN_OAK'], BUSH: ['NATURE', 'BUSH_GREEN'], BUSH2: ['NATURE', 'BUSH_TREE_A'], BUSH3: ['NATURE', 'BUSH_TREE_B'],
  PLANT: ['NATURE', 'PLANT'], PLANTS: ['NATURE', 'PLANT'], PLANT_DEAD: ['NATURE', 'PLANT_DEAD'], PLANT_JUNGLE: ['NATURE', 'PLANT_JUNGLE'],
  PLAN_SHRUB_GREEN: ['NATURE', 'SHRUB_GREEN'], PLANT_SHRUB_DRY: ['NATURE', 'SHRUB_GREEN'],
  GRASS_GREEN: ['NATURE', 'GRASS_GREEN'], GRASS_DRY: ['NATURE', 'GRASS_DRY'], PLANT_FLOWER: ['NATURE', 'FLOWER'],
  ROCKX: ['NATURE', 'ROCK1'], ROCKSX: ['NATURE', 'ROCK2'], ROCKGX: ['NATURE', 'ROCK3'],
  ROCKF1: ['NATURE', 'ROCK_FORMATION1'], ROCKF2: ['NATURE', 'ROCK_FORMATION2'], ROCKF3: ['NATURE', 'ROCK_FORMATION3'],
  CLIFF_DESERT_01: ['NATURE', 'CLIFF_SAND'], CLIFF_SNOW_01: ['NATURE', 'CLIFF_SNOW'], CLIFF_DEFAULT_01: ['NATURE', 'CLIFF_DEFAULT'],
  CLIFF_DEFAULT_1: ['NATURE', 'CLIFF_DEFAULT'],
  TREEA: ['NATURE', 'OAK'], TREEB: ['NATURE', 'OAK'], TREEC: ['NATURE', 'OAK'], FORTR: ['NATURE', 'OAK'],
  FAUTUM: ['NATURE', 'AUTUMN_OAK'],
  GOLDM: ['RESOURCE', 'GOLD_MINE'], STONM: ['RESOURCE', 'STONE_MINE'], PSTM: ['RESOURCE', 'STONE_MINE'],
  FORAGM: ['RESOURCE', 'FORAGE_BUSH'], FORAG: ['RESOURCE', 'FORAGE_BUSH'],
  DEERX: ['ANIMAL', 'DEER'], BOARX: ['ANIMAL', 'BOAR'], WOLFX: ['ANIMAL', 'WOLF'], HAWK: ['ANIMAL', 'FALCON']
};

const NATURE_DIRS = new Set(`ACACIA ASIAN_MAPLE_AUTUMN ASIAN_MAPLE_GREEN ASIAN_PINE AUTUMN_OAK BAMBOO BAOBAB BIRCH_AUTUMN BIRCH_GREEN BIRCH_WINTER BRAZILWOOD BUSH_GREEN BUSH_TREE_A BUSH_TREE_B BUSH_TREE_C CACTUS CYPRESS CYPRESS_DEC DEAD_TREE DRAGON_TREE FERNPATCH FLOWER FLOWERBED FLOWER_1 FLOWER_2 FLOWER_3 FLOWER_4 FORAGE_BUSH FORAGE_FRUIT FORAGE_PAPAYA FORAGE_PINEAPPLE GRASS_DRY GRASS_DRY_PATCH GRASS_GREEN GRASS_GREEN_PATCH GREEN_OAK ITALIAN_PINE JUNGLE LUSH_BAMBOO MANGROVE MINE_GOLD MINE_STONE OAK OLIVE OYSTERS PALM PEACH_BLOSSOM PINE PLANT PLANT_DEAD PLANT_JUNGLE PLANT_RAINFOREST RAINFOREST REEDS ROCK1 ROCK2 ROCK3 ROCK_BEACH ROCK_FORMATION1 ROCK_FORMATION2 ROCK_FORMATION3 ROCK_JUNGLE ROCK_LIMESTONE ROCK_PILLAR ROCK_SEA1 ROCK_SEA2 SHRUB_GREEN SNOW_AUTUMN_OAK SNOW_PINE UNDERBRUSH UNDERBRUSH_JUNGLE UNDERBRUSH_RAINFOREST WATER_LILY WAX_PALM WEED WILLOW`.split(' '));

export function resolveNatureSprite(name: string): [string, string] | null {
  if (!name) return null;
  if (NATURE_ALIAS[name]) return NATURE_ALIAS[name];
  if (NATURE_DIRS.has(name)) return ['NATURE', name];
  if (/^CLIFF/.test(name)) {
    const found = Array.from(NATURE_DIRS).find((d) => d.startsWith('CLIFF') && name.includes((d.split('_')[1] ?? '').toLowerCase()));
    return ['NATURE', found ?? 'CLIFF_DEFAULT'];
  }
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
uniform float uFlip;
varying vec2 vGUV;
varying float vLight;

void main() {
  vGUV = aGUV;
  vLight = aLight;
  vec2 p = (aPos + uCam) * uZoom;
  if (uFlip > 0.5) { p.x = uRes.x - p.x; }
  vec2 c = vec2(uRes.x * 0.5, uRes.y * 0.5);
  gl_Position = vec4((p.x - c.x) / c.x, -(p.y - c.y) / c.y, 0.0, 1.0);
}`;

const FS = `precision mediump float;
varying vec2 vGUV;
varying float vLight;

uniform sampler2D uFieldTex;
uniform sampler2D uGrassTex;
uniform sampler2D uSandTex;
uniform sampler2D uForestTex;
uniform sampler2D uWaterTex;
uniform float uMapSize;
uniform float uTime;

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

void main() {
  vec2 fieldUV = clamp(vGUV / uMapSize, 0.001, 0.999);
  vec4 field = texture2D(uFieldTex, fieldUV);
  
  // 有机扰动：彻底打破方格阶梯，呈现真实蜿蜒自然岸线
  float n1 = snoise(vGUV * 3.2);
  float n2 = snoise(vGUV * 7.5);
  float wPerturb = field.r + n1 * 0.045 + n2 * 0.020;
  
  // 水体判定
  float isWater = smoothstep(0.44, 0.465, wPerturb);
  float isDeepWater = smoothstep(0.55, 0.76, wPerturb);
  
  // 沙滩与森林底床判定
  float isSand = clamp(field.g * 1.5 + smoothstep(0.32, 0.45, wPerturb) * 0.95, 0.0, 1.0) * (1.0 - isWater);
  // 森林有机扰动：彻底打破方格棱角，呈现如水体般圆滑蜿蜒的自然树林边缘
  float fn1 = snoise(vGUV * 2.8 + vec2(27.4, 61.8));
  float fn2 = snoise(vGUV * 6.5 + vec2(73.1, 14.5));
  float fPerturb = field.b + fn1 * 0.055 + fn2 * 0.025;
  float isForest = smoothstep(0.36, 0.54, fPerturb) * (1.0 - isWater);
  
  // 纹理采样（无缝平铺）
  vec2 texUV = fract(vGUV * 0.5);
  vec3 colGrass = texture2D(uGrassTex, texUV).rgb * vec3(0.97, 0.99, 0.92);
  vec3 colSand = texture2D(uSandTex, texUV).rgb;
  vec3 colForest = texture2D(uForestTex, texUV).rgb;
  
  // ── 地面斑块与大尺度明暗变化（彻底告别一整片单色） ──
  float mLow = snoise(vGUV * 0.065);  // 15格大尺度
  float mMid = snoise(vGUV * 0.20);   // 5格中尺度
  float mottling = mLow * 0.65 + mMid * 0.35;
  
  // 1. 暖阳照耀 vs 阴凉青翠
  vec3 sunWarm = colGrass * vec3(1.09, 1.05, 0.91);
  vec3 coolShade = colGrass * vec3(0.91, 0.96, 0.92);
  colGrass = mix(coolShade, sunWarm, smoothstep(-0.35, 0.35, mottling));
  
  // 2. 土壤干湿/黄褐泥土斑块
  vec3 soilTint = colGrass * vec3(0.86, 0.81, 0.68);
  colGrass = mix(colGrass, soilTint, smoothstep(0.25, 0.65, mMid) * 0.70);
  
  // 3. 地表裸露沙泥土块
  colGrass = mix(colGrass, colSand * 0.88, smoothstep(0.50, 0.85, mottling) * 0.55);
  
  // 地面材质过渡（林地、沙滩、草地）
  vec3 landCol = colGrass;
  landCol = mix(landCol, colForest, isForest);
  landCol = mix(landCol, colSand, smoothstep(0.12, 0.65, isSand));
  
  // ── 水体渲染（水底河床、深浅渐变、流动波光、岸边浪花） ──
  vec3 riverbedCol = colSand * vec3(0.82, 0.78, 0.70);
  vec3 shallowCol = vec3(0.24, 0.62, 0.72); // 清澈近岸浅水（明澈翡翠青）
  vec3 deepCol = vec3(0.12, 0.40, 0.62);    // 蔚蓝深水河心（多瑙河明亮水蓝）
  vec3 waterTint = mix(shallowCol, deepCol, isDeepWater);
  
  // 双层同向流动波纹
  vec2 wuv1 = fract(vGUV * 0.22 + vec2(uTime * 0.028, uTime * 0.014));
  vec2 wuv2 = fract(vGUV * 0.27 + vec2(-uTime * 0.019, uTime * 0.022));
  vec3 wave1 = texture2D(uWaterTex, wuv1).rgb / vec3(0.141, 0.477, 0.645);
  vec3 wave2 = texture2D(uWaterTex, wuv2).rgb / vec3(0.141, 0.477, 0.645);
  vec3 waves = (wave1 + wave2) * 0.5;
  
  vec3 waterBody = waterTint * waves;
  vec3 waterCol = mix(riverbedCol, waterBody, 0.48 + isDeepWater * 0.52);
  
  // 岸边浪花/柔和洁白微浪泡沫带（连绵起伏微浪冲刷）
  float shoreBand = smoothstep(0.442, 0.456, wPerturb) * (1.0 - smoothstep(0.456, 0.485, wPerturb));
  float waveBreath = sin(uTime * 2.0 + (vGUV.x + vGUV.y) * 0.35) * 0.5 + 0.5;
  float foam = shoreBand * (0.35 + 0.55 * waveBreath);
  waterCol = mix(waterCol, vec3(0.95, 0.98, 1.0), foam * 0.75);
  
  // 最终合成与光照
  vec3 finalCol = mix(landCol, waterCol, isWater);
  finalCol *= vLight;
  if (vLight > 1.05) {
    finalCol += vec3(0.06, 0.05, 0.02) * (vLight - 1.05);
  }
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
  private grassTex: WebGLTexture | null = null;
  private sandTex: WebGLTexture | null = null;
  private forestTex: WebGLTexture | null = null;
  private waterTex: WebGLTexture | null = null;

  public readonly smoothWater: Float32Array;
  private cornerElev: Float32Array;
  private cornerLight: Float32Array;

  private cam = { x: 0, y: 0, zoom: 1 };
  private flip = false;
  private buf: WebGLBuffer | null = null;
  private vertCount = 0;

  constructor(
    canvas: HTMLCanvasElement,
    data: any,
    imgGrass: any,
    imgSand: any,
    imgForest: any,
    imgWater: any
  ) {
    this.canvas = canvas;
    this.data = data;
    this.N = data.width;
    this.offX = (this.N - 1) * dx;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false });
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
      uFlip: U('uFlip'),
      uMapSize: U('uMapSize'),
      uTime: U('uTime'),
      uFieldTex: U('uFieldTex'),
      uGrassTex: U('uGrassTex'),
      uSandTex: U('uSandTex'),
      uForestTex: U('uForestTex'),
      uWaterTex: U('uWaterTex'),
    };

    // 1. 构建高精度势能场纹理
    const N = this.N;
    const rawWater = new Float32Array(N * N);
    const rawBeach = new Float32Array(N * N);
    const rawForest = new Float32Array(N * N);

    const isWaterId = (id: number) => {
      const m = DE_TERRAIN_MANIFEST[id];
      return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const id = data.terrain[y * N + x];
        if (id === 1 || id === 23 || isWaterId(id)) rawWater[y * N + x] = 1.0;
        if (id === 2) rawBeach[y * N + x] = 1.0;
        if (id === 10 || id === 19 || id === 71 || id === 89 || id === 104) rawForest[y * N + x] = 1.0;
      }
    }

    const sw = blurGrid2D(rawWater, N);
    const sb = blurGrid2D(rawBeach, N);
    const sf = blurGrid2D(rawForest, N);
    this.smoothWater = sw;

    // 沿水陆交界岸线铺设自然过渡沙带
    for (let i = 0; i < N * N; i++) {
      const w = sw[i];
      if (w > 0.28 && w < 0.52) {
        const shoreSand = 1.0 - Math.abs(w - 0.40) / 0.12;
        sb[i] = Math.max(sb[i], shoreSand * 0.92);
      }
    }

    const fieldPixels = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      fieldPixels[i * 4 + 0] = Math.round(Math.min(1, Math.max(0, sw[i])) * 255);
      fieldPixels[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, sb[i])) * 255);
      fieldPixels[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, sf[i])) * 255);
      fieldPixels[i * 4 + 3] = 255;
    }

    this.fieldPixels = fieldPixels;
    this.fieldTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, fieldPixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 2. 加载四种基底平铺纹理
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
    if (!elev || !elev.length) {
      this.cornerElev.fill(0);
      this.cornerLight.fill(1.0);
      return;
    }
    const elevAt = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : (elev[y * N + x] ?? 0));
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        let sum = 0, count = 0;
        if (gx > 0 && gy > 0) { sum += elevAt(gx - 1, gy - 1); count++; }
        if (gx < N && gy > 0) { sum += elevAt(gx, gy - 1); count++; }
        if (gx > 0 && gy < N) { sum += elevAt(gx - 1, gy); count++; }
        if (gx < N && gy < N) { sum += elevAt(gx, gy); count++; }
        this.cornerElev[gy * V_SIZE + gx] = count > 0 ? sum / count : 0;
      }
    }
    const Lx = -0.35, Ly = -0.55, Lz = 0.75;
    const Llen = Math.hypot(Lx, Ly, Lz);
    const lx = Lx / Llen, ly = Ly / Llen, lz = Lz / Llen;
    for (let gy = 0; gy <= N; gy++) {
      for (let gx = 0; gx <= N; gx++) {
        const hL = gx > 0 ? this.cornerElev[gy * V_SIZE + (gx - 1)] : this.cornerElev[gy * V_SIZE + gx];
        const hR = gx < N ? this.cornerElev[gy * V_SIZE + (gx + 1)] : this.cornerElev[gy * V_SIZE + gx];
        const hU = gy > 0 ? this.cornerElev[(gy - 1) * V_SIZE + gx] : this.cornerElev[gy * V_SIZE + gx];
        const hD = gy < N ? this.cornerElev[(gy + 1) * V_SIZE + gx] : this.cornerElev[gy * V_SIZE + gx];
        const dhx = (hR - hL) / (gx > 0 && gx < N ? 2 : 1);
        const dhy = (hD - hU) / (gy > 0 && gy < N ? 2 : 1);
        const Nx = 0.25 * (dhy - dhx);
        const Ny = -0.5 * (dhx + dhy);
        const Nz = 1.0;
        const nlen = Math.hypot(Nx, Ny, Nz);
        const nx = Nx / nlen, ny = Ny / nlen, nz = Nz / nlen;
        const dot = nx * lx + ny * ly + nz * lz;
        const light = 1.0 + 0.6 * (dot - lz);
        this.cornerLight[gy * V_SIZE + gx] = Math.max(0.75, Math.min(1.25, light));
      }
    }
  }

  public setCamera(c: { x: number; y: number; zoom: number }, flip = false): void {
    this.cam = { ...this.cam, ...c };
    this.flip = flip;
  }

  public resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  public render(): void {
    const gl = this.gl;
    const w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.05, 0.05, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.uRes as WebGLUniformLocation, w, h);
    gl.uniform2f(this.loc.uCam as WebGLUniformLocation, this.cam.x / this.cam.zoom, this.cam.y / this.cam.zoom);
    gl.uniform1f(this.loc.uZoom as WebGLUniformLocation, this.cam.zoom);
    gl.uniform1f(this.loc.uFlip as WebGLUniformLocation, this.flip ? 1.0 : 0.0);
    gl.uniform1f(this.loc.uMapSize as WebGLUniformLocation, this.N);
    gl.uniform1f(this.loc.uTime as WebGLUniformLocation, performance.now() * 0.001);

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
    const PTS = [[0, -TH / 2], [TW / 2, 0], [0, TH / 2], [-TW / 2, 0]];
    const TRI = [0, 1, 2, 0, 2, 3];

    const isoX = (x: number, y: number) => (x - y) * dx + this.offX;
    const isoY = (x: number, y: number) => (x + y) * dy;

    const verts: number[] = [];

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const cx = isoX(x, y), cy = isoY(x, y);
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
          verts.push(
            cx + PTS[t][0],
            cy + PTS[t][1] - (cElev[t] * 16.0),
            guv[t][0],
            guv[t][1],
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
    const worldX = screenX - W / 2 + this.offX;
    const worldY = screenY - H / 2 + (this.N - 1) * dy;
    const a = (worldX - this.offX) / dx;
    const b = worldY / dy;
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    const N = this.N;
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
    return elev * 16.0;
  }

  /**
   * 从屏幕逻辑坐标 (screenX, screenY) 查询新地图是否为水体（基于平滑水体势场双线性插值）
   */
  public isWaterAt(screenX: number, screenY: number, W: number, H: number): boolean {
    const worldX = screenX - W / 2 + this.offX;
    const worldY = screenY - H / 2 + (this.N - 1) * dy;
    const a = (worldX - this.offX) / dx;
    const b = worldY / dy;
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    const N = this.N;
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
    const worldX = screenX - W / 2 + this.offX;
    const worldY = screenY - H / 2 + (this.N - 1) * dy;
    const a = (worldX - this.offX) / dx;
    const b = worldY / dy;
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    if (gx < 0 || gy < 0 || gx >= this.N || gy >= this.N) return null;
    return { gx, gy };
  }

  /**
   * DE 格坐标 (gx, gy) → 屏幕逻辑坐标 (screenX, screenY)
   */
  public cellToScreen(gx: number, gy: number, W: number, H: number): { x: number; y: number } {
    const screenX = W / 2 + (gx - gy) * dx;
    const screenY = H / 2 + (gx + gy - (this.N - 1)) * dy;
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

  /** 地基改动攒够后一次上传（carveFoundation 之后调用一次） */
  public flushFoundation(): void {
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
    gl.deleteProgram(this.prog);
  }

  /**
   * 静态异步工厂方法：按 mapData 按需加载贴图并创建图层
   * 🔴 [2026-10-11] 四张基底素材（草/沙/林/水）按**战场所在气候主题**取，
   *    来源统一为一份 `environmentPlan.groundTiles`（＝ Scene13DeMapThemes 那张表，
   *    与旧 canvas 地面同一份口径）；不传或取不到就各自退回原写死的图，行为与从前一致。
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

    const [grass, sand, forest, water] = await Promise.all([
      loadTile(tiles?.grass, 'gr2'),
      loadTile(tiles?.sand, 'bch'),
      loadTile(tiles?.forest, 'for'),
      loadTile(tiles?.water, 'river_clean_green'),
    ]);

    const layer = new Scene13GroundLayerGL(canvas, data, grass.img, sand.img, forest.img, water.img);
    if (layer.grassTex) attachTexImage(layer.grassTex, grass.img, grass.tile);
    if (layer.sandTex) attachTexImage(layer.sandTex, sand.img, sand.tile);
    if (layer.forestTex) attachTexImage(layer.forestTex, forest.img, forest.tile);
    if (layer.waterTex) attachTexImage(layer.waterTex, water.img, water.tile);
    return layer;
  }
}
