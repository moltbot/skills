import OpenAI from "openai";

const openai = new OpenAI();

export async function generateWebhook(eventDescription: string, framework: string = "express"): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You generate production-ready webhook handler code.
Rules:
- Include signature verification
- Add exponential backoff retry logic
- Handle idempotency (dedup by event ID)
- Proper error handling and logging
- Type-safe where possible
- Framework: ${framework}
- Include both the handler and a retry utility
- Return ONLY the code, no explanations`
      },
      { role: "user", content: `Generate a webhook handler for: ${eventDescription}` }
    ],
    temperature: 0.3,
  });

  const result = response.choices[0].message.content?.trim() || "";
  return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
