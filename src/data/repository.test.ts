import { describe, expect, it } from "vitest";
import { AppData, createEmptyAppData } from "../domain/types";
import {
  addFocusSessionToData,
  addProjectToData,
  addSubtaskToData,
  addTaskToData,
  DaymarkRepository,
  insertTask,
  removeProjectFromData,
  removeSubtaskFromData,
  removeTaskFromData,
  setTaskOrderInData,
  setThemeInData,
  toggleSubtaskInData,
  updateProjectInData,
  updateTaskInData,
} from "./repository";
import { getBrowserStorage, LEGACY_STORAGE_KEY, STORAGE_KEY } from "./storage";

type MemoryStorage = Record<string, string>;

function memoryStorage(initial: MemoryStorage = {}) {
  const contents: MemoryStorage = { ...initial };
  return {
    contents,
    storage: {
      getItem: (key: string) => (key in contents ? contents[key] : null),
      setItem: (key: string, value: string) => {
        contents[key] = value;
      },
      removeItem: (key: string) => {
        delete contents[key];
      },
    },
  };
}

function failingStorage() {
  return {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
}

function addTask(data: AppData, title = "First"): AppData {
  return addTaskToData(data, { title, details: "", projectId: null, scheduledDate: null });
}

describe("DaymarkRepository", () => {
  it("round-trips v2 data through the versioned key", () => {
    const { storage, contents } = memoryStorage();
    const repo = new DaymarkRepository(storage);
    expect(repo.save(addTask(createEmptyAppData(), "Ship")).kind).toBe("saved");
    expect(contents[STORAGE_KEY]).toContain('"schemaVersion":2');

    const loaded = repo.load();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready") {
      expect(loaded.data.tasks).toHaveLength(1);
      expect(loaded.data.settings.theme).toBe("system");
    }
  });

  it("migrates a v1 document into v2 on load", () => {
    const v1 = {
      schemaVersion: 1,
      projects: [{ id: "p1", name: "Auth", createdAt: "x", updatedAt: "x" }],
      tasks: [
        {
          id: "t1",
          title: "Old",
          details: "",
          status: "todo",
          projectId: "p1",
          scheduledDate: null,
          createdAt: "2026-10-16T08:00:00.000Z",
          updatedAt: "2026-10-16T08:00:00.000Z",
        },
      ],
    };
    const { storage, contents } = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(v1) });
    const loaded = new DaymarkRepository(storage).load();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready") {
      expect(loaded.migrated).toBe(true);
      expect(loaded.data.tasks[0].subtasks).toEqual([]);
      expect(loaded.data.tasks[0].priority).toBeNull();
    }
    expect(contents[STORAGE_KEY]).toContain('"schemaVersion":2');
  });

  it("reports corrupt data without overwriting it", () => {
    const { storage, contents } = memoryStorage({ [STORAGE_KEY]: "{not json" });
    const loaded = new DaymarkRepository(storage).load();
    expect(loaded.kind).toBe("corrupt");
    expect(contents[STORAGE_KEY]).toBe("{not json");
  });

  it("reports unavailable storage", () => {
    const repo = new DaymarkRepository(failingStorage());
    expect(repo.load().kind).toBe("unavailable");
    expect(repo.save(createEmptyAppData()).kind).toBe("unavailable");
    expect(new DaymarkRepository(null).save(createEmptyAppData()).kind).toBe("unavailable");
  });

  it("uses real browser storage with the v2 key", () => {
    const storage = getBrowserStorage();
    if (!storage) return;
    const repo = new DaymarkRepository(storage);
    expect(repo.save(addTask(createEmptyAppData(), "Persist")).kind).toBe("saved");
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Persist");
    storage.removeItem(STORAGE_KEY);
  });
});

describe("task mutations", () => {
  it("creates a new task with defaults and puts it on top", () => {
    let data = addTask(createEmptyAppData(), "First");
    data = addTask(data, "Second");
    const top = data.tasks[0];
    expect(top.title).toBe("Second");
    expect(top.status).toBe("todo");
    expect(top.subtasks).toEqual([]);
    expect(top.priority).toBeNull();
    expect(top.completedAt).toBeNull();
    expect(top.order).toBeLessThan(data.tasks[1].order);
  });

  it("stamps completedAt on done and clears it when reopened", () => {
    let data = addTask(createEmptyAppData());
    const id = data.tasks[0].id;
    data = updateTaskInData(data, id, { status: "done" }) as AppData;
    expect(data.tasks[0].completedAt).not.toBeNull();
    data = updateTaskInData(data, id, { status: "todo" }) as AppData;
    expect(data.tasks[0].completedAt).toBeNull();
  });

  it("returns null for unknown ids", () => {
    expect(updateTaskInData(createEmptyAppData(), "ghost", { status: "done" })).toBeNull();
    expect(removeTaskFromData(createEmptyAppData(), "ghost")).toBeNull();
  });

  it("detaches focus sessions when a task is deleted", () => {
    let data = addTask(createEmptyAppData());
    const id = data.tasks[0].id;
    data = addFocusSessionToData(data, {
      taskId: id,
      startedAt: "2026-10-17T08:00:00.000Z",
      endedAt: "2026-10-17T08:25:00.000Z",
      durationSec: 1500,
    });
    const next = removeTaskFromData(data, id) as AppData;
    expect(next.tasks).toHaveLength(0);
    expect(next.focusSessions[0].taskId).toBeNull();
  });

  it("reinserts a task verbatim for undo", () => {
    let data = addTask(createEmptyAppData());
    const original = data.tasks[0];
    data = removeTaskFromData(data, original.id) as AppData;
    data = insertTask(data, original);
    expect(data.tasks[0]).toEqual(original);
  });

  it("reorders tasks and manages subtasks", () => {
    let data = addTask(createEmptyAppData(), "a");
    data = addTask(data, "b");
    const [b, a] = data.tasks;
    data = setTaskOrderInData(data, [a.id, b.id]);
    expect(data.tasks.find((t) => t.id === a.id)?.order).toBe(0);
    expect(data.tasks.find((t) => t.id === b.id)?.order).toBe(1);

    data = addSubtaskToData(data, a.id, "step one");
    const subtaskId = data.tasks.find((t) => t.id === a.id)!.subtasks[0].id;
    data = toggleSubtaskInData(data, a.id, subtaskId, true);
    expect(data.tasks.find((t) => t.id === a.id)!.subtasks[0].done).toBe(true);
    data = removeSubtaskFromData(data, a.id, subtaskId);
    expect(data.tasks.find((t) => t.id === a.id)!.subtasks).toHaveLength(0);
  });

  it("ignores blank subtitles", () => {
    const data = addTask(createEmptyAppData());
    expect(addSubtaskToData(data, data.tasks[0].id, "   ").tasks[0].subtasks).toHaveLength(0);
  });
});

describe("projects & settings", () => {
  it("adds, updates and deletes projects without deleting tasks", () => {
    let data = addProjectToData(createEmptyAppData(), "Auth");
    const projectId = data.projects[0].id;
    data = updateProjectInData(data, projectId, { name: "Auth v2", emoji: "🔐", color: "pine" });
    expect(data.projects[0]).toMatchObject({ name: "Auth v2", emoji: "🔐", color: "pine" });

    data = addTaskToData(
      { ...data, tasks: data.tasks.map((t) => ({ ...t, projectId })) },
      { title: "Rotate keys", details: "", projectId, scheduledDate: null },
    );
    const result = removeProjectFromData(data, projectId);
    expect(result.data.projects).toHaveLength(0);
    expect(result.data.tasks[0].projectId).toBeNull();
    expect(result.unassignedTaskIds).toHaveLength(1);
  });

  it("stores the theme setting", () => {
    const data = setThemeInData(createEmptyAppData(), "dark");
    expect(data.settings.theme).toBe("dark");
  });
});
