import { describe, expect, it } from "vitest";
import { AppData, Task } from "./types";
import { dayTasks, ritualLandsOn, syncRecurringTasks } from "./recurrence";
import { addDays } from "./localDate";

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
    durationMin: null,
    repeat: null,
    templateId: null,
    subtasks: [],
    order: 0,
    createdAt: `${TODAY}T08:00:00.000Z`,
    updatedAt: `${TODAY}T08:00:00.000Z`,
    completedAt: null,
    ...overrides,
  };
}

function workspace(tasks: Task[]): AppData {
  return {
    schemaVersion: 4,
    projects: [],
    tasks,
    focusSessions: [],
    highlights: [],
    shutdowns: [],
    settings: { theme: "system", workdayMinutes: 300 },
  };
}

describe("rituals", () => {
  it("lays a daily ritual down for the day, with its steps reset", () => {
    const data = workspace([
      makeTask({
        id: "ritual",
        title: "Morning routine",
        repeat: "daily",
        subtasks: [{ id: "s1", title: "Stretch", done: true }],
      }),
    ]);
    const synced = syncRecurringTasks(data, TODAY);
    expect(synced.tasks).toHaveLength(2);
    const copy = synced.tasks.find((task) => task.templateId === "ritual");
    expect(copy).toBeDefined();
    expect(copy?.scheduledDate).toBe(TODAY);
    expect(copy?.status).toBe("todo");
    expect(copy?.subtasks[0].done).toBe(false);
    expect(copy?.repeat).toBeNull();
  });

  it("lays a ritual down only once a day", () => {
    const data = workspace([makeTask({ id: "ritual", repeat: "daily" })]);
    const once = syncRecurringTasks(data, TODAY);
    const twice = syncRecurringTasks(once, TODAY);
    expect(twice.tasks).toHaveLength(2);
  });

  it("keeps weekdays off the weekend and weekly on its own day", () => {
    const saturday = "2026-10-17"; // a Saturday
    const sunday = "2026-10-18";
    const monday = "2026-10-19";
    const weekday = makeTask({ id: "weekday", repeat: "weekdays" });
    expect(ritualLandsOn(weekday, saturday)).toBe(false);
    expect(ritualLandsOn(weekday, sunday)).toBe(false);
    expect(ritualLandsOn(weekday, monday)).toBe(true);

    const weekly = makeTask({
      id: "weekly",
      repeat: "weekly",
      createdAt: `${monday}T08:00:00.000Z`,
    });
    expect(ritualLandsOn(weekly, monday)).toBe(true);
    expect(ritualLandsOn(weekly, addDays(monday, 7))).toBe(true);
    expect(ritualLandsOn(weekly, addDays(monday, 1))).toBe(false);
  });

  it("hides the rituals themselves from the day", () => {
    const tasks = [makeTask({ id: "ritual", repeat: "daily" }), makeTask({ id: "task" })];
    expect(dayTasks(tasks).map((task) => task.id)).toEqual(["task"]);
  });
});
