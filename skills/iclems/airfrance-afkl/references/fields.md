# AFKL Flight Status (Open Data) — fields to watch

This is a practical mapping for alerting + “is my flight at risk?”. Exact field names may vary by API version.

## Identifiers
- `id` (e.g. `20260130+AF+0007`) — can be fetched directly:
  - `GET https://api.airfranceklm.com/opendata/flightstatus/{id}`

## Status
- `flightStatusPublic` / `flightStatusPublicLangTransl`
- Per-leg `publishedStatus`, `status`, `statusName`

Heuristic:
- Alert on any change in public status, or when estimated times move by ≥10–15 min.

## Times
Usually under `flightLegs[0].departureInformation.times` and `arrivalInformation.times`:
- `scheduled` — baseline
- `estimated` / `latest` — “best current”
- `actual` — when departed/arrived

## Airport / terminal / gate
Typically under `departureInformation.airport.places`:
- `terminalCode` / `boardingTerminal`
- `gateNumber` / `paxDepartureGate`
- `checkInZone`

## Previous-flight chain (very useful)
Under `flightRelations.previousFlightData`:
- `id`, `flightScheduleDate`, `airlineCode`, `flightNumber`

Why it’s useful:
- If the aircraft is late arriving for the previous segment, it increases delay risk.

Practical approach:
- Fetch previous flight by `id`, check its status + ETA.
- Optionally fetch `previous of previous` (depth 2) if you’re far from departure.

## Aircraft information
Often under `flightLegs[0].aircraft`:
- `registration` (tail number)
- `typeCode`, `typeName`
- `subFleetCodeId`
- `physicalPaxConfiguration`, `operationalConfiguration`
- `wifiEnabled`, `highSpeedWifi`, `satelliteConnectivityOnBoard`

What to do with it:
- Tail number → best-effort enrichment via public sources (see `scripts/aircraft_intel.mjs`).
- `operationalConfiguration` / `physicalPaxConfiguration` → can hint cabin generation (best-effort; codes vary).
- `highSpeedWifi=true` is the most actionable “good Wi‑Fi” signal exposed here.

## Parking / stand / bus vs jetbridge (best-effort)
Some feeds expose stand/parking position type; when present, it can hint:
- contact stand (jetbridge) vs remote stand (bus)

Treat as:
- “nice to have”; don’t promise accuracy unless the field is explicitly present.

## Rate limits
- Global: 1 request/sec (don’t burst)
- Daily: keep total requests low (schedule-aware polling)

## State directory (community-friendly)
The scripts store state/caches under `CLAWDBOT_STATE_DIR` (or `AFKL_STATE_DIR`), falling back to `./state`.
