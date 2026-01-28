/**
 * Report generation for QA results
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import type { SuiteResult, TestResult, ReportOptions, ConsoleEvent } from './types.js'

export class Reporter {
  private results: SuiteResult[] = []

  /**
   * Add suite result
   */
  addResult(result: SuiteResult): void {
    this.results.push(result)
  }

  /**
   * Generate report in specified format
   */
  async generate(options: ReportOptions): Promise<string> {
    const format = options.format || this.inferFormat(options.output)
    
    switch (format) {
      case 'markdown':
        return this.generateMarkdown(options)
      case 'pdf':
        return this.generatePdf(options)
      case 'json':
        return this.generateJson(options)
      default:
        throw new Error(`Unknown format: ${format}`)
    }
  }

  /**
   * Infer format from file extension
   */
  private inferFormat(output: string): ReportOptions['format'] {
    if (output.endsWith('.pdf')) return 'pdf'
    if (output.endsWith('.json')) return 'json'
    return 'markdown'
  }

  /**
   * Generate markdown report
   */
  private generateMarkdown(options: ReportOptions): string {
    const title = options.title || 'QA Test Report'
    const timestamp = new Date().toISOString()
    
    let md = `# ${title}\n\n`
    md += `**Generated:** ${timestamp}\n\n`
    
    // Overall summary
    const totals = this.calculateTotals()
    md += `## Summary\n\n`
    md += `| Metric | Value |\n`
    md += `|--------|-------|\n`
    md += `| Total Tests | ${totals.total} |\n`
    md += `| Passed | ${totals.passed} |\n`
    md += `| Failed | ${totals.failed} |\n`
    md += `| Skipped | ${totals.skipped} |\n`
    md += `| Warnings | ${totals.warnings} |\n`
    md += `| Pass Rate | ${totals.total > 0 ? ((totals.passed / totals.total) * 100).toFixed(1) : 0}% |\n\n`
    
    // Suite results
    for (const suite of this.results) {
      md += `## ${suite.name}\n\n`
      md += `**URL:** ${suite.url}\n`
      md += `**Duration:** ${(suite.duration / 1000).toFixed(2)}s\n\n`
      
      // Test results table
      md += `| Test | Status | Duration | Notes |\n`
      md += `|------|--------|----------|-------|\n`
      
      for (const test of suite.tests) {
        const status = this.statusEmoji(test.status)
        const duration = `${test.duration}ms`
        const notes = test.knownIssue 
          ? `Known issue: ${test.knownIssue}`
          : test.error 
            ? test.error.slice(0, 50)
            : ''
        
        md += `| ${test.name} | ${status} | ${duration} | ${notes} |\n`
      }
      
      md += '\n'
      
      // Failed tests details
      const failed = suite.tests.filter(t => t.status === 'fail')
      if (failed.length > 0) {
        md += `### Failed Tests\n\n`
        for (const test of failed) {
          md += `#### ${test.name}\n\n`
          if (test.error) {
            md += `**Error:** ${test.error}\n\n`
          }
          
          // Step details
          if (test.steps.length > 0) {
            md += `**Steps:**\n\n`
            for (const step of test.steps) {
              const icon = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '○'
              md += `${icon} ${step.name}`
              if (step.error) {
                md += ` - ${step.error}`
              }
              md += '\n'
            }
            md += '\n'
          }
          
          // Console errors
          const errors = test.consoleEvents.filter(e => e.type === 'error')
          if (errors.length > 0) {
            md += `**Console Errors:**\n\n`
            for (const error of errors.slice(0, 5)) {
              md += `- \`${error.text}\`\n`
            }
            if (errors.length > 5) {
              md += `- ... and ${errors.length - 5} more\n`
            }
            md += '\n'
          }
          
          // Screenshots
          if (options.includeScreenshots && test.screenshots.length > 0) {
            md += `**Screenshots:**\n\n`
            for (const screenshot of test.screenshots) {
              md += `![${test.name}](${screenshot})\n`
            }
            md += '\n'
          }
        }
      }
      
      // Console summary
      const allErrors = suite.tests.flatMap(t => t.consoleEvents.filter(e => e.type === 'error'))
      if (allErrors.length > 0) {
        md += `### Console Errors Summary\n\n`
        const unique = [...new Set(allErrors.map(e => e.text))]
        for (const error of unique.slice(0, 10)) {
          md += `- \`${error}\`\n`
        }
        if (unique.length > 10) {
          md += `- ... and ${unique.length - 10} more unique errors\n`
        }
        md += '\n'
      }
    }
    
    // Write to file
    writeFileSync(options.output, md)
    return options.output
  }

  /**
   * Generate PDF report using ai-pdf-builder
   */
  private generatePdf(options: ReportOptions): string {
    // First generate markdown
    const mdPath = options.output.replace('.pdf', '.md')
    this.generateMarkdown({ ...options, output: mdPath })
    
    // Convert to PDF using ai-pdf-builder
    const company = options.company || 'QA Report'
    
    try {
      execSync(
        `npx ai-pdf-builder generate report "${mdPath}" -o "${options.output}" --company "${company}"`,
        { stdio: 'pipe' }
      )
      return options.output
    } catch (err: any) {
      // Fallback: just return the markdown
      console.warn('PDF generation failed, falling back to markdown:', err.message)
      return mdPath
    }
  }

  /**
   * Generate JSON report
   */
  private generateJson(options: ReportOptions): string {
    const report = {
      title: options.title || 'QA Test Report',
      timestamp: new Date().toISOString(),
      summary: this.calculateTotals(),
      suites: this.results
    }
    
    writeFileSync(options.output, JSON.stringify(report, null, 2))
    return options.output
  }

  /**
   * Calculate totals across all suites
   */
  private calculateTotals(): {
    total: number
    passed: number
    failed: number
    skipped: number
    warnings: number
  } {
    return this.results.reduce(
      (acc, suite) => ({
        total: acc.total + suite.summary.total,
        passed: acc.passed + suite.summary.passed,
        failed: acc.failed + suite.summary.failed,
        skipped: acc.skipped + suite.summary.skipped,
        warnings: acc.warnings + suite.summary.warnings
      }),
      { total: 0, passed: 0, failed: 0, skipped: 0, warnings: 0 }
    )
  }

  /**
   * Get status emoji
   */
  private statusEmoji(status: string): string {
    switch (status) {
      case 'pass': return 'PASS'
      case 'fail': return 'FAIL'
      case 'skip': return 'SKIP'
      case 'warn': return 'WARN'
      default: return status
    }
  }

  /**
   * Get results
   */
  getResults(): SuiteResult[] {
    return this.results
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = []
  }
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

/**
 * Quick report from results file
 */
export async function generateReportFromFile(
  resultsPath: string,
  options: ReportOptions
): Promise<string> {
  const data = JSON.parse(readFileSync(resultsPath, 'utf-8'))
  
  const reporter = new Reporter()
  for (const suite of data.suites || [data]) {
    reporter.addResult(suite)
  }
  
  return reporter.generate(options)
}
