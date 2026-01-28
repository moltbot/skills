import OpenAI from "openai";
import { glob } from "glob";
import * as fs from "fs";
import * as path from "path";

const PROJECT_MARKERS = [
  "package.json", "Cargo.toml", "go.mod", "go.sum", "pyproject.toml",
  "setup.py", "requirements.txt", "Gemfile", "build.gradle", "pom.xml",
  "CMakeLists.txt", "Makefile", "docker-compose.yml", "Dockerfile",
  ".env", ".env.local", "tsconfig.json", "next.config.js", "next.config.mjs",
  "vite.config.ts", "webpack.config.js", "tailwind.config.js",
  "flutter.yaml", "pubspec.yaml", "mix.exs", "Pipfile", "poetry.lock",
  "composer.json", ".swift-version", "Package.swift"
];

export async function scanProject(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const marker of PROJECT_MARKERS) {
    const full = path.join(dir, marker);
    if (fs.existsSync(full)) {
      found.push(marker);
    }
  }
  const dirs = await glob("*/", { cwd: dir, dot: false });
  for (const d of dirs.slice(0, 20)) {
    if (fs.existsSync(path.join(dir, d))) {
      found.push(`dir:${d.replace(/\/$/, "")}`);
    }
  }
  return found;
}

export async function generateGitignore(projectFiles: string[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable. Set it with: export OPENAI_API_KEY=sk-...");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a .gitignore expert. Given a list of project files and directories, generate a comprehensive .gitignore file. Only output the .gitignore contents, no explanations. Include comments for each section."
      },
      {
        role: "user",
        content: `Generate a .gitignore for a project with these files and directories:\n${projectFiles.join("\n")}`
      }
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
