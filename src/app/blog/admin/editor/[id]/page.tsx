import { notFound } from "next/navigation";
import { getArticleById } from "@/services/blog/articleService";
import { ArticleEditor } from "@/components/blog/admin/ArticleEditor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: RouteParams) {
  const { id } = await params;
  if (id === "new") {
    return <ArticleEditor initial={null} />;
  }
  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }
  return <ArticleEditor initial={article} />;
}
