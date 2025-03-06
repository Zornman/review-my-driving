import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface MessageDialogData {
  message: string;
}

@Component({
  selector: 'app-message-dialog',
  imports: [MatDialogModule],
  templateUrl: './message-dialog.component.html',
  styleUrl: './message-dialog.component.scss'
})
export class MessageDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);  // ✅ Close dialog and return true
  }
}
