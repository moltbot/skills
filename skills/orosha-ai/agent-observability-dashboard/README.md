# Agent Observability Dashboard 📊

Production-grade observability for OpenClaw agents — metrics, traces, and insights.

## Quick Start

```bash
# Record a metric interactively
python3 scripts/observability.py --record --session my-session --latency 1234 --success

# Get session trace
python3 scripts/observability.py --trace my-session

# Generate performance report (24h, 1h, 7d)
python3 scripts/observability.py --report 24h

# Check alert thresholds
python3 scripts/observability.py --alerts

# Export metrics to JSON
python3 scripts/observability.py --export metrics.json
```

## Features

✅ **Metrics tracking** — Latency, success rate, token usage, errors  
✅ **Trace visualization** — Full tool chains per session  
✅ **Cross-session aggregation** — Compare performance over time  
✅ **Alert thresholds** — Notify when metrics exceed limits  
✅ **Exportable reports** — JSON, CSV, markdown  

## Metrics Tracked

| Category | Metric | Description |
|-----------|---------|-------------|
| **Performance** | Latency | Tool call latency (ms) |
| **Success** | Success Rate | % of successful tool calls |
| **Cost** | Token Usage | Total input + output tokens |
| **Quality** | Error Count | Failed operations |

## Default Alert Thresholds

- **Latency:** >5000ms
- **Success Rate:** <70%
- **Error Count:** >10 in 24h

## Trace Format

```json
{
  "session_id": "agent:main:12345",
  "trace": [
    {
      "tool": "web_search",
      "latency_ms": 1234,
      "success": true,
      "tokens_used": 150,
      "timestamp": "2026-01-31T15:00:00Z"
    }
  ]
}
```

## Installation

```bash
git clone https://github.com/orosha-ai/agent-observability-dashboard
pip install flask pandas
```

## License

MIT
