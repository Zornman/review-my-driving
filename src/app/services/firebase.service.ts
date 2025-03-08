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
        return this.http.get(environment.apiBaseUrl + '/getUserByUID?uid=' + userID);
    }
}