import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BackgroundService {
    constructor(private http: HttpClient) {}

    updateOrderDetails(): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/updateOrderStatus', {});
    }
}