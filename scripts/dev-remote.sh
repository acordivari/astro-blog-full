#!/usr/bin/env bash
set -euo pipefail

# ── Locate repo root and load .env ────────────────────────────────────────
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "✗ .env not found. Copy .env.example to .env and set TAILSCALE_HOST." >&2
  exit 1
fi

# Pull TAILSCALE_HOST out of .env without sourcing the whole file
TAILSCALE_HOST="$(grep -E '^TAILSCALE_HOST=' .env | head -1 | cut -d '=' -f 2- | tr -d '"' | xargs || true)"

if [[ -z "${TAILSCALE_HOST:-}" ]]; then
  echo "✗ TAILSCALE_HOST is not set in .env" >&2
  exit 1
fi

# ── Verify Tailscale is up ────────────────────────────────────────────────
if ! command -v tailscale >/dev/null 2>&1; then
  echo "✗ tailscale CLI not found. Install from https://tailscale.com/download" >&2
  exit 1
fi

if ! tailscale status >/dev/null 2>&1; then
  echo "✗ Tailscale is not running. Start it with: sudo tailscale up" >&2
  exit 1
fi

PORT="${PORT:-4321}"
URL="http://${TAILSCALE_HOST}:${PORT}"

# ── Banner ────────────────────────────────────────────────────────────────
printf '\n'
printf '  ┌─────────────────────────────────────────────────────────────\n'
printf '  │  Dev server (tailnet-accessible)\n'
printf '  │\n'
printf '  │  %s\n' "$URL"
printf '  └─────────────────────────────────────────────────────────────\n'
printf '\n'

# ── QR code for phone ─────────────────────────────────────────────────────
printf '  Scan with phone camera (device must be on the tailnet):\n\n'
npx --yes qrcode-terminal "$URL" || echo "  (qrcode-terminal failed — URL above still works)"

printf '\n'
printf '  Claude remote control: type "/remote-control" in your Claude\n'
printf '  session before starting work, so you can drive it from your phone.\n'
printf '\n'

# ── Hand off to astro dev ─────────────────────────────────────────────────
exec npx astro dev
