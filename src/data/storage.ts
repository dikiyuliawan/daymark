import { AppData, createEmptyAppData } from "../domain/types";
import { validateAppData } from "../domain/validate";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "daymark:data:v1";

export type StorageRead = { raw: string | null; available: boolean };

export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    // Probing with a no-op read also surfaces security-policy failures.
    window.localStorage.getItem(STORAGE_KEY);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRaw(storage: StorageLike | null): StorageRead {
  try {
    return {
      raw: storage ? storage.getItem(STORAGE_KEY) : null,
      available: storage !== null,
    };
  } catch {
    return { raw: null, available: false };
  }
}

/**
 * Storage failures (quota, security policy, blocked storage) surface here as
 * explicit outcomes instead of exceptions, so the UI can report exactly what
 * happened. A failed save must never look like a successful one.
 */
export type StorageWrite = { kind: "saved" } | { kind: "unavailable" };

export function writeRaw(storage: StorageLike | null, value: string): StorageWrite {
  if (!storage) {
    return { kind: "unavailable" };
  }
  try {
    storage.setItem(STORAGE_KEY, value);
    return { kind: "saved" };
  } catch {
    return { kind: "unavailable" };
  }
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}

export type ParsedStorage =
  | { kind: "ok"; data: AppData }
  | { kind: "corrupt"; raw: string | null; reason: string };

export function parseStoredData(raw: string | null, available: boolean): ParsedStorage {
  if (!available || raw === null) {
    return { kind: "ok", data: createEmptyAppData() };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", raw, reason: "Saved data is not valid JSON." };
  }
  const outcome = validateAppData(parsed);
  if (outcome.kind === "ok") {
    return { kind: "ok", data: outcome.data };
  }
  return { kind: "corrupt", raw, reason: outcome.reason };
}
