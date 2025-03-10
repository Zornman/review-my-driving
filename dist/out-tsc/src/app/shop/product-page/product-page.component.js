import { __decorate } from "tslib";
import { Component, inject } from '@angular/core';
import { Product } from '../../shared/models/product';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CarouselComponent } from '../carousel/carousel.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SignUpDialogComponent } from '../../shared/modals/sign-up-dialog/sign-up-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
let ProductPageComponent = class ProductPageComponent {
    route;
    router;
    sanitizer;
    cartService;
    authService;
    dialog;
    qrCodeService;
    printifyService;
    dbService;
    _snackBar = inject(MatSnackBar);
    product;
    product_custom;
    productDescription;
    productImages = [];
    productVariants = [];
    loading = true;
    selectedVariant;
    quantity;
    quantities = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, 3, ..., 10]
    user;
    imageFile;
    disableAdd = false;
    constructor(route, router, sanitizer, cartService, authService, dialog, qrCodeService, printifyService, dbService) {
        this.route = route;
        this.router = router;
        this.sanitizer = sanitizer;
        this.cartService = cartService;
        this.authService = authService;
        this.dialog = dialog;
        this.qrCodeService = qrCodeService;
        this.printifyService = printifyService;
        this.dbService = dbService;
        this.authService.getUser().subscribe((user) => {
            this.user = user;
        });
    }
    ngOnInit() {
        // Attempt to retrieve the product from the router's state
        const navigation = this.router.getCurrentNavigation();
        this.product = navigation?.extras.state?.['product'] || null;
        // If no product is found in state, handle it (e.g., from direct URL access)
        if (!this.product) {
            this._snackBar.open('Loading product details...');
            const productId = this.route.snapshot.paramMap.get('id');
            if (productId) {
                this.printifyService.getProduct(productId).subscribe({
                    next: (response) => {
                        this.product = response;
                        this.productImages = this.product.images;
                        this.productVariants = this.product.variants.filter((variant) => variant.is_enabled);
                        this.productDescription = this.sanitizer.bypassSecurityTrustHtml(this.product.description);
                        this._snackBar.open('Product details loaded!', 'Ok', { duration: 3000 });
                        this._snackBar.dismiss();
                    },
                    error: (error) => {
                        this._snackBar.open('Error loading product details, please try again.', 'Ok', { duration: 3000 });
                        this.dbService.insertErrorLog(JSON.stringify({
                            fileName: 'product-page.component.ts',
                            method: 'ngOnInit()',
                            timestamp: new Date().toString(),
                            error: error
                        })).subscribe({
                            next: (response) => {
                                console.log(response);
                            },
                            error: (error) => {
                            }
                        });
                    },
                });
            }
            else {
                console.error('No product ID provided.');
            }
        }
    }
    isAddDisabled() {
        if (this.selectedVariant === undefined || this.quantity === undefined)
            return true;
        return false;
    }
    backToShop() {
        this.router.navigateByUrl('/shop');
    }
    async addToCart() {
        // Make sure the user is logged in before adding the product to the cart
        if (this.user) {
            await this.checkForExistingProduct();
        }
        else {
            this.openSignUpDialog();
        }
    }
    async checkForExistingProduct() {
        this._snackBar.open("Adding product to your cart...");
        this.disableAdd = true;
        await this.printifyService.getProducts().subscribe({
            next: (response) => {
                let products = response.data.map((item) => {
                    return new Product(item);
                });
                if (this.user) {
                    const uid = this.user ? this.user.uid : '';
                    products = products.filter((x) => x.title.includes(uid) && x.title.includes(this.product.title));
                    if (products.length > 0) {
                        this.cartService.addToCart({
                            productId: products[0].id,
                            variantId: this.selectedVariant,
                            quantity: this.quantity,
                            product: products[0]
                        });
                        this._snackBar.open("Product added to cart!", "Ok", { duration: 3000 });
                        this.disableAdd = false;
                    }
                    else {
                        this.createNewProduct();
                    }
                }
            },
            error: (error) => {
                this.dbService.insertErrorLog(JSON.stringify({
                    fileName: 'product-page.component.ts',
                    method: 'checkForExistingProduct()',
                    timestamp: new Date().toString(),
                    error: error
                })).subscribe({
                    next: (response) => {
                        console.log(response);
                    },
                    error: (error) => {
                    }
                });
                this.disableAdd = false;
            }
        });
    }
    async createNewProduct() {
        let qr_code;
        await this.qrCodeService.generateQRCode().then((base64) => {
            qr_code = base64;
            qr_code = qr_code.substring(22, base64.length);
            //console.log(this.user?.uid);
            this.printifyService.createCustomPrintifyProduct({ base64QRCode: qr_code, originalProductId: this.product.id, userID: this.user?.uid }).subscribe({
                next: (response) => {
                    //console.log(response);
                    this.cartService.addToCart({
                        productId: response.product.id,
                        variantId: this.selectedVariant,
                        quantity: this.quantity,
                        product: response.product
                    });
                    this._snackBar.open("Product added to cart!", "Ok", { duration: 3000 });
                    this.disableAdd = false;
                },
                error: (error) => {
                    this.dbService.insertErrorLog(JSON.stringify({
                        fileName: 'product-page.component.ts',
                        method: 'createNewProduct()',
                        timestamp: new Date().toString(),
                        error: error
                    })).subscribe({
                        next: (response) => {
                            console.log(response);
                        },
                        error: (error) => {
                        }
                    });
                    this.disableAdd = false;
                }
            });
        });
    }
    openSignUpDialog() {
        this.dialog.open(SignUpDialogComponent, {
            width: '400px', // Optional: Adjust dialog width
            disableClose: true // Optional: Prevent closing the dialog by clicking outside
        });
    }
};
ProductPageComponent = __decorate([
    Component({
        selector: 'app-product-page',
        imports: [CommonModule, HttpClientModule, FormsModule, CarouselComponent, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule],
        templateUrl: './product-page.component.html',
        styleUrl: './product-page.component.scss'
    })
], ProductPageComponent);
export { ProductPageComponent };
