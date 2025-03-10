import { __decorate } from "tslib";
import { Directive, HostListener, Input } from '@angular/core';
let FormatPhoneDirective = class FormatPhoneDirective {
    el;
    appPhoneFormatter = ''; // Input to handle initial value
    constructor(el) {
        this.el = el;
    }
    ngOnInit() {
        if (this.appPhoneFormatter) {
            this.el.nativeElement.value = this.formatPhoneNumber(this.appPhoneFormatter);
        }
    }
    onInputChange(value) {
        const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
        const formatted = this.formatPhoneNumber(cleaned);
        this.el.nativeElement.value = formatted;
    }
    formatPhoneNumber(value) {
        if (value.length <= 3) {
            return `(${value}`;
        }
        else if (value.length <= 6) {
            return `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }
        else {
            return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
};
__decorate([
    Input()
], FormatPhoneDirective.prototype, "appPhoneFormatter", void 0);
__decorate([
    HostListener('input', ['$event.target.value'])
], FormatPhoneDirective.prototype, "onInputChange", null);
FormatPhoneDirective = __decorate([
    Directive({
        selector: '[formatPhone]',
    })
], FormatPhoneDirective);
export { FormatPhoneDirective };
