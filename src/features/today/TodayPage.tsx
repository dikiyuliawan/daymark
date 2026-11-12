import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { TaskGroup } from "../../components/TaskGroup";
import { ProgressBars } from "../../components/ProgressBars";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BudgetSheet } from "../../components/BudgetSheet";
import { ActionRow } from "../../components/ActionRow";
import { navigate } from "../../app/router";
import { highlightOn, isDayClosed } from "../../data/repository";
import { CalendarGlyph, MoonGlyph } from "../../components/icons";
import { currentStreak, doneToday, last7Days, plannedMinutesOn, plannedToday } from "../../domain/stats";
import { formatDateLine, formatWeekday } from "../../domain/localDate";
import { formatDurationLabel } from "../../domain/format";
import { sortByOrder } from "../../domain/reorder";

let dayEntered = false;

/** The day enters once a session, not on every visit. */
function firstTimeToday(): boolean {
  if (dayEntered) return false;
  dayEntered = true;
  return true;
}

export function TodayPage() {
  const { data, todayKey, openCreate, setWorkdayMinutes } = useApp();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [entering] = useState(firstTimeToday);

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

  const plannedMinutes = plannedMinutesOn(data.tasks, todayKey);
  const closed = isDayClosed(data, todayKey);
  const note = highlightOn(data, todayKey);
  const budgetMinutes = data.settings.workdayMinutes;
  const over = plannedMinutes > budgetMinutes;

  return (
    <>
      <ScreenHeader
        day
        className={entering ? "is-entering" : undefined}
        title={formatWeekday(todayKey)}
        sub={formatDateLine(todayKey)}
        subAside={
          <button
            type="button"
            className="capacity"
            data-over={over ? "true" : undefined}
            aria-label={
              over
                ? `${formatDurationLabel(plannedMinutes)} planned of ${formatDurationLabel(
                    budgetMinutes,
                  )} a day: over by ${formatDurationLabel(plannedMinutes - budgetMinutes)}. Change the daily budget`
                : `${formatDurationLabel(plannedMinutes)} planned of ${formatDurationLabel(
                    budgetMinutes,
                  )} a day. Change the daily budget`
            }
            onClick={() => setBudgetOpen(true)}
          >
            {formatDurationLabel(plannedMinutes)} of {formatDurationLabel(budgetMinutes)}
          </button>
        }
        badge={
          <span className="day-badge">
            {doneCount}/{planned}
          </span>
        }
      />

      <div
        className={`progress${entering ? " is-entering" : ""}`}
        role="img"
        aria-label={`${doneCount} of ${planned} planned tasks done`}
      >
        <span className="progress-fill" style={{ ["--p" as string]: `${percent}%` }} />
      </div>

      {closed ? (
        <p className="day-note">
          <span className="day-note-label">Today</span>
          {note}
        </p>
      ) : null}

      <ActionRow
        label="Plan the day"
        hint="Yesterday, today, and the load"
        icon={<CalendarGlyph />}
        onClick={() => navigate("/plan")}
      />

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
        <p className="list-group-label list-group-label--inline">
          Last 7 days
          <span className="list-group-count">
            {streak > 0 ? `${streak}-day streak` : "No streak yet"}
          </span>
        </p>
        <ProgressBars days={days} todayKey={todayKey} />
      </div>

      <ActionRow
        label={closed ? "Review the day" : "End the day"}
        hint="What got done, and one line about it"
        icon={<MoonGlyph />}
        onClick={() => navigate("/shutdown")}
      />

      {budgetOpen ? (
        <BudgetSheet
          minutes={budgetMinutes}
          onSave={setWorkdayMinutes}
          onClose={() => setBudgetOpen(false)}
        />
      ) : null}
    </>
  );
}
