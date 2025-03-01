import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    constructor(private http: HttpClient) {}

    sendSubmissionEmail(formData: any): Observable<any> {
        return this.http.post('/.netlify/functions/sendEmail', formData);
    }

    sendContactEmail(formData: any): Observable<any> {
        return this.http.post('/.netlify/functions/sendContactEmail', formData);
    }
}