const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// CONFIGURATION
// Load from local .env file if present
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim().replace(/['"]/g, '');
        });
    }
} catch (e) {}

const CLIENT_ID = process.env.WITHINGS_CLIENT_ID;
const CLIENT_SECRET = process.env.WITHINGS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8080'; // Must match your Withings app config
const TOKEN_FILE = path.join(__dirname, 'tokens.json');

// --- UTILITY FUNCTIONS ---

function saveTokens(data) {
    // Calculate expiration (expires_in is in seconds)
    const expiry = Date.now() + (data.expires_in * 1000);
    const payload = { ...data, expiry_date: expiry };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2));
    return payload;
}

function postRequest(endpoint, params) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify(params);
        const options = {
            hostname: 'wbsapi.withings.net',
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status !== 0) reject(`API Error Status: ${json.status} - ${JSON.stringify(json)}`);
                    else resolve(json.body);
                } catch (e) { reject(e); }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function getValidToken() {
    if (!fs.existsSync(TOKEN_FILE)) {
        throw new Error("No token found. Run first: node wrapper.js auth");
    }

    let tokens = JSON.parse(fs.readFileSync(TOKEN_FILE));

    // Refresh if token expires in less than 60 seconds
    if (Date.now() > (tokens.expiry_date - 60000)) {
        console.error("Token expired, refreshing...");
        try {
            const newTokens = await postRequest('/v2/oauth2', {
                action: 'requesttoken',
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: tokens.refresh_token
            });
            tokens = saveTokens(newTokens);
        } catch (e) {
            throw new Error(`Failed to refresh token: ${e}`);
        }
    }
    return tokens.access_token;
}

// --- COMMANDS ---

async function auth(code) {
    if (!code) {
        const url = `https://account.withings.com/oauth2_user/authorize2?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user.metrics,user.activity&state=init`;
        console.log("\n=== AUTHENTICATION REQUIRED ===");
        console.log("1. Open this link in your browser:");
        console.log(url);
        console.log("\n2. After login, you'll be redirected to an error page (this is normal).");
        console.log("3. Copy the code from the URL (e.g., ?code=my_code&...)");
        console.log("4. Run: node wrapper.js auth YOUR_CODE_HERE\n");
        return;
    }

    try {
        const tokens = await postRequest('/v2/oauth2', {
            action: 'requesttoken',
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI
        });
        saveTokens(tokens);
        console.log("Authentication successful! Tokens saved.");
    } catch (e) {
        console.error("Authentication error:", e);
    }
}

async function getWeight() {
    try {
        const token = await getValidToken();
        const data = await postRequest('/measure', {
            action: 'getmeas',
            access_token: token,
            meastype: 1, // 1 = Weight
            category: 1
        });
        
        // Withings returns raw values with a power of 10 (unit)
        const measures = data.measuregrps.map(grp => {
            const date = new Date(grp.date * 1000).toISOString();
            const meas = grp.measures.find(m => m.type === 1);
            const weight = meas.value * Math.pow(10, meas.unit);
            return { date, weight: weight.toFixed(2) + ' kg' };
        });

        console.log(JSON.stringify(measures.slice(0, 5), null, 2)); // Last 5 entries
    } catch (e) {
        console.error(e.message);
    }
}

// --- MAIN ---
const args = process.argv.slice(2);
const command = args[0];

if (command === 'auth') auth(args[1]);
else if (command === 'weight') getWeight();
else console.log("Commands: auth, weight");
