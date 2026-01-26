#!/usr/bin/env node
/**
 * Asana OAuth (OOB/manual code paste) helper.
 *
 * Usage:
 *   ASANA_CLIENT_ID=... ASANA_CLIENT_SECRET=... node asana/scripts/oauth_oob.mjs authorize
 *   ASANA_CLIENT_ID=... ASANA_CLIENT_SECRET=... node asana/scripts/oauth_oob.mjs token --code "..."
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const AUTH_URL = 'https://app.asana.com/-/oauth_authorize';
const TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
      flags[k] = v;
    }
  }
  return { cmd, flags };
}

function tokenPath() {
  return path.join(os.homedir(), '.clawdbot', 'asana', 'token.json');
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function saveToken(json) {
  const p = tokenPath();
  ensureDir(p);
  fs.writeFileSync(p, JSON.stringify(json, null, 2));
  console.log(`Saved token to: ${p}`);
}

function urlEncode(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.set(k, String(v));
  }
  return u.toString();
}

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: urlEncode(params),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  let clientId = process.env.ASANA_CLIENT_ID;
  let clientSecret = process.env.ASANA_CLIENT_SECRET;

  // Optional fallback to ~/.clawdbot/asana/credentials.json
  try {
    const credPath = path.join(os.homedir(), '.clawdbot', 'asana', 'credentials.json');
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    clientId = clientId || creds.client_id;
    clientSecret = clientSecret || creds.client_secret;
  } catch {
    // ignore
  }

  if (!cmd) die('Command required: authorize | token');
  if (!clientId) die('Missing ASANA_CLIENT_ID (or ~/.clawdbot/asana/credentials.json)');

  if (cmd === 'authorize') {
    const scope = flags.scope || 'default';
    const state = flags.state || crypto.randomUUID();
    // Asana supports code challenge / PKCE; OOB is typically used for simple flows.
    const url = `${AUTH_URL}?${urlEncode({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state,
      // If you want explicit scopes, pass --scope "tasks:read tasks:write"
      ...(scope !== 'default' ? { scope } : {}),
    })}`;
    console.log('Open this URL in your browser, click Allow, then copy the code:');
    console.log(url);
    console.log('\nThen run:');
    console.log(`node asana/scripts/oauth_oob.mjs token --code "PASTE_CODE"`);
    return;
  }

  if (cmd === 'token') {
    if (!clientSecret) die('Missing ASANA_CLIENT_SECRET');
    const code = flags.code;
    if (!code || typeof code !== 'string') die('Missing --code');

    const data = await postForm(TOKEN_URL, {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      code,
    });

    // Normalize with a timestamp; Asana returns expires_in (seconds)
    const now = Date.now();
    const token = {
      ...data,
      obtained_at_ms: now,
      expires_at_ms: typeof data.expires_in === 'number' ? now + data.expires_in * 1000 : null,
    };

    saveToken(token);
    return;
  }

  die(`Unknown command: ${cmd}`);
}

main().catch((e) => die(String(e?.stack || e)));
