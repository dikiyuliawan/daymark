import {
  useEffect,
  useId,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown } from "./icons";

export type DropdownOption = {
  value: string;
  label: string;
  swatch?: string;
  hint?: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  variant?: "chip" | "field" | "filter";
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

function selectedIndex(options: DropdownOption[], value: string): number {
  const index = options.findIndex((option) => option.value === value);
  return index < 0 ? 0 : index;
}

export function Dropdown({
  label,
  value,
  options,
  onChange,
  variant = "field",
  className,
  onOpenChange,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const [activeIndex, setActiveIndex] = useState(() => selectedIndex(options, value));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    onOpenChange?.(open);
    // Notify the host (e.g. a task card raising itself above its siblings).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex(options, value));
    }
    // Re-sync the highlighted option each time the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const commit = (index: number) => {
    const option = options[index];
    if (option) {
      onChange(option.value);
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (next: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, next));
    setActiveIndex(clamped);
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveActive(0);
        break;
      case "End":
        event.preventDefault();
        moveActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`dropdown dropdown-${variant}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        ref={triggerRef}
        className="dropdown-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        {selected?.swatch ? (
          <span className={`status-dot ${selected.swatch}`} aria-hidden="true" />
        ) : null}
        <span className="dropdown-value">{selected?.label ?? ""}</span>
        <ChevronDown className="dropdown-chevron" size={14} />
      </button>
      {open ? (
        <div className="dropdown-menu" ref={menuRef}>
          <ul className="dropdown-list" role="listbox" id={listboxId} aria-label={label}>
            {options.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                className={`dropdown-option${index === activeIndex ? " dropdown-option-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(index)}
              >
                {option.swatch ? (
                  <span className={`status-dot ${option.swatch}`} aria-hidden="true" />
                ) : null}
                <span className="dropdown-option-label">{option.label}</span>
                {option.hint ? <span className="dropdown-option-hint">{option.hint}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
