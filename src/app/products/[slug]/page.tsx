import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { getImageUrl } from '@/lib/getImageUrl';
import { IProduct } from '@/models/Product';
import ProductDetailClient from './ProductDetailClient';
import { Breadcrumbs } from '@/Components/Breadcrumbs';
interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return {
        title: "Sản phẩm không tìm thấy",
      };
    }

    return {
      title: `${product.name} | Mandala Store`,
      description:
        product.shortDescription || product.description.substring(0, 160),
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description,
        images: [getImageUrl(product.images?.[0] || '')],
      },
    };
  } catch (error) {
    return {
      title: "Sản phẩm không tìm thấy",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  let product: IProduct | null = null;
  let relatedProducts: IProduct[] = [];

  try {
    const productResult = await productService.getProductBySlug(slug);

    if (!productResult) {
      return notFound();
    }

    product = productResult;

    // Lấy sản phẩm liên quan (cùng category)
    if (product.categoryIds && product.categoryIds.length > 0) {
      const allCategoryProducts = await productService.getProductsByCategory(
        product.categoryIds[0]
      );
      relatedProducts = allCategoryProducts
        .filter((p) => p._id !== product?._id)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return notFound();
  }

  const discountPercentage = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumbs 
          items={[
            { href: '/', label: 'Trang chủ' },
            { href: '/products', label: 'Sản phẩm' },
            { href: '#', label: product.name }
          ]}
        />

        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
          discountPercentage={discountPercentage}
          slug={slug}
        />
      </div>
    </div>
  );
}
