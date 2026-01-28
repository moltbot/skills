#!/usr/bin/env python3
"""
Smart contract interaction (read and write calls).
"""
import sys
import json
import argparse
from pathlib import Path
from web3 import Web3
from eth_account import Account
from crypto_utils import load_wallet, decrypt_private_key

NETWORKS_FILE = Path(__file__).parent.parent / "references" / "networks.json"

def load_networks():
    with open(NETWORKS_FILE, 'r') as f:
        return json.load(f)

NETWORKS = load_networks()


def call_contract_read(contract_address: str, abi: list, function_name: str, args: list, network: str) -> dict:
    """Call a contract read function (view/pure)."""
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi
    )
    
    func = getattr(contract.functions, function_name)
    result = func(*args).call()
    
    return {
        "network": network,
        "contract": contract_address,
        "function": function_name,
        "args": args,
        "result": str(result)
    }


def call_contract_write(wallet_name: str, password: str, contract_address: str, abi: list, 
                       function_name: str, args: list, network: str, value: str = "0") -> dict:
    """Call a contract write function (transaction)."""
    # Load and decrypt wallet
    wallet_data = load_wallet(wallet_name)
    private_key = decrypt_private_key(wallet_data["encrypted_key"], password)
    
    # Setup Web3
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    account = Account.from_key(private_key)
    
    # Get contract
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi
    )
    
    # Build transaction
    func = getattr(contract.functions, function_name)
    nonce = w3.eth.get_transaction_count(account.address)
    
    tx = func(*args).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'value': w3.to_wei(value, 'ether'),
        'gas': 500000,  # Estimate or set manually
        'gasPrice': w3.eth.gas_price,
        'chainId': NETWORKS["evm"][network]["chain_id"]
    })
    
    # Sign and send
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    return {
        "network": network,
        "contract": contract_address,
        "function": function_name,
        "args": args,
        "from": account.address,
        "tx_hash": tx_hash.hex()
    }


def main():
    parser = argparse.ArgumentParser(description="Smart Contract Interactor")
    parser.add_argument("contract", help="Contract address")
    parser.add_argument("function", help="Function name")
    parser.add_argument("--abi", required=True, help="Path to ABI JSON file")
    parser.add_argument("--args", default="[]", help="Function arguments as JSON array")
    parser.add_argument("--network", required=True, help="Network name")
    parser.add_argument("--write", action="store_true", help="Write transaction (requires wallet)")
    parser.add_argument("--wallet", help="Wallet name (for write transactions)")
    parser.add_argument("--password", help="Wallet password (for write transactions)")
    parser.add_argument("--value", default="0", help="ETH value to send (for payable functions)")
    
    args = parser.parse_args()
    
    # Load ABI
    with open(args.abi, 'r') as f:
        abi = json.load(f)
    
    # Parse arguments
    function_args = json.loads(args.args)
    
    try:
        if args.write:
            if not args.wallet or not args.password:
                print(json.dumps({"error": "--wallet and --password required for write transactions"}))
                sys.exit(1)
            
            result = call_contract_write(
                args.wallet, args.password, args.contract, abi,
                args.function, function_args, args.network, args.value
            )
        else:
            result = call_contract_read(
                args.contract, abi, args.function, function_args, args.network
            )
        
        print(json.dumps(result, indent=2))
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
