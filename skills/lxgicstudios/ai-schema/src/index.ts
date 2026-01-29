import OpenAI from "openai";

const openai = new OpenAI();

export async function generateSchema(description: string, dialect: string = "postgresql"): Promise<string> {
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
