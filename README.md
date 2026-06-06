# blog26

Personal site. Astro static site, deployed to Netlify.

## Local development

```bash
npm install
npm run dev          # local only: http://localhost:4321
```

## Remote testing over Tailscale

Use this when you want to view or test the site from your phone (or another
device on your tailnet) while editing on your laptop.

### One-time setup

1. Tailscale installed and signed in on the laptop and the phone:
   <https://tailscale.com/download>
2. Copy `.env.example` to `.env` and fill in your machine's MagicDNS name
   (find it with `tailscale status` — the first column of your own row, plus
   the `tailXXXX.ts.net` suffix shown in the admin console):

   ```
   TAILSCALE_HOST=your-machine.tail-name.ts.net
   ```

   `.env` is gitignored; keep it out of commits.

### Each session

```bash
npm run dev:remote
```

That script:

1. Verifies Tailscale is running locally
2. Prints the URL prominently
3. Renders a QR code in the terminal — point your phone camera at it
4. Starts the Astro dev server bound to `0.0.0.0` so the tailnet can reach it

The Astro config (`astro.config.mjs`) reads `TAILSCALE_HOST` from `.env` and
adds it to Vite's `allowedHosts`, so requests from that hostname pass the
Host-header check. Without that, Vite rejects them with a 403.

### Claude Code remote control (optional)

If you want to drive a Claude Code session from your phone while testing the
site:

1. **Start Claude on the laptop** (`claude` in the repo)
2. **Type `/remote-control`** in the Claude session — this is a slash command
   that has to be invoked manually; no script can do it for you
3. Follow the link/QR Claude prints to pair your phone

This pairing is per-session: every time you start a fresh Claude session, run
`/remote-control` again if you want phone access to that session.

## Build

```bash
npm run build        # also runs pagefind indexing via postbuild
npm run preview      # serve the built dist/
```

## Deploy

Pushes to `main` deploy automatically via Netlify (see `netlify.toml`).
