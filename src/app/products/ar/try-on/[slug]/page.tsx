import ARTryOnPage from "@/Components/Ar/face";
import { getMappingBySlug, isARSupportedSlug } from "@/lib/ar/arProductMapping";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  if (!isARSupportedSlug(slug)) {
    notFound();
  }

  const mapping = getMappingBySlug(slug);

  return (
    <ARTryOnPage 
      initialSlug={slug}
      initialModelName={mapping?.modelName || null}
      initialProductType={mapping?.type || null}
    />
  );
}
