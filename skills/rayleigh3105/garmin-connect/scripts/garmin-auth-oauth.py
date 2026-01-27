#!/usr/bin/env python3
"""
Garmin Connect OAuth Authentication (NEW)
Garmin switched to OAuth cookie-based auth
"""

import os
import json
from pathlib import Path

try:
    from garth import Client
except ImportError:
    print("❌ garth not installed. Run: pip install garth")
    exit(1)

def get_oauth_client():
    """Get authenticated Garmin client with OAuth"""
    
    # OAuth cache file
    garth_cache_dir = Path.home() / ".garth"
    garth_cache_dir.mkdir(exist_ok=True)
    
    client = Client()
    
    # Try to load existing token
    try:
        client.load("/home/mamotec/.garth/session.json")
        print("✅ Loaded existing Garmin OAuth session")
        return client
    except:
        pass
    
    # Need to authenticate - this requires browser login
    print("⚠️  First-time setup: Need to authenticate via browser")
    print("\nGarmin switched to OAuth. Follow these steps:")
    print("1. Run: python3 garmin-auth-oauth.py")
    print("2. Open: https://sso.garmin.com/sso/signin")
    print("3. Sign in with your Garmin account")
    print("4. The script will save your session for future use")
    
    return None

def save_session(client):
    """Save OAuth session for future use"""
    client.dump("/home/mamotec/.garth/session.json")
    print("✅ Session saved to ~/.garth/session.json")

if __name__ == "__main__":
    print("Garmin OAuth Setup")
    print("=" * 50)
    
    # Try to load existing session
    try:
        client = Client()
        client.load("/home/mamotec/.garth/session.json")
        print("✅ OAuth session already configured")
        print("Try: python3 garmin-sync.py")
    except:
        print("❌ No OAuth session found")
        print("\nManuelle Authentifizierung nötig:")
        print("1. Geh zu: https://sso.garmin.com/sso/signin")
        print("2. Melde dich an (moritz.vogt@vogges.de)")
        print("3. Cookies werden automatisch gespeichert")
        print("\nOder nutze garth-cli:")
        print("pip install garth-cli")
        print("garth auth moritz.vogt@vogges.de")
