#!/usr/bin/env python3
"""
Fetch Polymarket user profile data (positions, trades, P&L).
Usage: python fetch-polymarket-user-profile.py <wallet_address> [--trades] [--pnl] [--json]
"""

import argparse
import json
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError

DATA_API = "https://data-api.polymarket.com"


def fetch_api(endpoint: str) -> dict | list | None:
    """Fetch data from Data API."""
    url = f"{DATA_API}{endpoint}"
    try:
        req = Request(url, headers={"User-Agent": "ClawdbotMonitor/1.0"})
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except (URLError, json.JSONDecodeError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return None


def format_positions(positions: list) -> str:
    """Format positions for display."""
    if not positions:
        return "No open positions."

    lines = ["## Positions\n"]
    lines.append("| Market | Side | Shares | Entry | Current | P&L |")
    lines.append("|--------|------|--------|-------|---------|-----|")

    total_pnl = 0
    for p in positions:
        market = p.get("title", p.get("market", "Unknown"))[:40]
        outcome = p.get("outcome", "?")
        size = float(p.get("size", 0))
        avg_price = float(p.get("avgPrice", 0))
        cur_price = float(p.get("curPrice", p.get("currentPrice", 0)))
        pnl = float(p.get("pnl", (cur_price - avg_price) * size))
        total_pnl += pnl

        lines.append(f"| {market} | {outcome} | {size:.1f} | ${avg_price:.3f} | ${cur_price:.3f} | ${pnl:+.2f} |")

    lines.append(f"\n**Total P&L:** ${total_pnl:+.2f}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Fetch Polymarket user profile")
    parser.add_argument("wallet", help="Wallet address (0x...)")
    parser.add_argument("--trades", action="store_true", help="Include trade history")
    parser.add_argument("--pnl", action="store_true", help="Include P&L history")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    wallet = args.wallet.lower()
    if not wallet.startswith("0x"):
        print("Error: Invalid wallet address", file=sys.stderr)
        sys.exit(1)

    result = {"wallet": wallet}

    # Fetch positions
    positions = fetch_api(f"/positions?user={wallet}")
    result["positions"] = positions if positions else []

    # Fetch trades if requested
    if args.trades:
        trades = fetch_api(f"/trades?user={wallet}")
        result["trades"] = trades if trades else []

    # Fetch P&L if requested
    if args.pnl:
        pnl = fetch_api(f"/profit-loss?user={wallet}")
        result["profit_loss"] = pnl if pnl else []

    # Output
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"# Polymarket Profile: {wallet[:10]}...{wallet[-6:]}\n")
        print(format_positions(result["positions"]))

        if args.trades and result.get("trades"):
            print(f"\n## Recent Trades: {len(result['trades'])} found")

        if args.pnl and result.get("profit_loss"):
            print(f"\n## P&L History: {len(result['profit_loss'])} records")


if __name__ == "__main__":
    main()
