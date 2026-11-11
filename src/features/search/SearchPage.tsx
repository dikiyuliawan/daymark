import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { TaskGroup } from "../../components/TaskGroup";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
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
      <ScreenHeader
        title="Search"
        back={{ label: "Today", onClick: () => navigate("/today") }}
        showActions={false}
      />

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
          autoFocus
        />
        {query !== "" ? (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden focusable={false}>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      <p className="search-summary">
        {active
          ? `${matchCount} match${matchCount === 1 ? "" : "es"}`
          : "Matches titles, details, and project names."}
      </p>

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
    </>
  );
}
