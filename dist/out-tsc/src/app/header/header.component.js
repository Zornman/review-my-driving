import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
let HeaderComponent = class HeaderComponent {
    cartService;
    router;
    authService;
    themeService;
    cartQuantity;
    cartSubscription;
    user;
    isDarkMode;
    constructor(cartService, router, authService, themeService) {
        this.cartService = cartService;
        this.router = router;
        this.authService = authService;
        this.themeService = themeService;
        this.authService.getUser().subscribe((user) => {
            this.user = user;
        });
        this.isDarkMode = this.themeService.getIsDarkMode();
    }
    ngOnInit() {
        // Subscribe to cart changes
        this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
            this.cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
        });
    }
    ngOnDestroy() {
        // Unsubscribe to avoid memory leaks
        if (this.cartSubscription) {
            this.cartSubscription.unsubscribe();
        }
    }
    onToggleDarkMode(event) {
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
        this.router.navigateByUrl('/index');
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
};
HeaderComponent = __decorate([
    Component({
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
], HeaderComponent);
export { HeaderComponent };
