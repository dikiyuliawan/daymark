import { useMemo, useState } from "react";
import { useApp } from "../../app/store";
import { useToast } from "../../components/ToastProvider";
import { navigate } from "../../app/router";
import { FlowShell } from "../../components/FlowShell";
import { formatDurationLabel } from "../../domain/format";
import { plannedMinutesOn } from "../../domain/stats";
import { highlightOn } from "../../data/repository";

const STEPS = 3;

type ShutdownItemProps = {
  title: string;
  meta?: string;
  checked: boolean;
  onToggle: () => void;
};

function ShutdownItem({ title, meta, checked, onToggle }: ShutdownItemProps) {
  return (
    <div className="plan-item">
      <input
        type="checkbox"
        className="m-check"
        checked={checked}
        onChange={onToggle}
        aria-label={title}
      />
      <span className="plan-item-body">
        <span className="plan-item-title">{title}</span>
        {meta ? <span className="plan-item-meta">{meta}</span> : null}
      </span>
    </div>
  );
}

/**
 * The shutdown ritual: what got done, what is left, and one line about the
 * day. The day closes and the leftovers roll into tomorrow.
 */
export function ShutdownFlow() {
  const { data, tasks, todayKey, closeDay, undoCloseDay } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);

  const todays = useMemo(
    () => tasks.filter((task) => task.scheduledDate === todayKey),
    [tasks, todayKey],
  );
  const done = todays.filter((task) => task.status === "done");
  const left = todays.filter((task) => task.status !== "done");

  const [carry, setCarry] = useState<string[]>(() => left.map((task) => task.id));
  const [note, setNote] = useState(() => highlightOn(data, todayKey));

  const planned = plannedMinutesOn(tasks, todayKey);
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  if (step === 0) {
    return (
      <FlowShell
        title="What you finished"
        lede="The work that is behind you."
        step={1}
        steps={STEPS}
        onExit={() => navigate("/today")}
        action={
          <button type="button" className="btn btn--primary" onClick={() => setStep(1)}>
            Continue
          </button>
        }
      >
        <p className="flow-figure">
          {done.length} of {todays.length} tasks · {formatDurationLabel(planned)} planned
        </p>
        {done.length === 0 ? (
          <p className="flow-empty">Nothing was finished today.</p>
        ) : (
          <div className="plan-list">
            {done.map((task) => (
              <ShutdownItem
                key={task.id}
                title={task.title}
                meta={task.durationMin !== null ? formatDurationLabel(task.durationMin) : undefined}
                checked={true}
                onToggle={() => undefined}
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
        title="What is left"
        lede="Anything ticked rolls into tomorrow."
        step={2}
        steps={STEPS}
        onExit={() => setStep(0)}
        action={
          <button type="button" className="btn btn--primary" onClick={() => setStep(2)}>
            Continue
          </button>
        }
      >
        {left.length === 0 ? (
          <p className="flow-empty">Nothing is left over.</p>
        ) : (
          <div className="plan-list">
            {left.map((task) => (
              <ShutdownItem
                key={task.id}
                title={task.title}
                meta={task.durationMin !== null ? formatDurationLabel(task.durationMin) : undefined}
                checked={carry.includes(task.id)}
                onToggle={() => setCarry((list) => toggle(list, task.id))}
              />
            ))}
          </div>
        )}
      </FlowShell>
    );
  }

  return (
    <FlowShell
      title="One line about today"
      lede="What the day was, in a sentence."
      step={3}
      steps={STEPS}
      onExit={() => setStep(1)}
      action={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            closeDay(carry, note);
            showToast("Day closed", { label: "Undo", onAction: undoCloseDay });
            navigate("/today");
          }}
        >
          Close the day
        </button>
      }
    >
      <div className="field">
        <label htmlFor="shutdown-note">The day in one line</label>
        <textarea
          id="shutdown-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Shipped the importer, cleared the inbox."
        />
      </div>
      {left.length > 0 ? (
        <p className="flow-note">
          {carry.length === 0
            ? "Nothing carries over."
            : `${carry.length} task${carry.length === 1 ? "" : "s"} roll into tomorrow.`}
        </p>
      ) : null}
    </FlowShell>
  );
}
