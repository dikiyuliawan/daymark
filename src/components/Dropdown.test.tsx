import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown } from "./Dropdown";

const OPTIONS = [
  { value: "todo", label: "Todo", swatch: "status-todo" },
  { value: "in_progress", label: "In Progress", swatch: "status-in_progress" },
  { value: "done", label: "Done", swatch: "status-done" },
];

function Harness({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("todo");
  return (
    <Dropdown
      label="Status"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("Dropdown", () => {
  it("shows the selected value and opens a listbox on click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Status" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Todo");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option and closes the menu", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "In Progress" }));

    expect(onChange).toHaveBeenCalledWith("in_progress");
    expect(screen.getByRole("button", { name: "Status" })).toHaveTextContent("In Progress");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks the current option as selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Status" }));
    expect(within(screen.getByRole("listbox")).getByRole("option", { name: "Todo" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("supports keyboard navigation and selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: "Status" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("in_progress");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape and keeps focus on the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Status" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Harness />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Status" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
