---
title: "Two protocols, one name: the x401 composability play"
description: "I set out to compare two implementations of 'x401' and discovered they aren't the same protocol at all — one authenticates a key, the other authorizes a human. The interesting part is what happens when you stack them."
publishDate: 2026-07-03
tags: ["x402", "x401", "agents", "identity", "protocols"]
draft: true
---

I went looking for a fight and found a category error.

The premise was simple. There are two things in the wild both calling themselves **x401**. One is Proof's — the identity layer I've been building against in my [agentic payments](/learning/) work, where the question is *which human authorized this agent to spend, and within what scope?* The other is Openclaw's `claw401`, which showed up with a clean README, live SDKs in three languages, and the confident tagline "deterministic wallet authentication for autonomous systems." Two implementations of the same idea, presumably. So I did what you do: I tried to battle-test one against the other and declare a winner.

There is no winner, because they are not the same protocol. They just share a number.

## The moment it clicked

Proof's x401 is a *proof-requirement* protocol. A server says, over HTTP headers, "to touch this route you must prove a credentialed fact about yourself" — you're a real person, you're over 21, you reside in this jurisdiction, you hold this license. A trusted issuer attested that fact; you selectively disclose only the slice the verifier asked for; the whole thing binds to a specific payment so the disclosure can't be lifted and reused against a different charge. It reuses the heavy machinery of verifiable credentials — the W3C Digital Credentials API, OpenID4VP, SD-JWT-VC, DCQL. The analogy is *present a government ID at the counter, and only reveal the birth-year line.*

Openclaw's x401 is a *challenge-response* protocol. A server hands you a nonce; you sign it with your Ed25519 wallet key; the server checks the signature. That's it. No issuer, no attributes, no third party, no PII. The public key *is* the identity. The analogy is *sign in with your wallet* — SIWE, SIWS, the pattern crypto has used for years.

One proves a **key**. The other proves a **credentialed human**. These are different axes. A Solana keypair tells you nothing about whether its holder is a real person, is of age, or was authorized by anyone at all. And a verifiable credential presented in a browser tells you nothing about which machine is holding the wallet that's about to move the money.

I spent a good hour treating this as a shootout — reading both codebases closely, running the test suite on the Proof-side reference work, even pulling apart the published `claw401` packages to check whether the "deterministic across languages" claim actually held byte-for-byte (mostly yes; it quietly diverges the moment you sign a free-form claim with a number in it, because JavaScript renders `5.0` as `5` and Python doesn't — a small, real footgun). All of that was useful. None of it answered the question I'd actually posed, which turned out to be malformed. "Which is better" is like asking whether a passport is better than a house key.

## The three-layer stack

Once you stop trying to make them compete, the shape of a complete agentic-commerce transaction falls out cleanly. It has three questions, not one, and each wants a different tool:

| Layer | Question | The fitting tool |
|---|---|---|
| **Agent authentication** | Is this the agent's real key — not an impostor replaying a captured request? | A wallet challenge-response (claw401, or SIWS). Cheap, offline, microseconds. |
| **Human authorization** | Did a credentialed human authorize this spend, and is it in scope? | Proof's x401 + a signed, revocable mandate. |
| **Payment settlement** | Move the money. | x402 — the EIP-3009 / Permit2 rails. |

My sandbox already runs the bottom two together: the human proves identity and authorizes a scoped budget, and x402 settles the purchase gaslessly. What's been *implicit* the whole time is the top layer. Today the agent's identity is whatever wallet happens to sign the payment authorization — there's no separate, cheap assertion of "this is genuinely my agent's key" that a rate-limiter or an audit log could lean on without dragging the entire credential apparatus into every request.

That's the seam. And it's exactly the shape of thing the wallet-auth protocol is good at: a fast, offline, no-PII proof of key custody that sits *in front of* the expensive, human-in-the-loop credential step. Verified key, then verified human, then scoped mandate, then bound payment. Four facts, each proven by the tool that proves it most cheaply, composed into one chain of custody from "which machine" all the way to "which person, for how much, until when."

## Why I think this is the actual opportunity

Here's the part that made me close the laptop and then immediately reopen it.

Proof's x401 is, upstream, a **specification with no reference implementation** — the repo says so plainly, and asks for exactly that: "proposals, examples, interop profiles, and reference implementations are especially wanted." Meanwhile the thing I've been building in `agentic-apify` is a working spend broker that gates real payments behind an x401 credential presentation. It is, give or take some polish, the reference implementation the spec is asking for.

The unglamorous, high-leverage move isn't to pick a side in a fight that doesn't exist. It's to:

1. **Ship the reference broker** the spec is missing — and design its front door to *also* accept a wallet-key attestation for the agent-identity layer. That's a first-mover contribution to a spec whose reviewer list reads like a who's-who of payments and identity, on the precise gap the maintainers flagged.
2. **Send the small fixes upstream** to the wallet-auth side — sign the session object, adopt a language-agnostic canonicalization so the cross-SDK determinism claim actually holds, bind agent attestations to a fresh challenge so they stop being replayable bearer tokens. These are two-line-diff-sized improvements to an early project whose maintainer is clearly reachable.

None of that requires the two protocols to merge, or even to acknowledge each other. It just requires noticing that they occupy different floors of the same building. The name collision is noise. The signal is that agentic commerce needs *both* a machine-identity layer and a human-authorization layer, almost nobody is building the bridge between them, and I've been standing on the bridge for a month without naming it.

You gotta know the scales to play jazz. I spent the week learning both protocols cold — the tedious part, the reading-the-source part — and the reward for that tedium was realizing the improvisation isn't choosing a note. It's playing both hands at once.

*Draft. Grounded in hands-on work with the Proof x401 reference implementation and a static read of the published `claw401` SDKs; specifics on the findings live in my private notes. Corrections welcome once this is public.*
