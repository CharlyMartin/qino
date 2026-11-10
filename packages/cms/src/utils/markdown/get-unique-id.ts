/** `base`, or `base-1`, `base-2`… when it's already in `used`. */
export function getUniqueId(base: string, used: Set<string>) {
  let id = base;
  for (let index = 1; used.has(id); index++) id = `${base}-${index}`;

  return id;
}
