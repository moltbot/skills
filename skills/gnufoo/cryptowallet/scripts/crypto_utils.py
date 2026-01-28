#!/usr/bin/env python3
"""
Encryption utilities for secure key storage.
Uses AES-256-GCM with PBKDF2 key derivation.
"""
import os
import json
from pathlib import Path
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEYSTORE_DIR = Path.home() / ".clawdbot" / "cryptowallet"
KEYSTORE_DIR.mkdir(parents=True, exist_ok=True)


def derive_key(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())


def encrypt_private_key(private_key: str, password: str) -> dict:
    """
    Encrypt a private key with a password.
    Returns dict with salt, nonce, and ciphertext (all base64).
    """
    salt = os.urandom(16)
    key = derive_key(password, salt)
    
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, private_key.encode(), None)
    
    return {
        "salt": salt.hex(),
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex()
    }


def decrypt_private_key(encrypted_data: dict, password: str) -> str:
    """Decrypt a private key using the password."""
    salt = bytes.fromhex(encrypted_data["salt"])
    nonce = bytes.fromhex(encrypted_data["nonce"])
    ciphertext = bytes.fromhex(encrypted_data["ciphertext"])
    
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode()
    except Exception:
        raise ValueError("Incorrect password or corrupted data")


def save_wallet(name: str, address: str, encrypted_key: dict, chain_type: str):
    """Save an encrypted wallet to disk."""
    wallet_file = KEYSTORE_DIR / f"{name}.json"
    data = {
        "name": name,
        "address": address,
        "chain_type": chain_type,
        "encrypted_key": encrypted_key
    }
    with open(wallet_file, 'w') as f:
        json.dump(data, f, indent=2)
    wallet_file.chmod(0o600)  # Owner read/write only
    return str(wallet_file)


def load_wallet(name: str) -> dict:
    """Load an encrypted wallet from disk."""
    wallet_file = KEYSTORE_DIR / f"{name}.json"
    if not wallet_file.exists():
        raise FileNotFoundError(f"Wallet '{name}' not found")
    
    with open(wallet_file, 'r') as f:
        return json.load(f)


def list_wallets() -> list:
    """List all saved wallets."""
    wallets = []
    for wallet_file in KEYSTORE_DIR.glob("*.json"):
        with open(wallet_file, 'r') as f:
            data = json.load(f)
            wallets.append({
                "name": data["name"],
                "address": data["address"],
                "chain_type": data["chain_type"]
            })
    return wallets


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        wallets = list_wallets()
        print(json.dumps(wallets, indent=2))
