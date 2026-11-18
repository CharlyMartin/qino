const NODE_MODULES = /[\\/]node_modules[\\/]/g;

/**
 * The directory of the package a bundled module comes from, or `undefined`
 * for a module outside `node_modules`, such as qino's own code.
 */
export function getPackageRoot(moduleId: string) {
  // Rolldown's virtual modules start with a null byte.
  if (moduleId.startsWith("\0")) return undefined;

  const last = [...moduleId.matchAll(NODE_MODULES)].at(-1);
  if (!last) return undefined;

  const start = last.index + last[0].length;
  const [first, second] = moduleId.slice(start).split(/[\\/]/);
  if (!first) return undefined;
  if (!first.startsWith("@")) return moduleId.slice(0, start + first.length);
  if (!second) return undefined;
  return moduleId.slice(0, start + first.length + 1 + second.length);
}
