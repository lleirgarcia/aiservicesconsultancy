"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";

/**
 * Menú del header con las secciones de la landing (todas menos el hero).
 *
 * - `section`: bloque que, mientras está bajo la línea de lectura, marca el
 *   item como activo.
 * - `target`: punto al que salta el clic. "Cómo trabajamos" resalta toda la
 *   sección pero salta al primer paso ("Identificamos").
 */
const ITEMS = [
  { key: "header.navProjects", section: "proyectos", target: "proyectos" },
  { key: "header.navHow", section: "como-trabajamos", target: "identificamos" },
  { key: "header.navAbout", section: "quienes-somos", target: "quienes-somos" },
] as const;

const HEADER_OFFSET_PX = 76;

/**
 * Posición absoluta en el documento sumando `offsetTop`: a diferencia de
 * `getBoundingClientRect`, ignora los `transform` de las animaciones de
 * entrada (Rising desplaza el stepper hasta ~280px mientras no está en
 * pantalla), así que el salto cae donde quedará el elemento al llegar.
 */
function docTop(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export default function SectionNav() {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      // Línea de lectura: un tercio de la pantalla por debajo del header.
      const line = HEADER_OFFSET_PX + (window.innerHeight - HEADER_OFFSET_PX) / 3;
      let current: string | null = null;
      for (const item of ITEMS) {
        const el = document.getElementById(item.section);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = item.section;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    // "instant": el scroll suave global compite con las secciones fijadas.
    window.scrollTo({ top: docTop(el) - HEADER_OFFSET_PX, behavior: "instant" });
  };

  return (
    <nav aria-label={t("header.navAria")} className="hidden lg:block">
      <ul className="flex items-center gap-6" style={{ margin: 0, padding: 0, listStyle: "none", marginRight: "0.5rem" }}>
        {ITEMS.map((item) => {
          const on = active === item.section;
          return (
            <li key={item.section}>
              <a
                href={`#${item.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.target);
                }}
                aria-current={on ? "location" : undefined}
                className="text-xs font-medium uppercase tracking-widest transition-colors"
                style={{
                  color: on ? "var(--fg)" : "var(--muted)",
                  fontWeight: on ? 700 : 500,
                  textDecoration: "none",
                  paddingBottom: 4,
                  borderBottom: `2px solid ${on ? "var(--accent)" : "transparent"}`,
                }}
              >
                {t(item.key)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
