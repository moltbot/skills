import { Command } from "commander";
import { FitbitClient } from "../client/api.js";
import { resolveDate } from "../utils/date.js";
import { createStyler, writeOutput, keyValueTable, OutputOptions } from "../utils/output.js";

interface SummaryOptions extends OutputOptions {
  verbose?: boolean;
  tz?: string;
}

export function registerSummary(command: Command): void {
  command
    .command("summary [date]")
    .description("Show full daily summary with all metrics")
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable colored output")
    .option("--verbose", "Show debug output")
    .option("--tz <timezone>", "Override timezone")
    .action(async (date: string | undefined, options: SummaryOptions) => {
      const resolvedDate = resolveDate(date, options.tz);
      const client = await FitbitClient.load(options.verbose);

      const [activity, profile] = await Promise.all([
        client.getActivity(resolvedDate),
        client.getProfile(),
      ]);

      const summary = activity.summary;
      const goals = activity.goals;

      if (options.json) {
        await writeOutput({
          date: resolvedDate,
          user: profile.user.displayName,
          activity: summary,
          goals,
        }, options);
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

      console.log(c.bold(`\n📊 Daily Summary for ${profile.user.displayName} — ${resolvedDate}\n`));

      console.log(c.underline("Activity"));
      console.log(keyValueTable([
        { key: "Steps", value: `${summary.steps.toLocaleString()} / ${goals.steps.toLocaleString()} (${pct(summary.steps, goals.steps)})` },
        { key: "Calories Out", value: `${summary.caloriesOut.toLocaleString()} kcal` },
        { key: "Distance", value: `${summary.distances.find(d => d.activity === "total")?.distance.toFixed(2) ?? "0"} km` },
        { key: "Floors", value: `${summary.floors}` },
      ]));

      console.log(c.underline("\nActive Time"));
      console.log(keyValueTable([
        { key: "Very Active", value: `${summary.veryActiveMinutes} min` },
        { key: "Fairly Active", value: `${summary.fairlyActiveMinutes} min` },
        { key: "Lightly Active", value: `${summary.lightlyActiveMinutes} min` },
        { key: "Sedentary", value: `${summary.sedentaryMinutes} min` },
      ]));

      if (summary.restingHeartRate != null) {
        console.log(c.underline("\nHeart"));
        console.log(keyValueTable([
          { key: "Resting Heart Rate", value: `${summary.restingHeartRate} bpm` },
        ]));
      }
    });

  // Shortcut: fitbit today
  command
    .command("today")
    .description("Shortcut for today's summary")
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable colored output")
    .option("--verbose", "Show debug output")
    .option("--tz <timezone>", "Override timezone")
    .action(async (options: SummaryOptions) => {
      // Same logic as summary with no date
      const resolvedDate = resolveDate(undefined, options.tz);
      const client = await FitbitClient.load(options.verbose);

      const [activity, profile] = await Promise.all([
        client.getActivity(resolvedDate),
        client.getProfile(),
      ]);

      const summary = activity.summary;
      const goals = activity.goals;

      if (options.json) {
        await writeOutput({
          date: resolvedDate,
          user: profile.user.displayName,
          activity: summary,
          goals,
        }, options);
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

      console.log(c.bold(`\n📊 Daily Summary for ${profile.user.displayName} — ${resolvedDate}\n`));

      console.log(c.underline("Activity"));
      console.log(keyValueTable([
        { key: "Steps", value: `${summary.steps.toLocaleString()} / ${goals.steps.toLocaleString()} (${pct(summary.steps, goals.steps)})` },
        { key: "Calories Out", value: `${summary.caloriesOut.toLocaleString()} kcal` },
        { key: "Distance", value: `${summary.distances.find(d => d.activity === "total")?.distance.toFixed(2) ?? "0"} km` },
        { key: "Floors", value: `${summary.floors}` },
      ]));

      console.log(c.underline("\nActive Time"));
      console.log(keyValueTable([
        { key: "Very Active", value: `${summary.veryActiveMinutes} min` },
        { key: "Fairly Active", value: `${summary.fairlyActiveMinutes} min` },
        { key: "Lightly Active", value: `${summary.lightlyActiveMinutes} min` },
        { key: "Sedentary", value: `${summary.sedentaryMinutes} min` },
      ]));

      if (summary.restingHeartRate != null) {
        console.log(c.underline("\nHeart"));
        console.log(keyValueTable([
          { key: "Resting Heart Rate", value: `${summary.restingHeartRate} bpm` },
        ]));
      }
    });
}
