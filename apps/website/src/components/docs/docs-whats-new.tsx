import { externalLinks } from "../../lib/external-links";
import { formatVersion } from "../../lib/format-version";
import type { ChangelogRelease } from "../../types/changelog-release";
import { ExternalLink } from "../marketing/external-link";
import { Eyebrow } from "../marketing/eyebrow";
import { Title } from "../marketing/title";
import { InlineMarkdown } from "./inline-markdown";

type DocsWhatsNewProps = {
  releases: Array<ChangelogRelease>;
};

/** The latest @qino/cms releases, a line per change, from its changelog. */
export function DocsWhatsNew({ releases }: DocsWhatsNewProps) {
  return (
    <section aria-labelledby="whats-new" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Title as="h2" size="row" id="whats-new">
          What's new
        </Title>
        <p className="text-sm font-medium">
          <ExternalLink href={externalLinks.changelog}>
            Full changelog
          </ExternalLink>
        </p>
      </div>
      <ol className="divide-y border-y">
        {releases.map((release) => (
          <li
            key={release.version}
            className="flex flex-col gap-2 py-4 sm:flex-row sm:gap-6"
          >
            <div className="pt-0.5 sm:w-20 sm:shrink-0">
              <Eyebrow>{formatVersion(release.version)}</Eyebrow>
            </div>
            <ul className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              {release.changes.map((change) => (
                <li key={change.summary}>
                  <InlineMarkdown markdown={change.summary} />
                  {change.pullRequest ? (
                    <>
                      {" "}
                      <ExternalLink href={change.pullRequest.url}>
                        #{change.pullRequest.number}
                      </ExternalLink>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
