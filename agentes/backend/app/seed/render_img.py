"""Imágenes realistas: ticket térmico fotografiado y foto de una factura en papel."""

from __future__ import annotations

import random
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

MONO = "/System/Library/Fonts/Menlo.ttc"
SANS = "/System/Library/Fonts/Helvetica.ttc"


def _font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size, index=index)
    except OSError:
        return ImageFont.load_default(size)


def _noise(img: Image.Image, amount: int, rng: random.Random) -> Image.Image:
    noise = Image.effect_noise(img.size, amount).convert("L")
    return Image.blend(img.convert("RGB"), Image.merge("RGB", (noise, noise, noise)), 0.06)


def _desk_background(size: tuple[int, int], rng: random.Random) -> Image.Image:
    w, h = size
    bg = Image.new("RGB", size, (120, 104, 88))
    d = ImageDraw.Draw(bg)
    for y in range(0, h, 3):  # vetas de madera
        tone = 104 + int(14 * ((y * 7919) % 23) / 23) + rng.randint(-4, 4)
        d.line([(0, y), (w, y + rng.randint(-6, 6))], fill=(tone + 18, tone, tone - 16), width=3)
    return bg.filter(ImageFilter.GaussianBlur(1.2))


def _place_on_desk(paper: Image.Image, rng: random.Random, angle: float, margin: int = 90, blur: float = 0.6) -> Image.Image:
    paper = paper.convert("RGBA")
    rotated = paper.rotate(angle, resample=Image.BICUBIC, expand=True)
    w, h = rotated.size
    canvas = _desk_background((w + margin * 2, h + margin * 2), rng)
    shadow = Image.new("RGBA", rotated.size, (0, 0, 0, 0))
    shadow.putalpha(rotated.getchannel("A").point(lambda a: 90 if a else 0))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.paste(shadow, (margin + 14, margin + 18), shadow)
    canvas.paste(rotated, (margin, margin), rotated)
    # Iluminación irregular: viñeta suave.
    vignette = Image.radial_gradient("L").resize(canvas.size).point(lambda v: int(v * 0.45))
    dark = Image.new("RGB", canvas.size, (20, 16, 12))
    canvas = Image.composite(dark, canvas, vignette)
    canvas = _noise(canvas, 40, rng)
    return canvas.filter(ImageFilter.GaussianBlur(blur))


def render_fuel_ticket(path: Path, *, station: dict, client_tax_id: str, ticket: dict, seed: int = 7) -> None:
    rng = random.Random(seed)
    W = 560
    lines: list[tuple[str, str, int]] = []  # (texto, alineación, tamaño)

    def add(t: str, a: str = "l", s: int = 22) -> None:
        lines.append((t, a, s))

    add(station["name"].upper(), "c", 26)
    add(station["address"], "c", 19)
    add(f"CIF {station['tax_id']}", "c", 21)
    add("-" * 34, "c")
    add("FACTURA SIMPLIFICADA", "c", 24)
    add(f"Nº {ticket['number']}")
    add(f"Fecha {ticket['date_es']}   Hora {ticket['time']}")
    add(f"Surtidor 4   Op. 0117")
    add("-" * 34, "c")
    add(f"GASOIL A")
    add(f"{ticket['liters']:.2f} L x 1,489 EUR/L".replace(".", ","))
    add(f"{'IMPORTE':<20}{ticket['total_es']:>14}")
    add("-" * 34, "c")
    add(f"{'BASE IMPONIBLE':<20}{ticket['base_es']:>14}")
    add(f"{'IVA 21%':<20}{ticket['vat_es']:>14}")
    add(f"{'TOTAL':<16}{ticket['total_es']:>14}", "l", 25)
    add("-" * 34, "c")
    add("TARJETA VISA ****4417", "l", 20)
    add(f"Cliente CIF: {client_tax_id}", "l", 20)
    add(f"Matrícula: 4821 KLM", "l", 20)
    add("")
    add("GRACIES PER LA SEVA VISITA", "c", 20)
    H = 90 + sum(int(s * 1.55) for _, _, s in lines) + 60
    paper = Image.new("RGB", (W, H), (246, 244, 238))
    d = ImageDraw.Draw(paper)
    y = 50
    for text, align, size in lines:
        f = _font(MONO, size)
        tw = d.textlength(text, font=f)
        x = 34 if align == "l" else (W - tw) / 2
        d.text((x, y), text, font=f, fill=(48, 46, 52))
        y += int(size * 1.55)
    # Desvaído típico del papel térmico.
    fade = Image.linear_gradient("L").resize((W, H)).point(lambda v: int(v * 0.25))
    paper = Image.composite(Image.new("RGB", (W, H), (246, 244, 238)), paper, fade)
    # Bordes de corte dentados.
    mask = Image.new("L", (W, H), 255)
    md = ImageDraw.Draw(mask)
    for x in range(0, W, 14):
        md.polygon([(x, 0), (x + 7, 9), (x + 14, 0)], fill=0)
        md.polygon([(x, H), (x + 7, H - 9), (x + 14, H)], fill=0)
    paper.putalpha(mask)
    img = _place_on_desk(paper, rng, angle=-3.2, margin=110)
    img = img.resize((int(img.width * 0.8), int(img.height * 0.8)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=84)


def render_photo_of_pdf(pdf_path: Path, path: Path, *, seed: int = 11, angle: float = 2.1, blur: float = 0.7, scale: float = 1.6) -> None:
    rng = random.Random(seed)
    pdf = pdfium.PdfDocument(str(pdf_path))
    page = pdf[0].render(scale=scale).to_pil().convert("RGB")
    # Tono de papel y ligera sobreexposición en una esquina.
    tint = Image.new("RGB", page.size, (250, 246, 236))
    page = Image.blend(page, tint, 0.12)
    glare = Image.radial_gradient("L").resize(page.size).point(lambda v: 255 - int(v * 0.9))
    page = Image.composite(Image.new("RGB", page.size, (255, 255, 250)), page, glare.point(lambda v: int(v * 0.25)))
    img = _place_on_desk(page, rng, angle=angle, margin=70, blur=blur)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=82)


def render_preview(src: Path, dst: Path, width: int = 900) -> int:
    """Miniatura PNG para la interfaz. Devuelve el número de páginas."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == ".pdf":
        pdf = pdfium.PdfDocument(str(src))
        img = pdf[0].render(scale=width / pdf[0].get_width()).to_pil()
        pages = len(pdf)
    else:
        img = ImageOps.exif_transpose(Image.open(src))
        img = img.resize((width, int(img.height * width / img.width)), Image.LANCZOS)
        pages = 1
    img.convert("RGB").save(dst, "PNG", optimize=True)
    return pages
