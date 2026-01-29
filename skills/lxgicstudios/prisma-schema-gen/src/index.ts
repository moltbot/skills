import OpenAI from "openai";

const openai = new OpenAI();

export async function generate(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a Prisma schema expert. Generate a complete, production-ready Prisma schema (.prisma format) from the user description. Include: datasource (postgresql), generator (prisma-client-js), all models with proper fields, types, relations, indexes, and enums. Use best practices: uuid ids, createdAt/updatedAt, proper relation names.` },
      { role: "user", content: description }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
