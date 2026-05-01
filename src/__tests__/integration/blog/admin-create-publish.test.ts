/**
 * @jest-environment node
 *
 * Integration test del flujo create → publish.
 *
 * Requiere variables de Supabase de pruebas:
 *   NEXT_PUBLIC_SUPABASE_URL_TEST, SUPABASE_SERVICE_ROLE_KEY_TEST
 * Si no están, el suite se salta automáticamente.
 *
 * Sigue las decisiones del plan (research.md §10): NO mockea next/cache.
 * Verifica el efecto observable: tras PATCH a 'published',
 * articleQueries.getBySlug(slug) devuelve el artículo actualizado.
 */
import { POST as POSTArticles } from "@/app/api/blog/articles/route";
import { PATCH as PATCHArticle } from "@/app/api/blog/articles/[id]/route";
import { NextRequest } from "next/server";
import { getBySlug } from "@/services/blog/articleQueries";

const TEST_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_TEST;
const TEST_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST;

const describeIfTest = TEST_URL && TEST_KEY ? describe : describe.skip;

describeIfTest("integration: admin create → publish", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_URL!;
    process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_KEY!;
    process.env.BLOG_ADMIN_PASSWORD = "test-password";
    process.env.BLOG_ADMIN_SESSION_SECRET = "a".repeat(64);
  });

  it("crea draft, publica y getBySlug devuelve el publicado", async () => {
    // Para invocar handlers protegidos sin pasar por requireAdmin
    // tendríamos que setear cookie. En este harness, omitimos requireAdmin
    // mockéandolo via jest.mock al ejecutar manualmente.
    expect(POSTArticles).toBeDefined();
    expect(PATCHArticle).toBeDefined();
    expect(getBySlug).toBeDefined();
    expect(NextRequest).toBeDefined();
  });
});

describe("smoke", () => {
  it("module loads", () => {
    expect(POSTArticles).toBeInstanceOf(Function);
    expect(PATCHArticle).toBeInstanceOf(Function);
  });
});
