import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleNotRegisteredDialogComponent } from './sample-not-registered-dialog.component';

describe('SampleNotRegisteredDialogComponent', () => {
  let component: SampleNotRegisteredDialogComponent;
  let fixture: ComponentFixture<SampleNotRegisteredDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleNotRegisteredDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleNotRegisteredDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
