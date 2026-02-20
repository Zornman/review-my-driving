import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MongoService } from '../../services/mongo.service';
import { DailyReportsSummaryDay, DailyReportsSummaryResponse, DailyReportsSummaryRow, DailyReportStatus } from '../../models/daily-reports-summary';
import { firstValueFrom } from 'rxjs';

type DriverGroup = {
  driverKey: string;
  driverName: string;
  driverEmail: string | null;
  rows: DailyReportsSummaryRow[];
};

@Component({
  selector: 'app-daily-reports-summary',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './daily-reports-summary.component.html',
  styleUrl: './daily-reports-summary.component.scss'
})
export class DailyReportsSummaryComponent {

  @Input() businessUserInfo: any | null = null;

  isLoading = false;
  loadError: string | null = null;

  form: FormGroup;

  days: DailyReportsSummaryDay[] = [];

  expandedDay: string | null = null;

  constructor(private db: MongoService, private fb: FormBuilder) {
    const destroyRef = inject(DestroyRef);
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 6);

    this.form = this.fb.group({
      startDate: [start, [Validators.required]],
      endDate: [today, [Validators.required]],
      sortOrder: ['desc', [Validators.required]],
    });

    this.form
      .get('sortOrder')
      ?.valueChanges.pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        if (!this.days.length) return;
        this.applySort();
      });
  }

  ngOnInit(): void {
    this.tryLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['businessUserInfo']) {
      this.tryLoad();
    }
  }

  refresh(): void {
    this.tryLoad(true);
  }

  private tryLoad(force: boolean = false): void {
    if (!this.businessUserInfo) return;
    if (!force && this.days.length) return;
    void this.load();
  }

  private getBusinessId(): { id: string | null; asObjectId: boolean } {
    const raw = this.businessUserInfo?.businessId ?? this.businessUserInfo?._id ?? null;
    if (!raw) return { id: null, asObjectId: false };

    // Mongo ObjectId serialized from API often looks like {"$oid":"..."}
    if (typeof raw === 'object' && raw?.$oid && typeof raw.$oid === 'string') {
      return { id: raw.$oid, asObjectId: true };
    }

    if (typeof raw === 'string') {
      // most businessIds in this codebase are ObjectIds
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(raw);
      return { id: raw, asObjectId: isObjectId };
    }

    return { id: String(raw), asObjectId: false };
  }

  private formatDateLocal(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async load(): Promise<void> {
    this.loadError = null;
    if (!this.businessUserInfo) return;
    if (this.form.invalid) {
      this.loadError = 'Please select a valid date range.';
      return;
    }

    const business = this.getBusinessId();
    if (!business.id) {
      this.loadError = 'Missing businessId on this account.';
      return;
    }

    const startDate: Date = this.form.get('startDate')?.value;
    const endDate: Date = this.form.get('endDate')?.value;
    const startDateLocal = this.formatDateLocal(startDate);
    const endDateLocal = this.formatDateLocal(endDate);

    this.isLoading = true;
    this.days = [];
    try {
      const responseAny = await firstValueFrom(
        this.db.getDailyReportsSummary({
          businessId: business.id,
          businessIdAsObjectId: business.asObjectId,
          startDateLocal,
          endDateLocal,
        })
      );

      const result = (responseAny as DailyReportsSummaryResponse | any)?.result;
      this.days = Array.isArray(result?.days) ? result.days : [];
      this.applySort(true);
    } catch (e: any) {
      this.loadError = e?.message ?? 'Failed to load daily report summaries.';
    } finally {
      this.isLoading = false;
    }
  }

  private applySort(ensureExpanded: boolean = false): void {
    const sortOrder = (this.form.get('sortOrder')?.value ?? 'desc') as 'asc' | 'desc';

    this.days = [...this.days].sort((a, b) => {
      // reportDateLocal format: YYYY-MM-DD so lexicographic compare works
      const cmp = a.reportDateLocal.localeCompare(b.reportDateLocal);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    if (ensureExpanded || !this.expandedDay || !this.days.some(d => d.reportDateLocal === this.expandedDay)) {
      this.expandedDay = this.days.length ? this.days[0].reportDateLocal : null;
    }
  }

  completionPercent(day: DailyReportsSummaryDay): number {
    const done = (day?.totals?.submitted ?? 0) + (day?.totals?.waived ?? 0);
    const expected = day?.totals?.expected ?? 0;
    if (!expected) return 0;
    return Math.round((done / expected) * 100);
  }

  photoUrl(p: { url?: string | null; mongoFileId?: string | null }): string | null {
    if (p?.url) return p.url;
    if (p?.mongoFileId) return this.db.getDailyReportPhotoUrl(p.mongoFileId);
    return null;
  }

  statusLabel(status: DailyReportStatus): string {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'waived':
        return 'Waived';
      case 'pending':
        return 'Pending';
      case 'missing':
        return 'Missing';
    }
  }

  statusIcon(status: DailyReportStatus): string {
    switch (status) {
      case 'submitted':
        return 'check_circle';
      case 'waived':
        return 'do_not_disturb_on';
      case 'pending':
        return 'schedule';
      case 'missing':
        return 'error';
    }
  }

  groupByDriver(rows: DailyReportsSummaryRow[]): DriverGroup[] {
    const map = new Map<string, { driverKey: string; driverName: string; driverEmail: string | null; rows: DailyReportsSummaryRow[] }>();
    for (const row of rows) {
      const key = row.driverObjectId ? String(row.driverObjectId) : 'unknown';
      const driverName = row.driverName?.trim() ? row.driverName : 'Unassigned';
      const driverEmail = row.driverEmail ?? null;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { driverKey: key, driverName, driverEmail, rows: [row] });
      } else {
        existing.rows.push(row);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.driverName.localeCompare(b.driverName));
  }

  trackByDay(_: number, d: DailyReportsSummaryDay): string {
    return d.reportDateLocal;
  }

  trackByDriverGroup(_: number, g: DriverGroup): string {
    return g.driverKey;
  }

  trackByTruckRow(_: number, r: DailyReportsSummaryRow): string {
    return `${r.reportDateLocal}|${r.truckId ?? 'unknown'}`;
  }
}
