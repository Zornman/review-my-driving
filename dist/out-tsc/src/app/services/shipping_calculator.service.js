import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
let ShippingCalculatorService = class ShippingCalculatorService {
    http;
    constructor(http) {
        this.http = http;
    }
    getAvailableShippingOptions(blueprint_id, print_provider_id) {
        const url = this.getFunctionUrl("getShippingOptions");
        const params = new HttpParams()
            .set("blueprint_id", blueprint_id.toString())
            .set("print_provider_id", print_provider_id.toString());
        return this.http.get(url, { params });
    }
    getShippingCosts(blueprint_id, print_provider_id, shipping_type) {
        const url = this.getFunctionUrl("getShippingRates");
        const params = new HttpParams()
            .set("blueprint_id", blueprint_id.toString())
            .set("print_provider_id", print_provider_id.toString())
            .set("shipping_type", shipping_type);
        return this.http.get(url, { params });
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
ShippingCalculatorService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], ShippingCalculatorService);
export { ShippingCalculatorService };
