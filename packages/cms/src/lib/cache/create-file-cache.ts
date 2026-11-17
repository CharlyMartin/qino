import fs from "node:fs/promises";

type FileCacheSlot = {
  version: string;
  value: Promise<unknown>;
};

/**
 * Keeps one loaded value per file, reused while the file's inode, mtime, and
 * size are unchanged. One slot per path, so edits replace rather than grow it.
 * A rejected load is dropped, so the next read retries instead of rethrowing.
 */
export function createFileCache() {
  const slots = new Map<string, FileCacheSlot>();

  return { read };

  async function read<Value>(filePath: string, load: () => Promise<Value>) {
    // A missing file is left to `load`, so its own error surfaces.
    const stats = await fs
      .stat(filePath, { bigint: true })
      .catch(() => undefined);
    if (!stats) return load();

    const version = `${stats.ino}:${stats.mtimeNs}:${stats.size}`;
    const slot = slots.get(filePath);
    if (slot?.version == version) return slot.value as Promise<Value>;

    const value = load();
    slots.set(filePath, { version, value });
    value.catch(() => {
      if (slots.get(filePath)?.value == value) slots.delete(filePath);
    });
    return value;
  }
}
