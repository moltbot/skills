import OpenAI from "openai";

const openai = new OpenAI();

export async function generateRateLimitConfig(requirement: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an API security expert. Generate production-ready rate limiting configurations based on the user's requirements. Output configs for popular frameworks (Express with express-rate-limit, Nginx, Redis-based). Include code examples ready to copy-paste. Be concise and practical." },
      { role: "user", content: requirement }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "Could not generate config.";
}
