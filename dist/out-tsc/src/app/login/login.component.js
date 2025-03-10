import { __decorate } from "tslib";
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
let LoginComponent = class LoginComponent {
    fb;
    authService;
    location;
    router;
    _snackBar = inject(MatSnackBar);
    form;
    errorMessage;
    formData = {
        email: '',
        password: ''
    };
    constructor(fb, authService, location, router) {
        this.fb = fb;
        this.authService = authService;
        this.location = location;
        this.router = router;
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
        this.authService.getUser().subscribe(user => {
            if (user) {
                this.router.navigate(['/index']);
            }
        });
    }
    signIn() {
        if (!this.form.valid)
            return;
        const { email, password } = this.form.value;
        this.authService.signInWithEmail(email, password).then((user) => {
            this.location.back();
            this._snackBar.open('Login successful, welcome back!', 'Ok', { duration: 3000 });
        })
            .catch((error) => {
            this.errorMessage = 'Sign in failed: ' + this.formatSignInErrorMessage(error.message);
        });
    }
    // Google Sign-Up
    signUpWithGoogle() {
        this.authService.googleSignIn().then(() => {
            this.location.back();
            this._snackBar.open('Login successful, welcome back!', 'Ok', { duration: 3000 });
        })
            .catch((error) => {
            this.errorMessage = 'Google Sign-In failed: ' + error.message;
        });
    }
    formatSignInErrorMessage(message) {
        if (message.includes('invalid-credential')) {
            return 'Invalid username or password.';
        }
        return '';
    }
};
LoginComponent = __decorate([
    Component({
        selector: 'app-login',
        imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, RouterModule],
        templateUrl: './login.component.html',
        styleUrl: './login.component.scss'
    })
], LoginComponent);
export { LoginComponent };
