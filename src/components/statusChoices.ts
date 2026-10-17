import { TaskStatus, statusLabel } from "../domain/types";
import type { DropdownOption } from "./Dropdown";

export const STATUS_CHOICES: DropdownOption[] = (
  ["todo", "in_progress", "done"] satisfies TaskStatus[]
).map((status) => ({
  value: status,
  label: statusLabel(status),
  swatch: `status-${status}`,
}));
