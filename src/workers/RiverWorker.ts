/**
 * RiverWorker - 水域检测 Web Worker
 * 分析 ESRI 瓦片像素，识别水域并渲染蓝色河流
 * 
 * [OPTIMIZED] 使用 OffscreenCanvas 在 Worker 中读取像素，避免主线程阻塞
 */

import { isWaterPixel } from '../world/land-sea/WaterMask';
import { loadStrategicWaterTexture, waterDetailAt } from '../map/StrategicWaterMaterial';

export interface RiverWorkerRequest {
    id: number;
    width: number;
    height: number;
    bitmap: ImageBitmap; // [NEW] 接收 ImageBitmap 而非原始数据
}

export interface RiverWorkerResponse {
    id: number;
    data: Uint8ClampedArray;
}

self.onmessage = async (e: MessageEvent<RiverWorkerRequest>) => {
    const { id, width, height, bitmap } = e.data;
    const len = width * height * 4;

    // Output buffer
    const outData = new Uint8ClampedArray(len);

    // 如果没有 bitmap，直接返回透明图层
    if (!bitmap) {
        self.postMessage({ id, data: outData }, [outData.buffer] as any);
        return;
    }

    // [OPTIMIZATION] 使用 OffscreenCanvas 在 Worker 中读取像素
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
    ctx.drawImage(bitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height);
    const esriData = imgData.data;

    // 释放 bitmap 内存
    bitmap.close();

    // Intermediate buffer for "is water" mask (1 byte per pixel)
    const isRiver = new Uint8Array(width * height);

    // 1. 识别水域像素
    // [REFINE 2026-07-27] 精进微调水色彩度(Blue Dominance > 15)，彻底净化欧洲与日本阴影死角
    // [2026-07-28] 判据搬到 WaterMask.ts 共用：游戏的海陆判定（骑兵走不走水路）现在读同一份
    // 数据，这里画出来的描边就是那条分界线。要调阈值只改 WaterMask.ts，别在这里另写一套。
    let waterCount = 0;
    for (let i = 0; i < len; i += 4) {
        if (isWaterPixel(esriData[i], esriData[i + 1], esriData[i + 2])) {
            isRiver[i / 4] = 1;
            waterCount++;
        }
    }

    // 🚫 [2026-09-12 主人「这是你改的海吗，太丑了，给我改回来」] 我曾在这里加过兜底：
    //    「整块没判到水、但平均色偏蓝 → 整块按纯色 #367E9E 铺满（alpha 255）」——
    //    后果是把海面糊成一坨**没有明暗层次的死蓝**，地形浮雕感全丢 ✗。**已整段删除**。
    //    恢复原行为：整块没判到水就返回全透明，露出底图自带的浮雕海色（自然层次保留）。
    //    ⚠️ 教训：水域"块状色差"要治，只能让**判水更一致**，绝不能用"整块盖平"的办法 ✗。
    if (waterCount === 0) {
        self.postMessage({ id, data: outData }, [outData.buffer] as any);
        return;
    }

    // 2. 水岸平滑渐变（抗锯齿与浅水过渡）
    // 半径 1px 的分离核：过渡集中在岸线，避免宽蓝色光晕和窄河消失。
    const waterTexture = await loadStrategicWaterTexture();
    const temp = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
            const xm1 = x > 0 ? x - 1 : 0;
            const xp1 = x < width - 1 ? x + 1 : width - 1;
            temp[rowOffset + x] = (
                isRiver[rowOffset + xm1] +
                isRiver[rowOffset + x] * 2 +
                isRiver[rowOffset + xp1]
            ) * 0.25;
        }
    }

    // 纵向 pass 并直接写入输出缓冲
    for (let y = 0; y < height; y++) {
        const ym1 = (y > 0 ? y - 1 : 0) * width;
        const y0 = y * width;
        const yp1 = (y < height - 1 ? y + 1 : height - 1) * width;

        for (let x = 0; x < width; x++) {
            const v = (
                temp[ym1 + x] +
                temp[y0 + x] * 2 +
                temp[yp1 + x]
            ) * 0.25;

            const pixelIdx = (y0 + x) * 4;
            if (v <= 0.015) {
                outData[pixelIdx + 3] = 0;
            } else {
                // smoothstep 曲线加权，确保浅水到深水平滑过渡
                const t = v;
                const s = t * t * (3 - 2 * t);

                // 浅青岸边向内过渡到湖心 #3E809E，增强与山地的色差；外岸保留窄柔边。
                // 🔴 [2026-09-12 主人「两层水域要融合，看着像一种」] 湖心色由 #3E809E 收到**矢量层同款水体 #367E9E**
                //    （rgb 54,126,158）：两层深浅完全一致，叠在一起看不出接缝；浅滩端保持原来的亮青做柔边。
                const detail = waterDetailAt(waterTexture, x, y) * s;
                outData[pixelIdx] = Math.round(99 - 45 * s + detail * 0.65);
                outData[pixelIdx + 1] = Math.round(150 - 24 * s + detail);
                outData[pixelIdx + 2] = Math.round(168 - 10 * s + detail * 1.1);
                outData[pixelIdx + 3] = isRiver[y0 + x]
                    ? 255
                    : Math.round(s * 0.18 * 255);
            }
        }
    }

    // 返回结果
    self.postMessage({ id, data: outData }, [outData.buffer] as any);
};
