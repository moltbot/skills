---
name: x-trends
description: "Fetches current top trending topics on X (Twitter) for any country using public aggregators."
version: 1.2.0
author: Ani
license: MIT
---

# X Trends Scraper 📉

A professional CLI tool to fetch X (Twitter) trending topics without an account.
Powered by [getdaytrends.com](https://getdaytrends.com).

## Installation

```bash
clawdhub install x-trends
```

## Usage

Run the tool directly:

```bash
# Default (India, Top 20, Table View)
x-trends

# JSON Output (for scripts)
x-trends --json

# Specific Country & Limit
x-trends --country us --limit 5
```

## Features
- **No Login Required**: Uses public aggregators.
- **Volume Data**: Shows tweet counts (<10K, 50K, etc).
- **Multi-Country**: Supports 'us', 'uk', 'india', 'world', etc.
- **JSON Mode**: Easy parsing for other tools.

## Output
Displays a clean, colorized table or raw JSON.
