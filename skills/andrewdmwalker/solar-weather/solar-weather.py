#!/usr/bin/env python3
"""
Solar Weather Monitor - Track space weather conditions
Uses NOAA Space Weather Prediction Center (SWPC) APIs
"""

import argparse
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Optional

API_BASE = "https://services.swpc.noaa.gov"


def api_get(endpoint: str) -> Dict:
    """Fetch data from NOAA SWPC API."""
    url = f"{API_BASE}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"API Error {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def format_scale(scale_name: str, data: Dict) -> str:
    """Format scale data nicely."""
    scale = data.get('Scale', 'N/A')
    text = data.get('Text', 'N/A')
    
    # Color codes based on severity
    if scale in ['0', None]:
        return f"{scale_name}: {text} ✅"
    elif scale in ['1', '2']:
        return f"{scale_name}{scale}: {text} ⚠️"
    else:
        return f"{scale_name}{scale}: {text} 🚨"


def cmd_current(args):
    """Get current space weather conditions."""
    data = api_get("/products/noaa-scales.json")
    
    current = data.get('0', {})
    timestamp = f"{current.get('DateStamp')} {current.get('TimeStamp')} UTC"
    
    if args.json:
        print(json.dumps(current, indent=2))
    else:
        print(f"🌞 Space Weather Conditions")
        print(f"   {timestamp}\n")
        
        # R Scale - Radio Blackouts (Solar Flares)
        r_data = current.get('R', {})
        print(f"   📻 {format_scale('R', r_data)}")
        print(f"      Radio Blackouts (Solar Flares)")
        
        # S Scale - Solar Radiation Storms
        s_data = current.get('S', {})
        print(f"\n   ☢️  {format_scale('S', s_data)}")
        print(f"      Solar Radiation Storm")
        
        # G Scale - Geomagnetic Storms
        g_data = current.get('G', {})
        print(f"\n   🌍 {format_scale('G', g_data)}")
        print(f"      Geomagnetic Storm")


def cmd_forecast(args):
    """Get space weather forecast."""
    data = api_get("/products/noaa-scales.json")
    
    # Today, tomorrow, day after
    today = data.get('0', {})
    tomorrow = data.get('2', {})
    day_after = data.get('3', {})
    
    if args.json:
        print(json.dumps({
            'today': today,
            'tomorrow': tomorrow,
            'day_after': day_after
        }, indent=2))
    else:
        print(f"🌞 Space Weather Forecast\n")
        
        # Today
        print(f"📅 Today ({today.get('DateStamp')})")
        print(f"   R: {today.get('R', {}).get('Text', 'N/A')}")
        print(f"   S: {today.get('S', {}).get('Text', 'N/A')}")
        print(f"   G: {today.get('G', {}).get('Text', 'N/A')}")
        
        # Tomorrow
        print(f"\n📅 Tomorrow ({tomorrow.get('DateStamp')})")
        print(f"   R: {tomorrow.get('R', {}).get('Text', 'N/A')} (Minor: {tomorrow.get('R', {}).get('MinorProb', 'N/A')}%, Major: {tomorrow.get('R', {}).get('MajorProb', 'N/A')}%)")
        print(f"   S: {tomorrow.get('S', {}).get('Text', 'N/A')} (Prob: {tomorrow.get('S', {}).get('Prob', 'N/A')}%)")
        print(f"   G: {tomorrow.get('G', {}).get('Text', 'N/A')}")
        
        # Day After
        print(f"\n📅 {day_after.get('DateStamp')}")
        print(f"   R: {day_after.get('R', {}).get('Text', 'N/A')} (Minor: {day_after.get('R', {}).get('MinorProb', 'N/A')}%, Major: {day_after.get('R', {}).get('MajorProb', 'N/A')}%)")
        print(f"   S: {day_after.get('S', {}).get('Text', 'N/A')} (Prob: {day_after.get('S', {}).get('Prob', 'N/A')}%)")
        print(f"   G: {day_after.get('G', {}).get('Text', 'N/A')}")


def cmd_solarwind(args):
    """Get solar wind data."""
    mag = api_get("/products/summary/solar-wind-mag-field.json")
    
    if args.json:
        print(json.dumps(mag, indent=2))
    else:
        print(f"🌊 Solar Wind Magnetic Field")
        print(f"   Time: {mag.get('TimeStamp')}")
        print(f"   Bt: {mag.get('Bt')} nT (Total Magnitude)")
        print(f"   Bz: {mag.get('Bz')} nT (North/South Component)")
        
        bz = float(mag.get('Bz', 0))
        if bz < -5:
            print(f"\n   ⚠️  Negative Bz - Aurora likely!")
        elif bz < 0:
            print(f"\n   ✅ Slightly negative Bz")
        else:
            print(f"\n   ✅ Positive Bz - Aurora unlikely")


def cmd_aurora(args):
    """Get aurora forecast."""
    # Get current geomagnetic conditions
    data = api_get("/products/noaa-scales.json")
    current = data.get('0', {})
    tomorrow = data.get('2', {})
    
    g_current = current.get('G', {})
    g_tomorrow = tomorrow.get('G', {})
    
    # Get solar wind
    mag = api_get("/products/summary/solar-wind-mag-field.json")
    bz = float(mag.get('Bz', 0))
    
    if args.json:
        print(json.dumps({
            'geomagnetic_current': g_current,
            'geomagnetic_tomorrow': g_tomorrow,
            'solar_wind_bz': bz
        }, indent=2))
    else:
        print(f"🌌 Aurora Forecast\n")
        
        print(f"Current Conditions:")
        print(f"   Geomagnetic: {g_current.get('Text', 'N/A')}")
        print(f"   Solar Wind Bz: {bz} nT")
        
        print(f"\nTomorrow ({tomorrow.get('DateStamp')}):")
        print(f"   Geomagnetic: {g_tomorrow.get('Text', 'N/A')}")
        
        # Aurora likelihood
        current_scale = g_current.get('Scale', '0')
        tomorrow_scale = g_tomorrow.get('Scale', '0')
        
        print(f"\n🔮 Aurora Outlook:")
        
        if current_scale and int(current_scale) >= 3:
            print(f"   🌟 HIGH - Major geomagnetic storm! Aurora visible at mid-latitudes!")
        elif current_scale and int(current_scale) >= 1:
            print(f"   ⚠️  MODERATE - Aurora possible at high latitudes")
        elif bz < -5:
            print(f"   ⚠️  MODERATE - Negative Bz favorable for aurora")
        else:
            print(f"   ✅ LOW - Quiet conditions")


def cmd_alerts(args):
    """Get latest space weather alerts."""
    try:
        # Fetch alerts from text products
        url = "https://services.swpc.noaa.gov/products/alerts.json"
        with urllib.request.urlopen(url, timeout=10) as response:
            alerts = json.loads(response.read().decode('utf-8'))
        
        if args.json:
            print(json.dumps(alerts, indent=2))
        else:
            if not alerts:
                print("✅ No active alerts")
                return
            
            print(f"🚨 Space Weather Alerts ({len(alerts)} active)\n")
            for alert in alerts[:10]:  # Show latest 10
                issue_time = alert.get('issue_datetime', 'N/A')
                message = alert.get('message', '').split('\n')[0]  # First line
                print(f"   [{issue_time}]")
                print(f"   {message}\n")
    
    except:
        print("⚠️  Could not fetch alerts", file=sys.stderr)


def cmd_summary(args):
    """Get comprehensive summary."""
    print(f"🌞 Solar Weather Summary\n")
    
    # Current conditions
    data = api_get("/products/noaa-scales.json")
    current = data.get('0', {})
    
    print(f"📊 Current Conditions ({current.get('DateStamp')} {current.get('TimeStamp')} UTC)")
    print(f"   {format_scale('R', current.get('R', {}))}")
    print(f"   {format_scale('S', current.get('S', {}))}")
    print(f"   {format_scale('G', current.get('G', {}))}")
    
    # Solar wind
    mag = api_get("/products/summary/solar-wind-mag-field.json")
    bz = float(mag.get('Bz', 0))
    print(f"\n🌊 Solar Wind")
    print(f"   Bz: {bz} nT")
    if bz < -5:
        print(f"   ⚠️  Favorable for aurora!")
    
    # Tomorrow forecast
    tomorrow = data.get('2', {})
    print(f"\n📅 Tomorrow Forecast ({tomorrow.get('DateStamp')})")
    g_tomorrow = tomorrow.get('G', {})
    if g_tomorrow.get('Scale') and int(g_tomorrow.get('Scale', '0')) >= 1:
        print(f"   🌟 Geomagnetic storm expected: {g_tomorrow.get('Text')}")
    else:
        print(f"   ✅ Quiet conditions expected")


def main():
    parser = argparse.ArgumentParser(
        description="Solar Weather Monitor - Track space weather conditions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  solar-weather.py current
  solar-weather.py forecast
  solar-weather.py aurora
  solar-weather.py solarwind
  solar-weather.py alerts
  solar-weather.py summary

Space Weather Scales:
  R (Radio Blackout)    - Solar flares affecting HF radio
  S (Solar Radiation)   - Energetic particles from the sun
  G (Geomagnetic Storm) - Disturbances in Earth's magnetosphere
  
  Scale: 0 (none) → 5 (extreme)
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', required=True)
    
    # Current conditions
    current = subparsers.add_parser('current', help='Current space weather')
    current.add_argument('--json', action='store_true', help='JSON output')
    
    # Forecast
    forecast = subparsers.add_parser('forecast', help='3-day forecast')
    forecast.add_argument('--json', action='store_true', help='JSON output')
    
    # Solar wind
    solarwind = subparsers.add_parser('solarwind', help='Solar wind data')
    solarwind.add_argument('--json', action='store_true', help='JSON output')
    
    # Aurora forecast
    aurora = subparsers.add_parser('aurora', help='Aurora forecast')
    aurora.add_argument('--json', action='store_true', help='JSON output')
    
    # Alerts
    alerts = subparsers.add_parser('alerts', help='Active alerts/warnings')
    alerts.add_argument('--json', action='store_true', help='JSON output')
    
    # Summary
    summary = subparsers.add_parser('summary', help='Comprehensive summary')
    
    args = parser.parse_args()
    
    commands = {
        'current': cmd_current,
        'forecast': cmd_forecast,
        'solarwind': cmd_solarwind,
        'aurora': cmd_aurora,
        'alerts': cmd_alerts,
        'summary': cmd_summary,
    }
    
    commands[args.command](args)


if __name__ == '__main__':
    main()
