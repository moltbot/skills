#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { generate } from "./index";

const program = new Command();

program
  .name("ai-snippet")
  .description("Generate VS Code snippets from code patterns in your project")
  .version("1.0.0")
  .argument("<directory>", "Directory to scan for patterns")
  .action(async (directory: string) => {
    const spinner = ora("Generating...").start();
    try {
      const result = await generate(directory);
      spinner.succeed("Done:\n");
      console.log(result);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
