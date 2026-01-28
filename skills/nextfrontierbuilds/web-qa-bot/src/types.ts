/**
 * web-qa-bot - Type definitions
 */

export interface QABotConfig {
  /** Base URL for the application under test */
  baseUrl: string
  /** CDP port for browser connection (default: auto-detect or launch) */
  cdpPort?: number
  /** Run in headless mode (default: true) */
  headless?: boolean
  /** Directory for screenshots (default: ./screenshots) */
  screenshotDir?: string
  /** Default timeout in ms (default: 30000) */
  timeout?: number
  /** Retry attempts for flaky operations (default: 3) */
  retries?: number
  /** Wait strategy: 'auto' | 'networkidle' | 'domcontentloaded' | 'none' */
  waitStrategy?: WaitStrategy
  /** Enable console monitoring (default: true) */
  monitorConsole?: boolean
  /** Verbose logging (default: false) */
  verbose?: boolean
}

export type WaitStrategy = 'auto' | 'networkidle' | 'domcontentloaded' | 'none'

export interface TestStep {
  /** Step description */
  name?: string
  /** Navigation */
  goto?: string
  /** Wait for load state */
  waitForLoad?: boolean
  /** Wait for selector */
  waitFor?: string
  /** Wait for timeout in ms */
  waitMs?: number
  /** Click element by ref */
  click?: string
  /** Type text into element */
  type?: { ref: string; text: string }
  /** Select option */
  select?: { ref: string; value: string }
  /** Hover over element */
  hover?: string
  /** Press key */
  press?: string
  /** Take screenshot */
  screenshot?: string
  /** Expect element visible */
  expectVisible?: string
  /** Expect element text */
  expectText?: { ref: string; text: string; contains?: boolean }
  /** Expect URL */
  expectUrl?: { url?: string; contains?: string }
  /** Expect element count */
  expectCount?: { selector: string; count: number; min?: number; max?: number }
  /** Expect no console errors */
  expectNoErrors?: boolean
  /** Expect console event pattern */
  expectConsoleEvent?: string | RegExp
  /** Custom assertion function */
  assert?: (snapshot: Snapshot) => boolean | Promise<boolean>
}

export interface TestCase {
  /** Test name */
  name: string
  /** Test steps */
  steps: TestStep[]
  /** Skip this test */
  skip?: boolean
  /** Only run this test */
  only?: boolean
  /** Known issue ID (still runs, but marked) */
  knownIssue?: string
  /** Tags for filtering */
  tags?: string[]
}

export interface TestSuite {
  /** Suite name */
  name: string
  /** Base URL (overrides config) */
  baseUrl?: string
  /** Setup steps before each test */
  beforeEach?: TestStep[]
  /** Teardown steps after each test */
  afterEach?: TestStep[]
  /** Setup steps before all tests */
  beforeAll?: TestStep[]
  /** Teardown steps after all tests */
  afterAll?: TestStep[]
  /** Test cases */
  tests: TestCase[]
}

export interface Snapshot {
  /** Accessibility tree snapshot */
  tree: string
  /** Element refs map */
  refs: Map<string, ElementRef>
  /** Current URL */
  url: string
  /** Page title */
  title: string
  /** Console events since last snapshot */
  consoleEvents: ConsoleEvent[]
  /** Timestamp */
  timestamp: number
}

export interface ElementRef {
  /** Element ref ID (e.g., @e42) */
  id: string
  /** Element role */
  role: string
  /** Element name/label */
  name: string
  /** Element text content */
  text?: string
  /** Element state */
  state?: {
    disabled?: boolean
    checked?: boolean
    selected?: boolean
    expanded?: boolean
    pressed?: boolean
  }
}

export interface ConsoleEvent {
  /** Event type */
  type: 'log' | 'warn' | 'error' | 'info' | 'debug'
  /** Message text */
  text: string
  /** Timestamp */
  timestamp: number
  /** Source URL */
  source?: string
  /** Line number */
  line?: number
}

export type TestStatus = 'pass' | 'fail' | 'skip' | 'warn'

export interface TestResult {
  /** Test name */
  name: string
  /** Test status */
  status: TestStatus
  /** Duration in ms */
  duration: number
  /** Error message if failed */
  error?: string
  /** Screenshots taken */
  screenshots: string[]
  /** Console events during test */
  consoleEvents: ConsoleEvent[]
  /** Known issue ID if applicable */
  knownIssue?: string
  /** Step results */
  steps: StepResult[]
}

export interface StepResult {
  /** Step name or action */
  name: string
  /** Step status */
  status: TestStatus
  /** Duration in ms */
  duration: number
  /** Error message if failed */
  error?: string
  /** Screenshot if taken */
  screenshot?: string
}

export interface SuiteResult {
  /** Suite name */
  name: string
  /** URL tested */
  url: string
  /** Test results */
  tests: TestResult[]
  /** Total duration in ms */
  duration: number
  /** Summary stats */
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    warnings: number
  }
  /** Timestamp */
  timestamp: number
}

export interface ReportOptions {
  /** Output file path */
  output: string
  /** Report format: 'markdown' | 'pdf' | 'json' */
  format?: 'markdown' | 'pdf' | 'json'
  /** Include screenshots in report */
  includeScreenshots?: boolean
  /** Company name for PDF header */
  company?: string
  /** Report title */
  title?: string
}

export interface SmokeTestOptions {
  /** URL to test */
  url: string
  /** Checks to perform */
  checks?: SmokeCheck[]
  /** Timeout in ms */
  timeout?: number
  /** Generate report */
  report?: boolean
  /** Output path */
  output?: string
}

export type SmokeCheck = 
  | 'pageLoad'
  | 'consoleErrors'
  | 'brokenLinks'
  | 'images'
  | 'forms'
  | 'navigation'
  | 'accessibility'
  | 'performance'
