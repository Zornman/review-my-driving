import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { MongoService } from '../services/mongo.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-index',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule, 
    MatTableModule,
    MatIconModule,
    MatDividerModule,
    RouterModule,
    MatExpansionModule,
    MatTabsModule
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
})
export class IndexComponent implements OnInit {

  private destroyRef = inject(DestroyRef);

  user!: User | null;
  businessUserInfo!: any | null;
  isBusinessUser: boolean = false;
  private isBusinessUserKnown: boolean = false;
  private personalSubmissionsLoadKey: string | null = null;
  private businessSubmissionsLoadKey: string | null = null;

  personalSubmissions: any[] = [];
  businessSubmissions: any[] = [];
  submissionScope: 'personal' | 'business' = 'personal';
  private hasUserPickedSubmissionScope: boolean = false;

  submissions!: any;
  now: Date = new Date();
  month = (this.now.getMonth() + 1).toString().padStart(2, '0');
  day = this.now.getDate().toString().padStart(2, '0');
  year = this.now.getFullYear();
  todaysDate: string = this.month + "/" + this.day + "/" + this.year;

  totalSubmissions!: number;
  lastWeekSubmissions!: number;

  submissionsDataSource = new MatTableDataSource<any>([]);
  submissionsColumnsToDisplay = ['name', 'dateSubmitted', 'reasonForContacting', 'expand'];
  submissionsColumnsToDisplayWithExpand = [...this.submissionsColumnsToDisplay, 'expandedDetail'];
  expandedElement: any | null;

  // Quick stats for dashboard
  totalReviews!: number;
  averageRating!: number;
  topCategory!: string;

  constructor(private authService: AuthService, private dbService: MongoService, private router: Router) {
    this.authService.getUser().subscribe((user) => {
      this.user = user;
    });

    this.authService.isBusinessUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isBusiness) => {
        this.isBusinessUserKnown = isBusiness !== null;
        this.isBusinessUser = !!isBusiness;
        this.initializeSubmissions();
      });

    this.authService.businessUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        this.businessUserInfo = info;
        this.initializeSubmissions();
      });
  }

  ngOnInit(): void {
    // Additional initialization if needed
  }

  get showSubmissionScopeTabs(): boolean {
    return (this.personalSubmissions?.length ?? 0) > 0 && (this.businessSubmissions?.length ?? 0) > 0;
  }

  onSubmissionScopeTabChange(event: any): void {
    this.submissionScope = event?.index === 0 ? 'personal' : 'business';
    this.hasUserPickedSubmissionScope = true;
    this.updateActiveSubmissionsView();
  }

  initializeSubmissions() {
    if (!this.user?.uid) return;
    // Always load personal submissions
    this.loadPersonalSubmissions();

    // Optionally load business submissions
    if (this.isBusinessUserKnown && this.isBusinessUser) {
      const businessId = this.businessUserInfo?.businessId ?? this.businessUserInfo?._id ?? null;
      if (businessId) {
        this.loadBusinessSubmissions(String(businessId));
      }
    }

    this.applyDefaultSubmissionScopeIfNeeded();
    this.updateActiveSubmissionsView();
  }

  private loadPersonalSubmissions(): void {
    if (!this.user?.uid) return;
    const loadKey = `user:${this.user.uid}`;
    if (this.personalSubmissionsLoadKey === loadKey) return;
    this.personalSubmissionsLoadKey = loadKey;

    this.dbService.getUserSubmissions({ userId: this.user.uid }).subscribe({
      next: (response: any) => {
        this.personalSubmissions = this.sortSubmissions(response?.submissions ?? []);
        this.applyDefaultSubmissionScopeIfNeeded();
        this.updateActiveSubmissionsView();
      },
      error: (error) => console.error('Error getting personal submissions:', error),
    });
  }

  private loadBusinessSubmissions(businessId: string): void {
    const loadKey = `business:${businessId}`;
    if (this.businessSubmissionsLoadKey === loadKey) return;
    this.businessSubmissionsLoadKey = loadKey;

    this.dbService.getUserSubmissions({ businessId }).subscribe({
      next: (response: any) => {
        this.businessSubmissions = this.sortSubmissions(response?.submissions ?? []);
        this.applyDefaultSubmissionScopeIfNeeded();
        this.updateActiveSubmissionsView();
      },
      error: (error) => console.error('Error getting business submissions:', error),
    });
  }

  private applyDefaultSubmissionScopeIfNeeded(): void {
    const hasPersonal = (this.personalSubmissions?.length ?? 0) > 0;
    const hasBusiness = (this.businessSubmissions?.length ?? 0) > 0;

    if (this.submissionScope === 'business' && !hasBusiness && hasPersonal) {
      this.submissionScope = 'personal';
    } else if (this.submissionScope === 'personal' && !hasPersonal && hasBusiness) {
      this.submissionScope = 'business';
    }

    if (!this.hasUserPickedSubmissionScope && this.isBusinessUser && hasBusiness) {
      this.submissionScope = 'business';
    }
  }

  private updateActiveSubmissionsView(): void {
    const active = this.submissionScope === 'business' ? this.businessSubmissions : this.personalSubmissions;
    this.submissions = (active ?? []).slice(0, 10);
    this.submissionsDataSource = new MatTableDataSource(this.submissions);

    // Dashboard quick stats should represent combined totals
    this.totalSubmissions = (this.personalSubmissions?.length ?? 0) + (this.businessSubmissions?.length ?? 0);
    this.lastWeekSubmissions = this.countLastWeek(this.personalSubmissions) + this.countLastWeek(this.businessSubmissions);
  }

  private countLastWeek(list: any[]): number {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return (list ?? []).filter((x: any) => {
      const date = this.parseDate(x?.dateSubmitted);
      date.setHours(0, 0, 0, 0);
      return date >= sevenDaysAgo && date <= now;
    }).length;
  }

  private sortSubmissions(list: any[]): any[] {
    return (list ?? []).sort((a: any, b: any) => {
      const dateA = this.parseDate(a?.dateSubmitted);
      const dateB = this.parseDate(b?.dateSubmitted);
      const timeA = dateA.getTime();
      const timeB = dateB.getTime();

      if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
      return timeB - timeA;
    });
  }

  parseDate(dateString: string | null | undefined): Date {
    if (!dateString) return new Date(NaN);

    const iso = new Date(dateString);
    if (!Number.isNaN(iso.getTime())) return iso;

    const dateTimeParts = String(dateString).split(' ');

    if (dateTimeParts.length !== 2) {
      const [month, day, year] = dateTimeParts[0].split('/').map(Number);
      return new Date(year, month - 1, day)
    }

    const [datePart, timePart] = dateTimeParts;
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
  }

  toggleRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  getBusinessTruckLabel(submission: any): string | null {
    const truck = submission?.businessContext?.truck ?? null;
    if (!truck) return null;

    const truckId = truck?.truckId ? String(truck.truckId) : '';
    const licensePlate = truck?.licensePlate ? String(truck.licensePlate) : '';

    if (truckId && licensePlate) return `${truckId} (${licensePlate})`;
    if (truckId) return truckId;
    if (licensePlate) return licensePlate;
    return null;
  }

  getBusinessTruckDisplay(submission: any): string {
    const truck = submission?.businessContext?.truck ?? null;
    if (!truck) return '—';

    const base = this.getBusinessTruckLabel(submission);
    const make = truck?.make ? String(truck.make) : '';
    const model = truck?.model ? String(truck.model) : '';
    const year = truck?.year ? String(truck.year) : '';

    const parts: string[] = [];
    if (base) parts.push(base);
    const mm = [year, make, model].filter(Boolean).join(' ');
    if (mm) parts.push(mm);

    return parts.length ? parts.join(' — ') : '—';
  }

  getBusinessDriverDisplay(submission: any): string {
    const driver = submission?.businessContext?.driver ?? null;
    if (!driver) return '—';

    const name = driver?.name ? String(driver.name) : '';
    const phone = driver?.phone ? String(driver.phone) : '';

    if (name && phone) return `${name} (${phone})`;
    if (name) return name;
    if (phone) return phone;
    return '—';
  }
}
