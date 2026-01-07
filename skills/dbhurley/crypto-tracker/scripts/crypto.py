# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "click"]
# ///
"""Crypto price alerts using CoinGecko API."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import click
import httpx

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
DATA_DIR = Path(__file__).parent.parent / "data"
ALERTS_FILE = DATA_DIR / "alerts.json"

# Common coin aliases
COIN_ALIASES = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
    "doge": "dogecoin",
    "ada": "cardano",
    "xrp": "ripple",
    "dot": "polkadot",
    "matic": "polygon",
    "link": "chainlink",
    "avax": "avalanche-2",
    "atom": "cosmos",
    "uni": "uniswap",
    "ltc": "litecoin",
    "shib": "shiba-inu",
}


def resolve_coin(coin: str) -> str:
    """Resolve coin alias to CoinGecko ID."""
    return COIN_ALIASES.get(coin.lower(), coin.lower())


def load_alerts() -> dict:
    """Load alerts from JSON file."""
    if not ALERTS_FILE.exists():
        return {"alerts": []}
    try:
        return json.loads(ALERTS_FILE.read_text())
    except (json.JSONDecodeError, IOError):
        return {"alerts": []}


def save_alerts(data: dict) -> None:
    """Save alerts to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ALERTS_FILE.write_text(json.dumps(data, indent=2))


def get_prices(coins: list[str], detailed: bool = False) -> dict:
    """Fetch current prices from CoinGecko."""
    coin_ids = ",".join(resolve_coin(c) for c in coins)
    params = {
        "ids": coin_ids,
        "vs_currencies": "usd",
        "include_24hr_change": "true",
    }
    if detailed:
        params["include_market_cap"] = "true"
        params["include_24hr_vol"] = "true"
    
    resp = httpx.get(f"{COINGECKO_BASE}/simple/price", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


@click.group()
def cli():
    """Crypto price alerts using CoinGecko."""
    pass


@cli.command()
@click.argument("coins", nargs=-1, required=True)
@click.option("--detailed", "-d", is_flag=True, help="Include market cap and volume")
@click.option("--json-output", "-j", is_flag=True, help="Output as JSON")
def price(coins: tuple[str], detailed: bool, json_output: bool):
    """Get current prices for one or more coins."""
    try:
        data = get_prices(list(coins), detailed)
        
        if json_output:
            click.echo(json.dumps(data, indent=2))
            return
        
        for coin in coins:
            coin_id = resolve_coin(coin)
            if coin_id not in data:
                click.echo(f"❌ {coin}: not found (try 'crypto.py search {coin}')")
                continue
            
            info = data[coin_id]
            price_usd = info.get("usd", 0)
            change_24h = info.get("usd_24h_change", 0)
            
            # Format change with color indicator
            change_str = f"{change_24h:+.2f}%"
            emoji = "🟢" if change_24h >= 0 else "🔴"
            
            output = f"{emoji} {coin.upper()}: ${price_usd:,.2f} ({change_str})"
            
            if detailed:
                mcap = info.get("usd_market_cap", 0)
                vol = info.get("usd_24h_vol", 0)
                output += f"\n   Market Cap: ${mcap:,.0f}"
                output += f"\n   24h Volume: ${vol:,.0f}"
            
            click.echo(output)
            
    except httpx.HTTPError as e:
        click.echo(f"❌ API error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("query")
@click.option("--limit", "-l", default=10, help="Max results to show")
def search(query: str, limit: int):
    """Search for a coin by name or symbol."""
    try:
        resp = httpx.get(f"{COINGECKO_BASE}/search", params={"query": query}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        coins = data.get("coins", [])[:limit]
        if not coins:
            click.echo(f"No coins found matching '{query}'")
            return
        
        click.echo(f"Found {len(coins)} coins matching '{query}':\n")
        for coin in coins:
            click.echo(f"  {coin['symbol'].upper():8} → {coin['id']:30} ({coin['name']})")
        
        click.echo(f"\nUse the ID (middle column) in commands, e.g.: crypto.py price {coins[0]['id']}")
        
    except httpx.HTTPError as e:
        click.echo(f"❌ API error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("user_id")
@click.argument("coin")
@click.argument("alert_type", type=click.Choice(["above", "below", "change", "drop", "rise"]))
@click.argument("threshold", type=float)
@click.option("--cooldown", "-c", default=1, help="Hours between repeat alerts (default: 1)")
def alert(user_id: str, coin: str, alert_type: str, threshold: float, cooldown: int):
    """Set a price or percentage alert for a user."""
    coin_id = resolve_coin(coin)
    
    # Validate coin exists
    try:
        data = get_prices([coin_id])
        if coin_id not in data:
            click.echo(f"❌ Coin '{coin}' not found. Try: crypto.py search {coin}")
            sys.exit(1)
        current_price = data[coin_id].get("usd", 0)
    except httpx.HTTPError as e:
        click.echo(f"❌ API error: {e}", err=True)
        sys.exit(1)
    
    alert_data = load_alerts()
    
    new_alert = {
        "id": uuid4().hex[:8],
        "user_id": user_id,
        "coin": coin_id,
        "type": alert_type,
        "threshold": threshold,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_triggered": None,
        "cooldown_hours": cooldown,
    }
    
    alert_data["alerts"].append(new_alert)
    save_alerts(alert_data)
    
    # Describe the alert
    if alert_type == "above":
        desc = f"when {coin_id.upper()} price >= ${threshold:,.2f}"
    elif alert_type == "below":
        desc = f"when {coin_id.upper()} price <= ${threshold:,.2f}"
    elif alert_type == "change":
        desc = f"when {coin_id.upper()} 24h change >= ±{threshold}%"
    elif alert_type == "drop":
        desc = f"when {coin_id.upper()} drops >= {threshold}%"
    elif alert_type == "rise":
        desc = f"when {coin_id.upper()} rises >= {threshold}%"
    
    click.echo(f"✅ Alert set for {user_id}")
    click.echo(f"   ID: {new_alert['id']}")
    click.echo(f"   Triggers: {desc}")
    click.echo(f"   Current price: ${current_price:,.2f}")
    click.echo(f"   Cooldown: {cooldown}h between notifications")


@cli.command()
@click.argument("user_id")
@click.option("--json-output", "-j", is_flag=True, help="Output as JSON")
def alerts(user_id: str, json_output: bool):
    """List all alerts for a user."""
    alert_data = load_alerts()
    user_alerts = [a for a in alert_data["alerts"] if a["user_id"] == user_id]
    
    if json_output:
        click.echo(json.dumps(user_alerts, indent=2))
        return
    
    if not user_alerts:
        click.echo(f"No alerts found for {user_id}")
        return
    
    click.echo(f"Alerts for {user_id}:\n")
    for a in user_alerts:
        if a["type"] in ("above", "below"):
            condition = f"{a['type']} ${a['threshold']:,.2f}"
        else:
            condition = f"{a['type']} {a['threshold']}%"
        
        status = ""
        if a.get("last_triggered"):
            status = f" (last triggered: {a['last_triggered'][:16]})"
        
        click.echo(f"  [{a['id']}] {a['coin'].upper()} {condition}{status}")


@cli.command("alert-rm")
@click.argument("alert_id")
def alert_rm(alert_id: str):
    """Remove an alert by ID."""
    alert_data = load_alerts()
    original_count = len(alert_data["alerts"])
    
    alert_data["alerts"] = [a for a in alert_data["alerts"] if a["id"] != alert_id]
    
    if len(alert_data["alerts"]) == original_count:
        click.echo(f"❌ Alert '{alert_id}' not found")
        sys.exit(1)
    
    save_alerts(alert_data)
    click.echo(f"✅ Alert '{alert_id}' removed")


@cli.command("check-alerts")
@click.option("--json-output", "-j", is_flag=True, help="Output triggered alerts as JSON")
def check_alerts(json_output: bool):
    """Check all alerts and return any that should trigger."""
    alert_data = load_alerts()
    alerts_list = alert_data.get("alerts", [])
    
    if not alerts_list:
        if json_output:
            click.echo(json.dumps({"triggered": []}, indent=2))
        else:
            click.echo("No alerts configured")
        return
    
    # Get unique coins
    coins = list(set(a["coin"] for a in alerts_list))
    
    try:
        prices = get_prices(coins)
    except httpx.HTTPError as e:
        click.echo(f"❌ API error: {e}", err=True)
        sys.exit(1)
    
    now = datetime.now(timezone.utc)
    triggered = []
    
    for alert in alerts_list:
        coin_data = prices.get(alert["coin"])
        if not coin_data:
            continue
        
        price = coin_data.get("usd", 0)
        change_24h = coin_data.get("usd_24h_change", 0)
        
        # Check cooldown
        if alert.get("last_triggered"):
            last = datetime.fromisoformat(alert["last_triggered"].replace("Z", "+00:00"))
            hours_since = (now - last).total_seconds() / 3600
            if hours_since < alert.get("cooldown_hours", 1):
                continue
        
        # Check conditions
        should_trigger = False
        reason = ""
        
        if alert["type"] == "above" and price >= alert["threshold"]:
            should_trigger = True
            reason = f"${price:,.2f} >= ${alert['threshold']:,.2f}"
        elif alert["type"] == "below" and price <= alert["threshold"]:
            should_trigger = True
            reason = f"${price:,.2f} <= ${alert['threshold']:,.2f}"
        elif alert["type"] == "change" and abs(change_24h) >= alert["threshold"]:
            should_trigger = True
            reason = f"{change_24h:+.2f}% change (threshold: ±{alert['threshold']}%)"
        elif alert["type"] == "drop" and change_24h <= -alert["threshold"]:
            should_trigger = True
            reason = f"{change_24h:+.2f}% drop (threshold: -{alert['threshold']}%)"
        elif alert["type"] == "rise" and change_24h >= alert["threshold"]:
            should_trigger = True
            reason = f"{change_24h:+.2f}% rise (threshold: +{alert['threshold']}%)"
        
        if should_trigger:
            alert["last_triggered"] = now.isoformat()
            triggered.append({
                "alert_id": alert["id"],
                "user_id": alert["user_id"],
                "coin": alert["coin"],
                "type": alert["type"],
                "threshold": alert["threshold"],
                "current_price": price,
                "change_24h": change_24h,
                "reason": reason,
            })
    
    # Save updated last_triggered times
    save_alerts(alert_data)
    
    if json_output:
        click.echo(json.dumps({"triggered": triggered}, indent=2))
        return
    
    if not triggered:
        click.echo("✓ No alerts triggered")
        return
    
    click.echo(f"🚨 {len(triggered)} alert(s) triggered:\n")
    for t in triggered:
        click.echo(f"  User: {t['user_id']}")
        click.echo(f"  Coin: {t['coin'].upper()} @ ${t['current_price']:,.2f} ({t['change_24h']:+.2f}%)")
        click.echo(f"  Reason: {t['reason']}")
        click.echo()


@cli.command("list-all")
@click.option("--json-output", "-j", is_flag=True, help="Output as JSON")
def list_all(json_output: bool):
    """List all alerts (admin view)."""
    alert_data = load_alerts()
    alerts_list = alert_data.get("alerts", [])
    
    if json_output:
        click.echo(json.dumps(alerts_list, indent=2))
        return
    
    if not alerts_list:
        click.echo("No alerts configured")
        return
    
    click.echo(f"All alerts ({len(alerts_list)}):\n")
    for a in alerts_list:
        if a["type"] in ("above", "below"):
            condition = f"{a['type']} ${a['threshold']:,.2f}"
        else:
            condition = f"{a['type']} {a['threshold']}%"
        
        click.echo(f"  [{a['id']}] {a['user_id']}: {a['coin'].upper()} {condition}")


if __name__ == "__main__":
    cli()
