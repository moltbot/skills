/**
 * Wait utilities with retry logic
 */

import type { WaitStrategy } from '../types.js'

export interface WaitOptions {
  timeout?: number
  interval?: number
  message?: string
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 30000, interval = 100, message = 'Condition not met' } = options
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    try {
      if (await condition()) {
        return
      }
    } catch {
      // Condition threw, keep trying
    }
    await sleep(interval)
  }
  
  throw new Error(`Timeout: ${message} (waited ${timeout}ms)`)
}

/**
 * Wait with exponential backoff retry
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 100, backoff = 2 } = options
  let lastError: Error | undefined
  let currentDelay = delay
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (i < retries) {
        await sleep(currentDelay)
        currentDelay *= backoff
      }
    }
  }
  
  throw lastError
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convert wait strategy to agent-browser args
 */
export function waitStrategyToArgs(strategy: WaitStrategy): string[] {
  switch (strategy) {
    case 'networkidle':
      return ['--wait', 'networkidle']
    case 'domcontentloaded':
      return ['--wait', 'domcontentloaded']
    case 'none':
      return []
    case 'auto':
    default:
      return ['--wait', 'load']
  }
}

/**
 * Detect if page is still loading based on snapshot
 */
export function isPageLoading(snapshotText: string): boolean {
  const loadingPatterns = [
    /loading/i,
    /spinner/i,
    /skeleton/i,
    /please wait/i,
    /fetching/i
  ]
  
  return loadingPatterns.some(pattern => pattern.test(snapshotText))
}

/**
 * Wait for page to stop loading
 */
export async function waitForStableSnapshot(
  getSnapshot: () => Promise<string>,
  options: { timeout?: number; stableTime?: number } = {}
): Promise<string> {
  const { timeout = 10000, stableTime = 500 } = options
  const start = Date.now()
  let lastSnapshot = ''
  let stableSince = 0
  
  while (Date.now() - start < timeout) {
    const snapshot = await getSnapshot()
    
    if (snapshot === lastSnapshot) {
      if (stableSince === 0) {
        stableSince = Date.now()
      } else if (Date.now() - stableSince >= stableTime) {
        return snapshot
      }
    } else {
      lastSnapshot = snapshot
      stableSince = 0
    }
    
    await sleep(100)
  }
  
  return lastSnapshot
}
