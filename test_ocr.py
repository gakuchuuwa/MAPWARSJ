import os
import ddddocr
from PIL import Image

def test_ocr():
    ocr = ddddocr.DdddOcr(show_ad=False)
    img = Image.open(r"C:\MAPWARSJ\public\SUCAI\S10QZ\59-1.png").convert("RGBA")
    
    # Process image: make green background white, everything else black
    data = img.getdata()
    new_data = []
    for item in data:
        # Green background is usually (0, 248, 0) or (0, 255, 0)
        if item[0] < 50 and item[1] > 200 and item[2] < 50:
            new_data.append((255, 255, 255, 255))
        else:
            # text is black or white, let's just make it black for OCR
            new_data.append((0, 0, 0, 255))
            
    img.putdata(new_data)
    img.save(r"C:\MAPWARSJ\scratch\test_59.png")
    
    with open(r"C:\MAPWARSJ\scratch\test_59.png", "rb") as f:
        res = ocr.classification(f.read())
        print(f"OCR result for 59-1.png: {res}")

if __name__ == "__main__":
    if not os.path.exists(r"C:\MAPWARSJ\scratch"):
        os.makedirs(r"C:\MAPWARSJ\scratch")
    test_ocr()
