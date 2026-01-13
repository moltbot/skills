#!/usr/bin/env node
const https = require('https');
const { URL } = require('url');

const API_KEY = process.env.PARCEL_API_KEY;
const BASE_URL = "https://api.parcel.app/external";

if (!API_KEY) {
  console.error("Error: PARCEL_API_KEY environment variable is not set.");
  console.error("Please set it with your Parcel API key (see web.parcelapp.net).");
  process.exit(1);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      method,
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function listDeliveries(mode = 'recent') {
  try {
    const res = await request('GET', `/deliveries/?filter_mode=${mode}`);
    if (!res.success) {
      console.error("Error:", res.error_message);
      process.exit(1);
    }

    if (!res.deliveries || res.deliveries.length === 0) {
      console.log("No deliveries found.");
      return;
    }

    // Format output
    // Description (Carrier) - Status
    // Tracking: ...
    // Expected: ...
    // Last Event: ...
    res.deliveries.forEach(d => {
      console.log(`📦 ${d.description} (${d.carrier_code})`);
      console.log(`   Status Code: ${d.status_code} | Tracking: ${d.tracking_number}`);
      if (d.date_expected) console.log(`   Expected: ${d.date_expected}`);
      
      if (d.events && d.events.length > 0) {
        const lastEvent = d.events[0]; // Assuming sorted? Docs say "Delivery events"
        console.log(`   Latest: ${lastEvent.date} - ${lastEvent.event} @ ${lastEvent.location || 'Unknown'}`);
      }
      console.log("");
    });

  } catch (err) {
    console.error("Request failed:", err.message);
    process.exit(1);
  }
}

async function addDelivery(tracking, carrier, description, notify) {
  try {
    const body = {
      tracking_number: tracking,
      carrier_code: carrier,
      description: description,
      send_push_confirmation: notify === 'true'
    };
    
    const res = await request('POST', '/add-delivery/', body);
    if (!res.success) {
      console.error("Error adding delivery:", res.error_message);
      process.exit(1);
    }
    
    console.log("✅ Delivery added successfully!");
  } catch (err) {
    console.error("Request failed:", err.message);
    process.exit(1);
  }
}

async function listCarriers(search = '') {
  try {
    // This is a static JSON file, so we can just fetch it
    const url = "https://api.parcel.app/external/supported_carriers.json";
    const res = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
    
    // The structure is an object: { "code": "Name", ... }
    
    let carriersObj = res;
    // Convert to array of {code, name}
    let carriers = Object.keys(carriersObj).map(key => ({
        code: key,
        name: carriersObj[key]
    }));

    if (search) {
        const lowerSearch = search.toLowerCase();
        carriers = carriers.filter(c => 
            c.code.toLowerCase().includes(lowerSearch) || 
            c.name.toLowerCase().includes(lowerSearch)
        );
    }
    
    carriers.forEach(c => {
        console.log(`${c.code}: ${c.name}`);
    });
    
  } catch (err) {
    console.error("Failed to fetch carriers:", err.message);
  }
}

// CLI Args parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'recent';
  listDeliveries(mode);
} else if (command === 'add') {
    // quick/dirty arg parsing
    const tracking = args[args.indexOf('--tracking') + 1];
    const carrier = args[args.indexOf('--carrier') + 1];
    const description = args[args.indexOf('--description') + 1];
    const notify = args.includes('--notify') ? 'true' : 'false';

    if (!tracking || !carrier || !description) {
        console.error("Usage: parcel-api add --tracking <num> --carrier <code> --description <desc> [--notify]");
        process.exit(1);
    }
    addDelivery(tracking, carrier, description, notify);
} else if (command === 'carriers') {
    const search = args[1];
    listCarriers(search);
} else {
  console.log("Usage: parcel-api <command> [args]");
  console.log("Commands:");
  console.log("  list [--mode=<active|recent>]");
  console.log("  add --tracking <num> --carrier <code> --description <desc> [--notify]");
  console.log("  carriers [search]");
}
