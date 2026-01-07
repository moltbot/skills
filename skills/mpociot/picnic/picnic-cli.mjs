#!/usr/bin/env node
/**
 * Picnic CLI - Wrapper for the picnic-api npm package
 * Usage: node picnic-cli.mjs <command> [args]
 */

import PicnicClient from 'picnic-api';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.config', 'picnic', 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function saveConfig(config) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

function getClient() {
  const config = loadConfig();
  if (!config.authKey) {
    console.error(JSON.stringify({ error: 'Not logged in. Run: picnic login <email> <password>' }));
    process.exit(1);
  }
  return new PicnicClient({
    countryCode: config.countryCode || 'DE',
    authKey: config.authKey
  });
}

function output(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'login': {
        const [email, password, countryCode = 'DE'] = args;
        if (!email || !password) {
          output({ error: 'Usage: picnic login <email> <password> [countryCode=DE]' });
          process.exit(1);
        }
        const client = new PicnicClient({ countryCode });
        const result = await client.login(email, password);
        
        if (result.second_factor_authentication_required) {
          // Save partial config, user needs to verify 2FA
          saveConfig({ 
            authKey: result.authKey, 
            countryCode,
            needs2FA: true 
          });
          output({ 
            status: '2fa_required',
            message: 'Two-factor authentication required. Run: picnic verify-2fa <code>',
            authKey: result.authKey
          });
        } else {
          saveConfig({ authKey: result.authKey, countryCode });
          output({ status: 'ok', message: 'Logged in successfully' });
        }
        break;
      }

      case 'verify-2fa': {
        const [code] = args;
        if (!code) {
          output({ error: 'Usage: picnic verify-2fa <code>' });
          process.exit(1);
        }
        const client = getClient();
        const result = await client.verify2FACode(code);
        const config = loadConfig();
        delete config.needs2FA;
        saveConfig(config);
        output({ status: 'ok', message: '2FA verified successfully' });
        break;
      }

      case 'send-2fa': {
        const [channel = 'SMS'] = args;
        const client = getClient();
        await client.generate2FACode(channel);
        output({ status: 'ok', message: `2FA code sent via ${channel}` });
        break;
      }

      case 'status': {
        const config = loadConfig();
        if (config.authKey) {
          const client = getClient();
          try {
            const user = await client.getUserDetails();
            output({ 
              status: 'logged_in',
              user: {
                firstName: user.firstname,
                lastName: user.lastname,
                email: user.contact_email,
                address: user.address
              }
            });
          } catch (e) {
            output({ status: 'error', message: 'Auth key expired, please login again' });
          }
        } else {
          output({ status: 'not_logged_in' });
        }
        break;
      }

      case 'search': {
        const query = args.join(' ');
        if (!query) {
          output({ error: 'Usage: picnic search <query>' });
          process.exit(1);
        }
        const client = getClient();
        const results = await client.search(query);
        output({
          query,
          count: results.length,
          products: results.slice(0, 20).map(p => ({
            id: p.id,
            name: p.name,
            price: p.display_price,
            unit: p.unit_quantity,
            available: p.max_count > 0
          }))
        });
        break;
      }

      case 'cart': {
        const client = getClient();
        const cart = await client.getShoppingCart();
        output({
          itemCount: cart.total_count,
          totalPrice: cart.total_price,
          items: (cart.items || []).map(item => ({
            id: item.items?.[0]?.id,
            name: item.items?.[0]?.name,
            quantity: item.items?.[0]?.decorators?.find(d => d.type === 'QUANTITY')?.quantity,
            price: item.items?.[0]?.display_price
          })).filter(i => i.id)
        });
        break;
      }

      case 'add': {
        const [productId, count = '1'] = args;
        if (!productId) {
          output({ error: 'Usage: picnic add <productId> [count=1]' });
          process.exit(1);
        }
        const client = getClient();
        const cart = await client.addProductToShoppingCart(productId, parseInt(count, 10));
        output({ 
          status: 'ok', 
          message: `Added ${count}x product to cart`,
          totalItems: cart.total_count,
          totalPrice: cart.total_price
        });
        break;
      }

      case 'remove': {
        const [productId, count = '1'] = args;
        if (!productId) {
          output({ error: 'Usage: picnic remove <productId> [count=1]' });
          process.exit(1);
        }
        const client = getClient();
        const cart = await client.removeProductFromShoppingCart(productId, parseInt(count, 10));
        output({ 
          status: 'ok', 
          message: `Removed ${count}x product from cart`,
          totalItems: cart.total_count,
          totalPrice: cart.total_price
        });
        break;
      }

      case 'clear': {
        const client = getClient();
        await client.clearShoppingCart();
        output({ status: 'ok', message: 'Cart cleared' });
        break;
      }

      case 'slots': {
        const client = getClient();
        const slotsData = await client.getDeliverySlots();
        const slots = [];
        for (const slotGroup of slotsData.delivery_slots || []) {
          for (const slot of slotGroup.slot_selector_data || []) {
            if (slot.state === 'SELECTABLE') {
              slots.push({
                id: slot.slot_id,
                date: slotGroup.start,
                window: `${slot.window_start} - ${slot.window_end}`,
                price: slot.price,
                selected: slot.selected
              });
            }
          }
        }
        output({ slots: slots.slice(0, 15) });
        break;
      }

      case 'set-slot': {
        const [slotId] = args;
        if (!slotId) {
          output({ error: 'Usage: picnic set-slot <slotId>' });
          process.exit(1);
        }
        const client = getClient();
        const cart = await client.setDeliverySlot(slotId);
        output({ status: 'ok', message: 'Delivery slot set' });
        break;
      }

      case 'deliveries': {
        const client = getClient();
        const deliveries = await client.getDeliveries();
        output({
          deliveries: deliveries.slice(0, 10).map(d => ({
            id: d.delivery_id,
            status: d.status,
            date: d.slot?.window_start?.split('T')[0],
            window: `${d.slot?.window_start?.split('T')[1]?.slice(0,5)} - ${d.slot?.window_end?.split('T')[1]?.slice(0,5)}`,
            totalPrice: d.orders?.reduce((sum, o) => sum + (o.total_price || 0), 0)
          }))
        });
        break;
      }

      case 'delivery': {
        const [deliveryId] = args;
        if (!deliveryId) {
          output({ error: 'Usage: picnic delivery <deliveryId>' });
          process.exit(1);
        }
        const client = getClient();
        const delivery = await client.getDelivery(deliveryId);
        
        // Extract items from orders
        const items = [];
        for (const order of delivery.orders || []) {
          for (const line of order.items || []) {
            const article = line.items?.[0];
            if (article) {
              const qty = article.decorators?.find(d => d.type === 'QUANTITY')?.quantity || 1;
              items.push({
                name: article.name,
                quantity: qty,
                unitSize: article.unit_quantity,
                price: line.display_price
              });
            }
          }
        }
        
        output({
          id: delivery.delivery_id,
          status: delivery.status,
          date: delivery.slot?.window_start?.split('T')[0],
          window: `${delivery.slot?.window_start?.split('T')[1]?.slice(0,5)} - ${delivery.slot?.window_end?.split('T')[1]?.slice(0,5)}`,
          totalPrice: delivery.orders?.reduce((sum, o) => sum + (o.total_price || 0), 0),
          items
        });
        break;
      }

      case 'categories': {
        const client = getClient();
        const categories = await client.getCategories(1);
        output({
          categories: (categories.catalog || []).map(c => ({
            id: c.id,
            name: c.name,
            itemCount: c.items?.length
          }))
        });
        break;
      }

      case 'user': {
        const client = getClient();
        const user = await client.getUserDetails();
        output({
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.contact_email,
          phone: user.phone,
          address: user.address,
          householdSize: user.household_details?.adults
        });
        break;
      }

      case 'help':
      default:
        output({
          usage: 'picnic <command> [args]',
          commands: {
            'login <email> <password> [country=DE]': 'Login to Picnic (country: DE or NL)',
            'verify-2fa <code>': 'Verify 2FA code after login',
            'send-2fa [channel=SMS]': 'Request new 2FA code',
            'status': 'Check login status',
            'user': 'Show user details',
            'search <query>': 'Search for products',
            'cart': 'Show current cart',
            'add <productId> [count]': 'Add product to cart',
            'remove <productId> [count]': 'Remove product from cart',
            'clear': 'Clear the cart',
            'slots': 'Show available delivery slots',
            'set-slot <slotId>': 'Select a delivery slot',
            'deliveries': 'List past/current deliveries',
            'delivery <id>': 'Get delivery details',
            'categories': 'List product categories'
          }
        });
        break;
    }
  } catch (error) {
    output({ error: error.message });
    process.exit(1);
  }
}

main();
