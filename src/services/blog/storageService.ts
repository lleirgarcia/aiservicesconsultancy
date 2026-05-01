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

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

function buildObjectPath(articleId: string, filename: string, mime: string) {
  const base = generateSlug(filename.replace(/\.[^.]+$/, "")) || "image";
  const ext = extFromMime(mime);
  const ts = Date.now();
  return `${articleId}/${ts}-${base}.${ext}`;
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

  const path = buildObjectPath(input.articleId, input.filename, input.contentType);
  const body =
    input.buffer instanceof Uint8Array
      ? input.buffer
      : new Uint8Array(input.buffer);

  const { error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(path, body, {
      contentType: input.contentType,
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
