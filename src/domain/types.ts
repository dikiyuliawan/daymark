export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";
export type ThemeMode = "system" | "light" | "dark";

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"] as const;
export const PRIORITIES: readonly Priority[] = ["low", "medium", "high"] as const;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
  }
}

export function priorityLabel(priority: Priority): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type Project = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  details: string;
  status: TaskStatus;
  projectId: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  priority: Priority | null;
  emoji: string | null;
  color: string | null;
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type FocusSession = {
  id: string;
  taskId: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
};

export type Settings = {
  theme: ThemeMode;
};

export type AppData = {
  schemaVersion: number;
  projects: Project[];
  tasks: Task[];
  focusSessions: FocusSession[];
  settings: Settings;
};

export const SCHEMA_VERSION = 2;

export function createDefaultSettings(): Settings {
  return { theme: "system" };
}

export function createEmptyAppData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    projects: [],
    tasks: [],
    focusSessions: [],
    settings: createDefaultSettings(),
  };
}

export type NewTaskInput = {
  title: string;
  details: string;
  projectId: string | null;
  scheduledDate: string | null;
};

export type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "details"
    | "status"
    | "projectId"
    | "scheduledDate"
    | "dueDate"
    | "priority"
    | "emoji"
    | "color"
    | "subtasks"
    | "order"
    | "completedAt"
  >
>;
