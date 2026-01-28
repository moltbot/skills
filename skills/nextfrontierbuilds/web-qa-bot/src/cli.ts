#!/usr/bin/env node

/**
 * web-qa-bot CLI
 */

import { parseArgs } from 'node:util'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { QABot } from './bot.js'
import { smokeTest } from './smoke.js'
import { generateReportFromFile } from './reporter.js'
import type { TestSuite, SmokeCheck } from './types.js'

const VERSION = '0.1.0'

const HELP = `
web-qa-bot v${VERSION}
AI-powered web application QA automation

USAGE:
  web-qa-bot <command> [options]

COMMANDS:
  smoke <url>              Run smoke tests on a URL
  run <suite>              Run test suite from file
  report <results>         Generate report from results

OPTIONS:
  -o, --output <path>      Output file path
  -f, --format <format>    Report format: markdown, pdf, json
  --cdp <port>             Connect to existing browser CDP port
  --headless               Run in headless mode (default: true)
  --no-headless            Run in headed mode
  --timeout <ms>           Default timeout in milliseconds
  --verbose                Enable verbose logging
  -h, --help               Show this help
  -v, --version            Show version

EXAMPLES:
  # Quick smoke test
  web-qa-bot smoke https://example.com

  # Run test suite
  web-qa-bot run ./tests/suite.yaml --output results.json

  # Generate PDF report
  web-qa-bot report ./results.json -o report.pdf -f pdf

  # Connect to existing browser
  web-qa-bot smoke https://example.com --cdp 9222
`

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      format: { type: 'string', short: 'f' },
      cdp: { type: 'string' },
      headless: { type: 'boolean', default: true },
      'no-headless': { type: 'boolean' },
      timeout: { type: 'string' },
      verbose: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      checks: { type: 'string' },
      company: { type: 'string' }
    }
  })

  if (values.help || positionals.length === 0) {
    console.log(HELP)
    process.exit(0)
  }

  if (values.version) {
    console.log(VERSION)
    process.exit(0)
  }

  const command = positionals[0]
  const target = positionals[1]

  try {
    switch (command) {
      case 'smoke':
        await runSmoke(target, values)
        break
      case 'run':
        await runSuite(target, values)
        break
      case 'report':
        await generateReport(target, values)
        break
      default:
        console.error(`Unknown command: ${command}`)
        console.log(HELP)
        process.exit(1)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    if (values.verbose) {
      console.error(err)
    }
    process.exit(1)
  }
}

async function runSmoke(url: string, options: Record<string, any>) {
  if (!url) {
    throw new Error('URL required for smoke test')
  }

  console.log(`Running smoke test on ${url}...`)

  const checks = options.checks
    ? options.checks.split(',').map((c: string) => c.trim() as SmokeCheck)
    : undefined

  const result = await smokeTest({
    url,
    checks,
    timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
    report: !!options.output,
    output: options.output
  })

  // Print summary
  console.log('\n=== Smoke Test Results ===\n')
  console.log(`URL: ${result.url}`)
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`)
  console.log()

  for (const test of result.tests) {
    const icon = test.status === 'pass' ? '✓' : test.status === 'fail' ? '✗' : '○'
    const status = test.status.toUpperCase()
    console.log(`${icon} ${test.name}: ${status}`)
    if (test.error) {
      console.log(`  → ${test.error}`)
    }
  }

  console.log()
  console.log(`Total: ${result.summary.total} | Pass: ${result.summary.passed} | Fail: ${result.summary.failed} | Warn: ${result.summary.warnings}`)

  if (options.output) {
    console.log(`\nReport saved to: ${options.output}`)
  }

  // Exit with error if any tests failed
  if (result.summary.failed > 0) {
    process.exit(1)
  }
}

async function runSuite(suitePath: string, options: Record<string, any>) {
  if (!suitePath) {
    throw new Error('Suite file path required')
  }

  const fullPath = resolve(suitePath)
  if (!existsSync(fullPath)) {
    throw new Error(`Suite file not found: ${fullPath}`)
  }

  console.log(`Running test suite: ${suitePath}`)

  // Load suite file
  const content = readFileSync(fullPath, 'utf-8')
  const ext = extname(fullPath).toLowerCase()
  
  let suite: TestSuite
  if (ext === '.yaml' || ext === '.yml') {
    suite = parseYaml(content) as TestSuite
  } else if (ext === '.json') {
    suite = JSON.parse(content) as TestSuite
  } else {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // Create QA bot
  const qa = new QABot({
    baseUrl: suite.baseUrl || 'http://localhost',
    cdpPort: options.cdp ? parseInt(options.cdp, 10) : undefined,
    headless: !options['no-headless'],
    timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
    verbose: options.verbose
  })

  try {
    const result = await qa.runSuite(suite)

    // Print results
    console.log('\n=== Test Results ===\n')
    console.log(`Suite: ${result.name}`)
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`)
    console.log()

    for (const test of result.tests) {
      const icon = test.status === 'pass' ? '✓' : test.status === 'fail' ? '✗' : test.status === 'warn' ? '⚠' : '○'
      console.log(`${icon} ${test.name}`)
      if (test.error) {
        console.log(`  → ${test.error}`)
      }
    }

    console.log()
    console.log(`Total: ${result.summary.total} | Pass: ${result.summary.passed} | Fail: ${result.summary.failed} | Warn: ${result.summary.warnings}`)

    // Generate report if requested
    if (options.output) {
      const format = options.format || (options.output.endsWith('.pdf') ? 'pdf' : 'markdown')
      await qa.generateReport(options.output, { format, company: options.company })
      console.log(`\nReport saved to: ${options.output}`)
    }

    if (result.summary.failed > 0) {
      process.exit(1)
    }
  } finally {
    await qa.close()
  }
}

async function generateReport(resultsPath: string, options: Record<string, any>) {
  if (!resultsPath) {
    throw new Error('Results file path required')
  }

  const output = options.output || resultsPath.replace(/\.json$/, '.md')
  const format = options.format || (output.endsWith('.pdf') ? 'pdf' : output.endsWith('.json') ? 'json' : 'markdown')

  console.log(`Generating ${format} report...`)

  const reportPath = await generateReportFromFile(resultsPath, {
    output,
    format: format as any,
    company: options.company,
    includeScreenshots: true
  })

  console.log(`Report saved to: ${reportPath}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
