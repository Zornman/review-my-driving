import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportsSummaryComponent } from './daily-reports-summary.component';

describe('DailyReportsSummaryComponent', () => {
  let component: DailyReportsSummaryComponent;
  let fixture: ComponentFixture<DailyReportsSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportsSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
