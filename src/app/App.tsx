import { useEffect } from "react";
import { AppProvider, useApp } from "./store";
import { ToastProvider } from "../components/ToastProvider";
import { useRoute, navigate } from "./router";
import { TaskEditorDialog } from "../components/TaskEditorDialog";
import { EmptyState } from "../components/EmptyState";
import { TopBar } from "../components/TopBar";
import { TabBar } from "../components/TabBar";
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
import { FocusPage } from "../features/focus/FocusPage";
import { SearchPage } from "../features/search/SearchPage";

function useNewTaskShortcut() {
  const { editor, openCreate } = useApp();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "n") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.isContentEditable || /^(input|textarea|select)$/i.test(active.tagName))) {
        return;
      }
      event.preventDefault();
      openCreate();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor, openCreate]);
}

function NotFoundPage() {
  return (
    <>
      <h1 className="page-title">Page not found</h1>
      <EmptyState kicker="404" title="That address doesn’t match anything in Daymark.">
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
    case "focus":
      return <FocusPage />;
    case "search":
      return <SearchPage />;
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
      <TopBar />
      <main id="main-content" className="content">
        <RecoveryBanner />
        <SaveErrorBanner />
        <StorageUnavailableBanner />
        <Main />
      </main>
      <TabBar />
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
