"""One-off generator for PWA manifest icons (no logo asset exists yet).
Run: python scripts/generate_pwa_icons.py
Draws a simple white train glyph on the brand orange (#f97316) used elsewhere
in the app (see AdminDashboard.jsx's orange-500 buttons). Not meant to be
re-run as part of the build - regenerate manually if the icon design changes.
"""
from PIL import Image, ImageDraw
import os

BRAND_ORANGE = (249, 115, 22, 255)
WHITE = (255, 255, 255, 255)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def draw_train_glyph(draw, cx, cy, scale):
    # Simple front-on train silhouette: rounded body, two windows, two wheels.
    body_w, body_h = 60 * scale, 46 * scale
    left, top = cx - body_w / 2, cy - body_h / 2
    right, bottom = cx + body_w / 2, cy + body_h / 2

    draw.rounded_rectangle([left, top, right, bottom], radius=14 * scale, fill=WHITE)

    win_w, win_h = 16 * scale, 14 * scale
    win_y = top + 8 * scale
    draw.rounded_rectangle(
        [cx - win_w - 4 * scale, win_y, cx - 4 * scale, win_y + win_h],
        radius=3 * scale, fill=BRAND_ORANGE,
    )
    draw.rounded_rectangle(
        [cx + 4 * scale, win_y, cx + 4 * scale + win_w, win_y + win_h],
        radius=3 * scale, fill=BRAND_ORANGE,
    )

    wheel_r = 7 * scale
    wheel_y = bottom - wheel_r * 0.6
    draw.ellipse(
        [cx - body_w / 2 + 10 * scale - wheel_r, wheel_y - wheel_r, cx - body_w / 2 + 10 * scale + wheel_r, wheel_y + wheel_r],
        fill=BRAND_ORANGE,
    )
    draw.ellipse(
        [cx + body_w / 2 - 10 * scale - wheel_r, wheel_y - wheel_r, cx + body_w / 2 - 10 * scale + wheel_r, wheel_y + wheel_r],
        fill=BRAND_ORANGE,
    )


def make_icon(size, maskable=False, filename=None):
    img = Image.new("RGBA", (size, size), BRAND_ORANGE)
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons get cropped to arbitrary shapes by the OS, so keep the
        # glyph inside the inner ~80% "safe zone" instead of touching the edges.
        scale = size / 100 * 0.85
    else:
        radius = size * 0.22
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=BRAND_ORANGE)
        scale = size / 100

    draw_train_glyph(draw, size / 2, size / 2, scale)
    img.save(os.path.join(OUT_DIR, filename))
    print(f"wrote {filename} ({size}x{size})")


make_icon(192, filename="icon-192.png")
make_icon(512, filename="icon-512.png")
make_icon(512, maskable=True, filename="icon-maskable-512.png")
