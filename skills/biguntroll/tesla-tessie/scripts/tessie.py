#!/usr/bin/env python3
"""Tessie API interaction script for Tesla vehicle control"""

import argparse
import json
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


def make_request(method, url, headers, body=None):
    """Make HTTP request and return JSON response"""
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            if body:
                response = requests.post(url, headers=headers, json=body)
            else:
                response = requests.post(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def get_vehicles(api_key):
    """Get list of vehicles"""
    headers = {'Authorization': f'Bearer {api_key}'}
    return make_request('GET', 'https://api.tessie.com/vehicles', headers)


def get_status(api_key, vin):
    """Get vehicle status"""
    headers = {'Authorization': f'Bearer {api_key}'}
    return make_request('GET', f'https://api.tessie.com/{vin}/status', headers)


def get_battery(api_key, vin):
    """Get battery info"""
    headers = {'Authorization': f'Bearer {api_key}'}
    return make_request('GET', f'https://api.tessie.com/{vin}/battery', headers)


def get_location(api_key, vin):
    """Get vehicle location"""
    headers = {'Authorization': f'Bearer {api_key}'}
    return make_request('GET', f'https://api.tessie.com/{vin}/location', headers)


def invoke_command(api_key, vin, command, body=None):
    """Invoke a vehicle command"""
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    url = f'https://api.tessie.com/{vin}/{command}'
    return make_request('POST', url, headers, body)


def main():
    parser = argparse.ArgumentParser(description='Control Tesla via Tessie API')
    parser.add_argument('action', help='Action to perform')
    parser.add_argument('--vin', help='Vehicle VIN')
    parser.add_argument('--value', help='Value parameter for certain actions')
    
    args = parser.parse_args()
    api_key = get_api_key()
    
    action = args.action.lower()
    
    try:
        if action == 'vehicles':
            result = get_vehicles(api_key)
        elif action == 'status':
            if not args.vin:
                print("Error: --vin required for status", file=sys.stderr)
                sys.exit(1)
            result = get_status(api_key, args.vin)
        elif action == 'battery':
            if not args.vin:
                print("Error: --vin required for battery", file=sys.stderr)
                sys.exit(1)
            result = get_battery(api_key, args.vin)
        elif action == 'location':
            if not args.vin:
                print("Error: --vin required for location", file=sys.stderr)
                sys.exit(1)
            result = get_location(api_key, args.vin)
        elif action == 'wake':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'wake')
        elif action == 'lock':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'lock')
        elif action == 'unlock':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'unlock')
        elif action == 'honk':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'honk')
        elif action == 'flash':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'flash_lights')
        elif action == 'start_climate':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'start_climate')
        elif action == 'stop_climate':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'stop_climate')
        elif action == 'set_temperature':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            if not args.value:
                print("Error: --value required (temperature in Celsius)", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'set_temperature', 
                                   {'temperature': int(args.value)})
        elif action == 'start_charging':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'start_charging')
        elif action == 'stop_charging':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'stop_charging')
        elif action == 'set_charge_limit':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            if not args.value:
                print("Error: --value required (charge limit 0-100)", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'set_charge_limit', 
                                   {'percent': int(args.value)})
        elif action == 'open_charge_port':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'open_charge_port')
        elif action == 'close_charge_port':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'close_charge_port')
        elif action == 'open_frunk':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'front_trunk')
        elif action == 'open_trunk':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'rear_trunk')
        elif action == 'fart':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'command/remote_boombox')
        elif action == 'schedule_update':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            seconds = int(args.value) if args.value else 0
            result = invoke_command(api_key, args.vin, 'command/schedule_software_update',
                                   {'in_seconds': seconds})
        elif action == 'cancel_update':
            if not args.vin:
                print("Error: --vin required", file=sys.stderr)
                sys.exit(1)
            result = invoke_command(api_key, args.vin, 'command/cancel_software_update')
        else:
            print(f"Error: Unknown action: {action}", file=sys.stderr)
            print("Available actions: vehicles, status, battery, location, wake, lock, unlock, "
                  "honk, flash, start_climate, stop_climate, set_temperature, start_charging, "
                  "stop_charging, set_charge_limit, open_charge_port, close_charge_port, "
                  "open_frunk, open_trunk, fart, schedule_update, cancel_update", file=sys.stderr)
            sys.exit(1)
        
        print(json.dumps(result, indent=2))
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
