#!/usr/bin/env node

const { program } = require('commander');
const readline = require('readline');

const commands = require('../lib/commands');
const { cliError } = require('../lib/errors');

const pkg = require('../package.json');

program
  .name('homeycli')
  .description('Control Athom Homey smart home devices via local (LAN/VPN) or cloud APIs')
  .version(pkg.version);

// Global options
program
  .option('--json', 'Output JSON (stdout) instead of formatted text')
  .option('--raw', 'Include raw Homey API objects in JSON output (very verbose)')
  .option('--threshold <n>', 'Fuzzy match threshold', (v) => parseInt(v, 10), 5);

function exitCodeForError(err) {
  switch (err?.code) {
    case 'NO_TOKEN':
      return 2;
    case 'NOT_FOUND':
      return 3;
    case 'AMBIGUOUS':
      return 4;
    case 'CAPABILITY_NOT_SUPPORTED':
    case 'INVALID_VALUE':
      return 5;
    default:
      return 1;
  }
}

function printError(err, opts) {
  const message = err?.message || String(err);
  const code = err?.code || 'ERROR';
  const details = err?.details;

  if (opts?.json) {
    const payload = { error: { code, message } };
    if (details !== undefined) payload.error.details = details;
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.error(`error[${code}]: ${message}`);

  if (details?.help) {
    console.error(`help: ${details.help}`);
  }

  const candidates = details?.candidates;
  if (Array.isArray(candidates) && candidates.length) {
    console.error('candidates:');
    for (const c of candidates) {
      if (c.id && c.name) {
        console.error(`  ${c.id}  ${c.name}`);
      } else if (c.name) {
        console.error(`  ${c.name}`);
      } else {
        console.error(`  ${JSON.stringify(c)}`);
      }
    }
  }
}

async function runOrExit(fn) {
  const opts = program.opts();
  try {
    await fn(opts);
  } catch (err) {
    printError(err, opts);
    process.exit(exitCodeForError(err));
  }
}

function commandOpts(maybeCommandOrOpts) {
  if (maybeCommandOrOpts && typeof maybeCommandOrOpts.opts === 'function') {
    return maybeCommandOrOpts.opts();
  }
  // Commander may pass plain options object in some cases.
  if (maybeCommandOrOpts && typeof maybeCommandOrOpts === 'object') {
    return maybeCommandOrOpts;
  }
  return {};
}

async function readAllStdin() {
  return await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function promptHidden(question) {
  if (!process.stdin.isTTY) {
    throw cliError('INVALID_VALUE', 'cannot prompt for token (stdin is not a TTY). Use --stdin instead.');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });

  // Print the prompt, then hide typed characters (print nothing while user types).
  rl.output.write(question);
  rl._writeToOutput = function _writeToOutput() {};

  return await new Promise((resolve) => {
    rl.question('', (answer) => {
      rl.close();
      rl.output.write('\n');
      resolve(answer);
    });
  });
}

// Devices command
program
  .command('devices')
  .description('List devices (latest state)')
  .option('--match <query>', 'Filter devices by name (returns multiple matches)')
  .action((maybeCmd) => runOrExit((opts) => commands.listDevices({ ...opts, ...commandOpts(maybeCmd) })));

// Device operations
program
  .command('device <nameOrId> <action> [capability] [value]')
  .description('Device operations (on/off/set/get/values/inspect/capabilities)')
  .action((nameOrId, action, capability, value) =>
    runOrExit((opts) => {
      if (action === 'on') return commands.controlDevice(nameOrId, 'on', opts);
      if (action === 'off') return commands.controlDevice(nameOrId, 'off', opts);
      if (action === 'set') {
        if (!capability || value === undefined) {
          throw cliError('INVALID_VALUE', 'usage: homeycli device <nameOrId> set <capability> <value>');
        }
        return commands.setCapability(nameOrId, capability, value, opts);
      }
      if (action === 'get') {
        if (!capability) return commands.getDeviceValues(nameOrId, opts);
        return commands.getCapability(nameOrId, capability, opts);
      }
      if (action === 'values') return commands.getDeviceValues(nameOrId, opts);
      if (action === 'inspect') return commands.inspectDevice(nameOrId, opts);
      if (action === 'capabilities') return commands.getDeviceCapabilities(nameOrId, opts);

      throw cliError(
        'INVALID_VALUE',
        'invalid device action. Use: on, off, set <capability> <value>, get [capability], values, inspect, capabilities'
      );
    })
  );

// Flows command
program
  .command('flows')
  .description('List flows')
  .option('--match <query>', 'Filter flows by name (returns multiple matches)')
  .action((maybeCmd) => runOrExit((opts) => commands.listFlows({ ...opts, ...commandOpts(maybeCmd) })));

program
  .command('flow <action> <nameOrId>')
  .description('Flow operations (trigger)')
  .action((action, nameOrId) =>
    runOrExit((opts) => {
      if (action === 'trigger') return commands.triggerFlow(nameOrId, opts);
      throw cliError('INVALID_VALUE', 'invalid flow action. Use: trigger');
    })
  );

// Snapshot command
program
  .command('snapshot')
  .description('Get a point-in-time snapshot (status + zones + devices)')
  .option('--include-flows', 'Also include flows (can be large)')
  .action((maybeCmd) => runOrExit((opts) => commands.snapshot({ ...opts, ...commandOpts(maybeCmd) })));

// Zones command
program
  .command('zones')
  .description('List all zones/rooms')
  .action(() => runOrExit((opts) => commands.listZones(opts)));

// Status command
program
  .command('status')
  .description('Show Homey connection status and info')
  .action(() => runOrExit((opts) => commands.showStatus(opts)));

// Auth helper commands
program
  .command('auth <action> [value]')
  .description('Authentication helpers (local + cloud)')
  .option('--stdin', 'Read token from stdin (recommended; avoids shell history)')
  .option('--prompt', 'Prompt for token (hidden input)')
  .option('--address <url>', 'Homey local address (e.g. http://192.168.1.50)')
  .option('--save', 'Save discovered local address to config (discover-local)')
  .option('--pick <n>', 'Pick candidate by index (discover-local --save)', (v) => parseInt(v, 10))
  .option('--homey-id <id>', 'Pick candidate by Homey id (discover-local --save)')
  .option('--timeout <ms>', 'Discovery timeout in ms (discover-local)', (v) => parseInt(v, 10))
  .action((action, value, maybeCmd) =>
    runOrExit(async (opts) => {
      const merged = { ...opts, ...commandOpts(maybeCmd) };

      if (merged.stdin && merged.prompt) {
        throw cliError('INVALID_VALUE', 'use either --stdin or --prompt (not both)');
      }

      async function readToken(kindLabel) {
        if (merged.stdin) return (await readAllStdin()).trim();
        if (merged.prompt) return String(await promptHidden(`${kindLabel} token: `)).trim();
        return value;
      }

      if (action === 'discover-local') {
        return commands.authDiscoverLocal(merged);
      }

      if (action === 'set-token') {
        const t = await readToken('Homey cloud');
        return commands.authSetToken(t, merged);
      }

      if (action === 'set-local') {
        const t = await readToken('Homey local');
        return commands.authSetLocal(t, merged);
      }

      if (action === 'set-mode') {
        // value = auto|local|cloud
        return commands.authSetMode(value, merged);
      }

      if (action === 'clear-token') {
        return commands.authClearCloud(merged);
      }

      if (action === 'clear-local') {
        return commands.authClearLocal(merged);
      }

      if (action === 'status') return commands.authStatus(merged);

      throw cliError(
        'INVALID_VALUE',
        'invalid auth action. Use: status, discover-local [--save] [--pick <n>|--homey-id <id>] [--timeout <ms>], set-local [--address <url>] [--stdin|--prompt|<token>], set-token [--stdin|--prompt|<token>], set-mode <auto|local|cloud>, clear-local, clear-token'
      );
    })
  );

program.parse();
