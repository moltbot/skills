---
name: bahn
description: Search Deutsche Bahn train connections using the bahn-cli tool. Use when you need to find train connections between German stations, check departure times, or help with travel planning. Works with station names like "Berlin Hbf", "München", "Hannover".
---

# Deutsche Bahn CLI

Search train connections using the `bahn-cli` tool.

## Installation

The tool should be installed globally or in the workspace. If not installed:

```bash
cd ~/Code/bahn-cli && npm install
```

## Usage

Search train connections:

```bash
cd ~/Code/bahn-cli && node index.js search "<from>" "<to>" [options]
```

### Options

- `--date YYYY-MM-DD` - Departure date (default: today)
- `--time HH:MM` - Departure time (default: current time)
- `--results <number>` - Number of results to show (default: 5)

### Examples

Search connections from Hannover to Bonn:
```bash
cd ~/Code/bahn-cli && node index.js search "Hannover Hbf" "Bonn Hbf" --results 3
```

Search with specific date and time:
```bash
cd ~/Code/bahn-cli && node index.js search "Berlin" "München" --date 2026-02-05 --time 14:30
```

## Station Names

- Use common German station names
- "Hbf" means Hauptbahnhof (main station)
- Examples: "Berlin Hbf", "München Hbf", "Frankfurt(Main)Hbf", "Köln Hbf"
- Station names are case-insensitive

## Output

The tool shows:
- Departure and arrival times
- Platform numbers
- Duration
- Number of changes
- Intermediate stops for connections with changes
- Train numbers (ICE, IC, RE, etc.)

## Notes

- The CLI uses the db-vendo-client library
- Some station names in output may show "undefined" (cosmetic issue, doesn't affect functionality)
- Direct connections are listed first
- Times are in 24-hour format
