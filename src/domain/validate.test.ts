import { describe, expect, it } from "vitest";
import { createEmptyAppData, SCHEMA_VERSION, Task, TaskStatus } from "./types";
import { validateAppData } from "./validate";

function validTask(overrides: Partial<Task> = {}): Record<string, unknown> {
  return {
    id: "task-1",
    title: "Read the spec",
    details: "",
    status: "todo" satisfies TaskStatus,
    projectId: null,
    scheduledDate: null,
    createdAt: "2026-10-17T08:00:00.000Z",
    updatedAt: "2026-10-17T08:00:00.000Z",
    ...overrides,
  };
}

describe("validateAppData", () => {
  it("accepts a fully valid payload", () => {
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [
        {
          id: "p1",
          name: "Auth",
          createdAt: "2026-10-17T08:00:00.000Z",
          updatedAt: "2026-10-17T08:00:00.000Z",
        },
      ],
      tasks: [
        validTask({ projectId: "p1", scheduledDate: "2026-10-17", status: "in_progress" }),
      ],
    });
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].status).toBe("in_progress");
      expect(outcome.data.projects[0].name).toBe("Auth");
    }
  });

  it("accepts empty app data", () => {
    const outcome = validateAppData({ schemaVersion: SCHEMA_VERSION, projects: [], tasks: [] });
    expect(outcome.kind).toBe("ok");
  });

  it("rejects unsupported schema versions", () => {
    const outcome = validateAppData({ schemaVersion: 99, projects: [], tasks: [] });
    expect(outcome.kind).toBe("invalid");
    if (outcome.kind === "invalid") {
      expect(outcome.reason).toContain("unsupported version");
    }
  });

  it("rejects non-object payloads", () => {
    expect(validateAppData(null).kind).toBe("invalid");
    expect(validateAppData("hi").kind).toBe("invalid");
    expect(validateAppData([1, 2]).kind).toBe("invalid");
  });

  it("rejects tasks with unknown status values", () => {
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [validTask({ status: "archived" as unknown as TaskStatus })],
    });
    expect(outcome.kind).toBe("invalid");
    if (outcome.kind === "invalid") {
      expect(outcome.reason).toMatch(/task record/i);
    }
  });

  it("rejects tasks with invalid scheduledDate shapes", () => {
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [validTask({ scheduledDate: "17-10-2026" })],
    });
    expect(outcome.kind).toBe("invalid");
  });

  it("rejects tasks without a title", () => {
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [validTask({ title: 42 as unknown as string })],
    });
    expect(outcome.kind).toBe("invalid");
  });

  it("rejects duplicate ids and malformed projects", () => {
    const duplicate = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [validTask({ id: "same" }), validTask({ id: "same" })],
    });
    expect(duplicate.kind).toBe("invalid");

    const badProject = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [{ id: "p1" }],
      tasks: [],
    });
    expect(badProject.kind).toBe("invalid");
  });

  it("normalizes dangling project references to unassigned", () => {
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [validTask({ projectId: "ghost-project" })],
    });
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].projectId).toBeNull();
    }
  });

  it("defaults missing details to an empty string", () => {
    const raw = validTask();
    delete raw.details;
    const outcome = validateAppData({
      schemaVersion: SCHEMA_VERSION,
      projects: [],
      tasks: [raw],
    });
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].details).toBe("");
    }
  });

  it("never returns the empty factory's shape by accident", () => {
    const outcome = validateAppData(createEmptyAppData());
    expect(outcome.kind).toBe("ok");
  });
});
