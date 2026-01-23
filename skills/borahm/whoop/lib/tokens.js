const fs = require('fs');
const path = require('path');

const CACHE_DIR = `${process.env.HOME || '/home/claw'}/.cache/whoop-morning`;
const TOKENS_PATH = path.join(CACHE_DIR, 'tokens.json');

function readTokens() {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf8');
    const json = JSON.parse(raw);
    if (!json || typeof json !== 'object') return null;
    return json;
  } catch {
    return null;
  }
}

function writeTokens(tokens) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2) + '\n');
}

function isAccessTokenValid(tokens) {
  if (!tokens?.access_token || typeof tokens.access_token !== 'string') return false;
  const expiresAtMs = tokens.expires_at_ms;
  if (typeof expiresAtMs !== 'number') return false;
  // Refresh 2 minutes early.
  return Date.now() + 120_000 < expiresAtMs;
}

module.exports = {
  readTokens,
  writeTokens,
  isAccessTokenValid,
  TOKENS_PATH,
};
