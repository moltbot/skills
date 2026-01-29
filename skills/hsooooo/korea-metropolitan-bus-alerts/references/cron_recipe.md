# Cron recipe (Clawdbot)

This skill targets **Clawdbot cron users**.

## Recommended approach
- Use **isolated** cron jobs (`sessionTarget: isolated`) so runs do not pollute the main chat.
- Set `payload.kind = "agentTurn"` and `payload.deliver = true`.
- Set delivery to the **registering user DM** at registration time.

## Schedule mapping (MVP)
- 매일 HH:MM  → `M H * * *`
- 평일 HH:MM  → `M H * * 1-5`
- 주말 HH:MM  → `M H * * 0,6`

## Helper
`scripts/cron_builder.py` can generate a job JSON payload once you have resolved:
- `cityCode`
- `nodeId`
- `routes`

The registering agent should then apply:
- `payload.channel` and `payload.to` (DM target)

## Safety
- Cron delete is destructive → confirm before acting.
- Never put API keys into markdown or cron job text.
