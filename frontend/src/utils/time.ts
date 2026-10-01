const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** "14:05" for today, "Yesterday", otherwise a short date like "Sep 28". */
export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  // Rounded because a day can be 23 or 25 hours around daylight-saving changes.
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (daysAgo === 0) return formatClock(iso);
  if (daysAgo === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
