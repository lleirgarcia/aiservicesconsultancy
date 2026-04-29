# Contract: Template Service (Supabase CRUD)

**Module**: `src/services/templateService.ts`

Defines the contract for persisting templates to Supabase and managing template lifecycle.

## Function: createTemplate()

Save a new template to Supabase.

```typescript
async function createTemplate(
  userId: string,
  name: string,
  config: TemplateConfig,
  description?: string
): Promise<Template>
```

### Parameters

- **userId**: UUID of authenticated user (from `auth.user()`)
- **name**: Template name (required, max 100 chars)
- **config**: TemplateConfig object (canvas, elements, metadata)
- **description**: Optional template description

### Response

Returns the created Template object with generated `id`, `created_at`, `updated_at`.

### Errors

- **PgError - UNIQUE violation**: Template with this name already exists for user → throw `TemplateError('Template with this name already exists')`
- **Network error**: Supabase unreachable → throw `TemplateError('Failed to save template')`

### RLS Enforcement

- Row-level security policy ensures only `auth.uid() == user_id` can insert
- No manual user_id validation needed; Supabase enforces

---

## Function: loadTemplate()

Fetch a single template by ID.

```typescript
async function loadTemplate(templateId: string): Promise<Template>
```

### Parameters

- **templateId**: UUID of template to load

### Response

Returns the Template object with all fields populated.

### Errors

- **Not found**: Template doesn't exist or user doesn't have access → throw `TemplateError('Template not found')`
- **Network error**: Supabase unreachable → throw `TemplateError('Failed to load template')`

### RLS Enforcement

- Row-level security automatically filters to user's own templates
- If user tries to load another user's template, Supabase returns 0 rows → "not found" error

---

## Function: listTemplates()

Fetch all templates for the authenticated user.

```typescript
async function listTemplates(userId: string): Promise<Template[]>
```

### Parameters

- **userId**: UUID of authenticated user

### Response

Returns array of Template objects (0 or more), sorted by `updated_at DESC` (newest first).

### Errors

- **Network error**: Supabase unreachable → throw `TemplateError('Failed to load templates')`

### RLS Enforcement

- Supabase automatically filters to user's templates via RLS

---

## Function: updateTemplate()

Update an existing template (name, description, or config).

```typescript
async function updateTemplate(
  templateId: string,
  updates: Partial<{
    name: string;
    description: string;
    config: TemplateConfig;
  }>
): Promise<Template>
```

### Parameters

- **templateId**: UUID of template to update
- **updates**: Partial object with fields to update (name, description, config, etc.)

### Response

Returns the updated Template object with new `updated_at` timestamp.

### Errors

- **Not found**: Template doesn't exist or user doesn't have access → throw `TemplateError('Template not found')`
- **PgError - UNIQUE violation**: New name conflicts with another template for user → throw `TemplateError('Template with this name already exists')`
- **Network error**: Supabase unreachable → throw `TemplateError('Failed to update template')`

### RLS Enforcement

- Row-level security ensures only template owner can update

---

## Function: deleteTemplate()

Delete a template permanently.

```typescript
async function deleteTemplate(templateId: string): Promise<void>
```

### Parameters

- **templateId**: UUID of template to delete

### Response

None (void). Template is permanently deleted from database.

### Errors

- **Not found**: Template doesn't exist or user doesn't have access → throw `TemplateError('Template not found')`
- **Network error**: Supabase unreachable → throw `TemplateError('Failed to delete template')`

### RLS Enforcement

- Row-level security ensures only template owner can delete

---

## Error Type: TemplateError

```typescript
class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}
```

Usage: Throw TemplateError for any template operation failures (not found, validation, network, etc.).

---

## Contract Validation (Integration Tests)

These contract guarantees must be verified by integration tests with real Supabase:

1. **Create Success**: Template is saved to database with correct values
2. **Duplicate Name Rejection**: Attempting to create template with duplicate name (per user) throws error
3. **Load Success**: Loaded template matches saved state
4. **User Isolation**: User A cannot load/update/delete User B's templates
5. **Update Success**: Updated template reflects changes
6. **Delete Success**: Deleted template no longer appears in list
7. **List Ordering**: Templates are returned in descending `updated_at` order
8. **Soft Timestamps**: `created_at` is immutable; `updated_at` updates on every change
