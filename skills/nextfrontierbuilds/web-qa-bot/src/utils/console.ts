/**
 * Console monitoring utilities
 */

import type { ConsoleEvent } from '../types.js'

export class ConsoleMonitor {
  private events: ConsoleEvent[] = []
  private patterns: Map<string, RegExp> = new Map()
  private matchedPatterns: Set<string> = new Set()

  /**
   * Add a console event
   */
  addEvent(event: ConsoleEvent): void {
    this.events.push(event)
    
    // Check against registered patterns
    for (const [name, pattern] of this.patterns) {
      if (pattern.test(event.text)) {
        this.matchedPatterns.add(name)
      }
    }
  }

  /**
   * Parse console output from agent-browser
   */
  parseAgentBrowserConsole(output: string): ConsoleEvent[] {
    const events: ConsoleEvent[] = []
    const lines = output.split('\n')
    
    for (const line of lines) {
      // Format: [type] message (source:line)
      const match = line.match(/^\[(\w+)\]\s+(.+?)(?:\s+\((.+?):(\d+)\))?$/)
      if (match) {
        events.push({
          type: match[1].toLowerCase() as ConsoleEvent['type'],
          text: match[2],
          timestamp: Date.now(),
          source: match[3],
          line: match[4] ? parseInt(match[4], 10) : undefined
        })
      } else if (line.trim()) {
        // Unknown format, treat as log
        events.push({
          type: 'log',
          text: line.trim(),
          timestamp: Date.now()
        })
      }
    }
    
    return events
  }

  /**
   * Register a pattern to watch for
   */
  watchFor(name: string, pattern: string | RegExp): void {
    this.patterns.set(name, typeof pattern === 'string' ? new RegExp(pattern) : pattern)
  }

  /**
   * Check if a pattern was matched
   */
  wasMatched(name: string): boolean {
    return this.matchedPatterns.has(name)
  }

  /**
   * Get all events
   */
  getEvents(): ConsoleEvent[] {
    return [...this.events]
  }

  /**
   * Get events since a timestamp
   */
  getEventsSince(timestamp: number): ConsoleEvent[] {
    return this.events.filter(e => e.timestamp >= timestamp)
  }

  /**
   * Get errors only
   */
  getErrors(): ConsoleEvent[] {
    return this.events.filter(e => e.type === 'error')
  }

  /**
   * Get warnings only
   */
  getWarnings(): ConsoleEvent[] {
    return this.events.filter(e => e.type === 'warn')
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.events.some(e => e.type === 'error')
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
    this.matchedPatterns.clear()
  }

  /**
   * Format events for report
   */
  formatForReport(): string {
    if (this.events.length === 0) {
      return 'No console events captured.'
    }
    
    const grouped = {
      error: this.getErrors(),
      warn: this.getWarnings(),
      log: this.events.filter(e => e.type === 'log' || e.type === 'info')
    }
    
    let output = ''
    
    if (grouped.error.length > 0) {
      output += `### Errors (${grouped.error.length})\n\n`
      for (const event of grouped.error) {
        output += `- \`${event.text}\``
        if (event.source) {
          output += ` (${event.source}:${event.line})`
        }
        output += '\n'
      }
      output += '\n'
    }
    
    if (grouped.warn.length > 0) {
      output += `### Warnings (${grouped.warn.length})\n\n`
      for (const event of grouped.warn) {
        output += `- \`${event.text}\`\n`
      }
      output += '\n'
    }
    
    return output
  }
}

/**
 * Filter console events by severity
 */
export function filterBySeverity(
  events: ConsoleEvent[],
  minSeverity: 'error' | 'warn' | 'info' | 'log' | 'debug'
): ConsoleEvent[] {
  const severityOrder = ['debug', 'log', 'info', 'warn', 'error']
  const minIndex = severityOrder.indexOf(minSeverity)
  
  return events.filter(e => severityOrder.indexOf(e.type) >= minIndex)
}

/**
 * Detect common error patterns
 */
export function categorizeError(text: string): string {
  const patterns: [RegExp, string][] = [
    [/CORS/i, 'cors'],
    [/404|not found/i, 'not-found'],
    [/500|internal server/i, 'server-error'],
    [/network|fetch|xhr/i, 'network'],
    [/undefined|null|TypeError/i, 'runtime'],
    [/hydration/i, 'hydration'],
    [/chunk|module/i, 'loading'],
    [/websocket|socket/i, 'websocket']
  ]
  
  for (const [pattern, category] of patterns) {
    if (pattern.test(text)) {
      return category
    }
  }
  
  return 'unknown'
}
