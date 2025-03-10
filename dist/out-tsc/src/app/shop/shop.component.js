import { __decorate, __param } from "tslib";
import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Product } from '../shared/models/product';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
let ShopComponent = class ShopComponent {
    platformId;
    router;
    printifyService;
    dbService;
    products = [];
    showReadMore = true;
    constructor(platformId, router, printifyService, dbService) {
        this.platformId = platformId;
        this.router = router;
        this.printifyService = printifyService;
        this.dbService = dbService;
    }
    ngOnInit() {
        let cachedProducts = null;
        if (isPlatformBrowser(this.platformId)) {
            cachedProducts = localStorage?.getItem('products');
        }
        if (!cachedProducts) {
            this.printifyService.getProducts().subscribe({
                next: (response) => {
                    this.products = response.data.map((item) => {
                        return new Product(item);
                    });
                    this.products = this.products.filter(x => x.visible);
                    if (isPlatformBrowser(this.platformId)) {
                        localStorage.setItem('products', JSON.stringify(this.products));
                    }
                },
                error: (error) => {
                    this.dbService.insertErrorLog(JSON.stringify({
                        fileName: 'shop.component.ts',
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
            this.products = JSON.parse(cachedProducts);
        }
    }
    viewProduct(product) {
        this.router.navigate(['/product', product.id]);
    }
};
ShopComponent = __decorate([
    Component({
        selector: 'app-shop',
        imports: [HttpClientModule, CommonModule, MatCardModule, MatButtonModule, RouterModule],
        templateUrl: './shop.component.html',
        styleUrl: './shop.component.scss'
    }),
    __param(0, Inject(PLATFORM_ID))
], ShopComponent);
export { ShopComponent };
