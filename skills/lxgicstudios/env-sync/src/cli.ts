#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { generateEnvExample } from "./index";

const program = new Command();
program
  .name("ai-env-sync")
  .description("Generate .env.example from .env files")
  .version("1.0.0")
  .argument("[dir]", "Project directory", ".")
  .option("-o, --output <file>", "Output file", ".env.example")
  .action(async (dir: string, options: { output: string }) => {
    const spinner = ora("Syncing env files...").start();
    try {
      const example = await generateEnvExample(path.resolve(dir));
      fs.writeFileSync(options.output, example);
      spinner.succeed(`.env.example written to ${options.output}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
