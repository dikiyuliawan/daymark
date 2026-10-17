import { KeyboardEvent, useState } from "react";
import { Subtask } from "../domain/types";
import { Check, CloseIcon, Plus } from "./icons";

type SubtasksEditorProps = {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
};

export function SubtasksEditor({ subtasks, onAdd, onToggle, onRemove }: SubtasksEditorProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed === "") return;
    onAdd(trimmed);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  return (
    <div className="subtasks">
      <ul className="subtask-list">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="subtask" data-done={subtask.done ? "true" : undefined}>
            <button
              type="button"
              className="subtask-check"
              role="checkbox"
              aria-checked={subtask.done}
              aria-label={subtask.title}
              onClick={() => onToggle(subtask.id, !subtask.done)}
            >
              {subtask.done ? <Check size={13} /> : null}
            </button>
            <span className="subtask-title">{subtask.title}</span>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              aria-label={`Remove step ${subtask.title}`}
              onClick={() => onRemove(subtask.id)}
            >
              <CloseIcon size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="subtask-add">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a step"
          aria-label="New step"
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label="Add step"
          disabled={draft.trim() === ""}
          onClick={add}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
