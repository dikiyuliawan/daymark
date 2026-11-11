/**
 * How a length of time is written. Two forms, both from the reference app:
 * the clock form on a task's pill ("1:00") and the plain form in the day's
 * plan ("2h 30m").
 */

/** The clock form: "0:30", "1:00", "2:00". */
export function formatDurationClock(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${hours}:${String(rest).padStart(2, "0")}`;
}

/** The plain form: "45m", "1h", "2h 30m", "0m". */
export function formatDurationLabel(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  if (rest === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${rest}m`;
}
