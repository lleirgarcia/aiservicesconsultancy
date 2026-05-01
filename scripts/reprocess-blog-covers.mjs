// One-shot: descarga las portadas existentes en blog-images, las re-comprime
// con sharp (máx 1600px, WebP q=80), las re-sube y actualiza articles.cover_image_url.
// Uso:  node scripts/reprocess-blog-covers.mjs
//   add --dry para no escribir, o --keep-old para no borrar el original.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const KEEP_OLD = args.has("--keep-old");

const env = (() => {
  const out = { ...process.env };
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !out[m[1]]) out[m[1]] = m[2];
    }
  } catch {}
  return out;
})();

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const BUCKET = "blog-images";
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
const supa = createClient(SUPABASE_URL, SERVICE_KEY);

function pathFromUrl(url) {
  if (!url?.startsWith(PUBLIC_PREFIX)) return null;
  return url.slice(PUBLIC_PREFIX.length).replace(/\?.*$/, "");
}

async function reprocessOne({ id, slug, url }) {
  const oldPath = pathFromUrl(url);
  if (!oldPath) {
    console.log(`  [skip] ${slug}: URL no es del bucket`);
    return null;
  }
  const oldBytes = (await fetch(url).then((r) => r.arrayBuffer())).byteLength;

  const { data: blob, error: dlErr } = await supa.storage
    .from(BUCKET)
    .download(oldPath);
  if (dlErr) throw new Error(`download: ${dlErr.message}`);
  const inputBuf = Buffer.from(await blob.arrayBuffer());

  const optimized = await sharp(inputBuf)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const articleId = oldPath.split("/")[0];
  const baseName = (oldPath.split("/")[1] ?? "image").replace(/\.[^.]+$/, "");
  const newPath = `${articleId}/${Date.now()}-${baseName}.webp`;

  console.log(
    `  ${slug}: ${(oldBytes / 1024).toFixed(0)} KB → ${(optimized.length / 1024).toFixed(0)} KB (-${
      (((oldBytes - optimized.length) / oldBytes) * 100).toFixed(0)
    }%)`,
  );

  if (DRY) return { id, oldPath, newPath, savedBytes: oldBytes - optimized.length };

  const { error: upErr } = await supa.storage
    .from(BUCKET)
    .upload(newPath, optimized, { contentType: "image/webp", upsert: false });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(newPath);

  const { error: updErr } = await supa
    .from("articles")
    .update({ cover_image_url: pub.publicUrl })
    .eq("id", id);
  if (updErr) throw new Error(`update articles: ${updErr.message}`);

  if (!KEEP_OLD) {
    const { error: rmErr } = await supa.storage.from(BUCKET).remove([oldPath]);
    if (rmErr) console.warn(`    warn: no pude borrar ${oldPath}: ${rmErr.message}`);
  }

  return { id, oldPath, newPath, savedBytes: oldBytes - optimized.length };
}

async function main() {
  const { data: articles, error } = await supa
    .from("articles")
    .select("id, slug, cover_image_url")
    .not("cover_image_url", "is", null);
  if (error) throw error;

  console.log(`Encontrados ${articles.length} artículos con portada.${DRY ? " (DRY RUN)" : ""}`);
  let totalSaved = 0;
  for (const a of articles) {
    try {
      const res = await reprocessOne({ id: a.id, slug: a.slug, url: a.cover_image_url });
      if (res) totalSaved += res.savedBytes;
    } catch (err) {
      console.error(`  [error] ${a.slug}: ${err.message}`);
    }
  }
  console.log(`\nTotal ahorrado: ${(totalSaved / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
