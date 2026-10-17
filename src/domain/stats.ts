import { FocusSession, Task } from "./types";
import { addDays, lastNDaysKeys, localDateKey } from "./localDate";

function completionDateKey(task: Task): string | null {
  if (task.status !== "done" || task.completedAt === null) {
    return null;
  }
  const date = new Date(task.completedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return localDateKey(date);
}

export function completedOn(task: Task, dateKey: string): boolean {
  return completionDateKey(task) === dateKey;
}

export function doneToday(tasks: Task[], todayKey: string): number {
  return tasks.filter((task) => completedOn(task, todayKey)).length;
}

export function plannedToday(tasks: Task[], todayKey: string): number {
  return tasks.filter((task) => task.scheduledDate === todayKey).length;
}

export function completedDateKeys(tasks: Task[]): Set<string> {
  const keys = new Set<string>();
  for (const task of tasks) {
    const key = completionDateKey(task);
    if (key !== null) {
      keys.add(key);
    }
  }
  return keys;
}

export type DayCount = { key: string; count: number };

export function last7Days(tasks: Task[], todayKey: string): DayCount[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const key = completionDateKey(task);
    if (key !== null) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return lastNDaysKeys(7, todayKey).map((key) => ({ key, count: counts.get(key) ?? 0 }));
}

export function currentStreak(tasks: Task[], todayKey: string): number {
  const doneKeys = completedDateKeys(tasks);
  if (doneKeys.size === 0) {
    return 0;
  }
  let anchor = todayKey;
  if (!doneKeys.has(anchor)) {
    anchor = addDays(todayKey, -1);
    if (!doneKeys.has(anchor)) {
      return 0;
    }
  }
  let streak = 0;
  let cursor = anchor;
  while (doneKeys.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function focusSecondsOnDate(sessions: FocusSession[], dateKey: string): number {
  return sessions
    .filter((session) => localDateKey(new Date(session.startedAt)) === dateKey)
    .reduce((total, session) => total + session.durationSec, 0);
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes <= 0) {
    return "0m";
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
