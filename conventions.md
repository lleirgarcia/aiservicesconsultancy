# Convenciones del proyecto — Kroomix

## Objetivo

Las apps creadas bajo este proyecto sirven para vender los servicios de **Kroomix** a pequeñas y medianas empresas industriales, de distribución y logística (mercado principal: Osona, Barcelona).

La propuesta de valor es:
- Reducir trabajo manual mediante automatización de procesos digitales
- Conectar sistemas que no se comunican entre sí
- Añadir inteligencia (IA) a procesos repetitivos
- Clarificar y medir la operativa digital en términos de tiempo y dinero recuperados

Toda app creada bajo esta convención debe reforzar este mensaje: **la claridad ahorra tiempo y dinero**.

---

## Paleta de colores

Sistema de diseño: **Architectural Futurism** (dark mode único).

```css
--bg:           #101415   /* Fondo principal — casi negro */
--bg-soft:      #191c1e   /* Fondo alternativo suave */
--bg-section:   #1d2022   /* Fondo de secciones alternas */
--bg-elevated:  #272a2c   /* Tarjetas y elementos elevados */

--fg:           #e0e3e5   /* Texto principal */
--muted:        #909097   /* Texto secundario */
--muted-hi:     #c6c6cd   /* Texto intermedio */

--border:       #45464d   /* Líneas divisorias */
--border-hi:    #323537   /* Bordes de menor peso */

--accent:       #89ceff               /* Azul claro — énfasis, etiquetas, bordes activos */
--accent-dim:   rgba(137,206,255,0.12) /* Accent con transparencia (fondos sutiles) */
--accent-on:    #00344d               /* Texto sobre fondo accent */

--glass-bg:     rgba(29,32,34,0.65)          /* Paneles con glassmorphism */
--glass-border: rgba(137,206,255,0.07)       /* Borde sutil en paneles glass */
```

### Uso del color

| Elemento | Variable |
|---|---|
| Fondo de página | `--bg` |
| Secciones alternas | `--bg-section` |
| Tarjetas / modales | `--bg-elevated` |
| Texto principal | `--fg` |
| Texto de apoyo | `--muted` |
| Etiquetas, subtítulos en caps | `--accent` |
| Bordes divisorios | `--border` |
| Botones, highlights, links | `--accent` |

---

## Tipografía

| Uso | Fuente | Variable CSS |
|---|---|---|
| Títulos y headings | Space Grotesk | `--font-space-grotesk` |
| Cuerpo de texto | Inter | `--font-inter` |
| Datos, números, código | Geist Mono | `--font-geist-mono` |
| Fallback general | Geist Sans | `--font-geist-sans` |

### Estilos de texto

```css
/* Cuerpo base */
font-size: 15px;
line-height: 1.6;
font-family: var(--font-inter), system-ui, sans-serif;

/* Títulos de sección (h2) */
font-family: var(--font-space-grotesk);
font-size: clamp(1.8rem, 4vw, 3rem);
font-weight: 700;
letter-spacing: -0.02em;
line-height: 1.1;
color: var(--fg);

/* Título principal (h1 / hero) */
font-size: clamp(1.85rem, 5.2vw + 0.5rem, 5.5rem);
font-weight: 700;
letter-spacing: -0.025em;
line-height: 1.04;

/* Etiquetas / subtítulos en caps */
font-size: 0.75rem (text-xs);
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.1em (tracking-widest);
color: var(--accent);

/* Números grandes */
font-family: var(--font-geist-mono);
font-size: clamp(1.5rem, 3vw, 2.25rem);
font-weight: 700;
letter-spacing: -0.02em;
```

---

## Estilos y componentes reutilizables

### SectionHeader
Bloque estándar de cabecera de sección: barra vertical `--accent` a la izquierda del título + subtítulo en caps.

```tsx
<SectionHeader title="Título de sección" subtitle="ETIQUETA" />
```

### Clases CSS globales

| Clase | Descripción |
|---|---|
| `.font-headline` | Aplica Space Grotesk con `letter-spacing: -0.02em` |
| `.glass-panel` | Fondo glass con blur y borde sutil |
| `.electric-glow` | Box-shadow azul suave |
| `.electric-border` | Borde `--accent` con glow |
| `.kw` | Marcador tipo rotulador sobre texto (highlight sutil en `--accent`) |
| `.label-accent` | Etiqueta con borde izquierdo `--accent` |
| `.section-accent-left` | Borde izquierdo absoluto `--accent` en contenedor |
| `.section-rule` | `<hr>` con `--border` |
| `.big-number` | Número grande en Geist Mono |
| `.blinking-cursor` | Cursor parpadeante estilo editor |

### Radios y bordes

- Tarjetas y modales: `border-radius: 2px` (casi cuadrado — estética arquitectónica)
- Botones CTA principales: `border-radius: 10px`
- Inputs: `border-radius: 4px`

### Espaciado

- Ancho máximo de contenido: `max-w-[1280px]`
- Padding horizontal: `px-6 sm:px-8`
- Padding vertical de sección: `py-12 sm:py-16 lg:py-20`
- Padding de cabecera de sección: `py-8 sm:py-10`

---

## Tono visual general

- Dark mode exclusivo. No existe modo claro.
- Fondo casi negro con jerarquía de grises muy controlada.
- El azul claro (`--accent: #89ceff`) es el único color de énfasis.
- Estética sobria, técnica, sin gradientes llamativos ni colores secundarios.
- Animaciones discretas: float suave, fade-in al scroll, glow pulsante. Siempre con `prefers-reduced-motion`.
