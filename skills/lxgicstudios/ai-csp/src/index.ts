import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generateCSP(dir: string): Promise<string> {
  let context = "";
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    context = fs.readFileSync(pkgPath, "utf-8");
  }
  const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith(".html")).slice(0, 3);
  for (const f of htmlFiles) {
    context += "\n" + fs.readFileSync(path.join(dir, f), "utf-8").slice(0, 1000);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You generate Content Security Policy headers. Analyze the project and produce: a strict CSP header string, meta tag version, Next.js middleware version, and nginx config version. Include report-uri directive. Explain each directive. Default to strict policies and note what to relax if needed.` },
      { role: "user", content: `Generate CSP headers for this project:\n\n${context || "A modern web application"}` }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
