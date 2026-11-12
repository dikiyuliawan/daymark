import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
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
  const { data, tasks, todayKey, openCreate } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("");

  const rituals = useMemo(
    () => data.tasks.filter((task) => task.repeat !== null),
    [data.tasks],
  );

  const visible = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (projectFilter === "none" && task.projectId !== null) return false;
      if (projectFilter !== "" && projectFilter !== "none" && task.projectId !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, projectFilter]);

  const groups = useMemo(() => groupTasks(visible, todayKey), [visible, todayKey]);
  const total = data.tasks.length;

  return (
    <>
      <ScreenHeader
        title="Tasks"
        sub={total === 0 ? undefined : `${total} task${total === 1 ? "" : "s"}`}
      />

      {total === 0 ? null : (
      <div className="filter-row">
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
          placeholder="Project"
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "", label: "All projects" },
            { value: "none", label: "No project" },
            ...data.projects.map((project) => ({ value: project.id, label: project.name })),
          ]}
        />
      </div>
      )}

      {rituals.length > 0 ? (
        <TaskGroup title="Rituals" tasks={rituals} projects={data.projects} />
      ) : null}

      {visible.length === 0 ? (
        total === 0 ? (
          <EmptyState kicker="Start here" title="No tasks yet.">
            <p className="muted small">Nothing captured yet. Add your first task and it waits for the day you plan it.</p>
            <button type="button" className="btn btn--primary" onClick={() => openCreate()}>
              Add a task
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
    </>
  );
}
