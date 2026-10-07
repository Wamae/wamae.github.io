const key = "desktop-history-length";

/** The part of `Storage` that is used, so a fake can stand in for it. */
export type LengthStore = Pick<Storage, "getItem" | "setItem">;

/** The saved number of history entries, or `null` when none is saved or storage is unavailable. */
export function readSavedLength(store: LengthStore | null): number | null {
  try {
    const raw = store?.getItem(key) ?? null;
    // Digits only: "1e3", " 7 " and "0x10" are not something this code ever saved.
    return raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;
  } catch {
    return null;
  }
}

/** Saves the number of history entries. Storage can be blocked, which is not an error here. */
export function saveLength(store: LengthStore | null, length: number): void {
  try {
    store?.setItem(key, String(length));
  } catch {
    // Without storage, Forward is simply disabled after a reload.
  }
}
