import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
let MongoService = class MongoService {
    http;
    constructor(http) {
        this.http = http;
    }
    getUserSubmissions(token) {
        const url = this.getFunctionUrl("getSubmissionsByUser");
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(url, { params });
    }
    /**
     * Get user shipping info by UserID
     * @param token = UserID
     * @returns ShippingInfo object
     */
    getUserShippingInfo(token) {
        const url = this.getFunctionUrl("getUserShipping");
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(url, { headers, params });
    }
    getUserOrderHistory(token) {
        const url = this.getFunctionUrl("getUserOrderHistory");
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(url, { params });
    }
    getUserSettings(token) {
        const url = this.getFunctionUrl("getUserSettings");
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(url, { params });
    }
    /**
     * Inserts or updates a record in the user_shipping_info table
     * @param shippingInfo
     * @returns
     */
    insertUserShippingInfo(shippingInfo) {
        const url = this.getFunctionUrl("insertUserShipping");
        return this.http.post(url, shippingInfo);
    }
    insertUserSettings(data) {
        const url = this.getFunctionUrl("insertUserSettings");
        return this.http.post(url, data);
    }
    /**
     * Inserts or updates a record in the user_order_history table
     * @param data
     * @returns
     */
    insertUserOrderHistoryRecord(data) {
        const url = this.getFunctionUrl("insertUserOrder");
        return this.http.post(url, data);
    }
    insertSubmission(formData) {
        const url = this.getFunctionUrl("insertSubmission");
        return this.http.post(url, formData);
    }
    insertErrorLog(data) {
        const url = this.getFunctionUrl("logError");
        return this.http.post(url, data);
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
MongoService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], MongoService);
export { MongoService };
