import { Sheet } from "./Sheet";
import { ArrowDownIcon, ArrowUpIcon, InboxIcon, SunGlyph } from "./icons";

export type RowAction = "up" | "down" | "today" | "inbox";

type RowMenuProps = {
  title: string;
  onAction: (action: RowAction) => void;
  onClose: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  inToday: boolean;
  scheduled: boolean;
};

/**
 * What a row can do, without a pointer that has to drag. The grip opens it
 * on a tap and still drags on a drag, so one control does both.
 */
export function RowMenu({
  title,
  onAction,
  onClose,
  canMoveUp,
  canMoveDown,
  inToday,
  scheduled,
}: RowMenuProps) {
  const run = (action: RowAction) => {
    onAction(action);
    onClose();
  };

  return (
    <Sheet title={title} onClose={onClose}>
      <ul className="menu-list">
        <li>
          <button
            type="button"
            className="menu-row"
            onClick={() => run("up")}
            disabled={!canMoveUp}
          >
            <ArrowUpIcon size={18} />
            <span>Move up</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="menu-row"
            onClick={() => run("down")}
            disabled={!canMoveDown}
          >
            <ArrowDownIcon size={18} />
            <span>Move down</span>
          </button>
        </li>
        {inToday ? null : (
          <li>
            <button type="button" className="menu-row" onClick={() => run("today")}>
              <SunGlyph size={18} />
              <span>Move to today</span>
            </button>
          </li>
        )}
        {scheduled ? (
          <li>
            <button type="button" className="menu-row" onClick={() => run("inbox")}>
              <InboxIcon size={18} />
              <span>Move to the inbox</span>
            </button>
          </li>
        ) : null}
      </ul>
    </Sheet>
  );
}
