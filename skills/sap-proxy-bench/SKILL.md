---
name: sap-proxy-bench
description: Measure SAP proxy latency for Anthropic (/anthropic) and OpenAI (/openai) routes and report TTFB and total time.
---

# SAP Proxy Bench

Use this skill to compare time-to-first-byte and total completion time for the SAP Anthropic and OpenAI proxy routes.

## Usage

/skill:sap-proxy-bench

The skill will run a summarized benchmark and print TTFB and total for both routes.

## Steps

1. Ensure ANTHROPIC_AUTH_TOKEN is exported in your shell.
2. Run the script:

```bash
~/.config/brain/.global/.pi/config/scripts/bench-sap-summary.sh
```

## Notes
- Override endpoints via env:
  - ANTHROPIC_BASE_URL (default http://localhost:6655/anthropic)
  - OPENAI_BASE_URL (default http://localhost:6655/openai)

