/**
 * QABot - Main class for web QA automation
 */

import type {
  QABotConfig,
  TestStep,
  TestCase,
  TestSuite,
  TestResult,
  SuiteResult,
  Snapshot,
  StepResult,
  ConsoleEvent
} from './types.js'
import { Browser } from './browser.js'
import { Reporter } from './reporter.js'
import * as assertions from './assertions.js'
import { sleep, retry, waitFor } from './utils/wait.js'
import { resolveRef, detectModals, diffSnapshots } from './utils/snapshot.js'

export class QABot {
  private config: QABotConfig
  private browser: Browser
  private reporter: Reporter
  private currentSnapshot: Snapshot | null = null

  constructor(config: QABotConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      waitStrategy: 'auto',
      monitorConsole: true,
      verbose: false,
      ...config
    }

    this.browser = new Browser({
      cdpPort: config.cdpPort,
      headless: config.headless ?? true,
      timeout: this.config.timeout,
      screenshotDir: config.screenshotDir || './screenshots',
      waitStrategy: this.config.waitStrategy,
      verbose: this.config.verbose
    })

    this.reporter = new Reporter()
  }

  /**
   * Navigate to URL
   */
  async goto(url: string): Promise<Snapshot> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`
    this.currentSnapshot = await this.browser.goto(fullUrl)
    return this.currentSnapshot
  }

  /**
   * Take snapshot
   */
  async snapshot(): Promise<Snapshot> {
    this.currentSnapshot = await this.browser.snapshot()
    return this.currentSnapshot
  }

  /**
   * Take screenshot
   */
  async screenshot(name?: string): Promise<string> {
    return this.browser.screenshot(name)
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    const snapshot = this.currentSnapshot || await this.snapshot()
    const ref = resolveRef(snapshot, selector)
    
    if (!ref) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    await this.browser.click(ref)
    
    // Re-snapshot after interaction
    await sleep(100)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Type text
   */
  async type(selector: string, text: string): Promise<void> {
    const snapshot = this.currentSnapshot || await this.snapshot()
    const ref = resolveRef(snapshot, selector)
    
    if (!ref) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    await this.browser.type(ref, text)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Press key
   */
  async press(key: string): Promise<void> {
    await this.browser.press(key)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    const snapshot = this.currentSnapshot || await this.snapshot()
    const ref = resolveRef(snapshot, selector)
    
    if (!ref) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    await this.browser.hover(ref)
  }

  /**
   * Select option
   */
  async select(selector: string, value: string): Promise<void> {
    const snapshot = this.currentSnapshot || await this.snapshot()
    const ref = resolveRef(snapshot, selector)
    
    if (!ref) {
      throw new Error(`Element not found: ${selector}`)
    }
    
    await this.browser.select(ref, value)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Wait for element
   */
  async waitFor(selector: string, options?: { timeout?: number }): Promise<Snapshot> {
    this.currentSnapshot = await this.browser.waitFor(selector, options)
    return this.currentSnapshot
  }

  /**
   * Wait for load state
   */
  async waitForLoad(): Promise<void> {
    await sleep(500)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Wait for URL
   */
  async waitForUrl(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.browser.waitForUrl(pattern, options)
    this.currentSnapshot = await this.browser.snapshot()
  }

  /**
   * Get console events
   */
  async getConsole(): Promise<ConsoleEvent[]> {
    return this.browser.getConsole()
  }

  /**
   * Expect element visible
   */
  expectVisible(selector: string): void {
    if (!this.currentSnapshot) {
      throw new Error('No snapshot available. Call snapshot() first.')
    }
    assertions.expectVisible(this.currentSnapshot, selector)
  }

  /**
   * Expect element text
   */
  expectText(selector: string, text: string, options?: { contains?: boolean }): void {
    if (!this.currentSnapshot) {
      throw new Error('No snapshot available. Call snapshot() first.')
    }
    assertions.expectText(this.currentSnapshot, selector, text, options)
  }

  /**
   * Expect URL
   */
  expectUrl(expected: string | { contains?: string }): void {
    if (!this.currentSnapshot) {
      throw new Error('No snapshot available. Call snapshot() first.')
    }
    assertions.expectUrl(this.currentSnapshot, expected)
  }

  /**
   * Expect element count
   */
  expectCount(role: string, count: number | { min?: number; max?: number }): void {
    if (!this.currentSnapshot) {
      throw new Error('No snapshot available. Call snapshot() first.')
    }
    assertions.expectCount(this.currentSnapshot, role, count)
  }

  /**
   * Expect no console errors
   */
  async expectNoErrors(): Promise<void> {
    const events = await this.getConsole()
    assertions.expectNoErrors(events)
  }

  /**
   * Expect console event
   */
  async expectConsoleEvent(pattern: string | RegExp): Promise<void> {
    const events = await this.getConsole()
    assertions.expectConsoleEvent(events, pattern)
  }

  /**
   * Expect modal present/absent
   */
  expectModal(present: boolean = true): void {
    if (!this.currentSnapshot) {
      throw new Error('No snapshot available. Call snapshot() first.')
    }
    assertions.expectModal(this.currentSnapshot, present)
  }

  /**
   * Run test steps
   */
  async run(steps: TestStep[]): Promise<StepResult[]> {
    const results: StepResult[] = []

    for (const step of steps) {
      const start = Date.now()
      const stepName = step.name || this.stepToName(step)
      
      try {
        await this.executeStep(step)
        results.push({
          name: stepName,
          status: 'pass',
          duration: Date.now() - start
        })
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        results.push({
          name: stepName,
          status: 'fail',
          duration: Date.now() - start,
          error
        })
        throw err // Stop on first failure
      }
    }

    return results
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: TestStep): Promise<void> {
    if (step.goto) {
      await this.goto(step.goto)
    }
    
    if (step.waitForLoad) {
      await this.waitForLoad()
    }
    
    if (step.waitFor) {
      await this.waitFor(step.waitFor)
    }
    
    if (step.waitMs) {
      await sleep(step.waitMs)
    }
    
    if (step.click) {
      await this.click(step.click)
    }
    
    if (step.type) {
      await this.type(step.type.ref, step.type.text)
    }
    
    if (step.select) {
      await this.select(step.select.ref, step.select.value)
    }
    
    if (step.hover) {
      await this.hover(step.hover)
    }
    
    if (step.press) {
      await this.press(step.press)
    }
    
    if (step.screenshot) {
      await this.screenshot(step.screenshot)
    }
    
    if (step.expectVisible) {
      await this.snapshot()
      this.expectVisible(step.expectVisible)
    }
    
    if (step.expectText) {
      await this.snapshot()
      this.expectText(step.expectText.ref, step.expectText.text, { contains: step.expectText.contains })
    }
    
    if (step.expectUrl) {
      await this.snapshot()
      this.expectUrl(step.expectUrl)
    }
    
    if (step.expectCount) {
      await this.snapshot()
      this.expectCount(step.expectCount.selector, {
        min: step.expectCount.min,
        max: step.expectCount.max
      })
    }
    
    if (step.expectNoErrors) {
      await this.expectNoErrors()
    }
    
    if (step.expectConsoleEvent) {
      await this.expectConsoleEvent(step.expectConsoleEvent)
    }
    
    if (step.assert) {
      const snapshot = await this.snapshot()
      const result = await step.assert(snapshot)
      if (!result) {
        throw new Error('Custom assertion failed')
      }
    }
  }

  /**
   * Convert step to readable name
   */
  private stepToName(step: TestStep): string {
    if (step.goto) return `Navigate to ${step.goto}`
    if (step.click) return `Click ${step.click}`
    if (step.type) return `Type "${step.type.text}" into ${step.type.ref}`
    if (step.select) return `Select "${step.select.value}" in ${step.select.ref}`
    if (step.hover) return `Hover over ${step.hover}`
    if (step.press) return `Press ${step.press}`
    if (step.waitFor) return `Wait for ${step.waitFor}`
    if (step.waitMs) return `Wait ${step.waitMs}ms`
    if (step.screenshot) return `Screenshot: ${step.screenshot}`
    if (step.expectVisible) return `Expect visible: ${step.expectVisible}`
    if (step.expectText) return `Expect text: ${step.expectText.text}`
    if (step.expectUrl) return `Expect URL`
    if (step.expectNoErrors) return `Expect no console errors`
    return 'Unknown step'
  }

  /**
   * Run a test case
   */
  async runTest(test: TestCase): Promise<TestResult> {
    const start = Date.now()
    const screenshots: string[] = []
    let consoleEvents: ConsoleEvent[] = []
    let steps: StepResult[] = []
    let error: string | undefined

    if (test.skip) {
      return {
        name: test.name,
        status: 'skip',
        duration: 0,
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    try {
      // Clear console before test
      this.browser.clearConsole()
      
      // Run test steps
      steps = await this.run(test.steps)
      
      // Collect console events
      consoleEvents = await this.getConsole()
      
      // Check for console errors if test passed
      const errors = consoleEvents.filter(e => e.type === 'error')
      if (errors.length > 0 && !test.knownIssue) {
        return {
          name: test.name,
          status: 'warn',
          duration: Date.now() - start,
          error: `${errors.length} console error(s)`,
          screenshots,
          consoleEvents,
          knownIssue: test.knownIssue,
          steps
        }
      }

      return {
        name: test.name,
        status: test.knownIssue ? 'warn' : 'pass',
        duration: Date.now() - start,
        screenshots,
        consoleEvents,
        knownIssue: test.knownIssue,
        steps
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      
      // Take failure screenshot
      try {
        const screenshotPath = await this.screenshot(`failure-${test.name.replace(/\s+/g, '-')}.png`)
        screenshots.push(screenshotPath)
      } catch {
        // Ignore screenshot errors
      }

      return {
        name: test.name,
        status: test.knownIssue ? 'warn' : 'fail',
        duration: Date.now() - start,
        error,
        screenshots,
        consoleEvents: await this.getConsole(),
        knownIssue: test.knownIssue,
        steps
      }
    }
  }

  /**
   * Run a test suite
   */
  async runSuite(suite: TestSuite): Promise<SuiteResult> {
    const start = Date.now()
    const baseUrl = suite.baseUrl || this.config.baseUrl
    const results: TestResult[] = []

    // Run beforeAll
    if (suite.beforeAll) {
      try {
        await this.run(suite.beforeAll)
      } catch (err) {
        // beforeAll failed, skip all tests
        for (const test of suite.tests) {
          results.push({
            name: test.name,
            status: 'skip',
            duration: 0,
            error: `beforeAll failed: ${err instanceof Error ? err.message : String(err)}`,
            screenshots: [],
            consoleEvents: [],
            steps: []
          })
        }
        
        return this.createSuiteResult(suite.name, baseUrl, results, start)
      }
    }

    // Run tests
    for (const test of suite.tests) {
      // Run beforeEach
      if (suite.beforeEach) {
        try {
          await this.run(suite.beforeEach)
        } catch (err) {
          results.push({
            name: test.name,
            status: 'skip',
            duration: 0,
            error: `beforeEach failed: ${err instanceof Error ? err.message : String(err)}`,
            screenshots: [],
            consoleEvents: [],
            steps: []
          })
          continue
        }
      }

      // Run test
      const result = await this.runTest(test)
      results.push(result)

      // Run afterEach
      if (suite.afterEach) {
        try {
          await this.run(suite.afterEach)
        } catch {
          // Ignore afterEach errors
        }
      }
    }

    // Run afterAll
    if (suite.afterAll) {
      try {
        await this.run(suite.afterAll)
      } catch {
        // Ignore afterAll errors
      }
    }

    const suiteResult = this.createSuiteResult(suite.name, baseUrl, results, start)
    this.reporter.addResult(suiteResult)
    
    return suiteResult
  }

  /**
   * Create suite result object
   */
  private createSuiteResult(
    name: string,
    url: string,
    tests: TestResult[],
    startTime: number
  ): SuiteResult {
    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      skipped: tests.filter(t => t.status === 'skip').length,
      warnings: tests.filter(t => t.status === 'warn').length
    }

    return {
      name,
      url,
      tests,
      duration: Date.now() - startTime,
      summary,
      timestamp: Date.now()
    }
  }

  /**
   * Generate report
   */
  async generateReport(output: string, options: { format?: 'markdown' | 'pdf' | 'json'; company?: string } = {}): Promise<string> {
    return this.reporter.generate({
      output,
      format: options.format,
      company: options.company,
      includeScreenshots: true
    })
  }

  /**
   * Get reporter
   */
  getReporter(): Reporter {
    return this.reporter
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    await this.browser.close()
  }

  /**
   * Get browser instance
   */
  getBrowser(): Browser {
    return this.browser
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): Snapshot | null {
    return this.currentSnapshot
  }
}
