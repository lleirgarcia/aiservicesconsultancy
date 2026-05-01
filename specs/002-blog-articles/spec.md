# Feature Specification: Blog de artículos

**Feature Branch**: `002-blog-articles`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "quiero un apartado de blog donde pueda crear entradas de articulos manteniendo el estilo de la app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar un artículo nuevo (Priority: P1)

El propietario del negocio quiere captar empresas de Osona publicando contenido sobre ahorro y digitalización. Accede a la zona privada del blog, redacta un artículo (título, resumen, cuerpo en formato enriquecido y portada), lo previsualiza con la estética de la app (Stitch dark, acento `#89ceff`, tipografías Space Grotesk e Inter) y lo publica. Inmediatamente queda accesible en la URL pública del blog.

**Why this priority**: Sin la capacidad de crear y publicar al menos un artículo, no existe el blog. Es el corazón del MVP.

**Independent Test**: Se puede validar entrando en la zona privada, creando un artículo con todos sus campos, publicándolo y verificando que aparece en el listado público y en su URL canónica con el estilo de la app aplicado.

**Acceptance Scenarios**:

1. **Given** el autor está autenticado en la zona privada, **When** crea un artículo con título, resumen, contenido y portada y pulsa "Publicar", **Then** el artículo se guarda con estado publicado y queda accesible en `/blog/<slug>`.
2. **Given** el autor está redactando, **When** pulsa "Vista previa", **Then** ve el artículo renderizado con la paleta Stitch, Space Grotesk para títulos e Inter para cuerpo, sin tener que publicarlo.
3. **Given** el autor introduce un título, **When** no edita el slug manualmente, **Then** el sistema genera un slug único legible derivado del título.
4. **Given** el autor guarda como borrador, **When** vuelve más tarde, **Then** recupera el contenido tal cual lo dejó y puede continuar la edición.
5. **Given** un artículo está publicado, **When** un visitante anónimo accede a `/blog/<slug>`, **Then** ve el contenido renderizado con el estilo de la app y los metadatos (título, descripción, imagen) correctos para compartir.

---

### User Story 2 - Listado público del blog (Priority: P1)

Un visitante llega a `/blog` desde la home o desde una búsqueda y ve un listado de artículos publicados, ordenados por fecha de publicación descendente, con tarjetas que muestran portada, título, resumen, fecha y tiempo estimado de lectura. Al hacer clic accede al artículo completo.

**Why this priority**: Sin un punto de entrada público, los artículos no se descubren. Es imprescindible para el objetivo de marketing de contenidos.

**Independent Test**: Publicar dos artículos y comprobar que `/blog` los muestra en orden por fecha, con sus metadatos visibles, y que el clic lleva a la URL del artículo.

**Acceptance Scenarios**:

1. **Given** existen artículos publicados, **When** un visitante entra en `/blog`, **Then** ve las tarjetas ordenadas por fecha descendente con portada, título, resumen, fecha y tiempo de lectura.
2. **Given** no existe ningún artículo publicado, **When** un visitante entra en `/blog`, **Then** ve un estado vacío informativo con la estética de la app.
3. **Given** existen más artículos que el tamaño de página, **When** el visitante llega al final, **Then** puede cargar más artículos (paginación o "ver más").
4. **Given** el visitante está en una tarjeta, **When** hace clic en ella, **Then** navega a `/blog/<slug>` del artículo correspondiente.

---

### User Story 3 - Editar y despublicar artículos existentes (Priority: P2)

El autor detecta una errata en un artículo publicado o quiere retirarlo temporalmente. Desde la zona privada localiza el artículo, edita su contenido o cambia su estado a borrador, y los cambios quedan reflejados en la zona pública.

**Why this priority**: Mantener el contenido correcto es importante, pero el blog ya entrega valor sin esta capacidad si los artículos se redactan bien la primera vez.

**Independent Test**: Editar el título y cuerpo de un artículo publicado y comprobar que los cambios aparecen en la URL pública. Despublicar un artículo y verificar que devuelve 404 y desaparece del listado.

**Acceptance Scenarios**:

1. **Given** un artículo está publicado, **When** el autor lo edita y guarda, **Then** los cambios se reflejan en la zona pública sin cambiar la URL.
2. **Given** un artículo está publicado, **When** el autor lo despublica, **Then** desaparece del listado público y su URL devuelve 404.
3. **Given** un artículo es borrador, **When** el autor lo elimina, **Then** desaparece de la zona privada y no se ve afectado nada público.

---

### User Story 4 - Organización por etiquetas (Priority: P3)

El autor asigna una o varias etiquetas a cada artículo (por ejemplo `ahorro`, `digitalización`, `casos-de-éxito`). El visitante puede filtrar el listado por etiqueta.

**Why this priority**: Mejora el descubrimiento cuando el blog crece, pero no aporta valor con pocos artículos.

**Independent Test**: Crear tres artículos con etiquetas distintas y comprobar que `/blog?tag=<nombre>` muestra solo los artículos con esa etiqueta y que las etiquetas son clicables desde la tarjeta y desde el detalle.

**Acceptance Scenarios**:

1. **Given** el autor edita un artículo, **When** introduce etiquetas, **Then** quedan asociadas y visibles en el detalle público.
2. **Given** un visitante hace clic en una etiqueta, **When** el listado se carga, **Then** solo aparecen artículos publicados con esa etiqueta.

---

### Edge Cases

- Dos artículos con el mismo título: el sistema garantiza unicidad del slug añadiendo un sufijo si es necesario.
- Imágenes de portada con relación de aspecto inusual: las tarjetas las recortan a una proporción consistente sin distorsión.
- Contenido muy largo: el detalle del artículo mantiene una columna legible (medida de línea ~65–75 caracteres) y el tiempo de lectura se calcula en función del recuento de palabras.
- Acceso a `/blog/<slug>` inexistente o despublicado: devuelve 404 con la estética de la app.
- Acceso no autenticado a la zona privada de redacción: redirige al login.
- Pérdida de conexión durante la redacción: los borradores se guardan automáticamente cada cierto intervalo y al pulsar "Guardar borrador", para minimizar pérdida.
- Caracteres con acentos o eñes en el título: el slug los normaliza correctamente (`ahorrá-energía` → `ahorra-energia`).

## Requirements *(mandatory)*

### Functional Requirements

**Autoría y administración**

- **FR-001**: La aplicación DEBE ofrecer una zona privada (`/blog/admin` o equivalente) accesible solo a usuarios autenticados, donde se pueden listar, crear, editar, publicar, despublicar y eliminar artículos.
- **FR-002**: Solo los usuarios autorizados PUEDEN acceder a la zona privada; cualquier acceso no autenticado DEBE redirigir al flujo de login.
- **FR-003**: El autor DEBE poder guardar un artículo como borrador sin publicarlo y volver a editarlo más tarde.
- **FR-004**: El autor DEBE poder previsualizar un artículo con la estética final antes de publicarlo.

**Modelo de artículo**

- **FR-005**: Cada artículo DEBE tener: título, slug único, resumen, contenido enriquecido (formato markdown), imagen de portada, etiquetas (cero o más), estado (borrador o publicado), fecha de creación, fecha de actualización y fecha de publicación.
- **FR-006**: El sistema DEBE generar automáticamente el slug a partir del título normalizando acentos y signos, y DEBE garantizar su unicidad.
- **FR-007**: El sistema DEBE calcular el tiempo de lectura estimado a partir del recuento de palabras del contenido.

**Renderizado público**

- **FR-008**: El listado público en `/blog` DEBE mostrar únicamente artículos publicados, ordenados por fecha de publicación descendente.
- **FR-009**: Cada tarjeta del listado DEBE mostrar portada, título, resumen, fecha y tiempo de lectura.
- **FR-010**: El detalle público en `/blog/<slug>` DEBE renderizar el contenido del artículo con tipografía y paleta consistentes con el resto de la app.
- **FR-011**: Los artículos publicados DEBEN exponer metadatos para compartir (título, descripción, imagen) y DEBEN ser indexables por motores de búsqueda; los borradores y los despublicados NO DEBEN serlo.
- **FR-012**: El blog DEBE ofrecer paginación o carga incremental cuando el número de artículos publicados supere el tamaño de página.

**Estilo y consistencia visual**

- **FR-013**: Todas las pantallas del blog (listado, detalle, zona privada) DEBEN usar la paleta Stitch (fondo oscuro, acento `#89ceff`, bordes y foreground definidos) ya presente en la app.
- **FR-014**: Los títulos DEBEN renderizarse con Space Grotesk y el cuerpo con Inter, manteniendo la jerarquía tipográfica del resto de la app.
- **FR-015**: El blog DEBE integrarse en la navegación global de la app de modo que sea accesible desde la home u otra ubicación visible.

**Etiquetas (P3)**

- **FR-016**: El autor DEBE poder asignar etiquetas a un artículo desde el editor.
- **FR-017**: El listado público DEBE poder filtrarse por etiqueta vía parámetro de URL.

### Key Entities

- **Article**: representa una entrada del blog. Atributos: `id`, `slug`, `title`, `summary`, `content` (markdown), `coverImageUrl`, `tags` (lista), `status` (`draft` | `published`), `createdAt`, `updatedAt`, `publishedAt`, `authorId`.
- **Author**: usuario con permiso para crear y editar artículos. Atributos mínimos: `id`, `displayName`. En el MVP existe un único autor (el propietario).
- **Tag**: etiqueta libre asociada a uno o varios artículos. Atributos: `slug`, `label`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El autor puede publicar un artículo nuevo de extensión media (~800 palabras con portada y dos imágenes) en menos de 10 minutos desde que entra en la zona privada.
- **SC-002**: El 100% de los artículos publicados se renderizan con la paleta Stitch y las tipografías Space Grotesk/Inter, sin estilos por defecto del navegador visibles, validado por revisión visual contra el resto de la app.
- **SC-003**: La carga inicial del listado `/blog` con 10 artículos completa por debajo de 2 segundos en una conexión 4G estándar.
- **SC-004**: El 95% de los artículos publicados tienen título, resumen y portada (campos imprescindibles para que la tarjeta del listado sea presentable).
- **SC-005**: Los buscadores indexan correctamente los artículos publicados (presentes en `sitemap.xml` o equivalente) y excluyen los borradores y despublicados.
- **SC-006**: El propietario consigue publicar al menos 1 artículo a la semana durante el primer trimestre tras el lanzamiento, evidencia de que la herramienta no introduce fricción.

## Assumptions

- Existe un único autor (el propietario del negocio). La autenticación de la zona privada se resuelve con el sistema de auth de Supabase ya disponible en el stack o, si no se ha activado aún, con un acceso por contraseña configurada por variable de entorno; la elección concreta se decide en `/speckit-plan`.
- El contenido se redacta en markdown, aprovechando que `react-markdown` y `remark-gfm` ya están en el proyecto. No se incluye un editor WYSIWYG en el MVP.
- La persistencia se hace contra Supabase, ya presente en las dependencias del proyecto. El almacenamiento de imágenes (portadas e inline) usa Supabase Storage o un equivalente accesible públicamente.
- El blog es público y orientado a marketing de contenidos para captar empresas de Osona; tiene SEO básico (metadatos, sitemap, URLs limpias).
- Los comentarios, suscripciones por email, RSS y compartir en redes sociales quedan fuera del MVP; se pueden añadir en iteraciones posteriores.
- El idioma por defecto del blog es español. La internacionalización del contenido queda fuera del alcance del MVP.
- El slug es la URL canónica del artículo y no debe cambiar tras la publicación para no romper enlaces.
- La navegación global ya existente en la app dispone de un sitio razonable donde añadir un enlace a `/blog`.
- En el MVP las etiquetas (`Tag`) se almacenan como strings normalizados dentro del propio artículo, sin tabla maestra de etiquetas (decisión técnica del plan). Si en el futuro las etiquetas necesitan atributos propios (descripción, color, página dedicada con copy editorial), se migrarán a una tabla separada.
