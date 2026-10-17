import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../app/App";
import { localDateKey } from "../domain/localDate";

const STORAGE_KEY = "daymark:data:v2";

function stored() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
}

// The quick-capture sheet is the only dialog on screen during creation, so
// scope Title and the submit button to it — page headings contain their own
// "Add task" actions with the same accessible name.
async function submitTaskInDialog(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  const dialog = screen.getByRole("dialog");
  await user.type(within(dialog).getByLabelText("Title"), title);
  await user.click(within(dialog).getByRole("button", { name: "Add task" }));
  await user.click(screen.getByRole("link", { name: "Tasks" }));
  await screen.findByText(title);
}

// Dropdowns are custom listboxes, not native selects, so the interaction is
// open-trigger-then-pick-option rather than selectOptions().
async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  triggerName: string,
  optionName: string,
  scope: HTMLElement = document.body,
) {
  await user.click(within(scope).getByRole("button", { name: triggerName }));
  const listbox = within(scope).getByRole("listbox");
  await user.click(within(listbox).getByRole("option", { name: optionName }));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = "#/today";
});

describe("app integration", () => {
  it("captures a task with only a title and persists it across a reload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Fix flaky test");
    expect(stored().tasks).toHaveLength(1);

    cleanup();
    const second = render(<App />);
    expect(await second.findByText("Fix flaky test")).toBeInTheDocument();

    const saved = stored();
    expect(saved.schemaVersion).toBe(2);
    expect(saved.tasks[0].status).toBe("todo");
    expect(saved.tasks[0].projectId).toBeNull();
    expect(saved.tasks[0].subtasks).toEqual([]);
  });

  it("shows a recovery banner for malformed saved data and preserves it", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{{{totally broken");
    render(<App />);

    expect(
      await screen.findByText(/Daymark could not read the data saved in this browser/),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("{{{totally broken");
    expect(screen.getByRole("button", { name: /Continue with an empty workspace/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear saved data and start fresh/ })).toBeInTheDocument();
  });

  it("adds a task to Today from the Today view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add a task" }));
    await submitTaskInDialog(user, "Prep demo");
    expect(stored().tasks[0].scheduledDate).toBe(localDateKey());
  });

  it("moves a task through statuses and keeps it in the list when done", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Deploy thing");
    await chooseOption(user, 'Status for "Deploy thing"', "Done");

    await waitFor(() => {
      expect(stored().tasks[0].status).toBe("done");
      expect(stored().tasks[0].completedAt).not.toBeNull();
    });
    expect(screen.getByText("Deploy thing")).toBeInTheDocument();
  });

  it("creates a project, assigns a task, then deletes the project after confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Update deps");

    await user.click(screen.getByRole("link", { name: "Projects" }));
    await user.type(screen.getByPlaceholderText("New project name"), "Maintenance");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Maintenance")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Tasks" }));
    await user.click(screen.getByRole("button", { name: /Open task details: Update deps/ }));
    const taskDialog = screen.getByRole("dialog");
    await chooseOption(user, "Project", "Maintenance", taskDialog);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(stored().tasks[0].projectId).toBe(stored().projects[0].id);
    });

    await user.click(screen.getByRole("link", { name: "Projects" }));
    await user.click(screen.getByRole("link", { name: /Maintenance\s*1 task/ }));
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    const confirmBox = screen.getByRole("alertdialog");
    expect(confirmBox).toHaveTextContent(/task stays/);
    await user.click(within(confirmBox).getByRole("button", { name: "Delete project" }));

    await waitFor(() => {
      expect(stored().projects).toHaveLength(0);
      expect(stored().tasks[0].projectId).toBeNull();
    });
  });

  it("deletes a task via the editor with an Undo toast", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Temporary task");

    await user.click(screen.getByRole("button", { name: /Open task details: Temporary task/ }));
    await user.click(screen.getByRole("button", { name: "Delete task" }));
    const confirmBox = screen.getByRole("alertdialog");
    await user.click(within(confirmBox).getByRole("button", { name: "Delete task" }));

    await waitFor(() => expect(stored().tasks).toHaveLength(0));

    await user.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() => expect(stored().tasks).toHaveLength(1));
    expect(screen.getByText("Temporary task")).toBeInTheDocument();
  });

  it("filters the Tasks view by status and No project", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Alpha");

    await chooseOption(user, "Project", "No project");
    expect(screen.getByText("Alpha")).toBeInTheDocument();

    const statusGroup = screen.getByRole("group", { name: "Status" });
    await user.click(within(statusGroup).getByRole("button", { name: "Done" }));
    expect(screen.getByText(/No tasks match these filters/)).toBeInTheDocument();
  });

  it("adds and completes subtasks with progress", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Ship the POC");
    await user.click(screen.getByRole("button", { name: /Open task details: Ship the POC/ }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("New step"), "Write tests");
    await user.click(within(dialog).getByRole("button", { name: "Add step" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Write tests" }));

    await waitFor(() => {
      const task = stored().tasks[0];
      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0].done).toBe(true);
    });
  });

  it("sets priority and a due date", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Plan sprint");
    await user.click(screen.getByRole("button", { name: /Open task details: Plan sprint/ }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "High" }));
    await user.type(within(dialog).getByLabelText("Due date"), "2026-11-01");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      const task = stored().tasks[0];
      expect(task.priority).toBe("high");
      expect(task.dueDate).toBe("2026-11-01");
    });
  });

  it("finds tasks through search", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Refactor router");
    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Water the plants");

    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.type(screen.getByLabelText("Search tasks"), "router");
    expect(await screen.findByText("Refactor router")).toBeInTheDocument();
    expect(screen.queryByText("Water the plants")).not.toBeInTheDocument();
  });

  it("reorders tasks with the keyboard on the grip", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "First");
    await user.click(screen.getByRole("button", { name: "New task" }));
    await submitTaskInDialog(user, "Second");

    const grip = screen.getByRole("button", { name: /Reorder "First"/ });
    grip.focus();
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    await waitFor(() => {
      const tasks = stored().tasks as { title: string; order: number }[];
      const first = tasks.find((task) => task.title === "First")!;
      const second = tasks.find((task) => task.title === "Second")!;
      expect(first.order).toBeLessThan(second.order);
    });
  });

  it("cycles and persists the theme", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Theme: system" }));
    expect(document.documentElement.dataset.theme).toBe("light");

    await user.click(screen.getByRole("button", { name: "Theme: light" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await waitFor(() => expect(stored().settings.theme).toBe("dark"));
  });

  it("logs a focus session", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Focus" }));
    await user.click(screen.getByRole("button", { name: "Start" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    await user.click(screen.getByRole("button", { name: "Finish" }));

    const sessions = stored().focusSessions as { durationSec: number }[];
    expect(sessions).toHaveLength(1);
    expect(sessions[0].durationSec).toBeGreaterThanOrEqual(1);
  });
});
