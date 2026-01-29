#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { generateCSP } from "./index";

const program = new Command();
program
  .name("ai-csp")
  .description("Generate Content Security Policy headers")
  .version("1.0.0")
  .argument("[dir]", "Project directory", ".")
  .option("-o, --output <file>", "Output file", "csp-config.md")
  .action(async (dir: string, options: { output: string }) => {
    const spinner = ora("Generating CSP headers...").start();
    try {
      const csp = await generateCSP(path.resolve(dir));
      fs.writeFileSync(options.output, csp);
      spinner.succeed(`CSP config written to ${options.output}`);
      console.log("\n" + csp);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
