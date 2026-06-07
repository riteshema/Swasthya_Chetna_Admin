import { startOfWeek, addDays } from "date-fns";

export function format_date_key(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function get_week_dates(anchor: Date): Date[] {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function format_header_date(date: Date): {
  weekday: string;
  dayMonth: string;
} {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "short",
  };
  const parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(date);
  const weekday =
    parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return { weekday, dayMonth: `${month} ${day}` };
}

export function format_time(time: string | null | undefined): string {
  if (!time) {return "";}
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) {return time;}
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}