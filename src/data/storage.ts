import { AppData } from "../domain/types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "daymark:data:v2";
export const LEGACY_STORAGE_KEY = "daymark:data:v1";

export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    window.localStorage.getItem(STORAGE_KEY);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRaw(storage: StorageLike | null, key: string): { raw: string | null; available: boolean } {
  try {
    return {
      raw: storage ? storage.getItem(key) : null,
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

export function writeRaw(
  storage: StorageLike | null,
  key: string,
  value: string,
): StorageWrite {
  if (!storage) {
    return { kind: "unavailable" };
  }
  try {
    storage.setItem(key, value);
    return { kind: "saved" };
  } catch {
    return { kind: "unavailable" };
  }
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}
