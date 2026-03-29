# Current Feature

## Status

In Progress

## Goals

Address low-risk quick wins identified by the code-scanner audit to improve code quality, performance, and maintainability.

## Quick Wins

- [x] Extract shared `iconMap` from `dashboard-main.tsx` and `sidebar-content.tsx` into `src/lib/icon-map.ts`
- [x] Use `findUnique` instead of `findFirst` in `getDemoUserId` (`src/app/dashboard/page.tsx`)
- [x] Add explicit `DATABASE_URL` guard in `src/lib/prisma.ts` instead of non-null assertion
- [x] Add `aria-label="Collection options"` to overflow menu button in `dashboard-main.tsx`
- [x] Extract duplicated avatar initials logic in `sidebar-content.tsx` into a utility

## Notes

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
