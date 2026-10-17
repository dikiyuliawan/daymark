import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FocusTimer } from "./FocusTimer";

describe("FocusTimer", () => {
  it("shows the default duration and starts a countdown", async () => {
    const user = userEvent.setup();
    render(<FocusTimer tasks={[]} onComplete={() => {}} />);

    expect(screen.getByText("25:00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(screen.getByText("24:59")).toBeInTheDocument();
  });

  it("saves elapsed time when finished early", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<FocusTimer tasks={[]} onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: "15 min" }));
    await user.click(screen.getByRole("button", { name: "Start" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const session = onComplete.mock.calls[0][0];
    expect(session.taskId).toBeNull();
    expect(session.durationSec).toBeGreaterThanOrEqual(1);
  });

  it("resets back to the ready state", async () => {
    const user = userEvent.setup();
    render(<FocusTimer tasks={[]} onComplete={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });
});
