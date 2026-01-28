import OpenAI from "openai";

const openai = new OpenAI();

export async function generate(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a job queue architect. Generate a complete BullMQ setup from the description. Include: queue definition, worker with processing logic, job scheduling, retry configuration, event handlers, graceful shutdown, TypeScript types for job data, and a complete working example. Use BullMQ best practices: named processors, proper error handling, backoff strategies.` },
      { role: "user", content: description }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
