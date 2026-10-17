import { describe, expect, it } from "vitest";
import { Task } from "./types";
import { dropOrder, moveWithin, reorderGroup, sortByOrder } from "./reorder";

function task(id: string, order: number): Task {
  return {
    id,
    title: id,
    details: "",
    status: "todo",
    projectId: null,
    scheduledDate: null,
    dueDate: null,
    priority: null,
    emoji: null,
    color: null,
    subtasks: [],
    order,
    createdAt: "2026-10-17T08:00:00.000Z",
    updatedAt: "2026-10-17T08:00:00.000Z",
    completedAt: null,
  };
}

describe("reorder", () => {
  it("assigns order to match the given sequence", () => {
    const tasks = [task("a", 0), task("b", 1), task("c", 2)];
    const next = reorderGroup(tasks, ["c", "a", "b"]);
    expect(next.map((t) => t.order)).toEqual([1, 2, 0]);
    expect(sortByOrder(next).map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("leaves unrelated tasks untouched", () => {
    const tasks = [task("a", 0), task("b", 1), task("z", 9)];
    const next = reorderGroup(tasks, ["b", "a"]);
    expect(next.find((t) => t.id === "z")?.order).toBe(9);
  });

  it("moves within a list and clamps bounds", () => {
    expect(moveWithin(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveWithin(["a", "b", "c"], 2, 9)).toEqual(["a", "b", "c"]);
    expect(moveWithin(["a", "b", "c"], 5, 0)).toEqual(["a", "b", "c"]);
    expect(moveWithin(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("drops before or after a target", () => {
    expect(dropOrder(["a", "b", "c"], "a", "c", false)).toEqual(["b", "a", "c"]);
    expect(dropOrder(["a", "b", "c"], "a", "b", true)).toEqual(["b", "a", "c"]);
    expect(dropOrder(["a", "b", "c"], "a", "a", true)).toEqual(["a", "b", "c"]);
  });
});
