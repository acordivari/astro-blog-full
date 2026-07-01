---
title: "Serving the Astro dev server over a Tailscale tunnel (and why the browser says 'Not Secure')"
project: "blog26"
date: 2026-07-01
type: learning
tags: ["tailscale", "wireguard", "astro", "tls", "dev-workflow"]
draft: false
---

Got the blog's Astro dev server loading on my phone over Tailscale, then dug into why the phone browser flags the connection "Not Secure."

## The setup (already in place, just verified it works)

- `astro.config.mjs` already had `server: { host: true }` (binds 0.0.0.0 / all interfaces, including the tailscale one) plus a `vite.server.allowedHosts` whitelist populated from a `TAILSCALE_HOST` env var (the machine's MagicDNS name). So a plain `npm run dev` is already tailnet-accessible — **no `--host` flag needed**, because `host: true` in config does the same thing.
- There's a `scripts/dev-remote.sh` (`npm run dev:remote`) that reads the MagicDNS host from `.env`, prints a banner + a scannable QR code (via `npx qrcode-terminal`), then execs `astro dev`. It's just the plain dev server plus convenience; the QR renderer only emits into a real TTY, so it comes out blank when run through a piped/non-interactive shell.
- Verified reachability both by raw tailnet IP and by the MagicDNS hostname — both return 200 for `/journal`. The Host header the phone sends is the MagicDNS name, which is why the `allowedHosts` whitelist matters (Vite rejects unknown Host headers otherwise).
- Devices involved: this Mac, and my phone, both on the tailnet. `tailscale ping` to the phone returned a pong via a direct peer path on UDP port 41641 (WireGuard's port) — i.e. a direct hole-punched connection, not a DERP relay.

## The real lesson: "Not Secure" is about the app layer, and Tailscale is NOT TLS

My first guess was that Tailscale "uses TLS between devices" and that's why it's fine. That conclusion (traffic is encrypted in transit) is correct, but the mechanism was wrong on three counts:

1. **It's WireGuard, not TLS.** Tailscale's data plane is WireGuard, which uses the Noise protocol framework (Curve25519 + ChaCha20-Poly1305), not TLS/SSL. TLS *does* appear elsewhere in Tailscale's architecture — talking to the coordination/control server, and as the outer wrapper on DERP relays when a direct path can't be established — but the encryption of the actual browser traffic between my two devices is WireGuard, end to end.

2. **"SSL over HTTP" is inverted.** HTTPS = HTTP *over* TLS (TLS being the successor to SSL). What I actually have is plain HTTP with no TLS layer at all — confirmed that port 4321 speaks plain HTTP and rejects an HTTPS/TLS handshake (no TLS listener there).

3. **The browser can't see Tailscale.** To the phone's browser the WireGuard tunnel is invisible OS-level plumbing. All it knows is: I made an `http://` connection with no certificate → show "Not Secure." That label is technically accurate about the application layer; it just has no way to know the bytes ride inside an encrypted WireGuard tunnel one layer down. The mental model:

   phone browser --plain HTTP--> [phone OS] --WireGuard/Noise encrypted (the wire)--> [Mac OS] --plain HTTP--> astro dev

   Plaintext HTTP only exists *within* each device; across the network it's WireGuard-encrypted. For a dev server on a private tailnet, the warning is cosmetic.

## How to actually get the padlock (if I want it)

`tailscale serve --bg 4321` fronts the dev server with a real Let's Encrypt cert for the `.ts.net` name, giving genuine `https://` (TLS + WireGuard stacked) — then browse to the MagicDNS host on 443 with no port. `tailscale serve status` to inspect, `tailscale serve --https=443 off` to tear down. Didn't set this up yet; left it as an option.
