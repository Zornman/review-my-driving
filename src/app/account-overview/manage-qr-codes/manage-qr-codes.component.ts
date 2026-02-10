import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { MongoService } from '../../services/mongo.service';
import { ConfirmDialogComponent } from '../../shared/modals/confirm-dialog/confirm-dialog.component';
import { AssignQrCodeDialogComponent } from '../../shared/modals/assign-qr-code-dialog/assign-qr-code-dialog.component';

@Component({
  selector: 'app-manage-qr-codes',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manage-qr-codes.component.html',
  styleUrl: './manage-qr-codes.component.scss'
})
export class ManageQrCodesComponent {

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  user: any | null = null;
  businessUserInfo: any | null = null;

  businessId: string | null = null;
  businessIdAsObjectId = false;

  isLoading = false;

  filtersForm: FormGroup;

  displayedColumns = ['assetId', 'status', 'truck', 'createdAt', 'assignedAt', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private authService: AuthService,
    private mongoService: MongoService,
    private dialog: MatDialog,
    fb: FormBuilder
  ) {
    this.filtersForm = fb.group({
      status: ['all'],
      search: [''],
    });

    this.dataSource.filterPredicate = (row: any, filterText: string) => {
      const f = (filterText ?? '').toLowerCase().trim();
      if (!f) return true;
      const assetId = (row?.assetId ?? '').toString().toLowerCase();
      const status = (row?.status ?? '').toString().toLowerCase();
      const truckId = (row?.truckId ?? '').toString().toLowerCase();
      return assetId.includes(f) || status.includes(f) || truckId.includes(f);
    };

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => {
        this.user = u;
      });

    this.authService.businessUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.businessUserInfo = info;
        this.initializeBusinessContext();
        void this.refresh();
      });

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyLocalSearch();
        void this.refresh();
      });
  }

  private initializeBusinessContext(): void {
    const rawId = this.businessUserInfo?._id?.$oid ?? this.businessUserInfo?._id;
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
      name: this.user?.displayName ?? undefined,
    };
  }

  private normalizeDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.$date === 'string') {
      const d = new Date(value.$date);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  private mapQrForView(qr: any): any {
    return {
      ...qr,
      assetId: qr?.assetId ?? qr?.uniqueId ?? null,
      createdAt: this.normalizeDate(qr?.createdAt),
      updatedAt: this.normalizeDate(qr?.updatedAt),
      assignedAt: this.normalizeDate(qr?.assignedAt),
    };
  }

  private applyLocalSearch(): void {
    const search = (this.filtersForm.get('search')?.value ?? '').toString();
    this.dataSource.filter = search.trim().toLowerCase();
  }

  refresh(): Promise<void> {
    if (!this.businessId) return Promise.resolve();

    const status = (this.filtersForm.get('status')?.value ?? 'all') as 'all' | 'assigned' | 'unassigned';

    this.isLoading = true;
    return new Promise((resolve) => {
      this.mongoService
        .getBusinessQRCodesByBusiness(this.businessId as string, status)
        .pipe(
          map((resp: any) => resp?.result?.qrCodes ?? resp?.qrCodes ?? []),
          finalize(() => {
            this.isLoading = false;
            resolve();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (qrCodes: any[]) => {
            const mapped = (qrCodes ?? []).map((q) => this.mapQrForView(q));
            this.dataSource.data = mapped;
            console.log(mapped.length + ' QR codes loaded for businessId=' + this.businessId, mapped);
            this.applyLocalSearch();
          },
          error: (err: any) => {
            console.error('Error loading business QR codes:', err);
            this.snackBar.open(err?.error?.message ?? 'Failed to load QR codes.', 'Ok', { duration: 5000 });
            this.dataSource.data = [];
          },
        });
    });
  }

  openAssignDialog(row: any): void {
    if (!this.businessId) return;
    const assetId = (row?.assetId ?? '').toString();
    if (!assetId) return;

    this.dialog
      .open(AssignQrCodeDialogComponent, {
        width: '520px',
        disableClose: true,
        data: {
          businessId: this.businessId,
          businessIdAsObjectId: this.businessIdAsObjectId,
          assetId,
          currentTruckId: row?.truckId ?? null,
          actor: this.actor(),
        },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (!result?.truckId) return;
        this.assign(assetId, result.truckId);
      });
  }

  private assign(assetId: string, truckId: string): void {
    if (!this.businessId) return;
    this.isLoading = true;
    this.mongoService
      .assignBusinessQrToTruck({
        businessId: this.businessId,
        assetId,
        truckId,
        unassign: false,
        actor: this.actor(),
      })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('QR code assigned successfully.', 'Ok', { duration: 3000 });
          void this.refresh();
        },
        error: (err: any) => {
          console.error('Error assigning QR code:', err);
          this.snackBar.open(err?.error?.message ?? 'Failed to assign QR code.', 'Ok', { duration: 6000 });
        },
      });
  }

  confirmUnassign(row: any): void {
    if (!this.businessId) return;
    const assetId = (row?.assetId ?? '').toString();
    if (!assetId) return;

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Unassign QR Code',
          message: `Unassign ${assetId} from its truck?`,
          confirmText: 'Unassign',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.unassign(assetId);
      });
  }

  private unassign(assetId: string): void {
    if (!this.businessId) return;
    this.isLoading = true;
    this.mongoService
      .assignBusinessQrToTruck({
        businessId: this.businessId,
        assetId,
        truckId: null,
        unassign: true,
        actor: this.actor(),
      })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('QR code unassigned.', 'Ok', { duration: 3000 });
          void this.refresh();
        },
        error: (err: any) => {
          console.error('Error unassigning QR code:', err);
          this.snackBar.open(err?.error?.message ?? 'Failed to unassign QR code.', 'Ok', { duration: 6000 });
        },
      });
  }
}
