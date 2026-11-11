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

export type RepeatRule = "daily" | "weekdays" | "weekly";

export const REPEAT_RULES: readonly RepeatRule[] = ["daily", "weekdays", "weekly"];

export function isRepeatRule(value: unknown): value is RepeatRule {
  return typeof value === "string" && (REPEAT_RULES as readonly string[]).includes(value);
}

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
  /** The planned length of the work, in minutes. Null when it is not sized. */
  durationMin: number | null;
  /** Set on a ritual: the rule that lays it down again. */
  repeat: RepeatRule | null;
  /** Set on a day laid down by a ritual: the ritual it came from. */
  templateId: string | null;
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

export type Highlight = {
  id: string;
  /** The day the note belongs to. */
  dateKey: string;
  text: string;
  createdAt: string;
};

export type Settings = {
  theme: ThemeMode;
  /** How much planned work a day holds, in minutes. */
  workdayMinutes: number;
};

export type AppData = {
  schemaVersion: number;
  projects: Project[];
  tasks: Task[];
  focusSessions: FocusSession[];
  /** One line a day, written at the shutdown. */
  highlights: Highlight[];
  /** The days that were closed with the shutdown ritual. */
  shutdowns: string[];
  settings: Settings;
};

export const SCHEMA_VERSION = 4;

/** Five hours of planned work a day, until the user says otherwise. */
export const DEFAULT_WORKDAY_MINUTES = 300;

export function createDefaultSettings(): Settings {
  return { theme: "system", workdayMinutes: DEFAULT_WORKDAY_MINUTES };
}

export function createEmptyAppData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    projects: [],
    tasks: [],
    focusSessions: [],
    highlights: [],
    shutdowns: [],
    settings: createDefaultSettings(),
  };
}

export type NewTaskInput = {
  title: string;
  details: string;
  projectId: string | null;
  scheduledDate: string | null;
  durationMin?: number | null;
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
    | "durationMin"
    | "repeat"
    | "templateId"
    | "subtasks"
    | "order"
    | "completedAt"
  >
>;
