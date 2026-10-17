export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"] as const;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
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

export type Project = {
  id: string;
  name: string;
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
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  schemaVersion: number;
  projects: Project[];
  tasks: Task[];
};

export const SCHEMA_VERSION = 1;

export function createEmptyAppData(): AppData {
  return { schemaVersion: SCHEMA_VERSION, projects: [], tasks: [] };
}

export type NewTaskInput = {
  title: string;
  details: string;
  projectId: string | null;
  scheduledDate: string | null;
};

export type TaskPatch = Partial<
  Pick<Task, "title" | "details" | "status" | "projectId" | "scheduledDate">
>;
