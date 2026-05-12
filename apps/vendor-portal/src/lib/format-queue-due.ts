import { differenceInSeconds, formatDuration, intervalToDuration } from "date-fns";

const DURATION_FORMAT = ["years", "months", "days", "hours", "minutes"] as const;

export function formatQueueDueRelative(dueAt: string, now: Date): { label: string; overdue: boolean } {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return { label: "—", overdue: false };
  }

  const seconds = differenceInSeconds(due, now);

  if (seconds === 0) {
    return { label: "Due now", overdue: false };
  }

  if (seconds > 0 && seconds < 60) {
    return { label: "In less than a minute", overdue: false };
  }

  if (seconds < 0 && seconds > -60) {
    return { label: "Less than a minute ago", overdue: true };
  }

  if (seconds > 0) {
    const duration = intervalToDuration({ start: now, end: due });
    const piece = formatDuration(duration, {
      format: [...DURATION_FORMAT],
      delimiter: " and ",
    });
    return {
      label: piece ? `In ${piece}` : "Due now",
      overdue: false,
    };
  }

  const duration = intervalToDuration({ start: due, end: now });
  const piece = formatDuration(duration, {
    format: [...DURATION_FORMAT],
    delimiter: " and ",
  });
  return {
    label: piece ? `${piece} ago` : "Less than a minute ago",
    overdue: true,
  };
}
