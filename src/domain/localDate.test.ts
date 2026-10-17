import { describe, expect, it } from "vitest";
import { formatLocalDate, isLocalDateKey, localDateKey } from "./localDate";

describe("localDateKey", () => {
  it("formats the user's local calendar date, not UTC slicing", () => {
    // Constructed via local components, so the expected key holds in any TZ.
    const lateEvening = new Date(2026, 9, 17, 23, 59, 59);
    const earlyMorning = new Date(2026, 9, 17, 0, 0, 0);
    expect(localDateKey(lateEvening)).toBe("2026-10-17");
    expect(localDateKey(earlyMorning)).toBe("2026-10-17");
  });

  it("pads month and day", () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("defaults to the current date", () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    expect(localDateKey()).toBe(expected);
  });
});

describe("isLocalDateKey", () => {
  it("accepts YYYY-MM-DD strings", () => {
    expect(isLocalDateKey("2026-10-17")).toBe(true);
  });

  it("rejects other shapes", () => {
    expect(isLocalDateKey("2026/10/17")).toBe(false);
    expect(isLocalDateKey("2026-10-17T10:00:00Z")).toBe(false);
    expect(isLocalDateKey(null)).toBe(false);
    expect(isLocalDateKey(123)).toBe(false);
  });
});

describe("formatLocalDate", () => {
  it("renders a human-readable date for valid keys", () => {
    expect(formatLocalDate("2026-10-17")).toMatch(/2026/);
    expect(formatLocalDate("2026-10-17")).toMatch(/17/);
  });

  it("falls back to the raw key when malformed", () => {
    expect(formatLocalDate("not-a-date")).toBe("not-a-date");
  });
});
