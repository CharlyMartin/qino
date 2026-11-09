import type { AugmentOutput, Awaitable } from "../../types/augment";
import type { ResolveDepths } from "../../types/resolve";
import type { GetterOptions } from "../../types/utils";

export type RuntimeView = {
  resolveDepth?: ResolveDepths;
  augment?: (entry: never) => Awaitable<AugmentOutput>;
};

export function selectView(
  views: Record<string, RuntimeView> | undefined,
  options?: GetterOptions<string | undefined>,
) {
  for (const key of ["resolveRelations", "resolveDepth"]) {
    if (typeof Reflect.get(options ?? {}, key) != "undefined") {
      throw new Error(
        `Getter ${key} is not supported. Configure resolveDepth in a view and select that view instead.`,
      );
    }
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
  if (name == undefined) return views?.default ?? { resolveDepth: {} };

  const view = views?.[name];
  if (!views || !Object.hasOwn(views, name) || !view) {
    throw new Error(
      `Unknown view "${name}". Available views: ${Object.keys(views ?? {}).join(", ") || "(none)"}.`,
    );
  }

  return view;
}
