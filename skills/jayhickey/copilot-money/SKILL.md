---
name: copilot-money
description: Query Copilot Money personal finance data (accounts, transactions, net worth, holdings, asset allocation) and refresh bank connections. Use when the user asks about finances, account balances, recent transactions, net worth, investment allocation, or wants to sync/refresh bank data.
---

# Copilot Money CLI

Command-line interface for [Copilot Money](https://copilot.money), a personal finance app. Authenticate once and query accounts, transactions, holdings, and allocation data from your terminal.

> **Note:** This is an unofficial tool and is not affiliated with Copilot Money.

## Install

```bash
pip install copilot-money-cli
```

## Quick start

```bash
copilot-money config init
copilot-money accounts
copilot-money networth
```

## Commands

```bash
copilot-money refresh                     # Refresh all bank connections
copilot-money accounts                    # List accounts with balances
copilot-money accounts --type CREDIT      # Filter by type
copilot-money accounts --json             # Output as JSON
copilot-money transactions                # Recent transactions (default 20)
copilot-money transactions --count 50     # Specify count
copilot-money networth                    # Assets, liabilities, net worth
copilot-money holdings                    # Investment holdings (grouped by type)
copilot-money holdings --group account    # Group by account
copilot-money holdings --group symbol     # Group by symbol
copilot-money holdings --type ETF         # Filter by security type
copilot-money allocation                  # Stocks/bonds with US/Intl split
copilot-money config show                 # Show config and token status
copilot-money config init                 # Auto-detect token from browsers
copilot-money config init --source chrome # From specific browser
copilot-money config init --source manual # Manual token entry
```

## Authentication

Config stored at `~/.config/copilot-money/config.json`. The CLI auto-detects your Copilot Money refresh token from supported browsers on macOS.

- Auto-detect: `copilot-money config init`
- Explicit source: `copilot-money config init --source arc|chrome|safari|firefox`
- Manual entry: `copilot-money config init --source manual`

When using browser auto-detection, the CLI reads your browser's local IndexedDB storage to find your Copilot Money session token. This happens locally — no data is sent anywhere except to Copilot Money's API.

## Requirements

- Python 3.10+
- macOS for browser token extraction (manual token entry works everywhere)
