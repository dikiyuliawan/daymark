import { ReactNode } from "react";

export function EmptyState({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {kicker ? <p className="empty-kicker">{kicker}</p> : null}
      <p className="empty-title">{title}</p>
      {children ? <div className="empty-actions">{children}</div> : null}
    </div>
  );
}
