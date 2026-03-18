# AGENTS.md - Denny Personal Site

## Project Overview

This is a personal website built with Astro + TypeScript + MDX + Tailwind CSS. It is a content-focused site with blog posts, notes, projects, and talks sections.

## Tech Stack

- **Framework**: Astro 4
- **Language**: TypeScript (strict mode)
- **Content**: MDX with Zod schema validation
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Package Manager**: bun

---

## Build / Lint / Test Commands

### Installation
```bash
bun install
```

### Development
```bash
bun run dev      # Start dev server at http://localhost:4321
bun run start    # Alias for dev
```

### Production Build
```bash
bun run build    # Build for production
bun run preview  # Preview production build locally
```

### Type Checking
```bash
bun run check    # Run Astro type checker (tsc + Astro diagnostics)
```

### Single Command Reference
| Command | Purpose |
|---------|---------|
| `bun run dev` | Start development server |
| `bun run build` | Build production bundle |
| `bun run preview` | Preview built site |
| `bun run check` | Type-check all files |

**Note**: This project does not have a test framework configured. No test commands are available.

---

## Code Style Guidelines

### General Principles

- Use **TypeScript strict mode** (`astro/tsconfigs/strict`)
- Prefer **explicit types** over inference for function parameters and return types
- Use **astro components** (`.astro`) for static markup; use **`.ts`/`.tsx`** files only when client-side JS is needed
- Keep **logic in frontmatter** (`---` block) minimal; prefer importing from `src/lib/`

### Imports

- Use **path aliases**: `@/*` for `src/*`, `@components/*`, `@layouts/*`, `@lib/*`
- Sort imports: external packages first, then internal aliases, then relative imports
- Example:
  ```typescript
  import { defineConfig } from 'astro/config';
  import mdx from '@astrojs/mdx';
  import tailwind from '@astrojs/tailwind';
  import Header from '@/components/Header.astro';
  import { siteConfig } from '@/lib/config';
  ```

### TypeScript Conventions

- **Interfaces** for object shapes; **type aliases** for unions, intersections, and primitives
- Use **Zod schemas** (imported from `astro:content`) for content collection validation
- Avoid `any`; use `unknown` when type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of verbose null checks

### Astro Components (`.astro`)

- **Frontmatter** (`---`): TypeScript code runs at build time
- **Template**: HTML with expression interpolation `{variable}`
- **Styles**: Use `<style>` for component-scoped CSS or `<style is:global>` for global styles
- **Scripts**: Use `<script>` tag for client-side JavaScript (auto-bundled by Vite)

Example structure:
```astro
---
import { siteConfig } from '@/lib/config';
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<header>
  <h1>{title}</h1>
</header>

<style>
  header { /* ... */ }
</style>

<script>
  // Client-side JavaScript
</script>
```

### Tailwind CSS Conventions

- Use **CSS custom properties** (defined in `src/styles/global.css`) for theme values
- Access theme colors via `var(--color-*)` in component styles, or use Tailwind classes like `text-primary-600`
- Use `dark:` prefix for dark mode styles
- Use `@apply` sparingly; prefer utility classes directly in markup for readability

### File Naming

- **Components**: PascalCase (`Header.astro`, `BlogCard.astro`)
- **Utilities/Lib**: camelCase (`utils.ts`, `config.ts`)
- **Pages**: lowercase with hyphens (`[slug].astro`, `rss.xml.js`)
- **Content**: lowercase with hyphens (`my-post.md`, `vector-db-selection.md`)

### Content Schema (Zod)

Collections are defined in `src/content/config.ts` with strict schemas:
- `blog`: title, description, pubDate, tags[], heroImage?, pinned?
- `notes`: title?, date, tags[], link?
- `projects`: title, description, year, tags[], url?, status
- `talks`: title, description, date, event, location?, url?, slides?

### Error Handling

- Astro builds are **static**; runtime errors should not occur
- Use try/catch in frontmatter for async operations that could fail at build time
- For content collections, validation errors will fail the build (expected behavior)

### Theming

Theme uses CSS custom properties defined in `:root` and `.dark` in `global.css`:
```css
:root {
  --color-bg: #fafafa;
  --color-text: #171717;
  --color-border: #e5e5e5;
}
.dark {
  --color-bg: #171717;
  --color-text: #fafafa;
  --color-border: #262626;
}
```

### Markdown / MDX Content

- Use `---` frontmatter for metadata
- Wiki-style links: `[[note-slug]]` or `[[note-slug|Display Text]]` (processed by `parseWikiLinks`)
- MDX supports embedded components when needed

---

## Project Structure

```
src/
├── components/     # Astro components
├── layouts/        # Page layouts (Base.astro, Post.astro)
├── pages/          # Routes (blog/, notes/, projects/, talks/)
│   └── [slug].astro # Dynamic routes use [slug].astro naming
├── content/        # Content collections (blog/, notes/, projects/, talks/)
│   └── config.ts   # Zod schemas for all collections
├── lib/            # Utilities and config
│   ├── config.ts   # Site configuration
│   └── utils.ts    # Helper functions (slugify, formatDate, etc.)
└── styles/
    └── global.css  # CSS variables, base styles, Tailwind layers
```

---

## Common Tasks

### Add a Blog Post
Create `src/content/blog/my-post.md` with frontmatter:
```markdown
---
title: "Post Title"
description: "Description"
pubDate: 2024-01-15
tags: ["tag1", "tag2"]
---
Content...
```

### Add a Note
Create `src/content/notes/my-note.md`:
```markdown
---
title: "Optional Title"
date: 2024-01-15
tags: ["tag1"]
link: "https://..." # Optional external link
---
Content...
```

### Modify Site Config
Edit `src/lib/config.ts` to update site-wide metadata.

### Add Global CSS
Edit `src/styles/global.css`. Use `@layer base`, `@layer components`, or `@layer utilities`.
