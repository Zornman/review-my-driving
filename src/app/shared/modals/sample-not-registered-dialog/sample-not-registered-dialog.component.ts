import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-sample-not-registered-dialog',
  imports: [MatDialogModule],
  templateUrl: './sample-not-registered-dialog.component.html',
  styleUrl: './sample-not-registered-dialog.component.scss'
})
export class SampleNotRegisteredDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SampleNotRegisteredDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onAction(): void {
    if (this.data?.actionCallback) {
      this.data.actionCallback();
    }
    this.dialogRef.close();
  }
}
