import cv2
import numpy as np
import os
import glob
from rembg import remove

def remove_chroma_bg(input_dir, output_dir):
    if not os.path.exists(input_dir):
        print(f"Error: {input_dir} not found.")
        return

    os.makedirs(output_dir, exist_ok=True)
    
    jpg_files = glob.glob(os.path.join(input_dir, '*.[jJ][pP][gG]'))
    jpg_files.extend(glob.glob(os.path.join(input_dir, '*.[jJ][pP][eE][gG]')))
    jpg_files.extend(glob.glob(os.path.join(input_dir, '*.[pP][nN][gG]')))
    jpg_files = list(set(jpg_files))

    if not jpg_files:
        print("没有在 input_imgs 找到图片。")
        return

    print(f"找到 {len(jpg_files)} 张图片。开始混合AI + 智能去绿边(Spill Suppression)...")

    for i, file_path in enumerate(jpg_files):
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.png")
        
        print(f"[{i+1}/{len(jpg_files)}] 处理 {filename}...")
        
        with open(file_path, "rb") as f:
            img_data = f.read()
            
        chunk_arr = np.frombuffer(img_data, dtype=np.uint8)
        img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
        if img is None:
            continue
            
        # 1. 获取 AI 遮罩
        try:
            rembg_out = remove(img_data)
            rembg_arr = np.frombuffer(rembg_out, dtype=np.uint8)
            rembg_img = cv2.imdecode(rembg_arr, cv2.IMREAD_UNCHANGED)
            if rembg_img is not None and rembg_img.shape[2] == 4:
                ai_alpha = rembg_img[:, :, 3]
            else:
                ai_alpha = np.zeros(img.shape[:2], dtype=np.uint8)
        except Exception as e:
            ai_alpha = np.zeros(img.shape[:2], dtype=np.uint8)
            
        # 2. 自动检测是绿幕还是蓝幕，并提取纯色背景
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        lower_green = np.array([35, 40, 40], dtype=np.uint8)
        upper_green = np.array([85, 255, 255], dtype=np.uint8)
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        
        lower_blue = np.array([90, 40, 40], dtype=np.uint8)
        upper_blue = np.array([130, 255, 255], dtype=np.uint8)
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        b_channel, g_channel, r_channel = cv2.split(img)
        
        green_pixels = cv2.countNonZero(green_mask)
        blue_pixels = cv2.countNonZero(blue_mask)
        
        chroma_mask = np.zeros(img.shape[:2], dtype=np.uint8)
        
        if green_pixels > blue_pixels and green_pixels > 1000:
            chroma_mask = green_mask
            # 【核心黑科技：Green Spill Suppression】消除边缘绿光！
            # 逻辑：如果某个像素绿得发邪（G 远大于 R 和 B），就把 G 强行压到 R 和 B 的最大值
            # 这样原本有绿边的地方会变成自然的灰色/褐色，瞬间消灭廉价感！
            g_channel = np.minimum(g_channel, np.maximum(r_channel, b_channel))
        elif blue_pixels > green_pixels and blue_pixels > 1000:
            chroma_mask = blue_mask
            # 【Blue Spill Suppression】消除蓝边
            b_channel = np.minimum(b_channel, np.maximum(r_channel, g_channel))
            
        # 3. 边缘扩张：把绿幕遮罩向内“吃” 1 个像素，强行干掉最外圈的锯齿渐变带
        kernel = np.ones((3,3), np.uint8)
        chroma_mask_dilated = cv2.dilate(chroma_mask, kernel, iterations=1)
        
        # 4. 混合透明通道
        final_alpha = np.ones(b_channel.shape, dtype=b_channel.dtype) * 255
        
        transparent_condition = (chroma_mask_dilated > 0) & (ai_alpha < 128)
        final_alpha[transparent_condition] = 0
        
        # 加一点点微量的羽化（高斯模糊），让人物轮廓融入游戏背景时更丝滑，不会有狗啃的像素边
        final_alpha = cv2.GaussianBlur(final_alpha, (3,3), 0)
        # 模糊后有些绝对背景可能会重新浮现，我们把它压回 0
        final_alpha[transparent_condition] = 0
        
        img_BGRA = cv2.merge((b_channel, g_channel, r_channel, final_alpha))
        
        is_success, im_buf_arr = cv2.imencode(".png", img_BGRA)
        if is_success:
            im_buf_arr.tofile(output_path)
            
    print("全部处理完成！")

if __name__ == "__main__":
    print("--- 智能混合去背工具 (自动识别绿/蓝幕 + 防溢色黑科技) ---")
    remove_chroma_bg("./input_imgs", "./output_imgs")
