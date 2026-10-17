import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, createEmptyAppData } from "./types";
import { migrateV1, validateAppData } from "./validate";

function v2Payload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    projects: [],
    tasks: [],
    focusSessions: [],
    settings: { theme: "system" },
    ...overrides,
  };
}

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    title: "Read the spec",
    details: "",
    status: "todo",
    projectId: null,
    scheduledDate: null,
    dueDate: null,
    priority: null,
    emoji: null,
    color: null,
    subtasks: [],
    order: 0,
    createdAt: "2026-10-17T08:00:00.000Z",
    updatedAt: "2026-10-17T08:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("validateAppData (v2)", () => {
  it("accepts a fully populated payload", () => {
    const outcome = validateAppData(
      v2Payload({
        projects: [
          {
            id: "p1",
            name: "Auth",
            emoji: "🔐",
            color: "pine",
            createdAt: "x",
            updatedAt: "x",
          },
        ],
        tasks: [
          task({
            projectId: "p1",
            scheduledDate: "2026-10-17",
            dueDate: "2026-10-20",
            priority: "high",
            emoji: "🔥",
            color: "amber",
            subtasks: [{ id: "s1", title: "Step", done: true }],
            order: 3,
          }),
        ],
      }),
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].priority).toBe("high");
      expect(outcome.data.tasks[0].subtasks[0].done).toBe(true);
      expect(outcome.data.projects[0].emoji).toBe("🔐");
    }
  });

  it("accepts empty data", () => {
    expect(validateAppData(createEmptyAppData()).kind).toBe("ok");
  });

  it("rejects unsupported versions and non-objects", () => {
    expect(validateAppData(v2Payload({ schemaVersion: 99 })).kind).toBe("invalid");
    expect(validateAppData(null).kind).toBe("invalid");
    expect(validateAppData("nope").kind).toBe("invalid");
  });

  it("rejects bad status/priority and normalizes unknown priority to null", () => {
    expect(validateAppData(v2Payload({ tasks: [task({ status: "archived" })] })).kind).toBe(
      "invalid",
    );
    const outcome = validateAppData(v2Payload({ tasks: [task({ priority: "urgent" })] }));
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].priority).toBeNull();
    }
  });

  it("normalizes dangling project and session references", () => {
    const outcome = validateAppData(
      v2Payload({
        tasks: [task({ projectId: "ghost" })],
        focusSessions: [
          {
            id: "f1",
            taskId: "ghost",
            startedAt: "2026-10-17T08:00:00.000Z",
            endedAt: "2026-10-17T08:25:00.000Z",
            durationSec: 1500,
          },
        ],
      }),
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].projectId).toBeNull();
      expect(outcome.data.focusSessions[0].taskId).toBeNull();
    }
  });

  it("derives completedAt for done tasks that lack it", () => {
    const outcome = validateAppData(
      v2Payload({
        tasks: [task({ status: "done", completedAt: null, updatedAt: "2026-10-17T09:00:00.000Z" })],
      }),
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.tasks[0].completedAt).toBe("2026-10-17T09:00:00.000Z");
    }
  });

  it("defaults missing settings to system theme", () => {
    const outcome = validateAppData(v2Payload({ settings: { theme: "neon" } }));
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.settings.theme).toBe("system");
    }
  });
});

describe("migrateV1", () => {
  it("upgrades a v1 document with new fields defaulted", () => {
    const v1 = {
      schemaVersion: 1,
      projects: [
        { id: "p1", name: "Auth", createdAt: "x", updatedAt: "x" },
      ],
      tasks: [
        {
          id: "t1",
          title: "Old task",
          details: "notes",
          status: "done",
          projectId: "p1",
          scheduledDate: "2026-10-17",
          createdAt: "2026-10-16T08:00:00.000Z",
          updatedAt: "2026-10-17T08:00:00.000Z",
        },
      ],
    };
    const migrated = migrateV1(v1);
    expect(migrated).not.toBeNull();
    if (!migrated) return;
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.tasks[0].subtasks).toEqual([]);
    expect(migrated.tasks[0].priority).toBeNull();
    expect(migrated.tasks[0].dueDate).toBeNull();
    expect(migrated.tasks[0].emoji).toBeNull();
    expect(migrated.tasks[0].completedAt).toBe("2026-10-17T08:00:00.000Z");
    expect(migrated.settings.theme).toBe("system");
    expect(migrated.focusSessions).toEqual([]);
  });

  it("returns null for non-v1 payloads", () => {
    expect(migrateV1({ schemaVersion: 2, projects: [], tasks: [] })).toBeNull();
    expect(migrateV1("garbage")).toBeNull();
    expect(migrateV1({ schemaVersion: 1, projects: [], tasks: "no" })).toBeNull();
  });
});
