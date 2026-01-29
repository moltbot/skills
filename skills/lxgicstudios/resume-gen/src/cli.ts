#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateResume } from "./index";

const program = new Command();
program
  .name("ai-resume")
  .description("Generate developer resumes with AI")
  .version("1.0.0")
  .argument("<description>", "Role and experience description")
  .option("-o, --output <file>", "Output file", "resume.md")
  .action(async (description: string, options: { output: string }) => {
    const spinner = ora("Crafting your resume...").start();
    try {
      const resume = await generateResume(description);
      fs.writeFileSync(options.output, resume);
      spinner.succeed(`Resume written to ${options.output}`);
      console.log("\n" + resume);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
