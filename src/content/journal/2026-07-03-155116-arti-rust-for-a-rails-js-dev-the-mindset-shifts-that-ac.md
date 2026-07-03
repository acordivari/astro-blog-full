---
title: "Rust for a Rails/JS dev: the mindset shifts that actually matter"
project: "arti"
date: 2026-07-03
type: learning
tags: ["rust", "onboarding", "arti", "tor", "clippy", "ownership", "msrv"]
draft: false
---

**What is new or different about working in Rust, coming from JavaScript and Ruby on Rails?**

The syntax and mechanics you pick up in a week. The genuinely new part is a set of *mindset* shifts — most of them enforced by the toolchain rather than by convention — plus a handful of house rules specific to a large shared codebase like arti (the Rust implementation of Tor, ~70 crates in one Cargo workspace). Each shift below is pointed at the repo doc that governs it, so this doubles as a pre-first-MR checklist.

### The compiler and lints are your senior reviewer
This is the biggest cultural difference from a dynamic language. In Rails/JS, the language lets almost anything through and you find out at runtime (or in production). In Rust, an enormous class of bugs is simply refused at compile time, and this repo turns the dial up further: the pre-commit hook runs
- `cargo fmt --all -- --check`
- `cargo clippy --all-features --all-targets -- -D warnings`
- `cargo test --all`

Clippy is Rubocop's much smarter cousin — but here **every warning is a hard error** (`-D warnings`), so a lint isn't advisory, it blocks the commit. Run `cargo clippy` and `cargo fmt` before every commit. Practical stance: **don't fight Clippy.** Its suggestions are almost always the idiomatic form, and "the compiler/linter is annoyed" is usually a real signal, not noise — the opposite reflex from a dynamic language where you push and see what breaks.

### Errors are values, not exceptions
There is no `raise`/`throw` and no `nil`. Fallible functions return `Result<T, E>` (you propagate failures upward with the `?` operator, roughly "return early if this is an error") and absent values are `Option<T>` (`Some`/`None`) instead of `null`/`nil`. This means error and null handling is *visible in the type signature* and the compiler forces you to deal with it — no surprise `NoMethodError on nil` three layers deep.

Coming from Rails, the trap is reaching for `.unwrap()` / `.expect()` to "just make it compile." Those panic (abort) if the value is an error/`None` — the equivalent of an unhandled `raise` inside a library — and reviewers will flag them in library code. They're fine in tests and in a few genuinely-can't-happen spots (ideally with a comment saying why).

### Ownership replaces the garbage collector
The largest single adjustment. There's no GC; instead every value has a single *owner*, and the borrow checker tracks who may read or mutate it. Consequences that feel strange at first:
- **No shared mutable state by default.** Mutation is opt-in — you write `mut` explicitly — which is stricter than JS (`let` is mutable, only `const` isn't) and stricter than Ruby's anything-goes.
- The borrow checker will reject aliasing/lifetime mistakes that a GC'd language would have quietly allowed (and possibly leaked or raced on).

Team-specific tell: if you find yourself `.clone()`-ing everything to escape borrow-checker errors, treat that as a smell, not a solution. It usually means a small design/ownership tweak is wanted — ask for a review comment rather than pushing a pile of defensive clones.

### This repo's specific conventions (skim before your first MR — they're short and save review round-trips)
- `doc/dev/Architecture.md` — how the ~70 crates fit together. **Start here**; the crate graph is the map of the whole project.
- `doc/dev/Style.md` — house coding style beyond what `rustfmt` mechanically enforces.
- `doc/Semver.md` + `doc/dev/semver_status.md` — public API changes must be tracked for semver. This has no Rails analogue, where you just edit a method and move on; here changing a crate's public surface is a tracked event. Docs/tests don't trigger it — which is exactly why a docs or test fix makes a clean, low-risk first PR.
- `doc/dev/ChangelogTemplate.md` — user-facing changes need a changelog note.
- `doc/dev/Safelogging.md` + `doc/dev/LogConventions.md` — Tor is privacy-critical, so you can't log arbitrary data; there are rules about what's safe to emit. Worth knowing this exists even before you need it.

### MSRV discipline (Minimum Supported Rust Version)
The workspace targets **Rust 1.91** (declared as `rust-version = "1.91"` in the crate manifests, and stated in the README). Locally you may have something newer — e.g. 1.96 — so a shiny `std` API can compile cleanly for you yet break CI on the pinned MSRV. When you reach for a recent standard-library method, check its "stable since" version in the docs first. This is unfamiliar coming from JS/Rails, where you rarely pin the interpreter version this tightly.

### Git flow is the opposite of what you're used to
The contributor guide prefers you **NOT** squash during review. Push additional commits as you address feedback, and record corrections with `git commit --fixup <sha>` so they can be autosquashed into the right parent later. Many JS/Rails teams do the reverse (squash-to-one before merge), so this feels backwards at first — the point is to keep review history legible while a change is in flight.

### Async is runtime-agnostic
arti abstracts the async runtime behind the `tor-rtcompat` crate. Don't reach for `tokio::` directly in crate code the way a Node dev grabs a global — go through the runtime abstraction so crates stay portable across executors. (JS has exactly one event loop; Rust deliberately doesn't, and this codebase leans into that.)

**Bottom line:** the recurring theme is that things Rails/JS leave to runtime, discipline, or convention — null safety, error handling, memory aliasing, mutation, API stability — Rust (and this repo's config on top of it) pushes to *compile time and enforced tooling*. It's more friction up front and far less "mystery behavior later." Lean into the compiler instead of arguing with it.
