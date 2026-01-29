#!/usr/bin/env python3
"""
Signal Sniper - Trade on signals from user-configured sources.

Pattern A skill with SDK infrastructure:
- Skill handles: RSS polling, keyword matching, decision logic
- SDK provides: context endpoint (safeguards), trade endpoint

Usage:
    python signal_sniper.py                     # Run configured scan
    python signal_sniper.py --dry-run           # No actual trades
    python signal_sniper.py --scan-only         # Just show matches
    python signal_sniper.py --config            # Show configuration
    python signal_sniper.py --history           # Show processed articles
    python signal_sniper.py --feed URL          # Override feed for one run
    python signal_sniper.py --keywords "a,b,c"  # Override keywords
    python signal_sniper.py --market ID         # Override target market
"""

import os
import sys
import json
import hashlib
import argparse
import fcntl
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

# Configuration from environment
API_KEY = os.environ.get("SIMMER_API_KEY", "")
API_BASE = os.environ.get("SIMMER_API_BASE", "https://api.simmer.markets")

# Sniper configuration
FEEDS = os.environ.get("SIMMER_SNIPER_FEEDS", "")  # Comma-separated RSS URLs
MARKETS = os.environ.get("SIMMER_SNIPER_MARKETS", "")  # Comma-separated market IDs
KEYWORDS = os.environ.get("SIMMER_SNIPER_KEYWORDS", "")  # Comma-separated keywords

# Parse config with validation
def _parse_float_config(name: str, default: str, min_val: float = None, max_val: float = None) -> float:
    """Parse float config with validation."""
    try:
        value = float(os.environ.get(name, default))
        if min_val is not None and value < min_val:
            raise ValueError(f"{name} must be >= {min_val}")
        if max_val is not None and value > max_val:
            raise ValueError(f"{name} must be <= {max_val}")
        return value
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)

CONFIDENCE_THRESHOLD = _parse_float_config("SIMMER_SNIPER_CONFIDENCE", "0.7", 0.0, 1.0)
MAX_USD = _parse_float_config("SIMMER_SNIPER_MAX_USD", "25", 0.01)
MAX_TRADES_PER_RUN = int(os.environ.get("SIMMER_SNIPER_MAX_TRADES", "5"))  # Max trades per scan cycle

# Polymarket constraints
MIN_SHARES_PER_ORDER = 5.0  # Polymarket requires minimum 5 shares
MIN_TICK_SIZE = 0.01        # Minimum price increment

# State file for deduplication
STATE_DIR = Path(__file__).parent / "state"
PROCESSED_FILE = STATE_DIR / "processed.json"

# Trading safeguard thresholds
SLIPPAGE_HIGH_THRESHOLD = 0.15       # >15% slippage = reduce size warning
SLIPPAGE_MODERATE_THRESHOLD = 0.10   # >10% slippage = moderate warning
SPREAD_MAX_THRESHOLD = 0.10          # >10% spread = illiquid, skip
TIME_CRITICAL_HOURS = 2              # <2h to resolution = very high risk
TIME_ELEVATED_HOURS = 6              # <6h to resolution = elevated risk
REQUEST_TIMEOUT_SECONDS = 30         # HTTP request timeout
HISTORY_DISPLAY_LIMIT = 20           # Number of articles to show in history
SUMMARY_TRUNCATE_LENGTH = 500        # Max chars for article summary


def get_config() -> Dict[str, Any]:
    """Get current configuration."""
    return {
        "feeds": [f.strip() for f in FEEDS.split(",") if f.strip()],
        "markets": [m.strip() for m in MARKETS.split(",") if m.strip()],
        "keywords": [k.strip().lower() for k in KEYWORDS.split(",") if k.strip()],
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "max_usd": MAX_USD,
        "api_base": API_BASE,
    }


def show_config():
    """Display current configuration."""
    config = get_config()
    print("🎯 Signal Sniper Configuration")
    print("=" * 40)
    print(f"API Base: {config['api_base']}")
    print(f"API Key: {'✓ Set' if API_KEY else '✗ Missing'}")
    print()
    print("RSS Feeds:")
    if config["feeds"]:
        for feed in config["feeds"]:
            print(f"  • {feed[:60]}...")
    else:
        print("  (none configured)")
    print()
    print("Target Markets:")
    if config["markets"]:
        for market in config["markets"]:
            print(f"  • {market}")
    else:
        print("  (none configured)")
    print()
    print("Keywords:")
    if config["keywords"]:
        print(f"  {', '.join(config['keywords'])}")
    else:
        print("  (none - all articles will match)")
    print()
    print(f"Confidence Threshold: {config['confidence_threshold']:.0%}")
    print(f"Max Trade Size: ${config['max_usd']:.2f}")
    print(f"Max Trades/Run: {MAX_TRADES_PER_RUN}")


def load_processed() -> Dict[str, Dict]:
    """Load processed articles from state file."""
    if not PROCESSED_FILE.exists():
        return {}
    try:
        with open(PROCESSED_FILE, "r") as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)  # Shared lock for reading
            try:
                return json.load(f)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    except (json.JSONDecodeError, IOError):
        return {}


def save_processed(processed: Dict[str, Dict]):
    """Save processed articles to state file with file locking."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    # Write to temp file then atomic rename to prevent corruption
    temp_file = PROCESSED_FILE.with_suffix(".tmp")
    with open(temp_file, "w") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)  # Exclusive lock for writing
        try:
            json.dump(processed, f, indent=2, default=str)
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    temp_file.rename(PROCESSED_FILE)  # Atomic rename


def article_hash(url: str, title: str) -> str:
    """Generate unique hash for an article."""
    content = f"{url}|{title}".encode("utf-8")
    return hashlib.sha256(content).hexdigest()[:16]


def show_history():
    """Show recently processed articles."""
    processed = load_processed()
    if not processed:
        print("📜 No articles processed yet.")
        return

    print("📜 Processed Articles")
    print("=" * 40)

    # Sort by timestamp, most recent first
    items = sorted(
        processed.items(),
        key=lambda x: x[1].get("processed_at", ""),
        reverse=True
    )[:HISTORY_DISPLAY_LIMIT]

    for _, data in items:
        title = data.get("title", "Unknown")[:50]
        action = data.get("action", "unknown")
        processed_at = data.get("processed_at", "?")
        print(f"  [{action:10}] {title}...")
        print(f"              at {processed_at}")
        print()


def validate_url(url: str) -> bool:
    """Validate URL is safe to fetch (prevent SSRF)."""
    try:
        parsed = urlparse(url)
        # Only allow http/https
        if parsed.scheme not in ['http', 'https']:
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        # Block localhost, private IPs, cloud metadata endpoints
        blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1']
        if hostname.lower() in blocked:
            return False
        # Block private IP ranges (basic check)
        if hostname.startswith(('10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
                                '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
                                '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.')):
            return False
        return True
    except Exception:
        return False


def fetch_rss(url: str) -> List[Dict[str, str]]:
    """Fetch and parse RSS feed."""
    articles = []

    # Validate URL before fetching (SSRF protection)
    if not validate_url(url):
        print(f"  ⚠️ Invalid or blocked URL: {url[:50]}...")
        return articles

    try:
        req = Request(url, headers={"User-Agent": "SimmerSignalSniper/1.0"})
        with urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            content = response.read()

        # Secure XML parsing - use defusedxml if available, otherwise standard parsing
        try:
            import defusedxml.ElementTree as DefusedET
            root = DefusedET.fromstring(content)
        except ImportError:
            # Fallback to standard parsing (RSS feeds from trusted sources)
            root = ET.fromstring(content)

        # Handle both RSS and Atom feeds
        # RSS: channel/item
        for item in root.findall(".//item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            description = item.findtext("description", "")
            pub_date = item.findtext("pubDate", "")

            if title and link:
                articles.append({
                    "title": title,
                    "url": link,
                    "summary": description[:SUMMARY_TRUNCATE_LENGTH] if description else "",
                    "published": pub_date,
                })

        # Atom: entry
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        for entry in root.findall(".//atom:entry", ns):
            title = entry.findtext("atom:title", "", ns)
            link_elem = entry.find("atom:link", ns)
            link = link_elem.get("href", "") if link_elem is not None else ""
            summary = entry.findtext("atom:summary", "", ns)
            published = entry.findtext("atom:published", "", ns)

            if title and link:
                articles.append({
                    "title": title,
                    "url": link,
                    "summary": summary[:SUMMARY_TRUNCATE_LENGTH] if summary else "",
                    "published": published,
                })

    except (URLError, HTTPError) as e:
        print(f"  ⚠️ Failed to fetch {url[:50]}...: {e}")
    except ET.ParseError as e:
        print(f"  ⚠️ Failed to parse {url[:50]}...: {e}")

    return articles


def matches_keywords(article: Dict[str, str], keywords: List[str]) -> bool:
    """Check if article matches any keyword."""
    if not keywords:
        return True  # No keywords = match all

    text = f"{article['title']} {article['summary']}".lower()
    return any(kw in text for kw in keywords)


def sdk_request(method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
    """Make authenticated request to Simmer SDK."""
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    if method == "GET":
        req = Request(url, headers=headers)
    else:
        body = json.dumps(data).encode("utf-8") if data else None
        req = Request(url, data=body, headers=headers, method=method)

    try:
        with urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read())
    except HTTPError as e:
        # Parse error safely without exposing potentially sensitive content
        try:
            error_data = json.loads(e.read().decode("utf-8"))
            error_msg = error_data.get("detail", error_data.get("error", "Unknown error"))
        except Exception:
            error_msg = f"HTTP {e.code}"
        print(f"  ❌ API Error: {error_msg}")
        return {"error": error_msg}
    except URLError as e:
        print(f"  ❌ Network Error: Connection failed")
        return {"error": "Network error"}


def get_market_context(market_id: str) -> Optional[Dict]:
    """Get SDK context for a market (safeguards)."""
    result = sdk_request("GET", f"/api/sdk/context/{market_id}")
    if "error" in result:
        return None
    return result


def set_risk_monitor(market_id: str, side: str, 
                     stop_loss_pct: float = 0.20, take_profit_pct: float = 0.50) -> Dict:
    """
    Set stop-loss and take-profit for a position.
    The backend monitors every 15 min and auto-exits when thresholds hit.
    """
    result = sdk_request("POST", f"/api/sdk/positions/{market_id}/monitor", {
        "side": side,
        "stop_loss_pct": stop_loss_pct,
        "take_profit_pct": take_profit_pct
    })
    return result


def execute_trade(market_id: str, side: str, amount: float, price: float = None, source: str = "sdk:signalsniper") -> Dict:
    """Execute trade via SDK with 5-share minimum check."""
    # Check Polymarket minimum shares requirement
    if price and price > 0:
        shares = amount / price
        if shares < MIN_SHARES_PER_ORDER:
            return {
                "success": False,
                "error": f"Position size ${amount:.2f} too small for {MIN_SHARES_PER_ORDER} shares at ${price:.2f} (would be {shares:.1f} shares)"
            }
    
    return sdk_request("POST", "/api/sdk/trade", {
        "market_id": market_id,
        "side": side,
        "action": "buy",
        "amount": amount,
        "venue": "polymarket",
        "source": source,
    })


def check_safeguards(context: Dict) -> Tuple[bool, List[str]]:
    """
    Check context warnings and return (should_trade, reasons).

    Returns (True, []) if safe to trade.
    Returns (False, [reasons]) if should skip.
    """
    reasons = []

    warnings = context.get("warnings") or []
    discipline = context.get("discipline") or {}
    slippage = context.get("slippage") or {}
    market = context.get("market") or {}

    # Check for deal-breakers
    for warning in warnings:
        if "MARKET RESOLVED" in warning:
            reasons.append("Market already resolved")
            return False, reasons

    # Check flip-flop
    warning_level = discipline.get("warning_level", "none")
    if warning_level == "severe":
        reasons.append(f"Severe flip-flop warning: {discipline.get('flip_flop_warning', '')}")
        return False, reasons
    elif warning_level == "mild":
        reasons.append(f"Mild flip-flop warning (proceed with caution)")

    # Check time decay
    time_to_resolution = market.get("time_to_resolution", "")
    if time_to_resolution:
        # Parse time to hours (handles "Xd Yh" or "Xh" formats)
        try:
            total_hours = 0
            if "d" in time_to_resolution:
                days_part = time_to_resolution.split("d")[0].strip()
                total_hours += int(days_part) * 24
            if "h" in time_to_resolution:
                hours_part = time_to_resolution.split("h")[0]
                if "d" in hours_part:
                    hours_part = hours_part.split("d")[-1].strip()
                total_hours += int(hours_part)

            if total_hours < TIME_CRITICAL_HOURS:
                reasons.append(f"Market resolves in {total_hours}h - very high risk")
                return False, reasons
            elif total_hours < TIME_ELEVATED_HOURS:
                reasons.append(f"Market resolves in {total_hours}h - elevated risk")
        except (ValueError, IndexError):
            pass

    # Check slippage
    estimates = slippage.get("estimates", []) if slippage else []
    if estimates:
        slippage_pct = estimates[0].get("slippage_pct", 0)
        if slippage_pct > SLIPPAGE_HIGH_THRESHOLD:
            reasons.append(f"High slippage ({slippage_pct:.1%}) - reduce size")
        elif slippage_pct > SLIPPAGE_MODERATE_THRESHOLD:
            reasons.append(f"Moderate slippage ({slippage_pct:.1%})")

    # Check spread
    spread_pct = slippage.get("spread_pct", 0) if slippage else 0
    if spread_pct > SPREAD_MAX_THRESHOLD:
        reasons.append(f"Wide spread ({spread_pct:.1%}) - illiquid market")
        return False, reasons

    return True, reasons


def format_context_summary(context: Dict) -> str:
    """Format context for display."""
    market = context.get("market") or {}
    position = context.get("position") or {}
    discipline = context.get("discipline") or {}

    lines = []
    lines.append(f"  Market: {market.get('question', 'Unknown')[:60]}...")
    lines.append(f"  Price: {market.get('current_price', 0):.1%}")

    if market.get("resolution_criteria"):
        lines.append(f"  Resolution: {market.get('resolution_criteria')[:80]}...")

    if market.get("ai_consensus"):
        lines.append(f"  Simmer AI: {market.get('ai_consensus'):.1%}")
        if market.get("divergence"):
            div = market.get("divergence")
            direction = "bullish" if div > 0 else "bearish"
            lines.append(f"  Divergence: {abs(div):.1%} more {direction}")

    if position.get("has_position"):
        lines.append(f"  Position: {position.get('shares', 0):.1f} {position.get('side', '?').upper()} (P&L: {position.get('pnl_pct', 0):.1%})")

    if discipline.get("warning_level") != "none":
        lines.append(f"  Discipline: {discipline.get('flip_flop_warning', '')}")

    return "\n".join(lines)


def run_scan(
    feeds: List[str],
    markets: List[str],
    keywords: List[str],
    dry_run: bool = False,
    scan_only: bool = False,
) -> Dict[str, Any]:
    """
    Run signal scan across feeds and markets.

    Returns summary of results.
    """
    if not API_KEY:
        print("❌ SIMMER_API_KEY not set")
        return {"error": "No API key"}

    if not feeds:
        print("❌ No RSS feeds configured")
        print("   Set SIMMER_SNIPER_FEEDS or use --feed URL")
        return {"error": "No feeds"}

    if not markets:
        print("❌ No target markets configured")
        print("   Set SIMMER_SNIPER_MARKETS or use --market ID")
        return {"error": "No markets"}

    results = {
        "feeds_scanned": len(feeds),
        "articles_found": 0,
        "articles_matched": 0,
        "articles_new": 0,
        "trades_executed": 0,
        "trades_skipped": 0,
        "signals": [],
    }

    processed = load_processed()

    print(f"🎯 Signal Sniper Scan")
    print(f"   Feeds: {len(feeds)} | Markets: {len(markets)} | Keywords: {len(keywords) or 'all'}")
    print()

    # 1. Fetch all articles from all feeds
    all_articles = []
    for feed_url in feeds:
        print(f"📡 Fetching: {feed_url[:50]}...")
        articles = fetch_rss(feed_url)
        print(f"   Found {len(articles)} articles")
        all_articles.extend(articles)

    results["articles_found"] = len(all_articles)

    # 2. Filter by keywords
    matched_articles = [a for a in all_articles if matches_keywords(a, keywords)]
    results["articles_matched"] = len(matched_articles)
    print(f"\n📋 Matched {len(matched_articles)}/{len(all_articles)} articles by keywords")

    # 3. Filter already processed
    new_articles = []
    for article in matched_articles:
        h = article_hash(article["url"], article["title"])
        if h not in processed:
            new_articles.append(article)

    results["articles_new"] = len(new_articles)
    print(f"📰 New articles: {len(new_articles)}")

    if not new_articles:
        print("\n✅ No new signals to process")
        return results

    # 4. For each new article, check each market
    print(f"\n🔍 Analyzing {len(new_articles)} new articles against {len(markets)} markets...")

    for article in new_articles:
        h = article_hash(article["url"], article["title"])
        print(f"\n📰 {article['title'][:60]}...")

        for market_id in markets:
            print(f"\n   → Checking market: {market_id[:20]}...")

            # Get context with safeguards
            context = get_market_context(market_id)
            if not context:
                print(f"     ⚠️ Could not fetch context")
                continue

            print(format_context_summary(context))

            # Check safeguards
            should_trade, reasons = check_safeguards(context)

            if reasons:
                print(f"     ⚠️ Warnings: {'; '.join(reasons)}")

            if not should_trade:
                print(f"     ⏭️ Skipping: safeguards failed")
                results["trades_skipped"] += 1
                processed[h] = {
                    "title": article["title"],
                    "url": article["url"],
                    "market_id": market_id,
                    "action": "skipped",
                    "reason": "; ".join(reasons),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                }
                continue

            if scan_only:
                print(f"     👀 [SCAN ONLY] Would analyze for trading")
                results["signals"].append({
                    "article": article["title"],
                    "market_id": market_id,
                    "context": context.get("market", {}),
                })
                continue

            # At this point, safeguards passed
            # In a real run, Claude (the Clawdbot runtime) would analyze the article
            # and decide whether to trade based on:
            # 1. Article content vs resolution_criteria
            # 2. Confidence in the signal
            # 3. Current position and market state

            print(f"\n     🧠 SIGNAL DETECTED - Awaiting analysis")
            print(f"     Article: {article['title']}")
            print(f"     Resolution: {context.get('market', {}).get('resolution_criteria', 'N/A')[:100]}")
            print()
            print("     → Claude should analyze this signal and decide:")
            print("       1. Does this signal relate to the resolution criteria?")
            print("       2. Is it bullish or bearish for YES?")
            print("       3. Confidence level (needs > {:.0%} to trade)".format(CONFIDENCE_THRESHOLD))
            print()

            # Mark as processed (Claude will handle the actual trade decision)
            results["signals"].append({
                "article": article["title"],
                "url": article["url"],
                "market_id": market_id,
                "context_summary": {
                    "price": context.get("market", {}).get("current_price"),
                    "resolution_criteria": context.get("market", {}).get("resolution_criteria"),
                    "warnings": context.get("warnings", []),
                },
            })

            processed[h] = {
                "title": article["title"],
                "url": article["url"],
                "market_id": market_id,
                "action": "signal_detected",
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

            if dry_run:
                print(f"     🏜️ [DRY RUN] Would present signal for analysis")

    # Save processed state
    save_processed(processed)

    # Summary
    print("\n" + "=" * 40)
    print("🎯 Scan Complete")
    print(f"   Articles found: {results['articles_found']}")
    print(f"   Matched keywords: {results['articles_matched']}")
    print(f"   New to process: {results['articles_new']}")
    print(f"   Signals detected: {len(results['signals'])}")
    print(f"   Skipped (safeguards): {results['trades_skipped']}")

    if results["signals"]:
        print("\n📡 Signals for Analysis:")
        for signal in results["signals"]:
            print(f"   • {signal['article'][:50]}...")
            print(f"     Market: {signal['market_id']}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Signal Sniper - Trade on user-configured signals")
    parser.add_argument("--dry-run", action="store_true", help="Don't execute trades")
    parser.add_argument("--scan-only", action="store_true", help="Only scan, don't analyze")
    parser.add_argument("--config", action="store_true", help="Show configuration")
    parser.add_argument("--history", action="store_true", help="Show processed articles")
    parser.add_argument("--feed", type=str, help="Override RSS feed URL")
    parser.add_argument("--market", type=str, help="Override target market ID")
    parser.add_argument("--keywords", type=str, help="Override keywords (comma-separated)")

    args = parser.parse_args()

    if args.config:
        show_config()
        return

    if args.history:
        show_history()
        return

    # Build config with overrides
    config = get_config()
    feeds = [args.feed] if args.feed else config["feeds"]
    markets = [args.market] if args.market else config["markets"]
    keywords = [k.strip().lower() for k in args.keywords.split(",")] if args.keywords else config["keywords"]

    run_scan(
        feeds=feeds,
        markets=markets,
        keywords=keywords,
        dry_run=args.dry_run,
        scan_only=args.scan_only,
    )


if __name__ == "__main__":
    main()
