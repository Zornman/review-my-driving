import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLicenseInfoComponent } from './edit-license-info.component';

describe('EditLicenseInfoComponent', () => {
  let component: EditLicenseInfoComponent;
  let fixture: ComponentFixture<EditLicenseInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLicenseInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditLicenseInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
