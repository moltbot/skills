#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { scanDirectory, analyzeForSQLInjection } from "./index";

const program = new Command();

program
  .name("ai-sql-check")
  .description("Detect SQL injection vulnerabilities using AI")
  .version("1.0.0")
  .argument("[directory]", "Directory to scan", ".")
  .action(async (directory: string) => {
    const spinner = ora("Scanning for SQL injection vulnerabilities...").start();
    try {
      const codeChunks = await scanDirectory(directory);
      if (codeChunks.length === 0) {
        spinner.warn("No source files found.");
        return;
      }
      spinner.text = `Analyzing ${codeChunks.length} file(s) with AI...`;
      const analysis = await analyzeForSQLInjection(codeChunks);
      spinner.succeed("SQL Injection Analysis Complete:");
      console.log(`\n${analysis}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
