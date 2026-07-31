import os
import ddddocr
from PIL import Image
import json

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path).convert('RGB')
        # sample a few pixels near the edge to get the background color
        width, height = img.size
        pixels = [
            img.getpixel((0, 0)),
            img.getpixel((width - 1, 0)),
            img.getpixel((0, height - 1)),
            img.getpixel((width - 1, height - 1)),
            img.getpixel((width // 2, 0)),
            img.getpixel((width // 2, height - 1)),
            img.getpixel((5, 5))
        ]
        # find most common color
        from collections import Counter
        most_common = Counter(pixels).most_common(1)[0][0]
        # map rgb to basic color name roughly
        r, g, b = most_common
        return f"RGB({r},{g},{b})"
    except Exception as e:
        return str(e)

def analyze():
    folder = r"C:\MAPWARSJ\public\SUCAI\S10QZ"
    ocr = ddddocr.DdddOcr(show_ad=False)
    results = []
    
    for i in range(1, 465):
        file_name = f"{i}-1.png"
        file_path = os.path.join(folder, file_name)
        
        if not os.path.exists(file_path):
            continue
            
        color = get_dominant_color(file_path)
        
        try:
            with open(file_path, 'rb') as f:
                img_bytes = f.read()
            text = ocr.classification(img_bytes)
        except Exception as e:
            text = "ERROR"
            
        results.append(f"{i}: 色={color}, 字={text}")
        
    with open(r"C:\MAPWARSJ\flag_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    analyze()
