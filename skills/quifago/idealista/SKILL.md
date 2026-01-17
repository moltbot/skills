---
name: idealista
description: Query Idealista API via idealista-cli (OAuth2 client credentials).
license: MIT
homepage: https://github.com/quifago/idealista-cli
metadata: {"clawdbot": {"emoji": "🏠", "requires": {"bins": ["python3"], "env": ["IDEALISTA_API_KEY", "IDEALISTA_API_SECRET"], "primaryEnv": "IDEALISTA_API_KEY"}, "install": [{"id": "git", "kind": "git", "label": "Install idealista-cli (git clone)", "url": "https://github.com/quifago/idealista-cli", "bins": ["python3"]}]}}
---

# idealista

This skill documents how to query the Idealista API using the local `idealista-cli`.

## Local project location

- CLI source (example): `~/idealista-cli`

## Credentials (client_id / client_secret)

Idealista uses OAuth2 **Client Credentials**.

Use environment variables (recommended):

- `IDEALISTA_API_KEY` = `client_id`
- `IDEALISTA_API_SECRET` = `client_secret`

Example:

```bash
export IDEALISTA_API_KEY="<CLIENT_ID>"
export IDEALISTA_API_SECRET="<CLIENT_SECRET>"
```

Or persist them via the CLI:

```bash
python3 -m idealista_cli config set \
  --api-key "<CLIENT_ID>" \
  --api-secret "<CLIENT_SECRET>"
```

Config file path:
- `~/.config/idealista-cli/config.json`

Token cache:
- `~/.cache/idealista-cli/token.json`

## Common commands

Get a token:

```bash
python3 -m idealista_cli token
python3 -m idealista_cli token --refresh
```

Search listings:

```bash
python3 -m idealista_cli search \
  --center "39.594,-0.458" \
  --distance 5000 \
  --operation sale \
  --property-type homes \
  --all-pages \
  --format summary
```

Compute stats:

```bash
python3 -m idealista_cli avg \
  --center "39.594,-0.458" \
  --distance 5000 \
  --operation sale \
  --property-type homes \
  --group-by propertyType
```

## Example queries (natural language)

Use these as “prompt” examples for an agent that calls the CLI:

- "Find a flat in A Coruña under 200.000€"
- "Tell me the average price of a house around here: 39°34'33.5\"N 0°30'10.0\"W"
- "Búscame un apartamento de 3 habs en Tapia de Casariego para comprar"
