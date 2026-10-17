import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtasksEditor } from "./SubtasksEditor";
import { Subtask } from "../domain/types";

const SUBTASKS: Subtask[] = [
  { id: "s1", title: "Write tests", done: false },
  { id: "s2", title: "Ship it", done: true },
];

describe("SubtasksEditor", () => {
  it("renders steps with their checked state", () => {
    render(
      <SubtasksEditor subtasks={SUBTASKS} onAdd={() => {}} onToggle={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getByRole("checkbox", { name: "Write tests" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("checkbox", { name: "Ship it" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("adds a step from the input and Enter key", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <SubtasksEditor subtasks={[]} onAdd={onAdd} onToggle={() => {}} onRemove={() => {}} />,
    );

    await user.type(screen.getByLabelText("New step"), "Draft{Enter}");
    expect(onAdd).toHaveBeenCalledWith("Draft");
    expect(screen.getByLabelText("New step")).toHaveValue("");
  });

  it("toggles and removes steps", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    render(
      <SubtasksEditor
        subtasks={SUBTASKS}
        onAdd={() => {}}
        onToggle={onToggle}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Write tests" }));
    expect(onToggle).toHaveBeenCalledWith("s1", true);

    await user.click(screen.getByRole("button", { name: "Remove step Write tests" }));
    expect(onRemove).toHaveBeenCalledWith("s1");
  });
});
