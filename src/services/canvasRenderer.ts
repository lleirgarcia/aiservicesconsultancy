import { TemplateConfig, TemplateElement, TextElementContent, ShapeConfig, ImageExport } from "@/types/instagram-builder";

export function renderTemplateToCanvas(
  canvas: HTMLCanvasElement,
  template: TemplateConfig,
  options?: {
    fillBackground?: boolean;
    renderOutlines?: boolean;
  }
): void {
  // Resize canvas to 1080x1080
  canvas.width = 1080;
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const { fillBackground = true, renderOutlines = false } = options || {};

  // Render background
  if (fillBackground && template.canvas.background_color) {
    ctx.fillStyle = getCSSColor(template.canvas.background_color);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Render elements sorted by z-index
  const sortedElements = [...template.elements].sort((a, b) => a.z_index - b.z_index);

  for (const element of sortedElements) {
    renderElement(ctx, element, renderOutlines);
  }
}

function renderElement(
  ctx: CanvasRenderingContext2D,
  element: TemplateElement,
  renderOutlines: boolean
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

  // Debug outlines
  if (renderOutlines) {
    ctx.strokeStyle = "rgba(137, 206, 255, 0.5)";
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

  ctx.fillText(text, x, y, size.width);
}

function renderShapeElement(
  ctx: CanvasRenderingContext2D,
  shape: ShapeConfig,
  size: { width: number; height: number }
): void {
  ctx.fillStyle = getCSSColor(shape.fill_color);

  if (shape.type === "circle") {
    const rx = size.width / 2;
    const ry = size.height / 2;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (shape.stroke_color) {
      ctx.strokeStyle = getCSSColor(shape.stroke_color);
      ctx.lineWidth = shape.stroke_width ?? 1;
      ctx.stroke();
    }
    return;
  }

  // rectangle and line both fill a rect
  if (shape.border_radius && shape.border_radius > 0) {
    const r = shape.border_radius;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size.width - r, 0);
    ctx.arcTo(size.width, 0, size.width, r, r);
    ctx.lineTo(size.width, size.height - r);
    ctx.arcTo(size.width, size.height, size.width - r, size.height, r);
    ctx.lineTo(r, size.height);
    ctx.arcTo(0, size.height, 0, size.height - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size.width, size.height);
  }

  if (shape.stroke_color) {
    ctx.strokeStyle = getCSSColor(shape.stroke_color);
    ctx.lineWidth = shape.stroke_width ?? 1;
    ctx.strokeRect(0, 0, size.width, size.height);
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
