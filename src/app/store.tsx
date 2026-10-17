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
  NewTaskInput,
  Project,
  Task,
  TaskPatch,
  createEmptyAppData,
} from "../domain/types";
import { localDateKey } from "../domain/localDate";
import { DaymarkRepository } from "../data/repository";
import { getBrowserStorage } from "../data/storage";
import { generateId, nowIso } from "../data/utils";

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
  openCreate: (defaults?: EditorDefaults) => void;
  openEdit: (taskId: string) => void;
  closeEditor: () => void;
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: TaskPatch) => void;
  removeTask: (id: string) => Task | null;
  restoreTask: (task: Task) => void;
  addProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  removeProject: (id: string) => void;
  dismissRecovery: () => void;
  startFresh: () => void;
  dismissSaveError: () => void;
};

const AppContext = createContext<AppApi | null>(null);

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

  useEffect(() => {
    const outcome = repositoryRef.current!.load();
    if (outcome.kind === "ready") {
      setData(outcome.data);
      setLoad({ kind: "ready" });
    } else if (outcome.kind === "corrupt") {
      // Malformed or unsupported data is kept untouched in storage; the app
      // starts from an empty working set and asks the user how to proceed.
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

  const persist = useCallback((next: AppData) => {
    setData(next);
    const outcome = repositoryRef.current!.save(next);
    setSaveError(outcome.kind === "saved" ? null : SAVE_ERROR_MESSAGE);
  }, []);

  const openCreate = useCallback((defaults?: EditorDefaults) => {
    setEditor(defaults ? { mode: "create", defaults } : { mode: "create" });
  }, []);

  const openEdit = useCallback((taskId: string) => {
    setEditor({ mode: "edit", taskId });
  }, []);

  const closeEditor = useCallback(() => {
    setEditor(null);
  }, []);

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const timestamp = nowIso();
      const task: Task = {
        id: generateId(),
        title: input.title.trim(),
        details: input.details,
        status: "todo",
        projectId: input.projectId,
        scheduledDate: input.scheduledDate,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      persist({ ...data, tasks: [task, ...data.tasks] });
      return task;
    },
    [data, persist],
  );

  const updateTask = useCallback(
    (id: string, patch: TaskPatch) => {
      const timestamp = nowIso();
      persist({
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === id ? { ...task, ...patch, updatedAt: timestamp } : task,
        ),
      });
    },
    [data, persist],
  );

  // Latest app data, readable from callbacks that outlive a render (e.g. a
  // toast Undo action created in an earlier render cycle).
  const dataRef = useRef(data);
  dataRef.current = data;

  const removeTask = useCallback(
    (id: string) => {
      const current = dataRef.current;
      const removed = current.tasks.find((task) => task.id === id) ?? null;
      persist({ ...current, tasks: current.tasks.filter((task) => task.id !== id) });
      return removed;
    },
    [persist],
  );

  // Undo for deletions: reinsert the untouched task object at the top of the
  // list (closest observable equivalent to "never deleted"). Reads latest
  // data through the ref so it stays correct across intervening writes.
  const restoreTask = useCallback(
    (task: Task) => {
      const current = dataRef.current;
      persist({
        ...current,
        tasks: [task, ...current.tasks.filter((t) => t.id !== task.id)],
      });
    },
    [persist],
  );

  const addProject = useCallback(
    (name: string) => {
      const timestamp = nowIso();
      const project: Project = {
        id: generateId(),
        name: name.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      persist({ ...data, projects: [...data.projects, project] });
    },
    [data, persist],
  );

  const renameProject = useCallback(
    (id: string, name: string) => {
      const timestamp = nowIso();
      persist({
        ...data,
        projects: data.projects.map((project) =>
          project.id === id
            ? { ...project, name: name.trim(), updatedAt: timestamp }
            : project,
        ),
      });
    },
    [data, persist],
  );

  // A deleted project never takes its tasks with it: affected tasks simply
  // become unassigned.
  const removeProject = useCallback(
    (id: string) => {
      const timestamp = nowIso();
      persist({
        ...data,
        projects: data.projects.filter((project) => project.id !== id),
        tasks: data.tasks.map((task) =>
          task.projectId === id
            ? { ...task, projectId: null, updatedAt: timestamp }
            : task,
        ),
      });
    },
    [data, persist],
  );

  const dismissRecovery = useCallback(() => {
    setLoad({ kind: "ready" });
  }, []);

  const startFresh = useCallback(() => {
    const outcome = repositoryRef.current!.save(createEmptyAppData());
    setData(createEmptyAppData());
    setLoad({ kind: "ready" });
    setSaveError(outcome.kind === "saved" ? null : SAVE_ERROR_MESSAGE);
  }, []);

  const dismissSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  const value = useMemo<AppApi>(
    () => ({
      data,
      todayKey,
      load,
      saveError,
      editor,
      openCreate,
      openEdit,
      closeEditor,
      addTask,
      updateTask,
      removeTask,
      restoreTask,
      addProject,
      renameProject,
      removeProject,
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
      openCreate,
      openEdit,
      closeEditor,
      addTask,
      updateTask,
      removeTask,
      restoreTask,
      addProject,
      renameProject,
      removeProject,
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
