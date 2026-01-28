/**
 * Browser automation wrapper for agent-browser CLI
 */

import { spawn, execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Snapshot, ConsoleEvent, WaitStrategy } from './types.js'
import { parseSnapshot } from './utils/snapshot.js'
import { ConsoleMonitor } from './utils/console.js'
import { sleep, retry, waitStrategyToArgs } from './utils/wait.js'

export interface BrowserOptions {
  cdpPort?: number
  headless?: boolean
  timeout?: number
  screenshotDir?: string
  waitStrategy?: WaitStrategy
  verbose?: boolean
}

export class Browser {
  private cdpPort: number
  private headless: boolean
  private timeout: number
  private screenshotDir: string
  private waitStrategy: WaitStrategy
  private verbose: boolean
  private consoleMonitor: ConsoleMonitor
  private currentUrl: string = ''
  private launched: boolean = false

  constructor(options: BrowserOptions = {}) {
    this.cdpPort = options.cdpPort || 0 // 0 = auto-assign
    this.headless = options.headless ?? true
    this.timeout = options.timeout || 30000
    this.screenshotDir = options.screenshotDir || './screenshots'
    this.waitStrategy = options.waitStrategy || 'auto'
    this.verbose = options.verbose || false
    this.consoleMonitor = new ConsoleMonitor()
  }

  /**
   * Execute agent-browser command
   */
  private exec(args: string[], timeout?: number): string {
    const cdpArgs = this.cdpPort ? ['--cdp', String(this.cdpPort)] : []
    const cmd = ['agent-browser', ...cdpArgs, ...args].join(' ')
    
    if (this.verbose) {
      console.log(`[browser] ${cmd}`)
    }
    
    try {
      const result = execSync(cmd, {
        encoding: 'utf-8',
        timeout: timeout || this.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return result.trim()
    } catch (err: any) {
      const stderr = err.stderr?.toString() || ''
      const stdout = err.stdout?.toString() || ''
      throw new Error(`Browser command failed: ${cmd}\n${stderr || stdout}`)
    }
  }

  /**
   * Launch browser if not connected
   */
  async launch(): Promise<void> {
    if (this.launched || this.cdpPort) {
      return
    }

    // Check if agent-browser is installed
    try {
      execSync('which agent-browser', { stdio: 'pipe' })
    } catch {
      throw new Error(
        'agent-browser CLI not found. Install it with: npm install -g agent-browser'
      )
    }

    // Launch browser and get CDP port
    const args = this.headless ? ['--headless'] : []
    const output = this.exec(['launch', ...args])
    
    // Parse CDP port from output
    const portMatch = output.match(/CDP port[:\s]+(\d+)/i)
    if (portMatch) {
      this.cdpPort = parseInt(portMatch[1], 10)
    } else {
      // Default port if not found
      this.cdpPort = 9222
    }
    
    this.launched = true
    await sleep(1000) // Wait for browser to fully start
  }

  /**
   * Connect to existing browser
   */
  connect(cdpPort: number): void {
    this.cdpPort = cdpPort
  }

  /**
   * Navigate to URL
   */
  async goto(url: string): Promise<Snapshot> {
    await this.launch()
    
    const waitArgs = waitStrategyToArgs(this.waitStrategy)
    this.exec(['navigate', url, ...waitArgs])
    this.currentUrl = url
    
    // Take snapshot after navigation
    return this.snapshot()
  }

  /**
   * Take accessibility tree snapshot
   */
  async snapshot(): Promise<Snapshot> {
    await this.launch()
    
    const output = await retry(() => Promise.resolve(this.exec(['snapshot'])))
    return parseSnapshot(output, this.currentUrl)
  }

  /**
   * Take screenshot
   */
  async screenshot(name?: string): Promise<string> {
    await this.launch()
    
    // Ensure screenshot directory exists
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true })
    }
    
    const filename = name || `screenshot-${Date.now()}.png`
    const filepath = join(this.screenshotDir, filename)
    
    this.exec(['screenshot', filepath])
    return filepath
  }

  /**
   * Click element by ref
   */
  async click(ref: string): Promise<void> {
    await this.launch()
    
    await retry(() => {
      this.exec(['click', ref])
      return Promise.resolve()
    })
    
    // Brief wait for UI to update
    await sleep(100)
  }

  /**
   * Type text into element
   */
  async type(ref: string, text: string): Promise<void> {
    await this.launch()
    
    // Click to focus first
    await this.click(ref)
    
    // Type text
    this.exec(['type', `"${text.replace(/"/g, '\\"')}"`])
  }

  /**
   * Press key
   */
  async press(key: string): Promise<void> {
    await this.launch()
    this.exec(['press', key])
  }

  /**
   * Hover over element
   */
  async hover(ref: string): Promise<void> {
    await this.launch()
    this.exec(['hover', ref])
  }

  /**
   * Select option from dropdown
   */
  async select(ref: string, value: string): Promise<void> {
    await this.launch()
    await this.click(ref)
    await sleep(200)
    
    // Take snapshot to find option
    const snapshot = await this.snapshot()
    
    // Look for option with matching text
    for (const [key, elem] of snapshot.refs) {
      if (key.startsWith('@') && elem.name.toLowerCase().includes(value.toLowerCase())) {
        if (elem.role === 'option' || elem.role === 'menuitem' || elem.role === 'listitem') {
          await this.click(elem.id)
          return
        }
      }
    }
    
    throw new Error(`Option "${value}" not found in dropdown`)
  }

  /**
   * Wait for element to appear
   */
  async waitFor(selector: string, options: { timeout?: number } = {}): Promise<Snapshot> {
    const timeout = options.timeout || this.timeout
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      const snapshot = await this.snapshot()
      
      // Check if element exists
      if (selector.startsWith('@')) {
        if (snapshot.refs.has(selector)) {
          return snapshot
        }
      } else {
        // Search by text/role
        for (const [, ref] of snapshot.refs) {
          if (ref.name.toLowerCase().includes(selector.toLowerCase())) {
            return snapshot
          }
        }
      }
      
      await sleep(200)
    }
    
    throw new Error(`Timeout waiting for element: ${selector}`)
  }

  /**
   * Wait for URL to match
   */
  async waitForUrl(pattern: string | RegExp, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || this.timeout
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      const snapshot = await this.snapshot()
      const url = snapshot.url
      
      if (typeof pattern === 'string') {
        if (url.includes(pattern)) return
      } else {
        if (pattern.test(url)) return
      }
      
      await sleep(200)
    }
    
    throw new Error(`Timeout waiting for URL: ${pattern}`)
  }

  /**
   * Get console events
   */
  async getConsole(): Promise<ConsoleEvent[]> {
    await this.launch()
    
    try {
      const output = this.exec(['console'])
      const events = this.consoleMonitor.parseAgentBrowserConsole(output)
      
      for (const event of events) {
        this.consoleMonitor.addEvent(event)
      }
      
      return this.consoleMonitor.getEvents()
    } catch {
      return []
    }
  }

  /**
   * Get console monitor
   */
  getConsoleMonitor(): ConsoleMonitor {
    return this.consoleMonitor
  }

  /**
   * Clear console events
   */
  clearConsole(): void {
    this.consoleMonitor.clear()
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.launched) {
      try {
        this.exec(['close'])
      } catch {
        // Ignore close errors
      }
      this.launched = false
    }
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.currentUrl
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.launched || this.cdpPort > 0
  }

  /**
   * Evaluate JavaScript in page
   */
  async evaluate<T>(script: string): Promise<T> {
    await this.launch()
    const output = this.exec(['evaluate', `"${script.replace(/"/g, '\\"')}"`])
    
    try {
      return JSON.parse(output) as T
    } catch {
      return output as unknown as T
    }
  }
}
