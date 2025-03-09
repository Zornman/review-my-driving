import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShippingCalculatorService {
    constructor(private http: HttpClient) {}

    getAvailableShippingOptions(blueprint_id: number, print_provider_id: number): Observable<any> {
        const url = this.getFunctionUrl("getShippingOptions");
        const params = new HttpParams()
            .set("blueprint_id", blueprint_id.toString())
            .set("print_provider_id", print_provider_id.toString());
    
        return this.http.get(url, { params });
    }
    
    getShippingCosts(blueprint_id: number, print_provider_id: number, shipping_type: string): Observable<any> {
        const url = this.getFunctionUrl("getShippingRates");
        const params = new HttpParams()
            .set("blueprint_id", blueprint_id.toString())
            .set("print_provider_id", print_provider_id.toString())
            .set("shipping_type", shipping_type);
    
        return this.http.get(url, { params });
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }
}