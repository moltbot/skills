#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateCors } from "./index";

const program = new Command();
program
  .name("ai-cors")
  .description("Generate CORS configuration")
  .version("1.0.0")
  .argument("<description>", "Describe your setup (origins, ports, etc)")
  .option("-o, --output <file>", "Output file", "cors-config.md")
  .action(async (description: string, options: { output: string }) => {
    const spinner = ora("Generating CORS config...").start();
    try {
      const config = await generateCors(description);
      fs.writeFileSync(options.output, config);
      spinner.succeed(`CORS config written to ${options.output}`);
      console.log("\n" + config);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
