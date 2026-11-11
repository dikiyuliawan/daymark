import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { navigate } from "../../app/router";
import { FlowShell } from "../../components/FlowShell";
import { TaskGroup } from "../../components/TaskGroup";
import { addDays } from "../../domain/localDate";
import { formatDurationLabel } from "../../domain/format";
import { plannedMinutesOn } from "../../domain/stats";

const STEPS = 3;

type PlanItemProps = {
  title: string;
  meta?: string;
  checked: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
};

function PlanItem({ title, meta, checked, onToggle, action }: PlanItemProps) {
  return (
    <div className="plan-item">
      <input
        type="checkbox"
        className="m-check"
        id={`check-${title}`}
        checked={checked}
        onChange={onToggle}
        aria-label={title}
      />
      <label className="plan-item-body" htmlFor={`check-${title}`}>
        <span className="plan-item-title">{title}</span>
        {meta ? <span className="plan-item-meta">{meta}</span> : null}
      </label>
      {action}
    </div>
  );
}

/**
 * The planning ritual: yesterday, today, then the day itself. Three steps,
 * one question each, the same language as the rest of the app.
 */
export function PlanFlow() {
  const { data, tasks, todayKey, carryTasks } = useApp();
  const [step, setStep] = useState(0);

  const yesterday = addDays(todayKey, -1);
  const leftover = useMemo(
    () => tasks.filter((task) => task.scheduledDate === yesterday && task.status !== "done"),
    [tasks, yesterday],
  );
  const inbox = useMemo(
    () => tasks.filter((task) => task.scheduledDate === null && task.status !== "done"),
    [tasks],
  );
  const today = useMemo(
    () => tasks.filter((task) => task.scheduledDate === todayKey),
    [tasks, todayKey],
  );

  const [carried, setCarried] = useState<string[]>(() => leftover.map((task) => task.id));
  const [added, setAdded] = useState<string[]>([]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  const planned = plannedMinutesOn(tasks, todayKey);
  const budget = data.settings.workdayMinutes;
  const over = planned > budget;

  if (step === 0) {
    return (
      <FlowShell
        title="Yesterday"
        lede="What you left behind. Carry it into today, or leave it where it fell."
        step={1}
        steps={STEPS}
        onExit={() => navigate("/today")}
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              carryTasks(carried, todayKey);
              setStep(1);
            }}
          >
            Continue
          </button>
        }
      >
        {leftover.length === 0 ? (
          <p className="flow-empty">Nothing was left behind.</p>
        ) : (
          <div className="plan-list">
            {leftover.map((task) => (
              <PlanItem
                key={task.id}
                title={task.title}
                meta={task.durationMin !== null ? formatDurationLabel(task.durationMin) : undefined}
                checked={carried.includes(task.id)}
                onToggle={() => setCarried((list) => toggle(list, task.id))}
              />
            ))}
          </div>
        )}
      </FlowShell>
    );
  }

  if (step === 1) {
    return (
      <FlowShell
        title="Today"
        lede="Pull what you want to work on into the day."
        step={2}
        steps={STEPS}
        onExit={() => setStep(0)}
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              carryTasks(added, todayKey);
              setStep(2);
            }}
          >
            Continue
          </button>
        }
      >
        {inbox.length === 0 ? (
          <p className="flow-empty">Your inbox is empty.</p>
        ) : (
          <div className="plan-list">
            {inbox.map((task) => (
              <PlanItem
                key={task.id}
                title={task.title}
                meta={task.durationMin !== null ? formatDurationLabel(task.durationMin) : undefined}
                checked={added.includes(task.id)}
                onToggle={() => setAdded((list) => toggle(list, task.id))}
              />
            ))}
          </div>
        )}
      </FlowShell>
    );
  }

  const tomorrow = addDays(todayKey, 1);

  return (
    <FlowShell
      title="The day"
      lede="What you have planned, and whether it fits."
      step={3}
      steps={STEPS}
      onExit={() => setStep(1)}
      action={
        <button type="button" className="btn btn--primary" onClick={() => navigate("/today")}>
          Start the day
        </button>
      }
    >
      <div className="plan-load" data-over={over ? "true" : undefined}>
        <p className="plan-load-figure">
          {formatDurationLabel(planned)} of {formatDurationLabel(budget)}
        </p>
        <p className="plan-load-note">
          {over
            ? `Over the budget by ${formatDurationLabel(planned - budget)}. Push something to tomorrow.`
            : `${formatDurationLabel(budget - planned)} left in the day.`}
        </p>
      </div>

      <div className="plan-day">
        <TaskGroup title="Planned for today" tasks={today} projects={data.projects} />
      </div>

      {today.length > 0 ? (
        <div className="plan-defer">
          <p className="list-group-label">Push to tomorrow</p>
          <ul className="list">
            {today.map((task) => (
              <li key={task.id} className="row">
                <span className="row-body">
                  <span className="row-title">{task.title}</span>
                </span>
                <button
                  type="button"
                  className="chip chip-xs"
                  onClick={() => carryTasks([task.id], tomorrow)}
                >
                  Tomorrow
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </FlowShell>
  );
}
