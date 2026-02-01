import { Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FormatPhoneDirective } from '../../shared/directives/format-phone.directive';
import { TIMEZONES, type TimezoneOption } from '../../shared/classes/timezones';
import { CommonModule } from '@angular/common';
import { MongoService } from '../../services/mongo.service';

@Component({
  selector: 'app-business-functions',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    FormatPhoneDirective
  ],
  templateUrl: './business-functions.component.html',
  styleUrl: './business-functions.component.scss'
})
export class BusinessFunctionsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() businessUserInfo: any | null = null;
  isLoading: boolean = false;

  private _snackBar = inject(MatSnackBar);

  readonly timezones: TimezoneOption[] = TIMEZONES;

  businessUserForm!: FormGroup;
  private dailyReportsEnabledSub?: Subscription;

  private initialSnapshot: string = '';

  constructor(private fb: FormBuilder, private mongoService: MongoService) { }

  get isDailyReportsEnabled(): boolean {
    return this.businessUserForm?.get('dailyReportsEnabled')?.value === true;
  }

  get hasUnsavedChanges(): boolean {
    if (!this.businessUserForm) return false;
    return this.initialSnapshot !== this.computeSnapshot();
  }

  ngOnInit(): void {
    const info = this.businessUserInfo ?? {};
    const settings = info.settings ?? {};

    const createdAt = this.toDate(info.createdAt);
    const updatedAt = this.toDate(info.updatedAt);

    this.businessUserForm = this.fb.group({
      userId: [{ value: info.userId ?? null, disabled: true }],
      businessName: [{ value: info.businessName ?? null, disabled: false }, [Validators.required]],
      contactEmail: [{ value: info.contactEmail ?? null, disabled: false }, [Validators.required, Validators.email]],
      contactPhone: [{ value: info.phoneNumber ?? null, disabled: false }, [Validators.required]],
      notifyOnNewReview: [{ value: settings.notifyOnNewReview ?? null, disabled: false }, [Validators.required]],
      dailySummaryEmail: [{ value: settings.dailySummaryEmail ?? null, disabled: false }, [Validators.required]],
      dailyReportsEnabled: [{ value: settings.dailyReportsEnabled ?? false, disabled: false }, [Validators.required]],
      dailyReportsStartTime: [{ value: settings.dailyReportStartWindow ?? null, disabled: false }],
      dailyReportsEndTime: [{ value: settings.dailyReportEndWindow ?? null, disabled: false }],
      timezone: [{ value: settings?.timezone ?? info.timezone ?? 'UTC', disabled: false }],
      updatedAt: [{ value: this.formatDateTime(updatedAt), disabled: true }],
      createdAt: [{ value: this.formatDateTime(createdAt), disabled: true }]
    });

    this.syncDailyReportsControls(this.isDailyReportsEnabled);
    this.dailyReportsEnabledSub = this.businessUserForm
      .get('dailyReportsEnabled')
      ?.valueChanges.subscribe((enabled: boolean) => {
        this.syncDailyReportsControls(enabled === true);
      });

    // Establish a baseline so the Save button stays disabled until the user actually changes something.
    this.initialSnapshot = this.computeSnapshot();
    this.businessUserForm.markAsPristine();
  }

  ngOnChanges(): void {
  }

  ngOnDestroy(): void {
    this.dailyReportsEnabledSub?.unsubscribe();
  }

  private syncDailyReportsControls(enabled: boolean): void {
    const startCtrl = this.businessUserForm.get('dailyReportsStartTime');
    const endCtrl = this.businessUserForm.get('dailyReportsEndTime');
    const timezoneCtrl = this.businessUserForm.get('timezone');

    if (enabled) {
      startCtrl?.setValidators([Validators.required]);
      endCtrl?.setValidators([Validators.required]);
      timezoneCtrl?.setValidators([Validators.required]);

      startCtrl?.enable({ emitEvent: false });
      endCtrl?.enable({ emitEvent: false });
      timezoneCtrl?.enable({ emitEvent: false });

      startCtrl?.updateValueAndValidity({ emitEvent: false });
      endCtrl?.updateValueAndValidity({ emitEvent: false });
      timezoneCtrl?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    startCtrl?.clearValidators();
    endCtrl?.clearValidators();
    timezoneCtrl?.clearValidators();

    startCtrl?.setValue(null, { emitEvent: false });
    endCtrl?.setValue(null, { emitEvent: false });
    startCtrl?.disable({ emitEvent: false });
    endCtrl?.disable({ emitEvent: false });
    timezoneCtrl?.disable({ emitEvent: false });

    startCtrl?.updateValueAndValidity({ emitEvent: false });
    endCtrl?.updateValueAndValidity({ emitEvent: false });
    timezoneCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit() {
    this.businessUserForm.markAllAsTouched();
    this.businessUserForm.updateValueAndValidity();

    if (!this.businessUserForm.valid) return;

    this.isLoading = true;
    const raw = this.businessUserForm.getRawValue();

    const payload = {
      userId: raw.userId,
      update: {
        businessName: raw.businessName,
        contactEmail: raw.contactEmail,
        phoneNumber: raw.contactPhone,
        settings: {
          notifyOnNewReview: raw.notifyOnNewReview,
          dailySummaryEmail: raw.dailySummaryEmail,
          dailyReportsEnabled: raw.dailyReportsEnabled,
          dailyReportStartWindow: raw.dailyReportsEnabled ? raw.dailyReportsStartTime : null,
          dailyReportEndWindow: raw.dailyReportsEnabled ? raw.dailyReportsEndTime : null,
          timezone: raw.timezone,
        },
      },
    };

    this.mongoService.updateBusinessUserInfo(payload).subscribe({
      next: (resp: any) => {
        this.isLoading = false;

        const updatedAtRaw = resp?.updated?.updatedAt;
        const updatedAt = this.toDate(updatedAtRaw);
        this.businessUserForm.get('updatedAt')?.setValue(this.formatDateTime(updatedAt), { emitEvent: false });

        // Reset baseline after successful save.
        this.initialSnapshot = this.computeSnapshot();
        this.businessUserForm.markAsPristine();

        this._snackBar.open(resp?.message ?? 'Saved successfully.', 'Ok', { duration: 3000 });
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message ?? err?.message ?? 'Failed to save changes.';
        this._snackBar.open(msg, 'Ok', { duration: 6000 });
      },
    });
  }

  private toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Common Mongo export shapes
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

  private computeSnapshot(): string {
    const raw = this.businessUserForm.getRawValue();
    const snapshot = {
      businessName: raw.businessName ?? null,
      contactEmail: raw.contactEmail ?? null,
      contactPhone: raw.contactPhone ?? null,
      notifyOnNewReview: raw.notifyOnNewReview ?? null,
      dailySummaryEmail: raw.dailySummaryEmail ?? null,
      dailyReportsEnabled: raw.dailyReportsEnabled ?? null,
      dailyReportsStartTime: raw.dailyReportsStartTime ?? null,
      dailyReportsEndTime: raw.dailyReportsEndTime ?? null,
      timezone: raw.timezone ?? null,
    };
    return this.stableStringify(snapshot);
  }

  private stableStringify(value: any): string {
    if (value === null || value === undefined) return String(value);
    if (typeof value !== 'object') return JSON.stringify(value);

    if (Array.isArray(value)) {
      return `[${value.map((v) => this.stableStringify(v)).join(',')}]`;
    }

    const keys = Object.keys(value).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${this.stableStringify(value[k])}`);
    return `{${entries.join(',')}}`;
  }

  private formatDateTime(value: Date | null): string {
    if (!value) return '';

    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const hh = String(value.getHours()).padStart(2, '0');
    const mi = String(value.getMinutes()).padStart(2, '0');
    const ss = String(value.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} - ${hh}:${mi}:${ss}`;
  }
}
