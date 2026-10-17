import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { PageHeading } from "../../components/PageHeading";
import { Split } from "../../components/Split";
import { groupTasks } from "../tasks/grouping";

export function UnassignedPage() {
  const { data, todayKey, openCreate } = useApp();
  const tasks = data.tasks.filter((task) => task.projectId === null);
  const groups = groupTasks(tasks, todayKey);

  return (
    <>
      <PageHeading
        back={{ label: "Projects", onClick: () => navigate("/projects") }}
        kicker={tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
        title="No project"
        description="Tasks that aren’t assigned to any project."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openCreate()}>
            Add task
          </button>
        }
      />
      <Split
        side={
          <div className="side-card panel">
            <span className="field-label">Unassigned</span>
            <p className="muted small">
              {tasks.length === 0
                ? "Every task belongs to a project right now."
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"} without a project.`}
            </p>
          </div>
        }
      >
        {tasks.length === 0 ? (
          <EmptyState kicker="All clear" title="Every task has a project right now." />
        ) : (
          <div className="groups">
            {groups.map((group) => (
              <TaskGroup
                key={group.key}
                title={group.label}
                tasks={group.tasks}
                projects={data.projects}
                showProject={false}
              />
            ))}
          </div>
        )}
      </Split>
    </>
  );
}
