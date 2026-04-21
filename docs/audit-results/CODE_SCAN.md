# DevStash Code Audit — April 2026

Scope: full codebase as of commit `fd89c85` (quick copy button feature complete).
Audited dirs: `src/app/`, `src/actions/`, `src/lib/`, `src/components/`.

---

## CRITICAL

### Security

**File:** `src/components/items/markdown-editor.tsx`
**Line(s):** 115, 153
**Issue:** `dangerouslySetInnerHTML={{ __html: html }}` is used to render HTML produced by `marked.parse()`. `marked` does **not** sanitize by default — any HTML or JavaScript in the markdown input (e.g. `<script>alert(1)</script>` or `<img onerror=...>`) is passed straight through to the DOM.
**Impact:** Stored XSS. Any user who saves a note or prompt containing a crafted payload can execute arbitrary JavaScript in the browsers of all users who view that item. This is a direct stored-XSS vector on content that is persisted in the database.
**Fix:** Pipe `marked`'s output through a dedicated HTML sanitizer before rendering. Install `dompurify` (client-side) or `isomorphic-dompurify`, then replace both call sites:
```ts
import DOMPurify from "dompurify";
const safeHtml = DOMPurify.sanitize(marked.parse(value) as string);
// then: dangerouslySetInnerHTML={{ __html: safeHtml }}
```
Apply this fix to both `MarkdownEditor` (line 115) and `MarkdownView` (line 153).

---

## HIGH

### Security

**File:** `src/app/api/auth/register/route.ts`
**Line(s):** 13–36
**Issue:** The registration route accepts `email` and `name` from the request body with no format validation, no length limits, and no minimum password length. A trivially short password (1 character) passes the `!password` check. The email field is stored in the DB without validating it is a syntactically valid email address.
**Impact:** Accounts can be created with arbitrarily long inputs (potential DoS against the DB column or bcrypt), single-character passwords, and malformed emails that later break verification flow or email delivery. The `change-password` route enforces 8 characters; the register and reset-password routes enforce only 6, so the minimum is inconsistent.
**Fix:** Add Zod validation before any DB access:
```ts
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
});
```
Replace the manual `!name || !email` checks with `schema.safeParse(body)`. Align the minimum password length to 8 characters across all three routes (register, reset-password, change-password).

**File:** `src/app/api/items/[id]/route.ts`
**Line(s):** 57–65
**Issue:** The `DELETE` route in the API handler uses `prisma.item.deleteMany` (raw Prisma, ownership-scoped), which correctly scopes deletion to the owning user. However, it does **not** call `deleteFromR2` to remove the associated R2 file when the item has a `fileUrl`. The server action `deleteItem` in `src/lib/db/items.ts` (line 383–398) does perform R2 cleanup, but this API route bypasses that logic entirely.
**Impact:** Every file or image item deleted via the API route (e.g. through the item drawer's action bar, which calls the server action, but any direct API caller) leaves an orphaned object in Cloudflare R2. Storage accumulates permanently and cannot be reclaimed without manual bucket cleanup.
**Fix:** Either reuse the `deleteItem` DB function from `src/lib/db/items.ts` in the DELETE handler (which already handles R2 cleanup), or inline the same cleanup logic:
```ts
// In DELETE route handler:
const deleted = await dbDeleteItem(id, session.user.id);
if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ success: true });
```

### Performance

**File:** `src/lib/db/collections.ts`
**Line(s):** 21–33
**Issue:** `getCollectionsForUser` fetches full `Item` rows (all columns) plus the complete `ItemType` record for every item in every collection, just to compute a per-type count and pick the icon/color. For a user with 10 collections averaging 20 items each, this loads 200 full item rows when only the `itemType` relation is needed.
**Impact:** Unnecessary data transfer from Neon on every dashboard page load. Scales poorly as item count grows.
**Fix:** Replace the `include` with a `select` that only pulls the fields actually used:
```ts
items: {
  select: {
    item: {
      select: {
        itemType: {
          select: { id: true, icon: true, color: true, name: true },
        },
      },
    },
  },
},
```

**File:** `src/app/dashboard/page.tsx`
**Line(s):** 20–27
**Issue:** `getCollectionStats` is called as a separate DB query alongside `getCollectionsForUser`, even though the total and favorite collection counts can be derived from the already-fetched `collections` array with zero extra queries.
**Impact:** Two unnecessary COUNT queries execute on every dashboard load.
**Fix:** Remove `getCollectionStats` from the `Promise.all`, and compute the stats from the returned `collections` array:
```ts
const totalCollections = collections.length;
const favoriteCollections = collections.filter(c => c.isFavorite).length;
```
Pass these derived values to `DashboardMain` instead of the `collectionStats` object.

---

## MEDIUM

### Security

**File:** `src/app/api/download/[...key]/route.ts`
**Line(s):** 42–48
**Issue:** The `Content-Disposition` header is built as:
```ts
`attachment; filename="${encodeURIComponent(filename)}"`
```
`encodeURIComponent` percent-encodes the filename, but RFC 6266 requires `filename*=UTF-8''<encoded>` for non-ASCII names when using percent-encoding. More practically, certain server/browser combinations will mis-parse double-quotes containing percent-encoded characters, potentially allowing header injection if `filename` contains a literal `"` character (though `encodeURIComponent` does encode `"`). This is a robustness issue rather than an acute exploitable hole, but filenames sourced from user upload deserve hardened handling.
**Fix:** Use the `filename*` parameter with RFC 5987 encoding, or strip/replace double-quote characters from the filename before embedding:
```ts
const safeFilename = filename.replace(/"/g, "");
"Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
```

### Code Quality

**File:** `src/lib/mock-data.ts`
**Line(s):** 1–156
**Issue:** This file is entirely dead code — it exports `mockUser`, `mockItemTypes`, `mockCollections`, `mockItems`, and `mockItemTypeCounts`, none of which are imported anywhere in the codebase.
**Impact:** Dead code increases bundle parsing cost (negligible here since it's server-side), creates confusion for new contributors, and risks being accidentally used in the future.
**Fix:** Delete `src/lib/mock-data.ts`.

**File:** `src/components/items/item-drawer.tsx`, `src/components/items/new-item-dialog.tsx`, `src/actions/items.ts`
**Line(s):** item-drawer.tsx:63–65, new-item-dialog.tsx:38–41, actions/items.ts:31–32
**Issue:** The type classification arrays (`TEXT_CONTENT_TYPES`, `LANGUAGE_TYPES`, `MARKDOWN_TYPES`) are defined identically in three separate files. Any change to which type names belong in these categories (e.g. adding a new system type) must be updated in three places.
**Impact:** Maintenance risk — a one-line change to add a new type requires three coordinated edits. Divergence between the arrays in the action (server-side) and the components (client-side) could silently produce inconsistent behavior.
**Fix:** Extract to a single shared constants file (e.g. `src/lib/item-type-constants.ts`), export the arrays, and import them in all three call sites.

**File:** `src/components/items/file-list-row.tsx`, `src/components/items/item-drawer.tsx`, `src/components/items/file-upload.tsx`
**Line(s):** file-list-row.tsx:60, item-drawer.tsx:788, file-upload.tsx:25
**Issue:** `formatBytes` is defined identically (or nearly so, with `null` handling varying) in three separate files.
**Impact:** Three-way duplication of the same utility function. Any formatting change requires three edits.
**Fix:** Extract to `src/lib/format-bytes.ts` with a `null`-safe signature (`bytes: number | null`) and import it in all three files.

**File:** `src/components/items/sidebar-content.tsx`
**Line(s):** 56
**Issue:** Pro type detection hardcodes type names:
```ts
const isProType = type.isSystem && (type.name === "File" || type.name === "Image");
```
This will silently break if the seeded type names are ever changed (e.g. to lowercase or renamed).
**Impact:** Pro badge will not render for renamed types, with no compile-time or runtime error.
**Fix:** Add a `isPro` boolean field to the `ItemType` DB model and seed it accordingly, or at minimum centralise the hardcoded names into the shared constants file mentioned above (e.g. `PRO_TYPE_NAMES = ["File", "Image"]`).

### Architecture

**File:** `src/components/items/item-drawer.tsx`
**Line(s):** 78–801
**Issue:** `ItemDrawer` is a 720-line single component file handling: data fetching, loading state, view rendering (5 content types), edit mode (duplicate field set), delete confirmation dialog, favorite/pin toggling, copy, download, and 7 local utility components (`EditInput`, `EditTextarea`, `ActionBtn`, `SectionLabel`, `DetailRow`, `DrawerSkeleton`, `formatBytes`, `formatDate`). It has two distinct major states (view vs. edit) that are both rendered in the same JSX tree with conditional branches.
**Impact:** The file is difficult to test, reason about, and modify. Adding a new content type or action requires editing a file that already has too many concerns.
**Fix:** At minimum: (1) extract view-mode body and edit-mode body into dedicated components `ItemDrawerViewBody` and `ItemDrawerEditBody`; (2) move the utility components and helpers to a `src/components/items/drawer-helpers.tsx` file; (3) keep `ItemDrawer` as a thin orchestrator that owns state and delegates rendering.

---

## LOW

### Code Quality

**File:** `src/components/items/item-card.tsx`
**Line(s):** 15–16
**Issue:** `hovered` state is managed manually with `onMouseEnter`/`onMouseLeave` handlers to produce hover color effects. This pattern requires two extra state variables (`hovered`) and re-renders on every mouse enter/leave.
**Impact:** Minor performance overhead per card (a re-render on hover). At scale with many visible cards, this produces unnecessary work. CSS `:hover` selectors or Tailwind hover variants would achieve the same result without JS state.
**Fix:** Replace the inline `style={{ backgroundColor: hovered ? ... }}` with a Tailwind class or CSS variable approach using `group-hover:` or a custom CSS variable set via Tailwind. Remove the `hovered` state and both event handlers.

**File:** `src/lib/r2.ts`
**Line(s):** 8–15
**Issue:** The R2 client is instantiated at module load time using non-null assertions (`!`) on all four env vars. If any var is missing, the S3Client constructor will receive `undefined` values and the error will surface only at the first upload/download request, not at startup.
**Impact:** Silent misconfiguration — a missing `R2_BUCKET_NAME` for example will cause a runtime error on the first file operation rather than an informative startup failure.
**Fix:** Add guards (similar to the `DATABASE_URL` guard in `prisma.ts`) that throw at module load time if any R2 env var is absent:
```ts
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
if (!R2_ACCOUNT_ID) throw new Error("R2_ACCOUNT_ID is not set");
// ... same for the other three
```

**File:** `src/app/items/[type]/page.tsx`
**Line(s):** 19–23
**Issue:** `getItemTypeByName` and `getItemsByType` are fired in parallel via `Promise.all`, but if `itemType` is null (i.e. the slug maps to a non-existent type), the `items` query has already run unnecessarily.
**Impact:** Wasted DB round-trip on invalid URLs. Minor, since invalid type slugs are an edge case.
**Fix:** Run `getItemTypeByName` first, call `notFound()` immediately if null, then fetch items. Given items load is user-scoped and the type lookup is cheap, the sequential version is acceptable here.

---

## Summary

**Total issues by severity:**
- CRITICAL: 1
- HIGH: 3
- MEDIUM: 5
- LOW: 3

**Most important fix first:** The stored XSS via `dangerouslySetInnerHTML` in `src/components/items/markdown-editor.tsx` is the highest-priority fix. User-authored markdown content is passed unescaped as HTML to the DOM, enabling any authenticated user to inject persistent scripts viewed by all users who open the affected item.

**Systemic patterns to track:**
1. **Utility function duplication** — `formatBytes` and the type classification arrays are each defined in 2–3 places. The project needs a `src/lib/item-type-constants.ts` and a `src/lib/format-bytes.ts` to consolidate these.
2. **API route / server action split without shared logic** — The `DELETE /api/items/[id]` route and the `deleteItem` server action both delete items but only the action performs R2 cleanup. Any time item deletion can happen via two paths, cleanup logic needs to be in one authoritative place (the DB function) that both call.
3. **Over-fetching in collections query** — Previously flagged; `getCollectionsForUser` still fetches full item rows. This is the most impactful query to optimize for dashboard performance.
