import { ReactNode } from "react";

type FlowShellProps = {
  title: string;
  lede?: string;
  step: number;
  steps: number;
  onExit: () => void;
  children: ReactNode;
  action?: ReactNode;
};

/**
 * The frame a ritual runs in: one step at a time, the step count in the corner
 * and the action at the foot, so the flow never looks like a form.
 */
export function FlowShell({
  title,
  lede,
  step,
  steps,
  onExit,
  children,
  action,
}: FlowShellProps) {
  return (
    <div className="flow">
      <header className="flow-head">
        <button type="button" className="flow-close" onClick={onExit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden focusable={false}>
            <path d="M14.5 6 9 12l5.5 6" />
          </svg>
          <span>Back</span>
        </button>
        <span className="flow-step">
          {step} of {steps}
        </span>
      </header>

      <div className="flow-steps" aria-hidden="true">
        {Array.from({ length: steps }, (_, index) => (
          <span key={index} className={`flow-step-mark${index < step ? " is-done" : ""}`} />
        ))}
      </div>

      <div className="flow-body">
        <h1 className="flow-title">{title}</h1>
        {lede ? <p className="flow-lede">{lede}</p> : null}
        {children}
      </div>

      {action ? <div className="flow-action">{action}</div> : null}
    </div>
  );
}
