#!/usr/bin/env python3
"""
Garmin Connect Data Sync (OAuth version)
NEW: Garmin now uses OAuth instead of username/password
"""

import json
import os
from datetime import datetime
import sys

try:
    from garth import Client
except ImportError:
    print("❌ garth not installed. Run: pip install garth garminconnect")
    sys.exit(1)

def get_garth_client():
    """Get authenticated Garmin client using Garth (OAuth)"""
    
    garth_cache_dir = os.path.expanduser("~/.garth")
    cache_file = os.path.join(garth_cache_dir, "session.json")
    
    client = Client()
    
    # Try to load existing session
    if os.path.exists(cache_file):
        try:
            client.load(cache_file)
            return client
        except Exception as e:
            print(f"⚠️ Session expired, need to re-authenticate: {e}")
    
    print("❌ No OAuth session found")
    print("\nGarmin now requires OAuth authentication (browser-based)")
    print("\nSetup instructions:")
    print("1. Install garth CLI: pip install garth-cli")
    print("2. Run: garth auth moritz.vogt@vogges.de")
    print("3. Follow the browser prompt to sign in")
    print("4. Come back here and run: python3 garmin-sync-oauth.py")
    
    sys.exit(1)

def sync_all_data():
    """Sync all Garmin data using OAuth"""
    client = get_garth_client()
    if not client:
        return None
    
    # Load config for cache location
    config_path = os.path.expanduser('~/.clawdbot/garmin-config.json')
    cache_file = '/tmp/garmin-cache.json'
    
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
            cache_file = config.get('cache_file', cache_file)
    
    today = datetime.now().date()
    data = {
        'timestamp': datetime.now().isoformat(),
        'date': str(today),
    }
    
    try:
        # Get user summary
        summary = client.get_user_summary(today.isoformat())
        
        data['summary'] = {
            'steps': summary.get('totalSteps', 0),
            'heart_rate': summary.get('heartRateData', {}).get('restingHeartRate', 0),
            'calories': summary.get('totalKilocalories', 0),
            'active_minutes': summary.get('totalIntensityMinutes', 0),
            'distance_km': round(summary.get('totalDistance', 0) / 1000, 2),
        }
        
        # Get sleep data
        try:
            sleep_data = client.get_sleep_data(today.isoformat())
            if sleep_data:
                data['sleep'] = {
                    'duration_hours': round(sleep_data.get('duration', 0) / 3600, 1),
                    'quality': sleep_data.get('qualityScore', 0),
                    'deep_sleep': round(sleep_data.get('deepSleepSeconds', 0) / 3600, 1),
                    'rem_sleep': round(sleep_data.get('remSleepSeconds', 0) / 3600, 1),
                    'light_sleep': round(sleep_data.get('lightSleepSeconds', 0) / 3600, 1),
                }
            else:
                data['sleep'] = {'duration_hours': 0, 'quality': 0}
        except:
            data['sleep'] = {'duration_hours': 0, 'quality': 0}
        
        # Get heart rate
        try:
            hr = summary.get('heartRateData', {})
            data['heart_rate_details'] = {
                'resting': hr.get('restingHeartRate', 0),
                'max': hr.get('maxHeartRate', 0),
            }
        except:
            data['heart_rate_details'] = {}
        
        # Get activities/workouts
        try:
            activities = client.get_activities(0, 1)
            data['workouts'] = []
            if activities:
                for a in activities[:5]:
                    data['workouts'].append({
                        'type': a.get('activityType', 'Unknown'),
                        'distance_km': round(a.get('distance', 0) / 1000, 2),
                        'duration_min': round(a.get('duration', 0) / 60, 1),
                        'calories': a.get('calories', 0),
                    })
        except:
            data['workouts'] = []
        
        # Save cache
        os.makedirs(os.path.dirname(cache_file), exist_ok=True)
        with open(cache_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(json.dumps(data, indent=2))
        return data
        
    except Exception as e:
        print(f"❌ Sync error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    sync_all_data()
