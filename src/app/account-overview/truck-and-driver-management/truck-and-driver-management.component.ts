import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../shared/modals/confirm-dialog/confirm-dialog.component';
import { AssignDriverDialogComponent } from '../../shared/modals/assign-driver-dialog/assign-driver-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { AddEditTruckComponent } from '../../shared/modals/add-edit-truck/add-edit-truck.component';
import { AddNewDriverComponent } from '../../shared/modals/add-new-driver/add-new-driver.component';
import { EditAddressInfoComponent } from '../../shared/modals/edit-address-info/edit-address-info.component';
import { EditLicenseInfoComponent } from '../../shared/modals/edit-license-info/edit-license-info.component';
import { MongoService } from '../../services/mongo.service';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class TruckAndDriverManagementComponent implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);

  trucksColumnsToDisplay = ['truckId', 'licensePlate', 'assignedDriver', 'odometer', 'status', 'expand'];
  trucksDataSource = new MatTableDataSource<any>([]);
  expandedTruck: any | null = null;

  driversColumnsToDisplay = ['driverId', 'name', 'phone', 'status', 'expand'];
  driversDataSource = new MatTableDataSource<any>([]);
  expandedDriver: any | null = null;

  @ViewChild('trucksPaginator') trucksPaginator!: MatPaginator;
  @ViewChild('driversPaginator') driversPaginator!: MatPaginator;

  user: any | null = null;
  businessUserInfo: any | null = null;

  private businessId: string | null = null;
  private businessIdAsObjectId: boolean = false;

  constructor(
    private dialog: MatDialog,
    private dbService: MongoService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.user = user;
      });

    this.authService.businessUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.businessUserInfo = info;
        this.initializeBusinessContext();
        void this.refreshAll();
      });

    // Make table filtering behave nicely (lowercase, trimmed)
    this.trucksDataSource.filterPredicate = (data: any, filter: string) => {
      const f = filter.trim().toLowerCase();
      const haystack = [
        data?.truckId,
        data?.licensePlate,
        data?.assignedDriver,
        data?.status,
        data?.make,
        data?.model,
        data?.vin
      ].join(' ').toLowerCase();
      return haystack.includes(f);
    };

    this.driversDataSource.filterPredicate = (data: any, filter: string) => {
      const f = filter.trim().toLowerCase();
      const haystack = [
        data?.driverId,
        data?.name,
        data?.phone,
        data?.email,
        data?.status,
        data?.license?.[0]?.licenseNumber
      ].join(' ').toLowerCase();
      return haystack.includes(f);
    };
  }

  ngAfterViewInit(): void {
    this.trucksDataSource.paginator = this.trucksPaginator;
    this.driversDataSource.paginator = this.driversPaginator;
  }

  private initializeBusinessContext(): void {
    const rawId = this.businessUserInfo?.businessId ?? this.businessUserInfo?._id?.$oid ?? this.businessUserInfo?._id;
    if (!rawId) {
      this.businessId = null;
      this.businessIdAsObjectId = false;
      return;
    }

    const idStr = typeof rawId === 'string' ? rawId : String(rawId);
    this.businessId = idStr;
    this.businessIdAsObjectId = /^[a-fA-F0-9]{24}$/.test(idStr);
  }

  private actor(): any {
    return {
      userId: this.user?.uid ?? 'unknown',
      name: this.user?.displayName ?? undefined
    };
  }

  private oidToString(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value?.$oid === 'string') return value.$oid;
    if (typeof value?._id?.$oid === 'string') return value._id.$oid;
    if (typeof value?._id === 'string') return value._id;
    return String(value);
  }

  private assignedDriverIdFromTruck(truck: any): string | null {
    return this.oidToString(truck?.assignment?.assignedDriverId ?? truck?.assignedDriverId);
  }

  private normalizeOdometer(truck: any): number {
    if (typeof truck?.odometer === 'number') return truck.odometer;
    if (typeof truck?.odometer?.value === 'number') return truck.odometer.value;
    return 0;
  }

  private mapTruckForView(truck: any): any {
    const assignedDriverId = this.assignedDriverIdFromTruck(truck);
    const assignedDriver = assignedDriverId
      ? (this.driversDataSource.data.find(d => this.oidToString(d?._id) === assignedDriverId)?.name ?? '')
      : '';

    return {
      ...truck,
      assignedDriver,
      odometer: this.normalizeOdometer(truck),
      registrationExpiration: truck?.registrationExpiration,
    };
  }

  async refreshAll(): Promise<void> {
    if (!this.businessId) return;

    // Load drivers first (so we can map assigned driver names in trucks)
    this.dbService.getDriversByBusiness(this.businessId, this.businessIdAsObjectId).subscribe({
      next: (response: any) => {
        const drivers = response?.drivers ?? [];
        this.driversDataSource.data = drivers;

        this.dbService.getTrucksByBusiness(this.businessId as string, this.businessIdAsObjectId).subscribe({
          next: (truckResponse: any) => {
            const trucks = (truckResponse?.trucks ?? []).map((t: any) => this.mapTruckForView(t));
            this.trucksDataSource.data = trucks;
          },
          error: (error: any) => {
            console.error('Error loading trucks:', error);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading drivers:', error);
      }
    });
  }

  openAddTruckDialog(): void {
    this.dialog.open(AddEditTruckComponent, {
      width: '400px',
      disableClose: false,
      data: {
        truck: null,
        drivers: this.driversDataSource.data
      }
    }).afterClosed().subscribe((result: any) => {
      if (!result || !result.truckId || !this.businessId) return;

      const assignedDriverId = result.assignedDriverId ?? null;

      const payload: any = {
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        truckId: result.truckId,
        licensePlate: result.licensePlate,
        state: result.state,
        make: result.make,
        model: result.model,
        year: Number(result.year),
        vin: result.vin,
        registrationExpiration: result.registrationExpiration,
        status: result.status,
        odometer: { value: Number(result.odometer), unit: 'mi' },
        assignment: { assignedDriverId: null, assignedAt: null, assignedBy: null }
      };

      this.dbService.insertTruck(payload).subscribe({
        next: (response: any) => {
          const insertedId = response?.result?.insertedId;
          const truckObjectId = this.oidToString(insertedId);

          if (assignedDriverId && truckObjectId) {
            this.dbService.assignDriverToTruck({
              businessId: this.businessId,
              businessIdAsObjectId: this.businessIdAsObjectId,
              actor: this.actor(),
              truckObjectId,
              driverObjectId: assignedDriverId,
              unassign: false
            }).subscribe({
              next: () => void this.refreshAll(),
              error: (error: any) => {
                console.error('Error assigning driver after insert:', error);
                void this.refreshAll();
              }
            });
          } else {
            void this.refreshAll();
          }
        },
        error: (error: any) => {
          console.error('Error inserting truck:', error);
        }
      });
    });
  }

  openAddDriverDialog(): void {
    this.dialog.open(AddNewDriverComponent, {
      width: '600px',
      disableClose: false
    }).afterClosed().subscribe((result: any) => {
      if (!result || !result.driverId || !this.businessId) return;

      const payload: any = {
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        ...result,
      };

      this.dbService.insertDriver(payload).subscribe({
        next: () => {
          void this.refreshAll();
        },
        error: (error: any) => {
          console.error('Error inserting driver:', error);
        }
      });
    });
  }

  editTruck(truck: any): void {
    this.dialog.open(AddEditTruckComponent, {
      width: '400px',
      disableClose: false,
      data: {
        truck: truck,
        drivers: this.driversDataSource.data
      }
    }).afterClosed().subscribe((result: any) => {
      if (!result || !this.businessId) return;

      const truckObjectId = this.oidToString(truck?._id);
      if (!truckObjectId) return;

      const updatePayload: any = {
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        truckObjectId,
        update: {
          licensePlate: result.licensePlate,
          state: result.state,
          make: result.make,
          model: result.model,
          year: Number(result.year),
          vin: result.vin,
          registrationExpiration: result.registrationExpiration,
          status: result.status,
          odometer: { value: Number(result.odometer), unit: 'mi' }
        }
      };

      const existingAssigned = this.assignedDriverIdFromTruck(truck);
      const nextAssigned = result.assignedDriverId ?? null;

      this.dbService.updateTruck(updatePayload).subscribe({
        next: () => {
          if (existingAssigned !== nextAssigned) {
            const assignPayload: any = {
              businessId: this.businessId,
              businessIdAsObjectId: this.businessIdAsObjectId,
              actor: this.actor(),
              truckObjectId,
              unassign: nextAssigned == null,
              driverObjectId: nextAssigned
            };
            this.dbService.assignDriverToTruck(assignPayload).subscribe({
              next: () => {
                void this.refreshAll();
                this.expandedTruck = null;
              },
              error: (error: any) => {
                console.error('Error assigning driver:', error);
                void this.refreshAll();
                this.expandedTruck = null;
              }
            });
          } else {
            void this.refreshAll();
            this.expandedTruck = null;
          }
        },
        error: (error: any) => {
          console.error('Error updating truck:', error);
        }
      });
    });
  }

  updateTruckStatus(truck: any): void {
    if (!this.businessId) return;
    const truckObjectId = this.oidToString(truck?._id);
    if (!truckObjectId) return;

    const nextStatus = truck.status === 'Active' ? 'Inactive' : 'Active';

    const title = nextStatus === 'Inactive' ? 'Deactivate Truck?' : 'Activate Truck?';
    const message =
      nextStatus === 'Inactive'
        ? 'Are you sure you want to deactivate this truck? It will still remain in your list.'
        : 'Are you sure you want to activate this truck?';

    const confirmText = nextStatus === 'Inactive' ? 'Yes, deactivate' : 'Yes, activate';
    const cancelText = 'Cancel';

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: false,
      data: { title, message, confirmText, cancelText }
    }).afterClosed().subscribe((result: boolean) => {
      if (result !== true) return;

      this.dbService.updateTruck({
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        truckObjectId,
        update: { status: nextStatus }
      }).subscribe({
        next: () => {
          void this.refreshAll();
          this.expandedTruck = null;
        },
        error: (error: any) => console.error('Error updating truck status:', error)
      });
    });
  }

  updateDriverStatus(driver: any): void {
    if (!this.businessId) return;
    const driverObjectId = this.oidToString(driver?._id);
    if (!driverObjectId) return;

    const nextStatus = driver.status === 'Active' ? 'Inactive' : 'Active';

    const title = nextStatus === 'Inactive' ? 'Deactivate Driver?' : 'Activate Driver?';
    const message =
      nextStatus === 'Inactive'
        ? 'Are you sure you want to deactivate this driver? They will still remain in your list.'
        : 'Are you sure you want to activate this driver?';

    const confirmText = nextStatus === 'Inactive' ? 'Yes, deactivate' : 'Yes, activate';
    const cancelText = 'Cancel';

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: false,
      data: { title, message, confirmText, cancelText }
    }).afterClosed().subscribe((result: boolean) => {
      if (result !== true) return;

      this.dbService.updateDriver({
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        driverObjectId,
        update: { status: nextStatus }
      }).subscribe({
        next: () => {
          void this.refreshAll();
          this.expandedDriver = null;
        },
        error: (error: any) => console.error('Error updating driver status:', error)
      });
    });
  }

  deleteTruck(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Delete Truck?',
        message: 'Are you sure you want to delete this truck?',
        confirmText: 'Yes, delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        if (!this.businessId || !this.expandedTruck) return;
        const truckObjectId = this.oidToString(this.expandedTruck?._id);
        if (!truckObjectId) return;

        this.dbService.deleteTruck({
          businessId: this.businessId,
          businessIdAsObjectId: this.businessIdAsObjectId,
          actor: this.actor(),
          truckObjectId
        }).subscribe({
          next: () => {
            void this.refreshAll();
            this.expandedTruck = null;
          },
          error: (error: any) => console.error('Error deleting truck:', error)
        });
      }
    });
  }

  deleteDriver(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Delete Driver?',
        message: 'Are you sure you want to delete this driver?',
        confirmText: 'Yes, delete',
        cancelText: 'Cancel'
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        if (!this.businessId || !this.expandedDriver) return;
        const driverObjectId = this.oidToString(this.expandedDriver?._id);
        if (!driverObjectId) return;

        this.dbService.deleteDriver({
          businessId: this.businessId,
          businessIdAsObjectId: this.businessIdAsObjectId,
          actor: this.actor(),
          driverObjectId
        }).subscribe({
          next: () => {
            void this.refreshAll();
            this.expandedDriver = null;
          },
          error: (error: any) => console.error('Error deleting driver:', error)
        });
      }
    });
  }

  reassignDriver(): void {
    if (!this.businessId || !this.expandedTruck) return;
    const truckObjectId = this.oidToString(this.expandedTruck?._id);
    if (!truckObjectId) return;

    const currentDriverId = this.assignedDriverIdFromTruck(this.expandedTruck);
    const currentDriver = currentDriverId
      ? this.driversDataSource.data.find(d => this.oidToString(d?._id) === currentDriverId)
      : null;

    this.dialog.open(AssignDriverDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        drivers: this.driversDataSource.data,
        currentDriver
      }
    }).afterClosed().subscribe((selectedDriver: any) => {
      if (selectedDriver === undefined) return; // cancel

      const nextDriverObjectId = selectedDriver ? this.oidToString(selectedDriver?._id) : null;

      this.dbService.assignDriverToTruck({
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        truckObjectId,
        unassign: nextDriverObjectId == null,
        driverObjectId: nextDriverObjectId
      }).subscribe({
        next: () => {
          void this.refreshAll();
          this.expandedTruck = null;
        },
        error: (error: any) => console.error('Error reassigning driver:', error)
      });
    });
  }

  editLicenseInfo(driver: any): void {
    this.dialog.open(EditLicenseInfoComponent, {
      width: '400px',
      disableClose: false,
      data: { driver }
    }).afterClosed().subscribe((result: any) => {
      if (!result || !this.businessId) return;
      const driverObjectId = this.oidToString(driver?._id);
      if (!driverObjectId) return;

      const existingLicense = driver?.license?.[0] ?? {};

      this.dbService.updateDriver({
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        driverObjectId,
        update: { license: [{ ...existingLicense, ...result }] }
      }).subscribe({
        next: () => {
          void this.refreshAll();
          this.expandedDriver = null;
        },
        error: (error: any) => console.error('Error updating license info:', error)
      });
    });
  }

  editAddressInfo(driver: any): void {
    this.dialog.open(EditAddressInfoComponent, {
      width: '400px',
      disableClose: false,
      data: { driver }
    }).afterClosed().subscribe((result: any) => {
      if (!result || !this.businessId) return;
      const driverObjectId = this.oidToString(driver?._id);
      if (!driverObjectId) return;

      const existingAddress = driver?.address?.[0] ?? {};

      this.dbService.updateDriver({
        businessId: this.businessId,
        businessIdAsObjectId: this.businessIdAsObjectId,
        actor: this.actor(),
        driverObjectId,
        update: { address: [{ ...existingAddress, ...result }] }
      }).subscribe({
        next: () => {
          void this.refreshAll();
          this.expandedDriver = null;
        },
        error: (error: any) => console.error('Error updating address info:', error)
      });
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

  applyTruckFilter(value: string): void {
    this.trucksDataSource.filter = (value ?? '').trim().toLowerCase();
    if (this.trucksDataSource.paginator) this.trucksDataSource.paginator.firstPage();
  }

  applyDriverFilter(value: string): void {
    this.driversDataSource.filter = (value ?? '').trim().toLowerCase();
    if (this.driversDataSource.paginator) this.driversDataSource.paginator.firstPage();
  }
}
