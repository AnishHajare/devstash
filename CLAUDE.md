# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files
Read the following to get the full context of the project:
- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

There is no test runner configured.

## Neon MCP

When using the Neon MCP tools, **always** target the **devstash** project and the **development** branch. Never read from, write to, or run queries against the production branch (typically `main` or `production`) unless explicitly instructed. If a Neon tool call requires a branch parameter, default to `development`. This applies to all operations: queries, schema changes, branching, and any other Neon API actions.

## Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss`; no `tailwind.config` file, theme customisation goes in `globals.css` using `@theme`
- **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`) — manual `useMemo`/`useCallback` is unnecessary
- Fonts loaded via `next/font/google` (Geist Sans + Geist Mono) and exposed as CSS variables `--font-geist-sans` / `--font-geist-mono`

## Structure

- `src/app/layout.tsx` — root layout; sets HTML lang, applies font variables, wraps children in a flex column body
- `src/app/globals.css` — only contains `@import "tailwindcss"`; add global styles or `@theme` tokens here
- `src/app/page.tsx` — home route (`/`)
