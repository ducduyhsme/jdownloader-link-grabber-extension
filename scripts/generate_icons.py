import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Padding
    pad = max(1, int(size * 0.08))
    
    # Outer circle / rounded rectangle (JDownloader deep blue gradient effect)
    # Background circle
    draw.ellipse(
        [pad, pad, size - pad, size - pad],
        fill=(22, 119, 255, 255),
        outline=(10, 80, 200, 255),
        width=max(1, int(size * 0.04))
    )

    # Inner globe ring / decorative element
    inner_pad = max(2, int(size * 0.18))
    draw.ellipse(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        outline=(255, 255, 255, 80),
        width=max(1, int(size * 0.03))
    )

    # Downward download arrow (sharp, clear, high contrast white)
    cx = size / 2.0
    cy = size / 2.0

    arrow_w = size * 0.36
    stem_w = size * 0.16
    arrow_top = size * 0.25
    stem_bottom = size * 0.55
    arrow_tip = size * 0.76

    # Stem: rectangle
    draw.rectangle(
        [cx - stem_w / 2, arrow_top, cx + stem_w / 2, stem_bottom],
        fill=(255, 255, 255, 255)
    )

    # Arrow head: polygon
    draw.polygon(
        [
            (cx - arrow_w / 2, stem_bottom),
            (cx + arrow_w / 2, stem_bottom),
            (cx, arrow_tip)
        ],
        fill=(255, 255, 255, 255)
    )

    return img

out_dir = r'C:\Users\Duy\.gemini\antigravity\scratch\jdownloader-link-grabber-extension\icons'
os.makedirs(out_dir, exist_ok=True)

for s in [16, 32, 48, 128]:
    icon = create_icon(s)
    path = os.path.join(out_dir, f'icon{s}.png')
    icon.save(path, 'PNG')
    print(f'Generated {path}')
