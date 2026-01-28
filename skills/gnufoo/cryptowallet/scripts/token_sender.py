#!/usr/bin/env python3
"""
Send native tokens and ERC20/SPL tokens with password-protected signing.
"""
import sys
import json
import argparse
from pathlib import Path
from web3 import Web3
from eth_account import Account
from solders.keypair import Keypair
from solana.rpc.api import Client as SolanaClient
from solana.transaction import Transaction
from solders.system_program import transfer, TransferParams
from solders.pubkey import Pubkey as PublicKey
from crypto_utils import load_wallet, decrypt_private_key

NETWORKS_FILE = Path(__file__).parent.parent / "references" / "networks.json"

def load_networks():
    with open(NETWORKS_FILE, 'r') as f:
        return json.load(f)

NETWORKS = load_networks()

# ERC20 Transfer ABI
ERC20_TRANSFER_ABI = [{
    "constant": False,
    "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
}]


def send_evm_native(wallet_name: str, password: str, to_address: str, amount: str, network: str) -> dict:
    """Send native token on EVM chain."""
    # Load and decrypt wallet
    wallet_data = load_wallet(wallet_name)
    private_key = decrypt_private_key(wallet_data["encrypted_key"], password)
    
    # Setup Web3
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    account = Account.from_key(private_key)
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(account.address)
    tx = {
        'nonce': nonce,
        'to': Web3.to_checksum_address(to_address),
        'value': w3.to_wei(amount, 'ether'),
        'gas': 21000,
        'gasPrice': w3.eth.gas_price,
        'chainId': NETWORKS["evm"][network]["chain_id"]
    }
    
    # Sign and send
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    return {
        "network": network,
        "from": account.address,
        "to": to_address,
        "amount": amount,
        "token": NETWORKS["evm"][network]["native_token"],
        "tx_hash": tx_hash.hex()
    }


def send_erc20(wallet_name: str, password: str, to_address: str, amount: str, token_address: str, network: str) -> dict:
    """Send ERC20 token."""
    # Load and decrypt wallet
    wallet_data = load_wallet(wallet_name)
    private_key = decrypt_private_key(wallet_data["encrypted_key"], password)
    
    # Setup Web3
    rpc_url = NETWORKS["evm"][network]["rpc"]
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    account = Account.from_key(private_key)
    
    # Get token contract
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(token_address),
        abi=ERC20_TRANSFER_ABI
    )
    
    # Get decimals (assume 18 if call fails)
    try:
        decimals = contract.functions.decimals().call()
    except:
        decimals = 18
    
    amount_raw = int(float(amount) * (10 ** decimals))
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(account.address)
    tx = contract.functions.transfer(
        Web3.to_checksum_address(to_address),
        amount_raw
    ).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'chainId': NETWORKS["evm"][network]["chain_id"]
    })
    
    # Sign and send
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    return {
        "network": network,
        "from": account.address,
        "to": to_address,
        "amount": amount,
        "token_address": token_address,
        "tx_hash": tx_hash.hex()
    }


def send_solana(wallet_name: str, password: str, to_address: str, amount: str) -> dict:
    """Send SOL."""
    # Load and decrypt wallet
    wallet_data = load_wallet(wallet_name)
    private_key_json = decrypt_private_key(wallet_data["encrypted_key"], password)
    key_bytes = bytes(json.loads(private_key_json))
    
    keypair = Keypair.from_bytes(key_bytes)
    client = SolanaClient(NETWORKS["solana"]["mainnet"]["rpc"])
    
    # Build transaction
    amount_lamports = int(float(amount) * 1e9)
    transfer_ix = transfer(
        TransferParams(
            from_pubkey=keypair.pubkey(),
            to_pubkey=PublicKey.from_string(to_address),
            lamports=amount_lamports
        )
    )
    
    # Get recent blockhash
    recent_blockhash = client.get_latest_blockhash().value.blockhash
    
    # Create and sign transaction
    tx = Transaction([transfer_ix], recent_blockhash, fee_payer=keypair.pubkey())
    tx.sign(keypair)
    
    # Send
    response = client.send_transaction(tx, keypair)
    
    return {
        "network": "solana-mainnet",
        "from": str(keypair.pubkey()),
        "to": to_address,
        "amount": amount,
        "token": "SOL",
        "signature": str(response.value)
    }


def main():
    parser = argparse.ArgumentParser(description="Token Sender")
    parser.add_argument("wallet", help="Wallet name")
    parser.add_argument("to", help="Recipient address")
    parser.add_argument("amount", help="Amount to send")
    parser.add_argument("--password", required=True, help="Wallet password")
    parser.add_argument("--network", required=True, help="Network (ethereum, polygon, solana, etc.)")
    parser.add_argument("--token", help="Token contract address (for ERC20/SPL)")
    
    args = parser.parse_args()
    
    try:
        if args.network in NETWORKS["evm"]:
            if args.token:
                result = send_erc20(args.wallet, args.password, args.to, args.amount, args.token, args.network)
            else:
                result = send_evm_native(args.wallet, args.password, args.to, args.amount, args.network)
        
        elif args.network == "solana":
            if args.token:
                print(json.dumps({"error": "SPL token transfer not yet implemented"}))
                sys.exit(1)
            else:
                result = send_solana(args.wallet, args.password, args.to, args.amount)
        
        else:
            print(json.dumps({"error": f"Unknown network: {args.network}"}))
            sys.exit(1)
        
        print(json.dumps(result, indent=2))
    
    except ValueError as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Transaction failed: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
