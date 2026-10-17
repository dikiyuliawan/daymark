import { FormEvent, useRef, useState } from "react";
import { useApp, EditorState } from "../app/store";
import { AppData, TaskStatus, statusLabel } from "../domain/types";
import { useToast } from "./ToastProvider";
import { ModalDialog } from "./ModalDialog";
import { ConfirmDialog } from "./ConfirmDialog";

type TaskEditorDialogProps = {
  editor: NonNullable<EditorState>;
  data: AppData;
  todayKey: string;
};

export function TaskEditorDialog({ editor, data, todayKey }: TaskEditorDialogProps) {
  const { closeEditor, addTask, updateTask, removeTask, restoreTask } = useApp();
  const { showToast } = useToast();

  const editing =
    editor.mode === "edit" ? data.tasks.find((t) => t.id === editor.taskId) ?? null : null;

  const [title, setTitle] = useState(editing ? editing.title : "");
  const [details, setDetails] = useState(editing ? editing.details : "");
  const [projectId, setProjectId] = useState(
    editor.mode === "edit" ? editing?.projectId ?? "" : editor.defaults?.projectId ?? "",
  );
  const [status, setStatus] = useState<TaskStatus>(editing ? editing.status : "todo");
  const [inToday, setInToday] = useState(
    editor.mode === "edit"
      ? editing?.scheduledDate !== null
      : Boolean(editor.defaults?.addToToday),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const scheduledDate = inToday ? todayKey : null;
  const editingTodayDate = editing?.scheduledDate ?? null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "") {
      setTitleError("A task needs a title.");
      titleRef.current?.focus();
      return;
    }
    if (editing) {
      updateTask(editing.id, {
        title: trimmed,
        details,
        status,
        projectId: projectId === "" ? null : projectId,
        scheduledDate,
      });
      showToast("Task saved");
    } else {
      addTask({
        title: trimmed,
        details,
        projectId: projectId === "" ? null : projectId,
        scheduledDate,
      });
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
            showToast("Task deleted", {
              label: "Undo",
              onAction: () => restoreTask(removed),
            });
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
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError !== null) {
                setTitleError(null);
              }
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
            rows={3}
          />
        </div>
        <div className="field">
          <label htmlFor="task-project">Project (optional)</label>
          <select
            id="task-project"
            className="select"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">No project</option>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        {editing ? (
          <div className="field">
            <label htmlFor="task-status">Status</label>
            <select
              id="task-status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              {(["todo", "in_progress", "done"] as const).map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field field-checkbox">
          <label>
            <input
              type="checkbox"
              checked={inToday}
              onChange={(event) => setInToday(event.target.checked)}
            />
            <span>
              {inToday
                ? `On Today${editingTodayDate && editingTodayDate !== todayKey ? ` (was ${editingTodayDate})` : ""}`
                : "Add to Today"}
            </span>
          </label>
        </div>
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
          <button type="button" className="btn" onClick={closeEditor}>
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
