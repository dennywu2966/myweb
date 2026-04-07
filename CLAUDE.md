# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for a tech lead, built with **Astro 4** + **TypeScript** + **MDX** + **Tailwind CSS**. Content-focused site with blog posts, notes, projects, and talks sections. Site language is `zh-CN`. Deployed to staging via GitHub Actions + Docker + nginx.

**Package manager**: bun (not npm or yarn)

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server at http://localhost:4321
bun run build        # Build production static output to dist/
bun run preview      # Preview built site locally
bun run check        # Run Astro type checker (tsc + Astro diagnostics)
```

No test framework is configured. Validate changes with `bun run build` (catches type errors and broken references).

## Architecture

### Content Collections

All content lives in `src/content/` with four collections defined in `src/content/config.ts` (Zod schemas):

| Collection | Schema highlights |
|------------|-------------------|
| `blog` | title, description, pubDate, updatedDate?, tags[]?, heroImage?, pinned? |
| `notes` | title?, date, tags[]?, link? |
| `projects` | title, description, year, tags[]?, url?, status: active/paused/archived |
| `talks` | title, description, date, event, location?, url?, slides? |

**Content query patterns**: `getCollection('blog')` → sort by `.data.pubDate` descending. Blog index puts pinned posts first. Homepage shows 5 featured blog posts + 4 recent notes.

### Layout Composition

Two-layer layout system:

1. **Base.astro** — Root HTML, meta tags (OpenGraph/Twitter Card), theme init script, sticky header with nav + theme toggle, footer. Props: `title`, `description?`, `ogImage?`, `article?`.
2. **Post.astro** — Wraps Base. Blog post-specific: pinned badge, title, date, reading time, tags. Props: `post: CollectionEntry<'blog'>`.

Notes pages do NOT use Post.astro — they render standalone within Base.astro, with body as `<p class="whitespace-pre-wrap">`.

### Page Routing

- **Static pages**: `/`, `/about`, `/archive`, `/now`, `/uses`
- **Collection indexes**: `/blog/`, `/notes/`, `/projects/`, `/talks/`
- **Dynamic routes**: `/blog/[slug].astro`, `/notes/[slug].astro` (use `getStaticPaths()`)
- **Feeds**: `/rss.xml` (blog), `/notes/rss.xml` (notes), `/sitemap.xml` (custom, not @astrojs/sitemap)

### BASE_PATH

`src/lib/base.ts` exports `BASE_PATH` (env var, default: `/staging`). This value is used in **all navigation links** throughout the site (`${BASE_PATH}/blog`, etc.) and controls the Astro `site` + `base` config in `astro.config.mjs`.

### Theming

- Dark mode uses `class` strategy (Tailwind `darkMode: 'class'`)
- Theme init runs as inline script in Base.astro **before hydration** to prevent flash — reads `localStorage.theme` or system preference, toggles `.dark` class on `<html>`
- CSS custom properties in `src/styles/global.css` under `:root` (light) and `.dark` scopes
- Warm palette: parchment light (#faf8f5), dark oak (#131210), warm brown accent

### Styling Layers

`src/styles/global.css` uses `@layer`:
- **base**: font imports (Geist), CSS custom properties, html/body defaults
- **components**: `.prose-custom` (prose + theme colors), `.link-underline` (animated hover), `.nav-link`
- **utilities**: `.text-balance`, `.divider`

### Path Aliases

`@/*` → `src/*`, `@components/*`, `@layouts/*`, `@lib/*`

## Code Style

### Imports

Sort: external packages → internal aliases → relative imports.

```typescript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import Header from '@/components/Header.astro';
import { siteConfig } from '@/lib/config';
```

### TypeScript

- Strict mode (`astro/tsconfigs/strict`). Avoid `any`; use `unknown` when type is truly unknown.
- **Interfaces** for object shapes; **type aliases** for unions/intersections.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over verbose null checks.

### Astro Components

- Use `.astro` for static markup; `.ts`/`.tsx` only when client-side JS is needed.
- Keep frontmatter (`---` block) logic minimal; prefer importing from `src/lib/`.
- Props via `interface Props` + destructure from `Astro.props`.

### Tailwind CSS

- Use CSS custom properties (`var(--color-*)`) for theme values.
- Use `dark:` prefix for dark mode styles.
- Use `@apply` sparingly; prefer utility classes in markup.

### File Naming

- **Components**: PascalCase (`Header.astro`, `BlogCard.astro`)
- **Utilities/Lib**: camelCase (`utils.ts`, `config.ts`)
- **Pages**: lowercase with hyphens (`[slug].astro`, `rss.xml.js`)
- **Content**: lowercase with hyphens (`my-post.md`)

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to `main` → bun build → rsync dist/ to server → reload nginx. Infrastructure in `infra/` (Docker/nginx config, server-setup script).

## Key Files

| File | Purpose |
|------|---------|
| `src/content/config.ts` | Zod schemas for all content collections |
| `src/lib/config.ts` | Site-wide configuration (title, author, social links) |
| `src/lib/base.ts` | `BASE_PATH` export used in all navigation |
| `src/lib/utils.ts` | `formatDate`, `formatDateShort` (zh-CN locale), `readingTime` |
| `astro.config.mjs` | Site URL, base path, MDX + Tailwind integrations, Shiki (github-dark) |
| `tailwind.config.mjs` | Custom neutral palette, Geist/Noto Sans SC fonts, typography plugin |
