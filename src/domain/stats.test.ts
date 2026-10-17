import { describe, expect, it } from "vitest";
import { Task } from "./types";
import {
  completedOn,
  currentStreak,
  doneToday,
  focusSecondsOnDate,
  formatDuration,
  formatMinutes,
  last7Days,
  plannedToday,
} from "./stats";
import { addDays, localDateKey } from "./localDate";

const TODAY = "2026-10-17";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    details: "",
    status: "todo",
    projectId: null,
    scheduledDate: null,
    dueDate: null,
    priority: null,
    emoji: null,
    color: null,
    subtasks: [],
    order: 0,
    createdAt: `${TODAY}T08:00:00.000Z`,
    updatedAt: `${TODAY}T08:00:00.000Z`,
    completedAt: null,
    ...overrides,
  };
}

function doneAt(dateKey: string, id = dateKey): Task {
  return makeTask({ id, status: "done", completedAt: `${dateKey}T12:00:00.000Z` });
}

describe("stats", () => {
  it("counts tasks completed on the local date (not UTC-sliced)", () => {
    const task = makeTask({ status: "done", completedAt: new Date(2026, 9, 17, 23, 30).toISOString() });
    expect(completedOn(task, TODAY)).toBe(true);
    expect(doneToday([task], TODAY)).toBe(1);
  });

  it("ignores tasks without completedAt", () => {
    expect(doneToday([makeTask({ status: "done", completedAt: null })], TODAY)).toBe(0);
  });

  it("counts tasks planned for today", () => {
    const tasks = [makeTask({ scheduledDate: TODAY }), makeTask({ id: "t2", scheduledDate: "2026-10-18" })];
    expect(plannedToday(tasks, TODAY)).toBe(1);
  });

  it("builds the last 7 days window", () => {
    const window = last7Days([doneAt(addDays(TODAY, -1)), doneAt(TODAY, "today")], TODAY);
    expect(window).toHaveLength(7);
    expect(window[6].key).toBe(TODAY);
    expect(window[6].count).toBe(1);
    expect(window[5].count).toBe(1);
    expect(window[0].count).toBe(0);
  });

  it("computes a streak that tolerates a not-yet-started today", () => {
    const tasks = [doneAt("2026-10-15", "a"), doneAt("2026-10-16", "b")];
    expect(currentStreak(tasks, TODAY)).toBe(2);
    const withToday = [doneAt(TODAY, "c"), ...tasks];
    expect(currentStreak(withToday, TODAY)).toBe(3);
  });

  it("breaks the streak on a missing day", () => {
    expect(currentStreak([doneAt("2026-10-14", "a"), doneAt("2026-10-16", "b")], TODAY)).toBe(1);
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it("sums focus time for a date", () => {
    const sessions = [
      {
        id: "f1",
        taskId: null,
        startedAt: new Date(2026, 9, 17, 9, 0).toISOString(),
        endedAt: new Date(2026, 9, 17, 9, 25).toISOString(),
        durationSec: 1500,
      },
      {
        id: "f2",
        taskId: null,
        startedAt: new Date(2026, 9, 16, 9, 0).toISOString(),
        endedAt: new Date(2026, 9, 16, 9, 10).toISOString(),
        durationSec: 600,
      },
    ];
    expect(focusSecondsOnDate(sessions, TODAY)).toBe(1500);
  });

  it("formats durations", () => {
    expect(formatDuration(1500)).toBe("25:00");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(1500)).toBe("25m");
    expect(formatMinutes(5400)).toBe("1h 30m");
    expect(formatMinutes(7200)).toBe("2h");
  });

  it("keeps localDateKey consistent", () => {
    expect(localDateKey(new Date(2026, 9, 17))).toBe(TODAY);
  });
});
