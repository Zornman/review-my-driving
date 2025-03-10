import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
let SignUpDialogComponent = class SignUpDialogComponent {
    dialogRef;
    router;
    constructor(dialogRef, router) {
        this.dialogRef = dialogRef;
        this.router = router;
    }
    signUp() {
        // Handle sign-up logic here
        this.router.navigate(['/register']);
        this.dialogRef.close(); // Close the dialog
    }
};
SignUpDialogComponent = __decorate([
    Component({
        selector: 'app-sign-up-dialog',
        imports: [
            MatDialogModule
        ],
        templateUrl: './sign-up-dialog.component.html',
        styleUrl: './sign-up-dialog.component.scss'
    })
], SignUpDialogComponent);
export { SignUpDialogComponent };
