import { ReactNode } from "react";
import { navigate } from "../app/router";
import { SearchIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

type ScreenHeaderProps = {
  title: ReactNode;
  sub?: ReactNode;
  /** Sits on the right of the line under the title. */
  subAside?: ReactNode;
  badge?: ReactNode;
  back?: { label: string; onClick: () => void };
  actions?: ReactNode;
  /** The Today screen sets its own day header, so it hides the shared actions. */
  showActions?: boolean;
  /** The day screen sets the larger title. */
  day?: boolean;
};

/**
 * One header for every screen: the title on the left, the day's badge and the
 * two screen actions on the right. Nothing else sits above the content.
 */
export function ScreenHeader({
  title,
  sub,
  subAside,
  badge,
  back,
  actions,
  showActions = true,
  day = false,
}: ScreenHeaderProps) {
  return (
    <header className="screen-head">
      <div className="screen-head-main">
        {back ? (
          <button type="button" className="screen-back" onClick={back.onClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
              <path d="M14.5 6 9 12l5.5 6" />
            </svg>
            {back.label}
          </button>
        ) : null}
        <h1 className={day ? "screen-title day-title" : "screen-title"}>{title}</h1>
        {sub || subAside !== undefined ? (
          <div className="screen-sub-row">
            {sub ? <p className="screen-sub">{sub}</p> : null}
            {subAside}
          </div>
        ) : null}
      </div>
      <div className="screen-actions">
        {badge}
        {actions}
        {showActions ? (
          <>
            <button
              type="button"
              className="icon-btn"
              aria-label="Search"
              onClick={() => navigate("/search")}
            >
              <SearchIcon />
            </button>
            <ThemeToggle />
          </>
        ) : null}
      </div>
    </header>
  );
}
