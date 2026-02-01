import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { US_STATES } from '../../classes/states';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { SharedService } from '../../../services/shared.service';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-add-edit-truck',
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule
  ],
  templateUrl: './add-edit-truck.component.html',
  styleUrl: './add-edit-truck.component.scss'
})
export class AddEditTruckComponent implements OnInit {

  states = US_STATES; // Load the array of states
  drivers: any[] = [];
  truck: any = null;
  truckForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddEditTruckComponent>,
    private sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: { truck: any, drivers: any[] } // Inject drivers data
  ) {}

  ngOnInit(): void {
    this.truck = this.data.truck;
    this.drivers = this.data.drivers;
    this.buildForm();
  }

  buildForm(): void {
    const currentAssignedDriverId =
      this.truck?.assignment?.assignedDriverId?.$oid ??
      this.truck?.assignment?.assignedDriverId ??
      this.truck?.assignedDriverId ??
      null;

    const currentOdometer =
      typeof this.truck?.odometer === 'number'
        ? this.truck.odometer
        : this.truck?.odometer?.value ?? '';

    this.truckForm = this.fb.group({
      truckId: [{ value: this.truck ? this.truck.truckId : null, disabled: true }],
      licensePlate: [this.truck ? this.truck.licensePlate : '', Validators.required],
      assignedDriverId: [currentAssignedDriverId],
      state: [this.truck ? this.truck.state : '', Validators.required],
      make: [this.truck ? this.truck.make : '', Validators.required],
      model: [this.truck ? this.truck.model : '', Validators.required],
      year: [this.truck ? this.truck.year : '', Validators.required],
      vin: [this.truck ? this.truck.vin : '', Validators.required],
      odometer: [this.truck ? currentOdometer : '', Validators.required],
      registrationExpiration: [this.truck ? this.truck.registrationExpiration : '', Validators.required],
      status: [this.truck ? this.truck.status : '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.truckForm.valid) {
      const updatedTruck = this.truckForm.getRawValue();
      if (!updatedTruck.truckId) {
        updatedTruck.truckId = this.sharedService.generateTruckId();
      }
      this.dialogRef.close(updatedTruck);
    }
  }
}