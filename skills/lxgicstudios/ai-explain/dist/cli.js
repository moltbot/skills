#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("ai-explain")
    .description("Explain any code file in simple terms")
    .version("1.0.0")
    .argument("<file>", "Code file to explain")
    .option("-l, --level <level>", "Explanation level: beginner, intermediate, expert", "beginner")
    .action(async (file, options) => {
    const spinner = (0, ora_1.default)("Reading and analyzing code...").start();
    try {
        const explanation = await (0, index_1.explainCode)(file, options.level);
        spinner.succeed("Here's what this code does:\n");
        console.log(explanation);
    }
    catch (err) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
