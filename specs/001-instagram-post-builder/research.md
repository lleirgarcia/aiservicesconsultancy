# Research Phase: Instagram Post Builder

**Scope**: Validate technical approach for drag-and-drop canvas builder with Stitch integration
**Status**: Complete

## Key Decisions

### 1. Canvas Rendering Technology

**Decision**: HTML5 Canvas 2D Context + SVG for element outlines

**Rationale**: 
- HTML5 Canvas provides pixel-perfect control for 1080x1080 image export
- Canvas 2D context has excellent browser support (Chrome, Firefox, Safari, Edge)
- Rendering performance is optimized for real-time preview (<50ms updates)
- Export to PNG/JPG via `canvas.toBlob()` is native and doesn't require external libraries

**Alternatives Considered**:
- SVG-only approach: More semantic but SVG-to-PNG export requires `canvg` library and adds dependency
- Fabric.js: Powerful but adds 150KB bundle; overkill for template builder scope
- Konva.js: Similar to Fabric, adds complexity without proportional value

**Selected**: HTML5 Canvas 2D + native Canvas → Blob export

---

### 2. Drag-and-Drop Implementation

**Decision**: HTML5 Drag and Drop API + React event handlers (not third-party library)

**Rationale**:
- HTML5 Drag and Drop is native API with excellent browser support
- No additional dependency; React event handling is straightforward
- Custom implementation provides full control over drag state, constraints, and visual feedback
- Latency requirement (<100ms) is achievable with native API + debounced canvas redraw

**Alternatives Considered**:
- React DnD: Complex, designed for dashboard-style rearrangement; overkill for canvas positioning
- react-beautiful-dnd: Excellent library but designed for lists, not freeform canvas positioning
- Custom mouse event handlers: Possible but lacks accessibility (keyboard, touch)

**Selected**: HTML5 Drag and Drop API with React event hooks

---

### 3. Design System Integration

**Decision**: Pre-load Stitch palette from `src/app/globals.css` CSS variables; fonts from Next.js font imports

**Rationale**:
- Stitch palette already defined as CSS custom properties in `globals.css` (--fg, --bg, --accent, etc.)
- Company fonts (Space Grotesk, Inter) are already imported in `src/app/layout.tsx`
- No additional configuration needed; extract CSS variables at build time or runtime
- Ensures visual consistency between main app and builder

**Alternatives Considered**:
- Hardcode color/font values: Maintenance nightmare if branding changes
- JSON config file: Additional file to maintain; duplicates existing CSS

**Selected**: Extract Stitch palette from `globals.css` CSS variables; fonts from existing imports

---

### 4. Template Storage & Persistence

**Decision**: Supabase PostgreSQL with per-user templates table

**Rationale**:
- Project already uses Supabase client (@supabase/supabase-js)
- PostgreSQL provides robust ACID compliance for template data
- Row-level security (RLS) enforces per-user isolation without custom auth
- Simple schema: user_id, template_name, template_config (JSON), timestamps

**Alternatives Considered**:
- LocalStorage only: No persistence across devices; MVP needs cloud storage
- Firebase Realtime Database: Adds new vendor; project already committed to Supabase

**Selected**: Supabase PostgreSQL with RLS-enforced user isolation

---

### 5. Image Export Format & Quality

**Decision**: PNG or JPG download via Canvas → Blob → download link

**Rationale**:
- PNG preserves exact colors (no compression artifacts for brand colors)
- JPG supported for users wanting smaller file size
- Canvas.toBlob() is native and performant
- Instagram accepts both formats; PNG recommended for brand work

**Alternatives Considered**:
- Server-side image rendering: Adds complexity; client-side export is sufficient for MVP
- WEBP: Browser support is good but not universal (older Safari)

**Selected**: PNG (default) or JPG (user choice) via Canvas.toBlob()

---

### 6. Internationalization Approach

**Decision**: UI strings use i18n dict (dict.{es,ca,en}.json); user post content is not translated

**Rationale**:
- Constitution principle IV requires all UI copy in i18n dicts
- User-entered text in posts is intentionally user-provided and not touched
- Builder interface (buttons, labels, placeholders) are localized
- Chat API already uses locale switching; reuse same pattern

**Implementation**:
- All builder UI strings: `t('instagram_builder.button_save')`, etc.
- User content: stored as-is; no translation

**Selected**: Hybrid approach — UI localized, user content as-is

---

## Unresolved Items

None. All technical decisions have been researched and validated against constitution principles and project stack.
