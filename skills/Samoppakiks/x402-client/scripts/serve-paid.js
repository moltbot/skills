#!/usr/bin/env node
/**
 * serve-paid.js — Run a paywalled API server using x402
 * 
 * A ready-to-customize template for any agent to sell services.
 * Uses lib/server.js for the x402 plumbing — you just define routes + handlers.
 * 
 * Usage:
 *   node scripts/serve-paid.js [--port 4021] [--network base-sepolia|base]
 * 
 * Example:
 *   node scripts/serve-paid.js --port 8080 --network base
 */
import express from "express";
import { parseArgs } from "util";
import { createPaywall, getPayToAddress } from "../lib/server.js";

// --- CLI args ---
const { values: args } = parseArgs({
  options: {
    port: { type: "string", default: "4021" },
    network: { type: "string", default: "base-sepolia" },
  },
});

const port = parseInt(args.port);
const networkId = args.network === "base" ? "eip155:8453" : "eip155:84532";
const networkLabel = args.network === "base" ? "Base (mainnet)" : "Base Sepolia (testnet)";

// Verify wallet exists
let payTo;
try {
  payTo = getPayToAddress();
} catch (e) {
  console.error("❌ " + e.message);
  process.exit(1);
}

// --- App ---
const app = express();
app.use(express.json());

// ┌─────────────────────────────────────────────┐
// │  CUSTOMIZE BELOW — Add your own endpoints   │
// └─────────────────────────────────────────────┘

// Free: health check / service info
app.get("/", (req, res) => {
  res.json({
    service: "My x402 Service",
    network: networkLabel,
    payTo,
    endpoints: {
      "/": "Free — service info",
      "/api/example": "$0.01 USDC — example paid endpoint",
    },
  });
});

// Paid: example endpoint ($0.01 USDC)
app.get("/api/example",
  createPaywall({ price: 0.01, network: networkId, description: "Example paid endpoint" }),
  (req, res) => {
    // Your logic here — this only runs after payment
    res.json({
      message: "🎉 Payment received! Here's your content.",
      timestamp: new Date().toISOString(),
    });
  }
);

// Paid: example POST endpoint ($0.05 USDC)
app.post("/api/analyze",
  createPaywall({ price: 0.05, network: networkId, description: "Content analysis" }),
  (req, res) => {
    const input = req.body;
    // Your analysis logic here
    res.json({
      input: Object.keys(input),
      result: "Analysis complete",
      score: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
    });
  }
);

// ┌─────────────────────────────────────────────┐
// │  END CUSTOMIZATION                          │
// └─────────────────────────────────────────────┘

app.listen(port, () => {
  console.log(`
🛡️  x402 Paid Service
   Port:    ${port}
   Network: ${networkLabel}
   Pay to:  ${payTo}

   Free:    http://localhost:${port}/
   Paid:    http://localhost:${port}/api/example
   Paid:    http://localhost:${port}/api/analyze (POST)

   Test: node scripts/pay-request.js --url http://localhost:${port}/api/example --network ${args.network}
`);
});
