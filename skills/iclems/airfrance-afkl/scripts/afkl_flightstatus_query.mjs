#!/usr/bin/env node
import { afklFetchJson } from './afkl_http.mjs';

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (!v || v.startsWith('--')) ? def : v;
}

const carrier = (getArg('carrier', 'AF') || 'AF').toUpperCase();
const flight = String(parseInt(getArg('flight'), 10));
const origin = (getArg('origin') || '').toUpperCase();
const depDate = getArg('dep-date'); // YYYY-MM-DD local at origin

if (!flight || !depDate || !origin) {
  console.error('Usage: afkl_flightstatus_query.mjs --carrier AF --flight 7 --origin JFK --dep-date 2026-01-29');
  process.exit(2);
}

// Use a wide range window (UTC) around the departure date.
const startRange = `${depDate}T00:00:00Z`;
const endRange = new Date(Date.parse(`${depDate}T00:00:00Z`) + 48*3600*1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

const params = new URLSearchParams({
  startRange,
  endRange,
  movementType: 'D',
  origin,
  carrierCode: carrier,
  flightNumber: flight,
  pageSize: '10',
  pageNumber: '0',
  timeOriginType: 'S',
  timeType: 'L',
});

const url = `https://api.airfranceklm.com/opendata/flightstatus/?${params.toString()}`;

const data = await afklFetchJson(url);
console.log(JSON.stringify({ ok: true, url, data }, null, 2));
