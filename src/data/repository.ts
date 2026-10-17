import {
  AppData,
  NewTaskInput,
  Project,
  SCHEMA_VERSION,
  Task,
  TaskPatch,
  createEmptyAppData,
} from "../domain/types";
import { validateAppData } from "../domain/validate";
import { generateId, nowIso } from "./utils";
import {
  StorageLike,
  readRaw,
  serializeAppData,
  writeRaw,
} from "./storage";

export type LoadOutcome =
  | { kind: "ready"; data: AppData }
  | { kind: "unavailable" }
  | { kind: "corrupt"; reason: string; raw: string };

export type SaveOutcome = { kind: "saved" } | { kind: "unavailable" };

export class DaymarkRepository {
  constructor(private readonly storage: StorageLike | null) {}

  load(): LoadOutcome {
    const read = readRaw(this.storage);
    if (!read.available) {
      return { kind: "unavailable" };
    }
    if (read.raw === null) {
      return { kind: "ready", data: createEmptyAppData() };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(read.raw);
    } catch {
      return { kind: "corrupt", reason: "Saved data is not valid JSON.", raw: read.raw };
    }
    const outcome = validateAppData(parsed);
    if (outcome.kind === "invalid") {
      return { kind: "corrupt", reason: outcome.reason, raw: read.raw };
    }
    return { kind: "ready", data: outcome.data };
  }

  save(data: AppData): SaveOutcome {
    const stored: AppData = { ...data, schemaVersion: SCHEMA_VERSION };
    return writeRaw(this.storage, serializeAppData(stored));
  }
}

export function createEmptyData(): AppData {
  return createEmptyAppData();
}

export function addTaskToData(data: AppData, input: NewTaskInput): AppData {
  const timestamp = nowIso();
  const task: Task = {
    id: generateId(),
    title: input.title.trim(),
    details: input.details,
    status: "todo",
    projectId: input.projectId,
    scheduledDate: input.scheduledDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return { ...data, tasks: [task, ...data.tasks] };
}

export function insertTask(data: AppData, task: Task): AppData {
  return { ...data, tasks: [task, ...data.tasks] };
}

export function updateTaskInData(data: AppData, id: string, patch: TaskPatch): AppData | null {
  let changed = false;
  const tasks = data.tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }
    const next: Task = { ...task, ...patch, updatedAt: nowIso() };
    changed = true;
    return next;
  });
  return changed ? { ...data, tasks } : null;
}

export function removeTaskFromData(data: AppData, id: string): AppData | null {
  if (!data.tasks.some((task) => task.id === id)) {
    return null;
  }
  return { ...data, tasks: data.tasks.filter((task) => task.id !== id) };
}

export function addProjectToData(data: AppData, name: string): AppData {
  const timestamp = nowIso();
  const project: Project = {
    id: generateId(),
    name: name.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return { ...data, projects: [...data.projects, project] };
}

export function renameProjectInData(data: AppData, id: string, name: string): AppData {
  const timestamp = nowIso();
  return {
    ...data,
    projects: data.projects.map((project) =>
      project.id === id ? { ...project, name: name.trim(), updatedAt: timestamp } : project,
    ),
  };
}

export type ProjectRemovalResult = {
  data: AppData;
  unassignedTaskIds: string[];
};

/**
 * Deleting a project never deletes its tasks: matching projectId values are
 * cleared so tasks remain, now unassigned.
 */
export function removeProjectFromData(data: AppData, id: string): ProjectRemovalResult {
  let unassignedTaskIds: string[] = [];
  const tasks = data.tasks.map((task) => {
    if (task.projectId !== id) {
      return task;
    }
    unassignedTaskIds = [...unassignedTaskIds, task.id];
    return { ...task, projectId: null, updatedAt: nowIso() };
  });
  return {
    data: {
      schemaVersion: SCHEMA_VERSION,
      projects: data.projects.filter((project) => project.id !== id),
      tasks,
    },
    unassignedTaskIds,
  };
}

export function sortTasksNewestFirst(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
