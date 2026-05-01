"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Article } from "@/types/blog";
import { useArticleEditor } from "@/hooks/blog/useArticleEditor";
import { generateSlug } from "@/lib/blog/slug";
import { dictionaries, defaultLocale } from "@/i18n/dict";
import { CoverUploader } from "./CoverUploader";
import { PublishBar } from "./PublishBar";
import { markdownComponents } from "@/components/blog/markdown/components";
import { ArticleMeta } from "@/components/blog/ArticleMeta";

interface ArticleEditorProps {
  initial: Article | null;
}

export function ArticleEditor({ initial }: ArticleEditorProps) {
  const t = dictionaries[defaultLocale].blog.editor;
  const router = useRouter();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const {
    draft,
    article,
    setField,
    isNew,
    isDirty,
    isSaving,
    errorMessage,
    canPublish,
    saveDraft,
    publish,
    unpublish,
    status,
  } = useArticleEditor({
    initial,
    onCreated: (created) => {
      router.replace(`/blog/admin/editor/${created.id}`);
    },
  });

  const slugLocked = article !== null && article.publishedAt !== null;

  function handleTitleChange(value: string) {
    setField("title", value);
    if (!slugLocked && (!draft.slug || draft.slug === generateSlug(draft.title))) {
      setField("slug", generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setField("slug", generateSlug(value));
  }

  async function handleUnpublish() {
    if (!window.confirm(t.confirms.unpublish)) return;
    await unpublish();
  }

  async function handlePublish() {
    await publish();
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-[var(--fg)]">
          {isNew ? t.newTitle : t.editTitle}
        </h1>
        <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
          {status === "published" ? "Publicado" : "Borrador"}
          {isDirty ? " · sin guardar" : ""}
        </span>
      </div>

      <div className={`grid ${isPreviewing ? "" : "lg:grid-cols-2 gap-8"}`}>
        {!isPreviewing ? (
          <div className="space-y-6">
            <Field label={t.fields.title}>
              <input
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título del artículo"
                maxLength={200}
              />
            </Field>

            <Field label={t.fields.slug} hint={slugLocked ? t.hints.slugLocked : undefined}>
              <input
                value={draft.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={slugLocked}
                placeholder="como-ahorrar-energia"
              />
            </Field>

            <Field label={t.fields.summary}>
              <textarea
                value={draft.summary}
                onChange={(e) => setField("summary", e.target.value)}
                rows={3}
                placeholder="Resumen breve para la tarjeta del listado"
                maxLength={400}
              />
            </Field>

            <Field label={t.fields.content}>
              <textarea
                value={draft.contentMd}
                onChange={(e) => setField("contentMd", e.target.value)}
                rows={20}
                placeholder="# Encabezado&#10;&#10;Tu contenido en markdown…"
                className="font-mono text-sm"
              />
            </Field>

            <CoverUploader
              articleId={article?.id ?? null}
              value={draft.coverImageUrl}
              onChange={(url) => setField("coverImageUrl", url)}
            />
          </div>
        ) : null}

        <div className={isPreviewing ? "" : "hidden lg:block"}>
          <PreviewPane
            article={article}
            draft={draft}
          />
        </div>
      </div>

      <PublishBar
        status={status}
        isNew={isNew}
        isDirty={isDirty}
        isSaving={isSaving}
        isPreviewing={isPreviewing}
        errorMessage={errorMessage}
        canPublish={canPublish}
        onSaveDraft={() => void saveDraft()}
        onTogglePreview={() => setIsPreviewing((v) => !v)}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-[var(--muted)] mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

interface PreviewProps {
  article: Article | null;
  draft: {
    title: string;
    summary: string;
    contentMd: string;
    coverImageUrl: string | null;
    tags: string[];
  };
}

function PreviewPane({ article, draft }: PreviewProps) {
  return (
    <div className="border border-[var(--border)] rounded p-6 bg-[var(--bg-soft)]/30 min-h-[400px]">
      {draft.title ? (
        <h1 className="font-headline text-3xl text-[var(--fg)] mb-4 leading-tight">
          {draft.title}
        </h1>
      ) : (
        <p className="text-[var(--muted)] italic mb-4">Sin título</p>
      )}
      {draft.summary ? (
        <p className="text-[var(--muted-hi)] mb-6">{draft.summary}</p>
      ) : null}
      <ArticleMeta
        publishedAt={article?.publishedAt ?? new Date().toISOString()}
        readingTimeMinutes={article?.readingTimeMinutes ?? 1}
        tags={draft.tags}
        showTags
        className="mb-6"
      />
      {draft.coverImageUrl ? (
        <img
          src={draft.coverImageUrl}
          alt={draft.title}
          className="w-full aspect-[16/9] object-cover rounded border border-[var(--border)] mb-8"
        />
      ) : null}
      {draft.contentMd ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {draft.contentMd}
        </ReactMarkdown>
      ) : (
        <p className="text-[var(--muted)] italic">Sin contenido</p>
      )}
    </div>
  );
}
