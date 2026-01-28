#!/usr/bin/env python3
"""
Wallet creation and management for EVM and Solana chains.
"""
import sys
import json
import argparse
from eth_account import Account
from solders.keypair import Keypair
from crypto_utils import encrypt_private_key, save_wallet, load_wallet, list_wallets

# Enable unaudited HD wallet features
Account.enable_unaudited_hdwallet_features()


def create_evm_wallet(name: str, password: str) -> dict:
    """Create a new EVM wallet."""
    account = Account.create()
    private_key = account.key.hex()
    address = account.address
    
    encrypted = encrypt_private_key(private_key, password)
    wallet_path = save_wallet(name, address, encrypted, "evm")
    
    return {
        "name": name,
        "address": address,
        "chain_type": "evm",
        "saved_to": wallet_path
    }


def create_solana_wallet(name: str, password: str) -> dict:
    """Create a new Solana wallet."""
    keypair = Keypair()
    private_key = json.dumps(list(bytes(keypair)))  # Store as JSON array
    address = str(keypair.pubkey())
    
    encrypted = encrypt_private_key(private_key, password)
    wallet_path = save_wallet(name, address, encrypted, "solana")
    
    return {
        "name": name,
        "address": address,
        "chain_type": "solana",
        "saved_to": wallet_path
    }


def import_wallet(name: str, private_key: str, chain_type: str, password: str) -> dict:
    """Import an existing wallet."""
    if chain_type == "evm":
        account = Account.from_key(private_key)
        address = account.address
    elif chain_type == "solana":
        # Solana private key can be in various formats
        if private_key.startswith("["):
            key_bytes = bytes(json.loads(private_key))
        else:
            from base58 import b58decode
            key_bytes = b58decode(private_key)[:32]
        
        keypair = Keypair.from_bytes(key_bytes)
        address = str(keypair.pubkey())
        private_key = json.dumps(list(key_bytes))
    else:
        raise ValueError(f"Unsupported chain type: {chain_type}")
    
    encrypted = encrypt_private_key(private_key, password)
    wallet_path = save_wallet(name, address, encrypted, chain_type)
    
    return {
        "name": name,
        "address": address,
        "chain_type": chain_type,
        "saved_to": wallet_path
    }


def main():
    parser = argparse.ArgumentParser(description="Wallet Manager")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new wallet")
    create_parser.add_argument("name", help="Wallet name")
    create_parser.add_argument("--chain", choices=["evm", "solana"], required=True)
    create_parser.add_argument("--password", required=True, help="Encryption password")
    
    # Import command
    import_parser = subparsers.add_parser("import", help="Import existing wallet")
    import_parser.add_argument("name", help="Wallet name")
    import_parser.add_argument("--key", required=True, help="Private key")
    import_parser.add_argument("--chain", choices=["evm", "solana"], required=True)
    import_parser.add_argument("--password", required=True, help="Encryption password")
    
    # List command
    subparsers.add_parser("list", help="List all wallets")
    
    args = parser.parse_args()
    
    if args.command == "create":
        if args.chain == "evm":
            result = create_evm_wallet(args.name, args.password)
        else:
            result = create_solana_wallet(args.name, args.password)
        print(json.dumps(result, indent=2))
    
    elif args.command == "import":
        result = import_wallet(args.name, args.key, args.chain, args.password)
        print(json.dumps(result, indent=2))
    
    elif args.command == "list":
        wallets = list_wallets()
        print(json.dumps(wallets, indent=2))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
