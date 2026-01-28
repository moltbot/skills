#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { generate } from "./index";

const program = new Command();
program
  .name("ai-upload")
  .description("Generate file upload handling code")
  .version("1.0.0")
  .argument("<description>", "Description of upload requirements")
  .action(async (input: string) => {
    const spinner = ora("Generating...").start();
    try {
      const result = await generate(input);
      spinner.succeed("Done:\n");
      console.log(result);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
