import struct
import zlib
import os
import math

def create_png(width, height, get_pixel_func):
    """
    Creates a valid RGBA PNG using standard python library (zlib + struct).
    get_pixel_func(x, y, width, height) -> (r, g, b, a) where each is 0..255
    """
    raw_bytes = bytearray()
    for y in range(height):
        raw_bytes.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_bytes.extend((max(0, min(255, int(r))),
                              max(0, min(255, int(g))),
                              max(0, min(255, int(b))),
                              max(0, min(255, int(a)))))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat_data = zlib.compress(bytes(raw_bytes), level=9)

    png_bytes = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr_data) + chunk(b'IDAT', idat_data) + chunk(b'IEND', b'')
    return png_bytes

def draw_hub_icon(x, y, w, h, maskable=False):
    # Normalized coords from -1 to 1
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    dist = math.sqrt(nx * nx + ny * ny)

    # Base background: deep modern slate/indigo gradient #0B0F19 -> #1E1B4B
    t_y = y / h
    bg_r = int(11 + t_y * 19)   # ~11 to 30
    bg_g = int(15 + t_y * 12)   # ~15 to 27
    bg_b = int(25 + t_y * 50)   # ~25 to 75

    if maskable:
        # Full bleed background for Android maskable icon
        badge_scale = 0.55
    else:
        badge_scale = 0.72

    # Draw rounded rectangle badge or shield in center
    # Box bounds in nx, ny: [-badge_scale, badge_scale]
    bx = nx / badge_scale
    by = ny / badge_scale
    radius = 0.35

    # Signed distance to rounded rectangle of half-size (1 - radius)
    qx = abs(bx) - (1.0 - radius)
    qy = abs(by) - (1.0 - radius)
    ax = max(qx, 0.0)
    ay = max(qy, 0.0)
    corner_dist = math.sqrt(ax * ax + ay * ay)
    inside_dist = min(max(qx, qy), 0.0)
    box_sdf = corner_dist + inside_dist - radius

    # Background color determination
    if not maskable:
        # Rounded outer container
        outer_r = 0.28
        ox = abs(nx) - (0.92 - outer_r)
        oy = abs(ny) - (0.92 - outer_r)
        o_corner = math.sqrt(max(ox, 0.0)**2 + max(oy, 0.0)**2)
        o_sdf = o_corner + min(max(ox, oy), 0.0) - outer_r
        if o_sdf > 0.02:
            return (0, 0, 0, 0)
        elif o_sdf > 0.0:
            alpha = int((1.0 - (o_sdf / 0.02)) * 255)
            return (bg_r, bg_g, bg_b, alpha)

    # Center glowing emblem: Indigo-to-Cyan gradient
    if box_sdf <= 0.0:
        # Inside emblem badge
        # Gradient: Top-left (#4F46E5 Indigo) to Bottom-right (#06B6D4 Cyan)
        diag = (bx + by + 2.0) / 4.0
        diag = max(0.0, min(1.0, diag))
        er = int(79 + (6 - 79) * diag)
        eg = int(70 + (182 - 70) * diag)
        eb = int(229 + (212 - 229) * diag)

        # Draw a bold stylized 'PH' / checkmark inside the badge
        # Checkmark strokes:
        # Stem 1: from (-0.45, 0.0) to (-0.1, 0.4)
        # Stem 2: from (-0.1, 0.4) to (0.5, -0.4)
        def dist_to_segment(px, py, x1, y1, x2, y2):
            dx = x2 - x1
            dy = y2 - y1
            l2 = dx*dx + dy*dy
            if l2 == 0:
                return math.hypot(px - x1, py - y1)
            t = max(0.0, min(1.0, ((px - x1)*dx + (py - y1)*dy) / l2))
            proj_x = x1 + t * dx
            proj_y = y1 + t * dy
            return math.hypot(px - proj_x, py - proj_y)

        d1 = dist_to_segment(bx, by, -0.42, 0.05, -0.12, 0.38)
        d2 = dist_to_segment(bx, by, -0.12, 0.38, 0.48, -0.32)
        check_dist = min(d1, d2)
        thickness = 0.12

        # Draw currency / dot badge at top right: (0.35, 0.35)
        dot_dist = math.hypot(bx - 0.32, by - 0.28) - 0.11

        if check_dist < thickness:
            # Crisp white checkmark
            edge = thickness - check_dist
            if edge < 0.02:
                blend = edge / 0.02
                return (int(255 * blend + er * (1 - blend)),
                        int(255 * blend + eg * (1 - blend)),
                        int(255 * blend + eb * (1 - blend)), 255)
            return (255, 255, 255, 255)
        elif dot_dist < 0.0:
            # Gold / Emerald accent dot for financial hub
            return (250, 204, 21, 255) # Amber/Gold #FACC15
        else:
            return (er, eg, eb, 255)
    elif box_sdf < 0.05:
        # Subtle glow border around emblem
        alpha = 1.0 - (box_sdf / 0.05)
        return (int(bg_r + 60 * alpha), int(bg_g + 80 * alpha), int(bg_b + 120 * alpha), 255)

    return (bg_r, bg_g, bg_b, 255)

out_dir = os.path.join(os.getcwd(), 'public')
icons_dir = os.path.join(out_dir, 'icons')
os.makedirs(icons_dir, exist_ok=True)

# Generate standard icons
print("Generating 192x192 icon...")
png_192 = create_png(192, 192, lambda x, y, w, h: draw_hub_icon(x, y, w, h, maskable=False))
with open(os.path.join(icons_dir, 'icon-192x192.png'), 'wb') as f:
    f.write(png_192)

print("Generating 512x512 icon...")
png_512 = create_png(512, 512, lambda x, y, w, h: draw_hub_icon(x, y, w, h, maskable=False))
with open(os.path.join(icons_dir, 'icon-512x512.png'), 'wb') as f:
    f.write(png_512)

print("Generating 512x512 maskable icon...")
png_maskable = create_png(512, 512, lambda x, y, w, h: draw_hub_icon(x, y, w, h, maskable=True))
with open(os.path.join(icons_dir, 'icon-maskable-512x512.png'), 'wb') as f:
    f.write(png_maskable)

print("Generating 180x180 apple touch icon...")
png_apple = create_png(180, 180, lambda x, y, w, h: draw_hub_icon(x, y, w, h, maskable=False))
with open(os.path.join(icons_dir, 'apple-touch-icon.png'), 'wb') as f:
    f.write(png_apple)

# Also create root apple-touch-icon and favicon
with open(os.path.join(out_dir, 'apple-touch-icon.png'), 'wb') as f:
    f.write(png_apple)

print("Generating favicon...")
png_favicon = create_png(64, 64, lambda x, y, w, h: draw_hub_icon(x, y, w, h, maskable=False))
with open(os.path.join(out_dir, 'favicon.png'), 'wb') as f:
    f.write(png_favicon)
with open(os.path.join(out_dir, 'favicon.ico'), 'wb') as f:
    f.write(png_favicon)

print("All icons successfully generated!")
