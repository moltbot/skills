#!/usr/bin/env node
// Best-effort aircraft intel via public sources.
// Currently: Planespotters public API (no key) + local cache.

import fs from 'node:fs';

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (!v || v.startsWith('--')) ? def : v;
}

const regRaw = (getArg('reg') || '').toUpperCase();
if (!regRaw) {
  console.error('Usage: aircraft_intel.mjs --reg F-HXXX');
  process.exit(2);
}

function normalizeRegs(input) {
  const r = String(input).toUpperCase().replace(/\s+/g,'');
  const out = new Set([r]);
  // Common Air France registrations: FGSQB -> F-GSQB
  if (/^F[A-Z0-9]{4}$/.test(r)) out.add(`F-${r.slice(1)}`);
  if (/^F-[A-Z0-9]{4}$/.test(r)) out.add(`F${r.slice(2)}`);
  return Array.from(out);
}

const regs = normalizeRegs(regRaw);
const primary = regs[0];

const CACHE_PATH = process.env.CLAWDBOT_STATE_DIR ? `${process.env.CLAWDBOT_STATE_DIR}/aircraft_intel_cache.json` : '/tmp/aircraft_intel_cache.json';
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
}

const now = Date.now();
const cached = cache[primary];
if (cached && cached.expiresAtMs && now < cached.expiresAtMs) {
  console.log(JSON.stringify({ ok: true, reg: primary, tried: regs, source: 'cache', intel: cached.intel }, null, 2));
  process.exit(0);
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { 'accept': 'application/json' } });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!resp.ok || !json) {
    const err = new Error(`HTTP ${resp.status}`);
    err.body = text.slice(0, 300);
    throw err;
  }
  return json;
}

let intel = { reg: primary };
try {
  // Planespotters API: https://api.planespotters.net/pub/photos/reg/{reg}
  for (const r of regs) {
    try {
      const url = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(r)}`;
      const j = await fetchJson(url);
      const photo = (j.photos && j.photos[0]) || null;
      const ac = photo && photo.aircraft || null;
      if (ac) {
        intel = {
          reg: r,
          icao24: ac.icao24 || null,
          manufacturer: ac.manufacturer || null,
          model: ac.model || null,
          msn: ac.msn || null,
          lineNumber: ac.lineNumber || null,
          operator: ac.operator || null,
          owner: ac.owner || null,
          firstFlightDate: ac.firstFlightDate || null,
          deliveryDate: ac.deliveryDate || null,
          ageYears: ac.ageYears ?? null,
        };
        break;
      }
    } catch {}
  }
} catch {
  intel = { reg: primary, error: 'lookup_failed' };
}

// Cache for 7 days (store under primary key)
cache[primary] = { intel, expiresAtMs: now + 7*24*3600*1000 };
try { fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2)); } catch {}

console.log(JSON.stringify({ ok: true, reg: primary, tried: regs, source: 'live', intel }, null, 2));
