import type {
  AugmentOutput,
  Awaitable,
  GetterOptions,
  ResolveOption,
} from "../../types";

export type RuntimeView = {
  resolveRelations?: ResolveOption;
  augment?: (entry: never) => Awaitable<AugmentOutput>;
};

export function selectView(
  defaults: RuntimeView,
  views: Record<string, RuntimeView> | undefined,
  options?: GetterOptions<string | undefined>,
) {
  if (options && "resolveRelations" in options) {
    throw new Error(
      "Getter resolveRelations is no longer supported. Configure it in a view and select that view instead.",
    );
  }

  const name = options?.view;
  if (name == undefined) return defaults;
  if (name == "default") {
    throw new Error(
      'The "default" view is implicit. Omit the view option to select it.',
    );
  }

  if (!views || !Object.hasOwn(views, name)) {
    throw new Error(
      `Unknown view "${name}". Available views: ${Object.keys(views ?? {}).join(", ") || "(none)"}.`,
    );
  }

  return views[name];
}
