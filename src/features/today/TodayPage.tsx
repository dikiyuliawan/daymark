import { useMemo } from "react";
import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskRow } from "../../components/TaskRow";
import { EmptyState } from "../../components/EmptyState";
import { formatLocalDate, localDateKey } from "../../domain/localDate";

export function TodayPage() {
  const { data, todayKey, openCreate, openEdit, updateTask } = useApp();

  const scheduled = useMemo(() => {
    return data.tasks.filter((task) => task.scheduledDate === todayKey);
  }, [data.tasks, todayKey]);

  const active = scheduled.filter((task) => task.status !== "done");
  const done = scheduled.filter((task) => task.status === "done");
  const isEmpty = scheduled.length === 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="page-title">Today</h1>
          <p className="page-desc">{formatLocalDate(localDateKey())}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openCreate({ addToToday: true })}>
          Add task
        </button>
      </div>
      {isEmpty ? (
        <EmptyState title="Nothing is planned for today yet.">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate({ addToToday: true })}
          >
            Add a task
          </button>
        </EmptyState>
      ) : (
        <>
          {active.length > 0 ? (
            <ul className="task-list">
              {active.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projects={data.projects}
                  onOpen={openEdit}
                  onStatusChange={(id, status) => updateTask(id, { status })}
                  onToggleToday={(id) => updateTask(id, { scheduledDate: null })}
                />
              ))}
            </ul>
          ) : null}
          {done.length > 0 ? (
            <>
              <h2 className="section-heading-quiet">Done today</h2>
              <ul className="task-list task-list-quiet">
                {done.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projects={data.projects}
                    onOpen={openEdit}
                    onStatusChange={(id, status) => updateTask(id, { status })}
                    onToggleToday={(id) => updateTask(id, { scheduledDate: null })}
                  />
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
      {scheduled.length > 0 ? (
        <p className="page-footnote">
          Need something for later? <button type="button" className="link-button" onClick={() => navigate("/tasks")}>Open the full task list</button>.
        </p>
      ) : null}
    </>
  );
}
