import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generate(filePath: string): Promise<string> {
  let content: string;
  const resolved = path.resolve(filePath);

  if (fs.statSync(resolved).isDirectory()) {
    const files = fs.readdirSync(resolved).filter(f => /\.(ts|js|prisma)$/.test(f));
    content = files.map(f => {
      const fp = path.join(resolved, f);
      return `// File: ${f}\n${fs.readFileSync(fp, "utf-8")}`;
    }).join("\n\n");
  } else {
    content = fs.readFileSync(resolved, "utf-8");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a GraphQL migration expert. Analyze the REST API routes/code provided and generate a complete GraphQL schema. Include: type definitions, queries, mutations, subscriptions where appropriate, input types, enums, resolvers skeleton in TypeScript, and a migration guide. Map REST endpoints to GraphQL operations logically.` },
      { role: "user", content: `File: ${path.basename(filePath)}\n\n${content}` }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
