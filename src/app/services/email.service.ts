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
        return this.http.post(environment.apiBaseUrl + '/sendEmail', formData);
    }

    sendContactEmail(formData: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/sendContactEmail', formData);
    }

    sendOrderConfirmationEmail(formData: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/sendOrderConfirmationEmail', formData);
    }
}