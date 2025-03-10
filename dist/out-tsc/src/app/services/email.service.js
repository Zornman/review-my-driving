import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
let EmailService = class EmailService {
    http;
    constructor(http) {
        this.http = http;
    }
    sendSubmissionEmail(formData) {
        const url = this.getFunctionUrl("sendEmail");
        return this.http.post(url, formData);
    }
    sendContactEmail(formData) {
        const url = this.getFunctionUrl("sendContactEmail");
        return this.http.post(url, formData);
    }
    sendOrderConfirmationEmail(formData) {
        const url = this.getFunctionUrl("sendOrderConfirmationEmail");
        return this.http.post(url, formData);
    }
    getFunctionUrl(functionName) {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
};
EmailService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], EmailService);
export { EmailService };
