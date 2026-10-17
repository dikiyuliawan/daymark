import { Task } from "../../domain/types";
import { sortByOrder } from "../../domain/reorder";

export type BucketKey = "overdue" | "today" | "upcoming" | "nodate" | "done";

export const BUCKET_ORDER: BucketKey[] = ["overdue", "today", "upcoming", "nodate", "done"];

export const BUCKET_LABEL: Record<BucketKey, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  nodate: "No date",
  done: "Completed",
};

export function bucketOf(task: Task, todayKey: string): BucketKey {
  if (task.status === "done") return "done";
  if (task.dueDate !== null) {
    if (task.dueDate < todayKey) return "overdue";
    if (task.dueDate === todayKey) return "today";
    return "upcoming";
  }
  if (task.scheduledDate === todayKey) return "today";
  return "nodate";
}

export type TaskGroupBucket = { key: BucketKey; label: string; tasks: Task[] };

export function groupTasks(tasks: Task[], todayKey: string): TaskGroupBucket[] {
  const buckets = new Map<BucketKey, Task[]>();
  for (const task of tasks) {
    const key = bucketOf(task, todayKey);
    const list = buckets.get(key);
    if (list) {
      list.push(task);
    } else {
      buckets.set(key, [task]);
    }
  }
  const result: TaskGroupBucket[] = [];
  for (const key of BUCKET_ORDER) {
    const list = buckets.get(key);
    if (list && list.length > 0) {
      result.push({ key, label: BUCKET_LABEL[key], tasks: sortByOrder(list) });
    }
  }
  return result;
}
