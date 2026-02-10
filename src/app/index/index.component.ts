import { Component, OnInit } from '@angular/core';
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
    MatExpansionModule
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

  user!: User | null;
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
      if (user) {
        this.initializeSubmissions();
      }
    });
  }

  ngOnInit(): void {
    // Additional initialization if needed
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

        this.submissions = response.submissions.sort((a: any, b: any) => {
          const dateA = this.parseDate(a.dateSubmitted);
          const dateB = this.parseDate(b.dateSubmitted);
  
          if (!dateA || !dateB) return 0;
  
          return dateB.getTime() - dateA.getTime();
        });

        this.submissions = this.submissions.slice(0, 10);

        this.submissionsDataSource = new MatTableDataSource(this.submissions);
        this.totalSubmissions = response.submissions.length;
        this.lastWeekSubmissions = response.submissions.filter((x: any) => {
          const date = this.parseDate(x.dateSubmitted);
          date.setHours(0, 0, 0, 0);
          return date >= sevenDaysAgo && date <= now;
        }).length;
      },
      error: (error) => {
        console.error('Error getting data:', error);
      }
    });
  }

  parseDate(dateString: string): Date {
    const dateTimeParts = dateString.split(' ');

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
}
