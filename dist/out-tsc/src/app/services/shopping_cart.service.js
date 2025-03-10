import { __decorate, __param } from "tslib";
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { isPlatformBrowser } from '@angular/common';
let CartService = class CartService {
    platformId;
    cartKey = 'shoppingCart';
    cartSubject = new BehaviorSubject(this.getCart());
    cart$ = this.cartSubject.asObservable();
    constructor(platformId) {
        this.platformId = platformId;
        // Emit the initial cart state
        this.cartSubject.next(this.getCart());
    }
    /**
     * Add an item to the cart
     */
    addToCart(item) {
        const cart = this.getCart();
        const existingItem = cart.find((i) => i.productId === item.productId && i.variantId === item.variantId);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        }
        else {
            cart.push(item);
        }
        this.saveCart(cart);
        this.cartSubject.next(cart);
    }
    /**
     * Update quantity for an item in the cart
     */
    updateCartItem(item, qty) {
        const cart = this.getCart();
        const existingItem = cart.find((i) => i.productId === item.productId && i.variantId === item.variantId);
        if (existingItem) {
            existingItem.quantity = qty;
        }
        this.saveCart(cart);
        this.cartSubject.next(cart);
    }
    /**
     * Remove an item from the cart
     */
    removeFromCart(productId, variantId) {
        let cart = this.getCart();
        cart = cart.filter((item) => item.productId !== productId || item.variantId !== variantId);
        this.saveCart(cart);
        this.cartSubject.next(cart);
    }
    /**
     * Retrieve the cart items
     */
    getCart() {
        if (isPlatformBrowser(this.platformId)) {
            const cartJson = localStorage.getItem(this.cartKey);
            return cartJson ? JSON.parse(cartJson) : [];
        }
        return [];
    }
    /**
     * Clear the entire cart
     */
    clearCart() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(this.cartKey);
            this.cartSubject.next([]);
        }
    }
    /**
     * Save the cart to localStorage
     */
    saveCart(cart) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.cartKey, JSON.stringify(cart));
        }
    }
};
CartService = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __param(0, Inject(PLATFORM_ID))
], CartService);
export { CartService };
