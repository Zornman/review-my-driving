import { __decorate } from "tslib";
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
let EmailValidatorDirective = class EmailValidatorDirective {
    // Regular expression for email validation
    emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    validate(control) {
        const value = control.value;
        if (!value) {
            return null; // Allow empty values (use `required` for mandatory validation)
        }
        // Check if the value matches the email pattern
        const isValid = this.emailPattern.test(value);
        return isValid ? null : { invalidEmail: true };
    }
};
EmailValidatorDirective = __decorate([
    Directive({
        selector: '[EmailValidator]', // Use this selector in templates
        providers: [
            {
                provide: NG_VALIDATORS,
                useExisting: EmailValidatorDirective,
                multi: true, // Allow multiple validators
            },
        ],
    })
], EmailValidatorDirective);
export { EmailValidatorDirective };
