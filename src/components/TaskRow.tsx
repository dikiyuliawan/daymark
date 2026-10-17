import { Project, Task, TaskStatus } from "../domain/types";
import { StatusSelect } from "./StatusSelect";

type TaskRowProps = {
  task: Task;
  projects: Project[];
  onOpen: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string, on: boolean) => void;
  showProject?: boolean;
};

export function TaskRow({
  task,
  projects,
  onOpen,
  onStatusChange,
  onToggleToday,
  showProject = true,
}: TaskRowProps) {
  const project =
    showProject && task.projectId !== null
      ? projects.find((p) => p.id === task.projectId)
      : undefined;
  const inToday = task.scheduledDate !== null;
  return (
    <li className={`task-row${task.status === "done" ? " task-row-done" : ""}`}>
      <StatusSelect
        value={task.status}
        label={`Task "${task.title}"`}
        onChange={(status) => onStatusChange(task.id, status)}
      />
      <div className="task-main">
        <button
          type="button"
          className="task-title"
          onClick={() => onOpen(task.id)}
          aria-label={`Open task details: ${task.title}`}
        >
          {task.title}
        </button>
        {project ? (
          <div className="task-meta">
            <span>{project.name}</span>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-small"
        onClick={() => onToggleToday(task.id, !inToday)}
        aria-label={
          inToday ? `Remove "${task.title}" from Today` : `Add "${task.title}" to Today`
        }
      >
        {inToday ? "Remove from Today" : "Add to Today"}
      </button>
    </li>
  );
}
