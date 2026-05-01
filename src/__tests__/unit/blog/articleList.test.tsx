/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ArticleList } from "@/components/blog/ArticleList";
import { ArticleListItem } from "@/types/blog";

function makeItems(count: number): ArticleListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    slug: `articulo-${i}`,
    title: `Artículo ${i}`,
    summary: `Resumen ${i}`,
    coverImageUrl: null,
    tags: [],
    readingTimeMinutes: 1,
    publishedAt: new Date(2026, 3, 30 - i).toISOString(),
  }));
}

describe("<ArticleList>", () => {
  it("renderiza una tarjeta por item", () => {
    render(<ArticleList items={makeItems(3)} page={1} totalPages={1} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("muestra paginación cuando totalPages > 1", () => {
    render(<ArticleList items={makeItems(10)} page={1} totalPages={3} />);
    expect(screen.getByText(/Página 1 \/ 3/i)).toBeTruthy();
    const next = screen.getByText(/Cargar más|Load more|Carregar més/i);
    expect(next.closest("a")?.getAttribute("href")).toBe("/blog?page=2");
  });

  it("oculta paginación si totalPages == 1", () => {
    render(<ArticleList items={makeItems(2)} page={1} totalPages={1} />);
    expect(screen.queryByText(/Página/i)).toBeNull();
  });

  it("link 'anterior' va a /blog cuando page-1 == 1", () => {
    render(<ArticleList items={makeItems(10)} page={2} totalPages={3} />);
    const prev = screen.getByText(/anterior/i);
    expect(prev.closest("a")?.getAttribute("href")).toBe("/blog");
  });
});
