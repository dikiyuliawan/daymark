import { useApp } from "../../app/store";
import { FocusTimer } from "../../components/FocusTimer";
import { GroupPanel } from "../../components/GroupPanel";
import { PageHeading } from "../../components/PageHeading";
import { Split } from "../../components/Split";
import { formatDuration, focusSecondsOnDate, formatMinutes } from "../../domain/stats";
import { formatLocalDate, localDateKey } from "../../domain/localDate";

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
      <PageHeading
        kicker={formatLocalDate(todayKey)}
        title="Focus"
        description="Run a focused session and keep the log."
      />
      <Split
        sideAfter
        side={
          <GroupPanel
            title="Today’s sessions"
            trailing={<span className="group-count">{formatMinutes(totalSeconds)}</span>}
          >
            {sessionsToday.length === 0 ? (
              <li className="row row-empty">
                <span className="muted small">No sessions yet today.</span>
              </li>
            ) : (
              sessionsToday.map((session) => (
                <li key={session.id} className="row">
                  <span className="tile" aria-hidden="true">
                    🎯
                  </span>
                  <div className="row-body">
                    <span className="row-title">{titleFor(session.taskId)}</span>
                    <div className="row-meta">
                      <span className="tag">{formatDuration(session.durationSec)}</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </GroupPanel>
        }
      >
        <FocusTimer tasks={data.tasks} onComplete={addFocusSession} />
      </Split>
    </>
  );
}
