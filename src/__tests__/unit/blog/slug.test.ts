import { generateSlug, ensureUniqueSlug } from "@/lib/blog/slug";

describe("generateSlug", () => {
  it("ASCII pasa intacto en lowercase con guiones", () => {
    expect(generateSlug("Como ahorrar")).toBe("como-ahorrar");
  });

  it("normaliza acentos a ASCII", () => {
    expect(generateSlug("ahorrá energía")).toBe("ahorra-energia");
  });

  it("normaliza eñes", () => {
    expect(generateSlug("año fiscal mañana")).toBe("ano-fiscal-manana");
  });

  it("colapsa espacios y símbolos consecutivos en un solo guión", () => {
    expect(generateSlug("hola   mundo!!!  ¿cómo estás?")).toBe(
      "hola-mundo-como-estas",
    );
  });

  it("recorta guiones inicial/final", () => {
    expect(generateSlug("---hola---mundo---")).toBe("hola-mundo");
  });

  it("string vacío o sólo símbolos devuelve cadena vacía", () => {
    expect(generateSlug("")).toBe("");
    expect(generateSlug("¡¿!?")).toBe("");
  });

  it("preserva números", () => {
    expect(generateSlug("Top 10 ideas para 2026")).toBe(
      "top-10-ideas-para-2026",
    );
  });
});

describe("ensureUniqueSlug", () => {
  type Row = { id: string };
  function makeSupabase(existingSlugs: string[]) {
    return {
      from() {
        return {
          select() {
            return this;
          },
          eq(_column: string, value: string) {
            this._currentSlug = value;
            return this;
          },
          neq() {
            return this;
          },
          async limit() {
            const exists = existingSlugs.includes(this._currentSlug);
            return {
              data: exists ? [{ id: "x" } as Row] : [],
              error: null,
            };
          },
          _currentSlug: "",
        };
      },
    } as never;
  }

  it("devuelve baseSlug si no existe", async () => {
    const supabase = makeSupabase([]);
    const result = await ensureUniqueSlug(supabase, "como-ahorrar");
    expect(result).toBe("como-ahorrar");
  });

  it("añade -2 si baseSlug existe", async () => {
    const supabase = makeSupabase(["como-ahorrar"]);
    const result = await ensureUniqueSlug(supabase, "como-ahorrar");
    expect(result).toBe("como-ahorrar-2");
  });

  it("encuentra -3 si -2 también existe", async () => {
    const supabase = makeSupabase(["como-ahorrar", "como-ahorrar-2"]);
    const result = await ensureUniqueSlug(supabase, "como-ahorrar");
    expect(result).toBe("como-ahorrar-3");
  });

  it("lanza si baseSlug es vacío", async () => {
    const supabase = makeSupabase([]);
    await expect(ensureUniqueSlug(supabase, "")).rejects.toThrow();
  });
});
