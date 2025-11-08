import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignDriverDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { drivers: any[] } // Inject drivers data
  ) {}

  ngOnInit(): void {
    this.drivers = this.data.drivers;

    this.assignDriverForm = this.fb.group({
      assignedDriver: ['', Validators.required], // Form control for selecting a driver
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

  onCancel(): void {
    // Close the dialog without passing any data
    this.dialogRef.close();
  }
}
