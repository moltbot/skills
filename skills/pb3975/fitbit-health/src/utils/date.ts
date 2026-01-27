import { format, isValid, parseISO, subDays, subMonths, subWeeks } from "date-fns";

export function resolveDate(input: string | undefined, timeZone?: string): string {
  if (!input) {
    return format(todayInTimeZone(timeZone), "yyyy-MM-dd");
  }
  if (input === "today") {
    return format(todayInTimeZone(timeZone), "yyyy-MM-dd");
  }
  const parsed = parseISO(input);
  if (!isValid(parsed)) {
    throw new Error(`Invalid date: ${input}. Use YYYY-MM-DD.`);
  }
  return format(parsed, "yyyy-MM-dd");
}

export function resolveRange(range: string | undefined, timeZone?: string): { start: string; end: string } {
  const end = todayInTimeZone(timeZone);
  if (!range) {
    return { start: format(end, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  }
  const match = range.match(/^(\d+)([dwm])$/);
  if (!match) {
    throw new Error(`Invalid range: ${range}. Use 7d, 4w, 3m.`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  let startDate = end;
  if (unit === "d") {
    startDate = subDays(end, value);
  } else if (unit === "w") {
    startDate = subWeeks(end, value);
  } else if (unit === "m") {
    startDate = subMonths(end, value);
  }
  return {
    start: format(startDate, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

function todayInTimeZone(timeZone?: string): Date {
  if (!timeZone) {
    return new Date();
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "1970");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "01");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "01");
  return new Date(Date.UTC(year, month - 1, day));
}
