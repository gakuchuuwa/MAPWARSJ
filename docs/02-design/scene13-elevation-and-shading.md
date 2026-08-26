# ZOOM 13 战场高地系统与光影渲染规范

> **创建日期**：2026-08-26  
> **核心模块**：`src/ui/scene13/Scene13EnvironmentGenerator.ts`、`src/ui/scene13/Scene13GroundPainter.ts`  
> **设计目标**：还原《帝国时代2 决定版》（AoE2:DE）纯正 2.5D 自然山丘与高台地貌，杜绝任何机械切线与全屏光影暗带。

---

## 零、最高铁律与踩坑血训

1. **绝对禁止在屏幕像素空间（Screen Space）做水平/垂直直线硬切**：
   - 严禁写任何形如 `py < VH * 0.18`、`py > VH * 0.82` 这样以屏幕像素直线为界赋高度的代码。
   - **血的教训**：旧版 `canyon_pass` 试图在屏幕顶部 18% 和底部 82% 制造峡谷山壁，直接按 `py` 赋值高度，导致整个等距空间在顶部产生整齐划一的水平阶跃。光照渲染器在阶跃处计算出连续的背光坡梯度，在战场上方投下一整道**贯穿全屏、宽数十像素的机械阴影黑带**，像被水平切了一刀。
2. **所有高程必须是有机闭合的局部几何（Organic & Closed）**：
   - 无论孤立山丘、连绵山脊还是峡谷两旁的山壁，都必须由**旋转椭圆/有机团簇（Hill Clumps）**组合而成。
   - 必须具备严格闭合性（`normDist >= 1.0 -> h = 0`），超出半径严格归零，绝不向屏幕边缘泄漏无限延伸的坡面。
3. **光照方向纵横比必须受控**：
   - 等距投影下网格坐标到屏幕空间的转换具有 2:1 的压扁特性。光照向量必须严格调优，避免纵向分量过大将整屏大缓坡渲染成明暗长带。

---

## 一、2.5D 高地系统实现方法（How to Build Elevation）

### 1.1 坐标系与基础常数
* **等距菱形瓦片**：`TILE_W = 64px`，`TILE_H = 32px`（2:1 经典投影）。
* **网格尺寸**：`gw = 65`，`gh = 65`。
* **高程提升步长**：`ELEV_STEP_PX = 18px`（高度每增加 1 级，顶点在屏幕 Y 轴向上抬升 18 像素）。
* **高度等级**：`0`（基底平原）、`1`（坡脚/低阶过渡）、`2`（宽阔台地/中阶缓坡）、`3`（制高平顶）。

---

### 1.2 多尺度有机山丘生成算法（Organic Hill Generator）

每个山丘使用**旋转椭圆距离场**构建三段式阶梯过渡：

```ts
// 1. 在屏幕安全区内随机或按战术意图选取山丘中心点 (hx, hy)
const [hillGx, hillGy] = screenToGrid(hx, hy, ox, oy);
const cx = Math.max(4, Math.min(gw - 5, hillGx));
const cy = Math.max(4, Math.min(gh - 5, hillGy));

// 2. 赋予椭圆长短轴半径、旋转角度与制高点
const rx = 8.0 + rng.next() * 4.0;          // 长轴半径（网格格数）
const ry = 4.5 + rng.next() * 2.5;          // 短轴半径（网格格数）
const angle = (rng.next() - 0.5) * 1.5;     // 椭圆旋转朝向（弧度）
const hMax = (elev >= 800) ? 3 : 2;         // 最高海拔

// 3. 仅在局部山丘包围盒内扫描，提升性能
const maxR = Math.ceil(Math.max(rx, ry) * 1.25);
const minX = Math.max(3, cx - maxR), maxX = Math.min(gw - 4, cx + maxR);
const minY = Math.max(3, cy - maxR), maxY = Math.min(gh - 4, cy + maxR);

for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        // 旋转变换至椭圆局部坐标
        const rxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
        const ryRot = dx * Math.sin(angle) + dy * Math.cos(angle);
        const normDist = Math.sqrt((rxRot / rx) ** 2 + (ryRot / ry) ** 2);
        
        if (normDist >= 1.0) continue; // 边界严格截断归零，杜绝全局泄漏

        // 三段式平滑阶梯过渡：平顶 -> 缓坡 -> 坡脚
        let h = 0;
        if (normDist < 0.38) {
            h = hMax;                  // 丘顶平坦高台
        } else if (normDist < 0.75) {
            h = Math.max(1, hMax - 1);  // 宽阔缓坡
        } else {
            h = 1;                     // 坡脚过渡
        }

        // 取最大值合并（支持多山丘自然重叠连绵）
        if (h > grid[y][x]) {
            grid[y][x] = h;
        }
    }
}
```

---

### 1.3 瓦片受高度抬升后的 2.5D 几何变形（Ground Painter）

在绘制地面瓦片时，瓦片的 4 个顶点高度独立计算，形成倾斜四边形坡面：

* **四个顶点**：
  - 上角（Top）：`cx, cy - TILE_H / 2 - vT * ELEV_STEP_PX`
  - 右角（Right）：`cx + TILE_W / 2, cy - vR * ELEV_STEP_PX`
  - 下角（Bottom）：`cx, cy + TILE_H / 2 - vB * ELEV_STEP_PX`
  - 左角（Left）：`cx - TILE_W / 2, cy - vL * ELEV_STEP_PX`
* **顶点高度平滑**：每个顶点高度为其周围共享该顶点的 4 个瓦片中心高度的加权平均值，使得相邻瓦片无缝拼合、坡面自然连续。

---

## 二、去除全屏机械阴影暗带的实操方案

### 2.1 机械阴影带产生的根因
* **错误模式**：直接利用屏幕空间 Y 坐标划定截断区域（例如旧版 `canyon_pass` 中的 `topCliffY = VH * 0.18`，所有 `py < topCliffY` 的格子连续递增高度）。
* **几何后果**：由于等高线是一条完全水平的直线，在整行菱形网格上产生了整齐划一的高度断层。
* **光照放大**：光照计算中的 Y 向差分 `dhy = (at(x, y+1) - at(x, y-1)) * 0.5` 在整条水平线上同时达到极大值，导致阴影通道 `darkPx` 画出一条横贯全屏的深色阴影粗带，底部产生水平亮带。

---

### 2.2 正确重构方案：连绵有机山脊组合（Hill Ridge Clusters）

峡谷与走廊地形（`canyon_pass`）应当在南北两侧分别布置**多组左右错落、旋转重叠的有机山丘群**，中间留出行军通道：

```ts
// 峡谷关隘：在南北两侧生成自然起伏、错落相连的有机山脊群，中间保留开阔行军通道
const canyonHills = [
    // 北侧山脊群（顶部边缘，左右错落分布 3 处不同大小与朝向的椭圆高台）
    { rxFrac: 0.22, ryFrac: 0.12, rX: 8.0, rY: 4.5 },
    { rxFrac: 0.50, ryFrac: 0.09, rX: 10.0, rY: 5.0 },
    { rxFrac: 0.78, ryFrac: 0.13, rX: 8.5, rY: 4.2 },
    // 南侧山脊群（底部边缘，左右错落分布 3 处不同大小与朝向的椭圆高台）
    { rxFrac: 0.24, ryFrac: 0.88, rX: 8.5, rY: 4.5 },
    { rxFrac: 0.52, ryFrac: 0.91, rX: 9.5, rY: 5.2 },
    { rxFrac: 0.80, ryFrac: 0.87, rX: 8.0, rY: 4.0 },
];
```

* **战术走廊开阔性**：中腹区域（`VH * 0.25 ~ 0.75`）高度恒为 `0`，保证两军对冲走廊完全平坦无阻碍。
* **光影自然度**：山脊边缘呈现为自然的波浪起伏与圆弧阴影，彻底消除了水平一刀切的直线阴影。

---

## 三、2.5D 光照与阴影渲染系统（Lighting & Shading Pipeline）

### 3.1 光照方向向量
```ts
const ELEV_LIGHT_DIR_X = 0.92;
const ELEV_LIGHT_DIR_Y = -0.39;
const ELEV_LIGHT_K = 2.4;
```
* 采用 DE 原版 2.5D 左上方入射光。
* 换算到屏幕坐标后，纵横比严格控制在 `~0.20`，避免等距投影下的纵向坡面过度受光或背光。

---

### 3.2 气候光影色调映射（Biome Lighting Profile）
不同地貌拥有专属的环境漫反射与受光色调，绝不用通用纯黑/纯白涂抹：

| 气候地貌 | 底图匹配 | 迎光面日光色 (Highlight) | 背光面阴影色 (Shadow) |
|---|---|---|---|
| **极地雪原 / 苔原** | `sno` / `snd` / `sn*` | 纯白天光 `(255, 255, 255)` | 天空冷青蓝 `(45, 68, 95)` |
| **沙漠 / 戈壁 / 旱地** | `des` / `pal` / `ds5` / `ds2` | 暖金日光 `(255, 238, 160)` | 深赭石暖红褐 `(85, 45, 18)` |
| **热带密林 / 雨林** | `fo2` / `gr6` / `qs2` | 金绿日光 `(242, 255, 185)` | 浓郁深青苔藓色 `(20, 38, 24)` |
| **高山岩石 / 砾石** | `rck` / `gravel_default` | 苍茫浅金 `(255, 248, 230)` | 冷灰石质色 `(48, 42, 36)` |
| **温带草原 / 森林** | `ds3` / `ds4` / `gr*` | 柔和暖日光 `(255, 248, 205)` | 深草绿褐色 `(35, 45, 22)` |

---

### 3.3 双通道局部合成机制
1. **法线梯度计算**：在低分辨率网格画布 `darkSmall` / `lightSmall` 上计算坡度与光照响应 `s`。
2. **仿射等距投影放大**：
   ```ts
   ctx.setTransform(TILE_W / 2, TILE_H / 2, -TILE_W / 2, TILE_H / 2, ox, oy - TILE_H / 2);
   ctx.drawImage(smallCanvas, 0, 0);
   ```
3. **高斯平滑羽化**：应用 `blur(5px)` 平滑边缘锯齿。
4. **混合模式双刷**：
   - **背光坡面**：`globalCompositeOperation = 'multiply'` 压暗；
   - **迎光坡面**：`globalCompositeOperation = 'screen'` 提亮。

---

## 四、验收与回归测试指令

修改任何高程或光照算法后，必须执行以下验收命令确保无破损：

1. **全量类型检查**：
   ```bash
   npx tsc --noEmit
   ```
2. **光照与阴影验收工具**：
   ```bash
   npx tsx tools/audit-terrain-shading.mts
   ```
   *（要求：单行最大阴影格数受控，无全屏横贯连续阶跃，光照纵横比 ≤ 0.45）*
3. **地图算法全量核对**：
   ```bash
   npx tsx tools/audit-de-map-algorithm.mts
   ```
