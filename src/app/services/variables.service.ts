import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class VariablesService {
    constructor(private http: HttpClient) {}

    getEnvironmentVariables(): Observable<any> {
        return this.http.get('/.netlify/functions/getEnvironmentVariables');
    }
}