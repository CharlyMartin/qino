type PostMeta = {
  slug: string;
};

type PostEntry = {
  _meta: PostMeta;
  title: string;
};

type PostPage = {
  entries: Array<PostEntry>;
};

type PageOptions = {
  perPage: number;
};

type PostSource = {
  getPaginatedEntries: (
    page: number,
    options: PageOptions,
  ) => Promise<PostPage>;
};

/**
 * Reads the first post of the collection's default view, which the posts
 * collection sorts by publish date, newest first. `null` before the first post.
 */
export async function readLatestPost(posts: PostSource) {
  const {
    entries: [post],
  } = await posts.getPaginatedEntries(1, { perPage: 1 });
  if (!post) return null;

  return { slug: post._meta.slug, title: post.title };
}
