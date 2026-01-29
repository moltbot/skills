---
name: serpapi-mcp
description: Run SerpAPI searches via SerpAPI's MCP server using mcporter. Use when the user asks to search the web with SerpAPI/SerpAPI MCP, wants SerpAPI inside Clawdbot, or to use the /serp command.
---

# serpapi-mcp

Wrapper skill for using **SerpAPI’s MCP server** from inside Clawdbot via `mcporter`.

## /serp usage

Treat this skill as providing the `/serp` command.

Syntax:
- `/serp <query>`
- `/serp <query> [engine] [num] [mode]`

Defaults:
- `engine=google_light`
- `num=5`
- `mode=compact` (`compact` strips some metadata; `complete` returns the full payload)

Examples:
- `/serp site:cnmv.es "educación financiera"`
- `/serp "AAPL stock" google 3 compact`
- `/serp "weather in Madrid" google 1 complete`

## Implementation

Run the bundled script (JSON output):
- `skills/serpapi-mcp/scripts/serp.sh "<query>" [engine] [num] [mode]`

It calls the MCP tool:
- `https://mcp.serpapi.com/$SERPAPI_API_KEY/mcp.search`

## Requirements

- `SERPAPI_API_KEY` must exist in the environment.
  - Recommended: set it in Clawdbot gateway config at `env.vars.SERPAPI_API_KEY`.

## Output

Returns JSON (from SerpAPI), typically including fields like `organic_results`, `news_results`, etc., depending on the engine.
