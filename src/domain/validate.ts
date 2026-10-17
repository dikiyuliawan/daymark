import {
  AppData,
  FocusSession,
  Priority,
  Project,
  SCHEMA_VERSION,
  Settings,
  Subtask,
  Task,
  isPriority,
  isTaskStatus,
  isThemeMode,
  createDefaultSettings,
} from "./types";
import { isLocalDateKey } from "./localDate";
import { isTileColorKey } from "./appearance";

export type ValidationOutcome =
  | { kind: "ok"; data: AppData }
  | { kind: "invalid"; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalEmoji(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalColor(value: unknown): string | null {
  return isTileColorKey(value) ? value : null;
}

function optionalDateKey(value: unknown): string | null {
  return isLocalDateKey(value) ? value : null;
}

function validateSubtask(raw: unknown): Subtask | null {
  if (!isPlainObject(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (typeof raw.title !== "string") return null;
  return { id: raw.id, title: raw.title, done: raw.done === true };
}

function validateSubtasks(value: unknown): Subtask[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: Subtask[] = [];
  for (const item of value) {
    const subtask = validateSubtask(item);
    if (subtask) {
      result.push(subtask);
    }
  }
  return result;
}

function validateProject(raw: unknown): Project | null {
  if (!isPlainObject(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (typeof raw.name !== "string") return null;
  if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name,
    emoji: optionalEmoji(raw.emoji),
    color: optionalColor(raw.color),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizePriority(value: unknown): Priority | null {
  return isPriority(value) ? value : null;
}

function validateTask(raw: unknown): Task | null {
  if (!isPlainObject(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (typeof raw.title !== "string") return null;
  if (!isTaskStatus(raw.status)) return null;
  if (raw.projectId !== null && !isNonEmptyString(raw.projectId)) return null;
  if (raw.scheduledDate !== null && !isLocalDateKey(raw.scheduledDate)) return null;
  const details = typeof raw.details === "string" ? raw.details : "";
  if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
    return null;
  }
  const status = raw.status;
  const completedAt =
    typeof raw.completedAt === "string"
      ? raw.completedAt
      : status === "done"
        ? raw.updatedAt
        : null;
  return {
    id: raw.id,
    title: raw.title,
    details,
    status,
    projectId: raw.projectId,
    scheduledDate: raw.scheduledDate,
    dueDate: optionalDateKey(raw.dueDate),
    priority: normalizePriority(raw.priority),
    emoji: optionalEmoji(raw.emoji),
    color: optionalColor(raw.color),
    subtasks: validateSubtasks(raw.subtasks),
    order: typeof raw.order === "number" && Number.isFinite(raw.order) ? raw.order : 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    completedAt,
  };
}

function validateFocusSession(raw: unknown): FocusSession | null {
  if (!isPlainObject(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (raw.taskId !== null && !isNonEmptyString(raw.taskId)) return null;
  if (typeof raw.startedAt !== "string" || typeof raw.endedAt !== "string") return null;
  if (typeof raw.durationSec !== "number" || !Number.isFinite(raw.durationSec)) return null;
  return {
    id: raw.id,
    taskId: raw.taskId,
    startedAt: raw.startedAt,
    endedAt: raw.endedAt,
    durationSec: Math.max(0, Math.round(raw.durationSec)),
  };
}

function validateSettings(raw: unknown): Settings {
  if (!isPlainObject(raw)) {
    return createDefaultSettings();
  }
  return { theme: isThemeMode(raw.theme) ? raw.theme : "system" };
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function fail(reason: string): ValidationOutcome {
  return { kind: "invalid", reason };
}

export function validateAppData(raw: unknown): ValidationOutcome {
  if (!isPlainObject(raw)) {
    return fail("Saved data is not a readable format.");
  }
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return fail(`Saved data uses an unsupported version (${String(raw.schemaVersion)}).`);
  }
  if (!Array.isArray(raw.projects) || !Array.isArray(raw.tasks)) {
    return fail("Saved data is missing task or project records.");
  }

  const projects: Project[] = [];
  for (const item of raw.projects) {
    const project = validateProject(item);
    if (!project) {
      return fail("A saved project record is malformed.");
    }
    projects.push(project);
  }
  if (hasDuplicates(projects.map((project) => project.id))) {
    return fail("Saved data contains duplicate project ids.");
  }

  const projectIds = new Set(projects.map((project) => project.id));
  const tasks: Task[] = [];
  for (const item of raw.tasks) {
    const task = validateTask(item);
    if (!task) {
      return fail("A saved task record is malformed.");
    }
    if (task.projectId !== null && !projectIds.has(task.projectId)) {
      task.projectId = null;
    }
    tasks.push(task);
  }
  if (hasDuplicates(tasks.map((task) => task.id))) {
    return fail("Saved data contains duplicate task ids.");
  }

  const taskIds = new Set(tasks.map((task) => task.id));
  const focusSessions: FocusSession[] = [];
  const rawSessions = Array.isArray(raw.focusSessions) ? raw.focusSessions : [];
  for (const item of rawSessions) {
    const session = validateFocusSession(item);
    if (!session) {
      continue;
    }
    focusSessions.push(
      session.taskId !== null && !taskIds.has(session.taskId)
        ? { ...session, taskId: null }
        : session,
    );
  }

  return {
    kind: "ok",
    data: {
      schemaVersion: SCHEMA_VERSION,
      projects,
      tasks,
      focusSessions,
      settings: validateSettings(raw.settings),
    },
  };
}

/**
 * Upgrades a version-1 payload to the current shape. Returns null when the
 * payload is not a readable v1 document, so the caller can report it instead
 * of silently discarding the data.
 */
export function migrateV1(raw: unknown): AppData | null {
  if (!isPlainObject(raw) || raw.schemaVersion !== 1) {
    return null;
  }
  if (!Array.isArray(raw.projects) || !Array.isArray(raw.tasks)) {
    return null;
  }
  const upgraded = {
    schemaVersion: SCHEMA_VERSION,
    projects: raw.projects,
    tasks: (raw.tasks as unknown[]).map((task, index) => {
      if (!isPlainObject(task)) {
        return task;
      }
      return {
        subtasks: [],
        priority: null,
        dueDate: null,
        emoji: null,
        color: null,
        order: typeof task.order === "number" ? task.order : index,
        completedAt: null,
        ...task,
      };
    }),
    focusSessions: [],
    settings: createDefaultSettings(),
  };
  const outcome = validateAppData(upgraded);
  return outcome.kind === "ok" ? outcome.data : null;
}
