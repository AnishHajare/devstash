# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern for edge compatibility (`auth.config.ts` + `auth.ts`)
- Add GitHub OAuth provider
- Create API route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Protect `/dashboard/*` routes using Next.js 16 proxy (`src/proxy.ts`)
- Redirect unauthenticated users to sign-in
- Extend Session type with `user.id`

## Notes

- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Don't set custom `pages.signIn` — use NextAuth's default page
- Use Context7 to verify newest config and conventions before implementation
- Env vars needed: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`

## History

<!-- Keep this updated. Earliest to latest -->
- 2026-03-24: Initial Next.js 16 + Tailwind CSS v4 setup. Cleaned boilerplate, stripped default styles and SVGs.
- 2026-03-25: Completed Dashboard UI Phase 1 — ShadCN setup, /dashboard route, dark mode by default (Inter + JetBrains Mono fonts), top bar with search and new item button, sidebar and main area placeholders.
- 2026-03-25: Completed Dashboard UI Phase 2 — Collapsible sidebar with colorful item type icons and counts, links to /items/TYPE, collapsible favorite and all collections sections, user avatar area, drawer toggle, mobile sheet drawer.
- 2026-03-25: Completed Dashboard UI Phase 3 — Main content area with stats cards, collections grid, pinned items, and recent items list using mock data.
- 2026-03-25: Completed Prisma + Neon PostgreSQL setup — Prisma 7 with Neon adapter, full schema (User, Account, Session, VerificationToken, ItemType, Item, Collection, ItemCollection, Tag), snake_case table names via @@map, initial migration, seed script for 7 system item types, db scripts in package.json, Node.js upgraded to v22.
- 2026-03-25: Expanded seed script — added password field to User model, demo user (demo@devstash.io, hashed password via bcryptjs), 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources), 21 items (snippets, prompts, commands, links), tags, favorites, and pinned items.
- 2026-03-25: Completed Dashboard Collections — replaced mock collection data with real Prisma queries (src/lib/db/collections.ts), async server component fetching, collection card border color from dominant type, type icons per collection, real collection stats.
- 2026-03-26: Completed Dashboard Items — replaced mock item data with real Prisma queries (src/lib/db/items.ts), pinned items, recent items, item stats, item type icons/colors from DB, tags from DB, pinned section hidden when empty.
- 2026-03-26: Completed Stats & Sidebar — replaced all mock data in sidebar with real Prisma queries (getItemTypesWithCounts, getSidebarUser), item types with counts and custom display order, favorite collections with stars, recent collections with colored circles from dominant type, "View all collections" link, real user info in avatar area. Mock data no longer imported anywhere.
- 2026-03-29: Completed Sidebar Pro Badge — added PRO badge (shadcn/ui Badge, outline variant) next to File and Image types in sidebar, installed badge component, badge only shown for system pro-only types.
- 2026-03-29: Completed Audit Quick Wins — extracted shared iconMap to src/lib/icon-map.ts, used findUnique for demo user lookup, added DATABASE_URL env guard in prisma.ts, added aria-label to collection overflow button, extracted getInitials() utility in sidebar.
