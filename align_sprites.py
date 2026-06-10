from PIL import Image
import os
import glob

def align_and_scale_images(input_dir, output_dir, target_canvas_size=(1024, 1024), target_character_height=800):
    if not os.path.exists(input_dir):
        print(f"Error: Directory '{input_dir}' not found.")
        return

    os.makedirs(output_dir, exist_ok=True)
    png_files = glob.glob(os.path.join(input_dir, '*.png'))

    if not png_files:
        print(f"No PNG files found in '{input_dir}'.")
        return

    print(f"Found {len(png_files)} PNG files. Starting normalization...")

    for i, file_path in enumerate(png_files):
        filename = os.path.basename(file_path)
        output_path = os.path.join(output_dir, filename)
        
        try:
            with Image.open(file_path) as img:
                # 确保图片是 RGBA 模式
                img = img.convert("RGBA")
                
                # 获取非透明区域的边界框 (Bounding box)
                bbox = img.getbbox()
                if not bbox:
                    print(f"[{i+1}] {filename} is completely transparent, skipping.")
                    continue
                
                # 裁剪出人物本体（去除周围多余的透明区域）
                character = img.crop(bbox)
                char_w, char_h = character.size
                
                # 计算缩放比例：让人物的实际高度等于 target_character_height
                scale = target_character_height / float(char_h)
                new_w = int(char_w * scale)
                new_h = int(char_h * scale)
                
                # 如果缩放后宽度超出了画布，则以宽度为基准重新缩放
                if new_w > target_canvas_size[0]:
                    scale = target_canvas_size[0] / float(char_w)
                    new_w = int(char_w * scale)
                    new_h = int(char_h * scale)
                
                # 使用高质量重采样进行缩放
                character_scaled = character.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # 创建一个全新的空白（透明）标准尺寸画布
                canvas = Image.new("RGBA", target_canvas_size, (0, 0, 0, 0))
                
                # 计算粘贴位置：水平居中，垂直底端对齐（人物脚贴着画布底部）
                paste_x = (target_canvas_size[0] - new_w) // 2
                paste_y = target_canvas_size[1] - new_h
                
                # 将缩放后的人物粘贴到标准画布上
                canvas.paste(character_scaled, (paste_x, paste_y), character_scaled)
                
                # 保存最终图片
                canvas.save(output_path)
                print(f"[{i+1}/{len(png_files)}] Normalized {filename}")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    print("--- 游戏立绘/人物比例统一工具 ---")
    # 默认处理刚才抠图输出的文件夹
    input_folder = "./output_imgs"
    output_folder = "./normalized_imgs"
    
    # 你可以修改这里的画布尺寸和人物目标高度
    # 比如这里设定最终输出为 1024x1024，并且每个人物（不含空白）的高度固定缩放为 900 像素
    align_and_scale_images(input_folder, output_folder, target_canvas_size=(1024, 1024), target_character_height=900)
    print("All done!")
