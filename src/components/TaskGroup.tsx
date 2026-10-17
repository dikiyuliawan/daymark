import { ReactNode } from "react";
import { useApp } from "../app/store";
import { Project, Task, TaskStatus } from "../domain/types";
import { dropOrder, moveWithin } from "../domain/reorder";
import { GroupPanel } from "./GroupPanel";
import { TaskRow } from "./TaskRow";

type TaskGroupProps = {
  title: ReactNode;
  tasks: Task[];
  projects: Project[];
  showProject?: boolean;
  showTodayToggle?: boolean;
  reorderable?: boolean;
};

export function TaskGroup({
  title,
  tasks,
  projects,
  showProject = true,
  showTodayToggle = true,
  reorderable = true,
}: TaskGroupProps) {
  const { openEdit, updateTask, setTaskOrder, todayKey } = useApp();
  const ids = tasks.map((task) => task.id);

  const onStatusChange = (id: string, status: TaskStatus) => updateTask(id, { status });
  const onToggleToday = (id: string, on: boolean) =>
    updateTask(id, { scheduledDate: on ? todayKey : null });

  const onMove = (id: string, delta: -1 | 1) => {
    const from = ids.indexOf(id);
    const next = moveWithin(ids, from, from + delta);
    if (next !== ids) {
      setTaskOrder(next);
    }
  };

  const onDrop = (draggedId: string, targetId: string, placeAfter: boolean) => {
    setTaskOrder(dropOrder(ids, draggedId, targetId, placeAfter));
  };

  return (
    <GroupPanel
      title={title}
      trailing={<span className="group-count">{tasks.length}</span>}
    >
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          projects={projects}
          showProject={showProject}
          showTodayToggle={showTodayToggle}
          onOpen={openEdit}
          onStatusChange={onStatusChange}
          onToggleToday={onToggleToday}
          onMove={reorderable ? onMove : undefined}
          onDrop={reorderable ? onDrop : undefined}
        />
      ))}
    </GroupPanel>
  );
}
