# Item CRUD Architecture

A unified system for creating, reading, updating, and deleting all 7 item types. Type-specific rendering lives in components; actions and queries are type-agnostic.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                  ← all item mutations (create, update, delete, toggle)
│
├── lib/db/
│   └── items.ts                  ← all item queries (existing + getItemsByType, getItemById)
│
├── app/
│   └── items/
│       └── [type]/
│           └── page.tsx          ← server component, resolves type slug, fetches & renders
│
└── components/
    └── items/
        ├── item-list.tsx         ← renders a grid/list of ItemCard
        ├── item-card.tsx         ← adapts display by contentType
        ├── item-drawer.tsx       ← slide-out panel for view + edit
        └── item-form.tsx         ← adapts form fields by contentType
```

---

## Routing: `/items/[type]`

| URL | Type resolved |
|---|---|
| `/items/snippets` | `Snippet` |
| `/items/prompts` | `Prompt` |
| `/items/commands` | `Command` |
| `/items/notes` | `Note` |
| `/items/links` | `Link` |
| `/items/files` | `File` |
| `/items/images` | `Image` |

The `[type]` segment is the **plural lowercase** form of the item type name. `page.tsx` converts it to the singular DB name (strip trailing `s`, capitalise) then looks up the `ItemType` by `name` for the current user. If no type is found, it calls `notFound()`.

The slug-to-name mapping is a small constant defined at the top of `page.tsx` (not in a shared lib — it's used in one place):

```ts
const TYPE_SLUG_MAP: Record<string, string> = {
  snippets: "Snippet",
  prompts:  "Prompt",
  commands: "Command",
  notes:    "Note",
  links:    "Link",
  files:    "File",
  images:   "Image",
};
```

---

## Queries — `src/lib/db/items.ts`

Add two functions to the existing file:

### `getItemsByType(userId, itemTypeId, opts?)`
```ts
// Returns all items for a user filtered by type.
// opts: { orderBy?, take?, skip? }
// Includes: itemType, tags
// Serializes Date → ISO string (same pattern as existing functions)
```

### `getItemById(userId, itemId)`
```ts
// Returns a single item with full data.
// Includes: itemType, tags, collections (id + name only)
// Returns null if not found or belongs to a different user.
```

Both follow the existing pattern: `include` instead of `select` for relations, `serializeItem` for date serialisation, explicit `userId` scoping on every query.

---

## Mutations — `src/actions/items.ts`

One file, five Server Actions. All validate session, scope by `userId`, and return `{ success, error?, data? }`.

```ts
"use server";

createItem(input: CreateItemInput): Promise<ActionResult<{ id: string }>>
updateItem(id: string, input: UpdateItemInput): Promise<ActionResult>
deleteItem(id: string): Promise<ActionResult>
toggleFavorite(id: string, value: boolean): Promise<ActionResult>
togglePinned(id: string, value: boolean): Promise<ActionResult>
```

### Input types

```ts
type CreateItemInput = {
  title: string;
  itemTypeId: string;
  contentType: "text" | "url" | "file";
  // text fields
  content?: string;
  language?: string;
  // url fields
  url?: string;
  // file fields (after R2 upload, pass back the result)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  // shared optional
  description?: string;
  tags?: string[];           // tag names; upserted by action
  collectionIds?: string[];  // collections to add the item to
};

type UpdateItemInput = Partial<Omit<CreateItemInput, "contentType" | "itemTypeId">>;
```

Actions do **not** branch by `contentType`. They write whatever fields are present and leave the rest `null`. Type-specific validation (e.g., "url required for Link") lives in the form component before submission.

### Tag handling (inside actions)
Tags are upserted by name and connected via `tags: { set: [...] }` on update (replaces the full set, matching the seed pattern).

### Collection handling (inside actions)
On create: `collections: { create: collectionIds.map(id => ({ collectionId: id })) }`.
On update: disconnect all, reconnect the new set — keeps it simple.

---

## Components

### `ItemsPage` — `src/app/items/[type]/page.tsx`
**Server Component.**
1. Resolves `params.type` → `ItemType` row (via `TYPE_SLUG_MAP` + DB lookup).
2. Calls `getItemsByType(userId, itemType.id)`.
3. Passes `items`, `itemType`, and `allItemTypes` (for the "change type" dropdown in the form) to `<ItemList>`.

### `ItemList` — `src/components/items/item-list.tsx`
**Client Component.**
- Renders a responsive grid of `<ItemCard>`.
- Owns the `openDrawer(itemId)` / `closeDrawer()` state.
- Renders `<ItemDrawer>` when an item is selected or "New Item" is clicked.

### `ItemCard` — `src/components/items/item-card.tsx`
**Client Component.**
- Displays title, description, type icon + color accent, tags, timestamps.
- Adapts the preview line by `contentType`:
  - `text` → first line of `content` (truncated), `language` badge if set
  - `url` → the URL hostname
  - `file` → file name + formatted file size
- Click → calls `openDrawer(item.id)`.
- Action menu: Edit, Toggle Favorite, Toggle Pin, Delete.

### `ItemDrawer` — `src/components/items/item-drawer.tsx`
**Client Component.** Uses shadcn `Sheet` (slides in from the right, matching the design spec).
- View mode: renders full item content (markdown for `text`, iframe/link for `url`, download/preview for `file`).
- Edit mode: renders `<ItemForm>` pre-populated with item data.
- New mode: renders `<ItemForm>` empty, with `itemTypeId` pre-set from the current type page.

### `ItemForm` — `src/components/items/item-form.tsx`
**Client Component.** Adapts fields based on `contentType`:

| `contentType` | Fields shown |
|---|---|
| `text` | Title, Description, Language (select), Content (markdown editor), Tags, Collections |
| `url` | Title, Description, URL (input), Tags, Collections |
| `file` | Title, Description, File upload, Tags, Collections |

- On submit: calls `createItem` or `updateItem` Server Action.
- Validates type-specific required fields before calling the action (e.g., `url` must be a valid URL for Link type).
- After success: closes the drawer, shows a toast, and triggers a router refresh to re-fetch the server component.

---

## Data Flow

```
User clicks "New Item"
  → ItemList opens ItemDrawer (new mode)
  → ItemForm renders fields for the current type's contentType
  → User fills form, submits
  → createItem() Server Action called
    → validates session, scopes to userId
    → upserts tags, creates item + collections join
    → returns { success: true, data: { id } }
  → ItemForm: close drawer, toast "Item created", router.refresh()
  → ItemsPage re-renders with new item from DB
```

```
User clicks item card
  → ItemList opens ItemDrawer (view mode, item id)
  → ItemDrawer fetches nothing — item data was passed down from ItemList
  → User clicks "Edit"
  → ItemDrawer switches to edit mode, renders ItemForm
  → User edits, submits
  → updateItem() Server Action called
  → Drawer closes, toast, router.refresh()
```

---

## What Lives Where (summary)

| Concern | Location | Reason |
|---|---|---|
| DB queries | `src/lib/db/items.ts` | Called directly from server components; reusable across routes |
| Mutations | `src/actions/items.ts` | Server Actions; called from client components without API routes |
| Type-slug mapping | Top of `page.tsx` | Used in one place; not worth a shared constant |
| Content rendering | `ItemCard`, `ItemDrawer` | Type-specific UI, not business logic |
| Field switching | `ItemForm` | Form knows which fields to show/validate per contentType |
| Type-specific validation | `ItemForm` (pre-submit) | Keeps actions simple and uniform |
