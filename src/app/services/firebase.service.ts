import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FirebaseService {
    constructor(private http: HttpClient) {}

    getUserByUID(userID: string): Observable<any> {
        return this.http.get('/.netlify/functions/getUserByUID?uid=' + userID);
    }
}