import { useEffect, useRef, useState } from "react";
import { Task } from "../domain/types";
import { formatDuration } from "../domain/stats";
import { Dropdown } from "./Dropdown";
import { PauseIcon, PlayIcon, ResetIcon } from "./icons";

export type FocusResult = {
  taskId: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
};

type FocusTimerProps = {
  tasks: Task[];
  onComplete: (session: FocusResult) => void;
};

const PRESETS = [15, 25, 50];

export function FocusTimer({ tasks, onComplete }: FocusTimerProps) {
  const [preset, setPreset] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const startedAtRef = useRef<string | null>(null);

  const totalSec = preset * 60;
  const elapsed = totalSec - remaining;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && remaining === 0) {
      finish(elapsed);
    }
    // Completion is detected when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining]);

  const start = () => {
    if (startedAtRef.current === null) {
      startedAtRef.current = new Date().toISOString();
    }
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    startedAtRef.current = null;
    setRemaining(totalSec);
  };

  const finish = (seconds: number) => {
    if (startedAtRef.current !== null && seconds > 0) {
      onComplete({
        taskId: taskId === "" ? null : taskId,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        durationSec: seconds,
      });
    }
    startedAtRef.current = null;
    setRunning(false);
    setRemaining(totalSec);
  };

  const choosePreset = (minutes: number) => {
    if (running) return;
    setPreset(minutes);
    setRemaining(minutes * 60);
  };

  return (
    <section className="focus panel">
      <div className="focus-clock" aria-live="polite" aria-atomic="true">
        <span className="focus-time">{formatDuration(remaining)}</span>
        <span className="focus-sub">
          {running ? "Focusing…" : elapsed > 0 ? "Paused" : "Ready to focus"}
        </span>
      </div>
      <div className="chip-row">
        {PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={`chip${preset === minutes ? " is-on" : ""}`}
            aria-pressed={preset === minutes}
            onClick={() => choosePreset(minutes)}
          >
            {minutes} min
          </button>
        ))}
      </div>
      <div className="focus-task">
        <Dropdown
          variant="filter"
          label="Focus task"
          value={taskId}
          onChange={setTaskId}
          options={[
            { value: "", label: "No task" },
            ...tasks
              .filter((task) => task.status !== "done")
              .map((task) => ({ value: task.id, label: task.title })),
          ]}
        />
      </div>
      <div className="focus-actions">
        {running ? (
          <button type="button" className="btn btn-primary" onClick={pause}>
            <PauseIcon size={18} />
            Pause
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start}>
            <PlayIcon size={18} />
            Start
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => finish(elapsed)}
          disabled={elapsed === 0}
        >
          Finish
        </button>
        <button type="button" className="icon-btn" aria-label="Reset" onClick={reset}>
          <ResetIcon />
        </button>
      </div>
    </section>
  );
}
