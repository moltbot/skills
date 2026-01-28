---
name: monitor-gen
description: Generate monitoring and alerting configs for Prometheus and Grafana. Use when setting up observability.
---

# Monitoring Config Generator

Get Prometheus rules and Grafana dashboards without reading docs for hours. Describe what you want to monitor and get production ready configs instantly.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-monitoring "node.js api with postgres and redis"
```

## What It Does

- Generates Prometheus alerting rules for common failure modes
- Creates Grafana dashboard JSON you can import directly
- Covers CPU, memory, disk, and custom application metrics
- Sets sensible thresholds based on industry standards
- Includes runbook links and alert descriptions

## Usage Examples

```bash
# Monitor a web service
npx ai-monitoring "express api with 99.9% uptime SLA"

# Database monitoring
npx ai-monitoring "postgres primary with 2 replicas"

# Full stack
npx ai-monitoring "kubernetes cluster with 10 nodes running microservices"
```

## Best Practices

- **Tune thresholds** - Start with defaults, adjust after observing real traffic
- **Don't alert on everything** - Only alert on actionable issues
- **Add context** - Include runbook URLs in your alert annotations
- **Test alerts** - Intentionally trigger alerts to verify they fire correctly

## When to Use This

- Setting up monitoring for a new service
- Adding observability to existing infrastructure
- Learning Prometheus query syntax through examples
- Standardizing alerting across your team

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

```bash
npx ai-monitoring --help
```

## How It Works

The tool understands common infrastructure patterns and generates PromQL queries and Grafana panel definitions. It maps your description to metric names and creates appropriate aggregations and thresholds.

## License

MIT. Free forever. Use it however you want.
