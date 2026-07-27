"""
KDP Cover Fixer — Thomas Perdana / The Discipleship Journey

Fixes all three issues:
  1. Resize to 1600×2560 px (KDP ideal)
  2. Add author name "Thomas Perdana" in brand style
  3. Compress to ≤ 4.5 MB JPEG

Metadata from book files:
  Book 1: BELONG — Your First Steps Into the Family of God
  Book 2: GROW   — Building Habits & Discovering Your S.H.A.P.E.
  Book 3: GO     — Sharing Your Faith & Changing the World
"""

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

KDP_W, KDP_H = 1600, 2560
AUTHOR = "Thomas Perdana"
ASSETS = "/home/ubuntu/discipleship/assets"
OUT    = "/home/ubuntu/discipleship/kdp_covers"
os.makedirs(OUT, exist_ok=True)

BOOKS = [
    {
        "src":      "book1_cover.jpg",
        "out":      "BELONG_KDP_Cover.jpg",
        "subtitle": "Your First Steps Into the Family of God",
    },
    {
        "src":      "book2_cover.jpg",
        "out":      "GROW_KDP_Cover.jpg",
        "subtitle": "Building Habits & Discovering Your S.H.A.P.E.",
    },
    {
        "src":      "book3_cover.jpg",
        "out":      "GO_KDP_Cover.jpg",
        "subtitle": "Sharing Your Faith & Changing the World",
    },
]

def load_font(size, bold=False):
    """Try to load a system font; fall back to PIL default."""
    candidates_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
    ]
    candidates_reg = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
    ]
    candidates = candidates_bold if bold else candidates_reg
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def add_author_band(img: Image.Image, author: str) -> Image.Image:
    """
    Adds a semi-transparent dark navy band at the bottom of the cover
    with the author name in gold, matching the existing brand style.
    """
    w, h = img.size
    draw = ImageDraw.Draw(img)

    # ── Band geometry ──────────────────────────────────────────────────────
    band_h   = int(h * 0.085)   # ~8.5% of height = ~218px on 2560h
    band_top = h - band_h

    # ── Gradient overlay: darken the bottom portion of the existing image ──
    # Draw a semi-transparent rectangle over the existing footer area
    overlay = Image.new("RGBA", (w, band_h), (10, 25, 55, 210))   # dark navy, 82% opacity
    img_rgba = img.convert("RGBA")
    img_rgba.paste(overlay, (0, band_top), overlay)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Gold separator line ────────────────────────────────────────────────
    line_y   = band_top + 6
    gold     = (245, 158, 11)
    line_w   = int(w * 0.55)
    line_x0  = (w - line_w) // 2
    draw.line([(line_x0, line_y), (line_x0 + line_w, line_y)], fill=gold, width=2)

    # ── Author name ────────────────────────────────────────────────────────
    font_size = int(band_h * 0.30)
    font      = load_font(font_size, bold=False)

    # Measure text
    bbox = draw.textbbox((0, 0), author, font=font)
    tw   = bbox[2] - bbox[0]
    th   = bbox[3] - bbox[1]
    tx   = (w - tw) // 2
    ty   = band_top + (band_h - th) // 2 + 8

    # Subtle shadow
    draw.text((tx + 2, ty + 2), author, font=font, fill=(0, 0, 0, 120))
    # Gold text
    draw.text((tx, ty), author, font=font, fill=gold)

    # ── Small decorative rule below author name ────────────────────────────
    rule_y  = ty + th + int(band_h * 0.08)
    rule_w  = int(w * 0.25)
    rule_x0 = (w - rule_w) // 2
    draw.line([(rule_x0, rule_y), (rule_x0 + rule_w, rule_y)], fill=gold, width=1)

    return img


def process_cover(book: dict):
    src_path = os.path.join(ASSETS, book["src"])
    out_path = os.path.join(OUT,    book["out"])

    print(f"\n── Processing {book['src']} ──")

    # 1. Open original
    img = Image.open(src_path).convert("RGB")
    orig_w, orig_h = img.size
    print(f"   Original:  {orig_w}×{orig_h}px")

    # 2. Resize to KDP ideal (1600×2560) using high-quality Lanczos
    img = img.resize((KDP_W, KDP_H), Image.LANCZOS)
    print(f"   Resized:   {KDP_W}×{KDP_H}px")

    # 3. Add author name band
    img = add_author_band(img, AUTHOR)
    print(f"   Author band added: '{AUTHOR}'")

    # 4. Save with progressive JPEG, quality tuned to stay ≤ 4.5 MB
    quality = 88
    while True:
        img.save(out_path, "JPEG", quality=quality, optimize=True, progressive=True)
        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        print(f"   Quality={quality} → {size_mb:.2f} MB")
        if size_mb <= 4.5 or quality < 60:
            break
        quality -= 4

    final_size = os.path.getsize(out_path) / (1024 * 1024)
    status = "✅ PASS" if final_size <= 5.0 else "❌ FAIL"
    print(f"   Final:     {out_path}")
    print(f"   File size: {final_size:.2f} MB  {status}")
    return out_path, final_size


if __name__ == "__main__":
    print("=" * 60)
    print("KDP Cover Fixer — The Discipleship Journey")
    print("Author: Thomas Perdana")
    print(f"Target: {KDP_W}×{KDP_H}px | ≤4.5MB JPEG")
    print("=" * 60)

    results = []
    for book in BOOKS:
        path, size = process_cover(book)
        results.append((book["out"], size))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, size in results:
        kdp_ok = "✅" if size <= 5.0 else "❌"
        print(f"  {kdp_ok}  {name}  ({size:.2f} MB)")
    print("\nAll KDP-ready covers saved to:", OUT)
