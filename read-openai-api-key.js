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

const openai = piAuth.openai || {};

const token = firstString(
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_TOKEN,
  openai.key,
  openai.apiKey,
  openai.api_key
);

if (token) process.stdout.write(token);
