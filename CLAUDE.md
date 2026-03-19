# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for a tech lead, built with **Astro 4** + **TypeScript** + **MDX** + **Tailwind CSS**. Content-focused site with blog posts, notes, projects, and talks sections. Deployed to a staging environment via GitHub Actions + Docker + nginx.

**Package manager**: bun (not npm or yarn)

---

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server at http://localhost:4321
bun run build        # Build production static output to dist/
bun run preview      # Preview built site locally
bun run check        # Run Astro type checker (tsc + Astro diagnostics)
```

**Note**: No test framework is configured.

---

## Architecture

### Content Collections

All content lives in `src/content/` with four collections, each defined in `src/content/config.ts` with strict Zod schemas:

| Collection | Schema highlights |
|------------|-------------------|
| `blog` | title, description, pubDate, tags[], pinned? |
| `notes` | title?, date, tags[], link? (wiki-style `[[slug]]` links supported) |
| `projects` | title, description, year, tags[], status: active/paused/archived |
| `talks` | title, description, date, event, location?, slides? |

### Path Aliases

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@layouts/*` → `src/layouts/*`
- `@lib/*` → `src/lib/*`

### Theming

CSS custom properties in `src/styles/global.css` under `:root` and `.dark`. The site supports light/dark/system modes.

### Base Path

The `BASE_PATH` environment variable (default: `/staging`) controls deployment context:
- `/staging` → `https://www.winter-prosper.com/staging`
- `/` (or anything else) → `https://www.winter-prosper.com`

---

## Deployment

GitHub Actions pipeline (`.github/workflows/deploy.yml`) handles CI/CD:
1. On push to `main` branch → build with `bun run build`
2. rsync `dist/` to staging server via SSH
3. Restart Docker container serving the static files

Infrastructure configs live in `infra/`:
- `infra/docker/` — Docker / nginx configuration
- `infra/server-setup.sh` — Server initialization script

---

## Key Files

| File | Purpose |
|------|---------|
| `src/content/config.ts` | Zod schemas for all content collections |
| `src/lib/config.ts` | Site-wide configuration (name, description, links) |
| `src/lib/utils.ts` | Helper functions (slugify, formatDate, parseWikiLinks) |
| `astro.config.mjs` | Astro config: site URL, base path, integrations (MDX, Tailwind), Shiki code highlighting |
| `tailwind.config.mjs` | Tailwind config with custom theme extending `@tailwindcss/typography` |
| `deploy.sh` | Manual deploy shortcut script |
