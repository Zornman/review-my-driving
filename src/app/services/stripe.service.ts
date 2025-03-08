import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StripeService {
    constructor(private http: HttpClient) {}

    fetchClientSecret(amt: number): Observable<any> {
        return this.http.post<{ clientSecret: string }>(environment.apiBaseUrl + '/server', { amount: amt })
    }

    createStripeCheckout(data: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/createStripeCheckout', { items: data });
    }
}