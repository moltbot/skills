#!/usr/bin/env python3
"""
Format Garmin data for display
Provides formatted output for integration into Clawdbot
"""

import json
import os
from pathlib import Path

def load_cache():
    """Load latest Garmin data from cache"""
    cache_file = Path.home() / ".clawdbot" / ".garmin-cache.json"
    
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, 'r') as f:
            return json.load(f)
    except:
        return None

def format_daily_summary():
    """Format daily activity summary"""
    
    data = load_cache()
    if not data:
        return "📊 No Garmin data available yet. Run sync first."
    
    summary = data.get('summary', {})
    
    output = "📊 **Daily Activity**\n"
    output += f"🚶 Steps: {summary.get('steps', 0):,}\n"
    output += f"❤️ Heart Rate (resting): {summary.get('heart_rate_resting', 0)} bpm\n"
    output += f"🔥 Calories: {summary.get('calories', 0):,}\n"
    output += f"⏱️ Active Minutes: {summary.get('active_minutes', 0)} min\n"
    output += f"📏 Distance: {summary.get('distance_km', 0)} km"
    
    return output

def format_sleep():
    """Format sleep data"""
    
    data = load_cache()
    if not data:
        return "😴 No sleep data available"
    
    sleep = data.get('sleep', {})
    
    quality = sleep.get('quality_percent', 0)
    quality_emoji = "😴" if quality >= 80 else "😐" if quality >= 60 else "😩"
    
    output = f"{quality_emoji} **Sleep**\n"
    output += f"Duration: {sleep.get('duration_hours', 0)}h {int(sleep.get('duration_minutes', 0) % 60)}m\n"
    output += f"Quality: {quality}%\n"
    output += f"Deep Sleep: {sleep.get('deep_sleep_hours', 0)}h\n"
    output += f"REM Sleep: {sleep.get('rem_sleep_hours', 0)}h\n"
    output += f"Light Sleep: {sleep.get('light_sleep_hours', 0)}h\n"
    output += f"Awake: {int(sleep.get('awake_minutes', 0))} min"
    
    return output

def format_workouts():
    """Format recent workouts"""
    
    data = load_cache()
    if not data:
        return "🏋️ No workout data available"
    
    workouts = data.get('workouts', [])
    
    if not workouts:
        return "🏋️ No recent workouts"
    
    output = "🏋️ **Recent Workouts**\n"
    
    for workout in workouts[:5]:  # Show last 5
        output += f"\n• {workout.get('type', 'Workout')}: {workout.get('name', 'Unnamed')}\n"
        output += f"  Distance: {workout.get('distance_km', 0)} km\n"
        output += f"  Duration: {int(workout.get('duration_minutes', 0))} min\n"
        output += f"  Calories: {workout.get('calories', 0)}\n"
        output += f"  HR: {workout.get('heart_rate_avg', 0)} avg / {workout.get('heart_rate_max', 0)} max"
    
    return output

def format_all():
    """Format all data at once"""
    
    output = ""
    output += format_daily_summary() + "\n\n"
    output += format_sleep() + "\n\n"
    output += format_workouts()
    
    return output

def get_as_dict():
    """Get all data as dict (for Clawdbot integration)"""
    return load_cache()

if __name__ == "__main__":
    print(format_all())
