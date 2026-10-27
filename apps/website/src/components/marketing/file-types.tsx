import { siJson, siMarkdown, siMdx } from "simple-icons";

import { Eyebrow } from "./eyebrow";
import { Section } from "./section";
import { SimpleIcon } from "./simple-icon";
import { Text } from "./text";

const fileTypes = [
  { icon: siMarkdown, viewBox: "0 4.615 24 14.77" },
  { icon: siMdx, viewBox: "0 7.12 24 9.758" },
  { icon: siJson, viewBox: "0 0 24 24" },
];

export function FileTypes() {
  return (
    <Section aria-labelledby="file-types-heading" spacing="none">
      <h2 id="file-types-heading" className="sr-only">
        Supported file types
      </h2>
      {/* Cells carry the vertical padding on desktop so their dividers run full height. */}
      <div className="grid grid-cols-2 gap-x-7 gap-y-6 py-8 md:grid-cols-4 md:py-0">
        <div className="flex items-center md:py-8">
          <Eyebrow>
            Reads the files
            <br />
            you already have
          </Eyebrow>
        </div>
        {fileTypes.map(({ icon, viewBox }) => (
          <div
            key={icon.slug}
            className="flex min-w-0 items-center gap-3 md:border-l md:py-8 md:pl-4 lg:gap-4 lg:pl-6"
          >
            <SimpleIcon icon={icon} viewBox={viewBox} />
            <Text size="small">{icon.title}</Text>
          </div>
        ))}
      </div>
    </Section>
  );
}
