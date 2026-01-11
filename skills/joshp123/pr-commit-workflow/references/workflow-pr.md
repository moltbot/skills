# PR Workflow

## Preconditions
- If the repo has `AGENTS.md` or `docs/agents/PROCESS.md`, read it for repo-specific rules.

## Mandatory Human Intent Capture
- Prompt the user for a human-written intent section.
- Do not draft, rewrite, summarize, or paraphrase the intent.
- Paste the intent verbatim at the very top of the PR body under the heading `Human written summary:`.
- Use the lead-in line `The intent of this change is, as written by a human:` and put the intent in a blockquote.
- Add a single italicized attribution line after the blockquote (blank line between quote and italics). Use the exact format in `pr-human-template.md`.
- Do not include instruction text (e.g., "paste verbatim") in the PR body.
- If intent is missing, stop and request it.

## Steps
- Ensure branch is clean and only includes the intended commits.
- Check for other open PRs that may conflict.
- Ask the user whether to request reviewers; only request collaborators.
- Build PR body using `references/pr-human-template.md`.
- Fill non-human sections with factual, testable info.
- Use `/tmp` + `gh pr edit --body-file` for updates.
- Create PR with `gh pr create` if not already open.
- Default PRs to draft until tests + review pass; ask user before marking ready.

## Prompt History Requirements
- Include ISO-8601 timestamps with timezone.
- Prefer agent history search tools (`cm`/`cass`, Codex logs, etc.); if unavailable, fall back to manual logs and note the fallback.
- Include the full prompt history verbatim; do not omit prompts.
- If a prompt contains sensitive info, redact only the sensitive portion and keep the entry.
- Always include Environment metadata under Prompt History:
  - Harness
  - Model
  - Thinking level
  - Terminal
  - System
- Use `scripts/build_pr_body.sh` to collect environment fields when possible.
- If any field is unknown, ask the user to fill it.
- Format prompt history as a table: `ISO-8601` | `prompt` and wrap prompts in inline code (use double backticks if the prompt contains backticks).
- For very long prompts (>200 chars), consider using heading+codeblock format instead of table rows to avoid rendering issues.

## Review Comment Checks
- Always check both:
  - `gh pr view <id> --comments`
  - `gh api /repos/<org>/<repo>/pulls/<id>/comments --paginate`
- Summarize inline feedback with file + line + fix status.
