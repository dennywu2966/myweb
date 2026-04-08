# AI Digest Sub-site Design Spec

## Goal

Add an "AI Digest" sub-site at `/digest` that presents wiki-by-claude's ML knowledge base in a space exploration themed interface, with ambient audio and constellation-style concept navigation.

## Architecture

Astro content collection (`digest`) sourced from wiki-by-claude markdown. Independent layout (`DigestBase.astro`) with starfield CSS, separate from main site's warm editorial style. Custom remark plugin transforms `[[wikilinks]]` to `/digest/slug` links at build time.

## Content Integration

- Copy `wiki-by-claude/wiki/*.md` (14 concept + 2 meta files) into `src/content/digest/`
- Exclude `index.md` and `log.md` (meta files) — build our own index page
- Zod schema: `title`, `type` (concept|source-summary|comparison|etc), `created`, `updated`, `sources[]?`, `tags[]?`
- Wikilink `[[page-name]]` → `<a href="/digest/page-name">` via remark plugin

## Pages

| Route | Purpose |
|-------|---------|
| `/digest` | Landing page: starfield bg, title, constellation SVG map, categorized article list |
| `/digest/[slug]` | Article detail: starfield bg, prose content, related concepts nav |

## Visual Design — Space Theme

- **Background**: Deep space (#0a0a1a), CSS animated star particles
- **Accent**: Blue-purple nebula gradient (#6366f1 → #a855f7)
- **Text**: Light blue-white (#e0e7ff), muted (#94a3b8)
- **Cards**: Semi-transparent glass morphism (backdrop-blur)
- **Constellation map**: SVG nodes (concepts) + lines (wikilink relationships), hover glow effect
- **Isolated scope**: All styles in `src/styles/digest.css`, no impact on main site

## Layout: DigestBase.astro

- Own header: site logo link back to `/`, "AI Digest" title, minimal nav
- StarField component as background (CSS-only animated dots)
- AudioPlayer floating bottom-right
- Simplified footer

## Components

- `StarField.astro` — CSS star particle animation (no JS)
- `ConstellationMap.astro` — SVG concept graph built at build time from wikilink relationships
- `AudioPlayer.astro` — HTML5 audio play/pause toggle, default paused, planet icon

## Audio

- File: `public/audio/space-ambient.mp3` (Public Domain, NASA-derived ambient)
- Loop playback, default paused
- User can replace with any mp3 at the same path

## Remark Plugin: remark-wikilinks.ts

Transforms `[[page-name]]` and `[[page-name|Display Text]]` in markdown AST to anchor elements pointing to `/digest/page-name`.

## Main Site Integration

- Add "AI Digest" link to Header.astro navigation (desktop + mobile)
- No other changes to main site
