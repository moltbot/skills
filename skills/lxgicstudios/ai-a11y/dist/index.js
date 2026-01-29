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
exports.scanFile = scanFile;
exports.scanDirectory = scanDirectory;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const openai = new openai_1.default();
async function scanFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a WCAG 2.1 accessibility expert. Scan the provided HTML/JSX code for accessibility issues. For each issue:
- State the problem (missing alt text, no label, poor contrast hint, etc.)
- Reference the WCAG criterion
- Provide the fix (actual code)
Be thorough but concise. If the code has no issues, say so.`
            },
            { role: "user", content: `File: ${path.basename(filePath)}\n\n${content}` }
        ],
        temperature: 0.3,
    });
    return response.choices[0].message.content || "";
}
async function scanDirectory(dir) {
    const files = await (0, glob_1.glob)("**/*.{html,htm,jsx,tsx}", {
        cwd: dir, absolute: true, ignore: ["**/node_modules/**", "**/dist/**"]
    });
    const results = new Map();
    for (const f of files) {
        results.set(f, await scanFile(f));
    }
    return results;
}
