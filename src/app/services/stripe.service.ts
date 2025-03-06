import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StripeService {
    constructor(private http: HttpClient) {}

    fetchClientSecret(amt: number): Observable<any> {
        return this.http.post<{ clientSecret: string }>('/.netlify/functions/server', { amount: amt })
    }

    createStripeCheckout(data: any): Observable<any> {
        console.log(data);
        return this.http.post('/.netlify/functions/createStripeCheckout', { items: data });
    }
}