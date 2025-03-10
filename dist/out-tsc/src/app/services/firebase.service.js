import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
let FirebaseService = class FirebaseService {
    http;
    constructor(http) {
        this.http = http;
    }
    getUserByUID(userID) {
        const url = this.getFunctionUrl("getUserByUID");
        const params = new HttpParams().set('uid', userID);
        return this.http.get(url, { params });
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
FirebaseService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], FirebaseService);
export { FirebaseService };
