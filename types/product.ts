export interface ProductMedia {
  type: string;
  url: string;
}

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
}

export type CartItem = Product & { quantity: number };
