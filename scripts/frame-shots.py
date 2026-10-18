# Usage: python3 scripts/frame-shots.py browser|phone|mat SRC DISPLAY_WIDTH_PX OUT.webp [MAX_WIDTH]
# DISPLAY_WIDTH_PX is roughly how wide the image shows on the page, so
# frames come out the same thickness on screen whatever the source size.
# Bakes a dark Windows-style browser window, phone bezel, or photo mat around each case
# study image so they sit on the dark page as one consistent set.
import sys
from PIL import Image, ImageDraw
SS = 4  # supersample for smooth corners
FRAME = (22, 22, 26, 255); RIM = (44, 44, 51, 255); DOT = (64, 64, 72, 255)
PILL = (14, 14, 17, 255); ISLAND = (6, 6, 8, 255); GLYPH = (120, 120, 130, 255)

def rr(size, r):
    m = Image.new('L', (size[0]*SS, size[1]*SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0]*SS-1, size[1]*SS-1], r*SS, fill=255)
    return m.resize(size, Image.LANCZOS)

def shape(size, r, color):
    layer = Image.new('RGBA', size, color); layer.putalpha(rr(size, r)); return layer

def browser(src, display_w):
    im = Image.open(src).convert('RGB'); w, h = im.size; k = w / display_w
    bar = round(26*k); b = max(1, round(1*k)); r = round(8*k)
    W, H = w + 2*b, h + bar + b
    out = shape((W, H), r, RIM)
    out.alpha_composite(shape((W-2*b, H-2*b), max(r-b, 1), FRAME), (b, b))
    d = ImageDraw.Draw(out)
    cy = b + bar//2; g = round(4*k); lw = max(1, round(1.2*k))
    # Windows caption buttons on the right: minimise, maximise, close
    xs = [W - b - round(x*k) for x in (78, 50, 22)]
    d.line([xs[0]-g, cy, xs[0]+g, cy], fill=GLYPH, width=lw)
    d.rectangle([xs[1]-g, cy-g, xs[1]+g, cy+g], outline=GLYPH, width=lw)
    d.line([xs[2]-g, cy-g, xs[2]+g, cy+g], fill=GLYPH, width=lw)
    d.line([xs[2]-g, cy+g, xs[2]+g, cy-g], fill=GLYPH, width=lw)
    # address bar on the left, like Edge or Chrome on Windows
    ax = b + round(10*k); pw = min(round(240*k), int(W*0.5)); ph = round(14*k)
    d.rounded_rectangle([ax, cy-ph//2, ax+pw, cy+ph//2], ph//2, fill=PILL, outline=RIM, width=b)
    # screenshot: square top, rounded bottom to match the window
    shot = im.convert('RGBA')
    m = Image.new('L', (w, h), 255); bm = rr((w, h + r), max(r-b, 1)).crop((0, r, w, h + r))
    m.paste(bm, (0, 0)); shot.putalpha(m)
    out.alpha_composite(shot, (b, b + bar))
    return out

def phone(src, display_w):
    im = Image.open(src).convert('RGB'); w, h = im.size; k = w / display_w
    bz = round(6*k); b = max(1, round(1*k)); r = round(24*k)
    sb = round(20*k)  # status bar strip, so the island never covers content
    W, H = w + 2*bz, h + 2*bz + sb
    out = shape((W, H), r, RIM)
    out.alpha_composite(shape((W-2*b, H-2*b), r-b, ISLAND), (b, b))
    shot = im.convert('RGBA')
    m = Image.new('L', (w, h), 255); bm = rr((w, h + r), r-bz).crop((0, r, w, h + r))
    m.paste(bm, (0, 0)); shot.putalpha(m)
    out.alpha_composite(shot, (bz, bz + sb))
    # punch-hole camera in the status bar
    cr = round(4*k); cy = bz + sb//2
    ImageDraw.Draw(out).ellipse([W//2-cr, cy-cr, W//2+cr, cy+cr], fill=(30, 30, 36, 255))
    return out

def mat(src, display_w):
    im = Image.open(src).convert('RGB'); w, h = im.size; k = w / display_w
    p = round(8*k); b = max(1, round(1*k)); r = round(12*k)
    W, H = w + 2*p, h + 2*p
    out = shape((W, H), r, RIM)
    out.alpha_composite(shape((W-2*b, H-2*b), r-b, FRAME), (b, b))
    shot = im.convert('RGBA'); shot.putalpha(rr((w, h), max(r-p, 4)))
    out.alpha_composite(shot, (p, p))
    return out

kind, src, dw, dst = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
img = {'browser': browser, 'phone': phone, 'mat': mat}[kind](src, dw)
maxw = int(sys.argv[5]) if len(sys.argv) > 5 else None
if maxw and img.width > maxw:
    img = img.resize((maxw, round(img.height*maxw/img.width)), Image.LANCZOS)
img.save(dst, 'WEBP', quality=86, method=6)
print(dst.split('/')[-1], img.size)
