import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
let BackgroundService = class BackgroundService {
    http;
    constructor(http) {
        this.http = http;
    }
    updateOrderDetails() {
        const url = this.getFunctionUrl("updateOrderStatus");
        return this.http.post(url, {});
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
BackgroundService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], BackgroundService);
export { BackgroundService };
