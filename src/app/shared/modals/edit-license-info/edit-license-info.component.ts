import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { US_STATES } from '../../classes/states';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-license-info',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './edit-license-info.component.html',
  styleUrl: './edit-license-info.component.scss'
})
export class EditLicenseInfoComponent implements OnInit {
  states = US_STATES;
  licenseForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditLicenseInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { driver?: any }
  ) {}

  ngOnInit(): void {
    const license = this.data?.driver?.license?.[0] ?? {};

    this.licenseForm = this.fb.group({
      licenseNumber: [license.licenseNumber || '', Validators.required],
      state: [license.state || '', Validators.required],
      expiration: [license.expiration || '', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.licenseForm.invalid) {
      return;
    }

    this.dialogRef.close(this.licenseForm.value);
  }

}
