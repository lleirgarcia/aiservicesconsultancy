import sharp from "sharp";
import { supabase } from "@/lib/supabase";
import { generateSlug } from "@/lib/blog/slug";

export const BLOG_IMAGES_BUCKET = "blog-images";

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MAX_DIMENSION_PX = 1600;
const WEBP_QUALITY = 80;

export class StorageServiceError extends Error {
  constructor(
    public readonly code:
      | "invalid_file"
      | "size_too_large"
      | "unsupported_mime"
      | "upload_failed",
    message: string,
  ) {
    super(message);
  }
}

export interface UploadImageInput {
  articleId: string;
  filename: string;
  contentType: string;
  buffer: ArrayBuffer | Uint8Array;
  size: number;
}

export interface UploadImageResult {
  path: string;
  publicUrl: string;
}

function buildObjectPath(articleId: string, filename: string) {
  const base = generateSlug(filename.replace(/\.[^.]+$/, "")) || "image";
  const ts = Date.now();
  return `${articleId}/${ts}-${base}.webp`;
}

async function optimizeImage(input: Uint8Array): Promise<Uint8Array> {
  try {
    const buffer = await sharp(input)
      .rotate()
      .resize({
        width: MAX_DIMENSION_PX,
        height: MAX_DIMENSION_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return new Uint8Array(buffer);
  } catch (err) {
    throw new StorageServiceError(
      "upload_failed",
      `image optimization failed: ${(err as Error).message}`,
    );
  }
}

export async function uploadImage(
  input: UploadImageInput,
): Promise<UploadImageResult> {
  if (!ALLOWED_IMAGE_MIMES.has(input.contentType)) {
    throw new StorageServiceError(
      "unsupported_mime",
      `unsupported mime: ${input.contentType}`,
    );
  }
  if (input.size > MAX_IMAGE_BYTES) {
    throw new StorageServiceError("size_too_large", "image too large");
  }

  const path = buildObjectPath(input.articleId, input.filename);
  const raw =
    input.buffer instanceof Uint8Array
      ? input.buffer
      : new Uint8Array(input.buffer);
  const body = await optimizeImage(raw);

  const { error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(path, body, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) {
    throw new StorageServiceError("upload_failed", error.message);
  }

  const { data } = supabase.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteArticleImages(articleId: string): Promise<void> {
  const { data: list, error: listError } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .list(articleId, { limit: 1000 });

  if (listError) {
    if (listError.message?.toLowerCase().includes("not found")) return;
    throw new StorageServiceError("upload_failed", listError.message);
  }
  if (!list || list.length === 0) return;

  const paths = list.map((item) => `${articleId}/${item.name}`);
  const { error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .remove(paths);
  if (error) {
    throw new StorageServiceError("upload_failed", error.message);
  }
}
