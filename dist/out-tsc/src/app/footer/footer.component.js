import { __decorate } from "tslib";
import { Component } from '@angular/core';
let FooterComponent = class FooterComponent {
    currentYear = new Date().getFullYear();
};
FooterComponent = __decorate([
    Component({
        selector: 'app-footer',
        imports: [],
        templateUrl: './footer.component.html',
        styleUrl: './footer.component.scss'
    })
], FooterComponent);
export { FooterComponent };
