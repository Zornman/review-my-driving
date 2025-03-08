import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
        return this.http.get<Product[]>(environment.apiBaseUrl + '/fetchProducts');
    }

    getProduct(productId: string): Observable<Product> {
        return this.http.get<Product>(environment.apiBaseUrl + '/getProduct?id=' + productId);
    }

    getPrintifyOrder(orderId: string): Observable<any> {
        return this.http.get(environment.apiBaseUrl + '/getPrintifyOrderDetails?id=' + orderId);
    }

    createCustomPrintifyProduct(data: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/createCustomProduct', data);
    }

    createPrintifyOrder(orderData: any): Observable<any> {
        return this.http.post<{ success: boolean; orderId: string }>(environment.apiBaseUrl + '/createPrintifyOrder', orderData);
    }
}
