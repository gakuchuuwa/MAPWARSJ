import { tintMaskPixels } from '../systems/tinting/MaskTintPixels';

self.onmessage = async (event: MessageEvent) => {
    const { id, sprite, mask, tint, weakCoverage, extraTint } = event.data;
    try {
        const canvas = new OffscreenCanvas(sprite.width, sprite.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(sprite, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const maskCanvas = new OffscreenCanvas(mask.width, mask.height);
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
        maskCtx.drawImage(mask, 0, 0);
        const maskPixels = maskCtx.getImageData(0, 0, mask.width, mask.height);
        tintMaskPixels(pixels.data, maskPixels.data, tint, weakCoverage, extraTint);
        ctx.putImageData(pixels, 0, 0);
        const bitmap = canvas.transferToImageBitmap();
        self.postMessage({ id, bitmap }, { transfer: [bitmap] });
    } catch (error) {
        self.postMessage({ id, error: String(error) });
    } finally {
        sprite.close();
        mask.close();
    }
};
