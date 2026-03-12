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
    {
        path: '',
        component: IndexComponent,
        title: 'Review My Driving | Home',
        data: {
            description: 'Review My Driving helps drivers and businesses with driving services, products, and support resources.'
        }
    },

    // Redirect legacy /index to /
    { path: 'index', redirectTo: '', pathMatch: 'full' },

    {
        path: 'home',
        component: HomeComponent,
        title: 'Review My Driving | Home',
        data: {
            description: 'Explore Review My Driving services, resources, and updates for drivers and transportation businesses.'
        }
    },
    {
        path: 'shop',
        component: ShopComponent,
        title: 'Review My Driving | Shop',
        data: {
            description: 'Shop products and tools from Review My Driving for drivers and businesses.'
        }
    },
    {
        path: 'services',
        component: ProductsAndServicesComponent,
        title: 'Review My Driving | Products & Services',
        data: {
            description: 'Browse Review My Driving products and services designed for drivers and fleet operations.'
        }
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'Review My Driving | Register',
        data: {
            description: 'Create your Review My Driving account to access services and business tools.',
            noindex: true
        }
    },
    {
        path: 'register/:uniqueId',
        component: RegisterComponent,
        title: 'Review My Driving | Register',
        data: {
            description: 'Complete your Review My Driving registration.',
            noindex: true
        }
    },
    {
        path: 'product/:id',
        loadComponent: () => import('./shop/product-page/product-page.component').then(m => m.ProductPageComponent),
        title: 'Review My Driving | Product',
        data: {
            description: 'View product details from Review My Driving.'
        }
    },
    {
        path: 'cart',
        component: CartOverviewComponent,
        title: 'Review My Driving | Cart',
        data: {
            description: 'Review selected items in your cart.',
            noindex: true
        }
    },
    {
        path: 'checkout',
        component: CheckoutComponent,
        title: 'Review My Driving | Checkout',
        data: {
            description: 'Complete your order securely with Review My Driving.',
            noindex: true
        }
    },
    {
        path: 'orderConfirmation/:id',
        loadComponent: () => import('./order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
        title: 'Review My Driving | Order Confirmation',
        data: {
            description: 'Order confirmation details from Review My Driving.',
            noindex: true
        }
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Review My Driving | Login',
        data: {
            description: 'Sign in to your Review My Driving account.',
            noindex: true
        }
    },
    {
        path: 'resetPassword',
        component: ResetPasswordComponent,
        title: 'Review My Driving | Reset Password',
        data: {
            description: 'Reset your Review My Driving account password.',
            noindex: true
        }
    },
    {
        path: 'account',
        component: AccountOverviewComponent,
        title: 'Review My Driving | Account Overview',
        data: {
            description: 'Manage your Review My Driving account overview.',
            noindex: true
        }
    },
    {
        path: 'settings',
        component: AccountSettingsComponent,
        title: 'Review My Driving | Account Settings',
        data: {
            description: 'Update your Review My Driving account settings.',
            noindex: true
        }
    },
    {
        path: 'about',
        component: AboutComponent,
        title: 'Review My Driving | About',
        data: {
            description: 'Learn about Review My Driving and how we support drivers and transportation businesses.'
        }
    },
    {
        path: 'contact',
        component: ContactComponent,
        title: 'Review My Driving | Contact',
        data: {
            description: 'Contact Review My Driving for support, service questions, or business inquiries.'
        }
    },
    {
        path: 'admin-functions',
        component: AdminFunctionsComponent,
        title: 'Review My Driving | Admin',
        data: {
            description: 'Administrative functions for Review My Driving.',
            noindex: true
        }
    },
    {
        path: 'daily-report',
        component: DailyReportComponent,
        title: 'Review My Driving | Daily Report',
        data: {
            description: 'Daily report tools for authorized users.',
            noindex: true
        }
    },

    // Fallback to /
    { path: '**', redirectTo: '' }
];