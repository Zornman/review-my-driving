import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../services/auth.service';
import { User } from '@firebase/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MongoService } from '../services/mongo.service';
import { Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { BusinessFunctionsComponent } from './business-functions/business-functions.component';
import { TruckAndDriverManagementComponent } from './truck-and-driver-management/truck-and-driver-management.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DailyReportsSummaryComponent } from './daily-reports-summary/daily-reports-summary.component';
import { ManageQrCodesComponent } from './manage-qr-codes/manage-qr-codes.component';
import { ShippingInformationComponent } from './shipping-information/shipping-information.component';

@Component({
  selector: 'app-account-overview',
  imports: [
    CommonModule,
    MatTabsModule, 
    MatFormFieldModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatInputModule, 
    MatCardModule, 
    MatButtonModule, 
    MatTableModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    BusinessFunctionsComponent,
    TruckAndDriverManagementComponent,
    DailyReportsSummaryComponent,
    ManageQrCodesComponent,
    ShippingInformationComponent
   ],
  templateUrl: './account-overview.component.html',
  styleUrl: './account-overview.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ],
})
export class AccountOverviewComponent implements OnInit, AfterViewInit {
  private _snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  accOverviewForm!: FormGroup;
  user!: User | null;
  businessUserInfo!: any | null;
  submissions!: any;
  personalSubmissions: any[] = [];
  businessSubmissions: any[] = [];
  submissionScope: 'personal' | 'business' = 'personal';
  private hasUserPickedSubmissionScope: boolean = false;
  now: Date = new Date();
  month = (this.now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
  day = this.now.getDate().toString().padStart(2, '0'); // Get day and pad if needed
  year = this.now.getFullYear(); // Get full year
  todaysDate: string = this.month + "/" + this.day + "/" + this.year;
  todaysSubmissions!: number;
  totalSubmissions!: number;
  lastWeekSubmissions!: number;
  lastMonthSubmissions!: number;
  isBusinessUser: boolean = false;
  private isBusinessUserKnown: boolean = false;
  private personalSubmissionsLoadKey: string | null = null;
  private businessSubmissionsLoadKey: string | null = null;
  selectedTabIndex = 0;

  get showSubmissionScopeTabs(): boolean {
    return (this.personalSubmissions?.length ?? 0) > 0 && (this.businessSubmissions?.length ?? 0) > 0;
  }

  get noSubmissionsMessage(): string {
    return this.submissionScope === 'business'
      ? 'No business submissions yet.'
      : "No submissions yet, you're driving too well!";
  }

  get tabLabels(): string[] {
    return this.isBusinessUser
      ? [
          'Overview',
          'Trucks & Drivers',
          'QR Codes',
          'Daily Report Summary',
          'Business Settings',
          'Shipping Information',
        ]
      : ['Submissions', 'Account Overview', 'Shipping Information', 'Order History'];
  }

  submissionsDataSource = new MatTableDataSource<any>([]);
  personalSubmissionsDataSource = new MatTableDataSource<any>([]);
  businessSubmissionsDataSource = new MatTableDataSource<any>([]);
  submissionsColumnsToDisplay = ['name', 'dateSubmitted', 'reasonForContacting', 'expand'];
  submissionsColumnsToDisplayWithExpand = [...this.submissionsColumnsToDisplay, 'expandedDetail'];
  expandedElement: any | null;

  ordersDataSource = new MatTableDataSource<any>([]);
  ordersColumnsToDisplay = ['orderNum', 'status', 'dateOrdered'];
  
  constructor (
    private authService: AuthService, 
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef, 
    private dbService: MongoService,
    private router: Router
  ) 
  {
    this.accOverviewForm = this.fb.group({
      userID: [{ value: '', disabled: true }],
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }]
    });

    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.user = user;
        this._snackBar.open('Loading account information...');
        this.initializeAccountOverview();
        this.initializeBusinessUserInfo();
        this.initializeOrderHistory();
      }
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (this.submissionsDataSource) {
      this.submissionsDataSource.paginator = this.paginator;
    }
    this.cdr.detectChanges();
  }

  initializeAccountOverview() {
    if (this.user) {
      this.accOverviewForm.get('userID')?.setValue(this.user.uid);
      this.accOverviewForm.get('email')?.setValue(this.user.email);
      this.accOverviewForm.get('name')?.setValue(this.user.displayName);
    }
  }

  initializeBusinessUserInfo() {
    this.authService.isBusinessUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isBusiness) => {
        this.isBusinessUserKnown = isBusiness !== null;
        this.isBusinessUser = !!isBusiness;

        // If the available tabs change, ensure we stay in-range.
        if (this.selectedTabIndex >= this.tabLabels.length) {
          this.selectedTabIndex = 0;
        }

        this.initializeSubmissions();
      });
      
    this.authService.businessUserInfo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        console.log(info);
        this.businessUserInfo = info;

        this.initializeSubmissions();
      });
  }

  initializeSubmissions() {
    if (!this.user?.uid) return;

    // Personal submissions are always applicable (even for business users)
    this.loadPersonalSubmissions();

    // Business submissions are only applicable if this account is a business user AND has a businessId
    if (this.isBusinessUserKnown && this.isBusinessUser) {
      const businessId = this.businessUserInfo?.businessId ?? this.businessUserInfo?._id ?? null;
      if (businessId) {
        this.loadBusinessSubmissions(String(businessId));
      }
    }

    // Keep selection stable, but choose a sensible default on first load
    this.applyDefaultSubmissionScopeIfNeeded();
    this.updateActiveSubmissionsView();
  }

  onSubmissionScopeTabChange(event: MatTabChangeEvent): void {
    this.submissionScope = event.index === 0 ? 'personal' : 'business';
    this.hasUserPickedSubmissionScope = true;
    this.updateActiveSubmissionsView();
  }

  private applyDefaultSubmissionScopeIfNeeded(): void {
    // If current scope has no data but the other does, switch.
    const hasPersonal = (this.personalSubmissions?.length ?? 0) > 0;
    const hasBusiness = (this.businessSubmissions?.length ?? 0) > 0;

    if (this.submissionScope === 'business' && !hasBusiness && hasPersonal) {
      this.submissionScope = 'personal';
    } else if (this.submissionScope === 'personal' && !hasPersonal && hasBusiness) {
      this.submissionScope = 'business';
    }

    // For business users, default to business once if it exists
    if (!this.hasUserPickedSubmissionScope && this.isBusinessUser && hasBusiness) {
      this.submissionScope = 'business';
    }
  }

  private updateActiveSubmissionsView(): void {
    const active = this.submissionScope === 'business' ? this.businessSubmissions : this.personalSubmissions;

    this.submissions = active;
    this.submissionsDataSource = new MatTableDataSource(active);
    this.expandedElement = null;

    if (this.paginator) {
      this.submissionsDataSource.paginator = this.paginator;
      this.paginator.firstPage();
    }

    this.applySubmissionStats(active);
  }

  private applySubmissionStats(list: any[]): void {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    this.totalSubmissions = (list ?? []).length;
    this.todaysSubmissions = (list ?? []).filter((x: any) => {
      const date = this.parseDate(x?.dateSubmitted);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    }).length;

    this.lastWeekSubmissions = (list ?? []).filter((x: any) => {
      const date = this.parseDate(x?.dateSubmitted);
      date.setHours(0, 0, 0, 0);
      return date >= sevenDaysAgo && date <= now;
    }).length;

    this.lastMonthSubmissions = (list ?? []).filter((x: any) => {
      const date = this.parseDate(x?.dateSubmitted);
      date.setHours(0, 0, 0, 0);
      return date >= thirtyDaysAgo && date <= now;
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

  private loadPersonalSubmissions(): void {
    if (!this.user?.uid) return;
    const loadKey = `user:${this.user.uid}`;
    if (this.personalSubmissionsLoadKey === loadKey) return;
    this.personalSubmissionsLoadKey = loadKey;

    this.dbService.getUserSubmissions({ userId: this.user.uid }).subscribe({
      next: (response: any) => {
        this.personalSubmissions = this.sortSubmissions(response?.submissions ?? []);
        this.personalSubmissionsDataSource = new MatTableDataSource(this.personalSubmissions);
        this.applyDefaultSubmissionScopeIfNeeded();
        this.updateActiveSubmissionsView();
        this._snackBar.open('Account Information loaded!', 'Ok', { duration: 3000 });
      },
      error: (error) => {
        this.dbService
          .insertErrorLog(
            JSON.stringify({
              fileName: 'account-overview.component.ts',
              method: 'loadPersonalSubmissions()',
              timestamp: new Date().toString(),
              error,
            })
          )
          .subscribe();
      },
    });
  }

  private loadBusinessSubmissions(businessId: string): void {
    const loadKey = `business:${businessId}`;
    if (this.businessSubmissionsLoadKey === loadKey) return;
    this.businessSubmissionsLoadKey = loadKey;

    this.dbService.getUserSubmissions({ businessId }).subscribe({
      next: (response: any) => {
        this.businessSubmissions = this.sortSubmissions(response?.submissions ?? []);
        this.businessSubmissionsDataSource = new MatTableDataSource(this.businessSubmissions);
        this.applyDefaultSubmissionScopeIfNeeded();
        this.updateActiveSubmissionsView();
      },
      error: (error) => {
        this.dbService
          .insertErrorLog(
            JSON.stringify({
              fileName: 'account-overview.component.ts',
              method: 'loadBusinessSubmissions()',
              timestamp: new Date().toString(),
              error,
            })
          )
          .subscribe();
      },
    });
  }

  initializeOrderHistory() {
    if (!this.user?.uid) return;

    this.dbService.getUserOrderHistory(this.user.uid).subscribe({
      next: (response: any) => {
        const orders = response.orderHistory;
        this.ordersDataSource = new MatTableDataSource(orders);
      },
      error: (error) => {
        //console.error('Error getting order history: ', error);
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'account-overview.component.ts',
          method: 'initializeOrderHistory()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      }
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;
    this.selectedTabIndex = tabIndex;
  }

  toggleRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  parseDate(dateString: string | null | undefined): Date {
    if (!dateString) return new Date(NaN);

    // 1) ISO 8601 (e.g., 2026-02-11T21:05:33.012Z)
    const iso = new Date(dateString);
    if (!Number.isNaN(iso.getTime())) return iso;

    // 2) Legacy format: MM/DD/YYYY HH:mm:ss
    const dateTimeParts = String(dateString).split(' ');

    // If we don't have a time, just parse the date
    if (dateTimeParts.length !== 2) {
      const [month, day, year] = dateTimeParts[0].split('/').map(Number);
      return new Date(year, month - 1, day)
    }

    const [datePart, timePart] = dateTimeParts;
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
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
