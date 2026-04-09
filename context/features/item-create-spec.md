# Item Create

## Overview

Add new items via a modal dialog. The "New Item" button in the top bar (present in both `src/app/dashboard/layout.tsx` and `src/app/items/layout.tsx`) opens the dialog. Both layouts are server components, so the button must be extracted into a `'use client'` component that owns the dialog open state.

---

## Component

**`src/components/items/new-item-dialog.tsx`** — client component

- Renders the "New Item" `<Button>` (same styling as current: `size="sm" className="h-8 text-xs gap-1.5"` with `<Plus>` icon)
- Owns the `open` / `setOpen` state for the Dialog
- Replace the static `<Button>New Item</Button>` in both layouts with `<NewItemDialog />`

### Dialog Structure

Use shadcn `Dialog` (install it — not yet in the project). Layout:

```
DialogHeader
  DialogTitle: "New Item"
  DialogDescription: "Add a new item to your stash"

Body
  Type selector     — row of pill buttons, one per system type
  [conditional fields based on selected type]
  Title             — always shown, required
  Description       — always shown, optional
  Tags              — always shown, optional (comma-separated input)

DialogFooter
  Cancel button
  Create button (disabled while submitting)
```

### Type selector

Render a pill for each system type: snippet, prompt, command, note, link (exclude file/image — those are file uploads, out of scope). Each pill shows the Lucide icon + type name. Active pill uses the type's color as background. Default selection: **snippet**.

### Conditional fields

| Selected type       | Extra fields shown                    |
|---------------------|---------------------------------------|
| snippet, command    | Content (textarea, required), Language (text input, optional) |
| prompt, note        | Content (textarea, required)          |
| link                | URL (text input, required)            |

Content textarea: `min-h-[120px] resize-y font-mono text-sm` for snippet/command, plain `min-h-[120px] resize-y` for prompt/note.

### After submit

- On success: `toast.success('"<title>" created')`, close dialog, `router.refresh()`
- On error: `toast.error(result.error)`
- Reset form state when dialog closes

---

## Server Action

**`src/actions/items.ts`** — add `createItem`

```ts
export async function createItem(formData: unknown): Promise<CreateItemResult>
```

Return type follows existing pattern:
```ts
type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string }
```

### Zod schema (discriminated union)

```ts
const baseSchema = z.object({
  typeId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
})

const textWithLanguageSchema = baseSchema.extend({
  contentType: z.literal("text"),
  content: z.string().min(1, "Content is required"),
  language: z.string().optional(),
})

const textOnlySchema = baseSchema.extend({
  contentType: z.literal("text"),
  content: z.string().min(1, "Content is required"),
})

const urlSchema = baseSchema.extend({
  contentType: z.literal("url"),
  url: z.string().url("Invalid URL"),
})
```

Use a union: `z.discriminatedUnion("contentType", [...])` or just one merged schema with conditional refinements — keep it simple.

Auth: check `session.user.id`, return `{ success: false, error: "Not authenticated" }` if missing.

---

## DB Query

**`src/lib/db/items.ts`** — add `createItem`

```ts
export type CreateItemInput = {
  title: string
  description: string | null
  contentType: string       // "text" | "url"
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  itemTypeId: string
  userId: string
}

export async function createItem(data: CreateItemInput): Promise<ItemDetail>
```

Prisma call:
- `prisma.item.create` with `tags.connectOrCreate` (same pattern as `updateItem`)
- Include same relations as `getItemDetail`: `itemType`, `tags`, `collections`
- Serialize dates to ISO strings before returning

---

## shadcn Components to Install

```bash
npx shadcn@latest add dialog
npx shadcn@latest add select   # only if needed for language selector; plain Input is fine too
```

Dialog is not yet installed. Install it before implementing.

---

## File Changes Summary

| File | Change |
|---|---|
| `src/components/items/new-item-dialog.tsx` | New — dialog + form component |
| `src/actions/items.ts` | Add `createItem` action |
| `src/lib/db/items.ts` | Add `createItem` DB query + `CreateItemInput` type |
| `src/app/dashboard/layout.tsx` | Replace static Button with `<NewItemDialog />` |
| `src/app/items/layout.tsx` | Replace static Button with `<NewItemDialog />` |

---

## Unit Tests

Add to `src/actions/items.test.ts`:

- Missing auth → `{ success: false, error: "Not authenticated" }`
- Zod validation: empty title, missing URL for link type, missing content for snippet
- Happy path: DB query called with correct arguments, returns `ItemDetail`
- DB failure → `{ success: false, error: "Failed to create item" }`
