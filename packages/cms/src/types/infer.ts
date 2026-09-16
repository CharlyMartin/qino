import type { ObjectSchema } from "./schema";
import type { AnyPrimitive } from "./utils";
import type { SelectedView, ViewNames } from "./views";

// Type-only metadata: primitive objects never create this property at runtime.
// Never access this symbol in value expressions; it has no runtime declaration.
declare const QinoInference: unique symbol;

export type PrimitiveInference<S extends ObjectSchema, Meta, Rels, Views> = {
  readonly [QinoInference]?: {
    output: SelectedView<S, Meta, Rels, Views, undefined>;
    views: {
      [Name in ViewNames<Views>]: SelectedView<S, Meta, Rels, Views, Name>;
    };
  };
};

/** The default entry output and named view outputs of a Qino primitive. */
export type Infer<
  Primitive extends AnyPrimitive & {
    readonly [QinoInference]?: { output: unknown; views: object };
  },
> = typeof QinoInference extends keyof Primitive
  ? NonNullable<Primitive[typeof QinoInference]>
  : never; // Widened primitives have erased the metadata needed for inference.
