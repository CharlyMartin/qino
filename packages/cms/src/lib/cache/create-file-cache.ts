import fs from "node:fs/promises";

import { readTextFile } from "../fs/read-text-file";
import type { DependencyCollector } from "./create-dependency-collector";
import { observeFile } from "./observe-file";

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
 * than grow it, and a missing file or `retain` drops it. A rejected load is
 * dropped too, so the next read retries it.
 */
export function createFileCache() {
  const slots = new Map<string, FileCacheSlot>();

  return { read, retain };

  /**
   * Reads a file's value. `dependencies` records the stat this read took
   * before using the file, so a listing can tell later whether it changed.
   */
  async function read<Value>(
    filePath: string,
    load: FileLoader<Value>,
    dependencies?: DependencyCollector,
  ) {
    const now = Date.now();
    // A missing file fails in readFile, with the error an uncached read throws.
    const stats = await fs
      .stat(filePath, { bigint: true })
      .catch(() => undefined);
    if (!stats) {
      dependencies?.record(filePath);
      slots.delete(filePath);
      return load(await readTextFile(filePath));
    }

    const observation = observeFile(stats, now);
    dependencies?.record(filePath, observation);
    const { version, untrusted: recent } = observation;
    const slot = slots.get(filePath);
    if (slot?.version == version && !slot.text) {
      return slot.value as Promise<Value>;
    }

    const text = readTextFile(filePath);
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

  /** Drops every slot whose path isn't in `filePaths`, such as removed files. */
  function retain(filePaths: Iterable<string>) {
    const kept = new Set(filePaths);
    for (const filePath of slots.keys()) {
      if (!kept.has(filePath)) slots.delete(filePath);
    }
  }
}
