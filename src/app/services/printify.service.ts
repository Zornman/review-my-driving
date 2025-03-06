import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../shared/models/product';
import { VariablesService } from './variables.service';

@Injectable({
    providedIn: 'root'
})
export class PrintifyService {
    private apiUrl = '';
    private apiToken = '';

    constructor(private http: HttpClient, private env: VariablesService) {
        this.env.getEnvironmentVariables().subscribe({
            next: (variables) => {
                this.apiUrl = variables.PRINTIFY_URL;
                this.apiToken = variables.PRINTIFY_API_KEY;
            },
            error: (error: any) => {

            }
        });
    }

    getShops(): Observable<any> {
        const headers = new HttpHeaders({
        Authorization: `Bearer ${this.apiToken}`,
        });
        return this.http.get(`${this.apiUrl}/shops.json`, { headers });
    }

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>('/.netlify/functions/fetchProducts');
    }

    getProduct(productId: string): Observable<Product> {
        return this.http.get<Product>('/.netlify/functions/getProduct?id=' + productId);
    }

    getPrintifyOrder(orderId: string): Observable<any> {
        return this.http.get('/.netlify/functions/getPrintifyOrderDetails?id=' + orderId);
    }

    createCustomPrintifyProduct(data: any): Observable<any> {
        return this.http.post('/.netlify/functions/createCustomProduct', data);
    }

    createPrintifyOrder(orderData: any): Observable<any> {
        return this.http.post<{ success: boolean; orderId: string }>('/.netlify/functions/createPrintifyOrder', orderData);
    }
}
