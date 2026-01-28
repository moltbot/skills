#!/usr/bin/env python3
"""
Balance checker for native tokens and ERC20/SPL tokens across multiple chains.
"""
import sys
import json
import argparse
from pathlib import Path
from web3 import Web3
from solana.rpc.api import Client as SolanaClient

# Load network configurations
NETWORKS_FILE = Path(__file__).parent.parent / "references" / "networks.json"

def load_networks():
    """Load network RPC endpoints."""
    with open(NETWORKS_FILE, 'r') as f:
        return json.load(f)

NETWORKS = load_networks()

# ERC20 ABI (balanceOf + decimals)
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    }
]


def get_evm_native_balance(address: str, network: str) -> dict:
    """Get native token balance on EVM chain."""
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    balance_wei = w3.eth.get_balance(address)
    balance = w3.from_wei(balance_wei, 'ether')
    
    return {
        "network": network,
        "address": address,
        "token": NETWORKS["evm"][network]["native_token"],
        "balance": str(balance),
        "balance_wei": str(balance_wei)
    }


def get_erc20_balance(address: str, token_address: str, network: str) -> dict:
    """Get ERC20 token balance."""
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    contract = w3.eth.contract(address=Web3.to_checksum_address(token_address), abi=ERC20_ABI)
    
    balance_raw = contract.functions.balanceOf(Web3.to_checksum_address(address)).call()
    decimals = contract.functions.decimals().call()
    symbol = contract.functions.symbol().call()
    
    balance = balance_raw / (10 ** decimals)
    
    return {
        "network": network,
        "address": address,
        "token_address": token_address,
        "token": symbol,
        "balance": str(balance),
        "balance_raw": str(balance_raw),
        "decimals": decimals
    }


def get_solana_balance(address: str) -> dict:
    """Get SOL balance."""
    rpc_url = NETWORKS["solana"]["mainnet"]["rpc"]
    client = SolanaClient(rpc_url)
    
    response = client.get_balance(address)
    balance_lamports = response.value
    balance = balance_lamports / 1e9  # Convert lamports to SOL
    
    return {
        "network": "solana-mainnet",
        "address": address,
        "token": "SOL",
        "balance": str(balance),
        "balance_lamports": str(balance_lamports)
    }


def get_spl_token_balance(address: str, mint_address: str) -> dict:
    """Get SPL token balance (simplified - requires associated token account)."""
    rpc_url = NETWORKS["solana"]["mainnet"]["rpc"]
    client = SolanaClient(rpc_url)
    
    # This is simplified - in production you'd resolve the associated token account
    response = client.get_token_accounts_by_owner(address, {"mint": mint_address})
    
    if not response.value:
        return {
            "network": "solana-mainnet",
            "address": address,
            "mint": mint_address,
            "balance": "0",
            "token_accounts": 0
        }
    
    # Sum balances across all token accounts for this mint
    total_balance = sum(
        int(account.account.data.parsed["info"]["tokenAmount"]["amount"])
        for account in response.value
    )
    decimals = response.value[0].account.data.parsed["info"]["tokenAmount"]["decimals"]
    balance = total_balance / (10 ** decimals)
    
    return {
        "network": "solana-mainnet",
        "address": address,
        "mint": mint_address,
        "balance": str(balance),
        "balance_raw": str(total_balance),
        "decimals": decimals,
        "token_accounts": len(response.value)
    }


def main():
    parser = argparse.ArgumentParser(description="Balance Checker")
    parser.add_argument("address", help="Wallet address")
    parser.add_argument("--network", help="Network name (e.g., ethereum, polygon, solana)")
    parser.add_argument("--token", help="Token contract address (for ERC20/SPL)")
    parser.add_argument("--all-evm", action="store_true", help="Check all EVM networks")
    
    args = parser.parse_args()
    
    results = []
    
    if args.all_evm:
        # Check all EVM networks
        for network in NETWORKS["evm"].keys():
            try:
                balance = get_evm_native_balance(args.address, network)
                results.append(balance)
            except Exception as e:
                results.append({"network": network, "error": str(e)})
    
    elif args.network:
        if args.network in NETWORKS["evm"]:
            if args.token:
                result = get_erc20_balance(args.address, args.token, args.network)
            else:
                result = get_evm_native_balance(args.address, args.network)
            results.append(result)
        
        elif args.network == "solana":
            if args.token:
                result = get_spl_token_balance(args.address, args.token)
            else:
                result = get_solana_balance(args.address)
            results.append(result)
        
        else:
            print(json.dumps({"error": f"Unknown network: {args.network}"}))
            sys.exit(1)
    
    else:
        parser.print_help()
        sys.exit(1)
    
    print(json.dumps(results if len(results) > 1 else results[0], indent=2))


if __name__ == "__main__":
    main()
