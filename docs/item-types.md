# Item Types

DevStash has 7 system item types. All are `isSystem: true`, `userId: null`, and non-deletable. Users on Pro can create custom types in addition to these.

---

## The 7 System Types

### 1. Snippet

| Property | Value |
|---|---|
| Icon | `Code` (Lucide) |
| Color | `#3b82f6` (blue) |
| Content Type | `text` |
| Pro Only | No |

**Purpose:** Reusable code fragments. Supports a `language` field for syntax highlighting (e.g., `typescript`, `dockerfile`). Displayed with a monospace code editor.

**Key fields used:** `content`, `language`, `description`, `isPinned`, `isFavorite`, `tags`

---

### 2. Prompt

| Property | Value |
|---|---|
| Icon | `Sparkles` (Lucide) |
| Color | `#8b5cf6` (purple) |
| Content Type | `text` |
| Pro Only | No |

**Purpose:** AI prompt templates with placeholder syntax (e.g., `{{paste code here}}`). Stored as markdown/plain text. AI Prompt Optimizer feature (Pro) targets this type.

**Key fields used:** `content`, `description`, `isFavorite`, `tags`

---

### 3. Command

| Property | Value |
|---|---|
| Icon | `Terminal` (Lucide) |
| Color | `#f97316` (orange) |
| Content Type | `text` |
| Pro Only | No |

**Purpose:** Shell commands, CLI one-liners, and scripts. Stored as plain text (no markdown rendering required, though supported). Typically multi-line with inline comments.

**Key fields used:** `content`, `description`, `isPinned`, `tags`

---

### 4. Note

| Property | Value |
|---|---|
| Icon | `StickyNote` (Lucide) |
| Color | `#fde047` (yellow) |
| Content Type | `text` |
| Pro Only | No |

**Purpose:** Freeform markdown notes — documentation, how-tos, references. Uses the markdown editor.

**Key fields used:** `content`, `description`, `tags`

---

### 5. Link

| Property | Value |
|---|---|
| Icon | `Link` (Lucide) |
| Color | `#10b981` (emerald) |
| Content Type | `url` |
| Pro Only | No |

**Purpose:** Saved bookmarks and external references. The `url` field holds the destination; `content` is unused. Displayed as a clickable card with description.

**Key fields used:** `url`, `description`, `isFavorite`, `tags`

---

### 6. File

| Property | Value |
|---|---|
| Icon | `File` (Lucide) |
| Color | `#6b7280` (gray) |
| Content Type | `file` |
| Pro Only | Yes |

**Purpose:** Arbitrary file uploads (e.g., PDFs, context files, templates). Stored in Cloudflare R2. `content` is null; display uses file metadata.

**Key fields used:** `fileUrl`, `fileName`, `fileSize`, `description`, `tags`

---

### 7. Image

| Property | Value |
|---|---|
| Icon | `Image` (Lucide) |
| Color | `#ec4899` (pink) |
| Content Type | `file` |
| Pro Only | Yes |

**Purpose:** Image uploads (screenshots, design references, diagrams). Same storage mechanism as File (R2), but rendered as an image preview.

**Key fields used:** `fileUrl`, `fileName`, `fileSize`, `description`, `tags`

---

## Content Type Classification

| `contentType` | Types | Storage | `content` | `url` | `fileUrl` |
|---|---|---|---|---|---|
| `text` | Snippet, Prompt, Command, Note | DB (text column) | ✓ | — | — |
| `url` | Link | DB (url column) | — | ✓ | — |
| `file` | File, Image | Cloudflare R2 | — | — | ✓ |

---

## Shared Properties (all types)

All items share these fields regardless of type:

- `id`, `title`, `description` — identity and summary
- `userId`, `itemTypeId` — ownership and classification
- `isFavorite`, `isPinned` — UX prominence controls
- `tags` — many-to-many via `_ItemTags`
- `collections` — many-to-many via `ItemCollection`
- `createdAt`, `updatedAt` — timestamps

---

## Display Differences

| Type Class | Editor | Card Accent | Extra UI |
|---|---|---|---|
| `text` types | Markdown editor | Left border in type color | `language` badge for Snippet |
| `url` | URL input + description | Left border in emerald | Clickable link, external icon |
| `file` | File upload input | Left border in type color | File size, download button / image preview |

---

## Icon Map (runtime)

Defined in [src/lib/icon-map.ts](../src/lib/icon-map.ts). Maps the string icon name stored in the DB to a Lucide React component:

```ts
{ Code, Sparkles, Terminal, StickyNote, File, Image, Link }
```

Used across sidebar, collection cards, and item cards to render the correct icon dynamically.
