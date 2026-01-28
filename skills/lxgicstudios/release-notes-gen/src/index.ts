import OpenAI from "openai";
import simpleGit from "simple-git";
import * as fs from "fs";
import * as path from "path";

export interface ReleaseNotesOptions {
  from?: string;
  to?: string;
  tone?: string;
  changelog?: string;
  cwd?: string;
}

async function getGitLog(options: ReleaseNotesOptions): Promise<string> {
  const git = simpleGit(options.cwd || process.cwd());
  const logOptions: any = { maxCount: 100 };

  if (options.from) {
    const range = options.to
      ? `${options.from}..${options.to}`
      : `${options.from}..HEAD`;
    logOptions.from = options.from;
    logOptions.to = options.to || "HEAD";
  }

  try {
    const log = await git.log(logOptions);
    return log.all
      .map((c) => `- ${c.message} (${c.author_name}, ${c.date})`)
      .join("\n");
  } catch {
    return "";
  }
}

function readChangelog(changelogPath?: string): string {
  const candidates = changelogPath
    ? [changelogPath]
    : ["CHANGELOG.md", "CHANGELOG", "CHANGES.md", "HISTORY.md"];

  for (const file of candidates) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf-8");
    }
  }
  return "";
}

export async function generateReleaseNotes(
  options: ReleaseNotesOptions
): Promise<string> {
  const changelog = readChangelog(options.changelog);
  const gitLog = await getGitLog(options);

  if (!changelog && !gitLog) {
    throw new Error(
      "Couldn't find a CHANGELOG or git history. Run this from a git repo or point to a changelog file."
    );
  }

  const source = changelog || gitLog;
  const tone = options.tone || "professional";

  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You write release notes for software projects. Your tone is: ${tone}. Write clear, user-facing release notes that non-technical people can understand. Group changes into sections like "New Features", "Bug Fixes", "Improvements". Skip internal refactors unless they affect users. Use bullet points.`,
      },
      {
        role: "user",
        content: `Here are the raw changes. Turn them into polished release notes:\n\n${source}`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "No release notes generated.";
}
