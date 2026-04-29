# Data Model: Instagram Post Builder

**Scope**: Database schema and type definitions for template builder
**Storage**: Supabase PostgreSQL

## Entity: Template

Represents a saved Instagram post template with layout, styling, and content structure.

### Table Schema (Supabase)

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT '1080x1080', -- Instagram Square format
  
  -- Template configuration (JSON)
  config JSONB NOT NULL, -- See TemplateConfig type below
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Row-level security
  UNIQUE(user_id, name)
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
```

### TypeScript Types

```typescript
// Main template document
interface Template {
  id: string; // UUID
  user_id: string; // FK to auth.users
  name: string; // Template name (e.g., "Summer Sale 2026")
  description?: string; // Optional template description
  format: "1080x1080"; // Instagram Square (other formats in future)
  config: TemplateConfig;
  created_at: ISO8601;
  updated_at: ISO8601;
}

// Template configuration (stored as JSONB in Supabase)
interface TemplateConfig {
  canvas: CanvasConfig;
  elements: TemplateElement[];
  metadata: {
    thumbnail_url?: string; // Generated on save, optional
  };
}

// Canvas setup
interface CanvasConfig {
  width: number; // Always 1080 for MVP
  height: number; // Always 1080 for MVP
  background_color: string; // Hex or CSS variable name (e.g., "var(--bg)" or "#101415")
  background_gradient?: {
    type: "linear" | "radial";
    stops: Array<{ color: string; position: number }>;
  };
}

// Element on canvas (text, image, shape)
interface TemplateElement {
  id: string; // Unique per-template element ID
  type: "text" | "image" | "shape"; // P1: text only; P2+: images/shapes
  position: {
    x: number; // Pixel position from canvas left
    y: number; // Pixel position from canvas top
  };
  size: {
    width: number;
    height: number;
  };
  
  // Type-specific properties
  content?: TextElementContent; // For type: "text"
  image_url?: string; // For type: "image"
  shape?: ShapeConfig; // For type: "shape"
  
  // Styling
  z_index: number; // Layering order
  rotation?: number; // Degrees; 0-360
  opacity?: number; // 0-1; default 1
}

// Text element content and styling
interface TextElementContent {
  text: string; // User-entered text (max 500 chars P1, expandable later)
  font_family: string; // "Space Grotesk" or "Inter" (pre-loaded)
  font_size: number; // Pixels (e.g., 48)
  font_weight: number | string; // 400, 600, 700, "bold", etc.
  color: string; // Hex, RGB, or CSS variable (e.g., "var(--fg)")
  text_align: "left" | "center" | "right";
  line_height: number; // Multiplier (e.g., 1.5)
}

// Shape (for future use; P2+)
interface ShapeConfig {
  type: "rectangle" | "circle"; // Expandable
  fill_color: string; // Hex or CSS variable
  stroke_color?: string;
  stroke_width?: number;
  border_radius?: number; // For rectangles
}

// Image element (for future use; P2+)
interface ImageElementContent {
  url: string;
  alt_text?: string;
}
```

### Validation Rules

1. **Template Name**: Required, max 100 chars, alphanumeric + spaces/hyphens
2. **Canvas Dimensions**: Fixed at 1080x1080 (Instagram Square)
3. **Elements**: Min 1, max 20 elements per template (P1); can be increased later
4. **Text Content**: Max 500 chars per element (P1); 5000 chars per template
5. **Colors**: Must be valid hex, RGB, or CSS variable reference
6. **Fonts**: Only pre-loaded fonts allowed (Space Grotesk, Inter)
7. **Position Constraints**: 
   - 0 ≤ x < 1080, 0 ≤ y < 1080
   - Elements can overlap (z_index controls layering)
8. **User Isolation**: Templates are immutable across users (RLS enforced)

### State Transitions

```
Draft (in-browser) → Saved (Supabase) → Loaded → Edited → Re-saved
```

A template transitions from browser state to Supabase when the user clicks "Save Template". After save, the template can be loaded, edited, and re-saved. Editing a loaded template modifies a local copy; changes persist only on explicit save.

## Entity: Element (Canvas Element)

Represents a single draggable/editable element on the canvas (text, image, shape).

### Type Definition

See `TemplateElement` above. Key properties:

- **id**: Unique within the template (UUID or incrementing counter)
- **type**: "text" (P1), "image" (P2), "shape" (P2)
- **position**: (x, y) in pixels; (0, 0) is top-left
- **size**: width, height in pixels
- **content**: Type-specific data (text styling, image URL, etc.)
- **z_index**: Rendering order (lower values behind, higher values in front)

### Validation

- Position must be within canvas bounds (with allowance for partial off-canvas positioning)
- Size must be > 0
- z_index must be unique per-template (auto-assigned on creation)

## Entity: Export (Image Output)

Represents a generated 1080x1080 PNG/JPG file ready for Instagram.

### Runtime (Not Persisted)

Generated when user clicks "Download Image". Not stored in database.

```typescript
interface ImageExport {
  blob: Blob; // Canvas-rendered PNG or JPG
  format: "image/png" | "image/jpeg";
  width: 1080;
  height: 1080;
  filename: string; // e.g., "template-summer-sale-2026-export.png"
  size_bytes: number; // For tracking image size
}
```

### Generation Process

1. Serialize canvas state (all elements + colors/fonts)
2. Render to HTML5 Canvas 2D context
3. Export via `canvas.toBlob()` to Blob
4. Create download link via `URL.createObjectURL()`
5. Trigger browser download

---

## Data Relationships

```
User (auth.users)
  └── Templates (1:N)
      └── Elements (1:N)
          ├── Text Content
          ├── Image URL (future)
          └── Shape Config (future)
```

A user has many templates. Each template has many elements. Elements are only meaningful within a template context.

---

## Backward Compatibility & Migration

**P1 Scope**: Fixed 1080x1080 format. Future formats (Story, Carousel, etc.) will extend schema with `format` enum.

**Element Types**: P1 supports text only. Future element types (image, shape) will extend `TemplateElement.content` union.

**Font Library**: Pre-loaded fonts are Space Grotesk, Inter. Adding fonts requires updating `fontSelector.ts` and i18n `dict.{es,ca,en}.json`.

---

## Summary

**Tables**: 1 (templates)
**Types**: 7 main types (Template, TemplateConfig, CanvasConfig, TemplateElement, TextElementContent, etc.)
**Storage Size**: ~10KB per template (JSON config); PNG/JPG exports are not stored, only generated
**User Isolation**: Row-level security via (user_id, name) composite key + RLS policies
