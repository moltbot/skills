#!/usr/bin/env node
import { Command } from "commander";
import { registerAllCommands } from "./commands/index.js";

const program = new Command();

program
  .name("fitbit")
  .description("Fitbit CLI - Access your Fitbit health data")
  .version("0.1.0");

registerAllCommands(program);

program.parseAsync(process.argv).catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
