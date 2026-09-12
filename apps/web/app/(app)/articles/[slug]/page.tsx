import { ArticleDetail } from "../../../../components/content/article-detail";

export default function ArticleDetailPage({ params }: { params: { slug: string } }) {
  return <ArticleDetail slug={params.slug} />;
}
