import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generateEnvExample(dir: string): Promise<string> {
  const envFiles = [".env", ".env.local", ".env.development", ".env.production"]
    .map(f => path.join(dir, f))
    .filter(f => fs.existsSync(f));

  let envContent = "";
  for (const f of envFiles) {
    envContent += `${path.basename(f)}:\n${fs.readFileSync(f, "utf-8")}\n\n`;
  }

  if (!envContent) {
    return "# No .env files found\n# Add your environment variables here\n";
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You generate .env.example files. Strip all secret values but keep the key names. Add helpful comments explaining what each variable is for, group them by category, and add placeholder values like "your-api-key-here". Never include actual secrets.` },
      { role: "user", content: `Generate .env.example from these env files:\n\n${envContent}` }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
