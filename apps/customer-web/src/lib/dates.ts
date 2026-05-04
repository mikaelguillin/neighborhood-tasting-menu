/** Return the next upcoming Friday after `from` (today by default). */
export function getNextFriday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (5 - day + 7) % 7 || 7; // always a future Friday
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatFriendlyDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
