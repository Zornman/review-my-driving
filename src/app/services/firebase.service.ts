import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FirebaseService {
    constructor(private http: HttpClient) {}

    getUserByUID(userID: string): Observable<any> {
        const url = this.getFunctionUrl("getUserByUID");
        const params = new HttpParams().set('uid', userID);
        return this.http.get(url, { params });
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}