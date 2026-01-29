#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateSchema } from "./index";

const program = new Command();

program
  .name("ai-schema")
  .description("Generate database schema from plain English")
  .version("1.0.0")
  .argument("<description>", "Describe your data model")
  .option("-d, --dialect <dialect>", "SQL dialect: postgresql, mysql, sqlite", "postgresql")
  .option("-o, --output <file>", "Write schema to file")
  .action(async (description: string, options: { dialect: string; output?: string }) => {
    const spinner = ora("Generating schema...").start();
    try {
      const schema = await generateSchema(description, options.dialect);
      spinner.succeed("Schema generated!\n");
      if (options.output) {
        fs.writeFileSync(options.output, schema);
        console.log(`  Written to ${options.output}`);
      } else {
        console.log(schema);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
