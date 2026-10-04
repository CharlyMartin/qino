export function assertContentPath(path: string, label: string) {
  if (path.startsWith("/")) {
    throw new Error(
      `${label} "${path}" must be relative to contentFolder, without a leading "/". Use "${path.replace(/^\/+/, "")}".`,
    );
  }
}
