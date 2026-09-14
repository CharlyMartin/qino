export function assertViewNames(views: object | undefined) {
  if (views && !Object.hasOwn(views, "default")) {
    throw new Error(
      'The views factory must return a "default" view created with view({ ... }).',
    );
  }
}
