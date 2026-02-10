import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { User } from 'firebase/auth';

import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/shopping_cart.service';
import { ThemeService } from '../services/theme.service';

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
  cartQuantity = 0;
  isDarkMode = false;
  private cartSubscription!: Subscription;

  readonly adminUserId = environment.adminUserId;
  readonly user$: ReturnType<typeof this.authService.getUser>;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly themeService: ThemeService
  ) {
    this.isDarkMode = this.themeService.getIsDarkMode();
    this.user$ = this.authService.getUser(); // Observable<User | null>
  }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
      this.cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
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
}
