#!/usr/bin/env node
/**
 * x402 Pay Request — Make paid HTTP requests
 * 
 * Automatically handles HTTP 402 Payment Required responses:
 * 1. Makes initial request
 * 2. If 402, reads payment requirements
 * 3. Signs USDC payment from wallet
 * 4. Retries with payment header
 * 5. Returns response
 * 
 * Usage:
 *   node pay-request.js --url https://api.example.com/service
 *   node pay-request.js --url https://api.example.com/data --method POST --body '{"query":"test"}'
 *   node pay-request.js --url https://api.example.com/service --dry-run
 *   node pay-request.js --url https://api.example.com/service --max-price 0.50
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { parseArgs } from "util";

const WALLET_FILE = join(homedir(), ".x402", "wallet.json");

const NETWORKS = {
  base: "eip155:8453",
  "base-sepolia": "eip155:84532",
};

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      url: { type: "string" },
      method: { type: "string", default: "GET" },
      body: { type: "string" },
      network: { type: "string", default: "base" },
      "max-price": { type: "string", default: "1.00" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  return values;
}

async function main() {
  const args = parseCliArgs();

  if (args.help || !args.url) {
    console.error("Usage: pay-request.js --url <URL> [options]");
    console.error("");
    console.error("Options:");
    console.error("  --url <URL>           Service URL (required)");
    console.error("  --method <METHOD>     HTTP method (default: GET)");
    console.error("  --body <JSON>         Request body for POST/PUT");
    console.error("  --network <NETWORK>   base or base-sepolia (default: base)");
    console.error("  --max-price <USD>     Max payment in USD (default: 1.00)");
    console.error("  --dry-run             Show price without paying");
    process.exit(args.help ? 0 : 1);
  }

  if (!existsSync(WALLET_FILE)) {
    console.error("❌ No wallet found. Run setup.sh first.");
    process.exit(1);
  }

  const walletData = JSON.parse(readFileSync(WALLET_FILE, "utf-8"));
  const maxPrice = parseFloat(args["max-price"]);
  const networkId = NETWORKS[args.network] || args.network;

  console.error(`🌐 Requesting ${args.method} ${args.url}`);
  console.error(`   Network: ${args.network} (${networkId})`);
  console.error(`   Max price: $${maxPrice} USDC`);
  console.error("");

  try {
    // Dynamically import x402 (ES modules)
    const { privateKeyToAccount } = await import("viem/accounts");
    const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
    const { registerExactEvmScheme } = await import("@x402/evm/exact/client");

    // Create signer from wallet private key
    const signer = privateKeyToAccount(walletData.privateKey);

    // Create x402 client and register EVM payment scheme
    // NOTE: registerExactEvmScheme takes a config OBJECT with signer, not raw signer
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    // Wrap native fetch with x402 payment handling
    // NOTE: fetch is the FIRST arg, client is SECOND
    const payFetch = wrapFetchWithPayment(globalThis.fetch, client);

    // Step 1: Make initial request to check if payment is needed
    if (args["dry-run"]) {
      const response = await fetch(args.url, {
        method: args.method,
        headers: args.body ? { "Content-Type": "application/json" } : {},
        body: args.body,
      });

      if (response.status === 402) {
        // v2: requirements in PAYMENT-REQUIRED header (base64)
        const paymentHeader = response.headers.get("payment-required");
        // v1: requirements in body with x402Version: 1
        const body = await response.text();
        
        let requirements = null;
        if (paymentHeader) {
          try {
            requirements = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
            console.error("💰 Payment required (v2 header):");
          } catch { 
            requirements = JSON.parse(paymentHeader);
            console.error("💰 Payment required (v2 header, plain JSON):");
          }
        } else if (body) {
          try {
            const parsed = JSON.parse(body);
            if (parsed.x402Version === 1) {
              requirements = parsed;
              console.error("💰 Payment required (v1 body):");
            }
          } catch {}
        }
        
        if (requirements) {
          const accepts = requirements.accepts || [];
          for (const a of accepts) {
            const price = a.amount || a.maxAmountRequired || "?";
            const usd = parseInt(price) / 1e6;
            console.error(`   Price: $${usd} USDC`);
            console.error(`   Network: ${a.network}`);
            console.error(`   Pay to: ${a.payTo}`);
          }
          console.error("");
          console.error("Use without --dry-run to pay and access.");
        } else {
          console.error("💰 402 Payment Required (no structured requirements found)");
          if (body) console.error("   Body:", body.substring(0, 200));
        }
      } else {
        console.error(`ℹ️  No payment needed (status: ${response.status})`);
        const text = await response.text();
        console.log(text);
      }
      return;
    }

    // Step 2: Make paid request (x402 handles 402 automatically)
    const fetchOptions = {
      method: args.method,
      headers: {},
    };
    if (args.body) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = args.body;
    }

    console.error("💳 Making paid request...");
    const response = await payFetch(args.url, fetchOptions);

    if (response.ok) {
      const paymentResponse = response.headers.get("x-payment-response");
      if (paymentResponse) {
        console.error("✅ Payment successful!");
        try {
          const pr = JSON.parse(paymentResponse);
          if (pr.txHash) console.error(`   Tx: ${pr.txHash}`);
        } catch {}
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log(text);
      }
    } else {
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      process.exit(1);
    }
  } catch (error) {
    // If x402 packages aren't installed yet, give helpful error
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.error("❌ x402 packages not installed. Run setup.sh first:");
      console.error(`   cd ${join(homedir(), ".x402")} && bash setup.sh`);
      process.exit(1);
    }
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
