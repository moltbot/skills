#!/usr/bin/env python3
import json
import sys
import argparse
import urllib.request
import os
from datetime import datetime

# Configuration should come from Environment Variables
TOKEN = os.environ.get("TESLA_MATE_TOKEN")
DEFAULT_VIN = os.environ.get("TESLA_VIN")
API_BASE = "https://api.myteslamate.com/api/1/vehicles"

def call_api(path, method="GET", data=None, vin=None):
    if not TOKEN:
        print(json.dumps({"error": "Missing TESLA_MATE_TOKEN environment variable."}))
        sys.exit(1)
    
    target_vin = vin or DEFAULT_VIN
    url = f"{API_BASE}/{target_vin}/{path}" if path else API_BASE
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers, method=method)
        if data is not None:
            body = json.dumps(data).encode('utf-8')
            with urllib.request.urlopen(req, data=body) as response:
                return json.loads(response.read().decode())
        else:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return {"error": f"HTTP {e.code}", "message": json.loads(e.read().decode())}
        except:
            return {"error": f"HTTP {e.code}"}
    except Exception as e:
        return {"error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="Tesla Control via MyTeslaMate API")
    parser.add_argument("--vin", help="Specify vehicle VIN")
    parser.add_argument("--list", action="store_true", help="List all vehicles")
    parser.add_argument("--status", action="store_true", help="Get vehicle status")
    parser.add_argument("--wake", action="store_true", help="Wake up the vehicle")
    parser.add_argument("--climate", choices=["on", "off"], help="Turn climate on or off")
    parser.add_argument("--charge-limit", type=int, help="Set charge limit (50-100)")
    parser.add_argument("--set-schedule", help="Set charging start time (HH:MM)")
    parser.add_argument("--clear-schedule", action="store_true", help="Clear charging schedule")
    parser.add_argument("--remove-schedules", action="store_true", help="Completely remove all charge schedules")
    
    args = parser.parse_args()

    if args.list:
        print(json.dumps(call_api("")))
    elif args.wake:
        print(json.dumps(call_api("wake_up", method="POST", vin=args.vin)))
    elif args.status:
        print(json.dumps(call_api("vehicle_data", vin=args.vin)))
    elif args.climate:
        action = "auto_conditioning_start" if args.climate == "on" else "auto_conditioning_stop"
        print(json.dumps(call_api(f"command/{action}", method="POST", vin=args.vin)))
    elif args.charge_limit:
        print(json.dumps(call_api("command/set_charge_limit", method="POST", data={"percent": args.charge_limit}, vin=args.vin)))
    elif args.set_schedule:
        try:
            h, m = map(int, args.set_schedule.split(":"))
            minutes = h * 60 + m
            payload = {"enable": True, "time": minutes}
            print(json.dumps(call_api("command/set_scheduled_charging", method="POST", data=payload, vin=args.vin)))
        except ValueError:
            print(json.dumps({"error": "Invalid time format. Use HH:MM"}))
    elif args.clear_schedule:
        print(json.dumps(call_api("command/set_scheduled_charging", method="POST", data={"enable": False}, vin=args.vin)))
    elif args.remove_schedules:
        # According to Tesla Fleet API, remove_charge_schedule completely deletes the configuration
        print(json.dumps(call_api("command/remove_charge_schedule", method="POST", data={}, vin=args.vin)))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
