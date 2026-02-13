import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ShopComponent } from './shop/shop.component';
import { RegisterComponent } from './register/register.component';
import { CartOverviewComponent } from './cart-overview/cart-overview.component';
import { LoginComponent } from './login/login.component';
import { AccountOverviewComponent } from './account-overview/account-overview.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { IndexComponent } from './index/index.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AdminFunctionsComponent } from './admin/admin-functions/admin-functions.component';
import { DailyReportComponent } from './daily-report/daily-report.component';
import { ProductsAndServicesComponent } from './products-and-services/products-and-services.component';

export const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'index', component: IndexComponent },
    { path: 'home', component: HomeComponent },
    { path: 'shop', component: ShopComponent },
    { path: 'services', component: ProductsAndServicesComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'register/:uniqueId', component: RegisterComponent },
    { path: 'product/:id', loadComponent: () => import('./shop/product-page/product-page.component').then(m => m.ProductPageComponent) },
    { path: 'cart', component: CartOverviewComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'orderConfirmation/:id', loadComponent: () => import('./order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent) },
    { path: 'login', component: LoginComponent },
    { path: 'resetPassword', component: ResetPasswordComponent },
    { path: 'account', component: AccountOverviewComponent },
    { path: 'settings', component: AccountSettingsComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'admin-functions', component: AdminFunctionsComponent },
    { path: 'daily-report', component: DailyReportComponent },
    { path: '**', redirectTo: '/index' }
];