---
title: "Architectural comparison: Delegated (autonomous) wallet flow vs. Ramp virtual credit cards"
project: "agentic-payments"
date: 2026-07-01
type: learning
tags: []
draft: false
---

**Question explored:** Does the agentic-payments **Delegated (autonomous) wallet flow** overlap architecturally with how Ramp designs virtual credit cards (ramp.com/business-cards)? (Ramp marketing page is thin — confirms only merchant/category restrictions enforced "before it happens"; the rest draws on the standard virtual-card issuing architecture shared by Ramp / Stripe Issuing / Marqeta.)

**Answer: yes, substantial + non-superficial overlap.** Both implement the same core idea: *separate the authority to spend from the act of spending; express that authority as a scoped, revocable object; enforce it at a trusted chokepoint downstream of the (untrusted) spender.* A Ramp virtual card ≈ our `IntentMandate`.

**Near 1:1 control-vocabulary mapping (Ramp card → our Delegated flow):**
- the delegation object: card (token/PAN referencing server-side controls) → signed `IntentMandate` from `/api/authorize/start`
- amount: per-card/recurring limit → `scope.maxAmount`
- merchant: merchant lock → `scope.merchantAllowlist`
- category: category restriction → `scope.allowedCategories`
- lifetime: expiry / one-time vs recurring → `MANDATE_TTL`
- issue-once-spend-many: vendor card reused w/o re-approval → one Intent → many `/api/agent/run` buys, no re-presentation
- revocation: instant freeze/cancel → `RevocationRegistry`, revoke by Intent id
- cumulative enforcement: auth-hold → clearing → running balance → `SpendLedger` reserve → commit → total vs cap

**Two deepest structural echoes:**
1. **reserve/commit/release == card auth-hold → clearing → reversal.** Arrived at the same primitive independently because it solves the same problem: preventing race-based overspend when many charges race one shared cap.
2. **Enforcement location.** Ours: agent *attempts*, merchant *refuses* (revocation deliberately does NOT clear `sess.intent`). Cards: the card can't decline itself; the issuer-processor declines at swipe. Both put control at a trusted point the spender doesn't own.

**Where they meaningfully diverge (the interesting part):**
1. **Trust topology.** Ramp = closed-loop issuer-processor: single trusted party IN the auth path, checks every txn against controls it holds. Ours = federated: authority is a cryptographically **signed mandate** any conforming merchant verifies independently; enforcement spread across merchant + `SpendLedger` + revocation status endpoint (no central approver in the hot path — a signature + OCSP-style status queries). Our `REVOCATION_MODE`/`LEDGER_MODE=http` fail-closed services are us rebuilding, in the open, what a card network centralizes.
2. **Identity binding is externalized + portable** — the piece Ramp has no merchant-facing analog for. Our x401/HAM binds *which human* authorized via selective-disclosure VC + KB-JWT over the payment mandate, and the merchant can verify it. Ramp binds a card to an employee via internal KYC; the merchant sees only "Ramp approved," never "who." Our "who authorized this" is a portable cryptographic artifact; theirs is a private DB row.
3. **Instrument granularity.** Ramp = many narrow cards (one per vendor/subscription). Ours = one broad Intent + scope object.
4. **Rail.** Card networks (interchange, chargebacks, disputes) vs x402/USDC via facilitator. But the *control plane* (scope/cap/revoke/TTL) is rail-agnostic in both — which is why the mapping holds at all.

**One-liner:** A Ramp virtual card is a *centralized, closed-loop bearer instrument* whose controls live in Ramp's processor; our Delegated Intent is a *decentralized, cryptographically-verifiable delegation* whose controls live in a signature + federated enforcement services. Same control vocabulary, different trust model — plus our identity layer adds a portable "who approved this" cards keep private.

**Product-direction takeaways:**
- Most transferable idea FROM Ramp → **per-vendor card granularity → per-merchant/per-category scoped Intents** (tighter blast radius per credential, easier partial revocation) instead of one broad grant.
- The idea WE have that they structurally can't → **merchant-verifiable identity+payment binding**, which matters far more in an open agent-to-arbitrary-merchant world than in closed corporate spend.
