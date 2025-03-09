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
        const url = this.getFunctionUrl("server");
        return this.http.post<{ clientSecret: string }>(url, { amount: amt })
    }

    createStripeCheckout(data: any): Observable<any> {
        const url = this.getFunctionUrl("createStripeCheckout");
        return this.http.post(url, { items: data });
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}