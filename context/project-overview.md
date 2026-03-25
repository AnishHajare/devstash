# DevStash — Project Overview

> **One hub for all your developer knowledge.** Snippets, prompts, commands, notes, links, and files — searchable, organized, and AI-enhanced.

---

## 1. Problem

Developers keep their essentials scattered across too many tools:

| What | Where it ends up |
|---|---|
| Code snippets | VS Code, Notion, GitHub Gists |
| AI prompts | Chat histories |
| Context files | Buried in project folders |
| Useful links | Browser bookmarks |
| Docs & notes | Random folders, Google Docs |
| Commands | `.txt` files, bash history |
| Templates | Gists, boilerplate repos |

This causes **context switching**, **lost knowledge**, and **inconsistent workflows**.

**DevStash** solves this by providing a single, fast, searchable, AI-enhanced hub for all developer knowledge and resources.

---

## 2. Target Users

| Persona | Needs |
|---|---|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-first Developer** | Saved prompts, contexts, workflows, system messages |
| **Content Creator / Educator** | Code blocks, explanations, course notes |
| **Full-stack Builder** | Patterns, boilerplates, API examples |

---

## 3. Features

### A. Items & Item Types

Items are the core unit of DevStash. Each item has a **type** that determines its behavior and appearance. Users start with system types (non-editable) and can create custom types on Pro.

A type's `contentType` determines how it stores data:

- **`text`** — snippet, prompt, note, command (stored as text/markdown)
- **`url`** — link (stored as a URL string)
- **`file`** — file, image (uploaded to Cloudflare R2) *(Pro only)*

**System Types:**

| Type | Icon | Color | Content Type | Pro Only |
|---|---|---|---|---|
| Snippet | `Code` | `#3b82f6` (blue) | text | No |
| Prompt | `Sparkles` | `#8b5cf6` (purple) | text | No |
| Command | `Terminal` | `#f97316` (orange) | text | No |
| Note | `StickyNote` | `#fde047` (yellow) | text | No |
| Link | `Link` | `#10b981` (emerald) | url | No |
| File | `File` | `#6b7280` (gray) | file | Yes |
| Image | `Image` | `#ec4899` (pink) | file | Yes |

> Icons sourced from [Lucide Icons](https://lucide.dev/).

**URL pattern:** `/items/snippets`, `/items/prompts`, etc.

Items should be quick to create and access via a **slide-out drawer**.

### B. Collections

Users organize items into collections. An item can belong to **multiple** collections (many-to-many via join table).

Examples:

- "React Patterns" → snippets, notes
- "Context Files" → files
- "Interview Prep" → snippets, prompts, links

### C. Search

Full search across content, tags, titles, and types.

### D. Authentication

- Email/password sign-in
- GitHub OAuth sign-in
- Powered by **NextAuth v5**

### E. Core UX Features

- Favorite collections and items
- Pin items to top
- Recently used items
- Import code from a file
- Markdown editor for text-based types
- File upload for file types (file, image)
- Export data (JSON/ZIP) *(Pro only)*
- Dark mode default, light mode optional
- Add/remove items to/from multiple collections
- View which collections an item belongs to

### F. AI Features *(Pro only)*

- **AI Auto-Tag Suggestions** — suggest tags based on item content
- **AI Summaries** — generate a short summary for any item
- **AI Explain This Code** — plain-language explanation of a snippet
- **AI Prompt Optimizer** — improve and refine saved prompts

---

## 4. Data Models

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│     User     │       │      Item        │       │  Collection  │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id           │──┐    │ id               │    ┌──│ id           │
│ isPro        │  │    │ title            │    │  │ name         │
│ stripeCustom │  ├───▶│ content          │    │  │ description? │
│ stripeSub    │  │    │ contentType      │    │  │ isFavorite   │
│ ...NextAuth  │  │    │ fileUrl?         │    │  │ defaultTypeId│
└──────────────┘  │    │ fileName?        │    │  │ userId       │
                  │    │ fileSize?        │    │  │ createdAt    │
                  │    │ url?             │    │  │ updatedAt    │
                  │    │ description?     │    │  └──────────────┘
                  │    │ isFavorite       │    │
                  │    │ isPinned         │    │
                  │    │ language?        │    │
                  │    │ userId           │    │
                  │    │ itemTypeId       │    │
                  │    │ createdAt        │    │  ┌──────────────────┐
                  │    │ updatedAt        │    │  │ ItemCollection   │
                  │    └──────────────────┘    │  ├──────────────────┤
                  │             │              │  │ itemId      ──┐  │
                  │             │              └──│ collectionId  │  │
                  │             ▼                 │ addedAt       │  │
                  │    ┌──────────────────┐       └───────────────┘  │
                  │    │    ItemType      │              ▲           │
                  │    ├──────────────────┤              │           │
                  │    │ id               │              └───────────┘
                  │    │ name             │
                  │    │ icon             │       ┌──────────────┐
                  │    │ color            │       │     Tag      │
                  │    │ isSystem         │       ├──────────────┤
                  └───▶│ userId?          │       │ id           │
                       └──────────────────┘       │ name         │
                                                  └──────────────┘
                                                        ▲
                                                        │ (many-to-many
                                                        │  via _ItemTags)
                                                        ▼
                                                      Item
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth (NextAuth v5) ────────────────────────────────────

model User {
  id                  String       @id @default(cuid())
  name                String?
  email               String?      @unique
  emailVerified       DateTime?
  image               String?
  isPro               Boolean      @default(false)
  stripeCustomerId    String?      @unique
  stripeSubscriptionId String?     @unique

  accounts            Account[]
  sessions            Session[]
  items               Item[]
  collections         Collection[]
  itemTypes           ItemType[]

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Account {
  id                  String   @id @default(cuid())
  userId              String
  type                String
  provider            String
  providerAccountId   String
  refresh_token       String?
  access_token        String?
  expires_at          Int?
  token_type          String?
  scope               String?
  id_token            String?
  session_state       String?

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Core Models ───────────────────────────────────────────

model ItemType {
  id        String   @id @default(cuid())
  name      String                         // "snippet", "prompt", etc.
  icon      String                         // Lucide icon name
  color     String                         // Hex color
  isSystem  Boolean  @default(false)       // true = built-in, non-deletable
  userId    String?                        // null for system types

  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     Item[]

  @@unique([name, userId])                 // unique type names per user
}

model Item {
  id          String           @id @default(cuid())
  title       String
  contentType String           // "text" | "url" | "file"
  content     String?          // text/markdown content (null if file)
  fileUrl     String?          // Cloudflare R2 URL (null if text)
  fileName    String?          // original filename (null if text)
  fileSize    Int?             // bytes (null if text)
  url         String?          // for link types
  description String?
  isFavorite  Boolean          @default(false)
  isPinned    Boolean          @default(false)
  language    String?          // programming language (optional)

  userId      String
  itemTypeId  String

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemType    ItemType         @relation(fields: [itemTypeId], references: [id])
  collections ItemCollection[]
  tags        Tag[]

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

model Collection {
  id            String           @id @default(cuid())
  name          String                             // "React Hooks", "Context Files"
  description   String?
  isFavorite    Boolean          @default(false)
  defaultTypeId String?                            // default item type for new items

  userId        String

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items         ItemCollection[]

  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([userId])
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[]
}
```

> **Important:** Never use `db push` or directly modify the database structure. Always create Prisma migrations (`prisma migrate dev`) that can be run in dev and then in production.

---

## 5. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 16 / React 19 | SSR pages with dynamic client components. API routes for backend. |
| **Language** | TypeScript | Full type safety across the codebase. |
| **Database** | Neon PostgreSQL | Serverless Postgres in the cloud. |
| **ORM** | Prisma 7 | Latest version. Fetch latest docs before implementation. |
| **Auth** | NextAuth v5 | Email/password + GitHub OAuth. |
| **File Storage** | Cloudflare R2 | S3-compatible. Used for file and image uploads. |
| **AI** | OpenAI `gpt-5-nano` | Lightweight model for auto-tagging, summaries, code explanation, prompt optimization. |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with pre-built accessible components. |
| **Caching** | Redis *(potential)* | For frequently accessed data. Evaluate need during development. |

### Key Architecture Decisions

- **Single repo/codebase** — less overhead, simpler deploys.
- **SSR pages with dynamic components** — fast initial load, interactive where needed.
- **API routes for backend** — file uploads, AI calls, CRUD operations.
- **Migration-based DB changes only** — `prisma migrate dev` in development, `prisma migrate deploy` in production.

---

## 6. Monetization

### Free Tier

- 50 items total
- 3 collections
- All system types **except** File and Image
- Basic search
- No file/image uploads
- No AI features

### Pro Tier — $8/month or $72/year (save 25%)

- Unlimited items
- Unlimited collections
- File & Image uploads
- Custom types *(coming later)*
- AI auto-tagging
- AI code explanation
- AI prompt optimizer
- Export data (JSON/ZIP)
- Priority support

### Implementation Note

Set up the foundation for Pro (Stripe integration, `isPro` flag, feature gates), but **during development all users can access everything**. Enforce limits closer to launch.

---

## 7. UI / UX

### Design Principles

- Modern, minimal, developer-focused
- Dark mode by default, light mode optional
- Clean typography, generous whitespace
- Subtle borders and shadows
- Syntax highlighting for code blocks (use [Shiki](https://shiki.style/) or [Prism](https://prismjs.com/))

**Design references:** Notion, Linear, Raycast

### Screenshots
Refere to the Screenshots below as a base for the dashboard UI. It does not have to exact use it as a reference:
- @context/screenshots/dashboard-ui-drawer.png
- context/screenshots/dashboard-ui-main.png

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Logo / Brand                           User Avatar │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  SIDEBAR   │           MAIN CONTENT                 │
│            │                                        │
│  ┌──────┐  │  Collections (color-coded cards)       │
│  │Types │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │──────│  │  │ React   │ │ Python  │ │ Context │  │
│  │Snippe│  │  │ Patterns│ │ Scripts │ │ Files   │  │
│  │Prompt│  │  └─────────┘ └─────────┘ └─────────┘  │
│  │Comman│  │                                        │
│  │Notes │  │  Items (color-coded border cards)      │
│  │Links │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Files │  │  │ useAuth │ │ Deploy  │ │ API     │  │
│  │Images│  │  │ Hook    │ │ Script  │ │ Cheat   │  │
│  └──────┘  │  └─────────┘ └─────────┘ └─────────┘  │
│            │                                        │
│  ┌──────┐  │                                        │
│  │Latest│  │         ┌───────────────────┐          │
│  │Collec│  │         │  Item Drawer ───▶ │          │
│  │tions │  │         │  (slides in from  │          │
│  └──────┘  │         │   the right)      │          │
│            │         └───────────────────┘          │
├────────────┴────────────────────────────────────────┤
```

- **Sidebar:** Item types (with icons + counts), latest collections, favorites. Collapsible on desktop, becomes a drawer on mobile.
- **Main content:** Grid of collection cards (background color = dominant item type color). Items displayed as color-coded cards (border color = item type color).
- **Item detail:** Opens in a slide-out drawer for quick access.

### Type Colors Reference (CSS variables)

```css
:root {
  --color-snippet:  #3b82f6;  /* blue    */
  --color-prompt:   #8b5cf6;  /* purple  */
  --color-command:  #f97316;  /* orange  */
  --color-note:     #fde047;  /* yellow  */
  --color-file:     #6b7280;  /* gray    */
  --color-image:    #ec4899;  /* pink    */
  --color-link:     #10b981;  /* emerald */
}
```

### Responsive Behavior

- Desktop-first, mobile-usable
- Sidebar collapses into a hamburger drawer on mobile
- Cards reflow from multi-column grid to single-column

### Micro-interactions

- Smooth transitions on navigation and drawer open/close
- Hover states on cards (subtle scale + shadow)
- Toast notifications for create/update/delete actions
- Loading skeletons while data is fetching

---

## 8. Routes (Planned)

| Route | Description |
|---|---|
| `/` | Landing page (marketing) |
| `/dashboard` | Main dashboard — collections + recent items |
| `/items/[type]` | Filtered items by type (e.g., `/items/snippets`) |
| `/collections/[id]` | Collection detail — items within |
| `/search` | Global search results |
| `/settings` | User settings, account, billing |
| `/api/items` | CRUD for items |
| `/api/collections` | CRUD for collections |
| `/api/ai/*` | AI feature endpoints |
| `/api/upload` | File upload to R2 |
| `/api/auth/*` | NextAuth routes |

---

## 9. Development Notes

- **Prisma migrations only** — never `db push`. Run `prisma migrate dev` locally, `prisma migrate deploy` in production.
- **Fetch latest Prisma 7 docs** before implementation — APIs may have changed.
- **Pro features gated but unlocked** during development. Add Stripe integration and enforce limits before launch.
- **Seed system types** on first migration — the 7 built-in types (snippet, prompt, command, note, link, file, image) should be seeded into the database with `isSystem: true` and `userId: null`.