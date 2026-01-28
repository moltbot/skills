#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { sampleFiles, generateConfig } from "./index";
import { writeFileSync } from "fs";

const program = new Command();
program
  .name("ai-eslint-config")
  .description("Generate ESLint config from your codebase patterns")
  .version("1.0.0")
  .option("-f, --format <type>", "Config format: json or flat", "flat")
  .option("-d, --dir <path>", "Source directory to analyze", ".")
  .action(async (options: { format: string; dir: string }) => {
    const spinner = ora("Sampling codebase...").start();
    try {
      const files = sampleFiles(options.dir);
      if (files.length === 0) throw new Error("No source files found");
      spinner.text = `Analyzing ${files.length} files...`;
      const config = await generateConfig(files, options.format);
      const outFile = options.format === "json" ? ".eslintrc.json" : "eslint.config.js";
      writeFileSync(outFile, config);
      spinner.succeed(`ESLint config written to ${outFile}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
