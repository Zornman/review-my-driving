import { __decorate } from "tslib";
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmailValidatorDirective } from '../shared/directives/validate-email.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
let RegisterComponent = class RegisterComponent {
    fb;
    authService;
    location;
    router;
    _snackBar = inject(MatSnackBar);
    form;
    errorMessage = null;
    hidePassword = true;
    hideConfirmPassword = true;
    constructor(fb, authService, location, router) {
        this.fb = fb;
        this.authService = authService;
        this.location = location;
        this.router = router;
        this.createForm();
        this.authService.getUser().subscribe(user => {
            if (user) {
                this.router.navigate(['/account']);
            }
        });
    }
    // Initialize the form group with validators
    createForm() {
        this.form = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]], // Use Angular's email validator
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required],
        }, { validators: this.passwordsMatchValidator });
        // Subscribe to form status changes to set the error message
        this.form.statusChanges.subscribe(() => {
            this.setErrorMessage();
        });
    }
    // Validator to check if passwords match
    passwordsMatchValidator(group) {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordsMismatch: true };
    }
    setErrorMessage() {
        if (this.form.get('firstName')?.hasError('required')) {
            this.errorMessage = 'First name is required.';
        }
        else if (this.form.get('lastName')?.hasError('required')) {
            this.errorMessage = 'Last name is required.';
        }
        else if (this.form.get('email')?.hasError('required')) {
            this.errorMessage = 'Email is required.';
        }
        else if (this.form.get('email')?.hasError('email')) {
            this.errorMessage = 'Please enter a valid email address.';
        }
        else if (this.form.get('password')?.hasError('required')) {
            this.errorMessage = 'Password is required.';
        }
        else if (this.form.get('password')?.hasError('minlength')) {
            this.errorMessage = 'Password must be at least 8 characters long.';
        }
        else if (this.form.errors?.['passwordsMismatch']) {
            this.errorMessage = 'Passwords do not match.';
        }
        else {
            this.errorMessage = '';
        }
    }
    // Handle Google Sign-Up
    signUpWithGoogle() {
        this.authService.googleSignIn()
            .then(() => {
            this.location.back();
            this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
        })
            .catch((error) => {
            this.errorMessage = 'Google Sign-In failed: ' + error.message;
        });
    }
    // Handle Email/Password Sign-Up
    signUpWithEmail() {
        if (this.form.invalid) {
            this.errorMessage = 'Please fill out the form correctly.';
            return;
        }
        const { firstName, lastName, email, password } = this.form.value;
        this.authService.signUpWithEmail(email, password, `${firstName} ${lastName}`)
            .then(() => {
            this.location.back();
            this.errorMessage = null;
            this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
        })
            .catch((error) => {
            console.error(error);
            this.errorMessage = this.mapSignUpErrorMessages(error.message);
        });
    }
    mapSignUpErrorMessages(message) {
        if (message.includes('email-already-in-use')) {
            return 'E-mail already exists, try logging in.';
        }
        else {
            return message;
        }
    }
};
RegisterComponent = __decorate([
    Component({
        selector: 'app-register',
        imports: [
            EmailValidatorDirective,
            ReactiveFormsModule, // Add this
            CommonModule,
            FormsModule,
            MatFormFieldModule,
            MatInputModule,
            MatIconModule,
            RouterModule
        ],
        templateUrl: './register.component.html',
        styleUrl: './register.component.scss'
    })
], RegisterComponent);
export { RegisterComponent };
