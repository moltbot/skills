import { promises as fs } from "node:fs";
import Table from "cli-table3";
import chalk from "chalk";

export interface OutputOptions {
  json?: boolean;
  noColor?: boolean;
  output?: string;
}

// Simple styler interface for the subset of chalk we use
export interface Styler {
  bold: (s: string) => string;
  green: (s: string) => string;
  yellow: (s: string) => string;
  red: (s: string) => string;
  underline: (s: string) => string;
}

const noopStyler: Styler = {
  bold: (s) => s,
  green: (s) => s,
  yellow: (s) => s,
  red: (s) => s,
  underline: (s) => s,
};

export function createStyler(options: OutputOptions): Styler {
  if (options.noColor) {
    return noopStyler;
  }
  return {
    bold: (s) => chalk.bold(s),
    green: (s) => chalk.green(s),
    yellow: (s) => chalk.yellow(s),
    red: (s) => chalk.red(s),
    underline: (s) => chalk.underline(s),
  };
}

export async function writeOutput(value: unknown, options: OutputOptions): Promise<void> {
  const text = options.json ? JSON.stringify(value, null, 2) : String(value);
  if (options.output) {
    await fs.writeFile(options.output, text, "utf8");
    return;
  }
  console.log(text);
}

export function keyValueTable(rows: Array<{ key: string; value: string }>): string {
  const table = new Table({ colWidths: [24, 60], wordWrap: true });
  rows.forEach((row) => table.push([row.key, row.value]));
  return table.toString();
}

export function listTable(headers: string[], rows: Array<string[]>): string {
  const table = new Table({ head: headers });
  rows.forEach((row) => table.push(row));
  return table.toString();
}
