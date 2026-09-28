import { useSyncExternalStore } from "react";

import type { PackageManager } from "./get-install-commands";

let packageManager: PackageManager = "pnpm";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return function unsubscribe() {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return packageManager;
}

function getServerSnapshot(): PackageManager {
  return "pnpm";
}

function setPackageManager(next: PackageManager) {
  if (packageManager == next) return;
  packageManager = next;
  for (const listener of listeners) listener();
}

export function usePackageManager() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [value, setPackageManager] as const;
}
