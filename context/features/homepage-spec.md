# Homepage Spec

## Overview

Convert the static prototype at `prototypes/homepage/` into the real Next.js app homepage at `/` (`src/app/page.tsx`). Preserve the design, layout, copy, and animations from the mockup while using Tailwind CSS and shadcn/ui consistent with the rest of the project.

## Sections

1. **Header** — fixed top bar with logo/brand, nav links (Features, Pricing as anchor links), Sign in link (`/sign-in`), Start free CTA (`/register`)
2. **Hero** — eyebrow text, headline, subheadline, two CTAs: "Get Started Free" (`/register`), "See Features" (anchor `#features`)
3. **Features** (`#features`) — heading + 6 feature cards in a 3-col grid (Code Snippets, AI Prompts, Instant Search, Commands, Files & Docs, Collections)
4. **AI Section** (`#ai`) — heading + code editor mockup panel with typing animation and citation sidebar
5. **Organization Section** (`#organization`) — dark background, two-column layout with heading + 3 info cards (Collections, Favorites and pins, Rich item types)
6. **Pricing** (`#pricing`) — heading + 2 pricing cards (Free / Pro) with feature lists
7. **CTA Section** — closing call-to-action with "Start building" button (`/register`)

## Component Breakdown

### Server Components (no interactivity)
- `src/app/page.tsx` — root page, composes all sections
- `src/components/homepage/hero-section.tsx`
- `src/components/homepage/features-section.tsx`
- `src/components/homepage/organization-section.tsx`
- `src/components/homepage/pricing-section.tsx`
- `src/components/homepage/cta-section.tsx`

### Client Components (`'use client'`)
- `src/components/homepage/homepage-header.tsx` — needs scroll-aware sticky background opacity
- `src/components/homepage/ai-section.tsx` — typing animation (setInterval-based text reveal)
- `src/components/homepage/cloud-background.tsx` — scroll-driven parallax clouds + cursor-following light effect (mousemove + scroll listeners, requestAnimationFrame)
- `src/components/homepage/reveal-on-scroll.tsx` — reusable IntersectionObserver wrapper that adds fade-in + blur + translateY animation to children

## Links and Buttons

| Element | Destination |
|---|---|
| Logo / brand | `/` |
| Sign in (header) | `/sign-in` |
| Start free (header CTA) | `/register` |
| Get Started Free (hero) | `/register` |
| See Features (hero) | `#features` anchor |
| Features nav link | `#features` anchor |
| Pricing nav link | `#pricing` anchor |
| Free plan "Get started" | `/register` |
| Pro plan "Start free trial" | `/register` |
| CTA "Start building" | `/register` |

## Styling

- Use Tailwind classes for all layout and styling — no separate CSS file for the homepage
- Add any needed custom CSS (cloud parallax, cursor light, typing caret animation) to `src/app/globals.css` scoped under a `.homepage-` prefix
- Use the same color palette from the prototype (`--bg: #0b0c13`, `--surface: #12131c`, blues, violets, cyans)
- Define homepage-specific theme tokens in `globals.css` via `@theme` if needed
- Fonts: use the project's existing Inter font; add Space Grotesk via `@fontsource-variable` for headings (same pattern as existing font setup)
- SVG logo inline in the header component
- Feature card icons as inline SVGs (same paths from prototype)
- Responsive: 3-col grid -> 2-col -> 1-col for feature cards; 2-col -> 1-col for pricing; hide nav links on mobile

## Animations

- **Reveal on scroll** — IntersectionObserver adds `is-visible` class triggering opacity 0->1, blur 10px->0, translateY 40px->0 over 700ms. Support `data-delay` for staggered reveals.
- **Cloud parallax** — 6 decorative blurred cloud blobs that drift based on scroll position. Cursor-following radial gradient light. Use CSS custom properties (`--scroll`, `--cloud-alpha`, `--x`, `--y`) driven by JS.
- **Typing animation** — code editor panel types out lines character by character with a blinking caret.
- **Hover micro-interactions** — cards lift translateY(-3px) on hover, buttons get enhanced box-shadow.
- Respect `prefers-reduced-motion` — disable animations when the user prefers reduced motion.

## Technical Notes

- Keep the root `page.tsx` clean — import and compose section components
- No data fetching needed — this is a fully static marketing page
- Use Next.js `Link` for internal routes (`/sign-in`, `/register`)
- Use `<a href="#section">` for same-page anchor links
- Add `scroll-behavior: smooth` and `scroll-padding-top` for the fixed header
- The page should NOT use the dashboard layout/shell

## References

- `prototypes/homepage/index.html` — structure and copy
- `prototypes/homepage/styles.css` — visual design and animations
- `prototypes/homepage/script.js` — interaction logic
- `context/project-overview.md` — pricing details and feature list
