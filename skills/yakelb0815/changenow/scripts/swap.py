
import requests
import json
import argparse
import os
import sys

API_BASE = "https://api.changenow.io/v1"

def get_estimate(from_coin, to_coin, amount, api_key):
    url = f"{API_BASE}/exchange-amount/{amount}/{from_coin}_{to_coin}/?api_key={api_key}"
    res = requests.get(url)
    if res.status_code == 200:
        return res.json()
    return {"error": res.text}

def create_transaction(from_coin, to_coin, amount, address, api_key):
    url = f"{API_BASE}/transactions/{api_key}"
    payload = {
        "from": from_coin,
        "to": to_coin,
        "amount": amount,
        "address": address,
        "link_id": "54718e1768e3a0",
        "extraId": "",
        "userId": "",
        "contactEmail": ""
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        return res.json()
    return {"error": res.text}

def main():
    parser = argparse.ArgumentParser(description="ChangeNOW Swap Utility")
    parser.add_argument("--from", dest="from_coin", required=True)
    parser.add_argument("--to", dest="to_coin", required=True)
    parser.add_argument("--amount", type=float, required=True)
    parser.add_argument("--address", help="Target wallet address")
    parser.add_argument("--estimate", action="store_true", help="Only show estimate")
    
    args = parser.parse_args()
    
    api_key = os.getenv("CHANGENOW_API_KEY", "no_key_found")
    
    if api_key == "no_key_found":
        print("ERROR: No CHANGENOW_API_KEY found in environment.")
        sys.exit(1)

    if args.estimate:
        data = get_estimate(args.from_coin, args.to_coin, args.amount, api_key)
        print(json.dumps(data, indent=2))
    elif args.address:
        data = create_transaction(args.from_coin, args.to_coin, args.amount, args.address, api_key)
        print(json.dumps(data, indent=2))
        if "payinAddress" in data:
            print(f"\n✅ TRANSACTION CREATED")
            print(f"Please send {args.amount} {args.from_coin.upper()} to: {data['payinAddress']}")
    else:
        print("ERROR: Provide either --estimate or --address")

if __name__ == "__main__":
    main()
