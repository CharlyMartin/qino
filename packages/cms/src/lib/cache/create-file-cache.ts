import fs from "node:fs/promises";

// Timestamps can be as coarse as 2s (FAT), so an edit this close to a read can
// leave the file's stats as they were.
const RECENT_EDIT_MS = 2_000;

type FileLoader<Value> = (data: string) => Promise<Value>;

type FileCacheSlot = {
  version: string;
  value: Promise<unknown>;
  /** The text the value was loaded from, kept while the stats can't be trusted. */
  text?: Promise<string>;
};

/**
 * Keeps one value per text file, loaded from its contents and reused while the
 * file's inode, mtime, and size are unchanged. A file edited within 2s of a
 * read is compared by content too, until its mtime is old enough to trust, as
 * Git does for "racily clean" files. One slot per path, so edits replace rather
 * than grow it. A rejected load is dropped, so the next read retries it.
 */
export function createFileCache() {
  const slots = new Map<string, FileCacheSlot>();

  return { read };

  async function read<Value>(filePath: string, load: FileLoader<Value>) {
    const now = Date.now();
    // A missing file fails in readFile, with the error an uncached read throws.
    const stats = await fs
      .stat(filePath, { bigint: true })
      .catch(() => undefined);
    if (!stats) return load(await fs.readFile(filePath, "utf-8"));

    const version = `${stats.ino}:${stats.mtimeNs}:${stats.size}`;
    const recent = now - Number(stats.mtimeMs) < RECENT_EDIT_MS;
    const slot = slots.get(filePath);
    if (slot?.version == version && !slot.text) {
      return slot.value as Promise<Value>;
    }

    const text = fs.readFile(filePath, "utf-8");
    if (slot?.version == version && slot.text) {
      const [cached, data] = await Promise.all([
        slot.text.catch(() => undefined),
        text,
      ]);
      if (cached == data) {
        if (!recent) slot.text = undefined;
        return slot.value as Promise<Value>;
      }
      // A concurrent read may have reloaded it while this one compared.
      const current = slots.get(filePath);
      if (current != slot && current?.version == version) {
        return current.value as Promise<Value>;
      }
    }

    // Set before any await, so concurrent reads share this load.
    const value = text.then(load);
    slots.set(filePath, { version, value, text: recent ? text : undefined });
    value.catch(() => {
      if (slots.get(filePath)?.value == value) slots.delete(filePath);
    });
    return value;
  }
}
