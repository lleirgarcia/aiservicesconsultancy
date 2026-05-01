export interface ResultadoCompresion {
  dataUrl: string;
  bytes: number;
  ancho: number;
  alto: number;
  formato: "image/png" | "image/jpeg";
  comprimida: boolean;
}

const MAX_DIMENSION_INICIAL = 1024;
const MIN_DIMENSION = 240;
const CALIDADES = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5, 0.4];

function estimarBytesDataUrl(dataUrl: string): number {
  const coma = dataUrl.indexOf(",");
  const base64 = coma >= 0 ? dataUrl.slice(coma + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

async function leerImagen(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se ha podido leer la imagen"));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function dibujar(
  img: HTMLImageElement,
  ancho: number,
  alto: number,
  formato: "image/png" | "image/jpeg",
  calidad: number,
): { dataUrl: string; bytes: number } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(ancho));
  canvas.height = Math.max(1, Math.round(alto));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  if (formato === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL(formato, calidad);
  return { dataUrl, bytes: estimarBytesDataUrl(dataUrl) };
}

/**
 * Comprime una imagen para que el dataURL final pese menos de `maxBytes`.
 * Mantiene PNG si el archivo de origen es PNG (preserva transparencia).
 * En cualquier otro caso convierte a JPEG y baja calidad hasta encajar.
 * Si bajando calidad no es suficiente, reduce dimensiones progresivamente.
 */
export async function comprimirImagen(
  file: File,
  maxBytes = 1_000_000,
): Promise<ResultadoCompresion> {
  const img = await leerImagen(file);
  const ratio = img.width / img.height;
  const formato: "image/png" | "image/jpeg" =
    file.type === "image/png" ? "image/png" : "image/jpeg";

  let dimensionLargo = Math.max(img.width, img.height);
  if (dimensionLargo > MAX_DIMENSION_INICIAL) dimensionLargo = MAX_DIMENSION_INICIAL;

  while (dimensionLargo >= MIN_DIMENSION) {
    const ancho = ratio >= 1 ? dimensionLargo : dimensionLargo * ratio;
    const alto = ratio >= 1 ? dimensionLargo / ratio : dimensionLargo;

    if (formato === "image/png") {
      const { dataUrl, bytes } = dibujar(img, ancho, alto, "image/png", 1);
      if (bytes <= maxBytes) {
        return {
          dataUrl,
          bytes,
          ancho,
          alto,
          formato,
          comprimida:
            bytes < file.size ||
            ancho < img.width ||
            alto < img.height,
        };
      }
    } else {
      for (const calidad of CALIDADES) {
        const { dataUrl, bytes } = dibujar(img, ancho, alto, "image/jpeg", calidad);
        if (bytes <= maxBytes) {
          return {
            dataUrl,
            bytes,
            ancho,
            alto,
            formato: "image/jpeg",
            comprimida: true,
          };
        }
      }
    }

    dimensionLargo = Math.floor(dimensionLargo * 0.8);
  }

  // Último intento: dimensión mínima + calidad mínima JPEG
  const ancho = ratio >= 1 ? MIN_DIMENSION : MIN_DIMENSION * ratio;
  const alto = ratio >= 1 ? MIN_DIMENSION / ratio : MIN_DIMENSION;
  const { dataUrl, bytes } = dibujar(img, ancho, alto, "image/jpeg", 0.4);
  return {
    dataUrl,
    bytes,
    ancho,
    alto,
    formato: "image/jpeg",
    comprimida: true,
  };
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
