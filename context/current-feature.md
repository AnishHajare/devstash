# Current Feature

## Status

## Goals

## Notes

## History

<!-- Keep this updated. Earliest to latest -->
- 2026-03-26: Completed Dashboard Items — replaced mock item data with real Prisma queries (src/lib/db/items.ts), pinned items, recent items, item stats, item type icons/colors from DB, tags from DB, pinned section hidden when empty.
- 2026-03-24: Initial Next.js 16 + Tailwind CSS v4 setup. Cleaned boilerplate, stripped default styles and SVGs.
- 2026-03-25: Completed Dashboard UI Phase 1 — ShadCN setup, /dashboard route, dark mode by default (Inter + JetBrains Mono fonts), top bar with search and new item button, sidebar and main area placeholders.
- 2026-03-25: Completed Dashboard UI Phase 2 — Collapsible sidebar with colorful item type icons and counts, links to /items/TYPE, collapsible favorite and all collections sections, user avatar area, drawer toggle, mobile sheet drawer.
- 2026-03-25: Completed Dashboard UI Phase 3 — Main content area with stats cards, collections grid, pinned items, and recent items list using mock data.
- 2026-03-25: Completed Prisma + Neon PostgreSQL setup — Prisma 7 with Neon adapter, full schema (User, Account, Session, VerificationToken, ItemType, Item, Collection, ItemCollection, Tag), snake_case table names via @@map, initial migration, seed script for 7 system item types, db scripts in package.json, Node.js upgraded to v22.
- 2026-03-25: Expanded seed script — added password field to User model, demo user (demo@devstash.io, hashed password via bcryptjs), 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources), 21 items (snippets, prompts, commands, links), tags, favorites, and pinned items.
- 2026-03-25: Completed Dashboard Collections — replaced mock collection data with real Prisma queries (src/lib/db/collections.ts), async server component fetching, collection card border color from dominant type, type icons per collection, real collection stats.
