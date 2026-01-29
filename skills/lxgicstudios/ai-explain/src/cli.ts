#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { explainCode } from "./index";

const program = new Command();

program
  .name("ai-explain")
  .description("Explain any code file in simple terms")
  .version("1.0.0")
  .argument("<file>", "Code file to explain")
  .option("-l, --level <level>", "Explanation level: beginner, intermediate, expert", "beginner")
  .action(async (file: string, options: { level: string }) => {
    const spinner = ora("Reading and analyzing code...").start();
    try {
      const explanation = await explainCode(file, options.level);
      spinner.succeed("Here's what this code does:\n");
      console.log(explanation);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
