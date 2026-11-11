import { useApp } from "../app/store";
import { Link, useRoute, Route } from "../app/router";
import { FolderIcon, ListIcon, SunGlyph, TimerIcon } from "./icons";

const TABS: { label: string; path: string; route: Route["name"]; icon: React.ReactNode }[] = [
  { label: "Today", path: "/today", route: "today", icon: <SunGlyph /> },
  { label: "Tasks", path: "/tasks", route: "tasks", icon: <ListIcon /> },
  { label: "Projects", path: "/projects", route: "projects", icon: <FolderIcon /> },
  { label: "Focus", path: "/focus", route: "focus", icon: <TimerIcon /> },
];

export function TabBar() {
  const route = useRoute();
  const { openCreate } = useApp();
  return (
    <>
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
              aria-controls="main-content"
            >
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <button type="button" className="fab" onClick={() => openCreate()} aria-label="New task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden focusable={false}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </>
  );
}
