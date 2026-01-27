import { Command } from "commander";
import { FitbitClient } from "../client/api.js";
import { resolveDate } from "../utils/date.js";
import { createStyler, writeOutput, keyValueTable, OutputOptions } from "../utils/output.js";

interface ActivityOptions extends OutputOptions {
  verbose?: boolean;
  tz?: string;
}

export function registerActivity(command: Command): void {
  const activity = command
    .command("activity [date]")
    .description("Show daily activity summary (default: today)")
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable colored output")
    .option("--verbose", "Show debug output")
    .option("--tz <timezone>", "Override timezone")
    .action(async (date: string | undefined, options: ActivityOptions) => {
      const resolvedDate = resolveDate(date, options.tz);
      const client = await FitbitClient.load(options.verbose);
      const data = await client.getActivity(resolvedDate);
      const summary = data.summary;
      const goals = data.goals;

      if (options.json) {
        await writeOutput({ date: resolvedDate, summary, goals }, options);
        return;
      }

      const c = createStyler(options);
      const pct = (val: number, goal: number) => {
        if (!goal) {
          return "N/A";
        }
        const p = Math.round((val / goal) * 100);
        return p >= 100 ? c.green(`${p}%`) : c.yellow(`${p}%`);
      };

      console.log(c.bold(`\nActivity Summary for ${resolvedDate}\n`));
      console.log(keyValueTable([
        { key: "Steps", value: `${summary.steps.toLocaleString()} / ${goals.steps.toLocaleString()} (${pct(summary.steps, goals.steps)})` },
        { key: "Calories Out", value: `${summary.caloriesOut.toLocaleString()} / ${goals.caloriesOut.toLocaleString()} (${pct(summary.caloriesOut, goals.caloriesOut)})` },
        { key: "Distance", value: `${summary.distances.find(d => d.activity === "total")?.distance.toFixed(2) ?? "0"} km` },
        { key: "Floors", value: `${summary.floors} / ${goals.floors} (${pct(summary.floors, goals.floors)})` },
        { key: "Active Minutes", value: `${summary.fairlyActiveMinutes + summary.veryActiveMinutes} min (${summary.veryActiveMinutes} very active)` },
        { key: "Sedentary Minutes", value: `${summary.sedentaryMinutes} min` },
        { key: "Resting Heart Rate", value: summary.restingHeartRate != null ? `${summary.restingHeartRate} bpm` : "N/A" },
      ]));
    });

  // Subcommand: activity steps
  activity
    .command("steps [date]")
    .description("Show step count")
    .option("--json", "Output as JSON")
    .option("--tz <timezone>", "Override timezone")
    .option("--verbose", "Show debug output")
    .action(async (date: string | undefined, options: ActivityOptions) => {
      const resolvedDate = resolveDate(date, options.tz);
      const client = await FitbitClient.load(options.verbose);
      const data = await client.getActivity(resolvedDate);

      if (options.json) {
        await writeOutput({ date: resolvedDate, steps: data.summary.steps, goal: data.goals.steps }, options);
        return;
      }

      const goal = data.goals.steps;
      const pct = goal ? `${Math.round((data.summary.steps / goal) * 100)}%` : "N/A";
      console.log(`${resolvedDate}: ${data.summary.steps.toLocaleString()} steps (${pct} of ${goal.toLocaleString()} goal)`);
    });

  // Subcommand: activity calories
  activity
    .command("calories [date]")
    .description("Show calories burned")
    .option("--json", "Output as JSON")
    .option("--tz <timezone>", "Override timezone")
    .option("--verbose", "Show debug output")
    .action(async (date: string | undefined, options: ActivityOptions) => {
      const resolvedDate = resolveDate(date, options.tz);
      const client = await FitbitClient.load(options.verbose);
      const data = await client.getActivity(resolvedDate);

      if (options.json) {
        await writeOutput({ date: resolvedDate, caloriesOut: data.summary.caloriesOut, goal: data.goals.caloriesOut }, options);
        return;
      }

      console.log(`${resolvedDate}: ${data.summary.caloriesOut.toLocaleString()} calories burned`);
    });
}
