# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal site/blog (Astro 5 + MDX), deployed at https://thisisandrew.me.

## Commands

```bash
npm run dev          # dev server at http://localhost:4321
npm run dev:remote   # dev server over Tailscale (see below)
npm run build        # astro build; postbuild runs Pagefind indexing over dist/
npm run preview      # serve built dist/
```

No lint or test setup. Deploy: push to `main` → Netlify builds automatically (`netlify.toml`, Node 20, publishes `dist/`).

## Architecture

Static Astro site. File-based routes under `src/pages/`; each content section (reviews, reflections, movement, learning, fabrics, journal) has `src/pages/<section>/index.astro` (listing) + `[...slug].astro` (detail), backed by a content collection in `src/content/<section>/` with Zod schemas in `src/content/config.ts`. Most collections share a `title/description/publishDate/tags/draft` shape; listing pages filter out `draft: true`.

- **Layout/styles:** single shared layout `src/layouts/BaseLayout.astro` — contains the nav (`navLinks` array; add new top-level pages there), the Pagefind search modal, and a global `<style is:global>` block defining the design tokens (`--color-bg`, `--color-text`, `--color-muted`, `--color-border`, `--font-display` etc.). Pages style themselves with scoped `<style>` blocks using those vars. There are no standalone .css files.
- **Search:** Pagefind, indexed at postbuild (`dist/` → copied into `public/pagefind/`), loaded in BaseLayout. New content is searchable automatically after a build.
- **/learning/** (`src/pages/learning/index.astro`): the project showcase. "Hero cards" are hardcoded objects in the page frontmatter (`x402`, `tube`, `featured`, `tatu`) each rendered as an `<article class="featured">` with a badge, title, blurb, `stack` tag list, and links; smaller past projects live in the `projects` array rendered as a `.project-grid`. Below that, the `learning` collection renders as a post list (tags display as plain labels — only the reviews section has tag archive routes). Also hosts the nested-squares "mandala" animation (`nestSquares()`).
- **/birds/** (`src/pages/birds.astro`): prose + `src/components/BirdsOfPreyMap.astro`, an interactive map of raptor sightings pulling GBIF data client-side; species data in `src/data/raptors.ts`.
- **Journal section** (`src/content/journal/`, `src/pages/journal/`): a read-only public mirror of a private engineering journal (`~/.claude/journal`). Entries arrive via a review/publish pipeline that runs a secret scan first — do not author journal entries directly in this repo, and never commit secrets/env values/PII here (the repo is fully public).

## Tailscale remote dev

`npm run dev:remote` (`scripts/dev-remote.sh`) binds the dev server to `0.0.0.0`, prints a QR code, and requires `TAILSCALE_HOST` in `.env` (copy `.env.example`; gitignored). `astro.config.mjs` reads that var into Vite's `allowedHosts` so tailnet requests pass the Host-header check. Separately, an Aperture AI gateway is used as a usage dashboard for Claude traffic — unrelated to the site build.
