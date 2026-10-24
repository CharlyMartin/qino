import { PostsIndex } from "@/components/posts/posts-index";
import { categoryCollection } from "../../../../../qino/collections/categories";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await categoryCollection.getAllSlugs();
  return slugs.map((tag) => ({ tag }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  return <PostsIndex tag={tag} />;
}
