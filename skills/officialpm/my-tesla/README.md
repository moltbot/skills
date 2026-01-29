# My Tesla

Tesla control skill for Clawdbot.

Author: Parth Maniar — [@officialpm](https://github.com/officialpm)

## What’s inside

- `SKILL.md` — the skill instructions
- `scripts/tesla.py` — the CLI implementation (teslapy)
- `VERSION` + `CHANGELOG.md` — versioning for ClawdHub publishing

## Install / auth

Set `TESLA_EMAIL` and run:

```bash
TESLA_EMAIL="you@email.com" python3 scripts/tesla.py auth
```

This uses a browser-based login flow and stores tokens locally in `~/.tesla_cache.json`.

Optional defaults:
- `MY_TESLA_DEFAULT_CAR` — default vehicle display name (overrides `default-car` setting)
- `python3 scripts/tesla.py default-car "Name"` stores a local default in `~/.my_tesla.json`

## Usage

```bash
# List vehicles (shows which one is default)
python3 scripts/tesla.py list
python3 scripts/tesla.py list --json   # machine-readable, privacy-safe

# Pick a car (optional)
# --car accepts: exact name, partial name (substring match), or a 1-based index from `list`
python3 scripts/tesla.py --car "Model" report
python3 scripts/tesla.py --car 1 status

# Set default car (used when you don't pass --car)
python3 scripts/tesla.py default-car "My Model 3"

# One-line summary (best for chat)
python3 scripts/tesla.py summary
python3 scripts/tesla.py summary --no-wake   # don't wake a sleeping car

# One-screen report (chat friendly, more detail)
# Includes battery/charging/climate + charge port/cable + (when available) TPMS tire pressures.
python3 scripts/tesla.py report
python3 scripts/tesla.py report --no-wake

# Detailed status
python3 scripts/tesla.py status
python3 scripts/tesla.py status --no-wake
python3 scripts/tesla.py status --summary   # include one-line summary + detailed output

# JSON output (prints ONLY JSON; good for piping/parsing)
# NOTE: `status --json` outputs *raw* `vehicle_data`, which may include location/drive_state.
# Prefer `report --json` (sanitized) unless you explicitly need the raw payload.
python3 scripts/tesla.py status --json            # raw vehicle_data (may include location)
python3 scripts/tesla.py report --json            # sanitized report object (no location)
python3 scripts/tesla.py report --json --raw-json # raw vehicle_data (may include location)
python3 scripts/tesla.py charge status --json

python3 scripts/tesla.py --car "My Model 3" lock
# Climate (status is read-only)
python3 scripts/tesla.py climate status
python3 scripts/tesla.py climate status --no-wake
python3 scripts/tesla.py climate temp 72      # default: °F
python3 scripts/tesla.py climate temp 22 --celsius
python3 scripts/tesla.py charge limit 80 --yes   # 50–100
python3 scripts/tesla.py charge amps 16 --yes     # 1–48 (conservative guardrail)

# Scheduled charging (set/off are safety gated)
python3 scripts/tesla.py scheduled-charging status
python3 scripts/tesla.py scheduled-charging set 23:30 --yes
python3 scripts/tesla.py scheduled-charging off --yes

# Trunk / frunk (safety gated)
python3 scripts/tesla.py trunk trunk --yes
python3 scripts/tesla.py trunk frunk --yes

# Windows (safety gated)
python3 scripts/tesla.py windows vent  --yes
python3 scripts/tesla.py windows close --yes

# Charge port door (safety gated)
python3 scripts/tesla.py charge-port open  --yes
python3 scripts/tesla.py charge-port close --yes

# Sentry Mode (status is read-only; on/off safety gated)
python3 scripts/tesla.py sentry status
python3 scripts/tesla.py sentry status --no-wake
python3 scripts/tesla.py sentry on  --yes
python3 scripts/tesla.py sentry off --yes

# Location (approx by default; use --yes for precise coordinates)
python3 scripts/tesla.py location
python3 scripts/tesla.py location --no-wake
python3 scripts/tesla.py location --yes

# Tire pressures (TPMS)
python3 scripts/tesla.py tires
python3 scripts/tesla.py tires --no-wake

# Openings (doors/trunks/windows)
python3 scripts/tesla.py openings
python3 scripts/tesla.py openings --no-wake
python3 scripts/tesla.py openings --json
```

## Tests

```bash
# (Recommended) avoid writing __pycache__/ bytecode files into the repo
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v

# Or use the helper (cleans stray bytecode first and fails if any is produced):
./scripts/run_tests.sh
```

## Privacy / safety

- Never commit tokens, VINs, or location outputs.
- Some commands (unlock/charge start|stop|limit|amps/trunk/windows/sentry on|off/honk/flash/charge-port open|close/scheduled-charging set|off) require `--yes`.
- Read-only commands support `--no-wake` to avoid waking the car (will fail if the vehicle is asleep/offline).
- `location` shows *approximate* coords by default; add `--yes` for precise coordinates.
