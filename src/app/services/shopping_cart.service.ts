import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { isPlatformBrowser } from '@angular/common';
import { CartItem } from '../shared/models/cartItem';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartKey = 'shoppingCart';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getCart());
  cart$ = this.cartSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Emit the initial cart state
    this.cartSubject.next(this.getCart());
  }

  /**
   * Add an item to the cart
   */
  addToCart(item: CartItem): void {
    const cart = this.getCart();

    const existingItem = cart.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
    this.cartSubject.next(cart);
  }

  /**
   * Update quantity for an item in the cart
   */
  updateCartItem(item: CartItem, qty: number) {
    const cart = this.getCart();

    const existingItem = cart.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItem) {
      existingItem.quantity = qty;
    }

    this.saveCart(cart);
    this.cartSubject.next(cart);
  }

  /**
   * Remove an item from the cart
   */
  removeFromCart(productId: string, variantId: number): void {
    let cart = this.getCart();
    cart = cart.filter(
      (item) => item.productId !== productId || item.variantId !== variantId
    );

    this.saveCart(cart);
    this.cartSubject.next(cart);
  }

  /**
   * Retrieve the cart items
   */
  getCart(): CartItem[] {
    if (isPlatformBrowser(this.platformId)) {
      const cartJson = localStorage.getItem(this.cartKey);
      return cartJson ? JSON.parse(cartJson) : [];
    }
    return [];
  }

  /**
   * Clear the entire cart
   */
  clearCart(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.cartKey);
      this.cartSubject.next([]);
    }
  }

  /**
   * Save the cart to localStorage
   */
  private saveCart(cart: CartItem[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.cartKey, JSON.stringify(cart));
    }
  }
}