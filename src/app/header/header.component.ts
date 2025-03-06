import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/shopping_cart.service';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { ThemeService } from '../services/theme.service';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-header',
  imports: [ 
    CommonModule,
    FormsModule,
    MatBadgeModule, 
    MatCheckboxModule,
    MatIconModule, 
    MatButtonModule, 
    RouterModule, 
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartQuantity!: number;
  private cartSubscription!: Subscription;
  user!: User | null;
  isDarkMode!: boolean;

  constructor(private cartService: CartService, private router: Router, private authService: AuthService, private themeService: ThemeService) {
    this.authService.getUser().subscribe((user) => {
      this.user = user;
    });

    this.isDarkMode = this.themeService.getIsDarkMode();
  }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
      this.cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  onToggleDarkMode(event: MatCheckboxChange) {
    this.isDarkMode = event.checked;
    this.themeService.toggleTheme(this.isDarkMode);
  }

  signInWithGoogle() {
    this.authService.googleSignIn();
  }

  signOut() {
    this.authService.signOut();
    this.cartService.clearCart();
  }

  openHome() {
    this.router.navigateByUrl('/index')
  }

  openShop() {
    this.router.navigateByUrl('/shop');
  }

  viewAccount() {
    this.router.navigateByUrl('/account');
  }

  viewSettings() {
    this.router.navigateByUrl('/settings');
  }

  reviewCart() {
    this.router.navigateByUrl('/cart');
  }

  registerationPage() {
    this.router.navigateByUrl('/register');
  }

  loginPage() {
    this.router.navigateByUrl('/login');
  }

  aboutPage() {
    this.router.navigateByUrl('/about');
  }

  contactPage() {
    this.router.navigateByUrl('/contact');
  }
}
