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
- **/birds/** (`src/pages/birds.astro`): prose + two `src/components/BirdsOfPreyMap.astro` instances (San Francisco and Boulder) plus one shared `BirdsSpeciesModal.astro` — the modal owns page-unique ids, so render it exactly once no matter how many maps are on the page. Curated species notes live in `src/data/raptors.ts`.
  - GBIF access is shared between Node and the browser in `src/lib/gbif.js`. Statistics come from facet queries (exact, whole-dataset); map dots come from a small sample. Do not go back to counting by downloading records — that cost ~24 slow paged requests and still only sampled.
  - The default two locations are **baked** into `public/data/birds/*.json` by `npm run birds:refresh` and committed, so a build never depends on GBIF being up. `.github/workflows/refresh-bird-data.yml` re-runs it monthly and pushes. Only a visitor searching their own address hits GBIF live.
  - GBIF backbone taxon keys are versioned and have moved before (`7191` now matches nothing; `1458` resolves to Orthoptera). If falcons or owls vanish, re-resolve them via `api.gbif.org/v1/species/match?rank=ORDER&kingdom=Animalia&name=<Order>`.
- **Journal section** (`src/content/journal/`, `src/pages/journal/`): a read-only public mirror of a private engineering journal (`~/.claude/journal`). Entries arrive via a review/publish pipeline that runs a secret scan first — do not author journal entries directly in this repo, and never commit secrets/env values/PII here (the repo is fully public).

## Tailscale remote dev

`npm run dev:remote` (`scripts/dev-remote.sh`) binds the dev server to `0.0.0.0`, prints a QR code, and requires `TAILSCALE_HOST` in `.env` (copy `.env.example`; gitignored). `astro.config.mjs` reads that var into Vite's `allowedHosts` so tailnet requests pass the Host-header check. Separately, an Aperture AI gateway is used as a usage dashboard for Claude traffic — unrelated to the site build.
