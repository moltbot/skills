---
name: monitoring-gen
description: Generate monitoring and alerting configuration. Use when setting up observability.
---

# Monitoring Generator

Setting up proper monitoring means dashboards, alerts, and metrics. Describe your setup and get configuration for Prometheus, Grafana, or Datadog.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-monitoring "node.js app with redis and postgres"
```

## What It Does

- Generates monitoring configuration for your stack
- Creates alert rules for common failure modes
- Sets up dashboard definitions
- Supports Prometheus, Grafana, Datadog

## Usage Examples

```bash
# Node.js monitoring
npx ai-monitoring "node.js app with redis and postgres"

# Kubernetes metrics
npx ai-monitoring "kubernetes cluster with 3 nodes"

# API monitoring
npx ai-monitoring "REST API with rate limiting alerts"
```

## Best Practices

- **Alert on symptoms** - not causes
- **Avoid alert fatigue** - only alert on actionable items
- **Include runbooks** - what to do when alerts fire
- **Dashboard key metrics** - latency, errors, throughput

## When to Use This

- Setting up monitoring for a new service
- Adding alerts to existing infrastructure
- Learning monitoring best practices
- Quick observability setup

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgicstudios.com

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-monitoring --help
```

## How It Works

Takes your infrastructure description and generates monitoring configuration including metrics to collect, alert thresholds, and dashboard layouts. The AI knows common patterns for different tech stacks.

## License

MIT. Free forever. Use it however you want.
