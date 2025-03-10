import { __decorate, __param } from "tslib";
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
let ConfirmDialogComponent = class ConfirmDialogComponent {
    dialogRef;
    data;
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
    }
    onConfirm() {
        this.dialogRef.close(true); // ✅ Close dialog and return true
    }
    onCancel() {
        this.dialogRef.close(false); // ❌ Close dialog and return false
    }
};
ConfirmDialogComponent = __decorate([
    Component({
        selector: 'app-confirm-dialog',
        imports: [MatDialogModule],
        templateUrl: './confirm-dialog.component.html',
        styleUrl: './confirm-dialog.component.scss'
    }),
    __param(1, Inject(MAT_DIALOG_DATA))
], ConfirmDialogComponent);
export { ConfirmDialogComponent };
