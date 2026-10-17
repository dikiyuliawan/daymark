import { DayCount } from "../domain/stats";
import { formatLocalDateShort } from "../domain/localDate";

export function ProgressBars({ days, todayKey }: { days: DayCount[]; todayKey: string }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return (
    <div className="bars-wrap">
      <div
        className="bars"
        role="img"
        aria-label={`Completed over the last 7 days: ${total} total`}
      >
        {days.map((day) => (
          <i
            key={day.key}
            className={`bar${day.key === todayKey ? " is-today" : ""}`}
            style={{ ["--h" as string]: String(day.count / max) }}
            title={`${formatLocalDateShort(day.key)}: ${day.count}`}
          />
        ))}
      </div>
      <div className="bars-axis" aria-hidden="true">
        {days.map((day) => (
          <span key={day.key}>{formatLocalDateShort(day.key).split(" ")[0]}</span>
        ))}
      </div>
    </div>
  );
}
