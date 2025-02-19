import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CartService } from '../services/shopping_cart.service';
import { CartItem } from '../shared/models/cartItem';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CartSummary } from '../shared/models/cartSummary';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/modals/confirm-dialog/confirm-dialog.component';
import { StripeService } from '../services/stripe.service';
import { loadStripe } from '@stripe/stripe-js';

@Component({
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
export class CartOverviewComponent implements OnInit, OnDestroy {
  private cartSubscription!: Subscription;
  displayedColumns: string[] = [ 'image', 'productName', 'quantity', 'price', 'totalCost', 'actions'];
  cartItems: CartItem[] = [];
  cartSummary: CartSummary[] = [];
  dataSource!: MatTableDataSource<CartSummary>;
  totalCartQuantity: number = 0;
  totalCartCost: number = 0;
  quantities: number[] = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, 3, ..., 10]
  cartItemArray!: Array<any>;

  constructor(private cartService: CartService, private router: Router, private dialog: MatDialog, private stripeService: StripeService) {
  }

  ngOnInit(): void {
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

    this.cartSummary.forEach((item) => this.cartItemArray.push({productName: item.productName, quantity: item.quantity, price: item.price}));

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

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  updateCart(cartItems: CartItem[]) {
    cartItems.forEach((item) => {
      const variant = item.product.variants.find(v => v.id === item.variantId);

      if (variant) {
        const variantPrice = variant?.price || 0;

        this.totalCartQuantity += item.quantity;

        const cartItem: CartSummary = {
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

      this.calculateCartTotal();
    });
  }

  clearCart() {
    this.cartService.clearCart();
    this.cartSummary = [];
    this.dataSource = new MatTableDataSource();
  }

  updateQuantity(event: any, product: CartSummary) {
    const qty = event.value;
    const cartItem = this.cartItems.filter((x) => x.productId === product.productId && x.variantId === product.variantId)[0];

    this.cartService.updateCartItem(cartItem, qty);

    product.quantity = qty;
    if (product.price)
      product.totalCost = (qty * product.price);

    this.calculateCartTotal();
  }

  removeProduct(product: CartSummary) {
    this.showConfirmationDialog().afterClosed().subscribe((result: any) => {
      if (result) {
        let index = this.cartSummary.findIndex((item) => item === product);

        this.cartService.removeFromCart(product.productId, product.variantId);
    
        this.cartSummary = this.cartSummary.splice(index, 1);
        this.dataSource = new MatTableDataSource(this.cartSummary);
        this.calculateCartTotal();
      } else {
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
}