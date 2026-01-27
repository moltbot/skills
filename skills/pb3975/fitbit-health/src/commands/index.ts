import { Command } from "commander";
import { registerConfigure } from "./configure.js";
import { registerAuth } from "./auth.js";
import { registerProfile } from "./profile.js";
import { registerActivity } from "./activity.js";
import { registerSummary } from "./summary.js";

export function registerAllCommands(program: Command): void {
  registerConfigure(program);
  registerAuth(program);
  registerProfile(program);
  registerActivity(program);
  registerSummary(program);
}
