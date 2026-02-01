import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-assign-driver-dialog',
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatButtonModule
  ],
  templateUrl: './assign-driver-dialog.component.html',
  styleUrl: './assign-driver-dialog.component.scss'
})
export class AssignDriverDialogComponent implements OnInit {
  assignDriverForm!: FormGroup;
  isLoading: boolean = false;
  drivers: any[] = [];
  currentDriver: any | null = null;

  trackByDriver = (index: number, driver: any): any => {
    return driver?._id?.$oid ?? driver?._id ?? driver?.id ?? driver?.uid ?? driver?.name ?? index;
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignDriverDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { drivers: any[], currentDriver: any } // Inject drivers data
  ) {}

  ngOnInit(): void {
    this.drivers = this.data.drivers;

    this.currentDriver = this.data.currentDriver ?? null;

    this.assignDriverForm = this.fb.group({
      assignedDriver: [this.currentDriver ?? null],
    });
  }

  onSubmit(): void {
    if (this.assignDriverForm.valid) {
      this.isLoading = true;
      const selectedDriver = this.assignDriverForm.get('assignedDriver')?.value;

      // Close the dialog and pass the selected driver back to the parent
      this.dialogRef.close(selectedDriver);
    }
  }

  // NOTE: Keep this as a stable function reference for Angular Material's compareWith.
  compareDrivers = (a: any, b: any): boolean => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    const aId = a?._id?.$oid ?? a?._id ?? null;
    const bId = b?._id?.$oid ?? b?._id ?? null;
    if (aId && bId) return String(aId) === String(bId);
    return a?.name === b?.name;
  };

  isCurrentDriver(driver: any): boolean {
    return this.compareDrivers(driver, this.currentDriver);
  }

  onCancel(): void {
    // Close the dialog without passing any data
    this.dialogRef.close();
  }
}
