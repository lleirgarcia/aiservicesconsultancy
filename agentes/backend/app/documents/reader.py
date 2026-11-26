"""Procesamiento documental: texto de PDF, imágenes y medida de legibilidad."""

from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
from PIL import Image, ImageFilter, ImageOps, ImageStat

# Por debajo de este valor una imagen se considera de legibilidad baja.
LEGIBILITY_THRESHOLD = 9.0
MAX_IMAGE_SIDE = 1600


@dataclass
class ReadResult:
    kind: str  # "pdf_text" | "image"
    text: str | None
    image_b64: str | None
    image_mime: str | None
    pages: int
    legibility: str  # "buena" | "baja"
    legibility_score: float


def sharpness(img: Image.Image) -> float:
    g = ImageOps.grayscale(img)
    g = g.resize((1000, max(1, int(g.height * 1000 / g.width))))
    edges = g.filter(ImageFilter.FIND_EDGES)
    return round(ImageStat.Stat(edges).stddev[0], 2)


def _encode(img: Image.Image) -> tuple[str, str]:
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode(), "image/jpeg"


def read_document(path: Path, mime_type: str) -> ReadResult:
    if mime_type == "application/pdf":
        with pdfplumber.open(path) as pdf:
            pages = len(pdf.pages)
            text = "\n".join((p.extract_text() or "") for p in pdf.pages).strip()
            if len(text) >= 40:
                return ReadResult("pdf_text", text, None, None, pages, "buena", 100.0)
            # PDF escaneado sin capa de texto: se pasa como imagen.
            img = pdf.pages[0].to_image(resolution=150).original
    else:
        img = Image.open(path)
        pages = 1
    score = sharpness(img)
    data, mime = _encode(img)
    return ReadResult("image", None, data, mime, pages, "buena" if score >= LEGIBILITY_THRESHOLD else "baja", score)
