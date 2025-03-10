import { __decorate, __param } from "tslib";
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
let MessageDialogComponent = class MessageDialogComponent {
    dialogRef;
    data;
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
    }
    onConfirm() {
        this.dialogRef.close(true); // ✅ Close dialog and return true
    }
};
MessageDialogComponent = __decorate([
    Component({
        selector: 'app-message-dialog',
        imports: [MatDialogModule],
        templateUrl: './message-dialog.component.html',
        styleUrl: './message-dialog.component.scss'
    }),
    __param(1, Inject(MAT_DIALOG_DATA))
], MessageDialogComponent);
export { MessageDialogComponent };
