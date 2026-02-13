import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageQrCodesComponent } from './manage-qr-codes.component';

describe('ManageQrCodesComponent', () => {
  let component: ManageQrCodesComponent;
  let fixture: ComponentFixture<ManageQrCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageQrCodesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageQrCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
