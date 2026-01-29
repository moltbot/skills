import simpleGit from "simple-git";
import OpenAI from "openai";
import ora from "ora";

export interface PRDescOptions {
  base: string;
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing OPENAI_API_KEY environment variable.\n" +
      "Get one at https://platform.openai.com/api-keys then:\n" +
      "  export OPENAI_API_KEY=sk-..."
    );
    process.exit(1);
  }
  return new OpenAI({ apiKey });
}

export async function generatePRDescription(opts: PRDescOptions): Promise<string> {
  const git = simpleGit();
  const spinner = ora("Reading branch diff...").start();

  let currentBranch: string;
  try {
    const branchResult = await git.branch();
    currentBranch = branchResult.current;
  } catch {
    spinner.fail("Couldn't determine current branch. Are you in a git repo?");
    process.exit(1);
  }

  let diff: string;
  try {
    diff = await git.diff([`${opts.base}...${currentBranch}`]);
  } catch {
    spinner.fail(`Couldn't diff against ${opts.base}. Does that branch exist?`);
    process.exit(1);
  }

  if (!diff.trim()) {
    spinner.fail(`No diff found between ${opts.base} and ${currentBranch}`);
    process.exit(1);
  }

  // Get commit messages too
  let commits: string;
  try {
    commits = await git.raw(["log", `${opts.base}..${currentBranch}`, "--pretty=format:%s", "--no-merges"]);
  } catch {
    commits = "";
  }

  // Truncate diff if too large
  const truncatedDiff = diff.length > 10000 ? diff.substring(0, 10000) + "\n...(truncated)" : diff;

  spinner.text = "Generating PR description...";

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You're a developer writing a PR title and description. " +
          "Format: start with a clear title line prefixed with '# ', " +
          "then a blank line, then a description with ## What changed, ## Why, " +
          "and ## Testing sections. Be concise and specific. " +
          "Don't be flowery or use buzzwords.",
      },
      {
        role: "user",
        content:
          `Branch: ${currentBranch} (merging into ${opts.base})\n\n` +
          `Commits:\n${commits}\n\nDiff:\n${truncatedDiff}`,
      },
    ],
  });

  spinner.succeed("PR description generated!");
  return response.choices[0]?.message?.content || "No output from OpenAI.";
}
