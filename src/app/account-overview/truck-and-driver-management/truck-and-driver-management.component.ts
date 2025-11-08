import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../shared/modals/confirm-dialog/confirm-dialog.component';
import { AssignDriverDialogComponent } from '../../shared/modals/assign-driver-dialog/assign-driver-dialog.component';

@Component({
  selector: 'app-truck-and-driver-management',
  imports: [
    CommonModule,
    MatFormFieldModule, 
    FormsModule,
    ReactiveFormsModule, 
    MatInputModule, 
    MatButtonModule, 
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './truck-and-driver-management.component.html',
  styleUrl: './truck-and-driver-management.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ],
})
export class TruckAndDriverManagementComponent implements OnInit {

  trucksColumnsToDisplay = ['truckId', 'licensePlate', 'assignedDriver', 'odometer', 'status', 'expand'];
  trucksColumnsToDisplayWithExpand = [...this.trucksColumnsToDisplay, 'expandedDetail'];
  trucksDataSource: any[] = [];
  expandedTruck: any | null = null;

  driversColumnsToDisplay = ['driverId', 'name', 'phone', 'status', 'expand'];
  driversColumnsToDisplayWithExpand = [...this.driversColumnsToDisplay, 'expandedDetail'];
  driversDataSource: any[] = [];
  expandedDriver: any | null = null;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    // Placeholder data for trucks
    this.trucksDataSource = [
      { 
        truckId: 'T001', 
        licensePlate: 'ABC 123', 
        assignedDriver: 'Luke Patrick', 
        state: 'IL', 
        make: 'Ford', 
        model: 'F-150', 
        year: 2020, 
        vin: '1FTFW1E50LFA12345', 
        odometer: 35000,
        registrationExpiration: '2025-12-31',
        status: 'Active' 
      },
      { 
        truckId: 'T002', 
        licensePlate: 'XYZ 789', 
        assignedDriver: 'Connor Zorn', 
        state: 'IL', 
        make: 'Chevrolet', 
        model: 'Silverado', 
        year: 2019, 
        vin: '3GCUKREC0FG123456', 
        odometer: 150000,
        registrationExpiration: '2025-12-31',
        status: 'Active' 
      },
      { 
        truckId: 'T003', 
        licensePlate: '123 496', 
        assignedDriver: 'Jackson Heinzer', 
        state: 'IL', 
        make: 'Chevrolet', 
        model: 'Silverado', 
        year: 2020, 
        vin: '4VUNKREG1FG987654', 
        odometer: 75000,
        registrationExpiration: '2025-12-31',
        status: 'Active' 
      },
      { 
        truckId: 'T004', 
        licensePlate: 'QWE 123', 
        assignedDriver: 'Colton Sharrow',
        state: 'IL', 
        make: 'Chevrolet', 
        model: 'Silverado',
        year: 2024, 
        vin: '8MOWVQBU3FG467981', 
        odometer: 20000, 
        registrationExpiration: '2025-12-31',
        status: 'Active' 
      },
    ];

    // Placeholder data for drivers
    this.driversDataSource = [
      { 
        driverId: 'D001',
        name: 'Connor Zorn',
        email: 'Connor.Zorn@stackingdimes.com',
        phone: '(630) 467-0987',
        address: [
          { 
            address1: '123 Main St', 
            address2: '', 
            city: 'Cortland', 
            state: 'IL', 
            zip: '60601' 
          }
        ],
        license: [
          { 
            licenseNumber: 'D7654321', 
            state: 'IL', 
            expiration: '2025-06-30' 
          }
        ],
        status: 'Active'
      },
      { 
        driverId: 'D002',
        name: 'Luke Patrick',
        email: 'Luke.Patrick@stackingdimes.com',
        phone: '(630) 123-4567',
        address: [
          { 
            address1: '123 Main St', 
            address2: 'Apt 4B', 
            city: 'Chicago', 
            state: 'IL', 
            zip: '60601' 
          }
        ],
        license: [
          { 
            licenseNumber: 'D7654321', 
            state: 'IL', 
            expiration: '2025-06-30' 
          }
        ],
        status: 'Active'
      },
      {
        driverId: 'D003',
        name: 'Jackson Heinzer',
        email: 'Jackson.Heinzer@stackingdimes.com',
        phone: '(555) 987-6543',
        address: [
          { 
            address1: '456 Oak St', 
            address2: '', 
            city: 'Springfield', 
            state: 'IL', 
            zip: '62701' 
          }
        ],
        license: [
          { 
            licenseNumber: 'L9876543', 
            state: 'NY', 
            expiration: '2026-03-15' 
          }
        ],
        status: 'Active'
      },
      {
        driverId: 'D003',
        name: 'Colton Sharrow',
        email: 'Colton.Sharrow@stackingdimes.com',
        phone: '(630) 987-6543',
        address: [
          { 
            address1: '456 Oak St', 
            address2: '', 
            city: 'Springfield', 
            state: 'IL', 
            zip: '62701' 
          }
        ],
        license: [
          { 
            licenseNumber: 'L9876543', 
            state: 'NY', 
            expiration: '2026-03-15' 
          }
        ],
        status: 'Active'
      }
    ];
  }

  updateTruckStatus(truck: any): void {
    if (truck.status === 'Active') {
      truck.status = 'Inactive';
    } else {
      truck.status = 'Active';
    }
  }

  updateDriverStatus(driver: any): void {
    if (driver.status === 'Active') {
      driver.status = 'Inactive';
    } else {
      driver.status = 'Active';
    }
  }

  deleteTruck(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Delete Truck?',
        message: 'Are you sure you want to delete this truck?',
        confirmText: 'Yes, delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        this.trucksDataSource = this.trucksDataSource.filter(truck => truck !== this.expandedTruck);
        this.expandedTruck = null;
      }
    });
  }

  deleteDriver(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Delete Driver?',
        message: 'Are you sure you want to delete this driver?',
        confirmText: 'Yes, delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        this.driversDataSource = this.driversDataSource.filter(driver => driver !== this.expandedDriver);
        this.expandedDriver = null;
      }
    });
  }

  reassignDriver(): void {
    this.dialog.open(AssignDriverDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        drivers: this.driversDataSource
      }
    }).afterClosed().subscribe(selectedDriver => {
      if (selectedDriver) {
        if (this.expandedTruck) {
          this.expandedTruck.assignedDriver = selectedDriver;

          // Update the trucksDataSource to reflect the change
          this.trucksDataSource = this.trucksDataSource.map(truck =>
            truck.truckId === this.expandedTruck.truckId
              ? { ...truck, assignedDriver: selectedDriver }
              : truck
          );
        }
      }
    });
  }

  toggleTruckRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedTruck = this.expandedTruck === row ? null : row;
  }

  toggleDriverRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedDriver = this.expandedDriver === row ? null : row;
  }
}
