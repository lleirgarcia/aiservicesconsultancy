import { calculateReadingTime } from "@/lib/blog/readingTime";

describe("calculateReadingTime", () => {
  it("vacío devuelve 1 minuto", () => {
    expect(calculateReadingTime("")).toBe(1);
    expect(calculateReadingTime("   ")).toBe(1);
  });

  it("220 palabras = 1 minuto", () => {
    const md = Array.from({ length: 220 }, () => "palabra").join(" ");
    expect(calculateReadingTime(md)).toBe(1);
  });

  it("1500 palabras = 7 minutos (ceil)", () => {
    const md = Array.from({ length: 1500 }, () => "palabra").join(" ");
    expect(calculateReadingTime(md)).toBe(7);
  });

  it("ignora bloques de código fenced", () => {
    const md = [
      "Solo cinco palabras visibles aqui.",
      "```js",
      Array.from({ length: 500 }, () => "ruido").join(" "),
      "```",
    ].join("\n");
    expect(calculateReadingTime(md)).toBe(1);
  });

  it("ignora URLs absolutas", () => {
    const md = `Lee https://example.com/${Array.from({ length: 200 }, () => "x").join("")} ahora`;
    expect(calculateReadingTime(md)).toBe(1);
  });

  it("conserva el texto del enlace pero descarta la URL", () => {
    const md = "[texto del enlace](https://example.com/larga-ruta-que-no-cuenta)";
    expect(calculateReadingTime(md)).toBe(1);
  });

  it("mínimo 1 incluso con muy pocas palabras", () => {
    expect(calculateReadingTime("Una sola palabra")).toBe(1);
  });
});
