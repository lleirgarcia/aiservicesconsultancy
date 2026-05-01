import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/requireAdmin";
import { getArticleById } from "@/services/blog/articleService";
import {
  StorageServiceError,
  uploadImage,
} from "@/services/blog/storageService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_file", reason: "missing_form" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const articleId = form.get("articleId");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "invalid_file", reason: "missing_file" },
      { status: 400 },
    );
  }
  if (typeof articleId !== "string" || !articleId) {
    return NextResponse.json(
      { error: "invalid_file", reason: "missing_articleId" },
      { status: 400 },
    );
  }

  try {
    const article = await getArticleById(articleId);
    if (!article) {
      return NextResponse.json(
        { error: "article_not_found" },
        { status: 404 },
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await uploadImage({
      articleId,
      filename: file.name,
      contentType: file.type,
      buffer,
      size: file.size,
    });

    return NextResponse.json({ url: result.publicUrl, path: result.path });
  } catch (err) {
    if (err instanceof StorageServiceError) {
      const reason =
        err.code === "size_too_large"
          ? "size_too_large"
          : err.code === "unsupported_mime"
            ? "unsupported_mime"
            : "upload_failed";
      const status = err.code === "upload_failed" ? 500 : 400;
      return NextResponse.json(
        { error: "invalid_file", reason },
        { status },
      );
    }
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
