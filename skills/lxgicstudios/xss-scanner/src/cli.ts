#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { scanDirectory, analyzeForXSS } from "./index";

const program = new Command();

program
  .name("ai-xss-check")
  .description("Detect XSS vulnerabilities in frontend code using AI")
  .version("1.0.0")
  .argument("[directory]", "Directory to scan", ".")
  .action(async (directory: string) => {
    const spinner = ora("Scanning for XSS vulnerabilities...").start();
    try {
      const codeChunks = await scanDirectory(directory);
      if (codeChunks.length === 0) {
        spinner.warn("No source files found.");
        return;
      }
      spinner.text = `Analyzing ${codeChunks.length} file(s) with AI...`;
      const analysis = await analyzeForXSS(codeChunks);
      spinner.succeed("XSS Analysis Complete:");
      console.log(`\n${analysis}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
