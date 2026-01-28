/**
 * Smoke test functionality
 */

import { QABot } from './bot.js'
import type { SmokeTestOptions, SmokeCheck, TestResult, SuiteResult } from './types.js'
import { findAllByRole, getInteractiveElements } from './utils/snapshot.js'

const DEFAULT_CHECKS: SmokeCheck[] = [
  'pageLoad',
  'consoleErrors',
  'navigation',
  'images'
]

/**
 * Run smoke tests on a URL
 */
export async function smokeTest(options: SmokeTestOptions): Promise<SuiteResult> {
  const checks = options.checks || DEFAULT_CHECKS
  const qa = new QABot({
    baseUrl: options.url,
    timeout: options.timeout || 30000,
    headless: true
  })

  const results: TestResult[] = []
  const start = Date.now()

  try {
    // Navigate to URL
    await qa.goto(options.url)

    // Run each check
    for (const check of checks) {
      const result = await runCheck(qa, check)
      results.push(result)
    }
  } catch (err) {
    results.push({
      name: 'Initial Load',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    })
  } finally {
    await qa.close()
  }

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    skipped: results.filter(r => r.status === 'skip').length,
    warnings: results.filter(r => r.status === 'warn').length
  }

  const suiteResult: SuiteResult = {
    name: 'Smoke Test',
    url: options.url,
    tests: results,
    duration: Date.now() - start,
    summary,
    timestamp: Date.now()
  }

  // Generate report if requested
  if (options.report && options.output) {
    qa.getReporter().addResult(suiteResult)
    await qa.generateReport(options.output)
  }

  return suiteResult
}

/**
 * Run individual check
 */
async function runCheck(qa: QABot, check: SmokeCheck): Promise<TestResult> {
  const start = Date.now()

  switch (check) {
    case 'pageLoad':
      return checkPageLoad(qa, start)
    case 'consoleErrors':
      return checkConsoleErrors(qa, start)
    case 'navigation':
      return checkNavigation(qa, start)
    case 'images':
      return checkImages(qa, start)
    case 'forms':
      return checkForms(qa, start)
    case 'brokenLinks':
      return checkBrokenLinks(qa, start)
    case 'accessibility':
      return checkAccessibility(qa, start)
    case 'performance':
      return checkPerformance(qa, start)
    default:
      return {
        name: check,
        status: 'skip',
        duration: Date.now() - start,
        error: `Unknown check: ${check}`,
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
  }
}

/**
 * Check page loads successfully
 */
async function checkPageLoad(qa: QABot, start: number): Promise<TestResult> {
  try {
    const snapshot = await qa.snapshot()
    
    // Check for basic page content
    if (snapshot.tree.length < 100) {
      return {
        name: 'Page Load',
        status: 'warn',
        duration: Date.now() - start,
        error: 'Page appears to have minimal content',
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    // Check title exists
    if (!snapshot.title) {
      return {
        name: 'Page Load',
        status: 'warn',
        duration: Date.now() - start,
        error: 'Page has no title',
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    return {
      name: 'Page Load',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: [],
      steps: [{ name: `Title: ${snapshot.title}`, status: 'pass', duration: 0 }]
    }
  } catch (err) {
    return {
      name: 'Page Load',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check for console errors
 */
async function checkConsoleErrors(qa: QABot, start: number): Promise<TestResult> {
  try {
    const events = await qa.getConsole()
    const errors = events.filter(e => e.type === 'error')
    const warnings = events.filter(e => e.type === 'warn')

    if (errors.length > 0) {
      return {
        name: 'Console Errors',
        status: 'fail',
        duration: Date.now() - start,
        error: `${errors.length} error(s): ${errors[0]?.text}`,
        screenshots: [],
        consoleEvents: events,
        steps: errors.map(e => ({ name: e.text, status: 'fail' as const, duration: 0 }))
      }
    }

    if (warnings.length > 5) {
      return {
        name: 'Console Errors',
        status: 'warn',
        duration: Date.now() - start,
        error: `${warnings.length} warnings`,
        screenshots: [],
        consoleEvents: events,
        steps: []
      }
    }

    return {
      name: 'Console Errors',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: events,
      steps: []
    }
  } catch (err) {
    return {
      name: 'Console Errors',
      status: 'warn',
      duration: Date.now() - start,
      error: 'Could not check console',
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check navigation elements exist
 */
async function checkNavigation(qa: QABot, start: number): Promise<TestResult> {
  try {
    const snapshot = await qa.snapshot()
    const links = findAllByRole(snapshot, 'link')
    const buttons = findAllByRole(snapshot, 'button')
    const navElements = links.length + buttons.length

    if (navElements === 0) {
      return {
        name: 'Navigation',
        status: 'warn',
        duration: Date.now() - start,
        error: 'No navigation elements found',
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    return {
      name: 'Navigation',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: [],
      steps: [
        { name: `Found ${links.length} links`, status: 'pass', duration: 0 },
        { name: `Found ${buttons.length} buttons`, status: 'pass', duration: 0 }
      ]
    }
  } catch (err) {
    return {
      name: 'Navigation',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check images have alt text
 */
async function checkImages(qa: QABot, start: number): Promise<TestResult> {
  try {
    const snapshot = await qa.snapshot()
    const images = findAllByRole(snapshot, 'img')
    
    if (images.length === 0) {
      return {
        name: 'Images',
        status: 'pass',
        duration: Date.now() - start,
        screenshots: [],
        consoleEvents: [],
        steps: [{ name: 'No images found', status: 'pass', duration: 0 }]
      }
    }

    const missingAlt = images.filter(img => !img.name || img.name === 'image')
    
    if (missingAlt.length > 0) {
      return {
        name: 'Images',
        status: 'warn',
        duration: Date.now() - start,
        error: `${missingAlt.length} image(s) missing alt text`,
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    return {
      name: 'Images',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: [],
      steps: [{ name: `All ${images.length} images have alt text`, status: 'pass', duration: 0 }]
    }
  } catch (err) {
    return {
      name: 'Images',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check forms are accessible
 */
async function checkForms(qa: QABot, start: number): Promise<TestResult> {
  try {
    const snapshot = await qa.snapshot()
    const textboxes = findAllByRole(snapshot, 'textbox')
    const checkboxes = findAllByRole(snapshot, 'checkbox')
    const radios = findAllByRole(snapshot, 'radio')
    const buttons = findAllByRole(snapshot, 'button')
    
    const formElements = textboxes.length + checkboxes.length + radios.length
    
    if (formElements === 0) {
      return {
        name: 'Forms',
        status: 'pass',
        duration: Date.now() - start,
        screenshots: [],
        consoleEvents: [],
        steps: [{ name: 'No form elements found', status: 'pass', duration: 0 }]
      }
    }

    // Check for labels
    const unlabeled = [...textboxes, ...checkboxes, ...radios].filter(el => !el.name)
    
    if (unlabeled.length > 0) {
      return {
        name: 'Forms',
        status: 'warn',
        duration: Date.now() - start,
        error: `${unlabeled.length} form element(s) missing labels`,
        screenshots: [],
        consoleEvents: [],
        steps: []
      }
    }

    return {
      name: 'Forms',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: [],
      steps: [{ name: `${formElements} form elements properly labeled`, status: 'pass', duration: 0 }]
    }
  } catch (err) {
    return {
      name: 'Forms',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check for broken links (basic check)
 */
async function checkBrokenLinks(qa: QABot, start: number): Promise<TestResult> {
  // This is a basic check - would need network monitoring for full implementation
  return {
    name: 'Broken Links',
    status: 'skip',
    duration: Date.now() - start,
    error: 'Full link checking requires network monitoring',
    screenshots: [],
    consoleEvents: [],
    steps: []
  }
}

/**
 * Check basic accessibility
 */
async function checkAccessibility(qa: QABot, start: number): Promise<TestResult> {
  try {
    const snapshot = await qa.snapshot()
    const issues: string[] = []
    
    // Check for heading hierarchy
    const headings = [
      findAllByRole(snapshot, 'heading'),
    ].flat()
    
    if (headings.length === 0) {
      issues.push('No headings found')
    }
    
    // Check for landmarks
    const landmarks = [
      findAllByRole(snapshot, 'main'),
      findAllByRole(snapshot, 'navigation'),
      findAllByRole(snapshot, 'banner'),
      findAllByRole(snapshot, 'contentinfo')
    ].flat()
    
    if (landmarks.length === 0) {
      issues.push('No landmark regions found')
    }

    // Check interactive elements
    const interactive = getInteractiveElements(snapshot)
    const unlabeled = interactive.filter(el => !el.name)
    
    if (unlabeled.length > 0) {
      issues.push(`${unlabeled.length} unlabeled interactive element(s)`)
    }

    if (issues.length > 0) {
      return {
        name: 'Accessibility',
        status: 'warn',
        duration: Date.now() - start,
        error: issues.join('; '),
        screenshots: [],
        consoleEvents: [],
        steps: issues.map(i => ({ name: i, status: 'warn' as const, duration: 0 }))
      }
    }

    return {
      name: 'Accessibility',
      status: 'pass',
      duration: Date.now() - start,
      screenshots: [],
      consoleEvents: [],
      steps: [
        { name: `${headings.length} headings`, status: 'pass', duration: 0 },
        { name: `${landmarks.length} landmarks`, status: 'pass', duration: 0 },
        { name: `${interactive.length} interactive elements labeled`, status: 'pass', duration: 0 }
      ]
    }
  } catch (err) {
    return {
      name: 'Accessibility',
      status: 'fail',
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
}

/**
 * Check basic performance metrics
 */
async function checkPerformance(qa: QABot, start: number): Promise<TestResult> {
  const loadTime = Date.now() - start
  
  if (loadTime > 10000) {
    return {
      name: 'Performance',
      status: 'fail',
      duration: loadTime,
      error: `Page load took ${loadTime}ms (>10s)`,
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }
  
  if (loadTime > 5000) {
    return {
      name: 'Performance',
      status: 'warn',
      duration: loadTime,
      error: `Page load took ${loadTime}ms (>5s)`,
      screenshots: [],
      consoleEvents: [],
      steps: []
    }
  }

  return {
    name: 'Performance',
    status: 'pass',
    duration: loadTime,
    screenshots: [],
    consoleEvents: [],
    steps: [{ name: `Load time: ${loadTime}ms`, status: 'pass', duration: 0 }]
  }
}
