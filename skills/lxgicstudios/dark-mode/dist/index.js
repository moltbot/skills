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
exports.addDarkMode = addDarkMode;
exports.processDirectory = processDirectory;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const openai = new openai_1.default();
async function addDarkMode(filePath) {
    const absPath = path.resolve(filePath);
    const content = fs.readFileSync(absPath, "utf-8");
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a frontend expert. Add dark mode support to the given component.
Rules:
- Use CSS variables, Tailwind dark: prefix, or prefers-color-scheme depending on the existing approach
- Ensure all colors, backgrounds, borders, and shadows have dark variants
- Maintain contrast ratios for accessibility (WCAG AA minimum)
- Keep original light mode styling intact
- Return ONLY the modified file content, no explanations`
            },
            { role: "user", content: `File: ${path.basename(absPath)}\n\n${content}` }
        ],
        temperature: 0.3,
    });
    const result = response.choices[0].message.content?.trim() || content;
    return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
async function processDirectory(dirPath) {
    const absDir = path.resolve(dirPath);
    const results = [];
    const extensions = [".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss"];
    const files = fs.readdirSync(absDir).filter(f => extensions.some(ext => f.endsWith(ext)));
    for (const file of files) {
        try {
            const filePath = path.join(absDir, file);
            const result = await addDarkMode(filePath);
            fs.writeFileSync(filePath, result, "utf-8");
            results.push({ file, status: "updated" });
        }
        catch (err) {
            results.push({ file, status: `error: ${err.message}` });
        }
    }
    return results;
}
