import { useEffect } from "react";
import { AppProvider, useApp } from "./store";
import { ToastProvider } from "../components/ToastProvider";
import { Link, useRoute, Route } from "./router";
import { TaskEditorDialog } from "../components/TaskEditorDialog";
import { EmptyState } from "../components/EmptyState";
import {
  RecoveryBanner,
  SaveErrorBanner,
  StorageUnavailableBanner,
} from "../components/Banners";
import { TodayPage } from "../features/today/TodayPage";
import { TasksPage } from "../features/tasks/TasksPage";
import { ProjectsPage } from "../features/projects/ProjectsPage";
import { ProjectDetailPage } from "../features/projects/ProjectDetailPage";
import { UnassignedPage } from "../features/projects/UnassignedPage";
import { navigate } from "./router";

const NAV_ITEMS: { label: string; path: string; route: Route["name"] }[] = [
  { label: "Today", path: "/today", route: "today" },
  { label: "Tasks", path: "/tasks", route: "tasks" },
  { label: "Projects", path: "/projects", route: "projects" },
];

function NewTaskButton({ className = "btn btn-primary" }: { className?: string }) {
  const { openCreate } = useApp();
  return (
    <button type="button" className={className} onClick={() => openCreate()}>
      New task
    </button>
  );
}

function useNewTaskShortcut() {
  const { editor, openCreate } = useApp();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "n") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.isContentEditable ||
          /^(input|textarea|select)$/i.test(active.tagName))
      ) {
        return;
      }
      event.preventDefault();
      openCreate();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor, openCreate]);
}

function NavLinks({ className }: { className: string }) {
  const route = useRoute();
  return (
    <nav className={className} aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const current =
          route.name === item.route ||
          (item.route === "projects" && (route.name === "project" || route.name === "unassigned"));
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={current ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotFoundPage() {
  return (
    <>
      <h1 className="page-title">Page not found</h1>
      <EmptyState title="That address doesn't match anything in Daymark.">
        <button type="button" className="btn btn-primary" onClick={() => navigate("/today")}>
          Go to Today
        </button>
      </EmptyState>
    </>
  );
}

function Main() {
  const route = useRoute();
  switch (route.name) {
    case "today":
      return <TodayPage />;
    case "tasks":
      return <TasksPage />;
    case "projects":
      return <ProjectsPage />;
    case "project":
      return <ProjectDetailPage projectId={route.id} />;
    case "unassigned":
      return <UnassignedPage />;
    case "notFound":
      return <NotFoundPage />;
  }
}

function Shell() {
  const { editor, data, todayKey, load } = useApp();
  useNewTaskShortcut();

  if (load.kind === "loading") {
    return (
      <div className="app" role="status" aria-live="polite">
        <p className="loading-note">Loading your local workbench…</p>
      </div>
    );
  }

  const editorKey =
    editor === null
      ? "none"
      : editor.mode === "create"
        ? `create-${editor.defaults?.projectId ?? ""}-${editor.defaults?.addToToday ? "t" : ""}`
        : editor.taskId;

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <p className="wordmark">Daymark</p>
        <NavLinks className="sidebar-nav nav" />
        <NewTaskButton />
        <p className="sidebar-note">Local-first: your data stays in this browser.</p>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <p className="wordmark">Daymark</p>
          <NewTaskButton className="btn btn-primary btn-small" />
        </header>
        <main id="main-content" className="main">
          <RecoveryBanner />
          <SaveErrorBanner />
          <StorageUnavailableBanner />
          <Main />
        </main>
      </div>
      <NavLinks className="bottom-nav" />
      {editor !== null ? (
        <TaskEditorDialog key={editorKey} editor={editor} data={data} todayKey={todayKey} />
      ) : null}
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AppProvider>
  );
}
