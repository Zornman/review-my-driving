import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { FormGroup } from '@angular/forms';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { CartSummary } from '../shared/models/cartSummary';
import { PrintifyService } from './printify.service';
import { MongoService } from './mongo.service';

@Injectable({
    providedIn: 'root'
})
export class StripeService {
    order!: any;

    constructor(private http: HttpClient, private printifyService: PrintifyService, private dbService: MongoService) {}

    fetchClientSecret(amt: string): Observable<any> {
        const url = this.getFunctionUrl("createStripePaymentIntent");
        return this.http.post<{ clientSecret: string }>(url, { amount: amt })
    }

    createStripeCheckout(data: any): Observable<any> {
        const url = this.getFunctionUrl("createStripeCheckout");
        return this.http.post(url, { items: data });
    }

    getFunctionUrl(functionName: string): string {
        if (environment.production) {
            functionName = functionName.toLocaleLowerCase();
        }
        return environment.apiBaseUrl.replace("{function}", functionName);
    }

    handlePayment(clientSecret: string, cardNumber: any, stripe: Stripe, orderData: FormGroup<any>, 
    cartSummary: CartSummary[], selectedShippingOption: string): Observable<any> {
        return this.authorizePayment(clientSecret, cardNumber, stripe, orderData).pipe(
            switchMap(paymentIntent => {
                if (!paymentIntent || paymentIntent.status !== 'requires_capture') {
                    throw new Error('Payment authorization failed.');
                }

                this.order = {
                    stripeTransactionId: paymentIntent.id, // Use Stripe transaction ID
                    customerInfo: {
                        firstName: orderData.get('firstName')?.value,
                        lastName: orderData.get('lastName')?.value,
                        email: orderData.get('email')?.value,
                        phone: orderData.get('phone')?.value,
                        country: orderData.get('country')?.value,
                        region: orderData.get('region')?.value,
                        city: orderData.get('city')?.value,
                        address1: orderData.get('address1')?.value,
                        address2: orderData.get('address2')?.value,
                        zip: orderData.get('zip')?.value
                    },
                    products: [
                        {}
                    ],
                    shippingMethod: this.mapShippingMethod(selectedShippingOption) // Printify Shipping Method (Update based on user selection)
                };
                
                this.order.products = [];
            
                cartSummary.forEach((cartItem) => {
                    this.order.products.push({
                        printifyId: cartItem.productId,
                        variantId: cartItem.variantId,
                        quantity: cartItem.quantity
                    })
                });

                return this.printifyService.createPrintifyOrder(this.order).pipe(
                    catchError(error => {
                        console.error('Printify Order Creation Failed:', error);
                        return this.cancelPayment(paymentIntent.id);
                    })
                )
            }),
            switchMap(printifyOrderResponse => {
                return this.capturePayment(this.order.stripeTransactionId).pipe(
                    switchMap(() => of(printifyOrderResponse))
                );
            }),
            catchError(error => {
                this.dbService.insertErrorLog(JSON.stringify({
                    fileName: 'stripe.service.ts',
                    method: 'handlePayment() - transaction failure',
                    timestamp: new Date().toString(),
                    error: error.message
                })).subscribe();
                return throwError(() => new Error('Transaction stopped before final charge.'));
            })
        );
    }

    private authorizePayment(clientSecret: string, cardNumber: any, stripe: Stripe, orderData: FormGroup<any>): Observable<any> {
        return new Observable(observer => {
            stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardNumber,
                    billing_details: {
                      name: orderData.get('firstName')?.value + ' ' + orderData.get('lastName')?.value,
                      email: orderData.get('email')?.value
                    }
                },
            }).then(({ paymentIntent, error }) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(paymentIntent);
                    observer.complete();
                }
            });
        });
    }

    private capturePayment(paymentIntentId: string): Observable<any> {
        return this.http.post(`${this.getFunctionUrl("captureStripePaymentIntent")}`, { paymentIntentId }).pipe(
            catchError(error => {
                console.error('Failed to capture payment:', error);
                return throwError(() => new Error('Capture payment failed.'));
            })
        );
    }

    // ✅ 3. Cancel Authorized Payment (If Printify Order Fails)
    private cancelPayment(paymentIntentId: string): Observable<any> {
        return this.http.post(`${this.getFunctionUrl("cancelStripePaymentIntent")}`, { paymentIntentId }).pipe(
            catchError(error => {
                console.error('Failed to cancel payment:', error);
                return throwError(() => new Error('Manual cancellation needed.'));
            })
        );
    }

    private mapShippingMethod(selectedShippingOption: string) {
        if (selectedShippingOption === 'standard') {
          return 1;
        } else if (selectedShippingOption === 'express') {
          return 3;
        } else if (selectedShippingOption === 'economy') {
          return 4;
        } else if (selectedShippingOption === 'priority') {
          return 2;
        } else {
          return 0;
        }
    }
}