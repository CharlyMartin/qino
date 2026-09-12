import { expectTypeOf, test } from "vitest";

import type { AnyCollection } from "./collection";
import type { Infer } from "./infer";
import type { AnySingleton } from "./singleton";
import type { AnyTree } from "./tree";
import type { AnyPrimitive } from "./utils";

test("widened primitives without inference metadata produce never", () => {
  expectTypeOf<Infer<AnyCollection>>().toEqualTypeOf<never>();
  expectTypeOf<Infer<AnySingleton>>().toEqualTypeOf<never>();
  expectTypeOf<Infer<AnyTree>>().toEqualTypeOf<never>();
  expectTypeOf<Infer<AnyPrimitive>>().toEqualTypeOf<never>();
});
