import { useMemo } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { StatHero } from "../../components/StatHero";
import { ProgressBars } from "../../components/ProgressBars";
import { EmptyState } from "../../components/EmptyState";
import { PageHeading } from "../../components/PageHeading";
import { Split } from "../../components/Split";
import { currentStreak, doneToday, last7Days, plannedToday } from "../../domain/stats";
import { formatLocalDate } from "../../domain/localDate";
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

  return (
    <>
      <PageHeading
        kicker={formatLocalDate(todayKey)}
        title="Today"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate({ addToToday: true })}
          >
            Add task
          </button>
        }
      />
      <Split
        side={
          <StatHero
            label="Completed today"
            value={doneCount}
            total={planned > 0 ? planned : undefined}
            pill={streak > 0 ? `🔥 ${streak}-day streak` : "Complete one to start a streak"}
          >
            <ProgressBars days={days} todayKey={todayKey} />
          </StatHero>
        }
      >
        {scheduled.length === 0 ? (
          <EmptyState kicker="Clear" title="Nothing planned for today yet.">
            <button
              type="button"
              className="btn btn-primary"
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
              <TaskGroup title="Done today" tasks={done} projects={data.projects} />
            ) : null}
          </div>
        )}
      </Split>
    </>
  );
}
