import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from '../shared/modals/confirm-dialog/confirm-dialog.component';
import { loadStripe } from '@stripe/stripe-js';
let CartOverviewComponent = class CartOverviewComponent {
    cartService;
    router;
    dialog;
    stripeService;
    cdr;
    cartSubscription;
    displayedColumns = ['image', 'productName', 'quantity', 'price', 'totalCost', 'actions'];
    cartItems = [];
    cartSummary = [];
    dataSource;
    totalCartQuantity = 0;
    totalCartCost = 0;
    quantities = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, 3, ..., 10]
    cartItemArray;
    constructor(cartService, router, dialog, stripeService, cdr) {
        this.cartService = cartService;
        this.router = router;
        this.dialog = dialog;
        this.stripeService = stripeService;
        this.cdr = cdr;
    }
    ngOnInit() {
        this.loadCart();
    }
    continueShopping() {
        this.router.navigateByUrl('/shop');
    }
    checkout() {
        this.router.navigate(['/checkout'], { state: { cartSummary: this.cartSummary } });
    }
    createCheckoutSession() {
        this.cartItemArray = [];
        this.cartSummary.forEach((item) => this.cartItemArray.push({ productName: item.productName, quantity: item.quantity, price: item.price }));
        this.stripeService.createStripeCheckout(this.cartItemArray).subscribe(async (res) => {
            const stripe = await loadStripe('pk_test_51Qmnk12KeQqbDqTp84aakGQdasoxAei93E0X8RQ0WcJvnhSmGISShHFzOyUJ3IbxYGIvK2kEDPPiNgiwdADPiBwS00kE1aqBwL');
            if (res.sessionId && stripe) {
                stripe.redirectToCheckout({ sessionId: res.sessionId });
            }
        });
    }
    loadCart() {
        // Subscribe to cart changes
        this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
            this.cartSummary = [];
            this.updateCart(cart);
            this.cartItems = cart;
            this.dataSource = new MatTableDataSource(this.cartSummary);
        });
    }
    ngOnDestroy() {
        // Unsubscribe to avoid memory leaks
        if (this.cartSubscription) {
            this.cartSubscription.unsubscribe();
        }
    }
    updateCart(cartItems) {
        cartItems.forEach((item) => {
            const variant = item.product.variants.find(v => v.id === item.variantId);
            if (variant) {
                const variantPrice = variant?.price || 0;
                this.totalCartQuantity += item.quantity;
                const cartItem = {
                    productId: item.productId,
                    variantId: variant?.id,
                    productName: item.product.title.split('-')[0],
                    variantName: variant?.title,
                    quantity: item.quantity,
                    price: variantPrice,
                    totalCost: (item.quantity * variantPrice),
                    uid: (item.productId + "_" + item.variantId.toString() + "_" + item.quantity.toString() + "_" + Math.random()),
                    product: item.product
                };
                this.cartSummary.push(cartItem);
            }
        });
        this.calculateCartTotal();
    }
    clearCart() {
        this.cartService.clearCart();
        this.cartSummary = [];
        this.dataSource = new MatTableDataSource();
    }
    updateQuantity(event, product) {
        const qty = event.value;
        const cartItem = this.cartItems.filter((x) => x.productId === product.productId && x.variantId === product.variantId)[0];
        this.cartService.updateCartItem(cartItem, qty);
        product.quantity = qty;
        if (product.price)
            product.totalCost = (qty * product.price);
        this.calculateCartTotal();
    }
    removeProduct(product) {
        this.showConfirmationDialog().afterClosed().subscribe((result) => {
            if (result) {
                const index = this.cartSummary.findIndex((item) => item === product);
                if (index > -1) {
                    this.cartService.removeFromCart(product.productId, product.variantId);
                    this.loadCart();
                    this.cdr.detectChanges();
                }
            }
            else {
                console.log('User canceled action ❌');
            }
        });
    }
    showConfirmationDialog() {
        return this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            disableClose: true,
            data: {
                title: 'Remove from Cart?',
                message: 'Are you sure you want to remove this item from your cart?',
                confirmText: 'Yes, Remove',
                cancelText: 'Cancel'
            }
        });
    }
    calculateCartTotal() {
        this.totalCartCost = 0;
        this.totalCartQuantity = 0;
        this.cartSummary.forEach((cartItem) => {
            this.totalCartCost += cartItem.totalCost;
            this.totalCartQuantity += cartItem.quantity;
        });
    }
};
CartOverviewComponent = __decorate([
    Component({
        selector: 'app-cart-overview',
        imports: [
            CommonModule,
            FormsModule,
            RouterModule,
            MatTableModule,
            MatIconModule,
            MatFormFieldModule,
            MatInputModule,
            MatButtonModule,
            MatSelectModule,
        ],
        templateUrl: './cart-overview.component.html',
        styleUrl: './cart-overview.component.scss'
    })
], CartOverviewComponent);
export { CartOverviewComponent };
