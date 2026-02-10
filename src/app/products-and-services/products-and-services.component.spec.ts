import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsAndServicesComponent } from './products-and-services.component';

describe('ProductsAndServicesComponent', () => {
  let component: ProductsAndServicesComponent;
  let fixture: ComponentFixture<ProductsAndServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsAndServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsAndServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
