# Quickstart: Instagram Post Builder

User guide for the Instagram Post Template Builder feature.

## Access the Builder

Navigate to `/instagram-builder` in your browser.

```
https://yoursite.com/instagram-builder
```

The builder opens with:
- **Canvas** (center): 1080x1080 white area where you design
- **Sidebar** (left): Tools to add elements, set colors, and manage templates
- **Preview** (optional right pane): Live preview of your design

---

## Creating Your First Template

### Step 1: Load Design Tokens

When the builder loads, the **Stitch color palette** and **company fonts** are pre-populated:

- **Colors**: Click the color picker → see dark theme colors (bg, fg, accent, borders)
- **Fonts**: Click the font dropdown → see Space Grotesk (headlines) and Inter (body)

### Step 2: Add a Background

1. Click **"Set Background"** in the sidebar
2. Choose a **color** from the Stitch palette (e.g., #101415 for dark bg)
3. Canvas updates with the selected background
4. (Optional) Choose a **gradient** by selecting start and end colors

### Step 3: Add Text Elements

1. Click **"Add Text"** in the sidebar
2. A text element appears in the center of the canvas (default: "Edit me")
3. **Drag** the text box to reposition it on the canvas
4. **Click** the text to edit:
   - Type your text (e.g., "Summer Sale")
   - Choose font: Space Grotesk or Inter
   - Choose size: 24px–144px
   - Choose color from Stitch palette
   - Choose alignment: left, center, right
5. Click **"Done"** to save your changes
6. Canvas preview updates in real-time

### Step 4: Save Your Template

1. Click **"Save Template"** button
2. Enter a **template name** (e.g., "Summer Sale 2026")
3. (Optional) Add a **description** (e.g., "Dark theme, accent blue")
4. Click **"Save"**
5. Template is saved to your account
6. You can now **reuse** this template for future posts

### Step 5: Download Your Image

1. Once satisfied with your design, click **"Download Image"**
2. Choose format: **PNG** (recommended for quality) or **JPEG** (smaller file)
3. Image downloads as `template-name-export.png` to your device
4. Upload to Instagram as a regular post

---

## Reusing an Existing Template

### Load a Saved Template

1. Click **"My Templates"** in the sidebar
2. See a list of all your saved templates
3. Click a template to load it
4. The canvas shows the template layout, colors, and fonts

### Edit Content Only (Keep Styling)

When a template is loaded:
- **Click any text** to edit the content (words/phrases)
- **Drag** elements to reposition them
- All colors, fonts, and styling remain locked
- Changes are **not saved** to the template until you explicitly click "Save"

**Example**: You have a "Weekly Tip" template. Load it, change the text to "Tip #23: How to optimize...", and download. The styling stays consistent across all weekly tips.

### Save as a New Template

If you edit a loaded template and want to save it as a variation:

1. Make your edits (text, position, colors)
2. Click **"Save As"** (not "Save")
3. Enter a new template name
4. The new template is saved; the original is unchanged

---

## Editing an Existing Template Design

### Load Template in Edit Mode

1. Click **"My Templates"**
2. Click the template you want to edit
3. Click **"Edit Design"** button (not just "Load")
4. All elements become draggable, and colors/fonts are editable

### Change Colors or Fonts

1. Click a text element to select it
2. In the editor panel, change:
   - **Font**: Space Grotesk or Inter
   - **Size**: Drag slider or type pixel value
   - **Color**: Click color picker, choose from Stitch palette
3. Canvas updates immediately
4. Click **"Done"** to confirm

### Reposition Elements

1. **Drag** any element to a new position on the canvas
2. Canvas shows a light outline as you drag
3. Drop to finalize position
4. **Multi-element templates**: Use z-index (layering) to control which elements appear in front

### Save Design Changes

Once satisfied:
1. Click **"Save Design Changes"** button
2. Confirm the update
3. The template is updated; all future posts created from this template use the new design

---

## Best Practices

### Branding Consistency

- Use **Stitch colors** from the palette to stay on-brand
- Use **Space Grotesk** for headlines (impactful, modern)
- Use **Inter** for body text (readable, clean)
- Templates ensure consistency across all your posts

### Text Guidelines

- **Headlines**: 72–144px, Space Grotesk, bold (700 weight)
- **Body text**: 24–48px, Inter, regular (400 weight)
- **Captions**: 16–24px, Inter, light or regular
- Keep total text <500 characters per element to avoid overflow

### Canvas Positioning

- Leave margin from edges (avoid text/elements at 0,0)
- Test on actual Instagram before uploading
- Remember: Instagram may crop slightly on mobile
- Use **drag-and-drop** for precise positioning; no pixel-by-pixel required

### Exporting

- **PNG**: Best for brand work; preserves exact colors, no compression
- **JPEG**: Smaller file size; acceptable if file size matters
- Recommended: PNG for professional use

---

## Troubleshooting

### Template won't load

- Verify you're logged in to your account
- Try refreshing the page
- Check browser console for errors (F12 Developer Tools)

### Fonts not applying

- Ensure font is selected from the **Font Selector** (Space Grotesk or Inter)
- Fonts must be pre-loaded; custom fonts not supported in P1

### Image export is blurry

- Ensure canvas dimensions are 1080x1080 (automatically enforced)
- Use PNG format for best quality
- Verify text size is large enough (minimum 24px readable)

### Changes not saving

- Click **"Save Template"** or **"Save Design Changes"** explicitly
- Browser back button does not save; always use the Save button
- Unsaved changes are lost if you navigate away

---

## Feature Status (Roadmap)

**P1 (Current MVP)**:
- ✅ Create templates with text and colors
- ✅ Reuse templates
- ✅ Edit template design
- ✅ Download PNG/JPG

**P2 (Future)**:
- 🚧 Add images to templates
- 🚧 Shapes and decorative elements
- 🚧 Filters and effects
- 🚧 More Instagram formats (Story, Carousel)

**P3 (Future)**:
- 🚧 Export/share templates with team
- 🚧 Template library (curated templates)
- 🚧 Undo/Redo
