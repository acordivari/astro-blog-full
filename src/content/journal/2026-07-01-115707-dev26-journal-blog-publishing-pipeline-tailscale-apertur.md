---
title: "Journal→blog publishing pipeline + Tailscale/Aperture wiring"
project: "dev26"
date: 2026-07-01
type: change
tags: ["journal", "astro", "blog", "tailscale", "aperture"]
draft: false
---

Built a full pipeline to turn the global engineering journal into a searchable, read-only section of the personal Astro blog, with a private-source → public-mirror security model. Then wired up Tailscale for mobile review and Aperture as an AI-usage dashboard.

**Journal storage redesign.** Switched the journal from one-file-per-month to one-file-per-entry, each with YAML frontmatter (title, project, date, type, tags, status, optional commit). Entries now start as `status: pending` in a private canonical location and only reach the public blog after review. Rewrote the append/list/export commands accordingly and added a migration that split the existing monthly files into per-entry files (idempotent, marks everything pending, preserves the old commit stamp privately). Existing entries migrated cleanly.

**Layered secret/PII safety (the core requirement).** The owner never wants secrets, env vars, or PII in the journal. Three layers: (1) capture hygiene — the /journal skill and the "+j" hook trigger were rewritten to capture only plain-english prose with an explicit forbidden-content list; (2) a zero-dependency scan gate that blocks credential-shaped content (cloud keys, tokens, private keys, JWTs, connection strings, secret-named env assignments) and flags emails/private IPs for review, self-redacting its own output so findings don't leak, and auto-upgrading to gitleaks if installed; (3) human review before anything public.

**Blog integration.** Added a new journal content collection and two read-only pages to the Astro blog, mirroring the existing section conventions, plus a nav link. Key win: search comes for free because the blog already runs Pagefind at postbuild, so entries are indexed automatically with a tag filter. Publishing to the blog repo drives a Netlify deploy. Verified the build end to end.

**Localhost review UI.** A small localhost-only web app (bound to loopback) lists pending entries, lets you edit/delete, and publishes approved ones: it runs the scan gate, copies a cleaned copy into the blog (stripping status/commit, forcing draft off), commits locally, and offers a separate push button. Approve-then-push, review first. Path-traversal guards on filenames and no-shell git calls.

**Decisions & gotchas.**
- The blog repo is fully public, so the real protection is the scan gate plus prose-only capture, not draft flags (raw markdown is visible in a public repo regardless of render state). The private-source → public-mirror split is what keeps unreviewed entries out entirely.
- Astro 5 caches content in a store under node_modules, not just the visible cache dir — a deleted local entry lingered until that store was cleared. Never an issue on the deploy host since each build is a fresh clone.
- Git history is permanent, so the scan must run before the first push, never after.

**Tailscale + Aperture.** Enabled mobile review by tunneling the localhost reviewer over the tailnet with automatic HTTPS, tailnet-only (not the public internet), leaving the app bound to loopback. Confirmed the phone and Mac are already on the same tailnet and tested the tunneled URL end to end.

For Aperture (an AI gateway used as a usage dashboard): the earlier breakage — local dev failing when routed through the gateway — was caused by the gateway's exact-match model allowlist not including the current Opus model. The pasted config already lists it, so the fix is just saving it. Pointed the CLI at the gateway via a base-URL setting change (applies to new sessions only) so agent traffic is observed, with the subscription OAuth token passing through untouched. Decided to remove the redundant default Anthropic provider and keep only the passthrough one, which removes routing ambiguity when an unprefixed model name arrives. Discovered the owner had already built a session-start preflight guard that probes whether the effective endpoint accepts the target model (stripping the context-window tag to match the base id) and warns loudly without aborting — so any gateway misroute is caught before spending tokens.
