---
title: "Creating the physics for exploration within Unity"
project: "golgotha"
date: 2026-07-07
type: plan
tags: ["unity", "open-world", "streaming", "game-design", "golgotha"]
draft: false
---

Design analysis for **Golgotha** (a Zelda-like in Unity 6 / URP) on how to evolve its world from
discrete portal-connected scenes toward a continuous, ride-across-the-land exploration feel (the
BOTW-on-horseback fantasy). This is a direction/architecture decision, not code yet.

## Where the world is today
- Each region / sky zone / dungeon is a **separate Unity scene**. `RealmManager.CrossTo` unloads the
  current content scene and additively loads the target, with a blend to hide it.
- Net effect: "rooms connected by doorways." Great for building breadth fast (we have 4 ground regions
  + 5 sky zones + 5 dungeons chained) and correct for dungeons (which *should* feel enclosed). The thing
  that breaks the open-world feel is the **teleport at a region boundary** — you touch a portal and blink,
  you don't ride across a plain.

## The core reframing
Two separable problems, solved by different techniques:
1. **Actual continuity** — walk A→B with no load screen.
2. **Perceived scale** — does it *feel* vast regardless of real size.
You can buy ~90% of the "feel" (perceived) cheaply and defer the expensive "truly seamless streaming"
(actual). Raw dimensions matter far less than perception.

## The honest constraints (cost tradeoffs, not hard caps)
- **Memory**: can't hold the whole world resident at once → this is what forces streaming.
- **Float precision**: past ~5–10 km from origin things get jittery → solved by a *floating origin*
  (silently recenter the world on the player) or chunked coordinate spaces.
- **Iteration/build cost**: a streaming + LOD + occlusion pipeline is real ongoing engineering; the
  expensive option for a small team.

## What actually sells "near-infinite" (perception levers)
- **Atmospheric depth** — fog/haze compressing how far you can see (we *just* shipped gradient skyboxes +
  per-realm fog; this is literally the tool, already in place).
- **Visible distant landmarks** pulling you forward (we already have the `DressFar` far-backdrop system).
- **Density of things to find** (owlet rescues, shrines, dungeons) — a world feels big by content, not size.
- **Traversal speed** — a mount makes a medium world feel expansive.

## Staged path (cheapest → most expensive)
1. **Visible next-region proxies** *(cheap, no streaming)*: drop the adjacent region's low-detail
   silhouette on the horizon at each boundary — see the Maplewaste from the Drowned See's shore. Direct
   extension of `DressFar`. Does most of the psychological "it's continuous" work for near-zero cost.
2. **Seam-stream the region boundaries** *(medium, the real payoff)*: evolve `CrossTo` so that nearing the
   A→B boundary co-loads B additively *alongside* A at the correct world offset; the player walks across;
   then A unloads behind them. Turns portals into "crest the ridge into the next land." The hard parts
   already exist (additive load/unload in `RealmManager`, cross-scene state in `WorldStateBus`); new work
   is co-loading two scenes with a coordinate offset + a trigger volume instead of a teleport, and hiding
   the swap in a natural choke point (canyon/bridge/fog bank). This is the single biggest jump toward the
   horseback feel *without* a full streaming engine.
3. **Mount + larger authored regions** *(medium)*: grow regions from ~±40 m toward ±150 m and add a
   mount/sprint. Sky-glide already gives the vertical version of the fantasy.
4. **Full streaming / LOD / floating-origin** *(expensive)*: only for genuine BOTW-scale seamlessness
   across the whole map at once. Defer until 1–3 prove the feel is worth it.

## Recommendation & gotchas
- Do **#1 + #2** first: visible destinations + seam-streamed boundaries → converts every "doorway" into
  "ride over the hill and the next land opens up," riding on infrastructure we already have.
- **Gotcha to respect**: seam-streaming touches load-bearing plumbing (`RealmManager`, coordinate offsets,
  save-state while two scenes are co-loaded), so unlike the fast additive scene-builds we've been doing,
  it warrants a careful prototype + tests ("measure twice"). #1 is a safe quick win to feel it immediately.
