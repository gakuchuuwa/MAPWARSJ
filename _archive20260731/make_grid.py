import os
from PIL import Image, ImageDraw, ImageFont
import math

folder = r"C:\MAPWARSJ\public\SUCAI\S10QZ"

def create_grid(start, end, columns, output_file):
    images = []
    for i in range(start, end + 1):
        path = os.path.join(folder, f"{i}-1.png")
        if os.path.exists(path):
            img = Image.open(path).convert("RGBA")
            images.append((i, img))
            
    if not images:
        return
        
    img_w, img_h = images[0][1].size
    cell_w = img_w + 40
    cell_h = img_h + 20
    
    rows = math.ceil(len(images) / columns)
    
    grid = Image.new("RGBA", (columns * cell_w, rows * cell_h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(grid)
    
    for idx, (num, img) in enumerate(images):
        row = idx // columns
        col = idx % columns
        x = col * cell_w
        y = row * cell_h
        
        # Paste image
        grid.paste(img, (x + 20, y + 10), img)
        # Draw number
        draw.text((x, y), str(num), fill=(0,0,0,255))
        
    grid.save(output_file)

if __name__ == "__main__":
    # Rebel flags
    create_grid(7, 58, 8, r"C:\MAPWARSJ\grid_flags.png")
    # Texts part 1
    create_grid(59, 200, 10, r"C:\MAPWARSJ\grid_text1.png")
    # Texts part 2
    create_grid(201, 300, 10, r"C:\MAPWARSJ\grid_text2.png")
    # Texts part 3
    create_grid(301, 464, 10, r"C:\MAPWARSJ\grid_text3.png")

