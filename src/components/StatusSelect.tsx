import { TaskStatus, statusLabel } from "../domain/types";

export function StatusDot({ status }: { status: TaskStatus }) {
  return <span className={`status-dot status-${status}`} aria-hidden="true" />;
}

export function StatusSelect({
  value,
  onChange,
  label,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  label: string;
}) {
  return (
    <label className="status-select">
      <span className="visually-hidden">{`${label}: status`}</span>
      <StatusDot status={value} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
        className="select select-quiet"
      >
        <option value="todo">{statusLabel("todo")}</option>
        <option value="in_progress">{statusLabel("in_progress")}</option>
        <option value="done">{statusLabel("done")}</option>
      </select>
    </label>
  );
}
