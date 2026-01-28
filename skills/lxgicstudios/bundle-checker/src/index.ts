import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export interface BundleInfo {
  packageJson: string;
  lockFile: string | null;
  configFiles: string[];
}

export function gatherBundleInfo(dir: string): BundleInfo {
  const pkgPath = path.join(dir, "package.json");
  const packageJson = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, "utf-8") : "";
  
  let lockFile: string | null = null;
  for (const lock of ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]) {
    const lp = path.join(dir, lock);
    if (fs.existsSync(lp)) { lockFile = lock; break; }
  }

  const configFiles: string[] = [];
  for (const cfg of ["webpack.config.js", "vite.config.ts", "vite.config.js", "next.config.js", "next.config.mjs", "rollup.config.js", "tsconfig.json"]) {
    const cp = path.join(dir, cfg);
    if (fs.existsSync(cp)) {
      configFiles.push(`// ${cfg}\n${fs.readFileSync(cp, "utf-8").substring(0, 5000)}`);
    }
  }

  return { packageJson, lockFile, configFiles };
}

export async function analyzeBundleSize(info: BundleInfo): Promise<string> {
  const context = `package.json:\n${info.packageJson}\n\nLock file: ${info.lockFile || "none"}\n\nConfig files:\n${info.configFiles.join("\n\n")}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a frontend performance expert. Analyze the project's dependencies and build config to identify bundle size issues. Suggest specific fixes: tree-shaking opportunities, lighter alternatives, dynamic imports, and config changes. Estimate potential savings. Be concise and actionable." },
      { role: "user", content: context.substring(0, 60000) }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "Could not analyze bundle.";
}
