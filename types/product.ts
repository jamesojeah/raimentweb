export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  inStock: boolean;
  stockQuantity?: number;
  tags: string[];
}

export type CartItem = Product & { quantity: number };
