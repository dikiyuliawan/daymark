import { useApp } from "../../app/store";
import { FocusTimer } from "../../components/FocusTimer";
import { ScreenHeader } from "../../components/ScreenHeader";
import { formatDuration, focusSecondsOnDate, formatMinutes } from "../../domain/stats";
import { formatDateLine, localDateKey } from "../../domain/localDate";

export function FocusPage() {
  const { data, todayKey, addFocusSession } = useApp();
  const sessionsToday = data.focusSessions.filter(
    (session) => localDateKey(new Date(session.startedAt)) === todayKey,
  );
  const totalSeconds = focusSecondsOnDate(data.focusSessions, todayKey);
  const titleFor = (taskId: string | null) =>
    (taskId !== null && data.tasks.find((task) => task.id === taskId)?.title) || "No task";

  return (
    <>
      <ScreenHeader title="Focus" sub={formatDateLine(todayKey)} />

      <FocusTimer tasks={data.tasks} onComplete={addFocusSession} />

      <section className="list-group focus-sessions">
        <p className="list-group-label">
          Today’s sessions
          <span className="list-group-count">{formatMinutes(totalSeconds)}</span>
        </p>
        {sessionsToday.length === 0 ? (
          <p className="row-empty">No sessions yet today.</p>
        ) : (
          <ul className="list">
            {sessionsToday.map((session) => (
              <li key={session.id} className="row">
                <span className="row-body">
                  <span className="row-title">{titleFor(session.taskId)}</span>
                </span>
                <span className="row-pill">{formatDuration(session.durationSec)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
