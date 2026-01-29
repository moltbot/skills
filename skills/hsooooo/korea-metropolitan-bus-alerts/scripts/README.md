# Scripts

- `tago_api.py`: HTTP helpers.
- `tago_bus_alert.py`: Minimal CLI helpers to query TAGO and format arrivals.
- `cron_builder.py`: Build cron job JSON (schedule + stop + routes → job payload).
- `rule_wizard.py`: Interactive rule registration that can call `clawdbot cron add`.

**No secrets** in this repo. Set `TAGO_SERVICE_KEY` in your environment.

Examples:

```bash
export TAGO_SERVICE_KEY='...'
python3 tago_bus_alert.py nearby-stops --lat 37.5665 --long 126.9780
python3 tago_bus_alert.py arrivals --city 25 --node DJB8001793 --routes 535,730

# (Recommended) one-command setup
python3 setup.py

# (Manual) save key once (interactive)
./set_tago_key.sh
source ~/.clawdbot/secrets/tago.env

# Interactive registration (creates a cron job)
python3 rule_wizard.py register
```

# Interactive registration (creates a cron job)
python3 rule_wizard.py register
```
