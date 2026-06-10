import os
import glob
from rembg import remove
import sys

def process_images(input_dir, output_dir):
    if not os.path.exists(input_dir):
        print(f"Error: Input directory '{input_dir}' does not exist.")
        return

    os.makedirs(output_dir, exist_ok=True)

    # 匹配所有的 jpg 和 jpeg 文件（忽略大小写）
    jpg_files = glob.glob(os.path.join(input_dir, '*.[jJ][pP][gG]'))
    jpg_files.extend(glob.glob(os.path.join(input_dir, '*.[jJ][pP][eE][gG]')))

    # 去重
    jpg_files = list(set(jpg_files))

    if not jpg_files:
        print(f"No JPG files found in '{input_dir}'.")
        return

    print(f"Found {len(jpg_files)} images. Starting batch processing...")

    for i, file_path in enumerate(jpg_files):
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.png")
        
        print(f"[{i+1}/{len(jpg_files)}] Processing {filename}...")
        
        try:
            with open(file_path, 'rb') as i_file:
                input_data = i_file.read()
                
            # 核心抠图逻辑：去除背景并保留人物
            output_data = remove(input_data)
            
            with open(output_path, 'wb') as o_file:
                o_file.write(output_data)
                
            print(f"  -> Saved to {output_path}")
        except Exception as e:
            print(f"  -> Error processing {filename}: {e}")
            
    print("Batch processing completed!")

if __name__ == "__main__":
    print("--- JPG 人物批量抠图转 PNG 工具 ---")
    
    # 默认路径
    input_dir = "./input_imgs"
    output_dir = "./output_imgs"
        
    # 如果默认文件夹不存在，自动创建
    if not os.path.exists(input_dir):
        os.makedirs(input_dir, exist_ok=True)
        print(f"已自动创建输入目录 {input_dir}，请将 JPG 图片放入其中。")
        
    process_images(input_dir, output_dir)
