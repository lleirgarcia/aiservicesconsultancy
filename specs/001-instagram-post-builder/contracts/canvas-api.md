# Contract: Canvas Rendering API

**Module**: `src/services/canvasRenderer.ts`

Defines the contract for rendering template elements to HTML5 Canvas and exporting to PNG/JPG.

## Function: renderTemplateToCanvas()

Renders a template configuration to a canvas element with all elements, colors, and fonts applied.

```typescript
function renderTemplateToCanvas(
  canvas: HTMLCanvasElement,
  template: TemplateConfig,
  options?: RenderOptions
): void
```

### Parameters

- **canvas**: Target HTML5 Canvas element (must be 1080x1080 or will be resized)
- **template**: TemplateConfig object (from database or local state)
- **options**: Optional rendering options
  - `fillBackground`: boolean (default: true) — render background color/gradient
  - `renderOutlines`: boolean (default: false) — render selection outlines (for editor)

### Behavior

1. Resize canvas to 1080x1080 (via `canvas.width = 1080; canvas.height = 1080`)
2. Get 2D context: `const ctx = canvas.getContext('2d')`
3. Render background (color or gradient)
4. For each element in template.elements (sorted by z_index, ascending):
   - Apply position, rotation, opacity
   - Render text with font_family, font_size, color
   - (Future: render image, shape)
5. Return (void; canvas is mutated in-place)

### Example Usage

```typescript
const canvas = document.querySelector('canvas#preview') as HTMLCanvasElement;
const template: TemplateConfig = {
  canvas: { width: 1080, height: 1080, background_color: '#101415' },
  elements: [
    {
      id: '1',
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 880, height: 200 },
      content: {
        text: 'Summer Sale',
        font_family: 'Space Grotesk',
        font_size: 72,
        font_weight: 700,
        color: '#89ceff',
        text_align: 'center',
      },
      z_index: 1,
    },
  ],
};

renderTemplateToCanvas(canvas, template);
// Canvas now displays the template
```

### Error Handling

- If canvas is not 1080x1080 after resize: silent (canvas.width/height will be set)
- If font not loaded: use fallback system font
- If color is invalid hex/CSS var: use fallback color (--fg)

---

## Function: exportCanvasToBlob()

Exports canvas content to a PNG or JPG Blob, ready for download.

```typescript
async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' = 'png',
  quality?: number
): Promise<Blob>
```

### Parameters

- **canvas**: Source canvas element (must already be rendered)
- **format**: 'png' (default) or 'jpeg'
- **quality**: Compression quality for JPEG (0-1, default 0.95)

### Behavior

1. Call `canvas.toBlob()` with specified format and quality
2. Return the Blob promise
3. Blob dimensions are exactly 1080x1080

### Example Usage

```typescript
const blob = await exportCanvasToBlob(canvas, 'png');
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-instagram-post.png';
a.click();
URL.revokeObjectURL(url);
```

### Error Handling

- If canvas.toBlob() fails: throw error with message "Canvas export failed"
- Quality out of range: clamp to [0, 1]

---

## Contract Validation (Integration Tests)

These contract guarantees must be verified by integration tests:

1. **Dimension Accuracy**: Exported PNG/JPG is exactly 1080x1080 px
2. **Color Fidelity**: Stitch colors (--bg, --accent, etc.) render as expected hex values
3. **Text Rendering**: Text is rendered with correct font, size, color, and alignment
4. **Background Gradient**: Linear and radial gradients render without artifacts
5. **Z-Index Layering**: Elements layer in correct order per z_index
6. **Performance**: Rendering completes in <50ms for 10 elements
