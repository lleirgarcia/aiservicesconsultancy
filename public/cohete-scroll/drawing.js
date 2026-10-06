// Dibujo del cohete revelado con scroll (trazos → sombras → color).
// Adaptado del paquete "cohete-scroll": misma imagen y mismas fases de
// revelado, pero como fábrica reutilizable controlada por `setProgress(p)`
// en vez de escuchar el scroll de la ventana por su cuenta.
const W = 1536, H = 1024;
const clamp = (x) => Math.max(0, Math.min(1, x));

// Mismas regiones y trazos que el original: silueta principal, sistemas
// despiezados y vistas de detalle.
const regions = [
  [.025, .11, .25, .81], [.43, .025, .12, .22], [.435, .235, .105, .145],
  [.31, .35, .115, .345], [.427, .38, .10, .365], [.55, .35, .145, .55],
  [.43, .73, .105, .205], [.704, .035, .115, .455], [.842, .18, .15, .245],
  [.715, .60, .122, .27], [.863, .53, .13, .40], [.02, .005, .32, .10],
  [.78, .925, .20, .055],
];
function strokes(spacing) {
  const list = [];
  regions.forEach(([x, y, w, h], region) => {
    const rows = Math.ceil((h * H) / spacing);
    for (let j = 0; j < rows; j++) {
      const yy = y * H + j * spacing;
      const flip = j % 2;
      const start = x * W - 5, end = (x + w) * W + 5;
      list.push({ x1: flip ? end : start, y1: yy - 3, x2: flip ? start : end, y2: yy + 3, width: spacing + 5, region });
    }
  });
  return list;
}
const paths = [strokes(9), strokes(15), strokes(19)];

/**
 * Monta el dibujo sobre `canvas` cargando `imageSrc`. Llama a dispose() al
 * desmontar el componente.
 */
export function createDrawing(canvas, imageSrc) {
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const make = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const original = make(), ink = make(), shade = make(), color = make(), mask = make(), paint = make();
  const mc = mask.getContext("2d"), pc = paint.getContext("2d");
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ready = false;
  let last = -1;
  let disposed = false;
  let pending = reduced ? 1 : 0;

  function reveal(layer, progress, index) {
    if (progress <= 0) return;
    if (progress >= 1) {
      ctx.drawImage(layer, 0, 0);
      return;
    }
    const sequence = paths[index];
    const n = progress * sequence.length;
    const whole = Math.floor(n);
    mc.clearRect(0, 0, W, H);
    mc.strokeStyle = "#fff";
    mc.lineCap = "round";
    for (let i = 0; i <= whole && i < sequence.length; i++) {
      const p = sequence[i];
      const fraction = i === whole ? n - whole : 1;
      mc.lineWidth = p.width;
      mc.beginPath();
      mc.moveTo(p.x1, p.y1);
      mc.lineTo(p.x1 + (p.x2 - p.x1) * fraction, p.y1 + (p.y2 - p.y1) * fraction);
      mc.stroke();
    }
    pc.clearRect(0, 0, W, H);
    pc.globalCompositeOperation = "source-over";
    pc.drawImage(layer, 0, 0);
    pc.globalCompositeOperation = "destination-in";
    pc.drawImage(mask, 0, 0);
    pc.globalCompositeOperation = "source-over";
    ctx.drawImage(paint, 0, 0);
  }

  function draw(rawP) {
    if (!ready || disposed) return;
    const p = clamp(reduced ? 1 : rawP);
    if (Math.abs(p - last) < 0.0003) return;
    last = p;
    ctx.fillStyle = "#fdfcfb";
    ctx.fillRect(0, 0, W, H);
    // El papel en blanco solo tiene un atisbo de grano, no un fantasma del dibujo acabado.
    ctx.globalAlpha = 0.035;
    ctx.drawImage(original, 0, 0);
    ctx.globalAlpha = 1;
    const t = clamp(p / 0.46), s = clamp((p - 0.46) / 0.3), c = clamp((p - 0.76) / 0.24);
    reveal(ink, t, 0);
    reveal(shade, s, 1);
    reveal(color, c, 2);
    if (p >= 0.999) ctx.drawImage(original, 0, 0);
  }

  const image = new Image();
  image.onload = () => {
    if (disposed) return;
    const oc = original.getContext("2d", { willReadFrequently: true });
    oc.drawImage(image, 0, 0, W, H);
    const src = oc.getImageData(0, 0, W, H);
    const pixels = src.data;
    const gray = new Float32Array(W * H);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2];
    }
    const a = ctx.createImageData(W, H), b = ctx.createImageData(W, H), c = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = y * W + x, i = n * 4, g = gray[n];
        const edge = Math.abs(g - gray[y * W + Math.max(0, x - 1)]) + Math.abs(g - gray[Math.max(0, y - 1) * W + x]);
        const line = clamp((edge - 5) / 40) * 0.8 + clamp((100 - g) / 100) * 0.3;
        a.data[i] = 38; a.data[i + 1] = 44; a.data[i + 2] = 52; a.data[i + 3] = Math.min(230, line * 255);
        b.data[i] = g; b.data[i + 1] = g; b.data[i + 2] = g; b.data[i + 3] = 255;
        c.data[i] = pixels[i]; c.data[i + 1] = pixels[i + 1]; c.data[i + 2] = pixels[i + 2]; c.data[i + 3] = 255;
      }
    }
    ink.getContext("2d").putImageData(a, 0, 0);
    shade.getContext("2d").putImageData(b, 0, 0);
    color.getContext("2d").putImageData(c, 0, 0);
    ready = true;
    draw(pending);
  };
  image.onerror = () => {
    canvas.setAttribute("aria-label", "No se pudo cargar el dibujo");
  };
  image.src = imageSrc;

  return {
    setProgress(p) {
      pending = p;
      draw(p);
    },
    dispose() {
      disposed = true;
    },
  };
}
