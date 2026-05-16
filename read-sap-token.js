#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

const home = os.homedir();
const piAuth = readJson(path.join(home, ".pi", "agent", "auth.json")) || {};
const claudeLocal = readJson(path.join(home, ".claude", "settings.local.json")) || {};
const claudeSettings = readJson(path.join(home, ".claude", "settings.json")) || {};
const claudeEnv = {
  ...(claudeSettings.env || {}),
  ...(claudeLocal.env || {}),
};

const anthropic = piAuth.anthropic || {};
const sapAnthropic = piAuth["sap-anthropic"] || {};

const token = firstString(
  claudeEnv.ANTHROPIC_AUTH_TOKEN,
  claudeEnv.ANTHROPIC_API_KEY,
  sapAnthropic.key,
  sapAnthropic.token,
  sapAnthropic.apiKey,
  sapAnthropic.api_key,
  anthropic.key,
  anthropic.token,
  anthropic.apiKey,
  anthropic.api_key,
  process.env.ANTHROPIC_AUTH_TOKEN,
  process.env.ANTHROPIC_API_KEY,
);

if (token) process.stdout.write(token);
