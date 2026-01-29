#!/usr/bin/env node
/**
 * stock-quote.js
 * Fetches quotes from Yahoo Finance and prints normalized JSON.
 *
 * Usage:
 *   node stock-quote.js AAPL MSFT
 *   node stock-quote.js "AAPL,MSFT,TSLA"
 *   node stock-quote.js '{"symbols":["AAPL","MSFT"]}'
 */

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";

function parseSymbols(argv) {
  if (!argv.length) return [];

  const first = argv[0].trim();

  // JSON mode: first arg is object/array
  if (first.startsWith("{") || first.startsWith("[")) {
    const parsed = JSON.parse(first);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (parsed && parsed.symbols) {
      return Array.isArray(parsed.symbols) ? parsed.symbols.map(String) : [String(parsed.symbols)];
    }
    return [];
  }

  // args mode
  const joined = argv.join(" ");
  return joined
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function n(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

async function main() {
  const symbols = parseSymbols(process.argv.slice(2));
  if (!symbols.length) {
    console.error(
      JSON.stringify(
        {
          error: "Missing symbols",
          usage: [
            "node stock-quote.js AAPL",
            "node stock-quote.js AAPL MSFT TSLA",
            'node stock-quote.js \'{"symbols":["AAPL","MSFT"]}\''
          ]
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const url = new URL(YAHOO_QUOTE_URL);
  url.searchParams.set("symbols", symbols.join(","));

  const res = await fetch(url.toString(), {
    headers: {
      // helps avoid some edge cases with certain environments
      "User-Agent": "clawdbot-stock-quote/1.0"
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(JSON.stringify({ error: "Yahoo request failed", status: res.status, body: text.slice(0, 500) }, null, 2));
    process.exit(1);
  }

  const data = await res.json();
  const results = data?.quoteResponse?.result || [];

  // Normalize output to your SKILL.md schema
  const out = results.map(q => ({
    symbol: q?.symbol ?? null,
    price: n(q?.regularMarketPrice),
    change: n(q?.regularMarketChange),
    changePercent: n(q?.regularMarketChangePercent),
    currency: q?.currency ?? null,
    marketState: q?.marketState ?? null
  }));

  // If some requested symbols weren't returned, include placeholders
  const returned = new Set(out.map(x => x.symbol).filter(Boolean));
  for (const s of symbols) {
    if (!returned.has(s)) {
      out.push({
        symbol: s,
        price: null,
        change: null,
        changePercent: null,
        currency: null,
        marketState: null
      });
    }
  }

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch(err => {
  console.error(JSON.stringify({ error: String(err?.message || err), stack: err?.stack }, null, 2));
  process.exit(1);
});