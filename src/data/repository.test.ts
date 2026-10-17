import { describe, expect, it } from "vitest";
import { createEmptyAppData, AppData, Project, Task } from "../domain/types";
import {
  addProjectToData,
  addTaskToData,
  DaymarkRepository,
  insertTask,
  removeProjectFromData,
  removeTaskFromData,
  renameProjectInData,
  updateTaskInData,
} from "./repository";
import { getBrowserStorage, STORAGE_KEY } from "./storage";

type MemoryStorage = Record<string, string>;

function memoryStorage(initial: MemoryStorage = {}): {
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  contents: MemoryStorage;
} {
  const contents: MemoryStorage = { ...initial };
  return {
    contents,
    storage: {
      getItem: (key) => (key in contents ? contents[key] : null),
      setItem: (key, value) => {
        contents[key] = value;
      },
      removeItem: (key) => {
        delete contents[key];
      },
    },
  };
}

function failingStorage(): {
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
} {
  return {
    storage: {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    },
  };
}

describe("DaymarkRepository", () => {
  it("round-trips data through the storage key", () => {
    const { storage, contents } = memoryStorage();
    const repo = new DaymarkRepository(storage);
    const withProject = addProjectToData(createEmptyAppData(), "Auth");
    const saved = repo.save(withProject);
    expect(saved.kind).toBe("saved");
    expect(contents[STORAGE_KEY]).toContain('"schemaVersion":1');

    const loaded = repo.load();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready") {
      expect(loaded.data.projects).toHaveLength(1);
      expect(loaded.data.projects[0].name).toBe("Auth");
    }
  });

  it("treats empty storage as a fresh start", () => {
    const { storage } = memoryStorage();
    const loaded = new DaymarkRepository(storage).load();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready") {
      expect(loaded.data.tasks).toHaveLength(0);
      expect(loaded.data.projects).toHaveLength(0);
    }
  });

  it("reports corrupt data instead of throwing or resetting it", () => {
    const { storage, contents } = memoryStorage({
      [STORAGE_KEY]: "{not json at all",
    });
    const loaded = new DaymarkRepository(storage).load();
    expect(loaded.kind).toBe("corrupt");
    if (loaded.kind === "corrupt") {
      expect(loaded.raw).toBe("{not json at all");
    }
    expect(contents[STORAGE_KEY]).toBe("{not json at all");
  });

  it("reports unavailable storage for both read and write", () => {
    const { storage } = failingStorage();
    const repo = new DaymarkRepository(storage);
    expect(repo.load().kind).toBe("unavailable");
    expect(repo.save(createEmptyAppData()).kind).toBe("unavailable");
  });

  it("never writes when storage is missing entirely", () => {
    const repo = new DaymarkRepository(null);
    expect(repo.save(createEmptyAppData()).kind).toBe("unavailable");
  });
});

describe("task mutations", () => {
  it("starts a new task as Todo with optional Today date", () => {
    const data = addTaskToData(createEmptyAppData(), {
      title: "  Ship the POC  ",
      details: "notes",
      projectId: null,
      scheduledDate: "2026-10-17",
    });
    expect(data.tasks).toHaveLength(1);
    const task = data.tasks[0];
    expect(task.title).toBe("Ship the POC");
    expect(task.status).toBe("todo");
    expect(task.scheduledDate).toBe("2026-10-17");
    expect(task.projectId).toBeNull();
  });

  it("prepends newest tasks", () => {
    let data = addTaskToData(createEmptyAppData(), {
      title: "First",
      details: "",
      projectId: null,
      scheduledDate: null,
    });
    data = addTaskToData(data, { title: "Second", details: "", projectId: null, scheduledDate: null });
    expect(data.tasks.map((t) => t.title)).toEqual(["Second", "First"]);
  });

  it("updates fields and bumps updatedAt", () => {
    const data = addTaskToData(createEmptyAppData(), {
      title: "First",
      details: "",
      projectId: null,
      scheduledDate: null,
    });
    const before = data.tasks[0];
    const updated = updateTaskInData(data, before.id, {
      status: "done",
      scheduledDate: null,
    });
    expect(updated).not.toBeNull();
    if (updated) {
      const task = updated.tasks[0];
      expect(task.status).toBe("done");
      expect(task.updatedAt >= before.updatedAt).toBe(true);
    }
  });

  it("returns null updates/removals for unknown ids", () => {
    const data = createEmptyAppData();
    expect(updateTaskInData(data, "ghost", { status: "done" })).toBeNull();
    expect(removeTaskFromData(data, "ghost")).toBeNull();
  });

  it("reinserts a task object verbatim (undo path)", () => {
    let data = addTaskToData(createEmptyAppData(), {
      title: "First",
      details: "",
      projectId: null,
      scheduledDate: null,
    });
    const original = data.tasks[0];
    data = removeTaskFromData(data, original.id) as AppData;
    expect(data.tasks).toHaveLength(0);
    data = insertTask(data, original);
    expect(data.tasks[0]).toEqual(original);
  });
});

describe("project mutations", () => {
  it("adds and renames projects", () => {
    let data = addProjectToData(createEmptyAppData(), "  Auth  ");
    expect(data.projects[0].name).toBe("Auth");
    data = renameProjectInData(data, data.projects[0].id, "Auth Rewrite");
    expect(data.projects[0].name).toBe("Auth Rewrite");
  });

  it("deleting a project keeps its tasks and unassigns them", () => {
    let data = addProjectToData(createEmptyAppData(), "Auth");
    const projectId = data.projects[0].id;
    data = addTaskToData(data, {
      title: "Rotate keys",
      details: "",
      projectId,
      scheduledDate: "2026-10-17",
    });
    data = addTaskToData(data, {
      title: "Free-floating task",
      details: "",
      projectId: null,
      scheduledDate: null,
    });

    const result = removeProjectFromData(data, projectId);
    expect(result.data.projects).toHaveLength(0);
    expect(result.data.tasks).toHaveLength(2);

    const unassigned = result.data.tasks.find((t: Task) => t.title === "Rotate keys");
    expect(unassigned?.projectId).toBeNull();
    expect(unassigned?.scheduledDate).toBe("2026-10-17");
    expect(result.unassignedTaskIds).toEqual([unassigned?.id]);

    const untouched = result.data.tasks.find((t: Task) => t.title === "Free-floating task");
    expect(untouched?.projectId).toBeNull();
  });

  it("deleting an unknown project changes nothing", () => {
    const data = addProjectToData(createEmptyAppData(), "Auth");
    const result = removeProjectFromData(data, "ghost");
    expect(result.data.projects).toHaveLength(1);
    expect(result.unassignedTaskIds).toEqual([]);
  });
});

describe("getBrowserStorage", () => {
  it("exposes localStorage and uses the versioned key", () => {
    const storage = getBrowserStorage();
    expect(storage).not.toBeNull();
    if (storage) {
      storage.setItem(STORAGE_KEY, "probe");
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("probe");
      storage.removeItem(STORAGE_KEY);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    }
  });

  it("loads and saves typed app data in a real browser storage", () => {
    const storage = getBrowserStorage();
    if (!storage) return;
    const repo = new DaymarkRepository(storage);
    const withData = addTaskToData(createEmptyAppData(), {
      title: "Persist me",
      details: "",
      projectId: null,
      scheduledDate: null,
    });
    let withStatus: AppData = withData;
    const project: Project = {
      id: "p-1",
      name: "Example",
      createdAt: "2026-10-17T08:00:00.000Z",
      updatedAt: "2026-10-17T08:00:00.000Z",
    };
    withStatus = { ...withData, projects: [project], tasks: withData.tasks.map((t: Task) => ({ ...t, projectId: "p-1" })) };
    expect(repo.save(withStatus).kind).toBe("saved");

    const loaded = repo.load();
    expect(loaded.kind).toBe("ready");
    if (loaded.kind === "ready") {
      expect(loaded.data.tasks[0].title).toBe("Persist me");
      expect(loaded.data.tasks[0].projectId).toBe("p-1");
    }
    storage.removeItem(STORAGE_KEY);
  });
});
