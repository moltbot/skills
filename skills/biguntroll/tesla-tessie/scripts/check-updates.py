#!/usr/bin/env python3
"""Check for Tesla software updates and notify if available"""

import argparse
import os
import sys
import requests


def get_api_key():
    """Get API key from environment"""
    api_key = os.environ.get('TESSIE_API_KEY')
    if not api_key:
        print("Error: TESSIE_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)
    return api_key


def main():
    parser = argparse.ArgumentParser(description='Check Tesla software updates')
    parser.add_argument('--vin', help='Vehicle VIN (optional, uses first vehicle if not specified)')
    
    args = parser.parse_args()
    api_key = get_api_key()
    
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        # Get vehicle data
        response = requests.get('https://api.tessie.com/vehicles', headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if args.vin:
            # Find specific vehicle
            vehicle = None
            for v in data.get('results', []):
                if v.get('vin') == args.vin:
                    vehicle = v
                    break
            
            if not vehicle:
                print(f"Error: Vehicle with VIN {args.vin} not found", file=sys.stderr)
                sys.exit(1)
        else:
            # Use first vehicle if no VIN specified
            results = data.get('results', [])
            if not results:
                print("Error: No vehicles found in account", file=sys.stderr)
                sys.exit(1)
            vehicle = results[0]
        
        # Check software update status
        update = vehicle.get('last_state', {}).get('vehicle_state', {}).get('software_update')
        
        if update and update.get('status'):
            version = update.get('version', 'unknown')
            status = update.get('status')
            
            if status == 'available':
                print(f"UPDATE_AVAILABLE: Software update {version} is ready to install!")
            elif status == 'downloading':
                download_perc = update.get('download_perc', 0)
                print(f"UPDATE_DOWNLOADING: Downloading update {version} ({download_perc}%)")
            elif status == 'installing':
                install_perc = update.get('install_perc', 0)
                print(f"UPDATE_INSTALLING: Installing update {version} ({install_perc}%)")
            elif status == 'scheduled':
                print(f"UPDATE_SCHEDULED: Update {version} is scheduled")
            else:
                print("NO_UPDATE")
        else:
            print("NO_UPDATE")
    
    except requests.exceptions.RequestException as e:
        print(f"Error: Failed to check for updates: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
