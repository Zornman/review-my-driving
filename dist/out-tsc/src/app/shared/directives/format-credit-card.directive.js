import { __decorate } from "tslib";
import { Directive, HostListener, Input } from '@angular/core';
let FormatCreditCardDirective = class FormatCreditCardDirective {
    el;
    appCCFormatter = ''; // Input to handle initial value
    previousValue = '';
    constructor(el) {
        this.el = el;
    }
    ngOnInit() {
        if (this.appCCFormatter) {
            this.el.nativeElement.value = this.formatCreditCard(this.appCCFormatter);
        }
    }
    onInputChange(value) {
        const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
        const formatted = this.formatCreditCard(cleaned);
        this.el.nativeElement.value = formatted;
    }
    formatCreditCard(value) {
        const cleanValue = value.replace(/\D/g, ''); // Remove non-numeric chars
        const cardType = this.detectCardType(cleanValue);
        switch (cardType) {
            case 'amex': // American Express: 15 digits, format XXXX XXXXXX XXXXX
                return cleanValue
                    .slice(0, 15)
                    .replace(/^(\d{4})(\d{0,6})(\d{0,5})$/, (_, g1, g2, g3) => [g1, g2, g3].filter(Boolean).join(' '));
            case 'diners': // Diners Club: 14 digits, format XXXX XXXXXX XXXX
                return cleanValue
                    .slice(0, 14)
                    .replace(/^(\d{4})(\d{0,6})(\d{0,4})$/, (_, g1, g2, g3) => [g1, g2, g3].filter(Boolean).join(' '));
            default: // Visa, Mastercard, Discover, etc.: 16 digits, format XXXX XXXX XXXX XXXX
                return cleanValue
                    .slice(0, 16)
                    .replace(/(\d{4})(?=\d)/g, '$1 ')
                    .trim(); // Remove trailing space if needed
        }
    }
    detectCardType(number) {
        if (/^3[47]/.test(number))
            return 'amex'; // American Express (34, 37)
        if (/^3(0[0-5]|[68])/.test(number))
            return 'diners'; // Diners Club (300-305, 36, 38)
        if (/^4/.test(number))
            return 'visa'; // Visa (4XXX)
        if (/^5[1-5]/.test(number))
            return 'mastercard'; // Mastercard (51-55)
        if (/^6(?:011|5)/.test(number))
            return 'discover'; // Discover (6011, 65)
        return 'unknown'; // Default case
    }
};
__decorate([
    Input()
], FormatCreditCardDirective.prototype, "appCCFormatter", void 0);
__decorate([
    HostListener('input', ['$event.target.value'])
], FormatCreditCardDirective.prototype, "onInputChange", null);
FormatCreditCardDirective = __decorate([
    Directive({
        selector: '[formatCC]',
    })
], FormatCreditCardDirective);
export { FormatCreditCardDirective };
