import cv2
import numpy as np
import os
import glob
from rembg import remove

def remove_white_bg(input_dir, output_dir):
    if not os.path.exists(input_dir):
        print(f"Error: {input_dir} not found.")
        return

    os.makedirs(output_dir, exist_ok=True)
    
    jpg_files = glob.glob(os.path.join(input_dir, '*.[jJ][pP][gG]'))
    jpg_files.extend(glob.glob(os.path.join(input_dir, '*.[jJ][pP][eE][gG]')))
    jpg_files = list(set(jpg_files))

    if not jpg_files:
        print("No JPG files found.")
        return

    print(f"Found {len(jpg_files)} files. Starting Hybrid AI + Color background removal...")

    for i, file_path in enumerate(jpg_files):
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.png")
        
        print(f"[{i+1}/{len(jpg_files)}] Processing {filename}...")
        
        with open(file_path, "rb") as f:
            img_data = f.read()
            
        chunk_arr = np.frombuffer(img_data, dtype=np.uint8)
        img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
        if img is None:
            continue
            
        # 1. 获取 AI 遮罩（AI 能精准识别前后景，但可能误伤武器）
        try:
            rembg_out = remove(img_data)
            rembg_arr = np.frombuffer(rembg_out, dtype=np.uint8)
            rembg_img = cv2.imdecode(rembg_arr, cv2.IMREAD_UNCHANGED)
            if rembg_img is not None and rembg_img.shape[2] == 4:
                ai_alpha = rembg_img[:, :, 3]
            else:
                ai_alpha = np.zeros(img.shape[:2], dtype=np.uint8)
        except Exception as e:
            print(f"  -> AI mask failed for {filename}: {e}")
            ai_alpha = np.zeros(img.shape[:2], dtype=np.uint8)
            
        # 2. 找出所有“接近白色”的像素
        # 设定阈值为 220 以上，捕捉白色背景
        lower_white = np.array([220, 220, 220], dtype=np.uint8)
        upper_white = np.array([255, 255, 255], dtype=np.uint8)
        white_mask = cv2.inRange(img, lower_white, upper_white)
        
        # 3. 终极判断逻辑（AI与色彩结合）：
        # 只有当：像素是白色的 AND AI认为它是背景 时，我们才把它变成透明！
        # - 头盔高光：是白色，但 AI 认为它是前景 -> 保留！
        # - 武器：AI 误认它是背景，但武器不是纯白色 -> 保留！
        # - 真实背景/空隙：是白色，且 AI 认为是背景 -> 变透明！
        
        b_channel, g_channel, r_channel = cv2.split(img)
        final_alpha = np.ones(b_channel.shape, dtype=b_channel.dtype) * 255
        
        transparent_condition = (white_mask > 0) & (ai_alpha < 128)
        final_alpha[transparent_condition] = 0
        
        img_BGRA = cv2.merge((b_channel, g_channel, r_channel, final_alpha))
        
        is_success, im_buf_arr = cv2.imencode(".png", img_BGRA)
        if is_success:
            im_buf_arr.tofile(output_path)
            
    print("All done!")

if __name__ == "__main__":
    print("--- 智能混合抠图工具 (保护武器 + 保护反光) ---")
    remove_white_bg("./input_imgs", "./output_imgs")
