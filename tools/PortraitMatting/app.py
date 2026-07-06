import gradio as gr
import os
import glob
from rembg import remove, new_session
from PIL import Image
import cv2
import numpy as np
import io

models = [
    "birefnet-general",
    "isnet-anime",
    "u2net",
    "u2net_human_seg",
    "silueta",
]
sessions = {}

def get_session(model_name):
    if model_name not in sessions:
        print(f"Loading model: {model_name}...")
        sessions[model_name] = new_session(model_name)
    return sessions[model_name]

def advanced_chroma_bg_remove(img_data_bytes, session, strict_chroma=False, no_ai_touchup=False):
    chunk_arr = np.frombuffer(img_data_bytes, dtype=np.uint8)
    img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")

    rembg_out = remove(img_data_bytes, session=session)
    rembg_arr = np.frombuffer(rembg_out, dtype=np.uint8)
    rembg_img = cv2.imdecode(rembg_arr, cv2.IMREAD_UNCHANGED)
    
    if rembg_img is not None and rembg_img.shape[2] == 4:
        ai_alpha = rembg_img[:, :, 3]
    else:
        ai_alpha = np.zeros(img.shape[:2], dtype=np.uint8)
        
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
        g_channel = np.minimum(g_channel, np.maximum(r_channel, b_channel))
    elif blue_pixels > green_pixels and blue_pixels > 1000:
        chroma_mask = blue_mask
        b_channel = np.minimum(b_channel, np.maximum(r_channel, g_channel))
        
    kernel = np.ones((3,3), np.uint8)
    chroma_mask_dilated = cv2.dilate(chroma_mask, kernel, iterations=1)
    
    final_alpha = np.ones(b_channel.shape, dtype=b_channel.dtype) * 255
    
    if strict_chroma:
        transparent_condition = (chroma_mask_dilated > 0)
    else:
        transparent_condition = (chroma_mask_dilated > 0) & (ai_alpha < 200)
    
    final_alpha[transparent_condition] = 0
    
    if not no_ai_touchup:
        final_alpha[ai_alpha == 0] = 0

    final_alpha = cv2.GaussianBlur(final_alpha, (3,3), 0)
    final_alpha[transparent_condition] = 0
    
    img_BGRA = cv2.merge((b_channel, g_channel, r_channel, final_alpha))
    is_success, im_buf_arr = cv2.imencode(".png", img_BGRA)
    if is_success:
        return im_buf_arr.tobytes()
    else:
        raise ValueError("Failed to encode image")


def advanced_black_bg_remove(img_data_bytes, session, strict_black=False):
    """
    黑底/黑幕专用抠图。
    绿幕靠色相能一刀切，但黑色背景与人物的黑发/黑衣在颜色上无法区分，
    所以这里以 AI 语义分割(birefnet)为主判据，辅以「黑色区域边界连通分析」：
      - 只删【与画面边缘相连】且【AI 认为不是人物】的黑色 => 背景黑
      - 人物内部的黑发/黑衣不与边缘连通，或被 AI 判为人物 => 完整保留
    """
    chunk_arr = np.frombuffer(img_data_bytes, dtype=np.uint8)
    img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")

    # --- 1. AI 语义分割：得到人物 alpha (主判据) ---
    rembg_out = remove(img_data_bytes, session=session)
    rembg_arr = np.frombuffer(rembg_out, dtype=np.uint8)
    rembg_img = cv2.imdecode(rembg_arr, cv2.IMREAD_UNCHANGED)
    if rembg_img is not None and rembg_img.shape[2] == 4:
        ai_alpha = rembg_img[:, :, 3]
    else:
        ai_alpha = np.full(img.shape[:2], 255, dtype=np.uint8)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- 2. 自适应黑度阈值：采样四角估计背景亮度 ---
    corners = [gray[0, 0], gray[0, -1], gray[-1, 0], gray[-1, -1]]
    bg_level = float(np.median(corners))
    black_thresh = int(min(90, max(45, bg_level + 32)))  # 纯黑->~45, 深灰->更宽松
    black_mask = (gray < black_thresh).astype(np.uint8)

    # --- 3. 边界连通分析：找出与画面边缘相连的黑色区域(=背景) ---
    num, labels = cv2.connectedComponents(black_mask, connectivity=8)
    border_labels = set(labels[0, :].tolist()) | set(labels[-1, :].tolist()) \
        | set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    border_labels.discard(0)  # 0 = 非黑像素
    if border_labels:
        bg_connected = np.isin(labels, list(border_labels))
    else:
        bg_connected = np.zeros(gray.shape, dtype=bool)

    black_bool = black_mask.astype(bool)

    # --- 4. 合成 alpha ---
    final_alpha = ai_alpha.copy()

    # (a) AI 高度确信是背景 -> 透明
    final_alpha[ai_alpha < 15] = 0
    # (b) 与边缘连通的背景黑, 且 AI 不认为是人物(<200) -> 透明 (保护贴边的黑发)
    final_alpha[bg_connected & (ai_alpha < 200)] = 0
    # (c) 暗色描边光晕清理: 黑像素且 AI 判定不确定(<130) -> 透明
    final_alpha[black_bool & (ai_alpha < 130)] = 0

    if strict_black:
        # 激进模式: 凡是较暗且 AI 信心不足的区域一律剔除(边角残留清理)
        final_alpha[(gray < black_thresh + 25) & (ai_alpha < 215)] = 0

    # 羽化边缘后, 再把确定的背景重新压死为 0
    final_alpha = cv2.GaussianBlur(final_alpha, (3, 3), 0)
    final_alpha[ai_alpha < 15] = 0
    final_alpha[bg_connected & (ai_alpha < 200)] = 0

    b, g, r = cv2.split(img)
    img_BGRA = cv2.merge((b, g, r, final_alpha))
    is_success, im_buf_arr = cv2.imencode(".png", img_BGRA)
    if is_success:
        return im_buf_arr.tobytes()
    else:
        raise ValueError("Failed to encode image")


def process_single_image(image_pil, model_name, use_chroma, strict_chroma, no_ai_touchup, use_black):
    if image_pil is None:
        return None
    try:
        session = get_session(model_name)
        img_byte_arr = io.BytesIO()
        image_pil.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()

        if use_black:
            out_bytes = advanced_black_bg_remove(img_bytes, session, strict_black=strict_chroma)
            return Image.open(io.BytesIO(out_bytes))
        elif use_chroma:
            out_bytes = advanced_chroma_bg_remove(img_bytes, session, strict_chroma, no_ai_touchup)
            return Image.open(io.BytesIO(out_bytes))
        else:
            return remove(image_pil, session=session)

    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def process_batch(input_dir, output_dir, model_name, use_chroma, strict_chroma, no_ai_touchup, use_black, progress=gr.Progress()):
    if not input_dir or not os.path.exists(input_dir):
        return f"❌ 错误：输入目录 '{input_dir}' 不存在。"
    
    os.makedirs(output_dir, exist_ok=True)
    
    files = []
    for ext in ('*.jpg', '*.jpeg', '*.png', '*.webp'):
        files.extend(glob.glob(os.path.join(input_dir, ext)))
        files.extend(glob.glob(os.path.join(input_dir, ext.upper())))
    
    files = list(set(files))
    if not files:
        return f"⚠️ 在 '{input_dir}' 中没有找到图片文件。"
    
    session = get_session(model_name)
    processed = 0
    errors = 0
    
    for i, file_path in progress.tqdm(enumerate(files), total=len(files), desc="批量处理中"):
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.png")
        
        try:
            with open(file_path, 'rb') as i_file:
                input_data = i_file.read()
                
            if use_black:
                output_data = advanced_black_bg_remove(input_data, session, strict_black=strict_chroma)
            elif use_chroma:
                output_data = advanced_chroma_bg_remove(input_data, session, strict_chroma, no_ai_touchup)
            else:
                output_data = remove(input_data, session=session)
                
            with open(output_path, 'wb') as o_file:
                o_file.write(output_data)
            processed += 1
        except Exception as e:
            print(f"处理 {filename} 时出错: {e}")
            errors += 1
            
    return f"✅ 处理完成！成功: {processed} 张，失败: {errors} 张。\n📁 结果保存在: {os.path.abspath(output_dir)}"

with gr.Blocks(title="立绘智能抠图工具", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🎨 立绘智能抠图工具 (绿幕/黑底增强版)")
    gr.Markdown("专门用于游戏立绘、动漫角色的自动去背景工具。支持【绿幕/蓝幕】边缘发光压制（Spill Suppression），以及【黑底/黑幕】AI 语义分割抠图（保留黑发/黑衣）。")
    
    with gr.Row():
        with gr.Column():
            model_dropdown = gr.Dropdown(choices=models, value="birefnet-general", label="选择 AI 模型 (强烈推荐 birefnet-general)")
        with gr.Column():
            use_chroma_cb = gr.Checkbox(value=True, label="✅ 启用【绿幕/蓝幕】溢色强化消除")
            strict_chroma_cb = gr.Checkbox(value=False, label="🧨 强制剔除 (激进模式: 绿蓝清死角 / 黑底清残留)")
            no_ai_touchup_cb = gr.Checkbox(value=True, label="🏹 纯净绿幕模式 (不让AI辅助删背景，100%保住武器/弓弦)")
            use_black_cb = gr.Checkbox(value=False, label="🌑 黑底模式 (移除黑色背景，AI保留黑发/黑衣；优先级高于绿幕)")
    
    with gr.Tabs():
        with gr.TabItem("单张处理 & 预览"):
            with gr.Row():
                with gr.Column():
                    input_img = gr.Image(type="pil", label="上传原图 (支持拖拽)")
                    submit_btn = gr.Button("🚀 开始抠图", variant="primary")
                with gr.Column():
                    output_img = gr.Image(type="pil", label="抠图结果 (可右键保存, 包含透明通道)", image_mode="RGBA", format="png")
            
            submit_btn.click(
                fn=process_single_image,
                inputs=[input_img, model_dropdown, use_chroma_cb, strict_chroma_cb, no_ai_touchup_cb, use_black_cb],
                outputs=output_img
            )
            
        with gr.TabItem("批量处理文件夹"):
            with gr.Row():
                in_dir = gr.Textbox(label="输入文件夹路径", value=r"C:\Users\GAKU\Downloads\koutu")
                out_dir = gr.Textbox(label="输出文件夹路径", value=r"C:\Users\GAKU\Downloads\koutu")
            
            batch_btn = gr.Button("⚡ 开始批量抠图", variant="primary")
            batch_result = gr.Textbox(label="处理结果", interactive=False, lines=3)
            
            batch_btn.click(
                fn=process_batch,
                inputs=[in_dir, out_dir, model_dropdown, use_chroma_cb, strict_chroma_cb, no_ai_touchup_cb, use_black_cb],
                outputs=batch_result
            )

if __name__ == "__main__":
    demo.launch(inbrowser=True)
