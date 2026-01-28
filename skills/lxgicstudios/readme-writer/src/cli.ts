#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { generateReadme } from "./index";

const program = new Command();
program
  .name("ai-readme")
  .description("Generate beautiful README.md with badges, install, usage, API docs")
  .version("1.0.0")
  .argument("[dir]", "Project directory", ".")
  .option("-o, --output <file>", "Output file", "README.md")
  .action(async (dir: string, options: { output: string }) => {
    const spinner = ora("Generating README...").start();
    try {
      const readme = await generateReadme(path.resolve(dir));
      fs.writeFileSync(options.output, readme);
      spinner.succeed(`README written to ${options.output}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
