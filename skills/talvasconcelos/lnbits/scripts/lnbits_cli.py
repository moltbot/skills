#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

# Configuration
BASE_URL = os.getenv("LNBITS_BASE_URL", "https://legend.lnbits.com").rstrip("/")
API_KEY = os.getenv("LNBITS_API_KEY")

# --- Helpers ---

def error(msg, code=1):
    print(json.dumps({"error": msg}))
    sys.exit(code)

def request(method, endpoint, data=None):
    if not API_KEY:
        error("LNBITS_API_KEY environment variable is not set.")

    url = f"{BASE_URL}/api/v1{endpoint}"
    headers = {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, method=method, headers=headers, data=body)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        error(f"API Error ({e.code}): {error_body}")
    except Exception as e:
        error(f"Network Error: {str(e)}")

# --- Core Logic ---

def get_balance():
    data = request("GET", "/wallet")
    return {
        "name": data.get("name"),
        "balance_msat": data.get("balance"),
        "balance_sats": int(data.get("balance", 0) / 1000)
    }

def create_invoice(amount, memo):
    return request("POST", "/payments", {
        "out": False, "amount": amount, "memo": memo, "unit": "sat"
    })

def pay_invoice(bolt11):
    return request("POST", "/payments", {"out": True, "bolt11": bolt11})

def decode_invoice(bolt11):
    return request("POST", "/payments/decode", {"data": bolt11})

def create_wallet(name):
    url = f"{BASE_URL}/api/v1/account"
    req = urllib.request.Request(
        url, 
        method="POST", 
        headers={"Content-Type": "application/json"},
        data=json.dumps({"name": name}).encode("utf-8")
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

# --- CLI Handlers ---

def cmd_balance(args):
    print(json.dumps(get_balance(), indent=2))

def cmd_create(args):
    print(json.dumps(create_wallet(args.name), indent=2))

def cmd_invoice(args):
    print(json.dumps(create_invoice(args.amount, args.memo), indent=2))

def cmd_pay(args):
    print(json.dumps(pay_invoice(args.bolt11), indent=2))

def cmd_decode(args):
    print(json.dumps(decode_invoice(args.bolt11), indent=2))

# --- Main ---

def main():
    parser = argparse.ArgumentParser(description="LNbits CLI Bridge for Clawdbot")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Balance
    p_balance = subparsers.add_parser("balance", help="Get wallet balance")
    p_balance.set_defaults(func=cmd_balance)

    # Create Wallet (Account)
    p_create = subparsers.add_parser("create", help="Create a new LNbits wallet")
    p_create.add_argument("--name", type=str, default="Moltbot Wallet", help="Name of the new wallet")
    p_create.set_defaults(func=cmd_create)

    # Invoice
    p_invoice = subparsers.add_parser("invoice", help="Create a lightning invoice")
    p_invoice.add_argument("--amount", type=int, required=True, help="Amount in satoshis")
    p_invoice.add_argument("--memo", type=str, default="", help="Optional memo")
    p_invoice.set_defaults(func=cmd_invoice)

    # Pay
    p_pay = subparsers.add_parser("pay", help="Pay a lightning invoice")
    p_pay.add_argument("bolt11", type=str, help="The Bolt11 invoice string")
    p_pay.set_defaults(func=cmd_pay)

    # Decode
    p_decode = subparsers.add_parser("decode", help="Decode a lightning invoice")
    p_decode.add_argument("bolt11", type=str, help="The Bolt11 invoice string")
    p_decode.set_defaults(func=cmd_decode)

    args = parser.parse_args()

    try:
        args.func(args)
    except Exception as e:
        error(str(e))

if __name__ == "__main__":
    main()