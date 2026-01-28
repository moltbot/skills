"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateErrorHandler = generateErrorHandler;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
async function generateErrorHandler(framework, lang = "typescript") {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You generate production-ready error handling middleware.
Include:
- Custom error classes (AppError, ValidationError, NotFoundError, AuthError)
- Global error handler middleware
- Async handler wrapper (catchAsync/asyncHandler)
- Error logging with stack traces in dev, clean messages in prod
- Proper HTTP status codes
- Request ID tracking
- Language: ${lang}
- Framework: ${framework}
Return ONLY the code, no explanations.`
            },
            { role: "user", content: `Generate complete error handling setup for ${framework}` }
        ],
        temperature: 0.3,
    });
    const result = response.choices[0].message.content?.trim() || "";
    return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
