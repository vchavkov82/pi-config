#!/usr/bin/env bash
set -euo pipefail

# Benchmark SAP Anthropic and SAP OpenAI proxy latency (TTFB and total)
# Requires: ANTHROPIC_AUTH_TOKEN in env
# Optional overrides:
#   ANTHROPIC_BASE_URL (default http://localhost:6655/anthropic)
#   OPENAI_BASE_URL    (default http://localhost:6655/openai)

if [[ -z "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: ANTHROPIC_AUTH_TOKEN is not set." >&2
  exit 1
fi

ANTH_BASE="${ANTHROPIC_BASE_URL:-http://localhost:6655/anthropic}"
OPENAI_BASE="${OPENAI_BASE_URL:-http://localhost:6655/openai}"

# Normalize base URLs (strip trailing slashes)
ANTH_BASE="${ANTH_BASE%/}"
OPENAI_BASE="${OPENAI_BASE%/}"

jq_payload_anth='{"model":"claude-4.6-sonnet","messages":[{"role":"user","content":"ping"}],"stream":true}'
jq_payload_openai='{"model":"gpt-5","messages":[{"role":"user","content":"ping"}],"stream":true}'

printf "\n=== Anthropic via %s/v1/messages ===\n" "$ANTH_BASE"
CURL_OUT=$(curl -N -sS \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -X POST "$ANTH_BASE/v1/messages" \
  -d "$jq_payload_anth" \
  -w "\nstart=%{time_starttransfer} total=%{time_total}\n") || true
# Print last two lines with timing
printf "%s\n" "$CURL_OUT" | tail -n 2

printf "\n=== OpenAI via %s/v1/chat/completions ===\n" "$OPENAI_BASE"
CURL_OUT2=$(curl -N -sS \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$OPENAI_BASE/v1/chat/completions" \
  -d "$jq_payload_openai" \
  -w "\nstart=%{time_starttransfer} total=%{time_total}\n") || true
printf "%s\n" "$CURL_OUT2" | tail -n 2

