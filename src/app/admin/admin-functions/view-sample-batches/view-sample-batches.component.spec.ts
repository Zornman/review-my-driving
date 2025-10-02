import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSampleBatchesComponent } from './view-sample-batches.component';

describe('ViewSampleBatchesComponent', () => {
  let component: ViewSampleBatchesComponent;
  let fixture: ComponentFixture<ViewSampleBatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSampleBatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSampleBatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
