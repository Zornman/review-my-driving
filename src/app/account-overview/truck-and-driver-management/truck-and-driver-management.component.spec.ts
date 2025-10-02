import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckAndDriverManagementComponent } from './truck-and-driver-management.component';

describe('TruckAndDriverManagementComponent', () => {
  let component: TruckAndDriverManagementComponent;
  let fixture: ComponentFixture<TruckAndDriverManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruckAndDriverManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckAndDriverManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
