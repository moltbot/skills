#!/usr/bin/env node
/**
 * x402 Bazaar Discovery CLI
 * 
 * Query the x402 Bazaar to discover paid API endpoints.
 * 
 * Usage:
 *   node bazaar.js list [--limit N]
 *   node bazaar.js search <query>
 *   node bazaar.js info <url>
 */

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

async function listResources(limit = 20) {
  const url = `${FACILITATOR_URL}/discovery/resources?type=http&limit=${limit}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.resources || data.resources.length === 0) {
      console.log('No x402 services found in the Bazaar.');
      return;
    }
    
    console.log(`\n📦 Found ${data.resources.length} x402 services:\n`);
    
    for (const resource of data.resources) {
      const accepts = resource.accepts?.[0] || {};
      const price = accepts.price || accepts.maxAmountRequired || 'N/A';
      const network = accepts.network || 'unknown';
      
      console.log(`  🔗 ${resource.resource}`);
      console.log(`     💰 Price: ${price}`);
      console.log(`     🌐 Network: ${network}`);
      if (resource.description) {
        console.log(`     📝 ${resource.description}`);
      }
      console.log('');
    }
    
    return data.resources;
  } catch (error) {
    console.error(`Error querying Bazaar: ${error.message}`);
    process.exit(1);
  }
}

async function getResourceInfo(resourceUrl) {
  const url = `${FACILITATOR_URL}/discovery/resources?resource=${encodeURIComponent(resourceUrl)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error fetching resource info: ${error.message}`);
    process.exit(1);
  }
}

// Alternative: Query CDP facilitator directly
async function listFromCDP(limit = 20) {
  const url = `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=${limit}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Fall back to x402.org
      console.log('CDP facilitator unavailable, trying x402.org...');
      return listResources(limit);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('CDP facilitator unavailable, trying x402.org...');
    return listResources(limit);
  }
}

// Main CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    const limit = args.includes('--limit') 
      ? parseInt(args[args.indexOf('--limit') + 1]) 
      : 20;
    listResources(limit);
    break;
    
  case 'search':
    const query = args[1];
    if (!query) {
      console.error('Usage: bazaar.js search <query>');
      process.exit(1);
    }
    // Search is just filtered list for now
    listResources(50).then(resources => {
      if (resources) {
        const filtered = resources.filter(r => 
          r.resource.toLowerCase().includes(query.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(query.toLowerCase()))
        );
        if (filtered.length === 0) {
          console.log(`No services matching "${query}" found.`);
        }
      }
    });
    break;
    
  case 'info':
    const resourceUrl = args[1];
    if (!resourceUrl) {
      console.error('Usage: bazaar.js info <url>');
      process.exit(1);
    }
    getResourceInfo(resourceUrl);
    break;
    
  default:
    console.log(`
x402 Bazaar Discovery CLI

Commands:
  list [--limit N]    List available x402 services (default: 20)
  search <query>      Search services by keyword
  info <url>          Get detailed info about a specific endpoint

Environment:
  X402_FACILITATOR_URL   Override facilitator URL (default: https://x402.org/facilitator)

Examples:
  node bazaar.js list --limit 50
  node bazaar.js search weather
  node bazaar.js info https://api.example.com/x402/data
    `);
}
