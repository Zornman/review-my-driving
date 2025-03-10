import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
let StripeService = class StripeService {
    http;
    constructor(http) {
        this.http = http;
    }
    fetchClientSecret(amt) {
        const url = this.getFunctionUrl("createStripePaymentIntent");
        return this.http.post(url, { amount: amt });
    }
    createStripeCheckout(data) {
        const url = this.getFunctionUrl("createStripeCheckout");
        return this.http.post(url, { items: data });
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
StripeService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], StripeService);
export { StripeService };
