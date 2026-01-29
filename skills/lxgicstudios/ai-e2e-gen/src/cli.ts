#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateTests } from "./index";

const program = new Command();

program
  .name("ai-e2e-gen")
  .description("Generate Playwright e2e tests from a URL or component file")
  .version("1.0.0")
  .argument("<input>", "URL, file path, or description")
  .option("-o, --output <file>", "Write tests to file")
  .option("-f, --framework <fw>", "Test framework: playwright, cypress", "playwright")
  .action(async (input: string, options: { output?: string; framework: string }) => {
    const spinner = ora("Generating e2e tests...").start();
    try {
      const tests = await generateTests(input, options.framework);
      spinner.succeed("Tests generated!");
      if (options.output) {
        fs.writeFileSync(options.output, tests);
        console.log(`  Written to ${options.output}`);
      } else {
        console.log("\n" + tests);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
