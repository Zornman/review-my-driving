import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { COUNTRIES } from '../shared/classes/countries';
import { US_STATES } from '../shared/classes/states';

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
    MatPaginatorModule
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  accOverviewForm!: FormGroup;
  shippingInfoForm!: FormGroup;
  user!: User | null;
  submissions!: any;
  now: Date = new Date();
  month = (this.now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
  day = this.now.getDate().toString().padStart(2, '0'); // Get day and pad if needed
  year = this.now.getFullYear(); // Get full year
  todaysDate: string = this.month + "/" + this.day + "/" + this.year;
  todaysSubmissions!: number;
  totalSubmissions!: number;
  lastWeekSubmissions!: number;
  lastMonthSubmissions!: number;

  countries = COUNTRIES;
  states = US_STATES;

  submissionsDataSource = new MatTableDataSource<any>([]);
  submissionsColumnsToDisplay = ['name', 'dateSubmitted', 'reasonForContacting', 'expand'];
  submissionsColumnsToDisplayWithExpand = [...this.submissionsColumnsToDisplay, 'expandedDetail'];
  expandedElement: any | null;

  ordersDataSource = new MatTableDataSource<any>([]);
  ordersColumnsToDisplay = ['orderNum', 'dateOrdered'];
  
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

    this.shippingInfoForm = this.fb.group({
      userID: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      address1: ['', Validators.required],
      address2: [''], // Optional field
      country: ['', Validators.required],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      region: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]], // State/Province
      zip: ['', [Validators.required, Validators.pattern(/^\d+$/)]], // Only numbers
    });

    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.user = user;
        this.initializeAccountOverview();
        this.initializeSubmissions();
        this.loadShippingInfo(this.user.uid);
        this.initializeOrderHistory();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  initializeAccountOverview() {
    if (this.user) {
      console.log(this.user);
      this.accOverviewForm.get('userID')?.setValue(this.user.uid);
      this.accOverviewForm.get('email')?.setValue(this.user.email);
      this.accOverviewForm.get('name')?.setValue(this.user.displayName);
    }
  }

  saveShippingInfo() {
    if (!this.shippingInfoForm.valid) return;

    if (!this.user) {
      this._snackBar.open('user not found.', 'Ok', { duration: 3000 })
      return;
    }
    this._snackBar.open('Saving shipping information...');

    this.shippingInfoForm.get('userID')?.setValue(this.user?.uid);

    this.dbService.insertUserShippingInfo(this.shippingInfoForm.value).subscribe({
      next: (response: any) => {
        this._snackBar.open('Saved shipping information!', 'Ok', { duration: 3000 });
        //console.log(response);
      },
      error: (error) => {
        this._snackBar.open('Error saving shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog({
          fileName: 'account-overview.component.ts',
          method: 'saveShippingInfo()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      },
    });

    this._snackBar.dismiss();
  }

  loadShippingInfo(token: string) {
    this.dbService.getUserShippingInfo(token).subscribe({
      next: (response: any) => {
        if (response.result) {
          this.shippingInfoForm.get('userID')?.setValue(token);
          this.shippingInfoForm.get('firstName')?.setValue(response.result.firstName);
          this.shippingInfoForm.get('lastName')?.setValue(response.result.lastName);
          this.shippingInfoForm.get('address1')?.setValue(response.result.address1);
          this.shippingInfoForm.get('address2')?.setValue(response.result.address2);
          this.shippingInfoForm.get('city')?.setValue(response.result.city);
          this.shippingInfoForm.get('zip')?.setValue(response.result.zip);
          this.shippingInfoForm.get('region')?.setValue(response.result.region);
          this.shippingInfoForm.get('country')?.setValue(response.result.country);
          this.shippingInfoForm.get('email')?.setValue(response.result.email);
          this.shippingInfoForm.get('phone')?.setValue(response.result.phone);
        } else {
        }
      },
      error: (error) => {
        this._snackBar.open('Error loading shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog({
          fileName: 'account-overview.component.ts',
          method: 'loadShippingInfo()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      }
    });
  }

  initializeSubmissions() {
    if (!this.user) return;
    this.dbService.getUserSubmissions(this.user?.uid).subscribe({
      next: (response: any) => {
        const now = new Date();
        const todaysDate = now;
        todaysDate.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Sort submissions by Date descending before setting table data source
        this.submissions = response.submissions.sort((a: any, b: any) => {
          const dateA = this.parseDate(a.dateSubmitted);
          const dateB = this.parseDate(b.dateSubmitted);
  
          if (!dateA || !dateB) return 0; // Ignore invalid dates
  
          return dateB.getTime() - dateA.getTime(); // Sort in descending order (latest first)
        });
        this.submissionsDataSource = new MatTableDataSource(this.submissions);
        this.submissionsDataSource.paginator = this.paginator;
        //console.log(this.submissions);
        this.totalSubmissions = response.submissions.length;
        this.todaysSubmissions = response.submissions.filter((x: any) => {
          const date = this.parseDate(x.dateSubmitted);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === todaysDate.getTime()
        }).length;
        this.lastWeekSubmissions = response.submissions.filter((x: any) => this.parseDate(x.dateSubmitted) >= sevenDaysAgo && this.parseDate(x.dateSubmitted) <= now).length;
        this.lastMonthSubmissions = response.submissions.filter((x: any) => this.parseDate(x.dateSubmitted) >= thirtyDaysAgo && this.parseDate(x.dateSubmitted) <= now).length;
      },
      error: (error) => {
        //console.error('Error getting data:', error);
        this.dbService.insertErrorLog({
          fileName: 'account-overview.component.ts',
          method: 'initializeSubmissions()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      }
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
        this.dbService.insertErrorLog({
          fileName: 'account-overview.component.ts',
          method: 'initializeOrderHistory()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
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
  }

  toggleRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  parseDate(dateString: string): Date {
    // Assumes the format is MM/DD/YYYY HH:mm:ss
    const dateTimeParts = dateString.split(' ');

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
}
