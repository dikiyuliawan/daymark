import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../app/App";
import { localDateKey } from "../domain/localDate";

const STORAGE_KEY = "daymark:data:v1";

// The quick-capture dialog is the only dialog on screen during creation, so
// scope Title and the submit button to it — page headings contain their own
// "Add task" actions with the same accessible name.
async function submitTaskInDialog(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  const dialog = screen.getByRole("dialog");
  await user.type(within(dialog).getByLabelText("Title"), title);
  await user.click(within(dialog).getByRole("button", { name: "Add task" }));
  // Sidebar and bottom-nav render the same navigation twice in jsdom (CSS is
  // not applied), so pick the sidebar instance.
  await user.click(screen.getAllByRole("link", { name: "Tasks" })[0]);
  await screen.findByText(title);
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

    await user.click(screen.getAllByRole("button", { name: "New task" })[0]);
    await submitTaskInDialog(user, "Fix flaky test");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).tasks).toHaveLength(1);

    // Simulate closing and reopening the app.
    cleanup();
    const second = render(<App />);
    expect(await second.findByText("Fix flaky test")).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.schemaVersion).toBe(1);
    expect(stored.tasks[0].status).toBe("todo");
    expect(stored.tasks[0].projectId).toBeNull();
  });

  it("shows a recovery banner for malformed saved data and preserves it", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{{{totally broken");
    render(<App />);

    expect(
      await screen.findByText(/Daymark could not read the data saved in this browser/),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("{{{totally broken");

    expect(screen.getByRole("button", { name: /Continue with an empty workspace/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Clear saved data and start fresh/ }),
    ).toBeInTheDocument();
  });

  it("adds a task to Today from the Today view and lists it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add a task" }));
    await submitTaskInDialog(user, "Prep demo");
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.tasks[0].scheduledDate).toBe(localDateKey());
  });

  it("moves a task through statuses and keeps it in the list when done", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "New task" })[0]);
    await submitTaskInDialog(user, "Deploy thing");

    const selects = screen.getAllByRole("combobox", { name: /Task "Deploy thing": status/ });
    await user.selectOptions(selects[0], "done");

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(stored.tasks[0].status).toBe("done");
    });
    expect(screen.getByText("Deploy thing")).toBeInTheDocument();
  });

  it("creates a project, assigns a task, then deletes the project after confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a task first.
    await user.click(screen.getAllByRole("button", { name: "New task" })[0]);
    await submitTaskInDialog(user, "Update deps");

    // Move to Projects and create one.
    await user.click(screen.getAllByRole("link", { name: "Projects" })[0]);
    await user.type(screen.getByPlaceholderText("e.g. Rewrite auth flow"), "Maintenance");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(await screen.findByText("Maintenance")).toBeInTheDocument();

    // Assign the unassigned task via its details dialog from the Tasks view.
    await user.click(screen.getAllByRole("link", { name: "Tasks" })[0]);
    await user.click(screen.getByRole("button", { name: /Open task details: Update deps/ }));
    await user.selectOptions(screen.getByLabelText("Project (optional)"), "Maintenance");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(stored.tasks[0].projectId).toBe(stored.projects[0].id);
    });

    // Delete the project with tasks; confirm unassignment.
    await user.click(screen.getAllByRole("link", { name: "Projects" })[0]);
    await user.click(screen.getByRole("link", { name: /Maintenance\s*1 task/ }));
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    const confirmBox = screen.getByRole("alertdialog");
    expect(confirmBox).toHaveTextContent(/task stays/);
    await user.click(
      within(confirmBox).getByRole("button", { name: "Delete project" }),
    );

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(stored.projects).toHaveLength(0);
      expect(stored.tasks[0].projectId).toBeNull();
    });
    await user.click(screen.getAllByRole("link", { name: "Tasks" })[0]);
    expect(screen.getByText("Update deps")).toBeInTheDocument();
  });

  it("deletes a task via the editor with an Undo toast", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "New task" })[0]);
    await submitTaskInDialog(user, "Temporary task");

    await user.click(screen.getByRole("button", { name: /Open task details: Temporary task/ }));
    await user.click(screen.getByRole("button", { name: "Delete task" }));
    const confirmBox = screen.getByRole("alertdialog");
    await user.click(within(confirmBox).getByRole("button", { name: "Delete task" }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(stored.tasks).toHaveLength(0);
    });

    await user.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(stored.tasks).toHaveLength(1);
    });
    expect(screen.getByText("Temporary task")).toBeInTheDocument();
  });

  it("filters the Tasks view by status and No project", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "New task" })[0]);
    await submitTaskInDialog(user, "Alpha");

    await user.click(screen.getAllByRole("link", { name: "Tasks" })[0]);
    const projectFilter = screen.getByRole("combobox", { name: "Project" });
    await user.selectOptions(projectFilter, "none");
    expect(screen.getByText("Alpha")).toBeInTheDocument();

    const statusFilter = screen.getByRole("combobox", { name: "Status" });
    await user.selectOptions(statusFilter, "done");
    expect(screen.getByText(/No tasks match these filters/)).toBeInTheDocument();
  });
});
