import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { PageHeading } from "../../components/PageHeading";
import { Split } from "../../components/Split";
import { Dropdown } from "../../components/Dropdown";
import { TaskStatus, statusLabel } from "../../domain/types";
import { groupTasks } from "./grouping";

type StatusFilter = "all" | TaskStatus;
type ProjectFilter = "all" | "none" | string;

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: statusLabel("todo") },
  { value: "in_progress", label: statusLabel("in_progress") },
  { value: "done", label: statusLabel("done") },
];

export function TasksPage() {
  const { data, todayKey, openCreate } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");

  const visible = useMemo(() => {
    return data.tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (projectFilter === "none" && task.projectId !== null) return false;
      if (projectFilter !== "all" && projectFilter !== "none" && task.projectId !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [data.tasks, statusFilter, projectFilter]);

  const groups = useMemo(() => groupTasks(visible, todayKey), [visible, todayKey]);
  const total = data.tasks.length;

  return (
    <>
      <PageHeading
        kicker={total === 0 ? "No tasks" : `${total} task${total === 1 ? "" : "s"}`}
        title="Tasks"
        description="Everything you captured, grouped by when it is due."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
            Add task
          </button>
        }
      />
      <Split
        side={
          total > 0 ? (
            <div className="side-card panel">
              <div className="chip-row" role="group" aria-label="Status">
                {STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    className={`chip${statusFilter === chip.value ? " is-on" : ""}`}
                    aria-pressed={statusFilter === chip.value}
                    onClick={() => setStatusFilter(chip.value)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <Dropdown
                variant="filter"
                label="Project"
                value={projectFilter}
                onChange={setProjectFilter}
                options={[
                  { value: "all", label: "All projects" },
                  { value: "none", label: "No project" },
                  ...data.projects.map((project) => ({ value: project.id, label: project.name })),
                ]}
              />
              <p className="muted small">
                Showing {visible.length} of {total}
              </p>
            </div>
          ) : null
        }
      >
        {visible.length === 0 ? (
          total === 0 ? (
            <EmptyState kicker="Start here" title="No tasks yet.">
              <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
                Add your first task
              </button>
            </EmptyState>
          ) : (
            <EmptyState kicker="Filtered" title="No tasks match these filters." />
          )
        ) : (
          <div className="groups">
            {groups.map((group) => (
              <TaskGroup
                key={group.key}
                title={group.label}
                tasks={group.tasks}
                projects={data.projects}
              />
            ))}
          </div>
        )}
      </Split>
    </>
  );
}
