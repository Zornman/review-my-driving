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
        const url = this.getFunctionUrl("getSubmissionsByUser");
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(url, { params });
    }

    /**
     * Get user shipping info by UserID
     * @param token = UserID
     * @returns ShippingInfo object
     */
    getUserShippingInfo(token: string): Observable<any> {
        const url = this.getFunctionUrl("getUserShipping");
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(url, { headers, params });
    }

    getUserOrderHistory(token: string) {
        const url = this.getFunctionUrl("getUserOrderHistory");
        const params = new HttpParams().set('userID', (token) ? token : '');
        return this.http.get(url, { params });
    }

    getUserSettings(token: string) {
        const url = this.getFunctionUrl("getUserSettings");
        const params = new HttpParams().set('userId', (token) ? token : '');
        return this.http.get(url, { params });
    }

    /**
     * Inserts or updates a record in the user_shipping_info table
     * @param shippingInfo 
     * @returns 
     */
    insertUserShippingInfo(shippingInfo: any): Observable<any> {
        const url = this.getFunctionUrl("insertUserShipping");
        return this.http.post(url, shippingInfo);
    }

    insertUserSettings(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertUserSettings");
        return this.http.post(url, data);
    }

    /**
     * Inserts or updates a record in the user_order_history table
     * @param data 
     * @returns 
     */
    insertUserOrderHistoryRecord(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertUserOrder");
        return this.http.post(url, data);
    }

    insertSubmission(formData: any): Observable<any> {
        const url = this.getFunctionUrl("insertSubmission");
        return this.http.post(url, formData);
    }

    insertErrorLog(data: any): Observable<any> {
        const url = this.getFunctionUrl("logError");
        return this.http.post(url, data);
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}