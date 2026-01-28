import OpenAI from "openai";

const openai = new OpenAI();

export async function generate(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a Redis architecture expert. Generate a complete Redis schema design from the description. Include: key naming patterns (with namespaces), data structures (strings, hashes, sets, sorted sets, lists), TTL strategies, example commands for CRUD operations, and a helper module in TypeScript. Follow Redis best practices for key naming.` },
      { role: "user", content: description }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
