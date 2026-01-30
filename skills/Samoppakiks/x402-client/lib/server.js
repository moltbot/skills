/**
 * x402 Server Wrapper
 * 
 * Reusable helpers for serving x402-paywalled endpoints.
 * Builds proper 402 responses without needing the live Coinbase facilitator.
 * 
 * Usage:
 *   import { createPaywall, paymentRequired } from './lib/server.js';
 *   
 *   // Option 1: Express middleware
 *   app.get('/paid', createPaywall({ price: 0.03 }), (req, res) => {
 *     res.json({ data: 'premium content' });
 *   });
 *   
 *   // Option 2: Manual 402 response
 *   if (!hasPayment(req)) {
 *     return paymentRequired(res, { price: 0.03 });
 *   }
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const WALLET_FILE = join(homedir(), ".x402", "wallet.json");

// USDC contract addresses per network
const USDC_CONTRACTS = {
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",     // Base mainnet
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",    // Base Sepolia
};

// EIP-712 domain params for USDC
const USDC_DOMAIN = { name: "USDC", version: "2" };

/**
 * Build a 402 payment requirements object (x402 v2 format).
 * 
 * @param {object} options
 * @param {number} options.price - Price in USD (e.g. 0.03 for $0.03)
 * @param {string} [options.network="eip155:84532"] - Network ID (Base Sepolia default)
 * @param {string} [options.payTo] - Wallet address to pay (default: from wallet.json)
 * @param {string} [options.resource] - Resource URL
 * @param {string} [options.description] - Description of what's being paid for
 * @param {number} [options.maxTimeoutSeconds=300] - Payment validity window
 * @returns {object} x402 v2 payment requirements object
 */
export function buildPaymentRequirements(options) {
  const { price, network = "eip155:84532", resource = "", description = "", maxTimeoutSeconds = 300 } = options;
  
  let payTo = options.payTo;
  if (!payTo) {
    if (!existsSync(WALLET_FILE)) {
      throw new Error("No wallet found and no payTo specified. Run setup.sh first.");
    }
    payTo = JSON.parse(readFileSync(WALLET_FILE, "utf-8")).address;
  }
  
  const asset = USDC_CONTRACTS[network];
  if (!asset) {
    throw new Error(`Unknown network: ${network}. Supported: ${Object.keys(USDC_CONTRACTS).join(", ")}`);
  }
  
  // Convert USD price to USDC smallest unit (6 decimals)
  const amount = String(Math.round(price * 1e6));
  
  return {
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network,
      maxAmountRequired: amount,
      amount,
      resource,
      description,
      mimeType: "application/json",
      payTo,
      maxTimeoutSeconds,
      asset,
      extra: { ...USDC_DOMAIN },
    }],
  };
}

/**
 * Encode payment requirements as a base64 header value (v2 format).
 * @param {object} requirements - Payment requirements object
 * @returns {string} Base64-encoded JSON string
 */
export function encodeRequirements(requirements) {
  return Buffer.from(JSON.stringify(requirements)).toString("base64");
}

/**
 * Send a 402 Payment Required response with proper x402 v2 headers.
 * 
 * @param {object} res - Express response object
 * @param {object} options - Same options as buildPaymentRequirements
 * @returns {void}
 */
export function paymentRequired(res, options) {
  const requirements = buildPaymentRequirements(options);
  res.status(402);
  res.setHeader("PAYMENT-REQUIRED", encodeRequirements(requirements));
  res.setHeader("Content-Type", "application/json");
  res.json({});
}

/**
 * Check if a request has an x402 payment header.
 * Checks both v2 (PAYMENT-SIGNATURE) and v1 (X-PAYMENT) headers.
 * 
 * @param {object} req - Express request object
 * @returns {string|null} The payment header value, or null
 */
export function getPaymentHeader(req) {
  return req.header("payment-signature") 
    || req.header("PAYMENT-SIGNATURE")
    || req.header("x-payment") 
    || req.header("X-PAYMENT")
    || null;
}

/**
 * Express middleware that gates an endpoint behind x402 payment.
 * 
 * If no payment header → sends 402 with requirements.
 * If payment header present → calls next() (allows request through).
 * 
 * NOTE: This does NOT verify payment on-chain. For testnet/development,
 * the presence of a signed payment header is accepted. For production,
 * use the Coinbase facilitator for verification + settlement.
 * 
 * @param {object} options
 * @param {number} options.price - Price in USD
 * @param {string} [options.network] - Network ID
 * @param {string} [options.payTo] - Wallet address
 * @param {string} [options.description] - What the payment is for
 * @param {boolean} [options.verify=false] - If true, verify via facilitator (requires network)
 * @returns {Function} Express middleware
 * 
 * @example
 *   app.get('/api/audit', createPaywall({ price: 0.03, description: 'Skill audit' }), handler);
 */
export function createPaywall(options) {
  return async (req, res, next) => {
    const payment = getPaymentHeader(req);
    
    if (!payment) {
      // No payment — send 402
      const reqOptions = {
        ...options,
        resource: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      };
      return paymentRequired(res, reqOptions);
    }
    
    // Payment header present
    if (options.verify) {
      // TODO: Verify via Coinbase facilitator
      // For now, log and accept
      console.warn("[x402] Payment verification not yet implemented — accepting signed payment");
    }
    
    // Attach payment info to request for downstream use
    req.x402Payment = payment;
    
    // Add settlement header to response when it finishes
    const originalEnd = res.end;
    res.end = function(...args) {
      // Mock settlement response (for testnet)
      res.setHeader("PAYMENT-RESPONSE", Buffer.from(JSON.stringify({
        success: true,
        network: options.network || "eip155:84532",
        transaction: "",
      })).toString("base64"));
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Get wallet address for receiving payments.
 * @returns {string} EVM address
 */
export function getPayToAddress() {
  if (!existsSync(WALLET_FILE)) {
    throw new Error("No wallet found. Run setup.sh first.");
  }
  return JSON.parse(readFileSync(WALLET_FILE, "utf-8")).address;
}
