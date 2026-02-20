import { Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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

  readonly operatingDayOptions: { key: string; label: string; aria: string }[] = [
    { key: 'mon', label: 'Mon', aria: 'Monday' },
    { key: 'tue', label: 'Tue', aria: 'Tuesday' },
    { key: 'wed', label: 'Wed', aria: 'Wednesday' },
    { key: 'thu', label: 'Thu', aria: 'Thursday' },
    { key: 'fri', label: 'Fri', aria: 'Friday' },
    { key: 'sat', label: 'Sat', aria: 'Saturday' },
    { key: 'sun', label: 'Sun', aria: 'Sunday' },
  ];

  private _snackBar = inject(MatSnackBar);

  readonly timezones: TimezoneOption[] = TIMEZONES;

  businessUserForm!: FormGroup;
  private dailyReportsEnabledSub?: Subscription;
  private holidayModeSub?: Subscription;

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

    const operatingDays = this.normalizeOperatingDays(settings.operatingDays);
    const holidayMode = this.normalizeHolidayMode(settings?.holidays?.mode);
    const holidayDatesText = this.formatHolidayDates(settings?.holidays?.dates);

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

      operatingDays: this.fb.group({
        mon: [operatingDays.includes(1)],
        tue: [operatingDays.includes(2)],
        wed: [operatingDays.includes(3)],
        thu: [operatingDays.includes(4)],
        fri: [operatingDays.includes(5)],
        sat: [operatingDays.includes(6)],
        sun: [operatingDays.includes(7)],
      }),
      holidayMode: [{ value: holidayMode, disabled: false }],
      holidayDates: [{ value: holidayDatesText, disabled: false }, [this.holidayDatesValidator(() => this.businessUserForm?.get('holidayMode')?.value)]],

      updatedAt: [{ value: this.formatDateTime(updatedAt), disabled: true }],
      createdAt: [{ value: this.formatDateTime(createdAt), disabled: true }]
    });

    this.syncDailyReportsControls(this.isDailyReportsEnabled);
    this.dailyReportsEnabledSub = this.businessUserForm
      .get('dailyReportsEnabled')
      ?.valueChanges.subscribe((enabled: boolean) => {
        this.syncDailyReportsControls(enabled === true);
      });

    this.syncHolidayControls(this.businessUserForm.get('holidayMode')?.value);
    this.holidayModeSub = this.businessUserForm
      .get('holidayMode')
      ?.valueChanges.subscribe((mode: string) => {
        this.syncHolidayControls(mode);
        this.businessUserForm.get('holidayDates')?.updateValueAndValidity();
      });

    // Establish a baseline so the Save button stays disabled until the user actually changes something.
    this.initialSnapshot = this.computeSnapshot();
    this.businessUserForm.markAsPristine();
  }

  ngOnChanges(): void {
  }

  ngOnDestroy(): void {
    this.dailyReportsEnabledSub?.unsubscribe();
    this.holidayModeSub?.unsubscribe();
  }

  toggleOperatingDay(key: string): void {
    const group = this.businessUserForm?.get('operatingDays') as FormGroup | null;
    const ctrl = group?.get(key);
    if (!ctrl) return;

    ctrl.setValue(!ctrl.value);
    ctrl.markAsDirty();
    ctrl.markAsTouched();
  }

  private syncHolidayControls(mode: string): void {
    const datesCtrl = this.businessUserForm.get('holidayDates');
    if (!datesCtrl) return;

    if (mode === 'custom') {
      datesCtrl.enable({ emitEvent: false });
      return;
    }

    datesCtrl.disable({ emitEvent: false });
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

    const holidays = this.buildHolidaySettings(raw.holidayMode, raw.holidayDates);
    if (!holidays.ok) {
      this.isLoading = false;
      this._snackBar.open(holidays.message, 'Ok', { duration: 6000 });
      return;
    }

    const operatingDays = this.buildOperatingDays(raw.operatingDays);

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
          operatingDays,
          holidays: holidays.value,
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

    const holidays = this.buildHolidaySettings(raw.holidayMode, raw.holidayDates);
    const operatingDays = this.buildOperatingDays(raw.operatingDays);

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
      operatingDays,
      holidays: holidays.ok ? holidays.value : null,
    };
    return this.stableStringify(snapshot);
  }

  private normalizeOperatingDays(value: any): number[] {
    const allDays = [1, 2, 3, 4, 5, 6, 7];
    if (!Array.isArray(value)) return allDays;

    const nums = value
      .map((v: any) => Number(v))
      .filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 7);

    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    return unique.length ? unique : allDays;
  }

  private normalizeHolidayMode(value: any): 'none' | 'custom' {
    return value === 'custom' ? 'custom' : 'none';
  }

  private formatHolidayDates(dates: any): string {
    if (!Array.isArray(dates)) return '';
    const cleaned = dates
      .map((d: any) => String(d).trim())
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    return cleaned.join('\n');
  }

  private buildOperatingDays(raw: any): number[] {
    const days: number[] = [];
    if (raw?.mon) days.push(1);
    if (raw?.tue) days.push(2);
    if (raw?.wed) days.push(3);
    if (raw?.thu) days.push(4);
    if (raw?.fri) days.push(5);
    if (raw?.sat) days.push(6);
    if (raw?.sun) days.push(7);

    // If the user unchecks everything, treat as "all days" to avoid accidental blackout.
    return days.length ? days : [1, 2, 3, 4, 5, 6, 7];
  }

  private buildHolidaySettings(mode: any, datesText: any): { ok: true; value: { mode: 'none' | 'custom'; dates?: string[] } } | { ok: false; message: string } {
    const normalizedMode: 'none' | 'custom' = mode === 'custom' ? 'custom' : 'none';
    if (normalizedMode === 'none') return { ok: true, value: { mode: 'none' } };

    const text = typeof datesText === 'string' ? datesText : '';
    const dates = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const invalid = dates.find((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
    if (invalid) return { ok: false, message: `Invalid holiday date: ${invalid}. Use YYYY-MM-DD.` };

    const unique = Array.from(new Set(dates)).sort();
    return { ok: true, value: { mode: 'custom', dates: unique } };
  }

  private holidayDatesValidator(getMode: () => any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const mode = getMode();
      if (mode !== 'custom') return null;

      const value = typeof control.value === 'string' ? control.value : '';
      const lines = value
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const invalid = lines.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
      return invalid ? { holidayDates: true } : null;
    };
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
