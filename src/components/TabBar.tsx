import { useApp } from "../app/store";
import { Link, useRoute, Route } from "../app/router";
import { FolderIcon, HomeIcon, ListIcon, Plus, TimerIcon } from "./icons";

const TABS: { label: string; path: string; route: Route["name"]; icon: React.ReactNode }[] = [
  { label: "Today", path: "/today", route: "today", icon: <HomeIcon /> },
  { label: "Tasks", path: "/tasks", route: "tasks", icon: <ListIcon /> },
  { label: "Projects", path: "/projects", route: "projects", icon: <FolderIcon /> },
  { label: "Focus", path: "/focus", route: "focus", icon: <TimerIcon /> },
];

export function TabBar() {
  const route = useRoute();
  const { openCreate } = useApp();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => {
        const current =
          route.name === tab.route ||
          (tab.route === "projects" && (route.name === "project" || route.name === "unassigned"));
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`tab${current ? " is-on" : ""}`}
            aria-current={current ? "page" : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="tab tab-add"
        onClick={() => openCreate()}
        aria-label="New task"
      >
        <span className="tab-icon" aria-hidden="true">
          <Plus />
        </span>
        <span className="tab-label">Add</span>
      </button>
    </nav>
  );
}
