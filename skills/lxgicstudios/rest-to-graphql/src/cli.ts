#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { generate } from "./index";

const program = new Command();
program
  .name("ai-rest-to-graphql")
  .description("Convert REST API routes to a GraphQL schema")
  .version("1.0.0")
  .argument("<path>", "Path to REST routes directory or file")
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
