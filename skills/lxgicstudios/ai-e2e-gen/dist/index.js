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
exports.generateTests = generateTests;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const openai = new openai_1.default();
async function generateTests(input, framework = "playwright") {
    const isUrl = input.startsWith("http://") || input.startsWith("https://");
    const isFile = !isUrl && fs.existsSync(input);
    let content;
    if (isUrl) {
        content = `URL: ${input}\nGenerate e2e tests for a web page at this URL. Cover common user flows: navigation, form submissions, button clicks, page loads.`;
    }
    else if (isFile) {
        content = `Component file:\n${fs.readFileSync(input, "utf-8")}\n\nGenerate e2e tests for this component.`;
    }
    else {
        content = `Description: ${input}\nGenerate e2e tests based on this description.`;
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You generate ${framework} e2e test files. Write complete, runnable test files with proper imports. Cover happy paths and edge cases. Use best practices: proper selectors, assertions, and test isolation. Return ONLY the code, no explanations.`
            },
            { role: "user", content }
        ],
        temperature: 0.4,
    });
    return response.choices[0].message.content || "";
}
