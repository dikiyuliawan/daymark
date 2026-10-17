import { ReactNode } from "react";

/**
 * Two-column workspace: the side rail sits beside the main column on desktop.
 * On narrow screens the columns stack in DOM order, so `sideAfter` controls
 * whether the summary reads before or after the main content.
 */
export function Split({
  side,
  children,
  sideAfter = false,
}: {
  side: ReactNode;
  children: ReactNode;
  sideAfter?: boolean;
}) {
  const rail = <aside className="split-side">{side}</aside>;
  return (
    <div className="split">
      {sideAfter ? null : rail}
      <div className="split-main">{children}</div>
      {sideAfter ? rail : null}
    </div>
  );
}
