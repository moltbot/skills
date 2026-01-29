#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { generateRateLimitConfig } from "./index";

const program = new Command();

program
  .name("ai-rate-limit")
  .description("Generate rate limiting configurations using AI")
  .version("1.0.0")
  .argument("<requirement>", "Rate limiting requirement in plain English")
  .action(async (requirement: string) => {
    const spinner = ora("Generating rate limit config...").start();
    try {
      const config = await generateRateLimitConfig(requirement);
      spinner.succeed("Rate Limit Config Generated:");
      console.log(`\n${config}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
