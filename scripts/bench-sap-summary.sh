#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BENCH="$SCRIPT_DIR/bench-sap.sh"

# Run the base benchmark and capture output
OUT="$($BENCH)"

# Extract timing lines
ANTH_LINE=$(printf "%s\n" "$OUT" | awk '/^start=/{print; exit}')
OPENAI_LINE=$(printf "%s\n" "$OUT" | awk 'NR>1 && /^start=/{print; exit}')

# Helper to parse start and total
parse_field() {
  # $1=line, $2=key
  printf "%s\n" "$1" | sed -n "s/.*$2=\([0-9.]*\).*/\1/p"
}

ANTH_START=$(parse_field "$ANTH_LINE" start)
ANTH_TOTAL=$(parse_field "$ANTH_LINE" total)
OPENAI_START=$(parse_field "$OPENAI_LINE" start)
OPENAI_TOTAL=$(parse_field "$OPENAI_LINE" total)

# Pretty print summary
cat <<EOF
SAP Proxy Benchmark Summary
---------------------------
Anthropic (/anthropic):
  - TTFB (start): ${ANTH_START}s
  - Total:        ${ANTH_TOTAL}s

OpenAI (/openai):
  - TTFB (start): ${OPENAI_START}s
  - Total:        ${OPENAI_TOTAL}s

Delta (Anthropic - OpenAI):
  - TTFB:  $(awk -v a="$ANTH_START" -v b="$OPENAI_START" 'BEGIN{printf "%.3f", a-b}')s
  - Total: $(awk -v a="$ANTH_TOTAL" -v b="$OPENAI_TOTAL" 'BEGIN{printf "%.3f", a-b}')s
EOF
