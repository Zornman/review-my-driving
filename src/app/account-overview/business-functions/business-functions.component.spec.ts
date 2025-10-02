import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessFunctionsComponent } from './business-functions.component';

describe('BusinessFunctionsComponent', () => {
  let component: BusinessFunctionsComponent;
  let fixture: ComponentFixture<BusinessFunctionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessFunctionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessFunctionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
