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
  views: Record<string, RuntimeView> | undefined,
  options?: GetterOptions<string | undefined>,
) {
  if (typeof options?.resolveRelations != "undefined") {
    throw new Error(
      "Getter resolveRelations is no longer supported. Configure it in a view and select that view instead.",
    );
  }

  if (
    typeof options?.filter != "undefined" ||
    typeof options?.sort != "undefined"
  ) {
    throw new Error(
      "Getter filter and sort are not supported. Configure them in a collection view instead.",
    );
  }

  const name = options?.view;
  if (name == undefined) return views?.default ?? { resolveRelations: false };

  if (!views || !Object.hasOwn(views, name)) {
    throw new Error(
      `Unknown view "${name}". Available views: ${Object.keys(views ?? {}).join(", ") || "(none)"}.`,
    );
  }

  return views[name];
}
