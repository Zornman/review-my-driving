import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShippingCalculatorService {


    constructor(private http: HttpClient) {}

    getAvailableShippingOptions(blueprint_id: number, print_provider_id: number): Observable<any> {
        return this.http.get('/.netlify/functions/getShippingOptions?blueprint_id=' + blueprint_id + '&print_provider_id=' + print_provider_id);
    }

    getShippingCosts(blueprint_id: number, print_provider_id: number, shipping_type: string): Observable<any> {
        return this.http.get('/.netlify/functions/getShippingRates?blueprint_id=' + blueprint_id + '&print_provider_id=' + print_provider_id + '&shipping_type=' + shipping_type);
    }
}