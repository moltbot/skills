import PicnicClient from 'picnic-api';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.config', 'picnic', 'config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const client = new PicnicClient({ countryCode: config.countryCode || 'DE', authKey: config.authKey });

const delivery = await client.getDelivery('tmx2f3xiti');
console.log(JSON.stringify(delivery, null, 2));
