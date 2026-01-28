/**
 * Test assertions for web QA
 */

import type { Snapshot, ConsoleEvent } from './types.js'
import { findByRole, findByText, elementExists, detectModals } from './utils/snapshot.js'

export class AssertionError extends Error {
  constructor(message: string, public actual?: unknown, public expected?: unknown) {
    super(message)
    this.name = 'AssertionError'
  }
}

/**
 * Assert element is visible in snapshot
 */
export function expectVisible(snapshot: Snapshot, selector: string): void {
  if (!elementExists(snapshot, selector)) {
    throw new AssertionError(
      `Element not visible: ${selector}`,
      'not found',
      'visible'
    )
  }
}

/**
 * Assert element is NOT visible
 */
export function expectNotVisible(snapshot: Snapshot, selector: string): void {
  if (elementExists(snapshot, selector)) {
    throw new AssertionError(
      `Element should not be visible: ${selector}`,
      'visible',
      'not visible'
    )
  }
}

/**
 * Assert element has text
 */
export function expectText(
  snapshot: Snapshot,
  selector: string,
  text: string,
  options: { contains?: boolean } = {}
): void {
  let found: { name: string } | undefined
  
  if (selector.startsWith('@')) {
    found = snapshot.refs.get(selector)
  } else {
    found = findByText(snapshot, selector)
  }
  
  if (!found) {
    throw new AssertionError(
      `Element not found: ${selector}`,
      'not found',
      text
    )
  }
  
  const actual = found.name
  const matches = options.contains 
    ? actual.toLowerCase().includes(text.toLowerCase())
    : actual.toLowerCase() === text.toLowerCase()
  
  if (!matches) {
    throw new AssertionError(
      `Text mismatch for ${selector}`,
      actual,
      text
    )
  }
}

/**
 * Assert URL matches
 */
export function expectUrl(
  snapshot: Snapshot,
  expected: string | { contains?: string; matches?: RegExp }
): void {
  const actual = snapshot.url
  
  if (typeof expected === 'string') {
    if (actual !== expected) {
      throw new AssertionError('URL mismatch', actual, expected)
    }
  } else if (expected.contains) {
    if (!actual.includes(expected.contains)) {
      throw new AssertionError(
        `URL does not contain expected string`,
        actual,
        expected.contains
      )
    }
  } else if (expected.matches) {
    if (!expected.matches.test(actual)) {
      throw new AssertionError(
        `URL does not match pattern`,
        actual,
        expected.matches.toString()
      )
    }
  }
}

/**
 * Assert element count
 */
export function expectCount(
  snapshot: Snapshot,
  role: string,
  expected: number | { min?: number; max?: number }
): void {
  let count = 0
  for (const [key, ref] of snapshot.refs) {
    if (key.startsWith('@') && ref.role.toLowerCase() === role.toLowerCase()) {
      count++
    }
  }
  
  if (typeof expected === 'number') {
    if (count !== expected) {
      throw new AssertionError(
        `Element count mismatch for role "${role}"`,
        count,
        expected
      )
    }
  } else {
    if (expected.min !== undefined && count < expected.min) {
      throw new AssertionError(
        `Too few elements with role "${role}"`,
        count,
        `at least ${expected.min}`
      )
    }
    if (expected.max !== undefined && count > expected.max) {
      throw new AssertionError(
        `Too many elements with role "${role}"`,
        count,
        `at most ${expected.max}`
      )
    }
  }
}

/**
 * Assert no console errors
 */
export function expectNoErrors(events: ConsoleEvent[]): void {
  const errors = events.filter(e => e.type === 'error')
  
  if (errors.length > 0) {
    const messages = errors.map(e => e.text).join('\n')
    throw new AssertionError(
      `Console errors detected:\n${messages}`,
      errors.length,
      0
    )
  }
}

/**
 * Assert console event matches pattern
 */
export function expectConsoleEvent(
  events: ConsoleEvent[],
  pattern: string | RegExp
): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  const found = events.some(e => regex.test(e.text))
  
  if (!found) {
    throw new AssertionError(
      `Console event not found: ${pattern}`,
      'not found',
      pattern.toString()
    )
  }
}

/**
 * Assert element has state
 */
export function expectState(
  snapshot: Snapshot,
  selector: string,
  state: 'disabled' | 'checked' | 'selected' | 'expanded' | 'pressed',
  expected: boolean = true
): void {
  const ref = selector.startsWith('@') 
    ? snapshot.refs.get(selector)
    : findByText(snapshot, selector)
  
  if (!ref) {
    throw new AssertionError(
      `Element not found: ${selector}`,
      'not found',
      state
    )
  }
  
  const actual = ref.state?.[state] ?? false
  
  if (actual !== expected) {
    throw new AssertionError(
      `Element ${selector} state "${state}" mismatch`,
      actual,
      expected
    )
  }
}

/**
 * Assert modal is present/absent
 */
export function expectModal(snapshot: Snapshot, present: boolean = true): void {
  const modals = detectModals(snapshot)
  
  if (present && modals.length === 0) {
    throw new AssertionError(
      'Expected modal to be present',
      'no modal',
      'modal visible'
    )
  }
  
  if (!present && modals.length > 0) {
    throw new AssertionError(
      'Expected no modal to be present',
      `${modals.length} modal(s)`,
      'no modal'
    )
  }
}

/**
 * Assert page title
 */
export function expectTitle(snapshot: Snapshot, title: string, options: { contains?: boolean } = {}): void {
  const actual = snapshot.title
  const matches = options.contains
    ? actual.toLowerCase().includes(title.toLowerCase())
    : actual.toLowerCase() === title.toLowerCase()
  
  if (!matches) {
    throw new AssertionError(
      'Page title mismatch',
      actual,
      title
    )
  }
}

/**
 * Assert element is interactive (clickable)
 */
export function expectClickable(snapshot: Snapshot, selector: string): void {
  const ref = selector.startsWith('@')
    ? snapshot.refs.get(selector)
    : findByText(snapshot, selector)
  
  if (!ref) {
    throw new AssertionError(
      `Element not found: ${selector}`,
      'not found',
      'clickable'
    )
  }
  
  const clickableRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'switch']
  
  if (!clickableRoles.includes(ref.role.toLowerCase())) {
    throw new AssertionError(
      `Element ${selector} is not clickable`,
      ref.role,
      'clickable role'
    )
  }
  
  if (ref.state?.disabled) {
    throw new AssertionError(
      `Element ${selector} is disabled`,
      'disabled',
      'enabled'
    )
  }
}

/**
 * Soft assertion (returns result instead of throwing)
 */
export function softExpect<T>(
  fn: () => T
): { ok: true; value: T } | { ok: false; error: Error } {
  try {
    const value = fn()
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
