"""Hoja de revisión: primer y último fotograma 'malo' de cada GIF."""
import sys, glob
from PIL import Image, ImageSequence
files = sorted(glob.glob(sys.argv[1] + "/*.gif"))
cells = []
for f in files:
    im = Image.open(f)
    fr = [x.convert("RGB") for x in ImageSequence.Iterator(im)]
    cells += [fr[0], fr[len(fr) // 2]]
cols = 6
w, h = cells[0].size
sheet = Image.new("RGB", (cols * w, ((len(cells) + cols - 1) // cols) * h), "white")
for i, c in enumerate(cells):
    sheet.paste(c, ((i % cols) * w, (i // cols) * h))
sheet.thumbnail((1800, 4000))
sheet.save(sys.argv[2])
print(len(files))
