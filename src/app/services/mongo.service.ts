import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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

    getUserByUniqueId(uniqueId: string): Observable<any> {
        const url = this.getFunctionUrl("getUserByUniqueId");
        const params = new HttpParams().set('uniqueId', (uniqueId) ? uniqueId : '');
        return this.http.get(url, { params });
    }

    getSampleBatches(): Observable<any> {
        const url = this.getFunctionUrl("getSampleBatches");
        return this.http.get(url);
    }

    getBusinessUserInfo(userId: string): Observable<any> {
        const url = this.getFunctionUrl("getBusinessUserInfo");
        return this.http.get(url, { params: new HttpParams().set('userId', (userId) ? userId : '') });
    }

    updateBusinessUserInfo(data: any): Observable<any> {
        const url = this.getFunctionUrl("updateBusinessUserInfo");
        return this.http.patch(url, data);
    }

    /**
     * Inserts or updates a record in the user_shipping_info table
     * @param shippingInfo 
     * @returns 
     */
    insertUserShippingInfo(shippingInfo: any): Observable<any> {
        const url = this.getFunctionUrl("insertUserShipping");
        const data = JSON.stringify(shippingInfo);
        return this.http.post(url, data);
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

    insertSampleMapper(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertSampleMapper");
        return this.http.post(url, data);
    }

    insertSampleBatch(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertSampleBatch");
        return this.http.post(url, data);
    }

    // ---------------------------------------------------------------------
    // Daily Reports (admin tools)
    // ---------------------------------------------------------------------

    initDailyReportIndexes(): Observable<any> {
        const url = this.getFunctionUrl("initDailyReportIndexes");
        return this.http.post(url, {});
    }

    runDailyReportMagicLinksOnce(): Observable<any> {
        const url = this.getFunctionUrl("runDailyReportMagicLinksOnce");
        return this.http.post(url, {});
    }

    getDailyReportsSummary(params: {
        businessId: string;
        startDateLocal: string;
        endDateLocal: string;
        businessIdAsObjectId?: boolean;
    }): Observable<any> {
        const url = this.getFunctionUrl("getDailyReportsSummary");

        let httpParams = new HttpParams()
            .set('businessId', params.businessId ? params.businessId : '')
            .set('startDateLocal', params.startDateLocal ? params.startDateLocal : '')
            .set('endDateLocal', params.endDateLocal ? params.endDateLocal : '');

        if (params.businessIdAsObjectId) {
            httpParams = httpParams.set('businessIdAsObjectId', 'true');
        }

        return this.http.get(url, { params: httpParams });
    }

    // ---------------------------------------------------------------------
    // Daily Report submission (driver)
    // ---------------------------------------------------------------------

    uploadDailyReportPhotoByToken(formData: FormData): Observable<any> {
        const url = this.getFunctionUrl("uploadDailyReportPhotoByToken");
        return this.http.post(url, formData);
    }

    submitDailyReportByToken(body: {
        token: string;
        odometer: number;
        issues?: string;
        issuesSummary?: string;
        photos?: Array<{ slot: string; mongoFileId?: string; url?: string; storagePath?: string; fileName?: string; contentType?: string; size?: number }>;
    }): Observable<any> {
        const url = this.getFunctionUrl("submitDailyReportByToken");
        return this.http.post(url, body);
    }

    getDailyReportPhotoUrl(fileId: string): string {
        const url = this.getFunctionUrl("getDailyReportPhoto");
        return `${url}?fileId=${encodeURIComponent(fileId)}`;
    }

    // ---------------------------------------------------------------------
    // Trucks & Drivers
    // ---------------------------------------------------------------------

    getTrucksByBusiness(businessId: string, businessIdAsObjectId: boolean = false): Observable<any> {
        const url = this.getFunctionUrl("getTrucksByBusiness");
        let params = new HttpParams().set('businessId', businessId ? businessId : '');
        if (businessIdAsObjectId) {
            params = params.set('businessIdAsObjectId', 'true');
        }
        return this.http.get(url, { params });
    }

    insertTruck(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertTruck");
        return this.http.post(url, data);
    }

    updateTruck(data: any): Observable<any> {
        const url = this.getFunctionUrl("updateTruck");
        return this.http.patch(url, data);
    }

    deleteTruck(data: any): Observable<any> {
        const url = this.getFunctionUrl("deleteTruck");
        return this.http.request('delete', url, { body: data });
    }

    assignDriverToTruck(data: any): Observable<any> {
        const url = this.getFunctionUrl("assignDriverToTruck");
        return this.http.post(url, data);
    }

    getDriversByBusiness(businessId: string, businessIdAsObjectId: boolean = false): Observable<any> {
        const url = this.getFunctionUrl("getDriversByBusiness");
        let params = new HttpParams().set('businessId', businessId ? businessId : '');
        if (businessIdAsObjectId) {
            params = params.set('businessIdAsObjectId', 'true');
        }
        return this.http.get(url, { params });
    }

    insertDriver(data: any): Observable<any> {
        const url = this.getFunctionUrl("insertDriver");
        return this.http.post(url, data);
    }

    updateDriver(data: any): Observable<any> {
        const url = this.getFunctionUrl("updateDriver");
        return this.http.patch(url, data);
    }

    deleteDriver(data: any): Observable<any> {
        const url = this.getFunctionUrl("deleteDriver");
        return this.http.request('delete', url, { body: data });
    }

    /**
     * 
     * Updates an existing sample mapper record with a userId.
     * @param data - The data to update, should include a unique identifier for the sample.
     */
    updateSampleMapper(data: any): Observable<any> {
        const url = this.getFunctionUrl("updateSampleMapper");
        return this.http.post(url, data);
    }

    /**
     * Insert business QR codes into the database
     * @param businessQRCodes - Array of business QR code entries
     * @returns Observable with the insertion result
     */
    insertBusinessQRCodes(businessQRCodes: Array<any>): Observable<any> {
      const endpoint = this.getFunctionUrl("insertBusinessQRCodes");
      // Send as array directly, not wrapped
      return this.http.post(endpoint, businessQRCodes).pipe(
        catchError((error) => {
          console.error('Error inserting business QR codes:', error);
          return throwError(() => new Error('Failed to insert business QR codes'));
        })
      );
    }

    getAllBusinessUsers(): Observable<any> {
        const url = this.getFunctionUrl("getAllBusinessUsers");
        return this.http.get(url);
    }

    // ---------------------------------------------------------------------
    // Business QR codes
    // ---------------------------------------------------------------------

    /**
     * Validates a business QR (businessId + assetId) and returns association context.
     * assetId is the QR unique id embedded in the URL.
     */
    getBusinessQrContext(businessId: string, assetId: string): Observable<any> {
        const url = this.getFunctionUrl("getBusinessQrContext");
        const params = new HttpParams()
            .set('businessId', businessId ? businessId : '')
            .set('assetId', assetId ? assetId : '');
        return this.http.get(url, { params });
    }

    getBusinessQRCodesByBusiness(businessId: string, status: 'all' | 'assigned' | 'unassigned' = 'all'): Observable<any> {
        const url = this.getFunctionUrl("getBusinessQRCodesByBusiness");
        const params = new HttpParams()
            .set('businessId', businessId ? businessId : '')
            .set('status', status);
        return this.http.get(url, { params });
    }

    assignBusinessQrToTruck(body: {
        businessId: string;
        assetId: string;
        truckId: string | null;
        unassign?: boolean;
        actor?: { userId?: string; name?: string };
    }): Observable<any> {
        const url = this.getFunctionUrl("assignBusinessQrToTruck");
        return this.http.post(url, body);
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}