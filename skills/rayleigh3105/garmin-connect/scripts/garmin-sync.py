#!/usr/bin/env python3
"""
Garmin Connect Data Sync
Syncs all fitness data using saved OAuth session
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    from garth import Client
    from garminconnect import Garmin
except ImportError:
    print("❌ Dependencies not installed. Run: pip install -r requirements.txt")
    sys.exit(1)

def load_garth_session():
    """Load saved Garmin OAuth session"""
    session_file = Path.home() / ".garth" / "session.json"
    
    if not session_file.exists():
        print(f"❌ No OAuth session found at {session_file}")
        print("\nRun: python3 garmin-auth.py <email> <password>")
        return None
    
    try:
        client = Client()
        client.load(str(session_file))
        return client
    except Exception as e:
        print(f"❌ Failed to load session: {e}")
        return None

def get_daily_summary(garth_client, date_str):
    """Get daily summary: steps, HR, calories, active minutes"""
    
    data = {
        'steps': 0,
        'heart_rate_resting': 0,
        'calories': 0,
        'active_minutes': 0,
        'distance_km': 0,
    }
    
    try:
        # Use Garminconnect with garth session
        gc = Garmin()
        gc.garth = garth_client
        
        summary = gc.get_user_summary(date_str)
        
        data['steps'] = summary.get('totalSteps', 0)
        data['heart_rate_resting'] = summary.get('restingHeartRate', 0)
        data['calories'] = summary.get('totalKilocalories', 0)
        data['active_minutes'] = summary.get('totalIntensityMinutes', 0)
        data['distance_km'] = round(summary.get('totalDistance', 0) / 1000, 2)
        
    except Exception as e:
        print(f"⚠️  Daily summary error: {e}", file=sys.stderr)
    
    return data

def get_sleep_data(garth_client, date_str):
    """Get sleep data: duration, quality, deep/REM sleep"""
    
    data = {
        'duration_hours': 0,
        'duration_minutes': 0,
        'quality_percent': 0,
        'deep_sleep_hours': 0,
        'rem_sleep_hours': 0,
        'light_sleep_hours': 0,
        'awake_minutes': 0,
    }
    
    try:
        gc = Garmin()
        gc.garth = garth_client
        
        sleep = gc.get_sleep_data(date_str)
        
        if sleep and 'dailySleepDTO' in sleep:
            s = sleep['dailySleepDTO']
            
            duration_sec = s.get('sleepTimeSeconds', 0)
            data['duration_hours'] = round(duration_sec / 3600, 1)
            data['duration_minutes'] = round(duration_sec / 60, 0)
            data['quality_percent'] = s.get('sleepQualityPercentage', 0)
            data['deep_sleep_hours'] = round(s.get('deepSleepSeconds', 0) / 3600, 1)
            data['rem_sleep_hours'] = round(s.get('remSleepSeconds', 0) / 3600, 1)
            data['light_sleep_hours'] = round(s.get('lightSleepSeconds', 0) / 3600, 1)
            data['awake_minutes'] = round(s.get('awakeTimeSeconds', 0) / 60, 0)
        
    except Exception as e:
        print(f"⚠️  Sleep data error: {e}", file=sys.stderr)
    
    return data

def get_workouts(garth_client):
    """Get recent workouts"""
    
    workouts = []
    
    try:
        gc = Garmin()
        gc.garth = garth_client
        
        activities = gc.get_activities(0, 20)  # Last 20 workouts
        
        for activity in activities[:10]:  # Return last 10
            workout = {
                'type': activity.get('activityType', 'Unknown'),
                'name': activity.get('activityName', 'Unnamed'),
                'distance_km': round(activity.get('distance', 0) / 1000, 2),
                'duration_minutes': round(activity.get('duration', 0) / 60, 0),
                'calories': activity.get('calories', 0),
                'heart_rate_avg': activity.get('avgHeartRate', 0),
                'heart_rate_max': activity.get('maxHeartRate', 0),
                'timestamp': activity.get('startTimeInSeconds', 0),
            }
            workouts.append(workout)
    
    except Exception as e:
        print(f"⚠️  Workouts error: {e}", file=sys.stderr)
    
    return workouts

def sync_all(output_file=None):
    """Sync all Garmin data"""
    
    garth_client = load_garth_session()
    if not garth_client:
        return None
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Collect all data
    all_data = {
        'timestamp': datetime.now().isoformat(),
        'date': today,
        'summary': get_daily_summary(garth_client, today),
        'sleep': get_sleep_data(garth_client, today),
        'workouts': get_workouts(garth_client),
    }
    
    # Save to file if specified
    if output_file:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(all_data, f, indent=2)
    
    # Print JSON to stdout
    print(json.dumps(all_data, indent=2))
    
    return all_data

if __name__ == "__main__":
    
    # Default cache file
    cache_file = os.path.expanduser('~/.clawdbot/.garmin-cache.json')
    
    # Use custom path if provided
    if len(sys.argv) > 1:
        cache_file = sys.argv[1]
    
    sync_all(cache_file)
