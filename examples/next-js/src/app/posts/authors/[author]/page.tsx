import { PostsIndex } from "@/components/posts/posts-index";
import { authorCollection } from "../../../../../qino/collections/authors";

type AuthorPageProps = {
  params: Promise<{ author: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await authorCollection.getAllSlugs();
  return slugs.map((author) => ({ author }));
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { author } = await params;
  return <PostsIndex author={author} />;
}
