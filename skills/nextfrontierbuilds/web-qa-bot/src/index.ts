/**
 * web-qa-bot - AI-powered web application QA automation
 *
 * @packageDocumentation
 */

// Main exports
export { QABot } from './bot.js'
export { Browser } from './browser.js'
export { Reporter, generateReportFromFile, formatDuration } from './reporter.js'
export { smokeTest } from './smoke.js'

// Assertions
export {
  AssertionError,
  expectVisible,
  expectNotVisible,
  expectText,
  expectUrl,
  expectCount,
  expectNoErrors,
  expectConsoleEvent,
  expectState,
  expectModal,
  expectTitle,
  expectClickable,
  softExpect
} from './assertions.js'

// Utilities
export {
  waitFor,
  retry,
  sleep,
  waitStrategyToArgs,
  isPageLoading,
  waitForStableSnapshot
} from './utils/wait.js'

export {
  ConsoleMonitor,
  filterBySeverity,
  categorizeError
} from './utils/console.js'

export {
  parseSnapshot,
  findByRole,
  findAllByRole,
  findByText,
  elementExists,
  resolveRef,
  detectStaleRefs,
  detectModals,
  getInteractiveElements,
  diffSnapshots
} from './utils/snapshot.js'

// Types
export type {
  QABotConfig,
  WaitStrategy,
  TestStep,
  TestCase,
  TestSuite,
  Snapshot,
  ElementRef,
  ConsoleEvent,
  TestStatus,
  TestResult,
  StepResult,
  SuiteResult,
  ReportOptions,
  SmokeTestOptions,
  SmokeCheck
} from './types.js'
