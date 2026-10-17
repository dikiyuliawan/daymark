import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { PageHeading } from "../../components/PageHeading";
import { Split } from "../../components/Split";
import { sortByOrder } from "../../domain/reorder";
import { Project, Task } from "../../domain/types";

export function SearchPage() {
  const { data } = useApp();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") {
      return [];
    }
    const projectName = (task: Task) =>
      (task.projectId !== null && data.projects.find((p) => p.id === task.projectId)?.name) || "";
    const matches = data.tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(q) ||
        task.details.toLowerCase().includes(q) ||
        projectName(task).toLowerCase().includes(q)
      );
    });
    const byProject = new Map<string, Task[]>();
    for (const task of matches) {
      const key = task.projectId ?? "__none__";
      const list = byProject.get(key);
      if (list) list.push(task);
      else byProject.set(key, [task]);
    }
    const label = (key: string): string => {
      if (key === "__none__") return "No project";
      const project: Project | undefined = data.projects.find((p) => p.id === key);
      return project ? `${project.emoji ? `${project.emoji} ` : ""}${project.name}` : "No project";
    };
    return [...byProject.entries()]
      .map(([key, tasks]) => ({ key, label: label(key), tasks: sortByOrder(tasks) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data.tasks, data.projects, query]);

  const active = query.trim() !== "";
  const matchCount = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <>
      <PageHeading kicker="Search" title="Find anything" description="Titles, details, and projects." />
      <Split
        sideAfter
        side={
          <div className="side-card panel">
            <span className="field-label">Results</span>
            <p className="muted small">
              {active
                ? `${matchCount} match${matchCount === 1 ? "" : "es"} grouped by project.`
                : "Search matches titles, details, and project names."}
            </p>
          </div>
        }
      >
        <div className="search-bar panel">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            autoFocus
          />
        </div>
        {!active ? (
          <EmptyState kicker="Type to search" title="Start typing to find a task." />
        ) : groups.length === 0 ? (
          <EmptyState kicker="No matches" title={`Nothing matches “${query.trim()}”.`} />
        ) : (
          <div className="groups">
            {groups.map((group) => (
              <TaskGroup
                key={group.key}
                title={group.label}
                tasks={group.tasks}
                projects={data.projects}
                reorderable={false}
              />
            ))}
          </div>
        )}
      </Split>
    </>
  );
}
