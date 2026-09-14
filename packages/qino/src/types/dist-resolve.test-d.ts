import { createQino } from "qino";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

class Price {
  constructor(readonly cents: number) {}

  get(unit: "cents" | "units") {
    return unit == "cents" ? this.cents : this.cents / 100;
  }

  map<R>(fn: (n: number) => R) {
    return fn(this.cents);
  }
}

const { createCollection } = createQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const authors = createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});
const articles = createCollection({
  directory: "/articles",
  extension: ".md",
  schema: z.object({
    dates: z
      .object({ start: z.string(), end: z.string().optional() })
      .transform((d) => ({
        start: new Date(d.start),
        end: d.end ? new Date(d.end) : undefined,
      })),
    price: z.string().transform((v) => new Price(Number(v))),
    contributors: z
      .array(
        z.object({
          slug: z.string(),
          role: z.object({ slug: z.string() }),
          since: z.date(),
        }),
      )
      .optional(),
  }),
  relations: {
    "contributors[*].slug": authors,
    "contributors[*].role.slug": authors,
  },
  views: (view) => ({
    default: view({}),
    shallow: view({ resolveRelations: 1 }),
    full: view({ resolveRelations: true }),
  }),
});

for (const view of ["shallow", "full"] as const) {
  test(`${view} preserves schema instances and optional nested relation containers`, async () => {
    const [article] = await articles.getAll({ view });
    expectTypeOf(article.dates).toEqualTypeOf<{
      start: Date;
      end: Date | undefined;
    }>();
    expectTypeOf(article.price).toEqualTypeOf<Price>();
    type Contributor = NonNullable<typeof article.contributors>[number];
    expectTypeOf<Contributor["slug"]["name"]>().toEqualTypeOf<string>();
    expectTypeOf<Contributor["role"]["slug"]["name"]>().toEqualTypeOf<string>();
    expectTypeOf<Contributor["since"]>().toEqualTypeOf<Date>();
    expectTypeOf<Pick<typeof article, "contributors">>().toEqualTypeOf<{
      contributors?: typeof article.contributors;
    }>();
    expectTypeOf({}).toExtend<Pick<typeof article, "contributors">>();
  });
}
