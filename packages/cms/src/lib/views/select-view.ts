import type { AugmentOutput, Awaitable } from "../../types/augment";
import type { ResolveOption } from "../../types/resolve";
import type { GetterOptions } from "../../types/utils";

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

  const view = views?.[name];
  if (!views || !Object.hasOwn(views, name) || !view) {
    throw new Error(
      `Unknown view "${name}". Available views: ${Object.keys(views ?? {}).join(", ") || "(none)"}.`,
    );
  }

  return view;
}
