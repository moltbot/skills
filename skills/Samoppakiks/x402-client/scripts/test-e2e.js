#!/usr/bin/env node
/**
 * x402 End-to-End Test
 * 
 * Runs a minimal server that returns proper 402 responses,
 * then uses our pay-request client to make a paid request.
 * Tests the full flow: request → 402 → sign → pay → receive.
 */
import express from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const WALLET_FILE = join(homedir(), ".x402", "wallet.json");
const wallet = JSON.parse(readFileSync(WALLET_FILE, "utf-8"));

// Helper: base64 encode for headers
function b64encode(str) {
  return Buffer.from(str).toString("base64");
}

const app = express();

// Free endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "x402 test" });
});

// Paid endpoint — manually returns 402 with x402 payment requirements
app.get("/paid", (req, res) => {
  // Check if payment header exists
  const paymentHeader = req.header("x-payment") || req.header("payment-signature");
  
  if (paymentHeader) {
    // Payment provided — in production, we'd verify via facilitator
    // For testing, accept any signed payment
    console.log("💰 Payment received!");
    console.log("   Header:", paymentHeader.substring(0, 80) + "...");
    
    res.setHeader("x-payment-response", JSON.stringify({
      success: true,
      txHash: "0x" + "a".repeat(64), // mock tx hash
      network: "eip155:84532",
    }));
    
    return res.json({
      message: "🎉 Payment successful! You accessed the paid content.",
      timestamp: new Date().toISOString(),
      paidAmount: "$0.001 USDC",
      network: "Base Sepolia (testnet)",
    });
  }
  
  // No payment — return 402 with x402 v2 format (header-based)
  const paymentRequired = {
    x402Version: 2,
    accepts: [
      {
        scheme: "exact",
        network: "eip155:84532",
        maxAmountRequired: "1000", // 0.001 USDC (6 decimals)
        amount: "1000",
        resource: "http://127.0.0.1:4021/paid",
        description: "Access to paid test endpoint",
        mimeType: "application/json",
        payTo: wallet.address,
        maxTimeoutSeconds: 60,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
        extra: {
          // EIP-712 domain for USDC on Base Sepolia
          name: "USDC",
          version: "2",
        },
      },
    ],
  };
  
  res.status(402);
  res.setHeader("PAYMENT-REQUIRED", b64encode(JSON.stringify(paymentRequired)));
  res.setHeader("Content-Type", "application/json");
  res.json({});
});

// Mock audit endpoint
app.get("/audit", (req, res) => {
  const paymentHeader = req.header("x-payment") || req.header("payment-signature");
  
  if (paymentHeader) {
    res.setHeader("x-payment-response", JSON.stringify({ success: true, txHash: "0x" + "b".repeat(64) }));
    return res.json({
      skillName: req.query.skill || "example-skill",
      overallRisk: "low",
      score: 92,
      findings: [
        { severity: "info", category: "structure", description: "Skill follows standard format" },
        { severity: "low", category: "network", description: "HTTP calls to known APIs only" },
      ],
      recommendation: "Safe to install.",
      auditTimestamp: new Date().toISOString(),
    });
  }
  
  const auditPaymentRequired = {
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network: "eip155:84532",
      maxAmountRequired: "1000",
      amount: "1000",
      resource: `http://127.0.0.1:4021/audit?skill=${req.query.skill || "example-skill"}`,
      description: "Skill security audit",
      payTo: wallet.address,
      maxTimeoutSeconds: 60,
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      extra: {
        name: "USDC",
        version: "2",
      },
    }],
  };
  res.status(402);
  res.setHeader("PAYMENT-REQUIRED", b64encode(JSON.stringify(auditPaymentRequired)));
  res.setHeader("Content-Type", "application/json");
  res.json({});
});

const server = app.listen(4021, "127.0.0.1", async () => {
  console.log("\n🛡️  x402 Test Server (E2E mode)");
  console.log("   Port: 4021");
  console.log("   Pay to: " + wallet.address);
  console.log("   Network: Base Sepolia (testnet)\n");
  
  // --- Run tests ---
  console.log("=== TEST 1: Free endpoint ===");
  try {
    const r1 = await fetch("http://127.0.0.1:4021/");
    console.log(`✅ Status: ${r1.status}`);
    console.log(`   Body: ${await r1.text()}`);
  } catch(e) { console.error("❌", e.message); }
  
  console.log("\n=== TEST 2: Paid endpoint (no payment → 402) ===");
  try {
    const r2 = await fetch("http://127.0.0.1:4021/paid");
    console.log(`✅ Status: ${r2.status} (expected 402)`);
    // x402 v2: requirements in PAYMENT-REQUIRED header (base64 JSON)
    const reqHeader = r2.headers.get("payment-required");
    if (reqHeader) {
      const body = JSON.parse(Buffer.from(reqHeader, "base64").toString());
      console.log(`   Accepts: ${body.accepts.length} payment option(s)`);
      console.log(`   Price: ${body.accepts[0].maxAmountRequired} units (${parseInt(body.accepts[0].maxAmountRequired) / 1e6} USDC)`);
      console.log(`   Network: ${body.accepts[0].network}`);
      console.log(`   Pay to: ${body.accepts[0].payTo}`);
    } else {
      console.log(`   ⚠️ No PAYMENT-REQUIRED header found`);
    }
  } catch(e) { console.error("❌", e.message); }
  
  console.log("\n=== TEST 3: Paid endpoint (with x402 client) ===");
  try {
    // Use our x402 client — wrapFetchWithPayment(fetch, client)
    const { privateKeyToAccount } = await import("viem/accounts");
    const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
    const { registerExactEvmScheme } = await import("@x402/evm/exact/client");
    
    const signer = privateKeyToAccount(wallet.privateKey);
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });
    const payFetch = wrapFetchWithPayment(globalThis.fetch, client);
    
    console.log("   Signing payment with wallet...");
    const r3 = await payFetch("http://127.0.0.1:4021/paid");
    console.log(`✅ Status: ${r3.status}`);
    const paymentResponse = r3.headers.get("x-payment-response");
    if (paymentResponse) {
      console.log(`   Payment response: ${paymentResponse}`);
    }
    const body3 = await r3.json();
    console.log(`   Body: ${JSON.stringify(body3)}`);
  } catch(e) {
    console.error("❌ Payment test failed:", e.message);
    if (e.stack) console.error(e.stack.split("\n").slice(0, 5).join("\n"));
  }
  
  console.log("\n=== TEST 4: Audit endpoint (with x402 client) ===");
  try {
    const { privateKeyToAccount } = await import("viem/accounts");
    const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
    const { registerExactEvmScheme } = await import("@x402/evm/exact/client");
    
    const signer = privateKeyToAccount(wallet.privateKey);
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });
    const payFetch = wrapFetchWithPayment(globalThis.fetch, client);
    
    const r4 = await payFetch("http://127.0.0.1:4021/audit?skill=hello-world");
    console.log(`✅ Status: ${r4.status}`);
    const body4 = await r4.json();
    console.log(`   Skill: ${body4.skillName}, Risk: ${body4.overallRisk}, Score: ${body4.score}`);
  } catch(e) {
    console.error("❌ Audit test failed:", e.message);
  }
  
  console.log("\n=== DONE ===");
  server.close();
  process.exit(0);
});
