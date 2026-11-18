import sys
from PIL import Image, ImageOps
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src)
w, h = im.size
scale = 2.0
if w < 700: scale = 3.0
elif w > 1600: scale = 1.5
im = im.convert('L')
im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
im = ImageOps.autocontrast(im)
im.save(dst)
print(dst)