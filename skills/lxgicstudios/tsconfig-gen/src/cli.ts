#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateTsconfig } from "./index";

const program = new Command();
program
  .name("ai-tsconfig")
  .description("Generate optimal tsconfig.json")
  .version("1.0.0")
  .argument("<type>", "Project type: next, node, react, library, express, deno")
  .option("-o, --output <file>", "Output file", "tsconfig.json")
  .action(async (type: string, options: { output: string }) => {
    const spinner = ora("Generating tsconfig...").start();
    try {
      const config = await generateTsconfig(type);
      fs.writeFileSync(options.output, config);
      spinner.succeed(`tsconfig.json written to ${options.output}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
