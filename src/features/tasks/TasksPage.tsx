import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { TaskRow } from "../../components/TaskRow";
import { EmptyState } from "../../components/EmptyState";
import { TaskStatus, statusLabel } from "../../domain/types";

type StatusFilter = "all" | TaskStatus;
type ProjectFilter = "all" | "none" | string;

export function TasksPage() {
  const { data, todayKey, openCreate, openEdit, updateTask } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");

  const visible = useMemo(() => {
    const tasks = [...data.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      if (projectFilter === "none" && task.projectId !== null) {
        return false;
      }
      if (projectFilter !== "all" && projectFilter !== "none" && task.projectId !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [data.tasks, statusFilter, projectFilter]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-desc">Everything you captured, newest first.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
          Add task
        </button>
      </div>
      {data.tasks.length > 0 ? (
        <div className="filters">
          <label className="filter">
            <span>Status</span>
            <select
              className="select select-quiet"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="todo">{statusLabel("todo")}</option>
              <option value="in_progress">{statusLabel("in_progress")}</option>
              <option value="done">{statusLabel("done")}</option>
            </select>
          </label>
          <label className="filter">
            <span>Project</span>
            <select
              className="select select-quiet"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="none">No project</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {visible.length === 0 ? (
        data.tasks.length === 0 ? (
          <EmptyState title="No tasks yet.">
            <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
              Add your first task
            </button>
          </EmptyState>
        ) : (
          <EmptyState title="No tasks match these filters." />
        )
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projects={data.projects}
              onOpen={openEdit}
              onStatusChange={(id, status) => updateTask(id, { status })}
              onToggleToday={(id, on) => updateTask(id, { scheduledDate: on ? todayKey : null })}
            />
          ))}
        </ul>
      )}
      {data.tasks.length === 0 ? (
        <p className="page-footnote">
          Tasks can optionally belong to a project — a title alone is enough to capture one.
        </p>
      ) : null}
    </>
  );
}
