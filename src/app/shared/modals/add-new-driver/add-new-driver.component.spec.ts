import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewDriverComponent } from './add-new-driver.component';

describe('AddNewDriverComponent', () => {
  let component: AddNewDriverComponent;
  let fixture: ComponentFixture<AddNewDriverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewDriverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
