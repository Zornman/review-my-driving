import { __decorate } from "tslib";
import { Component } from '@angular/core';
let OrderConfirmationComponent = class OrderConfirmationComponent {
    authService;
    route;
    dbService;
    emailService;
    user;
    orderID;
    constructor(authService, route, dbService, emailService) {
        this.authService = authService;
        this.route = route;
        this.dbService = dbService;
        this.emailService = emailService;
    }
    ngOnInit() {
        this.authService.getUser().subscribe((user) => {
            this.user = user;
            if (this.user) {
                this.orderID = this.route.snapshot.paramMap.get('id');
                this.sendEmailConfirmation();
                this.insertOrderHistoryRecord();
            }
        });
    }
    insertOrderHistoryRecord() {
        const data = {
            userID: this.user?.uid,
            orderID: this.orderID,
            dateOrdered: new Date().toDateString(),
            emailOrderConfirm: true,
            emailOrderShipped: false,
            emailOrderCanceled: false,
            emailOrderCreated: false
        };
        this.dbService.insertUserOrderHistoryRecord(JSON.stringify(data)).subscribe({
            next: (response) => {
                //console.log('Order sent to MongoDB:', response);
            },
            error: (error) => {
                console.error('Error sending order to database:', error);
            }
        });
    }
    sendEmailConfirmation() {
        this.emailService.sendOrderConfirmationEmail({ orderID: this.orderID }).subscribe({
            next: (response) => {
                //console.log('Order sent to MongoDB:', response);
            },
            error: (error) => {
                console.error('Error sending order email:', error);
            }
        });
    }
};
OrderConfirmationComponent = __decorate([
    Component({
        selector: 'app-order-confirmation',
        imports: [],
        templateUrl: './order-confirmation.component.html',
        styleUrl: './order-confirmation.component.scss'
    })
], OrderConfirmationComponent);
export { OrderConfirmationComponent };
