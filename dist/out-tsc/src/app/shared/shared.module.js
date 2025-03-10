import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { ShippingInformationComponent } from './components/shipping-information/shipping-information.component';
let SharedModule = class SharedModule {
};
SharedModule = __decorate([
    NgModule({
        declarations: [
            ShippingInformationComponent
        ],
        imports: [ShippingInformationComponent],
        exports: []
    })
], SharedModule);
export { SharedModule };
