import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
let PrintifyService = class PrintifyService {
    http;
    constructor(http) {
        this.http = http;
    }
    getProducts() {
        const url = this.getFunctionUrl("fetchProducts");
        return this.http.get(url);
    }
    getProduct(productId) {
        const url = this.getFunctionUrl("getProduct");
        const params = new HttpParams().set('id', productId);
        return this.http.get(url, { params });
    }
    getPrintifyOrder(orderId) {
        const url = this.getFunctionUrl("getPrintifyOrderDetails");
        const params = new HttpParams().set('id', orderId);
        return this.http.get(url, { params });
    }
    createCustomPrintifyProduct(data) {
        const url = this.getFunctionUrl("createCustomProduct");
        return this.http.post(url, data);
    }
    createPrintifyOrder(orderData) {
        const url = this.getFunctionUrl("createPrintifyOrder");
        return this.http.post(url, orderData);
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
PrintifyService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], PrintifyService);
export { PrintifyService };
