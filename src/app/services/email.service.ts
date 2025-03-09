import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    constructor(private http: HttpClient) {}

    sendSubmissionEmail(formData: any): Observable<any> {
        const url = this.getFunctionUrl("sendEmail");
        return this.http.post(url, formData);
    }

    sendContactEmail(formData: any): Observable<any> {
        const url = this.getFunctionUrl("sendContactEmail");
        return this.http.post(url, formData);
    }

    sendOrderConfirmationEmail(formData: any): Observable<any> {
        const url = this.getFunctionUrl("sendOrderConfirmationEmail");
        return this.http.post(url, formData);
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}