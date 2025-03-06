import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[EmailValidator]', // Use this selector in templates
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: EmailValidatorDirective,
      multi: true, // Allow multiple validators
    },
  ],
})
export class EmailValidatorDirective implements Validator {
  // Regular expression for email validation
  private emailPattern: RegExp =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null; // Allow empty values (use `required` for mandatory validation)
    }

    // Check if the value matches the email pattern
    const isValid = this.emailPattern.test(value);
    return isValid ? null : { invalidEmail: true };
  }
}