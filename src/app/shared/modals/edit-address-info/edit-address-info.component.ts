import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { US_STATES } from '../../classes/states';

@Component({
  selector: 'app-edit-address-info',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './edit-address-info.component.html',
  styleUrl: './edit-address-info.component.scss'
})
export class EditAddressInfoComponent implements OnInit {
  states = US_STATES;
  addressForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditAddressInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { driver?: any }
  ) {}

  ngOnInit(): void {
    const address = this.data?.driver?.address?.[0] ?? {};

    this.addressForm = this.fb.group({
      address1: [address.address1 || '', Validators.required],
      address2: [address.address2 || ''],
      city: [address.city || '', Validators.required],
      state: [address.state || '', Validators.required],
      zip: [address.zip || '', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      return;
    }

    this.dialogRef.close(this.addressForm.value);
  }

}
