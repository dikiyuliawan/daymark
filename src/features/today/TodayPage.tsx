import { useMemo } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { ProgressBars } from "../../components/ProgressBars";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { currentStreak, doneToday, last7Days, plannedToday } from "../../domain/stats";
import { formatDateLine, formatWeekday } from "../../domain/localDate";
import { sortByOrder } from "../../domain/reorder";

export function TodayPage() {
  const { data, todayKey, openCreate } = useApp();

  const scheduled = useMemo(
    () => sortByOrder(data.tasks.filter((task) => task.scheduledDate === todayKey)),
    [data.tasks, todayKey],
  );
  const active = scheduled.filter((task) => task.status !== "done");
  const done = scheduled.filter((task) => task.status === "done");
  const doneCount = doneToday(data.tasks, todayKey);
  const planned = plannedToday(data.tasks, todayKey);
  const streak = currentStreak(data.tasks, todayKey);
  const days = last7Days(data.tasks, todayKey);
  const percent = planned > 0 ? Math.round((doneCount / planned) * 100) : 0;

  return (
    <>
      <ScreenHeader
        day
        title={formatWeekday(todayKey)}
        sub={formatDateLine(todayKey)}
        badge={
          <span className="day-badge">
            {doneCount}/{planned}
          </span>
        }
      />

      <div
        className="progress"
        role="img"
        aria-label={`${doneCount} of ${planned} planned tasks done`}
      >
        <span className="progress-fill" style={{ ["--p" as string]: `${percent}%` }} />
      </div>

      {scheduled.length === 0 ? (
        <EmptyState kicker="Clear" title="Nothing planned for today yet.">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openCreate({ addToToday: true })}
          >
            Add a task
          </button>
        </EmptyState>
      ) : (
        <div className="groups">
          {active.length > 0 ? (
            <TaskGroup title="Planned" tasks={active} projects={data.projects} />
          ) : null}
          {done.length > 0 ? (
            <TaskGroup title="Completed today" tasks={done} projects={data.projects} />
          ) : null}
        </div>
      )}

      <div className="bars-wrap">
        <p className="list-group-label">
          Last 7 days
          <span className="list-group-count">
            {streak > 0 ? `${streak}-day streak` : "No streak yet"}
          </span>
        </p>
        <ProgressBars days={days} todayKey={todayKey} />
      </div>
    </>
  );
}
