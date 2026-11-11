import { FormEvent, useRef, useState } from "react";
import { useApp, EditorState } from "../app/store";
import {
  AppData,
  Priority,
  PRIORITIES,
  RepeatRule,
  TaskStatus,
  priorityLabel,
} from "../domain/types";
import { useToast } from "./ToastProvider";
import { Sheet } from "./Sheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dropdown } from "./Dropdown";
import { STATUS_CHOICES } from "./statusChoices";
import { EmojiColorPicker } from "./EmojiColorPicker";
import { SubtasksEditor } from "./SubtasksEditor";
import { formatDurationLabel } from "../domain/format";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const REPEAT_CHOICES: { value: RepeatRule; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday" },
  { value: "weekly", label: "Every week" },
];

type TaskEditorSheetProps = {
  editor: NonNullable<EditorState>;
  data: AppData;
  todayKey: string;
};

/**
 * The task sheet: a title at the top, its details under it, one action row.
 * On a phone it rises from the foot of the screen, on a wide screen it is a
 * centred panel.
 */
export function TaskEditorSheet({ editor, data, todayKey }: TaskEditorSheetProps) {
  const {
    closeEditor,
    addTask,
    updateTask,
    removeTask,
    restoreTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    setTaskRepeat,
  } = useApp();
  const { showToast } = useToast();

  const editing =
    editor.mode === "edit" ? data.tasks.find((t) => t.id === editor.taskId) ?? null : null;

  const [title, setTitle] = useState(editing ? editing.title : "");
  const [details, setDetails] = useState(editing ? editing.details : "");
  const [projectId, setProjectId] = useState(
    editor.mode === "edit" ? editing?.projectId ?? "" : editor.defaults?.projectId ?? "",
  );
  const [status, setStatus] = useState<TaskStatus>(editing ? editing.status : "todo");
  const [priority, setPriority] = useState<Priority | null>(editing?.priority ?? null);
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [emoji, setEmoji] = useState<string | null>(editing?.emoji ?? null);
  const [color, setColor] = useState<string | null>(editing?.color ?? null);
  const [duration, setDuration] = useState<number | null>(editing?.durationMin ?? null);
  const ritual = editing
    ? (editing.repeat !== null
        ? editing
        : (data.tasks.find((task) => task.id === editing.templateId) ?? null))
    : null;
  const [rule, setRule] = useState<RepeatRule | null>(ritual?.repeat ?? null);
  const [inToday, setInToday] = useState(
    editor.mode === "edit" ? editing?.scheduledDate !== null : Boolean(editor.defaults?.addToToday),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const scheduledDate = inToday ? todayKey : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "") {
      setTitleError("A task needs a title.");
      titleRef.current?.focus();
      return;
    }
    const shared = {
      title: trimmed,
      details,
      projectId: projectId === "" ? null : projectId,
      scheduledDate,
      dueDate: dueDate === "" ? null : dueDate,
      priority,
      emoji,
      color,
      durationMin: duration,
    };
    if (editing) {
      updateTask(editing.id, { ...shared, status });
      if ((rule ?? null) !== (ritual?.repeat ?? null)) {
        setTaskRepeat(editing.id, rule);
      }
      showToast("Task saved");
    } else {
      const created = addTask(shared);
      if (rule !== null) {
        setTaskRepeat(created.id, rule);
      }
      showToast(inToday ? "Task added to Today" : "Task added");
    }
    closeEditor();
  };

  if (confirmingDelete && editing) {
    return (
      <ConfirmDialog
        title="Delete this task?"
        message={<>“{editing.title}” will be removed from your task list.</>}
        confirmLabel="Delete task"
        danger
        onConfirm={() => {
          const removed = removeTask(editing.id);
          setConfirmingDelete(false);
          closeEditor();
          if (removed) {
            showToast("Task deleted", { label: "Undo", onAction: () => restoreTask(removed) });
          }
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    );
  }

  return (
    <Sheet
      title={editing ? "Edit task" : "New task"}
      onClose={closeEditor}
      initialFocusRef={titleRef}
      footer={
        <>
          {editing ? (
            <button
              type="button"
              className="btn btn--danger-ghost"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete task
            </button>
          ) : null}
          <button type="submit" form="task-form" className="btn btn--primary">
            {editing ? "Save changes" : "Add task"}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError !== null) setTitleError(null);
            }}
            aria-invalid={titleError !== null}
            aria-describedby={titleError !== null ? "task-title-error" : undefined}
            placeholder="What needs doing?"
          />
          {titleError !== null ? (
            <p id="task-title-error" className="field-error" role="alert">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="task-details">Details</label>
          <textarea
            id="task-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={2}
          />
        </div>

        <div className="field">
          <span className="field-label">Repeat</span>
          <div className="chip-row chip-row--tight" role="group" aria-label="Repeat">
            <button
              type="button"
              className={`chip${rule === null ? " is-on" : ""}`}
              aria-pressed={rule === null}
              onClick={() => setRule(null)}
            >
              Never
            </button>
            {REPEAT_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={`chip${rule === choice.value ? " is-on" : ""}`}
                aria-pressed={rule === choice.value}
                onClick={() => setRule(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Duration</span>
          <div className="chip-row chip-row--tight" role="group" aria-label="Duration">
            <button
              type="button"
              className={`chip${duration === null ? " is-on" : ""}`}
              aria-pressed={duration === null}
              onClick={() => setDuration(null)}
            >
              None
            </button>
            {DURATION_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                className={`chip${duration === value ? " is-on" : ""}`}
                aria-pressed={duration === value}
                onClick={() => setDuration(value)}
              >
                {formatDurationLabel(value)}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <span className="field-label">Project</span>
            <Dropdown
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={[
                { value: "", label: "No project" },
                ...data.projects.map((project) => ({
                  value: project.id,
                  label: `${project.emoji ? `${project.emoji} ` : ""}${project.name}`,
                })),
              ]}
            />
          </div>
          {editing ? (
            <div className="field">
              <span className="field-label">Status</span>
              <Dropdown
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as TaskStatus)}
                options={STATUS_CHOICES}
              />
            </div>
          ) : null}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="task-due">Due date</label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="field">
            <span className="field-label">Priority</span>
            <div className="chip-row" role="group" aria-label="Priority">
              <button
                type="button"
                className={`chip${priority === null ? " is-on" : ""}`}
                aria-pressed={priority === null}
                onClick={() => setPriority(null)}
              >
                None
              </button>
              {PRIORITIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip${priority === value ? " is-on" : ""}`}
                  aria-pressed={priority === value}
                  onClick={() => setPriority(value)}
                >
                  {priorityLabel(value)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {editing ? (
          <div className="field">
            <span className="field-label">Steps</span>
            <SubtasksEditor
              subtasks={editing.subtasks}
              onAdd={(value) => addSubtask(editing.id, value)}
              onToggle={(id, done) => toggleSubtask(editing.id, id, done)}
              onRemove={(id) => removeSubtask(editing.id, id)}
            />
          </div>
        ) : null}

        <div className="switch-row">
          <button
            type="button"
            className="m-switch"
            role="switch"
            aria-checked={inToday}
            aria-label="Add to Today"
            onClick={(event) => {
              // The kit's motion layer flips aria-checked on a switch it owns;
              // the state lives in React, so the click is claimed here.
              event.preventDefault();
              setInToday((current) => !current);
            }}
          />
          <span className="switch-text">Add to Today</span>
        </div>

        <div className="field">
          <EmojiColorPicker
            emoji={emoji}
            color={color}
            onChange={(next) => {
              setEmoji(next.emoji);
              setColor(next.color);
            }}
          />
        </div>
      </form>
    </Sheet>
  );
}
