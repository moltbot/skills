#!/usr/bin/env node
/**
 * Clawdbot Usage Snapshot
 * 
 * Creates a daily snapshot of token usage from Clawdbot sessions.
 * Reads session data from stdin (JSON format from sessions_list).
 * 
 * Usage:
 *   cat sessions.json | node snapshot-usage.js [output-dir]
 *   node snapshot-usage.js [output-dir] < sessions.json
 * 
 * Output:
 *   Creates memory/usage/YYYY-MM-DD.json with usage data
 * 
 * @author Clawdbot
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

// Model pricing in USD per million tokens
// Based on public API pricing as of 2026-01
const MODEL_PRICING = {
  'claude-opus-4-5': { input: 15, output: 75, avgRatio: 0.3 },
  'claude-sonnet-4': { input: 3, output: 15, avgRatio: 0.3 },
  'codex-mini-latest': { input: 1, output: 5, avgRatio: 0.3 },
  'gpt-4o': { input: 2.5, output: 10, avgRatio: 0.3 },
  'gpt-4o-mini': { input: 0.15, output: 0.6, avgRatio: 0.3 },
};

/**
 * Get current date as YYYY-MM-DD string
 * @returns {string} Date string
 */
function getDateString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Estimate cost for a given number of tokens and model
 * Assumes 30% input tokens, 70% output tokens (typical for chat)
 * 
 * @param {number} tokens - Total token count
 * @param {string} model - Model identifier
 * @returns {number} Estimated cost in USD
 */
function estimateCost(tokens, model) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4'];
  const inputTokens = tokens * pricing.avgRatio;
  const outputTokens = tokens * (1 - pricing.avgRatio);
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

/**
 * Main function - reads session data and creates usage snapshot
 */
async function main() {
  let input = '';
  
  // Check if running interactively (no piped input)
  if (process.stdin.isTTY) {
    console.error('Usage: cat sessions.json | node snapshot-usage.js [output-dir]');
    console.error('Or: node snapshot-usage.js [output-dir] < sessions.json');
    process.exit(1);
  }
  
  // Read JSON from stdin
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  
  const data = JSON.parse(input);
  const sessions = data.sessions || [];
  
  // Initialize snapshot structure
  const snapshot = {
    date: getDateString(),
    timestamp: getTimestamp(),
    sessions: {},
    summary: {
      totalTokens: 0,
      byModel: {}
    },
    estimatedCost: {}
  };
  
  // Process each session and aggregate data
  for (const session of sessions) {
    const key = session.key;
    const model = session.model || 'unknown';
    const tokens = session.totalTokens || 0;
    
    snapshot.sessions[key] = {
      model,
      totalTokens: tokens,
      channel: session.channel || 'unknown'
    };
    
    snapshot.summary.totalTokens += tokens;
    snapshot.summary.byModel[model] = (snapshot.summary.byModel[model] || 0) + tokens;
  }
  
  // Calculate estimated costs per model
  let totalCost = 0;
  for (const [model, tokens] of Object.entries(snapshot.summary.byModel)) {
    const cost = estimateCost(tokens, model);
    snapshot.estimatedCost[model] = {
      tokens,
      estimatedUSD: Math.round(cost * 100) / 100
    };
    totalCost += cost;
  }
  snapshot.estimatedCost.totalUSD = Math.round(totalCost * 100) / 100;
  
  // Determine output path
  const outputDir = process.argv[2] || path.join(process.env.HOME, 'clawd/memory/usage');
  const outputFile = path.join(outputDir, `${snapshot.date}.json`);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Write snapshot to file
  fs.writeFileSync(outputFile, JSON.stringify(snapshot, null, 2));
  
  // Output result summary
  console.log(JSON.stringify({
    status: 'ok',
    file: outputFile,
    summary: snapshot.summary,
    estimatedCost: snapshot.estimatedCost
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
