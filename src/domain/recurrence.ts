import { AppData, RepeatRule, Task } from "./types";
import { localDateKey } from "./localDate";
import { generateId, nowIso } from "../data/utils";

/** The weekday of a date key, 0 for Sunday. */
export function weekdayOf(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getDay();
}

/**
 * Does a ritual land on this day? Daily always does, weekdays skip the
 * weekend, and weekly keeps the weekday it was first laid down.
 */
export function ritualLandsOn(template: Task, dateKey: string): boolean {
  const rule = template.repeat;
  if (rule === null) return false;
  if (rule === "daily") return true;
  if (rule === "weekdays") {
    const day = weekdayOf(dateKey);
    return day !== 0 && day !== 6;
  }
  const anchor = localDateKey(new Date(template.createdAt));
  return weekdayOf(dateKey) === weekdayOf(anchor);
}

/** The rituals in a workspace: the tasks that carry a repeat rule. */
export function ritualsOf(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.repeat !== null);
}

/** The tasks a day can show: everything but the rituals themselves. */
export function dayTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.repeat === null);
}

/**
 * Lay the rituals down for a day. Each ritual that lands on the day gets one
 * task of its own, with its steps reset, so the day's work is a copy that can
 * be finished without touching the ritual.
 */
export function syncRecurringTasks(data: AppData, dateKey: string): AppData {
  const templates = ritualsOf(data.tasks);
  if (templates.length === 0) {
    return data;
  }
  const laid = new Set(
    data.tasks
      .filter((task) => task.templateId !== null && task.scheduledDate === dateKey)
      .map((task) => task.templateId as string),
  );
  const created: Task[] = [];
  let order = Math.min(...data.tasks.map((task) => task.order), 0) - 1;
  for (const template of templates) {
    if (laid.has(template.id)) continue;
    if (!ritualLandsOn(template, dateKey)) continue;
    const stamp = nowIso();
    created.push({
      ...template,
      id: generateId(),
      status: "todo",
      completedAt: null,
      scheduledDate: dateKey,
      repeat: null,
      templateId: template.id,
      subtasks: template.subtasks.map((subtask) => ({ ...subtask, done: false })),
      order,
      createdAt: stamp,
      updatedAt: stamp,
    });
    order -= 1;
  }
  if (created.length === 0) {
    return data;
  }
  return { ...data, tasks: [...data.tasks, ...created] };
}

/** What a repeat rule is called in the interface. */
export function repeatLabel(rule: RepeatRule | null): string {
  switch (rule) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Every weekday";
    case "weekly":
      return "Every week";
    default:
      return "Does not repeat";
  }
}
