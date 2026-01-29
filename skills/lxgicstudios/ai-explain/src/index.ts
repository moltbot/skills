import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function explainCode(filePath: string, level: string = "beginner"): Promise<string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You explain code in simple terms. Audience level: ${level}. Break down what the file does, key functions, and how it all fits together. Use plain language. Keep it concise but thorough. Format with sections.`
      },
      { role: "user", content: `File: ${path.basename(filePath)} (${ext})\n\n${content}` }
    ],
    temperature: 0.4,
  });
  return response.choices[0].message.content || "";
}
