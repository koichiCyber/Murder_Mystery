#!/bin/sh
cd "$(dirname "$0")"

# ===== DIFFICULTY (edit, save, run again) =====
# EASY = good team favored | NORMAL = balanced | HARD = Accomplice favored
export DIFFICULTY=NORMAL
# Optional overrides (uncomment to use):
# export ACC_SEES_WEAPON=1            # 1 = Accomplice sees weapon too, 0 = suspect only
# export ACC_SEIZE_ROUND_TEAM=4       # first round the Accomplice may seize (Team)
# export ACC_SEIZE_ROUND_FFA=5        # same, Free-for-all
# export ACC_CAN_WITHHOLD=1           # 1 = Accomplice may withhold a card once
# export POLICE_WRONG_ARREST=ELIMINATE   # or SAFE
# export DETECTIVE_FREE_RETRY=1
# export MAX_ROUNDS=8

# ===== ONLINE PLAY via Cloudflare Tunnel =====
# 1 = also start a tunnel (needs cloudflared), 0 = local network only
USE_TUNNEL=1

if [ "$USE_TUNNEL" = "1" ] && command -v cloudflared >/dev/null 2>&1; then
  node server.js &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
  sleep 2
  echo "[Tunnel] Send the address ending in .trycloudflare.com to your friends."
  cloudflared tunnel --url http://localhost:3000
else
  [ "$USE_TUNNEL" = "1" ] && echo "[Tunnel] cloudflared not installed (brew install cloudflared); running on your network only."
  node server.js
fi
