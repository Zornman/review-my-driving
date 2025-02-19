import { Product } from "./product";

export interface CartSummary {
    productId: string;
    variantId: number;
    productName: string;
    variantName: string | undefined;
    quantity: number;
    price: number | undefined;
    totalCost: number;
    uid: string;
    product: Product;
}