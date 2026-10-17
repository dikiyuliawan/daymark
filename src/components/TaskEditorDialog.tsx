import { FormEvent, useRef, useState } from "react";
import { useApp, EditorState } from "../app/store";
import { AppData, Priority, PRIORITIES, TaskStatus, priorityLabel } from "../domain/types";
import { useToast } from "./ToastProvider";
import { ModalDialog } from "./ModalDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dropdown } from "./Dropdown";
import { STATUS_CHOICES } from "./statusChoices";
import { EmojiColorPicker } from "./EmojiColorPicker";
import { SubtasksEditor } from "./SubtasksEditor";

type TaskEditorDialogProps = {
  editor: NonNullable<EditorState>;
  data: AppData;
  todayKey: string;
};

export function TaskEditorDialog({ editor, data, todayKey }: TaskEditorDialogProps) {
  const {
    closeEditor,
    addTask,
    updateTask,
    removeTask,
    restoreTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
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
    };
    if (editing) {
      updateTask(editing.id, { ...shared, status });
      showToast("Task saved");
    } else {
      addTask(shared);
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
    <ModalDialog
      title={editing ? "Edit task" : "New task"}
      initialFocusRef={titleRef}
      onClose={closeEditor}
    >
      <form onSubmit={handleSubmit} noValidate className="sheet-form">
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
          <label htmlFor="task-details">Details (optional)</label>
          <textarea
            id="task-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={2}
          />
        </div>

        <div className="field">
          <span className="field-label">Appearance</span>
          <EmojiColorPicker
            emoji={emoji}
            color={color}
            onChange={(next) => {
              setEmoji(next.emoji);
              setColor(next.color);
            }}
          />
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
            <span className="field-label">Due date</span>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Due date"
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

        <button
          type="button"
          className="switch-row"
          role="switch"
          aria-checked={inToday}
          onClick={() => setInToday((current) => !current)}
        >
          <span className="switch" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span className="switch-text">Add to Today</span>
        </button>

        <div className="dialog-footer">
          {editing ? (
            <button
              type="button"
              className="btn btn-danger-ghost"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete task
            </button>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={closeEditor}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editing ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
