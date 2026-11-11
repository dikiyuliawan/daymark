import { ReactNode } from "react";
import { ChevronRight } from "./icons";

type ActionRowProps = {
  label: string;
  hint?: string;
  icon: ReactNode;
  onClick: () => void;
};

/**
 * A quiet line that opens something: the rituals, the plan, the day's note.
 * It sits in the day's list like a task, so it never breaks the rhythm.
 */
export function ActionRow({ label, hint, icon, onClick }: ActionRowProps) {
  return (
    <button type="button" className="action-row" onClick={onClick}>
      <span className="action-row-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="action-row-body">
        <span className="action-row-label">{label}</span>
        {hint ? <span className="action-row-hint">{hint}</span> : null}
      </span>
      <ChevronRight className="row-chevron" size={16} />
    </button>
  );
}
