---
description: "Task list for Instagram Post Builder feature implementation"
---

# Tasks: Instagram Post Builder

**Input**: Design documents from `/specs/001-instagram-post-builder/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Status**: MVP scope covers P1 user stories (Create + Reuse). P2 (Edit) and P3 (Export/Share) are deferred.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths shown below use `src/` at repository root (not feature directory)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and feature routing

- [ ] T001 Create `/instagram-builder` route in `src/app/instagram-builder/page.tsx` with placeholder
- [ ] T002 [P] Add Instagram Post Builder i18n keys to `src/i18n/dict/dict.es.json`, `dict.ca.json`, `dict.en.json` (buttons: Save, Download, Load, Delete, etc.)
- [ ] T003 [P] Create type definitions file `src/types/instagram-builder.ts` with Template, TemplateConfig, TemplateElement, TextElementContent types
- [ ] T004 [P] Create Supabase schema: `migrations/001_create_templates_table.sql` with templates table (user_id, name, config JSONB, created_at, updated_at)
- [ ] T005 [P] Setup Supabase RLS policies in `migrations/002_templates_rls.sql` for user isolation
- [ ] T006 Add design token exports in `src/services/designTokens.ts` (extract Stitch palette from `globals.css`, fonts from `layout.tsx`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user story work begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create `src/hooks/useTemplateBuilder.ts` with template state management (canvas config, elements, selected element, isDirty)
- [ ] T008 [P] Create `src/hooks/useDragAndDrop.ts` with drag event handlers (onDragStart, onDragOver, onDrop) and position calculations
- [ ] T009 [P] Create `src/hooks/useTemplateStorage.ts` with Supabase API integration (createTemplate, loadTemplate, listTemplates, updateTemplate, deleteTemplate)
- [ ] T010 Create `src/services/canvasRenderer.ts` with Canvas 2D rendering functions (renderTemplateToCanvas, exportCanvasToBlob)
- [ ] T011 Create `src/services/templateService.ts` with Supabase CRUD operations (type-safe wrapper around useTemplateStorage)
- [ ] T012 [P] Create utility `src/utils/canvasUtils.ts` with helper functions (getCanvasContext, validateDimensions, resizeCanvas)
- [ ] T013 Setup test infrastructure: Jest config in `jest.config.js`, React Testing Library setup in `__tests__/setup.ts`

**Checkpoint**: Foundation ready - all user stories can now proceed in parallel

---

## Phase 3: User Story 1 - Create First Post Template (Priority: P1) 🎯 MVP

**Goal**: Users can create a branded template with text, colors, and fonts, then save it for reuse

**Independent Test**: (1) Load builder with pre-loaded Stitch palette + fonts, (2) Drag text to canvas, (3) Edit text/color/font, (4) Save template, (5) Verify template persists in DB

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create `src/components/Canvas/TemplateCanvas.tsx` component (1080x1080 canvas element, drag-and-drop zone, renders via canvasRenderer)
- [ ] T015 [P] [US1] Create `src/components/Canvas/ElementDragger.tsx` HOC to wrap canvas and handle drag events (uses useDragAndDrop hook)
- [ ] T016 [P] [US1] Create `src/components/Canvas/Preview.tsx` live preview pane showing real-time template updates
- [ ] T017 [P] [US1] Create `src/components/Sidebar/ColorPicker.tsx` with pre-loaded Stitch palette (--bg, --fg, --accent, --border, etc.) from designTokens.ts
- [ ] T018 [P] [US1] Create `src/components/Sidebar/FontSelector.tsx` with pre-loaded fonts (Space Grotesk, Inter) from designTokens.ts
- [ ] T019 [P] [US1] Create `src/components/Sidebar/ElementPalette.tsx` with draggable text element starter (draggable from sidebar onto canvas)
- [ ] T020 [US1] Create `src/components/TextElementEditor.tsx` for editing text content (text input, font dropdown, size slider, color picker)
- [ ] T021 [US1] Create `src/components/Sidebar/SaveTemplateModal.tsx` dialog for saving template (name input, description, validation)
- [ ] T022 [US1] Integrate all components into `src/components/InstagramPostBuilder.tsx` main builder (canvas + sidebar + editor + modals)
- [ ] T023 [US1] Add route handler for `/instagram-builder` in `src/app/instagram-builder/page.tsx` to render InstagramPostBuilder component
- [ ] T024 [US1] Test user story 1 acceptance scenarios via React Testing Library (`__tests__/integration/template-create.test.tsx`)

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Reuse Existing Template (Priority: P1) 🎯 MVP

**Goal**: Users can load a saved template and modify content while keeping styling locked

**Independent Test**: (1) Load builder, (2) Show template list, (3) Select + load template, (4) Edit text only, (5) Download image, (6) Verify styling unchanged

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create `src/components/TemplateLibrary.tsx` component (list of user's templates with thumbnails, load/delete buttons)
- [ ] T026 [P] [US2] Create `src/components/TemplateLibraryItem.tsx` component (thumbnail, template name, meta, load/delete actions)
- [ ] T027 [US2] Add "Load Template" mode to InstagramPostBuilder (lock styling after load, allow only text editing)
- [ ] T028 [US2] Create `src/components/ExportModal.tsx` dialog for downloading image (format: PNG/JPEG, quality slider for JPEG)
- [ ] T029 [US2] Add image export handler in `src/app/instagram-builder/api/export-image/route.ts` (POST endpoint: receives canvas state, returns PNG/JPG blob)
- [ ] T030 [US2] Integrate TemplateLibrary into InstagramPostBuilder sidebar (tab: "My Templates" shows list, selecting one loads template)
- [ ] T031 [US2] Add download button to InstagramPostBuilder (calls ExportModal, generates PNG/JPG via canvasRenderer.exportCanvasToBlob)
- [ ] T032 [US2] Test user story 2 acceptance scenarios via React Testing Library + Cypress E2E (`__tests__/integration/template-reuse.test.tsx`)

**Checkpoint**: User Stories 1 AND 2 should both work independently; users can create + reuse templates

---

## Phase 5: User Story 3 - Edit Template Design (Priority: P2)

**Goal**: Users can modify saved template design (colors, fonts, layout)

**Independent Test**: (1) Load template, (2) Enter edit mode, (3) Drag elements to new positions, (4) Change colors/fonts, (5) Save changes, (6) Verify updates persist

### Implementation for User Story 3

- [x] T033 [US3] Add "Edit Design" mode to InstagramPostBuilder (unlock all elements for repositioning + color/font changes)
- [x] T034 [P] [US3] Create `src/components/DesignEditor.tsx` panel for editing selected element (font, size, color, position inputs)
- [x] T035 [US3] Add z-index/layering controls in DesignEditor (move element forward/backward in stack)
- [x] T036 [US3] Add "Save Design Changes" handler to update template config in Supabase (updateTemplate call in templateService)
- [x] T037 [US3] Test user story 3 acceptance scenarios via React Testing Library (`__tests__/integration/template-edit.test.tsx`)

**Checkpoint**: All user stories 1, 2, 3 are independently functional

---

## Phase 6: User Story 4 - Export/Share Templates (Priority: P3)

**Goal**: Users can export templates as shareable files and import from files

**Independent Test**: (1) Export template as .json, (2) Share file, (3) Import in another account, (4) Verify template matches original

### Implementation for User Story 4

- [ ] T038 [US4] Create `src/components/ExportTemplateModal.tsx` dialog for exporting template as .json file
- [ ] T039 [US4] Add export handler to TemplateLibraryItem (downloads template_config as JSON)
- [ ] T040 [US4] Create `src/components/ImportTemplateModal.tsx` dialog for importing .json template file
- [ ] T041 [US4] Add import handler to InstagramPostBuilder (parses JSON, validates schema, saves as new template)
- [ ] T042 [US4] Test user story 4 acceptance scenarios via React Testing Library (`__tests__/integration/template-export.test.tsx`)

**Checkpoint**: All user stories 1-4 are independently functional (though P2 and P3 are deferred from MVP)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, tests, and documentation

- [ ] T043 [P] Setup integration test suite with real Supabase (`__tests__/integration/supabase-crud.test.tsx`)
- [ ] T044 [P] Setup E2E tests with Cypress (`cypress/e2e/instagram-builder.cy.ts`) covering all user stories
- [ ] T045 [P] Add error handling + user feedback (toast notifications for save/load/export errors)
- [ ] T046 [P] Add loading states (skeleton loaders for template library, progress for image export)
- [ ] T047 [P] Performance optimization: canvas rendering debouncing, memoization of hooks, lazy loading of template list
- [ ] T048 [P] Accessibility: keyboard navigation (Tab/Enter for buttons), ARIA labels, focus management
- [ ] T049 [P] Documentation update: Add "Instagram Post Builder" section to README.md with setup instructions
- [ ] T050 Run Cypress E2E tests on all user stories (validate golden path + edge cases)
- [ ] T051 Verify Constitution compliance: All UI strings in i18n dicts (ES/CA/EN), integration tests against real Supabase, no mocks for template persistence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are independent (both P1, both part of MVP)
  - US3 depends on US1/US2 (requires existing templates to edit)
  - US4 depends on US1/US2/US3 (requires export/import of templates)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### Within User Stories

Each story follows this pattern:
1. Components created (often in parallel with [P] marker)
2. Components integrated into main builder
3. Route/API setup if needed
4. Tests written and passing

### Parallel Execution Opportunities

**After Foundational (Phase 2) completes:**

```
Parallel Phase 3 (US1):
  - T014 Create TemplateCanvas component
  - T015 Create ElementDragger component  
  - T016 Create Preview component
  - T017 Create ColorPicker component
  - T018 Create FontSelector component
  - T019 Create ElementPalette component
  (All different files; T020-024 depend on these)

Parallel with US1 Phase 3:
  - Nothing else can start until US1 basics are done

Parallel Phase 4 (US2):
  - T025 Create TemplateLibrary
  - T026 Create TemplateLibraryItem
  - T028 Create ExportModal
  - (T027, T029-032 depend on above)

Parallel Phase 7 (Polish):
  - T043, T044, T045, T046, T047, T048, T049 can run in parallel
  - T050, T051 depend on above
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create Template)
4. Complete Phase 4: User Story 2 (Reuse Template)
5. **STOP and VALIDATE**: Test both stories end-to-end with Cypress
6. Deploy MVP with P1 features only

### Future: Add P2 + P3

7. Complete Phase 5: User Story 3 (Edit Template)
8. Complete Phase 6: User Story 4 (Export/Share)
9. Polish, optimize, release full feature set

### Parallel Team Strategy

If multiple developers:

1. Team completes Phase 1 + 2 together (Setup + Foundational)
2. Once Phase 2 done:
   - Developer A: Phase 3 (US1 - Create)
   - Developer B: Phase 4 (US2 - Reuse)
   - Phase 3 and 4 can proceed in parallel (different components)
3. Both stories done → MVP ready
4. (Later) Developer C: Phase 5 (US3 - Edit) + Phase 6 (US4 - Export)

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- MVP scope is US1 + US2 (P1 features); US3 + US4 are P2/P3 and deferred
- Commit after each logical group of tasks (e.g., after T024 completes US1)
- Polish phase tests are critical: verify all user stories work end-to-end with real Supabase
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
