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
exports.makeResponsive = makeResponsive;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const openai = new openai_1.default();
async function makeResponsive(filePath) {
    const absPath = path.resolve(filePath);
    const content = fs.readFileSync(absPath, "utf-8");
    const ext = path.extname(absPath);
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are an expert frontend developer. Take the given component and make it fully responsive.
Rules:
- Add proper breakpoints (mobile-first: 375px, 768px, 1024px, 1440px)
- Use CSS media queries or Tailwind responsive prefixes depending on the existing style approach
- Ensure text scales properly, layouts stack on mobile, images are fluid
- Keep the original functionality intact
- Return ONLY the modified file content, no explanations`
            },
            { role: "user", content: `File: ${path.basename(absPath)} (${ext})\n\n${content}` }
        ],
        temperature: 0.3,
    });
    const result = response.choices[0].message.content?.trim() || content;
    // Strip markdown code fences if present
    return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
