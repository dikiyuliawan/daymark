import { useState } from "react";
import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmojiColorPicker } from "../../components/EmojiColorPicker";
import { useToast } from "../../components/ToastProvider";
import { groupTasks } from "../tasks/grouping";

type Props = { projectId: string };

export function ProjectDetailPage({ projectId }: Props) {
  const { data, todayKey, openCreate, updateProject, removeProject } = useApp();
  const { showToast } = useToast();
  const project = data.projects.find((p) => p.id === projectId) ?? null;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(project?.name ?? "");
  const [draftEmoji, setDraftEmoji] = useState<string | null>(project?.emoji ?? null);
  const [draftColor, setDraftColor] = useState<string | null>(project?.color ?? null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (project === null) {
    return (
      <>
        <ScreenHeader title="Project not found" sub="Missing" />
        <EmptyState kicker="Gone" title="This project doesn’t exist or was deleted.">
          <button type="button" className="btn btn--primary" onClick={() => navigate("/projects")}>
            Back to Projects
          </button>
        </EmptyState>
      </>
    );
  }

  const tasks = data.tasks.filter((task) => task.projectId === project.id);
  const groups = groupTasks(tasks, todayKey);
  const counts = {
    todo: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length,
  };

  const saveProject = () => {
    const trimmed = draftName.trim();
    if (trimmed === "") return;
    updateProject(project.id, { name: trimmed, emoji: draftEmoji, color: draftColor });
    setEditing(false);
    showToast("Project saved");
  };

  return (
    <>
      <ScreenHeader
        back={{ label: "Projects", onClick: () => navigate("/projects") }}
        title={project.name}
        sub={tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
      />

      <div className="detail-actions">
        <span className="row-pill">Todo {counts.todo}</span>
        <span className="row-pill">In progress {counts.inProgress}</span>
        <span className="row-pill">Done {counts.done}</span>
      </div>

      <div className="btn-row detail-buttons">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setDraftName(project.name);
            setDraftEmoji(project.emoji);
            setDraftColor(project.color);
            setEditing((current) => !current);
          }}
        >
          {editing ? "Close editor" : "Edit project"}
        </button>
        <button
          type="button"
          className="btn btn--danger-ghost"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete project
        </button>
      </div>

      {editing ? (
        <section className="editor-inline">
          <div className="field">
            <label htmlFor="project-name">Name</label>
            <input
              id="project-name"
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>
          <div className="field">
            <span className="field-label">Appearance</span>
            <EmojiColorPicker
              emoji={draftEmoji}
              color={draftColor}
              onChange={(next) => {
                setDraftEmoji(next.emoji);
                setDraftColor(next.color);
              }}
            />
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={saveProject}>
              Save project
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState kicker="Empty" title="No tasks in this project yet.">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openCreate({ projectId: project.id })}
          >
            Add a task
          </button>
        </EmptyState>
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

      {confirmingDelete ? (
        <ConfirmDialog
          title={`Delete “${project.name}”?`}
          message={
            tasks.length === 0 ? (
              <>The project will be removed. It has no tasks.</>
            ) : (
              <>
                Its {tasks.length === 1 ? "1 task stays" : `${tasks.length} tasks stay`} in your list
                but will no longer be assigned to a project.
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
