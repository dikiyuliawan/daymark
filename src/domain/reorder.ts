import { Task } from "./types";

/**
 * Returns a copy of `tasks` where the tasks named in `idsInOrder` receive
 * sequential `order` values matching that sequence. Tasks not named keep their
 * current order. Used by drag-and-drop and keyboard reordering.
 */
export function reorderGroup(tasks: Task[], idsInOrder: string[]): Task[] {
  const positions = new Map(idsInOrder.map((id, index) => [id, index]));
  return tasks.map((task) => {
    const position = positions.get(task.id);
    return position === undefined ? task : { ...task, order: position };
  });
}

/** New order after moving the item at `from` to sit at `to` (both indexes). */
export function moveWithin(list: string[], from: number, to: number): string[] {
  if (from < 0 || from >= list.length) {
    return list;
  }
  const clampedTo = Math.max(0, Math.min(list.length - 1, to));
  if (clampedTo === from) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(clampedTo, 0, moved);
  return next;
}

/**
 * New order when `draggedId` is dropped onto the row `targetId`, placing the
 * dragged task before or after the target depending on the pointer half.
 */
export function dropOrder(
  orderedIds: string[],
  draggedId: string,
  targetId: string,
  placeAfter: boolean,
): string[] {
  const from = orderedIds.indexOf(draggedId);
  const target = orderedIds.indexOf(targetId);
  if (from === -1 || target === -1 || draggedId === targetId) {
    return orderedIds;
  }
  const without = orderedIds.filter((id) => id !== draggedId);
  const targetIndex = without.indexOf(targetId);
  const insertAt = placeAfter ? targetIndex + 1 : targetIndex;
  without.splice(insertAt, 0, draggedId);
  return without;
}

export function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}
