import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ShopComponent } from './shop/shop.component';
import { RegisterComponent } from './register/register.component';
import { ProductPageComponent } from './shop/product-page/product-page.component';
import { CartOverviewComponent } from './cart-overview/cart-overview.component';
import { LoginComponent } from './login/login.component';
import { AccountOverviewComponent } from './account-overview/account-overview.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { IndexComponent } from './index/index.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

export const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'index', component: IndexComponent },
    { path: 'home', component: HomeComponent },
    { path: 'shop', component: ShopComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'product/:id', component: ProductPageComponent },
    { path: 'cart', component: CartOverviewComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'orderConfirmation/:id', component: OrderConfirmationComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'account', component: AccountOverviewComponent },
    { path: 'settings', component: AccountSettingsComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: '**', redirectTo: '/login' }, // Redirect unknown routes
];
