import os
import glob
from PIL import Image
import pytesseract

# Explicitly set tesseract path since it might not be in PATH
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:\MAPWARSJ\tessdata'

folder = r"C:\MAPWARSJ\public\SUCAI\S10QZ"
out_file = r"C:\MAPWARSJ\S10QZ_TextMap.txt"

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
    # resize to make it easier for tesseract
    img = img.resize((img.width * 3, img.height * 3), Image.LANCZOS)
    return img

with open(out_file, 'w', encoding='utf-8') as f:
    for i in range(59, 465):
        path = os.path.join(folder, f"{i}-1.png")
        if os.path.exists(path):
            try:
                processed = preprocess_image(path)
                # psm 10 = single character, psm 8 = single word
                text = pytesseract.image_to_string(processed, lang='chi_sim', config='--psm 10 -c tessedit_char_blacklist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:\"\\|,.<>/?`~')
                char = text.strip()
                if len(char) > 1:
                    char = char[0] # take first char if it hallucinated noise
                f.write(f"{i}: {char}\n")
            except Exception as e:
                f.write(f"{i}: ERROR {e}\n")
        if i % 50 == 0:
            print(f"Processed up to {i}")
print("Done!")
