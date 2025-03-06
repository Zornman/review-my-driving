import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BackgroundService {
    constructor(private http: HttpClient) {}

    updateOrderDetails(): Observable<any> {
        return this.http.post('/.netlify/functions/updateOrderStatus', {});
    }
}