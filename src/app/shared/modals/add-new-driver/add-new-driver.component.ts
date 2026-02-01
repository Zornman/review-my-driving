import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { US_STATES } from '../../classes/states';
import { SharedService } from '../../../services/shared.service';
import { FormatPhoneDirective } from '../../directives/format-phone.directive';

@Component({
  selector: 'app-add-new-driver',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    FormatPhoneDirective
  ],
  templateUrl: './add-new-driver.component.html',
  styleUrl: './add-new-driver.component.scss'
})
export class AddNewDriverComponent implements OnInit {
  states = US_STATES;
  licenseForm!: FormGroup;
  addressForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddNewDriverComponent>,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.licenseForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      licenseState: ['', Validators.required],
      licenseExpiration: ['', Validators.required]
    });

    this.addressForm = this.fb.group({
      address1: ['', Validators.required],
      address2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onComplete(): void {
    if (this.licenseForm.invalid || this.addressForm.invalid) {
      return;
    }

    const licenseValues = this.licenseForm.value;
    const addressValues = this.addressForm.value;

    const newDriver = {
      driverId: this.sharedService.generateDriverId(),
      name: licenseValues.name,
      email: licenseValues.email,
      phone: licenseValues.phone,
      address: [
        {
          address1: addressValues.address1,
          address2: addressValues.address2,
          city: addressValues.city,
          state: addressValues.state,
          zip: addressValues.zip
        }
      ],
      license: [
        {
          licenseNumber: licenseValues.licenseNumber,
          state: licenseValues.licenseState,
          expiration: licenseValues.licenseExpiration
        }
      ],
      status: 'Active'
    };

    this.dialogRef.close(newDriver);
  }

}
