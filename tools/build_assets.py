"""
Prépare les visuels de l'animation à partir du dossier `input/`.

    python3 tools/build_assets.py

Dépendances : pillow, numpy, scipy (pip3 install --user pillow numpy scipy).
Sorties dans `assets/img/`.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "input"
OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

POSTER = Image.open(INPUT / "Affiche Print HWC.png").convert("RGB")
LOGO = Image.open(INPUT / "Logo HWC médaillon.png").convert("RGBA")

RED = np.array([237, 33, 36])
TEAL = np.array([88, 182, 174])


def is_cream(rgb: np.ndarray) -> np.ndarray:
    """Dégradé crème / vert pâle de l'affiche (le blanc pur n'en fait pas partie)."""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (np.abs(r - 230) <= 16) & (np.abs(g - 235) <= 10) & (np.abs(b - 225) <= 12) & (g >= b)


def is_background(rgb: np.ndarray) -> np.ndarray:
    """Fond de l'affiche : dégradé crème, skyline rouge, nuage turquoise."""
    red = np.abs(rgb.astype(int) - RED).max(axis=-1) <= 45
    teal = np.abs(rgb.astype(int) - TEAL).max(axis=-1) <= 40
    return is_cream(rgb) | red | teal


def cutout(box, name, max_height, max_enclosed=None):
    """Détoure un personnage : remplit le fond depuis les bords, garde la plus grande forme.

    `max_enclosed` : surface (px) au-delà de laquelle une poche de fond enfermée
    (entre un bras et un drapeau, par exemple) est elle aussi rendue transparente.
    """
    crop = POSTER.crop(box)
    rgb = np.asarray(crop)
    bg = is_background(rgb)

    # Fond réellement accessible depuis l'extérieur (les intérieurs clairs restent).
    labels, count = ndimage.label(bg)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    edge_labels = edge_labels[edge_labels != 0]
    outside = np.isin(labels, edge_labels)
    if max_enclosed:
        # Seules les grandes poches crème sont concernées : le rouge du drapeau reste.
        cream_labels, cream_count = ndimage.label(is_cream(rgb) & ~outside)
        sizes = ndimage.sum(np.ones_like(cream_labels), cream_labels, range(1, cream_count + 1))
        big = [i + 1 for i, s in enumerate(sizes) if s > max_enclosed]
        outside |= np.isin(cream_labels, big)

    # Les miettes isolées de fond (entre bras et corps…) se rattachent au fond.
    solid = ~outside
    solid = ndimage.binary_opening(solid, iterations=2)
    comp, count = ndimage.label(solid)
    if count > 1:
        sizes = ndimage.sum(solid, comp, range(1, count + 1))
        solid = comp == (int(np.argmax(sizes)) + 1)
    # Seuls les petits trous sont rebouchés : l'espace entre le drapeau et la tête reste vide.
    holes = ndimage.binary_fill_holes(solid) & ~solid
    hole_labels, hole_count = ndimage.label(holes)
    if hole_count:
        hole_sizes = ndimage.sum(holes, hole_labels, range(1, hole_count + 1))
        small = np.isin(hole_labels, [i + 1 for i, s in enumerate(hole_sizes) if s < 400])
        solid = solid | small

    # Lissage du bord : léger retrait puis adoucissement.
    solid = ndimage.binary_erosion(solid, iterations=1)
    alpha = ndimage.gaussian_filter(solid.astype(float), sigma=0.8)
    alpha = np.clip((alpha - 0.35) / 0.4, 0, 1)

    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    im = im.crop(im.getbbox())
    if im.height > max_height:
        im = im.resize((round(im.width * max_height / im.height), max_height), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", quality=92, method=6)
    print(name, im.size)
    return im


def red_silhouette(box, name=None, max_height=None, image=None):
    """Isole les silhouettes rouges, les rend opaques et uniformes."""
    crop = (image or POSTER).crop(box)
    rgb = np.asarray(crop).astype(int)
    redness = rgb[..., 0] - np.maximum(rgb[..., 1], rgb[..., 2])
    alpha = np.clip((redness - 50) / 90, 0, 1)
    rgba = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    rgba[..., :3] = RED
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    if name:
        im = im.crop(im.getbbox())
        if max_height and im.height > max_height:
            im = im.resize((round(im.width * max_height / im.height), max_height), Image.LANCZOS)
        im.save(OUT / f"{name}.webp", quality=90, method=6)
        print(name, im.size)
    return im


# --- Personnages -----------------------------------------------------------
cutout((500, 1620, 880, 2245), "boy", 640)
cutout((790, 1240, 1560, 2245), "girl", 820, max_enclosed=1500)

# --- Skyline : London Eye + Big Ben, puis Tower Bridge reconstruit par symétrie ---
red_silhouette((0, 1380, 545, 2245), "skyline-left", 640)

# Tour gauche du pont avec son câble, puis tranche de passerelle répétée et miroir.
tower = red_silhouette((870, 1790, 1085, 2245))
slice_ = tower.crop((tower.width - 44, 0, tower.width, tower.height))
span_count = 4
bridge = Image.new("RGBA", (tower.width * 2 + slice_.width * span_count * 2, tower.height))
x = 0
bridge.paste(tower, (x, 0))
x += tower.width
for _ in range(span_count):
    bridge.paste(slice_, (x, 0))
    x += slice_.width
mirrored_slice = slice_.transpose(Image.FLIP_LEFT_RIGHT)
for _ in range(span_count):
    bridge.paste(mirrored_slice, (x, 0))
    x += slice_.width
bridge.paste(tower.transpose(Image.FLIP_LEFT_RIGHT), (x, 0))
bridge = bridge.crop(bridge.getbbox())
bridge.save(OUT / "bridge.webp", quality=90, method=6)
print("bridge", bridge.size)

# --- QR code (net, sans rééchantillonnage) ----------------------------------
search = POSTER.crop((600, 1060, 940, 1390))
arr = np.asarray(search).astype(int)
dark = arr.sum(axis=-1) < 150
ys, xs = np.where(dark)
qr = search.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)).convert("L")
qr = qr.point(lambda v: 0 if v < 128 else 255, "1").convert("L")
qr = ImageOps.expand(qr, border=24, fill=255)
qr.save(OUT / "qr.png", optimize=True)
print("qr", qr.size)

# --- Logos partenaires -----------------------------------------------------
partners = POSTER.crop((585, 30, 1090, 230))
partners.save(OUT / "partners.webp", quality=90, method=6)
print("partners", partners.size)

# --- Médaillon HWC ---------------------------------------------------------
logo = LOGO.resize((720, 720), Image.LANCZOS)
logo.save(OUT / "logo.webp", quality=90, method=6)
print("logo", logo.size)
