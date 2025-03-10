import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
let IndexComponent = class IndexComponent {
    authService;
    dbService;
    user;
    submissions;
    now = new Date();
    month = (this.now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
    day = this.now.getDate().toString().padStart(2, '0'); // Get day and pad if needed
    year = this.now.getFullYear(); // Get full year
    todaysDate = this.month + "/" + this.day + "/" + this.year;
    totalSubmissions;
    lastWeekSubmissions;
    submissionsDataSource = new MatTableDataSource([]);
    submissionsColumnsToDisplay = ['name', 'dateSubmitted', 'reasonForContacting', 'expand'];
    submissionsColumnsToDisplayWithExpand = [...this.submissionsColumnsToDisplay, 'expandedDetail'];
    expandedElement;
    constructor(authService, dbService) {
        this.authService = authService;
        this.dbService = dbService;
        this.authService.getUser().subscribe((user) => {
            if (!user)
                return;
            this.user = user;
            this.initializeSubmissions();
        });
    }
    initializeSubmissions() {
        if (!this.user)
            return;
        this.dbService.getUserSubmissions(this.user?.uid).subscribe({
            next: (response) => {
                const now = new Date();
                const todaysDate = now;
                todaysDate.setHours(0, 0, 0, 0);
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);
                // Sort submissions by Date descending before setting table data source
                this.submissions = response.submissions.sort((a, b) => {
                    const dateA = this.parseDate(a.dateSubmitted);
                    const dateB = this.parseDate(b.dateSubmitted);
                    if (!dateA || !dateB)
                        return 0; // Ignore invalid dates
                    return dateB.getTime() - dateA.getTime(); // Sort in descending order (latest first)
                });
                this.submissions = this.submissions.slice(0, 5);
                this.submissionsDataSource = new MatTableDataSource(this.submissions);
                this.totalSubmissions = response.submissions.length;
                this.lastWeekSubmissions = response.submissions.filter((x) => {
                    const date = this.parseDate(x.dateSubmitted);
                    date.setHours(0, 0, 0, 0);
                    return date >= sevenDaysAgo && date <= now;
                }).length;
            },
            error: (error) => {
                console.error('Error getting data:', error);
                // this.dbService.insertErrorLog({
                //   fileName: 'account-overview.component.ts',
                //   method: 'initializeSubmissions()',
                //   timestamp: new Date().toString(),
                //   error: error.message
                // }).subscribe({
                //   next: (response: any) => {
                //       console.log(response);
                //   },
                //   error: (error: any) => {
                //   }
                // });
            }
        });
    }
    parseDate(dateString) {
        // Assumes the format is MM/DD/YYYY HH:mm:ss
        const dateTimeParts = dateString.split(' ');
        // If we don't have a time, just parse the date
        if (dateTimeParts.length !== 2) {
            const [month, day, year] = dateTimeParts[0].split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        const [datePart, timePart] = dateTimeParts;
        const [month, day, year] = datePart.split('/').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
    }
    toggleRow(row, event) {
        event.stopPropagation();
        this.expandedElement = this.expandedElement === row ? null : row;
    }
};
IndexComponent = __decorate([
    Component({
        selector: 'app-index',
        imports: [
            CommonModule,
            MatCardModule,
            MatButtonModule,
            MatTableModule,
            MatIconModule,
            RouterModule,
            MatExpansionModule
        ],
        templateUrl: './index.component.html',
        styleUrl: './index.component.scss',
        animations: [
            trigger('detailExpand', [
                state('collapsed,void', style({ height: '0px', minHeight: '0' })),
                state('expanded', style({ height: '*' })),
                transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
            ])
        ],
    })
], IndexComponent);
export { IndexComponent };
