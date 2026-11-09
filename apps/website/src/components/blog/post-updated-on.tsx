import { formatPostDate } from "@/lib/format-post-date";

type PostUpdatedOnProps = {
  updatedOn: string;
};

export function PostUpdatedOn({ updatedOn }: PostUpdatedOnProps) {
  return (
    <p className="font-mono text-label uppercase text-muted-foreground">
      Last updated <time dateTime={updatedOn}>{formatPostDate(updatedOn)}</time>
    </p>
  );
}
