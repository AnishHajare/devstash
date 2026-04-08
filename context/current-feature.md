# Current Feature: Item Drawer

## Status
In Progress

## Goals
- Clicking an ItemCard opens a right-side slide-in Sheet (shadcn) with that item's full details
- Works on both `/dashboard` and `/items/[type]` pages
- Action bar with Favorite (star, yellow when active), Pin, Copy, Edit (pencil), and Delete (trash, right-aligned)
- Client wrapper component manages drawer state (pages remain server components)
- Drawer fetches full item data on click via `/api/items/[id]` — shows skeleton while loading
- No page navigation — feels snappy

## Notes
- Card data already fetched by server component; full detail (content, collections, language, etc.) fetched on click
- Query function lives in `lib/db/items.ts`, API route calls it with auth check
- Content/editor area is out of scope for now — just drawer details display and action bar
- Reference design: `context/screenshots/dashboard-ui-drawer.png`

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
- 2026-03-31: Completed Auth Phase 1 — NextAuth v5 (beta) with Prisma adapter, GitHub OAuth provider, JWT session strategy, split auth config pattern, Next.js 16 proxy protecting /dashboard routes, session type extended with user.id.
- 2026-03-31: Completed Auth Phase 2 — Credentials provider for email/password sign-in (split config pattern), registration API route at /api/auth/register with validation, fixed proxy.ts to use Next.js 16 named export convention.
- 2026-03-31: Completed Auth Phase 3 — Custom sign-in page (/sign-in) with email/password and GitHub OAuth, register page (/register) with validation and success toast, sidebar user dropdown with avatar (image/initials), sign out, and profile link. Dashboard wired to real auth session.
- 2026-03-31: Completed Email Verification — verification email via Resend on registration, token generation and storage using VerificationToken model, /verify-email page with token validation, unverified users blocked from sign-in with clear error, resend verification option on sign-in page, expired/invalid token handling, GitHub OAuth users auto-verified.
- 2026-03-31: Completed Email Verification Toggle — added REQUIRE_EMAIL_VERIFICATION env flag (defaults to true). When false, registration auto-verifies users, sign-in skips verification check, and register form redirects to sign-in instead of showing "check email" screen.
- 2026-04-01: Completed Forgot Password — forgot password link on sign-in page, /forgot-password page with email form, /reset-password page with token validation and new password form, reuses VerificationToken model with "reset:" identifier prefix (no schema changes), 1-hour token expiry, password reset email via Resend, privacy-safe responses, OAuth-only users silently skipped.
- 2026-04-01: Completed Profile Page — /dashboard/profile route inside dashboard shell with sidebar, account information card (avatar, email, member since), usage statistics with per-type breakdown, change password for credentials users (with toast), delete account with typed "DELETE" confirmation dialog, shared dashboard layout extracted, optimized parallel Prisma queries.
- 2026-04-01: Completed Rate Limiting — Upstash Redis with sliding window algorithm via @upstash/ratelimit, 7 pre-configured limiters protecting all auth and profile endpoints (login, register, forgot-password, reset-password, resend-verification, change-password, delete-account), fail-open design, IP/email/userId composite keys, 429 responses with Retry-After headers, frontend forms display human-readable retry times.
- 2026-04-07: Completed Items List View — dynamic /items/[type] route with shared DashboardShell layout, ItemCard grid (two columns md+) with left color strip and hover tint, getItemsByType/getItemTypeByName DB queries (case-insensitive), canonical src/lib/item-type-slug.ts with typeNameToSlug/typeSlugToName used by all type-name/URL conversions.
- 2026-04-08: Items list grid updated to three columns on large screens (lg+), two on md, one on mobile. Single Tailwind class addition (lg:grid-cols-3) in /items/[type]/page.tsx.
