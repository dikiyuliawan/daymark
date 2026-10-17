import { ReactNode } from "react";

type GroupPanelProps = {
  title?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * The grouped list surface borrowed from Oyenza's app-mock kit: one rounded
 * panel holds many rows split by inset dividers, so long lists stay calm.
 */
export function GroupPanel({ title, trailing, children, className }: GroupPanelProps) {
  return (
    <section className={`panel group${className ? ` ${className}` : ""}`}>
      {title !== undefined || trailing !== undefined ? (
        <header className="group-head">
          <span className="group-title">{title}</span>
          {trailing !== undefined ? <span className="group-trail">{trailing}</span> : null}
        </header>
      ) : null}
      <ul className="group-body">{children}</ul>
    </section>
  );
}
