#!/usr/bin/env node
/**
 * Clawdbot Cost Calculator
 * 
 * Calculates daily API cost by comparing consecutive usage snapshots.
 * Compares today's snapshot with yesterday's to determine token delta.
 * 
 * Usage:
 *   node calculate-cost.js [date] [usage-dir]
 * 
 * Arguments:
 *   date      - Target date (YYYY-MM-DD), defaults to today
 *   usage-dir - Directory containing snapshots, defaults to ~/clawd/memory/usage
 * 
 * Examples:
 *   node calculate-cost.js                    # Today's cost
 *   node calculate-cost.js 2026-01-29         # Specific date
 *   node calculate-cost.js 2026-01-29 ./usage # Custom directory
 * 
 * Output:
 *   JSON object with token counts, deltas, and estimated costs
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
 * Get date string for N days ago
 * @param {number} daysAgo - Number of days in the past (0 = today)
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/**
 * Load a usage snapshot from disk
 * @param {string} usageDir - Directory containing snapshots
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {object|null} Snapshot data or null if not found
 */
function loadSnapshot(usageDir, date) {
  const filePath = path.join(usageDir, `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * Get the previous day's date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Previous day's date string
 */
function getPreviousDate(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Estimate cost for a given number of tokens and model
 * @param {number} tokens - Token count
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
 * Format token count for human readability
 * @param {number} tokens - Token count
 * @returns {string} Formatted string (e.g., "45.2k", "1.5M")
 */
function formatTokens(tokens) {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return tokens.toString();
}

/**
 * Main function - calculates cost for the target date
 */
function main() {
  const targetDate = process.argv[2] || getDateString();
  const usageDir = process.argv[3] || path.join(process.env.HOME, 'clawd/memory/usage');
  
  // Load today's and yesterday's snapshots
  const today = loadSnapshot(usageDir, targetDate);
  const prevDate = getPreviousDate(targetDate);
  const yesterday = loadSnapshot(usageDir, prevDate);
  
  // Validate that we have today's data
  if (!today) {
    console.log(JSON.stringify({
      status: 'error',
      error: `No snapshot found for ${targetDate}`,
      hint: 'Run snapshot-usage.js first to create a snapshot'
    }, null, 2));
    process.exit(1);
  }
  
  // Initialize result structure
  const result = {
    date: targetDate,
    previousDate: yesterday ? prevDate : null,
    tokens: {
      total: today.summary?.totalTokens || 0,
      delta: 0,
      byModel: {}
    },
    cost: {
      estimated: 0,
      byModel: {}
    },
    formatted: {}
  };
  
  // Get token counts by model
  const todayByModel = today.summary?.byModel || {};
  const yesterdayByModel = yesterday?.summary?.byModel || {};
  
  // Calculate totals and deltas for each model
  for (const [model, tokens] of Object.entries(todayByModel)) {
    const prevTokens = yesterdayByModel[model] || 0;
    const delta = tokens - prevTokens;
    
    result.tokens.byModel[model] = {
      total: tokens,
      previous: prevTokens,
      delta: delta
    };
    
    result.tokens.delta += delta;
    
    // Calculate cost only for positive deltas
    if (delta > 0) {
      const cost = estimateCost(delta, model);
      result.cost.byModel[model] = Math.round(cost * 100) / 100;
      result.cost.estimated += cost;
    }
  }
  
  result.cost.estimated = Math.round(result.cost.estimated * 100) / 100;
  
  // Create human-readable formatted output
  result.formatted = {
    tokens: formatTokens(result.tokens.delta),
    cost: `$${result.cost.estimated.toFixed(2)}`,
    summary: `${formatTokens(result.tokens.delta)} tokens (~$${result.cost.estimated.toFixed(2)})`
  };
  
  // Handle case where no previous snapshot exists (cumulative mode)
  if (!yesterday) {
    result.note = 'No previous snapshot - showing cumulative totals';
    result.cost.estimated = today.estimatedCost?.totalUSD || result.cost.estimated;
    result.formatted.cost = `$${result.cost.estimated.toFixed(2)}`;
    result.formatted.summary = `${formatTokens(result.tokens.total)} tokens (~$${result.cost.estimated.toFixed(2)}) [cumulative]`;
  }
  
  console.log(JSON.stringify(result, null, 2));
}

main();
