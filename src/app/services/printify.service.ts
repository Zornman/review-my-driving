import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../shared/models/product';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PrintifyService {

    constructor(private http: HttpClient) {
    }

    getProducts(): Observable<Product[]> {
        const url = this.getFunctionUrl("fetchProducts");
        return this.http.get<Product[]>(url);
    }

    getProduct(productId: string): Observable<Product> {
        const url = this.getFunctionUrl("getProduct");
        const params = new HttpParams().set('id', productId);
        return this.http.get<Product>(url, { params });
    }

    getPrintifyOrder(orderId: string): Observable<any> {
        const url = this.getFunctionUrl("getPrintifyOrderDetails");
        const params = new HttpParams().set('id', orderId);
        return this.http.get(url, { params });
    }

    createCustomPrintifyProduct(data: any): Observable<any> {
        const url = this.getFunctionUrl("createCustomProduct");
        return this.http.post(url, data);
    }

    createCustomBusinessPrintifyProduct(data: any): Observable<any> {
        const url = this.getFunctionUrl("createCustomBusinessProduct");
        return this.http.post(url, data);
    }

    createPrintifyOrder(orderData: any): Observable<any> {
        const url = this.getFunctionUrl("createPrintifyOrder");
        return this.http.post<{ success: boolean; orderId: string }>(url, orderData);
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}
