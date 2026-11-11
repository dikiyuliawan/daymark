import { describe, expect, it } from "vitest";
import { formatDurationClock, formatDurationLabel } from "./format";

describe("duration formatting", () => {
  it("writes a length as a clock, the way the reference pill does", () => {
    expect(formatDurationClock(30)).toBe("0:30");
    expect(formatDurationClock(60)).toBe("1:00");
    expect(formatDurationClock(90)).toBe("1:30");
    expect(formatDurationClock(120)).toBe("2:00");
    expect(formatDurationClock(0)).toBe("0:00");
  });

  it("writes a length in plain words for the day's plan", () => {
    expect(formatDurationLabel(0)).toBe("0m");
    expect(formatDurationLabel(45)).toBe("45m");
    expect(formatDurationLabel(60)).toBe("1h");
    expect(formatDurationLabel(90)).toBe("1h 30m");
    expect(formatDurationLabel(225)).toBe("3h 45m");
  });
});
