---
name: korea-metropolitan-bus-alerts
description: Create and manage scheduled bus arrival alerts using Korea TAGO (국토교통부) OpenAPI and Clawdbot cron. Use when a user wants to register weekday/weekend schedules like "평일 오전 7시, <정류소명>, <노선들>" and receive automatic arrival summaries via their configured Gateway messaging (DM only).
---

# 수도권 버스 도착 알림 (Clawdbot cron)

Scheduled bus arrival alerts powered by **국토교통부 TAGO OpenAPI**.

This skill is designed for users running **Clawdbot Gateway + Clawdbot cron**. Users register rules like:
- "평일 오전 7시, 인천 한빛초등학교, 535"
- "평일 오후 5시30분, 고양 향동초등학교, 730, 503"

Then the system sends arrival summaries to the **registering user (DM)** on schedule.

> Note (MVP): stop resolution is done via **stop name search** (cityCode + keyword). GPS-based nearby lookup exists but may return 0 results depending on key/region.

## Prerequisites
- A running Clawdbot Gateway (Telegram/Slack/etc. already configured)
- Clawdbot cron enabled/usable
- A data.go.kr API key for TAGO

## One-time setup: TAGO API key
You must set a TAGO service key in your environment (never commit or paste it into markdown).

Recommended env var:
- `TAGO_SERVICE_KEY`

### Option A (fastest): one-off test in your current shell
Good for quick manual tests; **cron jobs will NOT inherit this** unless the Gateway service has it.

```bash
export TAGO_SERVICE_KEY='...'
```

### Option B (recommended): one-command setup (auto-detect systemd unit)
This is the most “set it once and forget it” flow.

Run:
```bash
python3 korea-metropolitan-bus-alerts/scripts/setup.py
```

If your network blocks the endpoint or TAGO returns 403 during the smoke test, you can still complete setup:
```bash
python3 korea-metropolitan-bus-alerts/scripts/setup.py --skip-smoke
```

It will:
- Auto-detect your Gateway systemd user service (supports custom unit names)
- Prompt for `TAGO_SERVICE_KEY` (hidden input)
- Save it to `~/.clawdbot/secrets/tago.env` (chmod 600)
- Write a systemd override to load that env file
- Restart the Gateway
- Run a small TAGO smoke test

(Advanced/manual) If you prefer shell scripts, `korea-metropolitan-bus-alerts/scripts/set_tago_key.sh` is still available, but `setup.py` is the recommended UX.

### Safety notes
- Never commit `.env` / `tago.env`.
- Avoid sharing outputs of `docker compose config` or similar commands that may print env values.

## Quick start

### A) Test TAGO connectivity (manual)
```bash
export TAGO_SERVICE_KEY='...'
python3 korea-metropolitan-bus-alerts/scripts/tago_bus_alert.py nearby-stops --lat 37.5665 --long 126.9780
```

### B) Register an alert rule (interactive)
Tell the agent something like:
- "평일 07:00, 인천 한빛초등학교, 535 알림 등록해줘"

If the stop name is ambiguous (e.g., opposite side of road), the agent MUST ask a follow-up question to pick the correct direction/stop candidate before creating the rule.

### C) List rules
- "버스 알림 목록 보여줘"

### D) Delete a rule
- "버스 알림 3번 삭제해줘" (confirm before delete)

### E) Test a rule (run now)
- "방금 등록한 규칙 테스트해줘" (one-time message)

## Supported schedule expressions (MVP)
- 매일 HH:MM
- 평일 HH:MM
- 주말 HH:MM

(Phase 2: arbitrary cron expressions)

## Cron implementation notes
- Use isolated cron jobs (`sessionTarget: isolated`) + `deliver: true`.
- Delivery is **DM-only** to the registering user.
- See `references/cron_recipe.md` and `scripts/cron_builder.py`.

### Interactive registration helper (server-side)
For integration testing (and for power users), use:
- `scripts/rule_wizard.py register`

It will:
1) Ask for schedule/time/routes
2) Resolve stop candidates via GPS nearby lookup (direction disambiguation)
3) Generate the job JSON
4) Optionally call `clawdbot cron add` to register it

## Data source
Single provider only (MVP):
- 정류장 조회: BusSttnInfoInqireService (15098534)
- 도착 조회: ArvlInfoInqireService (15098530)

## Safety / Security
- Never write API keys/tokens/passwords into markdown files.
- For browser automation on logged-in pages: require explicit user confirmation.
- For destructive operations (cron delete): confirm before acting.
- DM-only delivery (MVP): do not broadcast to groups/channels.

## Implementation notes
- Prefer scripts under `scripts/` for deterministic behavior.
- Put detailed API field mappings in `references/api_reference.md`.

### Deterministic helper script
Use `scripts/tago_bus_alert.py` for deterministic TAGO lookups:
- `nearby-stops` (GPS → stop candidates)
- `arrivals` (cityCode+nodeId → arrivals; optional route filtering)
