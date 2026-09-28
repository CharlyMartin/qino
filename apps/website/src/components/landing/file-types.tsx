import { siJson, siMarkdown, siMdx } from "simple-icons";

import { Eyebrow } from "./eyebrow";
import { Section } from "./section";
import { SimpleIcon } from "./simple-icon";

export function FileTypes() {
  return (
    <Section aria-labelledby="file-types-heading" spacing="compact">
      <h2 id="file-types-heading" className="sr-only">
        Supported file types
      </h2>
      <div className="grid grid-cols-2 items-center gap-x-7 gap-y-6 md:grid-cols-4">
        <Eyebrow>
          Reads the files
          <br />
          you already have
        </Eyebrow>
        {[siMarkdown, siMdx, siJson].map((icon) => (
          <div
            key={icon.slug}
            className="flex min-w-0 items-center gap-3 md:border-l md:pl-4 lg:gap-4 lg:pl-6"
          >
            <SimpleIcon icon={icon} />
            <span className="text-sm text-muted-foreground">{icon.title}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
