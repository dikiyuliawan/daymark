import { DragEvent, KeyboardEvent } from "react";
import { Priority, Project, Task, TaskStatus, priorityLabel } from "../domain/types";
import { formatLocalDateShort, localDateKey } from "../domain/localDate";
import { tileGlyph, tileHex } from "../domain/appearance";
import { Dropdown } from "./Dropdown";
import { STATUS_CHOICES } from "./statusChoices";
import { CalendarIcon, FlagIcon, GripIcon } from "./icons";

type TaskRowProps = {
  task: Task;
  projects: Project[];
  showProject?: boolean;
  showTodayToggle?: boolean;
  onOpen: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string, on: boolean) => void;
  onMove?: (taskId: string, delta: -1 | 1) => void;
  onDrop?: (draggedId: string, targetId: string, placeAfter: boolean) => void;
};

export function TaskRow({
  task,
  projects,
  showProject = true,
  showTodayToggle = true,
  onOpen,
  onStatusChange,
  onToggleToday,
  onMove,
  onDrop,
}: TaskRowProps) {
  const project =
    showProject && task.projectId !== null
      ? projects.find((candidate) => candidate.id === task.projectId)
      : undefined;
  const inToday = task.scheduledDate !== null;
  const hex = tileHex(task.color);
  const today = localDateKey();
  const overdue = task.dueDate !== null && task.dueDate < today && task.status !== "done";
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((subtask) => subtask.done).length;

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLLIElement>) => {
    if (onDrop) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>) => {
    if (!onDrop) return;
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain");
    if (!draggedId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + rect.height / 2;
    onDrop(draggedId, task.id, placeAfter);
  };

  const handleGripKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!onMove || !event.altKey) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onMove(task.id, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onMove(task.id, 1);
    }
  };

  return (
    <li className="row" data-status={task.status} onDragOver={handleDragOver} onDrop={handleDrop}>
      {onMove ? (
        <button
          type="button"
          className="row-grip"
          draggable
          onDragStart={handleDragStart}
          onKeyDown={handleGripKeyDown}
          aria-label={`Reorder "${task.title}" (Alt+Arrow)`}
        >
          <GripIcon />
        </button>
      ) : null}
      <span
        className="tile"
        aria-hidden="true"
        style={hex ? ({ "--tile": hex } as React.CSSProperties) : undefined}
      >
        {task.emoji ?? tileGlyph(task.title)}
      </span>
      <div className="row-body">
        <button
          type="button"
          className="row-title"
          onClick={() => onOpen(task.id)}
          aria-label={`Open task details: ${task.title}`}
        >
          {task.title}
        </button>
        <div className="row-meta">
          {task.priority ? (
            <span className="tag tag-priority" data-priority={task.priority}>
              <FlagIcon size={12} />
              {priorityLabel(task.priority)}
            </span>
          ) : null}
          {project ? <span className="tag">{project.emoji ? `${project.emoji} ` : ""}{project.name}</span> : null}
          {task.dueDate ? (
            <span className="tag" data-overdue={overdue ? "true" : undefined}>
              <CalendarIcon size={12} />
              {formatLocalDateShort(task.dueDate)}
            </span>
          ) : null}
          {subtaskTotal > 0 ? (
            <span className="tag" data-complete={subtaskDone === subtaskTotal ? "true" : undefined}>
              {subtaskDone}/{subtaskTotal}
            </span>
          ) : null}
          {showTodayToggle && !inToday ? (
            <button
              type="button"
              className="chip chip-xs"
              onClick={() => onToggleToday(task.id, true)}
              aria-label={`Add "${task.title}" to Today`}
            >
              Today
            </button>
          ) : null}
          {showTodayToggle && inToday ? (
            <button
              type="button"
              className="chip chip-xs is-on"
              onClick={() => onToggleToday(task.id, false)}
              aria-label={`Remove "${task.title}" from Today`}
            >
              On Today
            </button>
          ) : null}
        </div>
      </div>
      <Dropdown
        variant="chip"
        label={`Status for "${task.title}"`}
        value={task.status}
        options={STATUS_CHOICES}
        onChange={(value) => onStatusChange(task.id, value as TaskStatus)}
      />
    </li>
  );
}

export type { Priority };
