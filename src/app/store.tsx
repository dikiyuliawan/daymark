import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  AppData,
  FocusSession,
  NewTaskInput,
  Project,
  Settings,
  Task,
  TaskPatch,
  ThemeMode,
  createEmptyAppData,
} from "../domain/types";
import { localDateKey } from "../domain/localDate";
import {
  addFocusSessionToData,
  addProjectToData,
  addSubtaskToData,
  addTaskToData,
  DaymarkRepository,
  insertTask,
  removeProjectFromData,
  removeSubtaskFromData,
  removeTaskFromData,
  setTaskOrderInData,
  setThemeInData,
  toggleSubtaskInData,
  updateProjectInData,
  updateTaskInData,
} from "../data/repository";
import { getBrowserStorage } from "../data/storage";

export type LoadState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "unavailable" }
  | { kind: "corrupt"; reason: string };

export type EditorDefaults = { projectId?: string | null; addToToday?: boolean };

export type EditorState =
  | { mode: "create"; defaults?: EditorDefaults }
  | { mode: "edit"; taskId: string }
  | null;

const SAVE_ERROR_MESSAGE =
  "Daymark could not save changes to browser storage, so your latest change is shown but will be lost on reload. Check that this site can store data in this browser.";

type AppApi = {
  data: AppData;
  todayKey: string;
  load: LoadState;
  saveError: string | null;
  editor: EditorState;
  resolvedTheme: "light" | "dark";
  openCreate: (defaults?: EditorDefaults) => void;
  openEdit: (taskId: string) => void;
  closeEditor: () => void;
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: TaskPatch) => void;
  removeTask: (id: string) => Task | null;
  restoreTask: (task: Task) => void;
  setTaskOrder: (idsInOrder: string[]) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  addProject: (name: string) => void;
  updateProject: (
    id: string,
    patch: Partial<Pick<Project, "name" | "emoji" | "color">>,
  ) => void;
  removeProject: (id: string) => void;
  addFocusSession: (session: Omit<FocusSession, "id">) => void;
  setTheme: (theme: ThemeMode) => void;
  dismissRecovery: () => void;
  startFresh: () => void;
  dismissSaveError: () => void;
};

const AppContext = createContext<AppApi | null>(null);

function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const repositoryRef = useRef<DaymarkRepository | null>(null);
  if (repositoryRef.current === null) {
    repositoryRef.current = new DaymarkRepository(getBrowserStorage());
  }

  const [todayKey, setTodayKey] = useState(() => localDateKey());
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [data, setData] = useState<AppData>(createEmptyAppData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const outcome = repositoryRef.current!.load();
    if (outcome.kind === "ready") {
      setData(outcome.data);
      setLoad({ kind: "ready" });
    } else if (outcome.kind === "corrupt") {
      setData(createEmptyAppData());
      setLoad({ kind: "corrupt", reason: outcome.reason });
    } else {
      setLoad({ kind: "unavailable" });
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayKey((current) => {
        const next = localDateKey();
        return next === current ? current : next;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" =
    data.settings.theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : data.settings.theme;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
    }
  }, [resolvedTheme]);

  const persist = useCallback((next: AppData) => {
    setData(next);
    const outcome = repositoryRef.current!.save(next);
    setSaveError(outcome.kind === "saved" ? null : SAVE_ERROR_MESSAGE);
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;

  const openCreate = useCallback((defaults?: EditorDefaults) => {
    setEditor(defaults ? { mode: "create", defaults } : { mode: "create" });
  }, []);
  const openEdit = useCallback((taskId: string) => setEditor({ mode: "edit", taskId }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const next = addTaskToData(dataRef.current, input);
      persist(next);
      return next.tasks[0];
    },
    [persist],
  );

  const updateTask = useCallback(
    (id: string, patch: TaskPatch) => {
      const next = updateTaskInData(dataRef.current, id, patch);
      if (next !== null) {
        persist(next);
      }
    },
    [persist],
  );

  const removeTask = useCallback(
    (id: string) => {
      const current = dataRef.current;
      const removed = current.tasks.find((task) => task.id === id) ?? null;
      const next = removeTaskFromData(current, id);
      if (next !== null) {
        persist(next);
      }
      return removed;
    },
    [persist],
  );

  const restoreTask = useCallback(
    (task: Task) => {
      persist(insertTask(dataRef.current, task));
    },
    [persist],
  );

  const setTaskOrder = useCallback(
    (idsInOrder: string[]) => {
      persist(setTaskOrderInData(dataRef.current, idsInOrder));
    },
    [persist],
  );

  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      persist(addSubtaskToData(dataRef.current, taskId, title));
    },
    [persist],
  );

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string, done: boolean) => {
      persist(toggleSubtaskInData(dataRef.current, taskId, subtaskId, done));
    },
    [persist],
  );

  const removeSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      persist(removeSubtaskFromData(dataRef.current, taskId, subtaskId));
    },
    [persist],
  );

  const addProject = useCallback(
    (name: string) => {
      persist(addProjectToData(dataRef.current, name));
    },
    [persist],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Pick<Project, "name" | "emoji" | "color">>) => {
      persist(updateProjectInData(dataRef.current, id, patch));
    },
    [persist],
  );

  const removeProject = useCallback(
    (id: string) => {
      const { data: next } = removeProjectFromData(dataRef.current, id);
      persist(next);
    },
    [persist],
  );

  const addFocusSession = useCallback(
    (session: Omit<FocusSession, "id">) => {
      persist(addFocusSessionToData(dataRef.current, session));
    },
    [persist],
  );

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      persist(setThemeInData(dataRef.current, theme));
    },
    [persist],
  );

  const dismissRecovery = useCallback(() => setLoad({ kind: "ready" }), []);

  const startFresh = useCallback(() => {
    const empty = createEmptyAppData();
    const outcome = repositoryRef.current!.save(empty);
    setData(empty);
    setLoad({ kind: "ready" });
    setSaveError(outcome.kind === "saved" ? null : SAVE_ERROR_MESSAGE);
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  const value = useMemo<AppApi>(
    () => ({
      data,
      todayKey,
      load,
      saveError,
      editor,
      resolvedTheme,
      openCreate,
      openEdit,
      closeEditor,
      addTask,
      updateTask,
      removeTask,
      restoreTask,
      setTaskOrder,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addProject,
      updateProject,
      removeProject,
      addFocusSession,
      setTheme,
      dismissRecovery,
      startFresh,
      dismissSaveError,
    }),
    [
      data,
      todayKey,
      load,
      saveError,
      editor,
      resolvedTheme,
      openCreate,
      openEdit,
      closeEditor,
      addTask,
      updateTask,
      removeTask,
      restoreTask,
      setTaskOrder,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addProject,
      updateProject,
      removeProject,
      addFocusSession,
      setTheme,
      dismissRecovery,
      startFresh,
      dismissSaveError,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within AppProvider");
  }
  return value;
}

export type { Settings };
