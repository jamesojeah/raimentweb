export interface ProductMedia {
  type: string;
  url: string;
}

export const QUALITY_TIERS = ["Original", "AAA", "Mirror", "Replica"] as const;
export type QualityTier = (typeof QUALITY_TIERS)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  additionalMedia: ProductMedia[];
  category: string;
  inStock: boolean;
  stockQuantity?: number;
  tags: string[];
  brand?: string;
  qualityTier?: QualityTier;
  archived?: boolean;
  createdAt?: number;
}

export type CartItem = Product & { quantity: number };
