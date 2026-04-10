# Markdown Editor Spec

## Overview

Add a `MarkdownEditor` component for `note` and `prompt` item types, replacing the plain `<textarea>` and `<pre>` used today. The component renders a tabbed Write/Preview interface with GitHub Flavored Markdown support and dark theme styling that matches the existing `CodeEditor`.

`snippet` and `command` types are unaffected — they keep `CodeEditor`.

---

## Affected Types

| Type | Content editor (new) | View mode (new) |
|---|---|---|
| `note` | `MarkdownEditor` (edit) | `MarkdownEditor` (readonly) |
| `prompt` | `MarkdownEditor` (edit) | `MarkdownEditor` (readonly) |
| `snippet` | `CodeEditor` — no change | `CodeEditor` — no change |
| `command` | `CodeEditor` — no change | `CodeEditor` — no change |

The distinction in code is `LANGUAGE_TYPES = ["snippet", "command"]`. Anything in `TEXT_CONTENT_TYPES` but not in `LANGUAGE_TYPES` gets `MarkdownEditor`.

---

## Component API

```tsx
type MarkdownEditorProps = {
  value: string;
  onChange?: (value: string) => void;  // omitted in readonly mode
  readOnly?: boolean;                   // default false
  accentColor?: string;                 // type color for focus ring
  placeholder?: string;
};
```

- When `readOnly` is `true`, the Write tab is hidden and only the Preview tab is shown (no tab bar needed — just render the preview directly with the same header).
- When `readOnly` is `false`, default to the Write tab. Preview tab is available to switch to.

---

## Tabs (Edit Mode)

```
┌─────────────────────────────────────────────────────────────────┐
│  Write │ Preview                                    [Copy]       │
├─────────────────────────────────────────────────────────────────┤
│  <textarea> or rendered markdown                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Write tab** — plain `<textarea>` for editing raw markdown. Same dark background (`#1e1e1e`), same font size (`text-sm`), no resize handle (use `resize-none`), fluid height up to 400px (min ~160px matching `CodeEditor`), scrollable.
- **Preview tab** — rendered markdown HTML styled with `.markdown-preview` CSS class (defined in `globals.css`). Same max height and scroll behavior.
- **Active tab indicator** — underline or subtle background highlight on the active tab. Inactive tabs are muted.
- **Copy button** — always visible in the header, copies the raw markdown value (same icon and style as `CodeEditor`: `Copy`/`Check` from Lucide, `hover:bg-white/10`).

### Readonly Mode Header

No tabs are rendered. Header shows only the Copy button (right-aligned), same as CodeEditor's readonly header.

---

## Styling

### Container / Header

Match `CodeEditor` exactly:

```
container: bg-[#1e1e1e], rounded-md border border-border overflow-hidden
header:    bg-[#252526] border-b border-[#3e3e42] h-8 px-3 flex items-center
```

### Write Tab — Textarea

```
textarea: w-full bg-[#1e1e1e] text-sm text-foreground placeholder:text-muted-foreground
          px-4 py-3 resize-none focus:outline-none
          min-h-[160px] max-h-[400px] overflow-y-auto
```

Apply the same focus ring as `CodeEditor` edit mode: `box-shadow: 0 0 0 3px {accentColor}20` on focus, removed on blur.

### Preview Tab — Markdown Rendering

Use a `<div className="markdown-preview">` wrapper. Add global styles in `src/app/globals.css` for `.markdown-preview`:

```css
.markdown-preview {
  /* layout */
  padding: 1rem;
  min-height: 160px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.875rem;   /* text-sm */
  line-height: 1.625;    /* leading-relaxed */
  color: hsl(var(--foreground));

  /* headings */
  h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; }
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.25em; }
  h3 { font-size: 1.1em; }
  h4, h5, h6 { font-size: 1em; }

  /* paragraphs */
  p { margin-bottom: 0.75em; }

  /* inline code */
  :not(pre) > code {
    background: rgba(255,255,255,0.08);
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-family: var(--font-geist-mono), monospace;
    font-size: 0.85em;
  }

  /* code blocks */
  pre {
    background: #2d2d2d;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    margin-bottom: 0.75em;
  }
  pre code {
    background: none;
    padding: 0;
    font-size: 0.85em;
    font-family: var(--font-geist-mono), monospace;
  }

  /* lists */
  ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75em; }
  ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75em; }
  li { margin-bottom: 0.25em; }

  /* blockquote */
  blockquote {
    border-left: 3px solid rgba(255,255,255,0.2);
    padding-left: 0.75rem;
    color: hsl(var(--muted-foreground));
    margin-bottom: 0.75em;
  }

  /* links */
  a { color: #3b82f6; text-decoration: underline; }
  a:hover { color: #60a5fa; }

  /* tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0.75em; font-size: 0.85em; }
  th { background: rgba(255,255,255,0.06); font-weight: 600; }
  th, td { border: 1px solid rgba(255,255,255,0.1); padding: 0.4em 0.75em; text-align: left; }

  /* horizontal rule */
  hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1em 0; }

  /* first child top margin reset */
  > *:first-child { margin-top: 0; }
}
```

---

## Dependencies

- `react-markdown` — renders markdown as React components
- `remark-gfm` — adds GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)

Install: `npm install react-markdown remark-gfm`

Do not add `rehype-highlight` or any syntax highlighter — preview code blocks are display-only and the plain dark background is sufficient.

---

## File Location

```
src/components/items/markdown-editor.tsx
```

Use `"use client"` directive. No SSR issues (no Monaco), so dynamic import is not needed — import directly.

---

## Integration Points

### 1. `NewItemDialog` — [src/components/items/new-item-dialog.tsx](src/components/items/new-item-dialog.tsx)

**Current code (line ~207–222):**
```tsx
{isMonoContent ? (
  <CodeEditor ... />
) : (
  <textarea ... />
)}
```

**After:** Add a third branch for markdown types:
```tsx
const isMarkdownContent = MARKDOWN_TYPES.includes(typeName); // ["note", "prompt"]

{isMonoContent ? (
  <CodeEditor ... />
) : isMarkdownContent ? (
  <MarkdownEditor
    value={form.content}
    onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
    accentColor={selectedType.color}
    placeholder="Write markdown..."
  />
) : (
  <textarea ... />  // fallback for any future plain-text types
)}
```

### 2. `ItemDrawer` — [src/components/items/item-drawer.tsx](src/components/items/item-drawer.tsx)

Add `const MARKDOWN_TYPES = ["note", "prompt"]` alongside the existing constants.
Derive `const showMarkdown = MARKDOWN_TYPES.includes(typeName)`.

**Edit mode (line ~403–420):**
```tsx
{showLanguage ? (
  <CodeEditor ... />
) : showMarkdown ? (
  <MarkdownEditor
    value={editState.content}
    onChange={(val) => setEditState((prev) => prev && { ...prev, content: val })}
    accentColor={item.itemType.color}
  />
) : (
  <EditTextarea ... />  // fallback
)}
```

**View mode (line ~505–515):**
```tsx
{showLanguage ? (
  <CodeEditor value={item.content} readOnly />
) : showMarkdown ? (
  <MarkdownEditor value={item.content} readOnly />
) : (
  <pre ...>{item.content}</pre>
)}
```

---

## Empty / Placeholder State

- In edit mode (Write tab), show placeholder text in the textarea when empty.
- In readonly mode, if `value` is an empty string, render nothing (the section is already conditionally rendered in the drawer: `{item.content && ...}`).
- In Preview tab with empty content, show a muted "Nothing to preview." line.

---

## What Not to Do

- Do not touch `CodeEditor`, `snippet`, or `command` rendering — no changes there.
- Do not add syntax highlighting to preview code blocks.
- Do not add a toolbar (bold, italic buttons, etc.) — Write tab is a plain textarea only.
- Do not use dynamic import unless SSR issues arise in testing.
