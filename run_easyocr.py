import os
from PIL import Image
import easyocr
import numpy as np

folder = r"C:\MAPWARSJ\public\SUCAI\S10QZ"
out_file = r"C:\MAPWARSJ\S10QZ_EasyOCR.txt"

# initialize the reader
reader = easyocr.Reader(['ch_sim'], gpu=False) # fallback to CPU if GPU not available

def preprocess_image(img_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        # If it's green background, make it white. Otherwise make it black.
        if item[1] > 200 and item[0] < 100 and item[2] < 100:
            new_data.append((255, 255, 255, 255))
        else:
            if item[3] == 0:
                new_data.append((255, 255, 255, 255))
            else:
                new_data.append((0, 0, 0, 255))
    img.putdata(new_data)
    # resize to make it easier for ocr
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    return img

with open(out_file, 'w', encoding='utf-8') as f:
    for i in range(59, 465):
        path = os.path.join(folder, f"{i}-1.png")
        if os.path.exists(path):
            try:
                processed = preprocess_image(path)
                # convert PIL to OpenCV format for easyocr
                img_cv = np.array(processed.convert('RGB'))
                img_cv = img_cv[:, :, ::-1].copy()
                
                result = reader.readtext(img_cv, detail=0)
                if result:
                    text = result[0].strip()
                    if len(text) > 1:
                        text = text[0]
                    f.write(f"{i}: {text}\n")
                    print(f"{i}: {text}")
                else:
                    f.write(f"{i}: \n")
                    print(f"{i}: ")
            except Exception as e:
                f.write(f"{i}: ERROR {e}\n")
        f.flush()
print("Done!")
