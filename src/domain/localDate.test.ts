import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  formatLocalDate,
  formatLocalDateCompact,
  formatLocalDateShort,
  isLocalDateKey,
  lastNDaysKeys,
  localDateKey,
} from "./localDate";

describe("localDateKey", () => {
  it("formats the user's local calendar date, not UTC slicing", () => {
    expect(localDateKey(new Date(2026, 9, 17, 23, 59, 59))).toBe("2026-10-17");
    expect(localDateKey(new Date(2026, 9, 17, 0, 0, 0))).toBe("2026-10-17");
  });

  it("pads month and day", () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("isLocalDateKey", () => {
  it("accepts YYYY-MM-DD and rejects other shapes", () => {
    expect(isLocalDateKey("2026-10-17")).toBe(true);
    expect(isLocalDateKey("2026/10/17")).toBe(false);
    expect(isLocalDateKey("2026-10-17T10:00:00Z")).toBe(false);
    expect(isLocalDateKey(null)).toBe(false);
  });
});

describe("date math", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("builds a window of the last N days ending today", () => {
    const window = lastNDaysKeys(3, "2026-10-17");
    expect(window).toEqual(["2026-10-15", "2026-10-16", "2026-10-17"]);
  });

  it("diffs day keys", () => {
    expect(diffDays("2026-10-17", "2026-10-15")).toBe(2);
  });
});

describe("formatting", () => {
  it("renders human-readable dates and falls back on malformed input", () => {
    expect(formatLocalDate("2026-10-17")).toMatch(/2026/);
    expect(formatLocalDateCompact("2026-10-17")).toMatch(/17/);
    expect(formatLocalDateShort("2026-10-17")).toMatch(/17/);
    expect(formatLocalDate("not-a-date")).toBe("not-a-date");
    expect(formatLocalDateShort("nope")).toBe("nope");
  });
});
