import { FormEvent, useState } from "react";
import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskRow } from "../../components/TaskRow";
import { EmptyState } from "../../components/EmptyState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/ToastProvider";

type Props = { projectId: string };

export function ProjectDetailPage({ projectId }: Props) {
  const { data, todayKey, openCreate, openEdit, updateTask, renameProject, removeProject } =
    useApp();
  const { showToast } = useToast();
  const project = data.projects.find((p) => p.id === projectId) ?? null;
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(project?.name ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (project === null) {
    return (
      <>
        <h1 className="page-title">Project not found</h1>
        <EmptyState title="This project doesn't exist or was deleted.">
          <button type="button" className="btn btn-primary" onClick={() => navigate("/projects")}>
            Back to Projects
          </button>
        </EmptyState>
      </>
    );
  }

  const tasks = [...data.tasks]
    .filter((task) => task.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draftName.trim();
    if (trimmed === "") {
      return;
    }
    renameProject(project.id, trimmed);
    setRenaming(false);
    showToast("Project renamed");
  };

  const affectedCount = tasks.length;

  return (
    <>
      <div className="page-heading">
        <div>
          <button type="button" className="link-button" onClick={() => navigate("/projects")}>
            ← Projects
          </button>
          {renaming ? (
            <form className="project-rename" onSubmit={handleRename}>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                aria-label="Project name"
                autoFocus
              />
              <button type="submit" className="btn btn-small btn-primary">
                Save
              </button>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  setRenaming(false);
                  setDraftName(project.name);
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <h1 className="page-title">{project.name}</h1>
          )}
        </div>
        <div className="page-actions">
          {!renaming ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setDraftName(project.name);
                setRenaming(true);
              }}
            >
              Rename
            </button>
          ) : null}
          <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirmingDelete(true)}>
            Delete project
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate({ projectId: project.id })}
          >
            Add task
          </button>
        </div>
      </div>
      {tasks.length === 0 ? (
        <EmptyState title="No tasks in this project yet.">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate({ projectId: project.id })}
          >
            Add a task
          </button>
        </EmptyState>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
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
      {confirmingDelete ? (
        <ConfirmDialog
          title={`Delete “${project.name}”?`}
          message={
            affectedCount === 0 ? (
              <>The project will be removed. It has no tasks.</>
            ) : (
              <>
                Its {affectedCount === 1 ? "1 task stays" : `${affectedCount} tasks stay`} in your
                list but will no longer be assigned to a project.
              </>
            )
          }
          confirmLabel="Delete project"
          cancelLabel="Keep project"
          danger
          onConfirm={() => {
            removeProject(project.id);
            setConfirmingDelete(false);
            showToast(`Project “${project.name}” deleted`);
            navigate("/projects");
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : null}
    </>
  );
}
