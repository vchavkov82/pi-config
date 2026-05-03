# Pi Configuration Architecture

## Single Source of Truth

**This directory** (`~/.config/brain/.agents/pi-config/`) is the **global source of truth** for all pi configuration.

## Configuration Hierarchy

```
~/.config/brain/.agents/pi-config/  ← GLOBAL (source of truth)
  ├── settings.json                 ← Models, packages, extensions
  ├── models.json                   ← Model definitions & providers
  ├── agents/                       ← Agent definitions
  ├── skills/                       ← Global skills
  └── extensions/                   ← Global extensions

~/.config/brain/.local/<hostname>/  ← HOST-SPECIFIC (rare overrides)
  └── .pi/settings.json             ← Symlink or minimal overrides

~/src/<project>/.pi/                ← PROJECT-SPECIFIC (minimal)
  └── settings.json                 ← Only project-specific packages
```

## Rules

### ✅ DO

1. **Define all models globally** in `settings.json`
2. **Keep project configs minimal** - only project-specific packages/skills
3. **Inherit from global** - remove `enabledModels` from project configs
4. **Document exceptions** - if you need project-specific models, explain why

### ❌ DON'T

1. **Duplicate model lists** across projects
2. **Override models per-project** unless absolutely necessary
3. **Create per-host configs** unless host-specific (different providers, keys, etc.)

## Example Project Config

**Good** (minimal, inherits models):
```json
{
  "packages": [
    "/home/vchavkov/.config/brain/.agents/_pi/packages/project-specific-tool"
  ]
}
```

**Bad** (duplicates global config):
```json
{
  "enabledModels": [
    "sap-anthropic/anthropic--claude-4.6-opus",
    "sap-anthropic/anthropic--claude-4.6-sonnet",
    "sap-anthropic/anthropic--claude-4.6-haiku",
    ...
  ],
  "packages": [...]
}
```

## Current Setup

- **Global models**: SAP proxy provider (`sap-anthropic/*`), Bosch Claude Code provider (`bosch-claude-code/*`), SAP OpenAI (`sap-openai/*`), and Codex (`openai-codex/*`)
- **Project configs**: Inherit models, define only project packages
- **Skills**: All on-demand (`disable-model-invocation: true`)

## Changes to Models

To add/remove models globally:

1. Edit `~/.config/brain/.agents/pi-config/settings.json`
2. Commit and push to `pi-config` repo
3. All projects automatically inherit the change
