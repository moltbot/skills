#!/usr/bin/env node

const inquirer = require('inquirer');
const { runSetup } = require('./setup');
const { verifyAnswer } = require('./verify');
const { loadConfig, clearConfig } = require('./config');
const { deleteHash } = require('./keychain');

const COMMANDS = ['setup', 'verify', 'test', 'reset', 'help'];

function printUsage() {
  console.log('Usage: stranger-danger <command>');
  console.log('');
  console.log('Commands:');
  console.log('  setup               Configure secret question and answer');
  console.log('  verify <answer>     Verify an answer (for Clawdbot)');
  console.log('  test                Prompt and test your answer');
  console.log('  reset               Clear stored credentials');
  console.log('  help                Show this help');
}

async function runTest() {
  const config = loadConfig();
  if (!config?.question) {
    throw new Error('No question configured. Run setup first.');
  }

  const { answer } = await inquirer.prompt([
    {
      type: 'password',
      name: 'answer',
      message: config.question,
      mask: '*',
      validate: (value) => (value && value.trim() ? true : 'Answer is required.'),
    },
  ]);

  const ok = await verifyAnswer(answer);
  if (ok) {
    console.log('Verified.');
  } else {
    console.log('Not verified.');
    process.exitCode = 1;
  }
}

async function runReset() {
  await deleteHash();
  clearConfig();
  console.log('Credentials cleared.');
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const command = cmd || 'help';

  if (!COMMANDS.includes(command)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    if (command === 'setup') {
      await runSetup();
      console.log('Setup complete.');
      return;
    }

    if (command === 'verify') {
      const answer = args.join(' ');
      if (!answer) {
        console.error('Missing answer.');
        process.exitCode = 1;
        return;
      }
      const ok = await verifyAnswer(answer);
      if (ok) {
        console.log('OK');
      } else {
        console.log('FAIL');
        process.exitCode = 1;
      }
      return;
    }

    if (command === 'test') {
      await runTest();
      return;
    }

    if (command === 'reset') {
      await runReset();
      return;
    }

    printUsage();
  } catch (err) {
    const message = err?.message || String(err);
    console.error(message);
    process.exitCode = 1;
  }
}

main();
