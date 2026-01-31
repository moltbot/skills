const fs = require('fs');
const { program } = require('commander');

// Hardcoded credentials from workspace config
const APP_ID = 'cli_a9f70f9a4a791bd1';
const APP_SECRET = 'icE0UBBVDPsbmSarZeSYUt1hdhYW7LOn';

async function getToken() {
    try {
        const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: APP_ID,
                app_secret: APP_SECRET
            })
        });
        const data = await res.json();
        if (!data.tenant_access_token) {
            throw new Error(`No token returned: ${JSON.stringify(data)}`);
        }
        return data.tenant_access_token;
    } catch (e) {
        console.error('Failed to get token:', e.message);
        process.exit(1);
    }
}

async function sendCard(options) {
    const token = await getToken();
    
    // Construct Card Elements
    const elements = [];
    
    let contentText = '';

    if (options.textFile) {
        try {
            contentText = fs.readFileSync(options.textFile, 'utf8');
        } catch (e) {
            console.error(`Failed to read file: ${options.textFile}`);
            process.exit(1);
        }
    } else if (options.text) {
        // Fix newline and escaped newline issues from CLI arguments
        contentText = options.text.replace(/\\n/g, '\n');
    }

    if (contentText) {
        elements.push({
            tag: 'div',
            text: {
                tag: 'lark_md',
                content: contentText
            }
        });
    }

    // Add Button if provided
    if (options.buttonText && options.buttonUrl) {
        elements.push({
            tag: 'action',
            actions: [
                {
                    tag: 'button',
                    text: {
                        tag: 'plain_text',
                        content: options.buttonText
                    },
                    type: 'primary',
                    multi_url: {
                        url: options.buttonUrl,
                        pc_url: '',
                        android_url: '',
                        ios_url: ''
                    }
                }
            ]
        });
    }

    // Construct Card Object
    const cardContent = { elements };

    // Add Header if title is provided
    if (options.title) {
        cardContent.header = {
            title: {
                tag: 'plain_text',
                content: options.title
            },
            template: options.color || 'blue' // blue, wathet, turquoise, green, yellow, orange, red, carmine, violet, purple, indigo, grey
        };
    }

    // Interactive Message Body
    const messageBody = {
        receive_id: options.target,
        msg_type: 'interactive',
        content: JSON.stringify(cardContent)
    };

    console.log('Sending payload:', JSON.stringify(messageBody, null, 2));

    try {
        const res = await fetch(
            'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody)
            }
        );
        const data = await res.json();
        
        if (data.code !== 0) {
             console.error('Feishu API Error:', JSON.stringify(data, null, 2));
             process.exit(1);
        }
        
        console.log('Success:', JSON.stringify(data.data, null, 2));

    } catch (e) {
        console.error('Network Error:', e.message);
        process.exit(1);
    }
}

program
  .requiredOption('-t, --target <open_id>', 'Target User Open ID')
  .option('-x, --text <markdown>', 'Card body text (Markdown)')
  .option('-f, --text-file <path>', 'Read card body text from file (bypasses shell escaping)')
  .option('--title <text>', 'Card header title')
  .option('--color <color>', 'Header color (blue/red/orange/purple/etc)', 'blue')
  .option('--button-text <text>', 'Bottom button text')
  .option('--button-url <url>', 'Bottom button URL');

program.parse(process.argv);
const options = program.opts();

if (!options.text && !options.textFile) {
    console.error('Error: Either --text or --text-file must be provided.');
    process.exit(1);
}

sendCard(options);
