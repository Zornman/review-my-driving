import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
let AboutComponent = class AboutComponent {
    authService;
    bgService;
    user;
    isAdmin = false;
    constructor(authService, bgService) {
        this.authService = authService;
        this.bgService = bgService;
        this.authService.getUser().subscribe((user) => {
            if (!user)
                return;
            this.user = user;
            if (this.user?.uid === environment.adminUserId)
                this.isAdmin = true;
        });
    }
    updateOrderDetails() {
        this.bgService.updateOrderDetails().subscribe({
            next: (data) => {
                console.log(data);
            },
            error: (error) => {
                console.error(error);
            }
        });
    }
};
AboutComponent = __decorate([
    Component({
        selector: 'app-about',
        imports: [
            CommonModule,
            ReactiveFormsModule
        ],
        templateUrl: './about.component.html',
        styleUrl: './about.component.scss'
    })
], AboutComponent);
export { AboutComponent };
