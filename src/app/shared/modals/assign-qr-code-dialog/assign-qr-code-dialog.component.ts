import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { MongoService } from '../../../services/mongo.service';

export type AssignQrCodeDialogData = {
  businessId: string;
  businessIdAsObjectId: boolean;
  assetId: string;
  currentTruckId?: string | null;
  actor?: { userId?: string; name?: string };
};

@Component({
  selector: 'app-assign-qr-code-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './assign-qr-code-dialog.component.html',
  styleUrl: './assign-qr-code-dialog.component.scss',
})
export class AssignQrCodeDialogComponent {
  private readonly destroyRef = inject(DestroyRef);

  isLoading = false;
  trucks: Array<any> = [];

  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AssignQrCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignQrCodeDialogData,
    private fb: FormBuilder,
    private mongoService: MongoService
  ) {
    this.form = this.fb.group({
      assetId: [{ value: data.assetId, disabled: true }],
      truckId: [data.currentTruckId ?? null, [Validators.required]],
    });

    this.loadTrucks();
  }

  private loadTrucks(): void {
    this.isLoading = true;
    this.mongoService
      .getTrucksByBusiness(this.data.businessId, this.data.businessIdAsObjectId)
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resp: any) => {
          this.trucks = resp?.trucks ?? [];
        },
        error: (err: any) => {
          console.error('Error loading trucks for QR assignment:', err);
          this.trucks = [];
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  assign(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    if (!this.form.valid) return;

    const truckId = this.form.get('truckId')?.value as string;

    this.dialogRef.close({
      assetId: this.data.assetId,
      truckId,
    });
  }
}
