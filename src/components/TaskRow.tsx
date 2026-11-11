import { DragEvent, KeyboardEvent } from "react";
import {
  Priority,
  Project,
  Task,
  TaskStatus,
  priorityLabel,
  statusLabel,
} from "../domain/types";
import { formatDateCompact, localDateKey } from "../domain/localDate";
import { formatDurationClock, formatDurationLabel } from "../domain/format";
import { Dropdown } from "./Dropdown";
import { STATUS_CHOICES } from "./statusChoices";
import { CheckCircle } from "./CheckCircle";
import { CalendarIcon, FlagIcon, GripIcon, RepeatIcon } from "./icons";
import { repeatLabel } from "../domain/recurrence";

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
  const today = localDateKey();
  const overdue = task.dueDate !== null && task.dueDate < today && task.status !== "done";
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((subtask) => subtask.done).length;
  const done = task.status === "done";
  const rowId = `task-${task.id}`;
  const isRitual = task.repeat !== null;

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
      {isRitual ? (
        <span className="row-check row-check-ritual" aria-hidden="true">
          <RepeatIcon size={20} />
        </span>
      ) : (
        <button
          type="button"
          className="row-check"
          aria-pressed={done}
          aria-label={done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
          onClick={() => onStatusChange(task.id, done ? "todo" : "done")}
        >
          <CheckCircle checked={done} inProgress={task.status === "in_progress"} />
        </button>
      )}

      <div className="row-body">
        <button
          type="button"
          className="row-title"
          onClick={() => onOpen(task.id)}
          aria-label={`Open task details: ${task.title}`}
        >
          <span className="row-title-text">{task.title}</span>
        </button>

        <div className="row-meta">
          {isRitual ? <span className="meta-ritual">{repeatLabel(task.repeat)}</span> : null}
          {task.dueDate ? (
            <span className={overdue ? "meta-overdue" : undefined}>
              <CalendarIcon size={13} />
              {overdue ? "Overdue" : formatDateCompact(task.dueDate)}
            </span>
          ) : null}
          {task.priority ? (
            <span
              className="meta-flag"
              data-priority={task.priority}
              title={`${priorityLabel(task.priority)} priority`}
            >
              <FlagIcon size={13} />
              <span className="visually-hidden">{priorityLabel(task.priority)} priority</span>
            </span>
          ) : null}
          {task.emoji ? (
            <span className="meta-emoji" aria-hidden="true">
              {task.emoji}
            </span>
          ) : null}
          {project ? (
            <span className="meta-project">
              {task.emoji ? "" : `${project.emoji ? `${project.emoji} ` : ""}`}
              #{project.name}
            </span>
          ) : null}
          <Dropdown
            variant="dot"
            label={`Status for "${task.title}"`}
            value={task.status}
            options={STATUS_CHOICES}
            onChange={(value) => onStatusChange(task.id, value as TaskStatus)}
            describedBy={`${rowId}-status`}
          />
          <span id={`${rowId}-status`} className="visually-hidden">
            {statusLabel(task.status)}
          </span>
          {showTodayToggle && !inToday ? (
            <button
              type="button"
              className="chip chip-xs"
              onClick={() => onToggleToday(task.id, true)}
              aria-label={`Add “${task.title}” to Today`}
            >
              Today
            </button>
          ) : null}
        </div>
      </div>

      {task.durationMin !== null ? (
        <span className="row-pill" aria-label={`Planned ${formatDurationLabel(task.durationMin)}`}>
          {formatDurationClock(task.durationMin)}
        </span>
      ) : subtaskTotal > 0 ? (
        <span className="row-pill">
          {subtaskDone}/{subtaskTotal}
        </span>
      ) : null}

      {onMove ? (
        <button
          type="button"
          className="row-grip"
          draggable
          onDragStart={handleDragStart}
          onKeyDown={handleGripKeyDown}
          aria-label={`Reorder "${task.title}" (Alt+Arrow)`}
        >
          <GripIcon size={16} />
        </button>
      ) : null}
    </li>
  );
}

export type { Priority };
