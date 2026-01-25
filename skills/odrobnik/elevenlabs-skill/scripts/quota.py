#!/usr/bin/env python3
"""
ElevenLabs Quota & Usage API wrapper.

Usage (CLI):
    python3 quota.py                    # Show current subscription quota
    python3 quota.py --usage            # Include usage stats
    python3 quota.py --usage --days 7   # Usage stats for last 7 days
    python3 quota.py --json             # Output raw JSON

Usage (Module):
    from quota import get_subscription, get_usage_stats
    sub = get_subscription()
    print(f"Used {sub['character_count']} of {sub['character_limit']}")
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
import requests


def get_subscription(api_key: str | None = None) -> dict:
    """
    Get subscription info including quota limits and usage.
    
    Returns dict with:
        - character_count: characters used this period
        - character_limit: total quota for billing period
        - next_character_count_reset_unix: timestamp of next reset
        - voice_limit: max voice slots
        - professional_voice_limit: max professional voices
        - can_extend_character_limit: bool
        - allowed_to_extend_character_limit: bool
        - etc.
    """
    api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")

    url = "https://api.elevenlabs.io/v1/user/subscription"
    headers = {"xi-api-key": api_key}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise RuntimeError(f"API error {response.status_code}: {response.text}")
    
    return response.json()


def get_usage_stats(
    api_key: str | None = None,
    start_unix_ms: int | None = None,
    end_unix_ms: int | None = None,
    breakdown_type: str = "voice",
    aggregation_interval: str = "day",
) -> dict:
    """
    Get character usage statistics over time.
    
    Args:
        start_unix_ms: Start timestamp in milliseconds (default: 30 days ago)
        end_unix_ms: End timestamp in milliseconds (default: now)
        breakdown_type: How to break down usage ("voice", "user", "api_key", "product")
        aggregation_interval: Time grouping ("hour", "day", "week", "month", "cumulative")
    
    Returns dict with:
        - time: list of unix timestamps (ms)
        - usage: map of breakdown keys to usage values per time interval
    """
    api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")

    # Default to last 30 days — timestamps in MILLISECONDS
    if end_unix_ms is None:
        end_unix_ms = int(datetime.now().timestamp() * 1000)
    if start_unix_ms is None:
        start_unix_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

    url = "https://api.elevenlabs.io/v1/usage/character-stats"
    headers = {"xi-api-key": api_key}
    params = {
        "start_unix": start_unix_ms,
        "end_unix": end_unix_ms,
        "breakdown_type": breakdown_type,
        "aggregation_interval": aggregation_interval,
    }
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        raise RuntimeError(f"API error {response.status_code}: {response.text}")
    
    return response.json()


def format_characters(count: int) -> str:
    """Format character count with K/M suffix."""
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M"
    elif count >= 1_000:
        return f"{count / 1_000:.1f}K"
    return str(count)


def main():
    parser = argparse.ArgumentParser(
        description="Check ElevenLabs quota and usage",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 quota.py                    # Show subscription quota
  python3 quota.py --usage            # Include usage history
  python3 quota.py --usage --days 7   # Last 7 days usage
  python3 quota.py --json             # Raw JSON output
""",
    )
    parser.add_argument("--usage", "-u", action="store_true", help="Include usage statistics")
    parser.add_argument("--days", "-d", type=int, default=30, help="Days of usage history (default: 30)")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON")
    parser.add_argument("--warn-pct", type=int, default=80, help="Warn if usage exceeds this percentage")

    args = parser.parse_args()

    try:
        sub = get_subscription()
        
        if args.json:
            import json
            output = {"subscription": sub}
            if args.usage:
                end_ts_ms = int(datetime.now().timestamp() * 1000)
                start_ts_ms = int((datetime.now() - timedelta(days=args.days)).timestamp() * 1000)
                output["usage"] = get_usage_stats(start_unix_ms=start_ts_ms, end_unix_ms=end_ts_ms)
            print(json.dumps(output, indent=2))
            return
        
        # Display subscription info
        used = sub.get("character_count", 0)
        limit = sub.get("character_limit", 0)
        pct = (used / limit * 100) if limit > 0 else 0
        reset_ts = sub.get("next_character_count_reset_unix")
        
        tier = sub.get("tier", "unknown")
        status = sub.get("status", "unknown")
        billing = sub.get("billing_period", "").replace("_period", "").replace("_", " ")
        voice_slots_used = sub.get("voice_slots_used", 0)
        voice_limit = sub.get("voice_limit", 0)
        pro_voice_used = sub.get("professional_voice_slots_used", 0)
        pro_voice_limit = sub.get("professional_voice_limit", 0)
        can_ivc = sub.get("can_use_instant_voice_cloning", False)
        can_pvc = sub.get("can_use_professional_voice_cloning", False)
        
        print(f"\n📊 ElevenLabs Quota")
        print("=" * 39)
        print(f"Plan:      {tier} ({status}) — {billing}")
        print(f"Characters: {format_characters(used)} / {format_characters(limit)} ({pct:.1f}%)")
        
        # Progress bar
        bar_width = 30
        filled = int(bar_width * pct / 100)
        bar = "█" * filled + "░" * (bar_width - filled)
        print(f"           [{bar}]")
        
        if reset_ts:
            reset_dt = datetime.fromtimestamp(reset_ts)
            days_until = (reset_dt - datetime.now()).days
            print(f"Resets:    {reset_dt.strftime('%Y-%m-%d')} ({days_until} days)")
        
        print(f"Voices:    {voice_slots_used} / {voice_limit} (IVC: {'✓' if can_ivc else '✗'})")
        if pro_voice_limit > 0:
            print(f"Pro Voice: {pro_voice_used} / {pro_voice_limit} (PVC: {'✓' if can_pvc else '✗'})")
        
        # Warning if approaching limit
        if pct >= args.warn_pct:
            print(f"\n⚠️  Warning: {pct:.1f}% of quota used!")
        
        # Usage stats
        if args.usage:
            end_ts_ms = int(datetime.now().timestamp() * 1000)
            start_ts_ms = int((datetime.now() - timedelta(days=args.days)).timestamp() * 1000)
            usage = get_usage_stats(start_unix_ms=start_ts_ms, end_unix_ms=end_ts_ms)
            
            print(f"\n📈 Usage (last {args.days} days)")
            print("-" * 40)
            
            time_axis = usage.get("time", [])
            usage_map = usage.get("usage", {})
            
            if time_axis and usage_map:
                # Sum total across all breakdown types
                total_chars = 0
                for key, values in usage_map.items():
                    key_total = sum(v for v in values if v)
                    total_chars += key_total
                    if key_total > 0:
                        print(f"  {key}: {format_characters(int(key_total))}")
                
                if total_chars > 0:
                    print(f"\nTotal: {format_characters(int(total_chars))} characters")
                    
                    # Show daily breakdown
                    print(f"\nDaily breakdown:")
                    for i, ts_ms in enumerate(time_axis[-7:]):  # Last 7 days
                        date = datetime.fromtimestamp(ts_ms / 1000).strftime("%Y-%m-%d")
                        day_total = sum(
                            values[len(time_axis) - 7 + i] 
                            for values in usage_map.values() 
                            if len(values) > len(time_axis) - 7 + i
                        )
                        if day_total > 0:
                            print(f"  {date}: {format_characters(int(day_total))}")
                else:
                    print("No usage in this period")
            else:
                print("No usage data available")
        
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
