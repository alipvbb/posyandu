#!/usr/bin/env bash
set -uo pipefail

LOG_FILE="/tmp/kms-public-tunnel.log"
URL_FILE="/tmp/kms-public-url.txt"

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

echo "starting tunnel autoreconnect at $(date)" >> "$LOG_FILE"

echo "" > "$URL_FILE"

while true; do
  set +e
  ssh -T \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -R 80:localhost:8787 \
    nokey@localhost.run 2>&1 | while IFS= read -r line; do
      clean_line="$(echo "$line" | tr -d '\r')"
      echo "$clean_line" >> "$LOG_FILE"
      if echo "$clean_line" | grep -q "tunneled with tls termination"; then
        url="$(echo "$clean_line" | grep -Eo 'https://[a-zA-Z0-9.-]+' | head -n 1 || true)"
        if [[ -n "$url" ]]; then
          echo "$url" > "$URL_FILE"
        fi
      fi
    done
  status=$?
  set +e

  echo "tunnel disconnected (exit=$status), retrying at $(date)" >> "$LOG_FILE"
  sleep 2
done
