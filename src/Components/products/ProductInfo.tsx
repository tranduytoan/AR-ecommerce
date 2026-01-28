"use client";

import React, { useState, useTransition } from "react";
import FavoriteButton from "./FavoriteButton";
import { useFavorite } from "@/hooks/useFavorite";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Star, Share2, ShoppingCart, Minus, Plus, RectangleGoggles } from "lucide-react";
import { addItemToCart, buyNowAndRedirect } from "@/lib/actions/cart";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { isARSupportedSlug, getARTryOnUrl } from "@/lib/ar/arProductMapping";

interface ProductAttribute {
  brand?: string;
  spf?: string;
  skinType?: string[];
  volume?: string;
  type?: string;
  concentration?: string;
  benefits?: string[];
  usage?: string;
  material?: string;
  color?: string | string[];
  size?: string | string[] | Record<string, string>;
}

interface ProductRating {
  average: number;
  count: number;
  details?: {
    [key: string]: number;
  };
}

interface ProductInfoProps {
  productId: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  description: string;
  shortDescription?: string;
  attributes?: ProductAttribute;
  rating: ProductRating;
  stock: number;
  tags?: string[];
  discountPercentage?: number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  productId,
  slug,
  name,
  price,
  salePrice,
  description,
  shortDescription,
  attributes,
  rating,
  stock,
  tags,
  discountPercentage,
}) => {
  const [quantity, setQuantity] = useState(1);
  const { favoriteIds, refreshFavorites, setFavoriteIds, toggleFavorite } = useFavorite();
  const isFavorite = favoriteIds.includes(productId);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating)
          ? "fill-yellow-400 text-yellow-400"
          : "text-gray-300"
          }`}
      />
    ));
  };

  // Favorite click button
  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite(productId);
    } catch (err) {
      // handled in hook
    }
  };

  const handleAddToCart = () => {
    startTransition(async () => {
      const result = await addItemToCart(productId, quantity);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleBuyNow = () => {
    startTransition(async () => {
      try {
        const result = await buyNowAndRedirect(productId, quantity);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        // toast.error(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    });
  };

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleARClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const arUrl = getARTryOnUrl(slug);
    if (arUrl) {
      router.push(arUrl);
    } else {
      toast.error("Sản phẩm không hỗ trợ trải nghiệm AR.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Product Title & Brand */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{name}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
        {attributes?.brand && (
          <Badge variant="outline" className="mt-2">
            {attributes.brand}
          </Badge>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center">{renderStars(rating.average)}</div>
        <span className="text-sm text-muted-foreground">
          {rating.average.toFixed(1)} ({rating.count} đánh giá)
        </span>
      </div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          {salePrice && salePrice < price ? (
            <>
              <span className="text-2xl font-bold text-[#8BC34A]">
                {formatCurrency(salePrice)}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
              {discountPercentage && (
                <Badge variant="destructive">-{discountPercentage}%</Badge>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold text-[#8BC34A]">
              {formatCurrency(price)}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Attributes */}
      {attributes && (
        <Card className="p-4 space-y-3">
          {attributes.volume && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Dung tích:</span>
              <span className="text-sm">{attributes.volume}</span>
            </div>
          )}

          {attributes.spf && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Chỉ số SPF:</span>
              <span className="text-sm">{attributes.spf}</span>
            </div>
          )}

          {attributes.material && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Chất liệu:</span>
              <span className="text-sm">{attributes.material}</span>
            </div>
          )}

          {attributes.color && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Màu sắc:</span>
              <span className="text-sm">
                {Array.isArray(attributes.color)
                  ? attributes.color.join(", ")
                  : attributes.color}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Số lượng:</label>
        <div className="flex items-center space-x-3">
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= stock) {
                  setQuantity(val);
                }
              }}
              className="w-12 text-center border-0 focus:outline-none text-sm"
              min="1"
              max={stock}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={increaseQuantity}
              disabled={quantity >= stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Còn lại: {stock} sản phẩm
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          className="w-full bg-[#8BC34A] hover:bg-[#7AB23C] text-white"
          size="lg"
          onClick={handleBuyNow}
          disabled={stock === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Mua hàng
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            Thêm vào giỏ
          </Button>
          <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} title={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'} />
          {isARSupportedSlug(slug) && (
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); handleARClick(e); }}
              title="Trải nghiệm AR"
              className="w-10 h-9 flex items-center justify-center rounded-md"
            >
              <RectangleGoggles className="w-4 h-4" />
            </Button>
          )}

          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Shipping & Returns */}
      <Card className="p-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Vận chuyển & Đổi trả</span>
        </div>
        <div className="text-muted-foreground space-y-1">
          <p>• Miễn phí vận chuyển cho đơn hàng trên 500.000đ</p>
          <p>• Đổi trả miễn phí trong 30 ngày</p>
          <p>• Giao hàng nhanh 2-3 ngày</p>
        </div>
      </Card>
    </div>
  );
};

export default ProductInfo;
