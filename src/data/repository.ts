import {
  AppData,
  FocusSession,
  NewTaskInput,
  Priority,
  Project,
  RepeatRule,
  SCHEMA_VERSION,
  Settings,
  Subtask,
  Task,
  TaskPatch,
  ThemeMode,
  createEmptyAppData,
} from "../domain/types";
import { migrateV1, migrateV2, migrateV3, validateAppData } from "../domain/validate";
import { addDays } from "../domain/localDate";
import { generateId, nowIso } from "./utils";
import {
  PREVIOUS_STORAGE_KEYS,
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

/** Upgrades a stored document of any known version to the current shape. */
function upgradeDocument(parsed: unknown): AppData | null {
  const version =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { schemaVersion?: unknown }).schemaVersion
      : null;
  if (version === 3) return migrateV3(parsed);
  if (version === 2) return migrateV2(parsed);
  if (version === 1) return migrateV1(parsed);
  return null;
}

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

    // An older build wrote to its own key: read it, upgrade it, and write the
    // upgraded document to the current key so the move happens once.
    for (const key of PREVIOUS_STORAGE_KEYS) {
      const legacy = readRaw(this.storage, key);
      if (!legacy.available) continue;
      if (legacy.raw === null) continue;
      let parsedLegacy: unknown;
      try {
        parsedLegacy = JSON.parse(legacy.raw);
      } catch {
        return { kind: "corrupt", reason: "Saved data is not valid JSON.", raw: legacy.raw };
      }
      const migrated = upgradeDocument(parsedLegacy);
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
      // A document from the previous version is upgraded, not rejected.
      const upgraded = upgradeDocument(parsed);
      if (upgraded === null) {
        return { kind: "corrupt", reason: outcome.reason, raw };
      }
      writeRaw(this.storage, STORAGE_KEY, serializeAppData(upgraded));
      return { kind: "ready", data: upgraded, migrated: true };
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
    durationMin: input.durationMin ?? null,
    repeat: null,
    templateId: null,
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

/* ---------- rituals ---------- */

/**
 * Give a task a repeat rule. The task stays as today's copy and a ritual is
 * laid down beside it, so tomorrow gets a fresh one with its steps reset.
 * Clearing the rule takes the ritual and its unfinished days away.
 */
export function setTaskRepeatInData(
  data: AppData,
  taskId: string,
  rule: RepeatRule | null,
): AppData {
  const task = data.tasks.find((item) => item.id === taskId);
  if (task === undefined) {
    return data;
  }
  if (rule === null) {
    const templateId = task.templateId ?? (task.repeat !== null ? task.id : null);
    const tasks = data.tasks
      .filter((item) => {
        if (item.id === taskId) return true;
        if (item.id === templateId) return false;
        if (templateId !== null && item.templateId === templateId && item.status !== "done") {
          return false;
        }
        return true;
      })
      .map((item) => (item.id === taskId ? { ...item, templateId: null } : item));
    return { ...data, tasks };
  }
  if (task.repeat !== null) {
    return {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, repeat: rule, updatedAt: nowIso() } : item,
      ),
    };
  }
  if (task.templateId !== null) {
    return {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === task.templateId
          ? { ...item, repeat: rule, updatedAt: nowIso() }
          : item,
      ),
    };
  }
  const stamp = nowIso();
  if (task.scheduledDate === null) {
    // A task waiting in the inbox becomes the ritual itself.
    return {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, repeat: rule, updatedAt: stamp } : item,
      ),
    };
  }
  // A task already laid on a day stays as that day's copy, and a ritual is
  // laid beside it so the next day gets a fresh one.
  const template: Task = {
    ...task,
    id: generateId(),
    repeat: rule,
    templateId: null,
    scheduledDate: null,
    status: "todo",
    completedAt: null,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask, done: false })),
    order: nextTopOrder(data.tasks) - 1,
    createdAt: stamp,
    updatedAt: stamp,
  };
  return {
    ...data,
    tasks: [
      ...data.tasks.map((item) =>
        item.id === taskId ? { ...item, templateId: template.id, updatedAt: stamp } : item,
      ),
      template,
    ],
  };
}

/* ---------- the day's plan ---------- */

/** Move tasks to a day: the plan's carry-over and deferrals. */
export function carryTasksToDateInData(
  data: AppData,
  taskIds: string[],
  dateKey: string | null,
): AppData {
  if (taskIds.length === 0) return data;
  const ids = new Set(taskIds);
  const stamp = nowIso();
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      ids.has(task.id) ? { ...task, scheduledDate: dateKey, updatedAt: stamp } : task,
    ),
  };
}

/* ---------- the day's close ---------- */

/** Close a day: carry what is left, note the highlight, remember the day. */
export function closeDayInData(
  data: AppData,
  dateKey: string,
  carryTaskIds: string[],
  highlight: string,
): AppData {
  // What is left rolls into tomorrow, where it becomes the first thing the
  // planning ritual asks about.
  const carried = carryTasksToDateInData(data, carryTaskIds, addDays(dateKey, 1));
  const trimmed = highlight.trim();
  const withoutOld = carried.highlights.filter((item) => item.dateKey !== dateKey);
  const highlights =
    trimmed === ""
      ? withoutOld
      : [
          ...withoutOld,
          { id: generateId(), dateKey, text: trimmed, createdAt: nowIso() },
        ];
  const shutdowns = carried.shutdowns.includes(dateKey)
    ? carried.shutdowns
    : [...carried.shutdowns, dateKey];
  return { ...carried, highlights, shutdowns };
}

export function highlightOn(data: AppData, dateKey: string): string {
  return data.highlights.find((item) => item.dateKey === dateKey)?.text ?? "";
}

export function isDayClosed(data: AppData, dateKey: string): boolean {
  return data.shutdowns.includes(dateKey);
}

/* ---------- settings ---------- */

export function setThemeInData(data: AppData, theme: ThemeMode): AppData {
  const settings: Settings = { ...data.settings, theme };
  return { ...data, settings };
}

export function setWorkdayMinutesInData(data: AppData, workdayMinutes: number): AppData {
  const settings: Settings = { ...data.settings, workdayMinutes };
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
