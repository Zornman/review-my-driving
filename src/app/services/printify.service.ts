import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../shared/models/product';

@Injectable({
    providedIn: 'root'
})
export class PrintifyService {
    private apiUrl = 'https://api.printify.com/v1';
    private apiToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjQxYWJjMGI5ODhmOTVhNjEyMTExNzA5NGZkYjlhODAxOGRkNTIxMjhjYzI1MTc2YzhmNjBhNmM2YzEwNDkyNDM3Y2VhNGM1YTRjMWZjYzJmIiwiaWF0IjoxNzM2MjEyMTEwLjM2NjgzNiwibmJmIjoxNzM2MjEyMTEwLjM2NjgzOCwiZXhwIjoxNzY3NzQ4MTEwLjM1OTY2NCwic3ViIjoiMjEzNDM2NjIiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.AcxgjzGsRQiW2PuzJMvZKq_66FKYx-t-TbiXck8xquhL__bQi-9npwHNZa18Vj2LQD_yyfxtkLk8datHXU0'; // Replace with your Printify API token

    constructor(private http: HttpClient) {}

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
