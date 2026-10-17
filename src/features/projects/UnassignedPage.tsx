import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskRow } from "../../components/TaskRow";
import { EmptyState } from "../../components/EmptyState";

export function UnassignedPage() {
  const { data, todayKey, openCreate, openEdit, updateTask } = useApp();
  const tasks = [...data.tasks]
    .filter((task) => task.projectId === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="page-heading">
        <div>
          <button type="button" className="link-button" onClick={() => navigate("/projects")}>
            ← Projects
          </button>
          <h1 className="page-title">No project</h1>
          <p className="page-desc">Tasks that aren't assigned to any project.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
          Add task
        </button>
      </div>
      {tasks.length === 0 ? (
        <EmptyState title="Every task has a project right now." />
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projects={data.projects}
              showProject={false}
              onOpen={openEdit}
              onStatusChange={(id, status) => updateTask(id, { status })}
              onToggleToday={(id, on) => updateTask(id, { scheduledDate: on ? todayKey : null })}
            />
          ))}
        </ul>
      )}
    </>
  );
}
