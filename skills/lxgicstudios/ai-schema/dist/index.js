"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchema = generateSchema;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
async function generateSchema(description, dialect = "postgresql") {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You generate database schemas from descriptions. Output ${dialect} CREATE TABLE statements. Include:
- Primary keys, foreign keys, indexes
- Proper data types
- created_at/updated_at timestamps
- Sensible constraints (NOT NULL, UNIQUE where appropriate)
Return ONLY the SQL. No explanations.`
            },
            { role: "user", content: description }
        ],
        temperature: 0.3,
    });
    return response.choices[0].message.content || "";
}
