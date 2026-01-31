# Agent Observability Dashboard 📊

Unified observability for OpenClaw agents — metrics, traces, and performance insights.

## What It Does

OpenClaw agents need production-grade visibility. Multiple platforms exist (Langfuse, Langsmith, AgentOps) but no unified view.

**Agent Observability Dashboard** provides:
- **Metrics tracking** — Latency, success rate, token usage, error counts
- **Trace visualization** — Tool chains, decision flows, session timelines
- **Cross-agent aggregation** — Compare performance across multiple agents/sessions
- **Exportable reports** — JSON, CSV, markdown for human review
- **Alert thresholds** — Notify when metrics exceed limits

## Problem It Solves

- No centralized view of OpenClaw agent performance
- Hard to debug across multiple tool calls
- No way to compare agents or track regressions
- Production monitoring is enterprise-grade; agents need the same

## Usage

```bash
# Start dashboard server
python3 scripts/observability.py --dashboard

# Record metrics from a session
python3 scripts/observability.py --record --session agent:main --latency 1.5 --success true

# View session trace
python3 scripts/observability.py --trace --session agent:main:12345

# Get performance report
python3 scripts/observability.py --report --period 24h

# Export to CSV
python3 scripts/observability.py --export metrics.csv

# Set alert thresholds
python3 scripts/observability.py --alert --metric latency --threshold 5.0
```

## Metrics Tracked

| Category | Metric | Description |
|-----------|---------|-------------|
| **Performance** | Latency | Tool call latency (ms) |
| | Throughput | Calls per second |
| **Success** | Success Rate | % of successful tool calls |
| | Error Count | Failed operations |
| **Cost** | Token Usage | Input + output tokens |
| | API Cost | Estimated cost in USD |
| **Quality** | Hallucinations | Detected false outputs |
| | Corrections Needed | User corrections |

## Trace Format

Each tool call is logged with:
- Timestamp
- Agent session ID
- Tool name + parameters
- Latency
- Success/failure
- Token usage
- Error details (if failed)

Example trace:
```json
{
  "session_id": "agent:main:12345",
  "trace": [
    {
      "timestamp": "2026-01-31T14:00:00Z",
      "tool": "web_search",
      "params": {"query": "agent observability"},
      "latency_ms": 1234,
      "success": true,
      "tokens_used": 150
    },
    {
      "timestamp": "2026-01-31T14:00:02Z",
      "tool": "memory_write",
      "params": {"content": "..."},
      "latency_ms": 45,
      "success": true,
      "tokens_used": 0
    }
  ]
}
```

## Architecture

```
┌─────────────────┐
│  Instrumentation│  ← Auto-capture from OpenClaw logs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Metrics Store  │  ← SQLite/InfluxDB for time-series
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analytics      │  ← Aggregations, trends, anomalies
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard UI  │  ← Web interface (Flask/FastAPI)
└─────────────────┘
```

## Requirements

- Python 3.9+
- flask (for dashboard web UI)
- pandas (for analytics)
- influxdb-client (optional, for production storage)

## Installation

```bash
# Clone repo
git clone https://github.com/orosha-ai/agent-observability-dashboard

# Install dependencies
pip install flask pandas influxdb-client

# Run dashboard
python3 scripts/observability.py --dashboard
# Open http://localhost:5000
```

## Inspiration

- **Dynatrace AI Observability App** — Enterprise-grade unified observability
- **Langfuse vs AgentOps benchmarks** — Comparison of platforms
- **Microsoft .NET tracing guide** — Practical implementation patterns
- **OpenLLMetry** — OpenTelemetry integration for LLMs

## Local-Only Promise

- Metrics stored locally (SQLite/InfluxDB)
- Dashboard runs locally
- No data sent to external services

## Version History

- **v0.1** — MVP: Metrics tracking, trace visualization, dashboard UI
- Roadmap: InfluxDB integration, anomaly detection, multi-agent comparison
