"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ProductImageGallery = dynamic(() => import("@/Components/products/ProductImageGallery"), { loading: () => <div className="h-80 flex items-center justify-center">Đang tải hình ảnh...</div> });
const ProductInfo = dynamic(() => import("@/Components/products/ProductInfo"), { loading: () => <div className="h-80 flex items-center justify-center">Đang tải thông tin...</div> });
const ProductTabs = dynamic(() => import("@/Components/products/ProductTabs"), { loading: () => <div className="h-80 flex items-center justify-center">Đang tải thông tin...</div> });
const RelatedProducts = dynamic(() => import("@/Components/products/RelatedProducts"), { loading: () => <div className="h-40 flex items-center justify-center">Đang tải sản phẩm liên quan...</div> });

import { IProduct } from '@/models/Product';

interface ProductDetailClientProps {
    product: IProduct;
    relatedProducts: IProduct[];
    discountPercentage: number;
    slug: string;
}

export default function ProductDetailClient({ product, relatedProducts, discountPercentage, slug }: ProductDetailClientProps) {
    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Images */}
                <div>
                    <Suspense fallback={<div className="h-80 flex items-center justify-center">Đang tải hình ảnh...</div>}>
                        <ProductImageGallery
                            images={product.images}
                            productName={product.name}
                            description={product.description}
                            shortDescription={product.shortDescription}
                        />
                    </Suspense>
                </div>
                {/* Product Info */}
                <div>
                    <Suspense fallback={<div className="h-80 flex items-center justify-center">Đang tải thông tin...</div>}>
                        <ProductInfo
                            productId={product._id as string}
                            slug={slug}
                            name={product.name}
                            price={product.price}
                            salePrice={product.salePrice}
                            description={product.description}
                            shortDescription={product.shortDescription}
                            attributes={product.attributes}
                            rating={{
                                ...product.rating,
                                details: (product.rating.details instanceof Map)
                                    ? Object.fromEntries(product.rating.details)
                                    : (typeof product.rating.details === 'object' && product.rating.details !== null)
                                        ? product.rating.details
                                        : {}
                            }}
                            stock={product.stock}
                            tags={product.tags}
                            discountPercentage={discountPercentage}
                        />
                    </Suspense>
                </div>
                {/* Related Products */}
                <div>
                    <Suspense fallback={<div className="h-40 flex items-center justify-center">Đang tải sản phẩm liên quan...</div>}>
                        {relatedProducts && relatedProducts.length > 0 && (
                            <RelatedProducts products={relatedProducts} />
                        )}
                    </Suspense>
                </div>
            </div>
            {/* Product Details Section */}
            <div className="mt-12">
                <Suspense fallback={<div className="h-80 flex items-center justify-center">Đang tải đánh giá...</div>}>
                    <ProductTabs
                        productId={product.slug}
                        description={product.description}
                        attributes={product.attributes}
                        rating={{
                            ...product.rating,
                            details: (product.rating.details instanceof Map)
                                ? Object.fromEntries(product.rating.details)
                                : (typeof product.rating.details === 'object' && product.rating.details !== null)
                                    ? product.rating.details
                                    : {}
                        }}
                    />
                </Suspense>
            </div>
        </div>
    );
}
