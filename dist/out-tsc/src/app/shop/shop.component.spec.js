import { TestBed } from '@angular/core/testing';
import { ShopComponent } from './shop.component';
describe('ShopComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShopComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(ShopComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
