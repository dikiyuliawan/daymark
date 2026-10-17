import {
  AppData,
  FocusSession,
  NewTaskInput,
  Priority,
  Project,
  SCHEMA_VERSION,
  Settings,
  Subtask,
  Task,
  TaskPatch,
  ThemeMode,
  createEmptyAppData,
} from "../domain/types";
import { migrateV1, validateAppData } from "../domain/validate";
import { generateId, nowIso } from "./utils";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  StorageLike,
  readRaw,
  serializeAppData,
  writeRaw,
} from "./storage";

export type LoadOutcome =
  | { kind: "ready"; data: AppData; migrated: boolean }
  | { kind: "unavailable" }
  | { kind: "corrupt"; reason: string; raw: string };

export type SaveOutcome = { kind: "saved" } | { kind: "unavailable" };

export class DaymarkRepository {
  constructor(private readonly storage: StorageLike | null) {}

  load(): LoadOutcome {
    const current = readRaw(this.storage, STORAGE_KEY);
    if (!current.available) {
      return { kind: "unavailable" };
    }
    if (current.raw !== null) {
      return this.parseCurrent(current.raw);
    }

    const legacy = readRaw(this.storage, LEGACY_STORAGE_KEY);
    if (legacy.available && legacy.raw !== null) {
      let parsedLegacy: unknown;
      try {
        parsedLegacy = JSON.parse(legacy.raw);
      } catch {
        return { kind: "corrupt", reason: "Saved data is not valid JSON.", raw: legacy.raw };
      }
      const migrated = migrateV1(parsedLegacy);
      if (migrated === null) {
        return {
          kind: "corrupt",
          reason: "Saved data uses an unsupported version.",
          raw: legacy.raw,
        };
      }
      // Best effort: persist the upgraded document so the migration is durable.
      writeRaw(this.storage, STORAGE_KEY, serializeAppData(migrated));
      return { kind: "ready", data: migrated, migrated: true };
    }

    return { kind: "ready", data: createEmptyAppData(), migrated: false };
  }

  private parseCurrent(raw: string): LoadOutcome {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { kind: "corrupt", reason: "Saved data is not valid JSON.", raw };
    }
    const outcome = validateAppData(parsed);
    if (outcome.kind === "invalid") {
      return { kind: "corrupt", reason: outcome.reason, raw };
    }
    return { kind: "ready", data: outcome.data, migrated: false };
  }

  save(data: AppData): SaveOutcome {
    const stored: AppData = { ...data, schemaVersion: SCHEMA_VERSION };
    return writeRaw(this.storage, STORAGE_KEY, serializeAppData(stored));
  }
}

/* ---------- task mutations ---------- */

function nextTopOrder(tasks: Task[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  return Math.min(...tasks.map((task) => task.order)) - 1;
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
    dueDate: null,
    priority: null,
    emoji: null,
    color: null,
    subtasks: [],
    order: nextTopOrder(data.tasks),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
  return { ...data, tasks: [task, ...data.tasks] };
}

export function insertTask(data: AppData, task: Task): AppData {
  return { ...data, tasks: [task, ...data.tasks.filter((item) => item.id !== task.id)] };
}

export function updateTaskInData(
  data: AppData,
  id: string,
  patch: TaskPatch,
): AppData | null {
  const timestamp = nowIso();
  let changed = false;
  const tasks = data.tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }
    changed = true;
    const next: Task = { ...task, ...patch, updatedAt: timestamp };
    if (patch.status !== undefined) {
      if (patch.status === "done" && task.status !== "done") {
        next.completedAt = timestamp;
      } else if (patch.status !== "done") {
        next.completedAt = null;
      }
    }
    return next;
  });
  return changed ? { ...data, tasks } : null;
}

export function removeTaskFromData(data: AppData, id: string): AppData | null {
  if (!data.tasks.some((task) => task.id === id)) {
    return null;
  }
  return {
    ...data,
    tasks: data.tasks.filter((task) => task.id !== id),
    focusSessions: data.focusSessions.map((session) =>
      session.taskId === id ? { ...session, taskId: null } : session,
    ),
  };
}

export function setTaskOrderInData(data: AppData, idsInOrder: string[]): AppData {
  const positions = new Map(idsInOrder.map((id, index) => [id, index]));
  return {
    ...data,
    tasks: data.tasks.map((task) => {
      const position = positions.get(task.id);
      return position === undefined ? task : { ...task, order: position };
    }),
  };
}

/* ---------- subtasks ---------- */

export function addSubtaskToData(data: AppData, taskId: string, title: string): AppData {
  const trimmed = title.trim();
  if (trimmed === "") {
    return data;
  }
  const subtask: Subtask = { id: generateId(), title: trimmed, done: false };
  return patchTask(data, taskId, (task) => ({
    ...task,
    subtasks: [...task.subtasks, subtask],
  }));
}

export function toggleSubtaskInData(
  data: AppData,
  taskId: string,
  subtaskId: string,
  done: boolean,
): AppData {
  return patchTask(data, taskId, (task) => ({
    ...task,
    subtasks: task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, done } : subtask,
    ),
  }));
}

export function removeSubtaskFromData(
  data: AppData,
  taskId: string,
  subtaskId: string,
): AppData {
  return patchTask(data, taskId, (task) => ({
    ...task,
    subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
  }));
}

function patchTask(data: AppData, taskId: string, change: (task: Task) => Task): AppData {
  const timestamp = nowIso();
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId ? { ...change(task), updatedAt: timestamp } : task,
    ),
  };
}

/* ---------- focus sessions ---------- */

export function addFocusSessionToData(
  data: AppData,
  session: Omit<FocusSession, "id">,
): AppData {
  const record: FocusSession = { id: generateId(), ...session };
  return { ...data, focusSessions: [...data.focusSessions, record] };
}

/* ---------- settings ---------- */

export function setThemeInData(data: AppData, theme: ThemeMode): AppData {
  const settings: Settings = { ...data.settings, theme };
  return { ...data, settings };
}

/* ---------- projects ---------- */

export function addProjectToData(data: AppData, name: string): AppData {
  const timestamp = nowIso();
  const project: Project = {
    id: generateId(),
    name: name.trim(),
    emoji: null,
    color: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return { ...data, projects: [...data.projects, project] };
}

export function updateProjectInData(
  data: AppData,
  id: string,
  patch: Partial<Pick<Project, "name" | "emoji" | "color">>,
): AppData {
  const timestamp = nowIso();
  return {
    ...data,
    projects: data.projects.map((project) =>
      project.id === id ? { ...project, ...patch, updatedAt: timestamp } : project,
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
  const unassignedTaskIds: string[] = [];
  const tasks = data.tasks.map((task) => {
    if (task.projectId !== id) {
      return task;
    }
    unassignedTaskIds.push(task.id);
    return { ...task, projectId: null };
  });
  return {
    data: {
      ...data,
      projects: data.projects.filter((project) => project.id !== id),
      tasks,
    },
    unassignedTaskIds,
  };
}

export const TASK_PRIORITIES: readonly (Priority | null)[] = [null, "low", "medium", "high"];
