import { TechReadDetail } from "../../../../components/content/tech-read-detail";

export default function TechReadDetailPage({ params }: { params: { slug: string } }) {
  return <TechReadDetail slug={params.slug} />;
}
