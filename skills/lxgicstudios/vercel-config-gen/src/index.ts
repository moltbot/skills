import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generate(): Promise<string> {
  // Try to detect project context
  let context = "No project files detected. Generate a general-purpose Vercel config.";
  const cwd = process.cwd();
  for (const f of ["package.json", "next.config.js", "nuxt.config.ts", "vite.config.ts", "angular.json"]) {
    const fp = path.join(cwd, f);
    if (fs.existsSync(fp)) {
      context = `Project file (${f}):\n${fs.readFileSync(fp, "utf-8").slice(0, 3000)}`;
      break;
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `(no argument needed)` },
      { role: "user", content: context }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
