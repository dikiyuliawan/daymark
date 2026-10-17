import {
  ReactNode,
  useEffect,
  useId,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { trapTabKey } from "./focus";

type ModalDialogProps = {
  title: ReactNode;
  initialFocusRef?: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ModalDialog({
  title,
  initialFocusRef,
  onClose,
  children,
  footer,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const focusTarget = initialFocusRef?.current ?? null;
    if (focusTarget !== null && document.contains(focusTarget)) {
      focusTarget.focus();
    } else {
      dialogRef.current?.focus();
    }
    return () => {
      openerRef.current?.focus();
    };
    // initialFocusRef is read once when the dialog mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
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
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {children}
        {footer ? <div className="dialog-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
