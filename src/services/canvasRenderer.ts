import { TemplateConfig, TemplateElement, TextElementContent, ShapeConfig, ImageExport } from "@/types/instagram-builder";

export function renderTemplateToCanvas(
  canvas: HTMLCanvasElement,
  template: TemplateConfig,
  options?: {
    fillBackground?: boolean;
    renderOutlines?: boolean;
    selectedElementId?: string | null;
    hiddenElementId?: string | null;
  }
): void {
  // Resize canvas to 1080x1080
  canvas.width = 1080;
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const {
    fillBackground = true,
    renderOutlines = false,
    selectedElementId = null,
    hiddenElementId = null,
  } = options || {};

  // Render background
  if (fillBackground && template.canvas.background_color) {
    ctx.fillStyle = getCSSColor(template.canvas.background_color);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Render elements sorted by z-index
  const sortedElements = [...template.elements].sort((a, b) => a.z_index - b.z_index);

  for (const element of sortedElements) {
    if (element.id === hiddenElementId) continue;
    const isSelected = element.id === selectedElementId;
    renderElement(ctx, element, renderOutlines || isSelected, isSelected);
  }
}

function renderElement(
  ctx: CanvasRenderingContext2D,
  element: TemplateElement,
  renderOutlines: boolean,
  isSelected: boolean = false
): void {
  ctx.save();

  // Apply position and rotation
  ctx.translate(element.position.x + element.size.width / 2, element.position.y + element.size.height / 2);
  if (element.rotation) {
    ctx.rotate((element.rotation * Math.PI) / 180);
  }
  ctx.translate(-(element.size.width / 2), -(element.size.height / 2));

  // Apply opacity
  if (element.opacity !== undefined) {
    ctx.globalAlpha = element.opacity;
  }

  // Render based on type
  if (element.type === "text" && element.content) {
    renderTextElement(ctx, element.content, element.size);
  } else if (element.type === "image" && element.image_url) {
    renderImageElement(ctx, element.image_url, element.size);
  } else if (element.type === "shape" && element.shape) {
    renderShapeElement(ctx, element.shape, element.size);
  }

  // Selection outline (bright)
  if (isSelected) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#89ceff";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(-4, -4, element.size.width + 8, element.size.height + 8);
    ctx.setLineDash([]);
  } else if (renderOutlines) {
    ctx.strokeStyle = "rgba(137, 206, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, element.size.width, element.size.height);
  }

  ctx.restore();
}

function renderTextElement(
  ctx: CanvasRenderingContext2D,
  content: TextElementContent,
  size: { width: number; height: number }
): void {
  const { text, font_family, font_size, font_weight, color, text_align, line_height } = content;

  // Font
  const fontWeightNum = typeof font_weight === "number" ? font_weight : 400;
  ctx.font = `${fontWeightNum} ${font_size}px "${font_family}", sans-serif`;
  ctx.fillStyle = getCSSColor(color);
  ctx.textAlign = text_align || "left";
  ctx.textBaseline = "top";
  ctx.lineWidth = 1;

  // Simple text rendering (no wrapping in MVP)
  const y = (size.height - font_size) / 2;
  let x = 0;

  if (text_align === "center") {
    x = size.width / 2;
  } else if (text_align === "right") {
    x = size.width;
  }

  ctx.fillText(text, x, y);
}

function renderShapeElement(
  ctx: CanvasRenderingContext2D,
  shape: ShapeConfig,
  size: { width: number; height: number }
): void {
  ctx.fillStyle = getCSSColor(shape.fill_color);
  const w = size.width;
  const h = size.height;

  const strokeIfNeeded = () => {
    if (shape.stroke_color) {
      ctx.strokeStyle = getCSSColor(shape.stroke_color);
      ctx.lineWidth = shape.stroke_width ?? 1;
      ctx.stroke();
    }
  };

  if (shape.type === "circle" || shape.type === "ellipse") {
    const rx = w / 2;
    const ry = h / 2;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "triangle") {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "pentagon" || shape.type === "hexagon") {
    const sides = shape.type === "pentagon" ? 5 : 6;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const offset = shape.type === "pentagon" ? -Math.PI / 2 : 0;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = offset + (i * 2 * Math.PI) / sides;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "star") {
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.5;
    const points = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "heart") {
    // Parametric heart fitted to bounding box
    ctx.beginPath();
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const xRaw = 16 * Math.pow(Math.sin(t), 3);
      const yRaw =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      // Map from [-16,16] x [-17,13] to [0,w] x [0,h] with y flipped
      const x = ((xRaw + 16) / 32) * w;
      const y = ((13 - yRaw) / 30) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  if (shape.type === "arrow") {
    // Right-pointing arrow inside bounding box
    const shaftH = h * 0.4;
    const shaftY = (h - shaftH) / 2;
    const headW = Math.min(h, w * 0.4);
    const shaftEndX = w - headW;
    ctx.beginPath();
    ctx.moveTo(0, shaftY);
    ctx.lineTo(shaftEndX, shaftY);
    ctx.lineTo(shaftEndX, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(shaftEndX, h);
    ctx.lineTo(shaftEndX, shaftY + shaftH);
    ctx.lineTo(0, shaftY + shaftH);
    ctx.closePath();
    ctx.fill();
    strokeIfNeeded();
    return;
  }

  // rectangle and line both fill a rect
  if (shape.border_radius && shape.border_radius > 0) {
    const r = shape.border_radius;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.arcTo(w, 0, w, r, r);
    ctx.lineTo(w, h - r);
    ctx.arcTo(w, h, w - r, h, r);
    ctx.lineTo(r, h);
    ctx.arcTo(0, h, 0, h - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, w, h);
  }

  if (shape.stroke_color) {
    ctx.strokeStyle = getCSSColor(shape.stroke_color);
    ctx.lineWidth = shape.stroke_width ?? 1;
    ctx.strokeRect(0, 0, w, h);
  }
}

function renderImageElement(
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  size: { width: number; height: number }
): void {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size.width, size.height);
  };
  img.src = imageUrl;
}

export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg" = "png",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const finalQuality = quality ? Math.max(0, Math.min(1, quality)) : 0.95;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      finalQuality
    );
  });
}

export function createImageExport(
  blob: Blob,
  format: "png" | "jpeg",
  filename: string
): ImageExport {
  return {
    blob,
    format: format === "jpeg" ? "image/jpeg" : "image/png",
    width: 1080,
    height: 1080,
    filename,
    size_bytes: blob.size,
  };
}

// Helper: Convert CSS color variable or hex to actual color
function getCSSColor(color: string): string {
  // If it's a CSS variable reference like "var(--bg)"
  if (color.startsWith("var(")) {
    // Extract variable name and get from document
    const varName = color.match(/--[\w-]+/)?.[0];
    if (varName) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || color;
    }
  }
  return color;
}
