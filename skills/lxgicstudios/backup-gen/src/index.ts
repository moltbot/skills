import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generate(input: string): Promise<string> {
  const userContent = `Generate a backup script for: ${input}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a DevOps expert specializing in database backups. Generate a production-ready backup script. Include: the backup command, compression, encryption option, rotation policy, error handling, logging, and restore instructions. Use bash by default. Add cron schedule suggestion.` },
      { role: "user", content: userContent }
    ],
    temperature: 0.7,
  });
  return response.choices[0].message.content || "";
}
