import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MongoService {

    constructor(private http: HttpClient) {

    }

    getUserSubmissions(token: string) {
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(environment.apiBaseUrl + '/getSubmissionsByUser', { params });
    }

    /**
     * Get user shipping info by UserID
     * @param token = UserID
     * @returns ShippingInfo object
     */
    getUserShippingInfo(token: string): Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(environment.apiBaseUrl + '/getUserShipping', { headers, params });
    }

    getUserOrderHistory(token: string) {
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(environment.apiBaseUrl + '/getUserOrderHistory', { params });
    }

    getUserSettings(token: string) {
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(environment.apiBaseUrl + '/getUserSettings', { params });
    }

    /**
     * Inserts or updates a record in the user_shipping_info table
     * @param shippingInfo 
     * @returns 
     */
    insertUserShippingInfo(shippingInfo: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/insertUserShipping', shippingInfo);
    }

    insertUserSettings(data: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/insertUserSettings', data);
    }

    /**
     * Inserts or updates a record in the user_order_history table
     * @param data 
     * @returns 
     */
    insertUserOrderHistoryRecord(data: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/insertUserOrder', data);
    }

    insertSubmission(formData: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/insertSubmission', formData);
    }

    insertErrorLog(data: any): Observable<any> {
        return this.http.post(environment.apiBaseUrl + '/logError', data);
    }
}