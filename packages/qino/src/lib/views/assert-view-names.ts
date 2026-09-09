export function assertViewNames(views: object | undefined) {
  if (views && Object.hasOwn(views, "default")) {
    throw new Error(
      'The view name "default" is reserved. Use top-level resolveRelations and augment instead.',
    );
  }
}
