---
name: emporia-energy
description: Direct Emporia Vue energy queries via Emporia cloud (PyEmVue) or local ESPHome API, including guidance on choosing/configuring cloud vs local modes and running list/summary/circuit commands.
metadata: {"moltbot":{"emoji":"⚡","os":["darwin","linux","win32"],"requires":{"bins":["python3"],"env":["EMPORIA_MODE"]}}}
---

# Emporia Energy Skill

Use the scripts in `{baseDir}/scripts` to query Emporia Vue data directly.

Modes are selected with `EMPORIA_MODE`:
- `cloud`: Emporia cloud API via PyEmVue (like the Home Assistant integration)
- `esphome`: Local ESPHome API (for flashed devices)

## Choose a mode (cloud vs local)

- Use **cloud** if your Emporia device is still on stock firmware or you want the simplest setup. Requires Emporia account credentials and internet access.
- Use **esphome** only if the device is flashed with ESPHome and on your LAN. Requires the device IP/hostname and native API access on port 6053.

If you are unsure whether the device is ESPHome-flashed, choose cloud mode.

## Environment

### Cloud mode
- `EMPORIA_EMAIL`
- `EMPORIA_PASSWORD`

Optional:
- `EMPORIA_SCALE` (`MINUTE`, `SECOND`, `MINUTES_15`, `DAY`, `MONTH`) - defaults to `MINUTE`

### ESPHome mode
- `ESPHOME_HOST`
- `ESPHOME_PORT` (optional, default `6053`)
- `ESPHOME_API_KEY` (Noise PSK, base64) or `ESPHOME_PASSWORD` (legacy)

## Configuration steps

Cloud:
1. Set `EMPORIA_MODE=cloud`.
2. Set `EMPORIA_EMAIL` and `EMPORIA_PASSWORD`.
3. (Optional) Set `EMPORIA_SCALE` to control power vs energy units.
4. Run `list` first to confirm channels, then `summary` or `circuit <name>`.

ESPHome:
1. Ensure the device is flashed with ESPHome and on your LAN.
2. Set `EMPORIA_MODE=esphome`.
3. Set `ESPHOME_HOST` to the device IP/hostname (not Home Assistant).
4. If the ESPHome node uses encryption, set `ESPHOME_API_KEY` (base64 Noise PSK).
5. Run `list` first to confirm channels, then `summary` or `circuit <name>`.

## Commands

The scripts accept:
- `summary` (default)
- `list`
- `circuit <name>`

## Usage

Cloud:
```
export EMPORIA_MODE=cloud
export EMPORIA_EMAIL="you@example.com"
export EMPORIA_PASSWORD="..."
python {baseDir}/scripts/emporia_cloud.py summary
```

ESPHome:
```
export EMPORIA_MODE=esphome
export ESPHOME_HOST="192.168.1.50"
export ESPHOME_API_KEY="base64-noise-psk"
python {baseDir}/scripts/emporia_esphome.py summary
```

## Dependencies (pip by default)

Cloud:
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r {baseDir}/requirements-cloud.txt
```

ESPHome:
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r {baseDir}/requirements-esphome.txt
```

Optional: you can use `uv` instead of `pip` if preferred.

## Output

Scripts emit JSON with:
- timestamp
- unit
- total (best-effort)
- top circuits
- channels used

## Safety

- Never print secrets (passwords, tokens, keys).
- Do not make hardware or panel wiring recommendations.
