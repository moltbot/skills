#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("ai-dark-mode")
    .description("Add dark mode support to components using AI")
    .version("1.0.0")
    .argument("<path>", "File or directory to add dark mode to")
    .option("--dry-run", "Print result without writing", false)
    .action(async (targetPath, options) => {
    const absPath = path.resolve(targetPath);
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
        const spinner = (0, ora_1.default)("Adding dark mode to directory...").start();
        try {
            const results = await (0, index_1.processDirectory)(targetPath);
            spinner.succeed("Dark mode added!");
            results.forEach(r => console.log(`  ${r.file}: ${r.status}`));
        }
        catch (err) {
            spinner.fail(`Error: ${err.message}`);
            process.exit(1);
        }
    }
    else {
        const spinner = (0, ora_1.default)("Adding dark mode...").start();
        try {
            const result = await (0, index_1.addDarkMode)(targetPath);
            spinner.succeed("Dark mode added!");
            if (options.dryRun) {
                console.log("\n" + result);
            }
            else {
                fs.writeFileSync(absPath, result, "utf-8");
                console.log(`  Updated ${targetPath}`);
            }
        }
        catch (err) {
            spinner.fail(`Error: ${err.message}`);
            process.exit(1);
        }
    }
});
program.parse();
