#!/usr/bin/env python3
"""
Garmin OAuth Authentication Setup
One-time setup: saves OAuth session for future use
"""

import os
from pathlib import Path

try:
    from garth import Client
except ImportError:
    print("❌ garth not installed. Run: pip install garth")
    exit(1)

def setup_oauth(email, password):
    """Authenticate with Garmin and save session"""
    
    garth_dir = Path.home() / ".garth"
    session_file = garth_dir / "session.json"
    
    print(f"🔐 Authenticating with Garmin ({email})...")
    
    try:
        client = Client()
        client.login(email, password)
        
        # Save session
        garth_dir.mkdir(exist_ok=True)
        client.dump(str(session_file))
        
        print(f"✅ OAuth session saved to {session_file}")
        print("✅ You can now use garmin-sync.py")
        
        return True
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("\nCommon issues:")
        print("- Wrong email/password")
        print("- 2FA enabled (disable or use app-specific password)")
        print("- Garmin servers temporary unavailable")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python3 garmin-auth.py <email> <password>")
        print("Example: python3 garmin-auth.py moritz.vogt@vogges.de MyPassword123")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    success = setup_oauth(email, password)
    sys.exit(0 if success else 1)
