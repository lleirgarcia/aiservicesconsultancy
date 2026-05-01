"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Article, ArticleStatus, UpdateArticleInput } from "@/types/blog";

const AUTOSAVE_INTERVAL_MS = 15_000;

interface EditorDraft {
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  coverImageUrl: string | null;
  tags: string[];
}

export interface UseArticleEditorOptions {
  initial: Article | null;
  onCreated?: (article: Article) => void;
}

export interface UseArticleEditor {
  draft: EditorDraft;
  article: Article | null;
  setField: <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => void;
  setTags: (tags: string[]) => void;
  isNew: boolean;
  isDirty: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  canPublish: boolean;
  saveDraft: () => Promise<Article | null>;
  publish: () => Promise<Article | null>;
  unpublish: () => Promise<Article | null>;
  status: ArticleStatus;
}

const EMPTY_DRAFT: EditorDraft = {
  title: "",
  slug: "",
  summary: "",
  contentMd: "",
  coverImageUrl: null,
  tags: [],
};

function articleToDraft(article: Article): EditorDraft {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    contentMd: article.contentMd,
    coverImageUrl: article.coverImageUrl,
    tags: article.tags,
  };
}

function draftsEqual(a: EditorDraft, b: EditorDraft): boolean {
  return (
    a.title === b.title &&
    a.slug === b.slug &&
    a.summary === b.summary &&
    a.contentMd === b.contentMd &&
    a.coverImageUrl === b.coverImageUrl &&
    a.tags.length === b.tags.length &&
    a.tags.every((t, i) => t === b.tags[i])
  );
}

export function useArticleEditor({
  initial,
  onCreated,
}: UseArticleEditorOptions): UseArticleEditor {
  const [article, setArticle] = useState<Article | null>(initial);
  const [draft, setDraft] = useState<EditorDraft>(
    initial ? articleToDraft(initial) : EMPTY_DRAFT,
  );
  const [savedDraft, setSavedDraft] = useState<EditorDraft>(
    initial ? articleToDraft(initial) : EMPTY_DRAFT,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const status: ArticleStatus = article?.status ?? "draft";
  const isNew = article === null;
  const isDirty = !draftsEqual(draft, savedDraft);

  const canPublish =
    !!draft.title.trim() &&
    !!draft.summary.trim() &&
    !!draft.contentMd.trim() &&
    !!draft.coverImageUrl;

  const setField: UseArticleEditor["setField"] = useCallback(
    (key, value) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setTags = useCallback((tags: string[]) => {
    setDraft((prev) => ({ ...prev, tags }));
  }, []);

  const performSave = useCallback(
    async (overrides: Partial<UpdateArticleInput> = {}): Promise<Article | null> => {
      setIsSaving(true);
      setErrorMessage(null);
      try {
        if (article === null) {
          const res = await fetch("/api/blog/articles", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: draft.title,
              summary: draft.summary,
              contentMd: draft.contentMd,
              tags: draft.tags,
              status: "draft",
              slug: draft.slug || undefined,
              ...overrides,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            setErrorMessage(json.error ?? "save_failed");
            return null;
          }
          const created: Article = json.article;
          setArticle(created);
          const newDraft = articleToDraft(created);
          setDraft(newDraft);
          setSavedDraft(newDraft);
          onCreated?.(created);
          return created;
        }

        const payload: UpdateArticleInput = {
          title: draft.title,
          summary: draft.summary,
          contentMd: draft.contentMd,
          tags: draft.tags,
          coverImageUrl: draft.coverImageUrl,
          ...overrides,
        };
        if (article.publishedAt === null && draft.slug !== article.slug) {
          payload.slug = draft.slug;
        }
        const res = await fetch(`/api/blog/articles/${article.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMessage(json.error ?? "save_failed");
          return null;
        }
        const updated: Article = json.article;
        setArticle(updated);
        const newDraft = articleToDraft(updated);
        setDraft(newDraft);
        setSavedDraft(newDraft);
        return updated;
      } catch (err) {
        setErrorMessage((err as Error).message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [article, draft, onCreated],
  );

  const saveDraft = useCallback(
    () => performSave({ status: "draft" }),
    [performSave],
  );

  const publish = useCallback(
    () => performSave({ status: "published" }),
    [performSave],
  );

  const unpublish = useCallback(
    () => performSave({ status: "draft" }),
    [performSave],
  );

  const lastAutosaveRef = useRef(0);
  useEffect(() => {
    if (article === null) return;
    if (!isDirty) return;
    const handle = window.setInterval(() => {
      if (Date.now() - lastAutosaveRef.current < AUTOSAVE_INTERVAL_MS) return;
      lastAutosaveRef.current = Date.now();
      void saveDraft();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [article, isDirty, saveDraft]);

  return {
    draft,
    article,
    setField,
    setTags,
    isNew,
    isDirty,
    isSaving,
    errorMessage,
    canPublish,
    saveDraft,
    publish,
    unpublish,
    status,
  };
}
