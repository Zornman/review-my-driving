import { Product } from "./product";

export interface CartItem {
  productId: string;
  variantId: number;
  quantity: number;
  product: Product;
}