export function assertNoRootViewSettings(config: object) {
  for (const key of [
    "resolveRelations",
    "augment",
    "filter",
    "sort",
  ] as const) {
    if (typeof Reflect.get(config, key) != "undefined") {
      throw new Error(
        `Configure "${key}" inside views.default or a custom view, not at the root.`,
      );
    }
  }
}
