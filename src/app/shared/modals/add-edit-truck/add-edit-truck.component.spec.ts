import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditTruckComponent } from './add-edit-truck.component';

describe('AddEditTruckComponent', () => {
  let component: AddEditTruckComponent;
  let fixture: ComponentFixture<AddEditTruckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditTruckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditTruckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
