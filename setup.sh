#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPECTED_DIR="$HOME/.pi/agent"

# Accept either a direct clone at ~/.pi/agent or a symlink pointing here
RESOLVED_AGENT="$(readlink -f "$EXPECTED_DIR" 2>/dev/null || true)"
RESOLVED_SELF="$(readlink -f "$SCRIPT_DIR")"

if [[ "$RESOLVED_AGENT" != "$RESOLVED_SELF" ]]; then
  echo "⚠️  ~/.pi/agent does not resolve to this directory"
  echo "   Expected: $RESOLVED_SELF"
  echo "   Got:      ${RESOLVED_AGENT:-(does not exist)}"
  echo ""
  echo "   Fix: ln -s $SCRIPT_DIR $EXPECTED_DIR"
  exit 1
fi

echo "Setting up pi-config at $EXPECTED_DIR"
echo ""

# Create settings.json if it doesn't exist
if [ ! -f "$EXPECTED_DIR/settings.json" ]; then
  echo "Creating settings.json..."
  cat > "$EXPECTED_DIR/settings.json" << 'EOF'
{
  "defaultProvider": "sap-anthropic",
  "defaultModel": "anthropic--claude-4.6-sonnet",
  "defaultThinkingLevel": "medium",
  "enabledModels": [
    "sap-anthropic/anthropic--claude-4.6-sonnet",
    "sap-anthropic/anthropic--claude-4.6-opus",
    "sap-anthropic/anthropic--claude-4.5-haiku",
    "openai-codex/gpt-5.5",
    "openai-codex/gpt-5.4",
    "openai-codex/gpt-5.4-mini",
    "sap-openai/gpt-5",
    "sap-openai/gpt-5.5",
    "sap-openai/gpt-5-mini",
    "sap-anthropic/anthropic--claude-4.5-sonnet"
  ],
  "packages": [
    "git:github.com/vchavkov82/pi-smart-sessions",
    {
      "source": "git:github.com/pasky/chrome-cdp-skill",
      "skills": []
    },
    "git:github.com/vchavkov82/pi-interactive-subagents",
    "git:github.com/vchavkov82/pi-parallel",
    "git:github.com/badlogic/pi-diff-review",
    "git:github.com/nicobailon/pi-mcp-adapter",
    {
      "source": "git:github.com/HazAT/glimpse",
      "skills": []
    },
    {
      "source": "git:github.com/vchavkov82/pi-autoresearch",
      "skills": []
    },
    "/home/vchavkov/.config/brain/.agents/openspec-pi",
    "/home/vchavkov/.config/brain/.agents/obscura-plugin-pi",
    "/home/vchavkov/.config/brain/.agents/huashu-design"
  ],
  "hideThinkingBlock": false,
  "extensions": [
    "+extensions/cmux/index.ts",
    "+extensions/claude-code-cli/index.mjs",
    "+extensions/footer-inline-status/index.ts",
    "-extensions/model-status/index.ts"
  ]
}
EOF
else
  echo "settings.json already exists — skipping creation"
  echo ""
fi

# Install packages
echo "Installing packages..."
pi install git:github.com/nicobailon/pi-mcp-adapter 2>/dev/null || echo "  pi-mcp-adapter already installed"
pi install git:github.com/HazAT/pi-smart-sessions 2>/dev/null || echo "  pi-smart-sessions already installed"
pi install git:github.com/HazAT/pi-parallel 2>/dev/null || echo "  pi-parallel already installed"
pi install git:github.com/pasky/chrome-cdp-skill 2>/dev/null || echo "  chrome-cdp-skill already installed"
pi install git:github.com/HazAT/glimpse 2>/dev/null || echo "  glimpse already installed"
pi install git:github.com/HazAT/pi-interactive-subagents 2>/dev/null || echo "  pi-interactive-subagents already installed"
pi install git:github.com/HazAT/pi-autoresearch 2>/dev/null || echo "  pi-autoresearch already installed"
pi install git:github.com/badlogic/pi-diff-review 2>/dev/null || echo "  pi-diff-review already installed"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Restart pi to pick up all changes."
