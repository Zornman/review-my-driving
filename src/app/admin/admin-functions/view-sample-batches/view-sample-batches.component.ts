import { Component, OnInit } from '@angular/core';
import { MongoService } from '../../../services/mongo.service';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { Chart, CategoryScale, LinearScale, BarController, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';

// Register all required components
Chart.register(
  CategoryScale,  // X-axis
  LinearScale,    // Y-axis
  BarController,  // "bar" chart type
  BarElement,     // draws the bars
  Title, Tooltip, Legend
);

@Component({
  selector: 'app-view-sample-batches',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    BaseChartDirective
  ],
  templateUrl: './view-sample-batches.component.html',
  styleUrl: './view-sample-batches.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ],
})
export class ViewSampleBatchesComponent implements OnInit {
  batches: any[] = [];

  // Chart.js data
  barChartLabels: string[] = [];
  barChartData: any[] = [];
  barChartOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    }
  };

  batchesDataSource = new MatTableDataSource<any>([]);
  batchColumnsToDisplay = ['batchNumber', 'claimedCount', 'unclaimedCount', 'totalSample', 'percentClaimed', 'expand'];
  bhColumnsToDisplayWithExpand = [...this.batchColumnsToDisplay, 'expandedDetail'];
  expandedElement: any | null;

  constructor(
    private mongoService: MongoService
  ) {}

  ngOnInit(): void {
    this.mongoService.getSampleBatches().subscribe({
      next: (data) => {
        this.batches = data.sample_batch || []; // Adjust based on the actual response structure
        this.prepareChartData();
        this.batchesDataSource.data = this.batches;
      },
      error: (error) => {
        console.error('Error fetching sample batches:', error);
      }
    });
  }

  toggleRow(row: any, event: Event): void {
    event.stopPropagation();
    this.expandedElement = this.expandedElement === row ? null : row;
  }

  private prepareChartData() {
    // Labels are batch numbers or campaign IDs
    this.barChartLabels = this.batches.map(b => b.batchNumber);

    // Datasets: Claimed and Unclaimed counts
    this.barChartData = [
      {
        label: 'Claimed',
        data: this.batches.map(b => b.claimedCount),
        backgroundColor: 'rgba(75,192,192,0.6)'
      },
      {
        label: 'Unclaimed',
        data: this.batches.map(b => b.unclaimedCount),
        backgroundColor: 'rgba(255,99,132,0.6)'
      }
    ];
  }
}
