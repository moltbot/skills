"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleFiles = sampleFiles;
exports.generateConfig = generateConfig;
const openai_1 = __importDefault(require("openai"));
const fs_1 = require("fs");
const path_1 = require("path");
const openai = new openai_1.default();
function sampleFiles(dir, max = 10) {
    const files = [];
    const walk = (d) => {
        if (files.length >= max)
            return;
        for (const entry of (0, fs_1.readdirSync)(d)) {
            if (entry.startsWith(".") || entry === "node_modules" || entry === "dist")
                continue;
            const full = (0, path_1.join)(d, entry);
            if ((0, fs_1.statSync)(full).isDirectory())
                walk(full);
            else if ([".ts", ".js", ".tsx", ".jsx"].includes((0, path_1.extname)(full)))
                files.push(full);
        }
    };
    walk(dir);
    return files;
}
async function generateConfig(files, format) {
    const samples = files.map(f => (0, fs_1.readFileSync)(f, "utf-8").slice(0, 800)).join("\n---\n").slice(0, 8000);
    let pkgContent = "{}";
    try {
        pkgContent = (0, fs_1.readFileSync)((0, path_1.join)(process.cwd(), "package.json"), "utf-8");
    }
    catch { }
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: `You analyze code samples and generate an ESLint config that matches the project's existing patterns.
Detect: semicolons, quotes, indentation, trailing commas, naming conventions, import style.
Output format: ${format} (json or flat for eslint.config.js).
Include appropriate plugins (typescript-eslint if TS, react if JSX).
Return ONLY the config file content.` },
            { role: "user", content: `package.json:\n${pkgContent}\n\nCode samples:\n${samples}` }
        ],
        temperature: 0.3,
    });
    return response.choices[0].message.content?.trim() || "";
}
