#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { collectFiles, generateQuestions } from "./index";
import { writeFileSync } from "fs";

const program = new Command();
program
  .name("ai-interview")
  .description("Generate interview questions from your codebase")
  .version("1.0.0")
  .argument("<dir>", "Source directory to analyze")
  .option("-l, --level <level>", "Difficulty: junior, mid, senior", "mid")
  .option("-n, --count <number>", "Number of questions", "10")
  .option("-o, --output <path>", "Save to file")
  .action(async (dir: string, options: { level: string; count: string; output?: string }) => {
    const spinner = ora("Analyzing codebase...").start();
    try {
      const files = collectFiles(dir);
      if (files.length === 0) throw new Error("No source files found");
      spinner.text = `Generating ${options.count} ${options.level}-level questions...`;
      const questions = await generateQuestions(files, options.level, parseInt(options.count));
      spinner.succeed(`Generated ${options.count} interview questions\n`);
      console.log(questions);
      if (options.output) {
        writeFileSync(options.output, questions);
        console.log(`\nSaved to ${options.output}`);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
