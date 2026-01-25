#!/usr/bin/env node
/**
 * Polymarket CLI - Query prediction market odds
 * 
 * Usage:
 *   polymarket search <query>      - Search for markets by keyword
 *   polymarket events [options]    - List events with filters
 *   polymarket market <slug>       - Get market details and current odds
 *   polymarket sports              - List sports leagues/series
 *   polymarket tags                - List available categories
 *   polymarket price <token_id>    - Get current price for a token
 */

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

function parsePrice(pricesStr) {
  try {
    const prices = JSON.parse(pricesStr);
    return prices.map(p => (parseFloat(p) * 100).toFixed(1) + '%');
  } catch {
    return [];
  }
}

function parseOutcomes(outcomesStr) {
  try {
    return JSON.parse(outcomesStr);
  } catch {
    return [];
  }
}

function formatMarket(market, verbose = false) {
  const outcomes = parseOutcomes(market.outcomes);
  const prices = parsePrice(market.outcomePrices);
  const odds = outcomes.map((o, i) => `${o}: ${prices[i] || '?'}`).join(' | ');
  
  let out = `📊 ${market.question}\n`;
  out += `   ${odds}\n`;
  out += `   Volume: $${(market.volumeNum || 0).toLocaleString()}`;
  if (market.liquidity) out += ` | Liquidity: $${parseFloat(market.liquidity).toLocaleString()}`;
  if (verbose) {
    out += `\n   Slug: ${market.slug}`;
    if (market.endDate) out += `\n   Ends: ${market.endDate.split('T')[0]}`;
  }
  return out;
}

function formatEvent(event, verbose = false) {
  let out = `\n🎯 ${event.title}\n`;
  if (event.description && verbose) {
    out += `   ${event.description.slice(0, 200)}${event.description.length > 200 ? '...' : ''}\n`;
  }
  out += `   Volume: $${(event.volume || 0).toLocaleString()}`;
  if (event.liquidity) out += ` | Liquidity: $${parseFloat(event.liquidity).toLocaleString()}`;
  out += '\n';
  
  if (event.markets && event.markets.length > 0) {
    for (const m of event.markets.slice(0, 5)) {
      if (m.active && !m.closed) {
        out += formatMarket(m, verbose) + '\n';
      }
    }
    if (event.markets.length > 5) {
      out += `   ... and ${event.markets.length - 5} more markets\n`;
    }
  }
  return out;
}

async function search(query, limit = 10) {
  // Use the public-search endpoint for efficient keyword search
  const url = `${GAMMA_API}/public-search?q=${encodeURIComponent(query)}&limit=50`;
  const data = await fetchJSON(url);
  
  if (!data.events || data.events.length === 0) {
    console.log(`No markets found for "${query}"`);
    return;
  }
  
  // Filter to only active, non-closed events
  const matches = data.events.filter(e => e.active && !e.closed).slice(0, limit);
  
  if (matches.length === 0) {
    console.log(`No active markets found for "${query}"`);
    return;
  }
  
  console.log(`Found ${matches.length} active events matching "${query}":\n`);
  for (const event of matches) {
    console.log(formatEvent(event, true));
  }
}

async function listEvents(options = {}) {
  const params = new URLSearchParams();
  params.set('active', 'true');
  params.set('closed', 'false');
  params.set('limit', options.limit || '20');
  
  if (options.tag) params.set('tag_slug', options.tag);
  if (options.series) params.set('series_id', options.series);
  if (options.order) params.set('order', options.order);
  
  const url = `${GAMMA_API}/events?${params}`;
  const events = await fetchJSON(url);
  
  console.log(`Active events (${events.length}):\n`);
  for (const event of events) {
    console.log(formatEvent(event));
  }
}

async function getMarket(slugOrId) {
  const url = `${GAMMA_API}/markets?slug=${encodeURIComponent(slugOrId)}`;
  const markets = await fetchJSON(url);
  
  if (!markets || markets.length === 0) {
    // Try by ID
    const byIdUrl = `${GAMMA_API}/markets/${slugOrId}`;
    try {
      const market = await fetchJSON(byIdUrl);
      console.log(formatMarket(market, true));
      return;
    } catch {
      console.log(`Market not found: ${slugOrId}`);
      return;
    }
  }
  
  for (const market of markets) {
    console.log(formatMarket(market, true));
    console.log();
  }
}

async function listSports() {
  const url = `${GAMMA_API}/sports`;
  try {
    const sports = await fetchJSON(url);
    console.log('Sports leagues:\n');
    for (const sport of sports.slice(0, 30)) {
      console.log(`  ${sport.label || sport.title} (series_id: ${sport.id})`);
    }
  } catch (e) {
    console.log('Sports endpoint not available or empty');
  }
}

async function listTags(limit = 50) {
  const url = `${GAMMA_API}/tags?limit=${limit}`;
  const tags = await fetchJSON(url);
  
  console.log('Available categories:\n');
  for (const tag of tags) {
    console.log(`  ${tag.label} (slug: ${tag.slug})`);
  }
}

async function getPrice(tokenId, side = 'buy') {
  const url = `${CLOB_API}/price?token_id=${tokenId}&side=${side}`;
  try {
    const data = await fetchJSON(url);
    console.log(`Price (${side}): ${(parseFloat(data.price) * 100).toFixed(1)}%`);
  } catch (e) {
    console.log(`Error fetching price: ${e.message}`);
  }
}

async function getOrderbook(tokenId) {
  const url = `${CLOB_API}/book?token_id=${tokenId}`;
  try {
    const data = await fetchJSON(url);
    console.log('Orderbook:');
    console.log('  Bids:', data.bids?.slice(0, 5).map(b => `${(parseFloat(b.price)*100).toFixed(1)}% x $${b.size}`).join(', ') || 'none');
    console.log('  Asks:', data.asks?.slice(0, 5).map(a => `${(parseFloat(a.price)*100).toFixed(1)}% x $${a.size}`).join(', ') || 'none');
  } catch (e) {
    console.log(`Error fetching orderbook: ${e.message}`);
  }
}

// Main
const [,, cmd, ...args] = process.argv;

(async () => {
  try {
    switch (cmd) {
      case 'search':
      case 's':
        if (!args[0]) {
          console.log('Usage: polymarket search <query>');
          process.exit(1);
        }
        await search(args.join(' '), parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10);
        break;
        
      case 'events':
      case 'e':
        const evtOpts = {};
        for (const arg of args) {
          if (arg.startsWith('--tag=')) evtOpts.tag = arg.split('=')[1];
          if (arg.startsWith('--series=')) evtOpts.series = arg.split('=')[1];
          if (arg.startsWith('--limit=')) evtOpts.limit = arg.split('=')[1];
          if (arg.startsWith('--order=')) evtOpts.order = arg.split('=')[1];
        }
        await listEvents(evtOpts);
        break;
        
      case 'market':
      case 'm':
        if (!args[0]) {
          console.log('Usage: polymarket market <slug>');
          process.exit(1);
        }
        await getMarket(args[0]);
        break;
        
      case 'sports':
        await listSports();
        break;
        
      case 'tags':
      case 't':
        await listTags(parseInt(args[0]) || 50);
        break;
        
      case 'price':
      case 'p':
        if (!args[0]) {
          console.log('Usage: polymarket price <token_id> [buy|sell]');
          process.exit(1);
        }
        await getPrice(args[0], args[1] || 'buy');
        break;
        
      case 'book':
      case 'b':
        if (!args[0]) {
          console.log('Usage: polymarket book <token_id>');
          process.exit(1);
        }
        await getOrderbook(args[0]);
        break;
        
      default:
        console.log(`Polymarket CLI - Query prediction market odds

Commands:
  search <query>      Search markets by keyword
  events [options]    List active events
    --tag=<slug>      Filter by category (crypto, politics, sports, etc.)
    --limit=<n>       Max results (default: 20)
  market <slug>       Get market details and current odds
  sports              List sports leagues
  tags                List available categories
  price <token_id>    Get current price for a token
  book <token_id>     Get orderbook for a token

Examples:
  polymarket search "super bowl"
  polymarket search "bitcoin 100k"
  polymarket events --tag=crypto --limit=10
  polymarket market will-bitcoin-reach-100k
`);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
