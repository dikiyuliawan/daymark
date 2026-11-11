import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { groupTasks } from "../tasks/grouping";

export function UnassignedPage() {
  const { data, todayKey } = useApp();
  const tasks = data.tasks.filter((task) => task.projectId === null);
  const groups = groupTasks(tasks, todayKey);

  return (
    <>
      <ScreenHeader
        back={{ label: "Projects", onClick: () => navigate("/projects") }}
        title="No project"
        sub={tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
      />

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
    </>
  );
}
