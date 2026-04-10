# Code Editor Spec

## Overview

Replace the plain `<pre>` block and monospaced `<textarea>` used for snippet and command content
with a Monaco Editor component. The editor renders inside the item drawer (both view and edit
modes) and inside the New Item dialog (create mode). All other item types (prompt, note, link)
continue using the existing `<textarea>` / `<pre>` layout unchanged.

---

## Component: `CodeEditor`

**File:** `src/components/items/code-editor.tsx`

A single component that covers both readonly display and interactive editing via a `readOnly`
prop. It must be a client component (`"use client"`).

### Props

```ts
type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void; // omitted when readOnly
  language?: string;                  // e.g. "typescript", "bash" — falls back to "plaintext"
  readOnly?: boolean;                 // default false
  accentColor?: string;               // hex — used for focus ring, matches item type color
};
```

### Editor header (always visible)

Rendered above the Monaco instance, inside the same container:

```
┌─────────────────────────────────────────────┐
│  ● ● ●   typescript                   Copy  │
├─────────────────────────────────────────────┤
│                                             │
│   Monaco editor area                        │
│                                             │
└─────────────────────────────────────────────┘
```

- **macOS window dots** — three solid circles, left-aligned, fixed colors:
  - Close: `#ff5f57`
  - Minimise: `#febc2e`
  - Maximise: `#28c840`
  - Size: `10–11px` diameter, `6px` gap between dots, `12–14px` left padding
  - These are decorative only (no click handlers)
- **Language label** — shown to the right of the dots, lowercase, same muted foreground color as
  the rest of the UI (`text-muted-foreground`, `text-xs`). Shows the `language` prop value, or
  nothing if not set.
- **Copy button** — right-aligned in the header row
  - Icon: `Copy` (Lucide), 13–14px
  - On click: writes `value` to clipboard; icon swaps to `Check` (green) for 2 seconds
  - Button is present in both readonly and edit modes
  - Label/tooltip: `"Copy"`

### Monaco editor area

- **Package:** `@monaco-editor/react` (install it)
- **Theme:** `vs-dark` always (the app is dark-mode first; do not switch based on system theme)
- **Height:** fluid — no fixed pixel height. The container grows with content up to `400px`,
  after which the Monaco instance scrolls internally. Use Monaco's `automaticLayout: true`
  option so it fills the container.
  - Implementation approach: render Monaco inside a `div` that has `max-h-[400px]` and
    `overflow-hidden`; pass `height="100%"` to `<Editor />` and set a minimum height of `160px`
    on the wrapper div.
- **Scrollbar:** configure Monaco's scrollbar options to look clean and theme-consistent:
  ```ts
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
    useShadows: false,
  }
  ```
- **Other Monaco options (both modes):**
  ```ts
  minimap: { enabled: false },
  fontSize: 12,
  lineHeight: 20,
  fontFamily: 'var(--font-geist-mono), "JetBrains Mono", monospace',
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollBeyondLastLine: false,
  wordWrap: "on",
  ```
- **Read-only mode** (`readOnly: true`):
  - Set `readOnly: true` in Monaco options
  - Disable the cursor (set `cursorStyle: "line"` and override `cursorBlinking: "hidden"`)
  - Do not show a blinking caret
- **Edit mode** (`readOnly: false`):
  - Full editing enabled
  - Apply `accentColor` as an outline glow on focus (match the existing focus ring pattern used
    by `EditTextarea` in `item-drawer.tsx`: `boxShadow: 0 0 0 3px ${accentColor}20`)
  - Wrap Monaco in a `div` that gains/loses this box-shadow on Monaco's `onMount` using the
    editor's focus/blur events (`editor.onDidFocusEditorWidget` / `editor.onDidBlurEditorWidget`)

### Container / visual wrapper

- Background: `bg-[#1e1e1e]` (VS Dark background — do not use a Tailwind theme color so it stays
  fixed regardless of light/dark toggle)
- Border: `border border-border rounded-md overflow-hidden`
- Header background: slightly lighter than the editor — `bg-[#252526]`
- Header height: `32px` (`h-8`), `flex items-center px-3`
- Divider: `border-b border-[#3e3e42]` between header and editor

---

## Integration points

### 1. Item Drawer — view mode (`item-drawer.tsx`)

Currently (line ~490):
```tsx
<pre className="rounded-md bg-muted px-4 py-3 text-xs font-mono leading-relaxed
     whitespace-pre overflow-x-auto max-h-[260px] overflow-y-auto">
  {item.content}
</pre>
```

Replace with `<CodeEditor>` **when `typeName` is `"snippet"` or `"command"`**:
```tsx
<CodeEditor
  value={item.content ?? ""}
  language={item.language ?? undefined}
  readOnly
/>
```

Keep the existing `<pre>` for prompt and note (those are `showContent` types but not
`showLanguage` types — use `showLanguage` / `LANGUAGE_TYPES` as the condition).

The existing action-bar **Copy** button (`copyContent()`) remains unchanged — the in-editor
copy button is an additional convenience, not a replacement.

### 2. Item Drawer — edit mode (`item-drawer.tsx`)

Currently (line ~399):
```tsx
<EditTextarea
  value={editState.content}
  onChange={field("content")}
  placeholder="Content…"
  mono
  resizable
  accentColor={item.itemType.color}
  className="px-4 py-3 text-xs leading-relaxed min-h-[260px]"
/>
```

Replace with `<CodeEditor>` **only when `showLanguage` is true** (snippet / command):
```tsx
<CodeEditor
  value={editState.content}
  onChange={(val) => setEditState((prev) => prev && { ...prev, content: val })}
  language={editState.language || undefined}
  accentColor={item.itemType.color}
/>
```

Keep `<EditTextarea>` for prompt and note (they are `showContent` but not `showLanguage`).

### 3. New Item Dialog — create mode (`new-item-dialog.tsx`)

Currently (line ~201):
```tsx
<textarea
  id="ni-content"
  ...
  className={`... ${isMonoContent ? "font-mono" : ""}`}
/>
```

Replace with `<CodeEditor>` **when `isMonoContent` is true** (snippet / command):
```tsx
<CodeEditor
  value={form.content}
  onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
  language={form.language || undefined}
  accentColor={selectedType.color}
/>
```

Keep the plain `<textarea>` for prompt and note.

**Note on language reactivity in the dialog:** the language field is filled separately. The
`language` prop passed to `CodeEditor` should read `form.language` so Monaco syntax highlighting
updates live as the user types a language name.

---

## Package installation

```bash
npm install @monaco-editor/react
```

`@monaco-editor/react` bundles Monaco via the `monaco-editor` peer. No webpack/Next.js config
changes are needed — Monaco loads lazily client-side.

Use dynamic import with `ssr: false` when importing `CodeEditor` in server-component files or
layouts to avoid SSR issues:

```tsx
const CodeEditor = dynamic(
  () => import("@/components/items/code-editor").then((m) => m.CodeEditor),
  { ssr: false }
);
```

Apply this in `item-drawer.tsx` and `new-item-dialog.tsx` (both are already `"use client"`, but
the Monaco bundle is large — dynamic import keeps the initial client bundle smaller).

---

## What does NOT change

- `EditTextarea` component — kept for description, prompt content, note content
- `EditInput` component — kept for title, URL, language, tags
- The global Copy button in the item drawer action bar — still present, still works
- All item types other than snippet and command — no visual change anywhere
- Scrollbar styling outside the editor — unchanged
