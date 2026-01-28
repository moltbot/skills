#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generatePitch } from "./index";

const program = new Command();
program
  .name("ai-pitch")
  .description("Generate startup pitch deck content")
  .version("1.0.0")
  .argument("<idea>", "Your startup idea description")
  .option("-o, --output <file>", "Output file", "pitch.md")
  .action(async (idea: string, options: { output: string }) => {
    const spinner = ora("Building your pitch...").start();
    try {
      const pitch = await generatePitch(idea);
      fs.writeFileSync(options.output, pitch);
      spinner.succeed(`Pitch written to ${options.output}`);
      console.log("\n" + pitch);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
