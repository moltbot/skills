/**
 * x402 Client Wrapper
 * 
 * Reusable client for making x402-paid HTTP requests.
 * Handles all the API quirks so you don't have to.
 * 
 * Usage:
 *   import { createPayClient } from './lib/client.js';
 *   const payFetch = await createPayClient();
 *   const response = await payFetch('https://api.example.com/paid-endpoint');
 *   // If 402 → auto-signs USDC → retries → returns response
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const WALLET_FILE = join(homedir(), ".x402", "wallet.json");

/**
 * Load wallet from ~/.x402/wallet.json
 * @returns {object} Wallet data with address + privateKey
 * @throws If wallet file doesn't exist
 */
export function loadWallet() {
  if (!existsSync(WALLET_FILE)) {
    throw new Error(
      "No wallet found at ~/.x402/wallet.json. Run setup.sh first:\n" +
      "  cd <skill-dir> && bash scripts/setup.sh"
    );
  }
  return JSON.parse(readFileSync(WALLET_FILE, "utf-8"));
}

/**
 * Create a payment-enabled fetch function.
 * Drop-in replacement for fetch() that auto-handles 402 payments.
 * 
 * @param {object} [options]
 * @param {string} [options.walletPath] - Custom wallet file path (default: ~/.x402/wallet.json)
 * @param {number} [options.maxPrice] - Max payment in USD (default: 1.00). Safety limit.
 * @returns {Promise<Function>} A fetch function that auto-pays 402 responses
 * 
 * @example
 *   const payFetch = await createPayClient();
 *   const res = await payFetch('https://paid-api.example.com/data');
 *   const data = await res.json();
 */
export async function createPayClient(options = {}) {
  const walletPath = options.walletPath || WALLET_FILE;
  
  if (!existsSync(walletPath)) {
    throw new Error("No wallet found. Run setup.sh first.");
  }
  
  const walletData = JSON.parse(readFileSync(walletPath, "utf-8"));
  
  // Import x402 dependencies
  const { privateKeyToAccount } = await import("viem/accounts");
  const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
  const { registerExactEvmScheme } = await import("@x402/evm/exact/client");
  
  // Create signer from wallet private key
  const signer = privateKeyToAccount(walletData.privateKey);
  
  // Create x402 client and register EVM payment scheme
  // IMPORTANT: config object { signer }, not raw signer
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  
  // Wrap native fetch with x402 payment handling
  // IMPORTANT: globalThis.fetch is FIRST arg, client is SECOND
  const payFetch = wrapFetchWithPayment(globalThis.fetch, client);
  
  // Optionally wrap with max price check
  if (options.maxPrice) {
    const maxPriceWei = BigInt(Math.floor(options.maxPrice * 1e6));
    return async (url, init) => {
      // First check price with a dry run
      const dryRes = await globalThis.fetch(url, init);
      if (dryRes.status === 402) {
        const header = dryRes.headers.get("payment-required");
        if (header) {
          try {
            const req = JSON.parse(Buffer.from(header, "base64").toString());
            const price = BigInt(req.accepts?.[0]?.amount || req.accepts?.[0]?.maxAmountRequired || "0");
            if (price > maxPriceWei) {
              throw new Error(
                `Price $${Number(price) / 1e6} exceeds max $${options.maxPrice}. ` +
                `Use { maxPrice: ${Number(price) / 1e6} } to allow.`
              );
            }
          } catch (e) {
            if (e.message.includes("exceeds max")) throw e;
            // Parse failed — let payFetch handle it
          }
        }
      } else {
        return dryRes; // Not a 402, return as-is
      }
      // Price OK — make the paid request
      return payFetch(url, init);
    };
  }
  
  return payFetch;
}

/**
 * Get wallet address (safe to share publicly).
 * @returns {string} EVM wallet address
 */
export function getWalletAddress() {
  return loadWallet().address;
}

/**
 * Check USDC balance on Base network.
 * @param {string} [network="base-sepolia"] - "base" for mainnet, "base-sepolia" for testnet
 * @returns {Promise<string>} Balance in USDC (human-readable, e.g. "20.0")
 */
export async function getBalance(network = "base-sepolia") {
  const { ethers } = await import("ethers");
  const wallet = loadWallet();
  
  const config = {
    "base": { rpc: "https://mainnet.base.org", contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    "base-sepolia": { rpc: "https://sepolia.base.org", contract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
  }[network];
  
  if (!config) throw new Error(`Unknown network: ${network}. Use "base" or "base-sepolia".`);
  
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const usdc = new ethers.Contract(config.contract, ["function balanceOf(address) view returns (uint256)"], provider);
  const balance = await usdc.balanceOf(wallet.address);
  return ethers.formatUnits(balance, 6);
}
