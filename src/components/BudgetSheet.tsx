import { useState } from "react";
import { Sheet } from "./Sheet";
import { formatDurationLabel } from "../domain/format";

const PRESETS = [60, 120, 180, 240, 300, 360, 480];

type BudgetSheetProps = {
  minutes: number;
  onSave: (minutes: number) => void;
  onClose: () => void;
};

/**
 * The day's budget: how much planned work a day holds. A set of lengths to
 * tap, or a number of hours to type.
 */
export function BudgetSheet({ minutes, onSave, onClose }: BudgetSheetProps) {
  const [hours, setHours] = useState(String(Math.round((minutes / 60) * 10) / 10));
  const typed = Number.parseFloat(hours);

  const apply = (next: number) => {
    onSave(next);
    onClose();
  };

  return (
    <Sheet
      title="Daily budget"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (Number.isFinite(typed) && typed > 0) {
              apply(Math.round(typed * 60));
            }
          }}
        >
          Save budget
        </button>
      }
    >
      <div className="field">
        <span className="field-label">Planned work a day</span>
        <div className="chip-row" role="group" aria-label="Daily budget">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip${minutes === value || typed * 60 === value ? " is-on" : ""}`}
              aria-pressed={minutes === value || typed * 60 === value}
              onClick={() => apply(value)}
            >
              {formatDurationLabel(value)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="budget-hours">Hours a day</label>
        <input
          id="budget-hours"
          type="number"
          inputMode="decimal"
          min="0.5"
          max="24"
          step="0.5"
          value={hours}
          onChange={(event) => setHours(event.target.value)}
        />
      </div>
    </Sheet>
  );
}
