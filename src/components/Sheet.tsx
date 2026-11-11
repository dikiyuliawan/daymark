import {
  ReactNode,
  useEffect,
  useId,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { trapTabKey } from "./focus";

type SheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * A bottom sheet on a phone, a centred panel on a wide screen. It is one
 * surface with one handle, one title row and one action row.
 */
export function Sheet({ title, onClose, children, footer, initialFocusRef }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const target = initialFocusRef?.current ?? null;
    if (target !== null && document.contains(target)) {
      target.focus();
    } else {
      sheetRef.current?.focus();
    }
    return () => {
      openerRef.current?.focus();
    };
    // The initial focus is read once, when the sheet mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    trapTabKey(event.currentTarget, event.nativeEvent);
  };

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden focusable={false}>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
