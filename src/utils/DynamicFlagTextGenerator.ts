/**
 * DynamicFlagTextGenerator - 百家姓/复姓动态古风旗帜文字生成器
 * 动态在 Canvas 内存中绘制 128x240 尺寸、符合《三国志10》8朝向x4帧动画规范的文字遮罩雪碧图
 */
export class DynamicFlagTextGenerator {
    /**
     * 根据输入文本动态生成旗帜文字雪碧图（Base64 PNG 格式）
     * @param text 势力名称（如 "秦"、"岳"、"诸葛" 等）
     * @param color 字体颜色（默认接近三国志10墨色的深炭黑 #1a1a1a）
     * @param strokeColor 描边颜色（默认半透明白边，与默认黑字配合用于浅色旗帜）
     */
    public static generate(text: string, color: string = '#1a1a1a', strokeColor: string = 'rgba(255, 255, 255, 0.7)'): string {
        // 使用 4 倍超高分辨率渲染 Canvas，彻底解决拉近放大后的字体马赛克/模糊问题
        const renderScale = 4;
        const canvas = document.createElement('canvas');
        canvas.width = 128 * renderScale;
        canvas.height = 240 * renderScale;
        const ctx = canvas.getContext('2d')!;
        
        // 缩放上下文，这样后续的所有绘图坐标（如 32, 40）和字号都不需要修改，自动按高分屏渲染
        ctx.scale(renderScale, renderScale);

        // 三国志10文字格式：4列（动画帧），6行（可用朝向，朝向 3 和 7 在渲染端是不显示文字的）
        const frameWidth = 32;
        const frameHeight = 40;
        const cols = 4;
        const rows = 6;

        // 截取前两个字进行展示（兼容单字与双字复姓，防止超长字符导致排版崩溃）
        const cleanText = text.trim().slice(0, 2);
        if (!cleanText) return canvas.toDataURL('image/png');

        // 使用美观的古风楷体/宋体（优雅回退）
        const fontName = 'STKaiti, KaiTi, "Kaiti SC", "Microsoft YaHei", serif';

        // 循环绘制每一行每一列
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                ctx.save();

                // 1. 计算当前小格子的位置
                const x = col * frameWidth;
                const y = row * frameHeight;

                // 2. 模拟风吹效果的微幅简谐位移（4帧周期运动）
                // 振幅横向 1.2px，纵向 0.8px，产生自然的水波纹摇曳感
                const windX = Math.sin(col * (Math.PI / 2)) * 1.2;
                const windY = Math.cos(col * (Math.PI / 2)) * 0.8;

                // 3. 将原点移到小格子的真实中心（微调避开左侧旗杆）
                // 经测试，x+13 和 y+14 是文字在旗帜布面上最完美的视觉正中心
                const centerX = x + 13 + windX;
                const centerY = y + 14 + windY;
                ctx.translate(centerX, centerY);

                // 4. 根据不同朝向（行数）给文字施加物理倾斜（切变），增强立体贴合感
                // 既然现在是 4 倍高清渲染，抗锯齿足够好，我们可以安全地加回 3D 变形，让字看起来是“印”在飘动的布上的
                let skewX = 0;
                let skewY = 0;
                if (row === 1 || row === 2) {
                    skewX = -0.15; // 迎风面的透视切变
                    skewY = -0.02;
                } else if (row === 4 || row === 5) {
                    skewX = 0.15;
                    skewY = 0.02;
                }
                ctx.transform(1, skewY, skewX, 1, 0, 0);

                // 5. 绘字排版逻辑
                // 文字/描边颜色由调用方决定（按旗帜亮度自适应）, 旗帜浅 → 黑字白边, 旗帜深 → 白字黑边
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = color;
                ctx.lineWidth = 1.6;

                if (cleanText.length === 1) {
                    // 【单字排版】字号 11px
                    ctx.font = `bold 11px ${fontName}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // 先画白边，再画黑字
                    ctx.strokeStyle = strokeColor;
                    ctx.strokeText(cleanText, 0, 0); 
                    ctx.fillText(cleanText, 0, 0); 
                } else {
                    // 【双字复姓排版】字号 8px
                    ctx.font = `bold 8px ${fontName}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    ctx.strokeStyle = strokeColor;
                    ctx.strokeText(cleanText[0], 0, -4.2);
                    ctx.strokeText(cleanText[1], 0, 4.2);
                    
                    ctx.fillText(cleanText[0], 0, -4.2);
                    ctx.fillText(cleanText[1], 0, 4.2);
                }

                ctx.restore();
            }
        }

        // 返回生成的透明 PNG Base64 Data URL
        return canvas.toDataURL('image/png');
    }
}
