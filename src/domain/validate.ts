import {
  AppData,
  Project,
  SCHEMA_VERSION,
  Task,
  isTaskStatus,
} from "./types";
import { isLocalDateKey } from "./localDate";

export type ValidationOutcome =
  | { kind: "ok"; data: AppData }
  | { kind: "invalid"; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function validateTask(raw: unknown): Task | null {
  if (!isPlainObject(raw)) return null;
  if (!isNonEmptyString(raw.id)) return null;
  if (typeof raw.title !== "string") return null;
  if (!isTaskStatus(raw.status)) return null;
  if (raw.projectId !== null && !isNonEmptyString(raw.projectId)) return null;
  if (raw.scheduledDate !== null && !isLocalDateKey(raw.scheduledDate)) return null;
  // details defaults to an empty string when absent so captured-but-unfinished
  // edits (e.g. from an earlier schema variant) still load.
  const details = typeof raw.details === "string" ? raw.details : "";
  if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") {
    return null;
  }
  return {
    id: raw.id,
    title: raw.title,
    details,
    status: raw.status,
    projectId: raw.projectId,
    scheduledDate: raw.scheduledDate,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

export function validateAppData(raw: unknown): ValidationOutcome {
  if (!isPlainObject(raw)) {
    return { kind: "invalid", reason: "Saved data is not a readable format." };
  }
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return {
      kind: "invalid",
      reason: `Saved data uses an unsupported version (${String(raw.schemaVersion)}).`,
    };
  }
  if (!Array.isArray(raw.projects) || !Array.isArray(raw.tasks)) {
    return { kind: "invalid", reason: "Saved data is missing task or project records." };
  }

  const projects: Project[] = [];
  for (const item of raw.projects) {
    const project = validateProject(item);
    if (!project) {
      return { kind: "invalid", reason: "A saved project record is malformed." };
    }
    projects.push(project);
  }
  if (hasDuplicates(projects.map((p) => p.id))) {
    return { kind: "invalid", reason: "Saved data contains duplicate project ids." };
  }

  const projectIds = new Set(projects.map((p) => p.id));
  const tasks: Task[] = [];
  for (const item of raw.tasks) {
    const task = validateTask(item);
    if (!task) {
      return { kind: "invalid", reason: "A saved task record is malformed." };
    }
    if (task.projectId !== null && !projectIds.has(task.projectId)) {
      task.projectId = null;
    }
    tasks.push(task);
  }
  if (hasDuplicates(tasks.map((t) => t.id))) {
    return { kind: "invalid", reason: "Saved data contains duplicate task ids." };
  }

  return { kind: "ok", data: { schemaVersion: SCHEMA_VERSION, projects, tasks } };
}
