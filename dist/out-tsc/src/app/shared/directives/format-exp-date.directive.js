import { __decorate } from "tslib";
import { Directive, HostListener, Input } from '@angular/core';
let FormatExpiryDateDirective = class FormatExpiryDateDirective {
    el;
    appCCFormatter = ''; // Input to handle initial value
    previousValue = '';
    constructor(el) {
        this.el = el;
    }
    ngOnInit() {
        if (this.appCCFormatter) {
            this.el.nativeElement.value = this.formatExpiryDate(this.appCCFormatter);
        }
    }
    onInputChange(value) {
        const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
        const formatted = this.formatExpiryDate(cleaned);
        this.el.nativeElement.value = formatted;
    }
    formatExpiryDate(value) {
        return value
            .replace(/\D/g, '') // Remove non-numeric characters
            .slice(0, 4) // Limit to MMYY (4 digits max)
            .replace(/^(\d{2})(\d{0,2})$/, (_, mm, yy) => yy ? `${mm}/${yy}` : mm); // Format as MM/YY
    }
};
__decorate([
    Input()
], FormatExpiryDateDirective.prototype, "appCCFormatter", void 0);
__decorate([
    HostListener('input', ['$event.target.value'])
], FormatExpiryDateDirective.prototype, "onInputChange", null);
FormatExpiryDateDirective = __decorate([
    Directive({
        selector: '[formatExpiryDate]',
    })
], FormatExpiryDateDirective);
export { FormatExpiryDateDirective };
